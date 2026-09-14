/**
 * ChatBot 模块统一出口
 * ===============================================================
 * 组件：ChatBot（完整容器）/ Conversation / LeftMessage / RightMessage / AnswerWidget
 * 逻辑：useMessage（状态机）/ useAutoScroll（智能吸底）/ ChatProvider / useChatContext
 * 适配：createHttpApi（真实后端）/ createMockApi（本地模拟）
 * 协议：chatStream.js（逐行 JSON 流式协议纯函数）
 * 分享：SharedConversationView / useShareConversation / ConversationList（QASharing 只读落地页）
 */

export { default as ChatBot } from './ChatBot.jsx'
export { default as AnswerWidget } from './AnswerWidget.jsx'
export { default as Conversation, LeftMessage, RightMessage, PendingBubble } from './Message.jsx'
export { default as HistoryList } from './HistoryList.jsx'

export { default as ListCard } from './cards/ListCard.jsx'
export { default as DataTable } from './cards/DataTable.jsx'
export { default as TaskTable } from './cards/TaskTable.jsx'
export { default as LineChart } from './cards/LineChart.jsx'

export { default as useMessage, recordsToRounds } from './useMessage.js'
export { default as useAutoScroll } from './useAutoScroll.js'
export {
  ChatProvider,
  ChatStatusProvider,
  useChatContext,
  useChatStatus,
} from './ChatContext.jsx'

export { createHttpApi, DEFAULT_TIMEOUT } from './api.js'
export { createMockApi } from './mockBackend.js'

/* —— 对话分享（QASharing 只读落地页）—— */
export { default as SharedConversationView } from './sharing/SharedConversationView.jsx'
export { default as ConversationList } from './sharing/ConversationList.jsx'
export { ConversationItem, MessageBubble } from './sharing/ConversationList.jsx'
export {
  default as useShareConversation,
  toShareRequest,
  createFetchShareRequest,
} from './sharing/useShareConversation.js'
export { createSharedRenderers } from './sharing/sharedRenderers.jsx'
export {
  pickSessionId,
  normalizeShareItems,
  normalizeShareItem,
  normalizeMessage,
  buildShareMessageUrl,
  isNewChatItem,
  countRounds,
  DEFAULT_SHARE_MESSAGE_PATH,
} from './sharing/shareProtocol.js'

export * from './chatStream.js'
export * from './config.js'
