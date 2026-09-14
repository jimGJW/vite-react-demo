/**
 * ChatBot 跨气泡共享 Context（按「变化频率」拆成两个）
 * ===============================================================
 * 为什么拆两个：
 *   Context 的变化会穿透 React.memo —— 只要 Provider 的 value 换引用，
 *   所有消费该 Context 的组件都会重渲染。流式生成时 statusLine / loading
 *   每帧都在变，若与「工具栏开关 / 头像 / 赞踩回调」混在一起，
 *   一帧就要把整屏气泡全部重渲染一遍。
 *
 * 因此：
 *   ChatContext        低频且稳定：toolBox / head / shareState / 回调 / api
 *   ChatStatusContext  高频且多变：loading / statusLine（只由「等待中的气泡」消费）
 */

import { createContext, useContext } from 'react'

/** 低频：跨气泡共享的稳定配置 */
export const ChatContext = createContext({})

/** 高频：仅「等待中的那一条气泡」需要的实时状态 */
export const ChatStatusContext = createContext({ loading: false, statusLine: '' })

export function ChatProvider({ value, children }) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function ChatStatusProvider({ value, children }) {
  return <ChatStatusContext.Provider value={value}>{children}</ChatStatusContext.Provider>
}

export function useChatContext() {
  return useContext(ChatContext)
}

export function useChatStatus() {
  return useContext(ChatStatusContext)
}

export default ChatContext
