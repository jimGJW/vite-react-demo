/**
 * 分享页协议层（纯函数 · 零 React 依赖 · 可单测）
 * ===============================================================
 * 来源：云端文档《QASharing 分享页 —— 组件化方案》。
 * 把「后端返回什么」与「组件怎么渲染」之间的脏活收拢在这里，
 * 与 `chatStream.js` 同一套思路：可单测、无副作用。
 *
 * 覆盖文档里点名的 6 个原实现坑中的 5 个（第 3、4 个在渲染层修）：
 *   ① sessionId 取错      → pickSessionId 取数组末条，而不是数组自身的属性
 *   ② 匿名访问白屏        → 归一化只认数据结构，不碰任何全局用户态
 *   ③ postMessage 未传    → 渲染层：onAsk 全程可选链
 *   ④ 空正文永久 loading  → 渲染层：空 message 渲染为空，不走等待态
 *   ⑤ 缺 flag 参数        → buildShareMessageUrl 统一拼 flag
 *   ⑥ 分享链接硬编码      → 不产出任何链接，续写交给 onContinue 回调
 */

import { NEW_CHAT_MARK } from '../chatStream.js'

/** 默认接口路径（与 config.js 的 DEFAULT_ENDPOINTS.shareMessage 保持一致） */
export const DEFAULT_SHARE_MESSAGE_PATH = '/aigc/shareMessage'

/**
 * 取分享数据的会话 ID。
 * 契约：`ConversationItem[]` 的**末条**带 sessionId（续写锚点）。
 * 原实现写成 `QASharingData.sessionId` —— 对数组取属性恒为 undefined。
 */
export function pickSessionId(items) {
  if (!Array.isArray(items) || !items.length) return ''
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const id = items[i]?.sessionId
    if (id) return id
  }
  return ''
}

/**
 * 归一化一条消息。
 * 只保留只读渲染需要的字段；用户消息恒为 `type: 0`。
 */
export function normalizeMessage(msg, fallbackDetailId = '', index = 0) {
  if (!msg || typeof msg !== 'object') return null

  if (Number(msg.type) === 0) {
    return { type: 0, message: msg.message ?? '' }
  }

  return {
    type: 1,
    message: msg.message ?? '',
    contentType: msg.contentType ?? null,
    title: msg.title ?? null,
    taskIds: Array.isArray(msg.taskIds) ? msg.taskIds : [],
    workOrderIds: msg.workOrderIds ?? null,
    messageState: msg.messageState ?? '',
    sessionDetailId: msg.sessionDetailId || fallbackDetailId || `share-msg-${index}`,
  }
}

/** 归一化一轮对话（ConversationItem） */
export function normalizeShareItem(item, index = 0) {
  const source = item && typeof item === 'object' ? item : {}
  const sessionDetailId = source.sessionDetailId || `share-round-${index}`
  const conversation = Array.isArray(source.conversation)
    ? source.conversation
        .map((m, i) => normalizeMessage(m, sessionDetailId, i))
        .filter(Boolean)
    : []

  return {
    sessionDetailId,
    sessionId: source.sessionId,
    userShare: !!source.userShare,
    conversation,
  }
}

/**
 * 把接口响应归一化成 `ConversationItem[]`。
 * 支持的形态：数组 / `{ data: [] }` / `{ content: [] }` / `{ list: [] }`，
 * 也可以先用 `transform` 自行把响应掰成数组（文档「迁移检查清单」第 1 条）。
 */
export function normalizeShareItems(res, transform) {
  let raw = res

  if (typeof transform === 'function') {
    try {
      raw = transform(raw)
    } catch {
      raw = []
    }
  }

  if (!Array.isArray(raw)) {
    if (Array.isArray(raw?.data)) raw = raw.data
    else if (Array.isArray(raw?.content)) raw = raw.content
    else if (Array.isArray(raw?.list)) raw = raw.list
    else if (Array.isArray(raw?.records)) raw = raw.records
    else raw = []
  }

  return raw
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item, i) => normalizeShareItem(item, i))
}

/**
 * 拼分享详情接口的 URL。
 * `flag` 语义由后端定义（主聊天页传 `1` / `null`），非空才拼上去，
 * 避免主聊天页与分享页请求参数不一致导致渲染字段不同。
 */
export function buildShareMessageUrl(basePath, { userShareId, flag } = {}) {
  const base = basePath || DEFAULT_SHARE_MESSAGE_PATH
  const usp = new URLSearchParams()

  if (userShareId !== undefined && userShareId !== null && userShareId !== '') {
    usp.set('userShareId', String(userShareId))
  }
  if (flag !== undefined && flag !== null && flag !== '') {
    usp.set('flag', String(flag))
  }

  const qs = usp.toString()
  if (!qs) return base
  return `${base}${base.includes('?') ? '&' : '?'}${qs}`
}

/** 是否为「全新的开始」分隔轮：`sessionDetailId === '0000'` 且没有消息 */
export function isNewChatItem(item) {
  return item?.sessionDetailId === NEW_CHAT_MARK && !item?.conversation?.length
}

/** 统计分享里的提问轮数（用于标题栏） */
export function countRounds(items) {
  if (!Array.isArray(items)) return 0
  return items.filter((it) => !isNewChatItem(it)).length
}
