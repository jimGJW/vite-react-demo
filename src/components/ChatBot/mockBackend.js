/**
 * ChatBot 本地模拟后端（用于离线演示 / 联调前的占位）
 * ===============================================================
 * 与 createHttpApi 保持完全相同的方法签名，因此可无缝替换：
 *   api.sendChat / api.get / api.post / api.del
 *
 * 它会真实地按「状态帧 → 内容帧 → stop 帧」的顺序吐帧，
 * 完整走一遍 chatStream.js 的三条累积规则，方便验证流式与卡片渲染。
 */

import { DEFAULT_ENDPOINTS } from './config.js'
import { NEW_CHAT_MARK } from './chatStream.js'

function abortError() {
  const err = new Error('aborted')
  err.name = 'AbortError'
  return err
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort)
  })
}

const uid = (p = 's') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** 拆掉 path 上的 query，与显式 params 合并（两种调用姿势都兼容） */
function splitPath(rawPath, params = {}) {
  const [path, qs] = String(rawPath ?? '').split('?')
  if (!qs) return { path, params }
  return { path, params: { ...Object.fromEntries(new URLSearchParams(qs)), ...params } }
}

/** 轮询模拟用的临时集合 */
const polled = new Set()

/* ---------------------------------------------------------------- 样本数据 */

const MARKDOWN_ANSWER = `### 结论概览

当前数据整体平稳，**无需人工干预**。关键观察如下：

1. 最近 7 天各项指标均在正常区间内波动
2. 峰值出现在第 4 天，随后回落
3. 未发现持续越界

| 指标 | 均值 | 峰值 | 状态 |
| --- | --- | --- | --- |
| 温度 | 24.6 ℃ | 27.1 ℃ | 正常 |
| 湿度 | 52 % | 61 % | 正常 |
| 压力 | 101.2 kPa | 103.4 kPa | 正常 |

> 提示：可继续追问「用表格展示明细」或「画一张趋势图」，我会切换成对应的卡片视图。

\`\`\`text
巡检建议：每日 09:00 / 18:00 各采样一次
\`\`\`
`

function tableRows(n = 8) {
  const base = Date.now() - n * 3600_000
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(base + i * 3600_000)
    return {
      time: `${String(t.getHours()).padStart(2, '0')}:00`,
      temperature: +(22 + Math.sin(i / 1.6) * 3.2 + Math.random()).toFixed(1),
      humidity: +(48 + Math.cos(i / 2.1) * 8 + Math.random() * 2).toFixed(1),
      pressure: +(100.5 + Math.sin(i / 2.4) * 1.8).toFixed(2),
    }
  })
}

function chartSeries(n = 24) {
  const base = Date.now() - n * 3600_000
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(base + i * 3600_000)
    const label = `${String(t.getHours()).padStart(2, '0')}:00`
    return [label, +(23 + Math.sin(i / 2) * 3 + Math.random() * 0.6).toFixed(2)]
  })
}

const LIST_ITEMS = [
  { id: 'R-1001', name: '一号采集点', type: '在线', location: 'A 区 · 3 层', note: '最近同步 2 分钟前' },
  { id: 'R-1002', name: '二号采集点', type: '在线', location: 'A 区 · 5 层', note: '最近同步 5 分钟前' },
  { id: 'R-1003', name: '三号采集点', type: '离线', location: 'B 区 · 1 层', note: '离线 2 小时' },
  { id: 'R-1004', name: '四号采集点', type: '在线', location: 'B 区 · 4 层', note: '最近同步 1 分钟前' },
]

function taskRows(n = 6) {
  const types = ['例行巡检', '数据校准', '异常复核', '固件升级']
  const status = ['已完成', '处理中', '待处理']
  const base = Date.now() - n * 7200_000
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(base + i * 7200_000)
    return {
      time: t.toLocaleString('zh-CN', { hour12: false }),
      id: `T-${2000 + i}`,
      type: types[i % types.length],
      status: status[i % status.length],
      report: `任务 ${2000 + i} 处理记录`,
    }
  })
}

/** 根据问题关键词挑选一种回答形态 */
function pickAnswer(question = '') {
  const q = String(question)
  if (/表格|明细|数据表|监测|table/i.test(q)) {
    return { contentType: 'table', title: '数据明细', payload: tableRows() }
  }
  if (/折线|趋势|图表|曲线|chart|图/i.test(q)) {
    return { contentType: 'echart', title: '温度趋势', payload: chartSeries() }
  }
  if (/列表|清单|资源|设备|list/i.test(q)) {
    return { contentType: 'list', title: '资源清单', payload: LIST_ITEMS }
  }
  if (/任务|工单|批量|导出|打包|task/i.test(q)) {
    return { contentType: 'taskTable', title: '任务列表', payload: taskRows(), taskIds: taskRows().map((r) => r.id) }
  }
  return { contentType: null, title: null, payload: MARKDOWN_ANSWER }
}

/* ---------------------------------------------------------------- 会话存储 */

function seedSessions() {
  const now = Date.now()
  const make = (sessionTitle, answer, contentType, ago) => ({
    sessionId: uid('h'),
    title: sessionTitle,
    updateTime: now - ago,
    rounds: [
      {
        sessionDetailId: uid('d'),
        question: sessionTitle,
        answer,
        contentType,
        title: contentType ? '示例卡片' : null,
      },
    ],
  })
  return [
    make('用表格展示最近的监测数据', JSON.stringify(tableRows()), 'table', 3600_000),
    make('画一张温度趋势折线图', JSON.stringify(chartSeries()), 'echart', 26 * 3600_000),
    make('给我一份资源清单', JSON.stringify(LIST_ITEMS), 'list', 3 * 24 * 3600_000),
  ]
}

/* ---------------------------------------------------------------- 分享样本 */

/** 造一轮分享对话 */
function shareRound(sessionDetailId, question, answer, extra = {}) {
  return {
    sessionDetailId,
    conversation: [
      { type: 0, message: question },
      { type: 1, message: answer, ...extra },
    ],
  }
}

/**
 * 一条可预览的分享数据（`ConversationItem[]`），覆盖全部渲染分支：
 * 起始分隔条 / Markdown / 表格 / 折线图 / 列表 / 空正文 / 任务表。
 * 契约：末条带 sessionId（续写锚点）。
 */
function demoShareItems() {
  return [
    { sessionDetailId: NEW_CHAT_MARK, conversation: [] },
    shareRound('sd-1001', '帮我看看最近的监测数据', MARKDOWN_ANSWER),
    shareRound('sd-1002', '用表格展示明细', JSON.stringify(tableRows()), {
      contentType: 'table',
      title: '数据明细',
    }),
    shareRound('sd-1003', '画一张温度趋势折线图', JSON.stringify(chartSeries()), {
      contentType: 'echart',
      title: '温度趋势',
    }),
    shareRound('sd-1004', '现场有哪些采集点？', JSON.stringify(LIST_ITEMS), {
      contentType: 'list',
      title: '资源清单',
    }),
    /* 空正文：验证分享页不会留一个永远转圈的三点动画 */
    shareRound('sd-1005', '这一轮的回答被撤回了', null),
    {
      sessionDetailId: 'sd-1006',
      sessionId: 'share-session-demo',
      conversation: [
        { type: 0, message: '列一下待处理的任务' },
        {
          type: 1,
          message: JSON.stringify(taskRows()),
          contentType: 'taskTable',
          title: '任务列表',
          taskIds: taskRows().map((r) => r.id),
        },
      ],
    },
  ]
}

/** 把选中的历史轮次转成分享数据（末条才带 sessionId，作为续写锚点） */
function buildItemsFromSessions(sessions, ids) {
  const picked = []
  sessions.forEach((s) => {
    s.rounds.forEach((r) => {
      if (ids.includes(r.sessionDetailId)) picked.push({ ...r, sessionId: s.sessionId })
    })
  })
  if (!picked.length) return demoShareItems()

  return picked.map((r, i) => ({
    sessionDetailId: r.sessionDetailId,
    sessionId: i === picked.length - 1 ? r.sessionId : undefined,
    conversation: [
      { type: 0, message: r.question },
      {
        type: 1,
        message: r.answer,
        contentType: r.contentType,
        title: r.title,
        taskIds: r.taskIds || [],
      },
    ],
  }))
}

/* ---------------------------------------------------------------- 工厂 */

/**
 * @param {object} options
 * @param {object} [options.endpoints]
 * @param {number} [options.latency] 每帧基础延迟（ms），默认 60
 */
export function createMockApi({ endpoints = {}, latency = 60 } = {}) {
  const ep = { ...DEFAULT_ENDPOINTS, ...endpoints }
  const sessions = seedSessions()

  /** 分享记录：内置一条可直接预览的示例分享（id = demo-share） */
  const shares = new Map([
    ['demo-share', { id: 'demo-share', userId: 'u_demo', items: demoShareItems() }],
  ])

  /** 简易网络往返延迟（可被 AbortSignal 中断） */
  const roundTrip = (signal) => delay(latency * 2, signal)

  return {
    kind: 'mock',
    endpoints: ep,

    async sendChat(payload = {}, { signal, onFrame } = {}) {
      const { question = '', sessionId = null, sessionDetailId = '', regenerate = false } = payload

      const finish = { sessionId: sessionId || uid('s'), sessionDetailId: sessionDetailId || uid('d') }

      // ① 状态帧：工具调用进度（不进正文）
      onFrame?.({ type: 'status', state: '', message: '正在理解你的问题…' })
      await delay(latency * 3, signal)

      if (regenerate) {
        onFrame?.({ type: 'status', state: 'body-reset', message: '' })
        await delay(latency * 2, signal)
      }

      const answer = pickAnswer(question)
      onFrame?.({ type: 'status', state: '', message: '正在检索数据…' })
      await delay(latency * 4, signal)

      if (answer.contentType) {
        // 卡片类回答：直接一帧 stop 帧，content 为卡片 JSON 字符串
        onFrame?.({
          sessionId: finish.sessionId,
          sessionDetailId: finish.sessionDetailId,
          widget: null,
          recommend: ['换个图表看看', '导出为 CSV', '展开明细'],
          output: {
            choices: [
              {
                finish_reason: 'stop',
                message: {
                  content: JSON.stringify(answer.payload),
                  contentType: answer.contentType,
                  title: answer.title,
                  taskIds: answer.taskIds || [],
                },
              },
            ],
          },
        })
      } else {
        // 文本类回答：先流式吐正文，最后一帧 stop 回传完整正文
        const text = answer.payload
        const chunks = text.match(/[\s\S]{1,6}/g) || [text]
        onFrame?.({ type: 'status', state: 'body-reset', message: '' })
        for (const chunk of chunks) {
          await delay(latency, signal)
          onFrame?.({
            sessionId: finish.sessionId,
            sessionDetailId: finish.sessionDetailId,
            output: {
              choices: [{ finish_reason: null, message: { content: chunk, contentType: null } }],
            },
          })
        }
        await delay(latency * 2, signal)
        onFrame?.({
          sessionId: finish.sessionId,
          sessionDetailId: finish.sessionDetailId,
          recommend: ['展开明细', '画一张趋势图', '导出为 CSV'],
          output: {
            choices: [{ finish_reason: 'stop', message: { content: text, contentType: null } }],
          },
        })
      }

      // 落一条历史会话（含本轮记录，供历史详情回读）
      const record = {
        sessionDetailId: finish.sessionDetailId,
        question: question || '新的对话',
        answer: answer.contentType ? JSON.stringify(answer.payload) : answer.payload,
        contentType: answer.contentType,
        title: answer.title,
      }
      const exist = sessions.find((s) => s.sessionId === finish.sessionId)
      if (exist) {
        exist.updateTime = Date.now()
        exist.rounds.push(record)
      } else {
        sessions.unshift({
          sessionId: finish.sessionId,
          title: (question || '新的对话').slice(0, 24),
          updateTime: Date.now(),
          rounds: [record],
        })
      }
      return undefined
    },

    async get(rawPath, rawParams = {}, { signal } = {}) {
      await roundTrip(signal)
      const { path, params } = splitPath(rawPath, rawParams)

      if (path === ep.shareMessage) {
        // 分享详情：未命中返回空数组，由组件渲染 emptyText
        return shares.get(params.userShareId)?.items ?? []
      }

      if (path === ep.historyList) {
        const page = Number(params.page ?? 0)
        const data = sessions.slice(page * 10, page * 10 + 10)
        return { data, pagetotal: Math.ceil(sessions.length / 10), page }
      }

      if (path === ep.detailList) {
        const target = sessions.find((s) => s.sessionId === params.sessionId)
        return { data: target?.rounds ?? [], pagetotal: 1, sessionId: params.sessionId }
      }

      if (path.startsWith(ep.batchExportResult)) {
        // 轮询：第一次返回处理中，之后返回完成
        const first = !polled.has(params.pollId)
        polled.add(params.pollId)
        return first ? { status: 0 } : { status: 1, url: 'https://example.com/mock-export.zip' }
      }

      return null
    },

    async post(rawPath, body = {}, { signal } = {}) {
      await roundTrip(signal)
      const { path } = splitPath(rawPath)

      if (path === ep.commentStatus) return 'success'

      if (path === ep.share) {
        // 生成分享：传了 sessionDetailIds 就按这些轮次组，否则复用示例内容
        const ids = Array.isArray(body?.sessionDetailIds) ? body.sessionDetailIds : []
        const userId = body?.userId || 'u_demo'
        const items = ids.length ? buildItemsFromSessions(sessions, ids) : demoShareItems()
        const id = uid('share')
        shares.set(id, { id, userId, items })
        return { id, userId, shareId: id, total: items.length }
      }

      if (path === ep.batchExport) return { pollId: uid('poll'), count: body?.ids?.length ?? 0 }
      return null
    },

    async del(rawPath, rawParams = {}, { signal } = {}) {
      await roundTrip(signal)
      const { path, params } = splitPath(rawPath, rawParams)

      if (path === ep.deleteHistory) {
        const idx = sessions.findIndex((s) => s.sessionId === params.sessionId)
        if (idx >= 0) sessions.splice(idx, 1)
      }
      return 'success'
    },
  }
}
