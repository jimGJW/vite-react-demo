/**
 * 对话分享（QASharing）子模块统一出口
 * ===============================================================
 * 页面级：SharedConversationView
 * 组合用：ConversationList / ConversationItem / MessageBubble
 * 逻辑层：useShareConversation / toShareRequest / createFetchShareRequest
 * 预设层：createSharedRenderers（四类只读卡片）
 * 协议层：shareProtocol.js（纯函数，可单测）
 */

export { default as SharedConversationView } from './SharedConversationView.jsx'
export { default as ConversationList, ConversationItem, MessageBubble } from './ConversationList.jsx'

export {
  default as useShareConversation,
  toShareRequest,
  createFetchShareRequest,
} from './useShareConversation.js'

export { createSharedRenderers } from './sharedRenderers.jsx'

export * from './shareProtocol.js'
