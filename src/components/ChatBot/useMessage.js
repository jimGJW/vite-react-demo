/**
 * useMessage —— ChatBot 状态机（Bubble 层以下的所有逻辑）
 * ===============================================================
 * 职责：
 *   - 维护 conversationData（按「轮」组织：一轮 = 1 条提问 + 1 条回答）
 *   - 消费流式帧，按 chatStream.js 的三条规则累积 / 收口正文
 *   - 状态条（工具调用进度）、推荐问题、停止生成、重新生成
 *   - 历史会话的列表 / 详情 / 删除
 *   - 赞踩、分享多选
 *
 * 解耦：所有外部依赖（请求封装 api / 权限 perm / 用户信息 userId）均由入参注入，
 *       组件内部不 import 任何业务侧模块。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  classifyFrame,
  resolveErrorMessage,
  resolveMessageBody,
  shouldAccumulateStreamText,
  shouldClearStatusForText,
  NEW_CHAT_MARK,
} from './chatStream.js'
import { useAutoScroll } from './useAutoScroll.js'

/** 一条助手消息的初始形态 */
function blankAssistant() {
  return {
    type: 1,
    message: '',
    contentType: null,
    title: null,
    taskIds: [],
    messageState: '',
    sessionDetailId: '',
  }
}

/** 服务端历史记录 → 轮次结构 */
export function recordsToRounds(records = []) {
  if (!Array.isArray(records)) return []

  // 形态一：扁平消息（{ type: 0|1, message }）—— 按 0/1 配对分组
  if (records.length && records.every((r) => r && typeof r === 'object' && 'type' in r)) {
    const rounds = []
    let current = null
    records.forEach((m) => {
      if (m.type === 0 || !current) {
        current = { sessionDetailId: m.sessionDetailId || '', sessionId: m.sessionId, conversation: [] }
        rounds.push(current)
      }
      current.conversation.push(
        m.type === 0
          ? { type: 0, message: m.message ?? '' }
          : { ...blankAssistant(), ...m },
      )
    })
    return rounds
  }

  // 形态二：Q/A 记录
  return records.map((rec, i) => ({
    sessionDetailId: rec.sessionDetailId || `detail-${i}`,
    sessionId: rec.sessionId,
    conversation: [
      { type: 0, message: rec.question ?? '' },
      {
        ...blankAssistant(),
        message: rec.answer ?? '',
        contentType: rec.contentType ?? null,
        title: rec.title ?? null,
        taskIds: rec.taskIds ?? [],
        messageState: rec.messageState ?? '',
        sessionDetailId: rec.sessionDetailId || `detail-${i}`,
      },
    ],
  }))
}

/**
 * @param {object} options
 * @param {object} options.api        createHttpApi / createMockApi 的产物（必传）
 * @param {string} [options.userId]
 * @param {object} [options.perm]     权限：{ canChat(): boolean, onDenied?(): void }
 * @param {(msg:string, raw:any)=>void} [options.onError]  错误上报
 * @param {(result:object)=>void} [options.onFinish]       一轮回答结束（stop 帧）时回调
 * @param {Array} [options.initialRounds] 初始轮次（外部已有上下文时直接注入）
 * @param {{current:HTMLElement|null}} [options.contDom] 滚动容器 ref
 */
export function useMessage({
  api,
  userId,
  perm,
  onError,
  onFinish,
  initialRounds,
  contDom: externalContDom,
} = {}) {
  const [rounds, setRounds] = useState(() => (Array.isArray(initialRounds) ? initialRounds : []))
  const [statusLine, setStatusLine] = useState('')
  const [fetchState, setFetchState] = useState('idle') // idle | loading | streaming
  const [recommend, setRecommend] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [shareState, setShareState] = useState(false)
  const [chatIdArray, setChatIdArrayState] = useState([])
  const [errorText, setErrorText] = useState('')

  const [history, setHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(0)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)

  const roundsRef = useRef(rounds)
  const sessionIdRef = useRef(sessionId)
  const prevSessionIdRef = useRef(null)
  const abortRef = useRef(null)
  const seqRef = useRef(0)
  const innerContDom = useRef(null)
  /* 优先使用外部传入的 ref（避免把 ref 混进 hook 返回对象，便于 React Compiler 静态分析） */
  const contDom = externalContDom || innerContDom

  /* 回调收进 ref：调用方即使传内联函数，也不会让 postMessage 每次换引用，
     从而保住下游 useContext / React.memo 的稳定性（流式期间不整屏重渲染） */
  const permRef = useRef(perm)
  const onErrorRef = useRef(onError)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    permRef.current = perm
    onErrorRef.current = onError
    onFinishRef.current = onFinish
  }, [perm, onError, onFinish])

  useEffect(() => { roundsRef.current = rounds }, [rounds])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  /* ------------------------------------------------------------ 结构更新 */

  const patchAssistant = useCallback((roundIdx, patch) => {
    setRounds((prev) =>
      prev.map((round, i) => {
        if (i !== roundIdx) return round
        const conversation = [...round.conversation]
        const last = conversation.length - 1
        if (last < 0 || conversation[last].type !== 1) return round
        const next = typeof patch === 'function' ? patch(conversation[last]) : patch
        conversation[last] = { ...conversation[last], ...next }
        return { ...round, conversation }
      }),
    )
  }, [])

  const appendAssistant = useCallback((roundIdx) => {
    setRounds((prev) =>
      prev.map((round, i) =>
        i === roundIdx ? { ...round, conversation: [...round.conversation, blankAssistant()] } : round,
      ),
    )
  }, [])

  /* 智能吸底：仅在用户停留底部时跟随新内容，向上翻看历史时不再被拽回 */
  const { scrollToBottom, pinToBottom } = useAutoScroll(contDom, rounds)

  /* ------------------------------------------------------------ 发消息 */

  const postMessage = useCallback(
    async (rawQuestion, options = {}) => {
      const { regenerate = false, sessionDetailId = '', continuedId = '' } = options
      const question = String(rawQuestion ?? '').trim()
      if (!question && !regenerate) return
      const gate = permRef.current
      if (gate?.canChat && !gate.canChat()) {
        gate.onDenied?.()
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const seq = ++seqRef.current

      const list = roundsRef.current
      let roundIdx
      let actualQuestion = question

      if (regenerate) {
        roundIdx = list.length - 1
        if (roundIdx < 0) return
        const round = list[roundIdx]
        actualQuestion = round?.conversation?.find((m) => m.type === 0)?.message ?? ''
        setRounds((prev) =>
          prev.map((r, i) =>
            i === roundIdx ? { ...r, conversation: r.conversation.filter((m) => m.type === 0) } : r,
          ),
        )
      } else {
        roundIdx = list.length
        setRounds((prev) => [
          ...prev,
          {
            sessionDetailId,
            sessionId: sessionIdRef.current ?? undefined,
            conversation: [{ type: 0, message: question }],
          },
        ])
      }

      appendAssistant(roundIdx)
      pinToBottom('smooth')
      setFetchState('loading')
      setStatusLine('')
      setRecommend([])
      setErrorText('')

      let streamed = ''
      const patch = (p) => patchAssistant(roundIdx, p)

      try {
        await api.sendChat(
          {
            question: actualQuestion,
            sessionId: sessionIdRef.current ?? null,
            continuedId,
            regenerate,
            sessionDetailId,
          },
          {
            signal: controller.signal,
            onFrame: (frame) => {
              if (seq !== seqRef.current) return
              const c = classifyFrame(frame)

              if (c.kind === 'status') {
                if (c.state === 'body-reset') {
                  streamed = ''
                  patch({ message: '' })
                }
                if (c.message) setStatusLine(c.message)
                else if (c.state === 'body-reset') setStatusLine('')
                return
              }

              if (c.kind === 'error') {
                const msg = resolveErrorMessage(c.code)
                setStatusLine('')
                setErrorText(msg)
                onErrorRef.current?.(msg, c.code)
                return
              }

              if (c.kind !== 'content') return

              if (frame.sessionId) setSessionId(frame.sessionId)
              if (Array.isArray(frame.recommend) && frame.recommend.length) setRecommend(frame.recommend)
              if (shouldClearStatusForText(c.delta, c.finishReason)) setStatusLine('')

              if (shouldAccumulateStreamText(c.delta, c.finishReason)) {
                streamed += c.delta.content
                setFetchState('streaming')
                patch({ message: streamed })
                return
              }

              if (c.finishReason === 'stop') {
                const body = resolveMessageBody({
                  delta: c.delta,
                  finishReason: c.finishReason,
                  streamedText: streamed,
                })
                const contentType = c.delta?.contentType ?? null
                const detailId = frame.sessionDetailId || sessionDetailId
                patch({
                  message: body ?? '',
                  contentType,
                  title: c.delta?.title ?? null,
                  taskIds: c.delta?.taskIds ?? [],
                  sessionDetailId: detailId,
                })
                setStatusLine('')
                setFetchState('idle')
                onFinishRef.current?.({
                  question: actualQuestion,
                  answer: body ?? '',
                  contentType,
                  sessionId: frame.sessionId || sessionIdRef.current,
                  sessionDetailId: detailId,
                })
              }
            },
          },
        )
      } catch (err) {
        if (err?.name !== 'AbortError') {
          const msg = err?.name === 'TimeoutError' ? '请求超时，请稍后重试' : '请求失败，请稍后重试'
          setErrorText(msg)
          onErrorRef.current?.(msg, err)
          patch((m) => (m.message ? {} : { message: streamed || '（回答中断，请重试）' }))
        }
      } finally {
        if (seq === seqRef.current) {
          setFetchState('idle')
          setStatusLine('')
        }
      }
    },
    [api, appendAssistant, patchAssistant, pinToBottom],
  )

  /* ------------------------------------------------------------ 停止 / 重生成 */

  const stopFetch = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = null
    seqRef.current += 1
    setFetchState('idle')
    setStatusLine('')
    try {
      await api?.post?.(api.endpoints.stopGenerating, {})
    } catch {
      /* 停止接口失败不影响本地中断 */
    }
  }, [api])

  const reloadConversation = useCallback(
    (payload = {}) => postMessage(payload.question ?? '', { regenerate: true, ...payload }),
    [postMessage],
  )

  /* ------------------------------------------------------------ 新对话 */

  const creatNewChat = useCallback(() => {
    const list = roundsRef.current
    const last = list[list.length - 1]

    // 再次点击 → 撤销分隔条并恢复原上下文
    if (last && last.sessionDetailId === NEW_CHAT_MARK && !last.conversation.length) {
      setRounds((prev) => prev.slice(0, -1))
      setSessionId(prevSessionIdRef.current)
      return
    }

    prevSessionIdRef.current = sessionIdRef.current
    setRounds((prev) => [...prev, { sessionDetailId: NEW_CHAT_MARK, conversation: [] }])
    setSessionId(null)
    setRecommend([])
    setStatusLine('')
  }, [])

  /* ------------------------------------------------------------ 赞踩 */

  const updateMessageState = useCallback(
    async (detailId, state) => {
      setRounds((prev) =>
        prev.map((round) => ({
          ...round,
          conversation: round.conversation.map((m) =>
            m.type === 1 && (m.sessionDetailId === detailId || (!m.sessionDetailId && !detailId))
              ? { ...m, messageState: state }
              : m,
          ),
        })),
      )
      try {
        await api?.post?.(api.endpoints.commentStatus, {
          messageState: state,
          sessionDetailId: detailId,
          comments: '',
        })
      } catch {
        /* 忽略 */
      }
    },
    [api],
  )

  /* ------------------------------------------------------------ 分享多选 */

  const setChatIdArray = useCallback(async (type, id) => {
    setChatIdArrayState((prev) =>
      type === 'add' ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id),
    )
    return true
  }, [])

  /* ------------------------------------------------------------ 历史会话 */

  const loadHistory = useCallback(
    async (page = 0, { append = false } = {}) => {
      setHistoryLoading(true)
      try {
        const res = await api.get(api.endpoints.historyList, { page })
        const list = res?.data ?? []
        setHistory((prev) => (append ? [...prev, ...list] : list))
        setHistoryPage(page)
        setHistoryTotal(res?.pagetotal ?? 0)
        return list
      } finally {
        setHistoryLoading(false)
      }
    },
    [api],
  )

  const loadDetail = useCallback(
    async (targetSessionId) => {
      setFetchState('loading')
      try {
        const res = await api.get(api.endpoints.detailList, { sessionId: targetSessionId, page: 0 })
        setRounds(recordsToRounds(res?.data ?? []))
        setSessionId(targetSessionId)
        setStatusLine('')
        setRecommend([])
      } finally {
        setFetchState('idle')
      }
    },
    [api],
  )

  const deleteHistory = useCallback(
    async (targetSessionId) => {
      await api.del(api.endpoints.deleteHistory, { sessionId: targetSessionId })
      setHistory((prev) => prev.filter((s) => s.sessionId !== targetSessionId))
      setHistoryTotal((t) => Math.max(0, t - 1))
    },
    [api],
  )

  const clearHistory = useCallback(async () => {
    const all = [...history]
    await Promise.all(all.map((s) => deleteHistory(s.sessionId).catch(() => {})))
    setHistory([])
    setHistoryTotal(0)
  }, [history, deleteHistory])

  /* ------------------------------------------------------------ 初始化 */

  useEffect(() => () => abortRef.current?.abort(), [])

  /** 清空当前屏幕（不删除服务端历史） */
  const clearScreen = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    seqRef.current += 1
    setRounds([])
    setRecommend([])
    setStatusLine('')
    setFetchState('idle')
    setErrorText('')
  }, [])

  const clearError = useCallback(() => setErrorText(''), [])

  const busy = fetchState !== 'idle'

  return useMemo(
    () => ({
      userId,
      conversationData: rounds,
      statusLine,
      fetchState,
      busy,
      errorText,
      recommend,
      sessionId,
      postMessage,
      stopFetch,
      creatNewChat,
      reloadConversation,
      updateMessageState,
      shareState,
      setShareState,
      chatIdArray,
      setChatIdArray,
      history,
      historyPage,
      historyTotal,
      historyLoading,
      loadHistory,
      loadDetail,
      deleteHistory,
      clearHistory,
      clearScreen,
      clearError,
      scrollToBottom,
      pinToBottom,
    }),
    [
      userId, rounds, statusLine, fetchState, busy, errorText, recommend, sessionId,
      postMessage, stopFetch, creatNewChat, reloadConversation,
      updateMessageState, shareState, chatIdArray, setChatIdArray,
      history, historyPage, historyTotal, historyLoading, loadHistory, loadDetail,
      deleteHistory, clearHistory, clearScreen, clearError,
      scrollToBottom, pinToBottom,
    ],
  )
}

export default useMessage
