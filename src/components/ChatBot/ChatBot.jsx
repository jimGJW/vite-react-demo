/**
 * ChatBot —— 完整对话容器
 * ===============================================================
 * 用法：
 *   // 1) 演示模式（内置模拟后端，开箱即用）
 *   <ChatBot title="AI 助手" />
 *
 *   // 2) 接入真实后端（注入自己的请求封装）
 *   import { createHttpApi } from './ChatBot/api.js'
 *   const api = createHttpApi({ baseURL: '/gateway', getToken: () => token })
 *   <ChatBot api={api} title="AI 助手" userId={uid} />
 *
 *   // 3) 只要逻辑，自己写 UI
 *   const chat = useMessage({ api })
 *
 * ── 渲染性能 ─────────────────────────────────────────────────────
 * 本组件持有 rounds 状态，流式生成时每帧都会重渲染。
 * 为了让重渲染只落在「正在生成的那一条气泡」上：
 *   · Conversation / LeftMessage / AnswerWidget 都是 React.memo；
 *   · 上下文按变化频率拆成 ChatProvider（低频）与 ChatStatusProvider（高频）；
 *   · 传给气泡的回调一律用 useCallback 固定引用。
 * 新增 props 时请保持同样纪律，否则 memo 会失效。
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { Alert, Button, Input, Space, Tooltip, Typography, message as antdMessage } from 'antd'
import {
  ClearOutlined,
  HistoryOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { ChatProvider, ChatStatusProvider } from './ChatContext.jsx'
import Conversation from './Message.jsx'
import HistoryList from './HistoryList.jsx'
import useMessage from './useMessage.js'
import { createMockApi } from './mockBackend.js'
import { DEFAULT_PLACEHOLDER, DEFAULT_RECOMMEND } from './config.js'
import './ChatBot.scss'

const { Text } = Typography

export default function ChatBot({
  api,
  title = 'AI 助手',
  subtitle = '流式对话 · 卡片渲染 · 历史会话',
  userId,
  head,
  perm,
  placeholder = DEFAULT_PLACEHOLDER,
  recommend,
  height = 640,
  className = '',
  /** 是否显示气泡下方工具栏（复制 / 重新生成 / 赞踩） */
  toolBox = true,
  /** 输入框最大字数 */
  maxLength,
  /** 初始轮次（外部已有上下文时直接注入） */
  initialRounds,
  /** 一轮回答结束（收到 stop 帧）时回调 */
  onFinish,
  onError,
}) {
  // 未注入 api 时默认使用本地模拟后端，保证开箱即可演示。
  // 依赖数组留空：client 会被放进 Context，引用一旦变化就会让全部气泡重渲染。
  const mockClient = useMemo(() => createMockApi(), [])
  const client = api ?? mockClient

  const contDom = useRef(null)
  const chat = useMessage({ api: client, userId, perm, onError, onFinish, initialRounds, contDom })

  const {
    conversationData: rounds,
    statusLine,
    busy,
    errorText,
    recommend: liveRecommend,
    sessionId,
    shareState,
    updateMessageState,
    postMessage,
    stopFetch,
    creatNewChat,
    reloadConversation,
    clearScreen,
    clearError,
    history,
    historyPage,
    historyTotal,
    historyLoading,
    loadHistory,
    loadDetail,
    deleteHistory,
    clearHistory,
  } = chat

  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const showWelcome = rounds.length === 0
  const lastRoundIndex = rounds.length - 1

  const send = useCallback(() => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    postMessage(text)
  }, [input, busy, postMessage])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const onAsk = useCallback(
    (text) => {
      if (text) postMessage(String(text))
    },
    [postMessage],
  )

  /* 引用稳定的回调：否则所有历史气泡的 memo 都会失效 */
  const reloadLast = useCallback(() => reloadConversation({}), [reloadConversation])

  /** 打开历史抽屉时惰性拉取列表 */
  const openHistory = useCallback(() => {
    setHistoryOpen(true)
    if (!history.length) {
      loadHistory(0).catch(() => antdMessage.error('历史会话加载失败，请稍后重试'))
    }
  }, [history.length, loadHistory])

  const onLoadMore = useCallback(
    () => loadHistory(historyPage + 1, { append: true }).catch(() => antdMessage.error('加载更多失败')),
    [loadHistory, historyPage],
  )

  const onSelectHistory = useCallback(
    (id) => {
      loadDetail(id).catch(() => antdMessage.error('会话详情加载失败'))
      setHistoryOpen(false)
    },
    [loadDetail],
  )

  const onNewChat = useCallback(() => {
    creatNewChat()
    setHistoryOpen(false)
  }, [creatNewChat])

  /* 低频上下文：只在开关 / 回调 / 分享态变化时更新 */
  const ctxValue = useMemo(
    () => ({ toolBox, head, shareState, updateMessageState, api: client, onAsk }),
    [toolBox, head, shareState, updateMessageState, client, onAsk],
  )

  /* 高频上下文：只被「等待中的气泡」消费 */
  const statusValue = useMemo(() => ({ loading: busy, statusLine }), [busy, statusLine])

  const recommends = liveRecommend.length ? liveRecommend : showWelcome ? recommend ?? DEFAULT_RECOMMEND : []

  return (
    <ChatProvider value={ctxValue}>
      <ChatStatusProvider value={statusValue}>
        <div className={`cb-root ${className}`} style={{ height }}>
          {/* 头部 */}
          <div className="cb-header">
            <div className="cb-header__title">
              <ThunderboltOutlined className="cb-header__logo" />
              <div>
                <div className="cb-header__main">{title}</div>
                {subtitle ? <div className="cb-header__sub">{subtitle}</div> : null}
              </div>
            </div>
            <Space size={2}>
              <Tooltip title="新对话">
                <Button type="text" aria-label="新对话" icon={<PlusOutlined />} onClick={creatNewChat} />
              </Tooltip>
              <Tooltip title="历史会话">
                <Button
                  type="text"
                  aria-label="历史会话"
                  icon={<HistoryOutlined />}
                  onClick={openHistory}
                />
              </Tooltip>
              {rounds.length > 0 && (
                <Tooltip title="清空当前对话">
                  <Button
                    type="text"
                    aria-label="清空当前对话"
                    icon={<ClearOutlined />}
                    onClick={clearScreen}
                  />
                </Tooltip>
              )}
            </Space>
          </div>

          {/* 消息区（唯一滚动容器） */}
          <div className="cb-body" ref={contDom}>
            {showWelcome ? (
              <div className="cb-welcome">
                <RobotOutlined className="cb-welcome__icon" />
                <div className="cb-welcome__title">你好，我是{title}</div>
                <div className="cb-welcome__desc">
                  支持流式回答、Markdown、表格 / 图表 / 列表卡片、历史会话与赞踩反馈。试试下面这些问题：
                </div>
              </div>
            ) : (
              rounds.map((round, i) => (
                <Conversation
                  key={round.sessionDetailId || `round-${i}`}
                  data={round}
                  isLast={i === lastRoundIndex}
                  onReload={i === lastRoundIndex ? reloadLast : undefined}
                />
              ))
            )}
          </div>

          {/* 错误提示 */}
          {errorText ? (
            <Alert
              className="cb-alert"
              type="error"
              showIcon
              message={errorText}
              closable
              onClose={clearError}
            />
          ) : null}

          {/* 推荐问题 */}
          {recommends.length > 0 && (
            <div className="cb-recommend">
              {recommends.map((q, i) => (
                <button
                  type="button"
                  key={`${q}-${i}`}
                  className="cb-recommend__chip"
                  onClick={() => postMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 输入区 */}
          <div className="cb-input">
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              autoSize={{ minRows: 1, maxRows: 5 }}
              maxLength={maxLength}
              className="cb-input__area"
            />
            {busy ? (
              <Button type="primary" danger icon={<StopOutlined />} onClick={stopFetch}>
                停止
              </Button>
            ) : (
              <Button type="primary" icon={<SendOutlined />} onClick={send} disabled={!input.trim()}>
                发送
              </Button>
            )}
          </div>

          <Text type="secondary" className="cb-foot">
            Enter 发送 · Shift+Enter 换行
          </Text>

          <HistoryList
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            history={history}
            historyTotal={historyTotal}
            loading={historyLoading}
            currentSessionId={sessionId}
            onLoadMore={onLoadMore}
            onSelect={onSelectHistory}
            onDelete={deleteHistory}
            onClear={clearHistory}
            onNewChat={onNewChat}
          />
        </div>
      </ChatStatusProvider>
    </ChatProvider>
  )
}
