import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * 助手中心：统一管理「AI Agent」「语音助手」两个全局弹窗的开关状态。
 *
 * 三种调用方式（任选其一）：
 * 1) React 组件内：const { open, toggle } = useAssistants(); open('voice')
 * 2) 任意 JS / Vue 页面：openAssistant('voice')
 * 3) 原生事件：window.dispatchEvent(new CustomEvent('app:assistant', { detail: { action: 'open', target: 'voice' } }))
 */
export const ASSISTANT_EVENT = 'app:assistant'

/** 目标面板 */
export const TARGET = {
  AGENT: 'agent',
  VOICE: 'voice',
}

/**
 * 命令式控制助手面板（不依赖 React，可在 Vue 页面 / 原生 JS 中调用）
 * @param {'agent'|'voice'} target 目标面板
 * @param {'open'|'close'|'toggle'|'fill'} action 动作，fill = 打开 Agent 并填入文本
 * @param {*} payload 附加数据，fill 时传 { text }
 */
export function controlAssistant(target = TARGET.AGENT, action = 'open', payload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ASSISTANT_EVENT, { detail: { target, action, payload } }))
}

export const openAssistant = (target, payload) => controlAssistant(target, 'open', payload)
export const closeAssistant = (target) => controlAssistant(target, 'close')
export const toggleAssistant = (target) => controlAssistant(target, 'toggle')

const AssistantContext = createContext(null)

/**
 * 助手中心 Provider。需放在 react-router 的 Router 内部（要用 useNavigate）。
 * 同一时刻只展示一个助手面板，避免相互遮挡。
 */
export function AssistantProvider({ children }) {
  const navigate = useNavigate()
  /** @type {['agent'|'voice'|null, Function]} 当前打开的面板 */
  const [active, setActive] = useState(null)
  /** 待填入 AI Agent 输入框的文本（语音助手 → Agent 的传值通道） */
  const [agentTask, setAgentTask] = useState('')

  const open = useCallback((target) => {
    setActive(target || TARGET.AGENT)
  }, [])

  /** 关闭指定面板；不传 target 时关闭当前面板 */
  const close = useCallback((target) => {
    setActive((prev) => (target && prev !== target ? prev : null))
  }, [])

  const toggle = useCallback((target) => {
    setActive((prev) => (prev === target ? null : target))
  }, [])

  const consumeAgentTask = useCallback(() => setAgentTask(''), [])

  /** 把一段文本（通常来自语音识别）送进 AI Agent 输入框 */
  const sendToAgent = useCallback((text) => {
    if (text) setAgentTask(text)
    setActive(TARGET.AGENT)
  }, [])

  // 监听全局事件，供非 React 环境唤起助手
  useEffect(() => {
    const onEvent = (e) => {
      const { target = TARGET.AGENT, action = 'open', payload } = e.detail || {}
      if (action === 'open') setActive(target)
      else if (action === 'close') close(target)
      else if (action === 'toggle') toggle(target)
      else if (action === 'fill') {
        if (payload?.text) setAgentTask(payload.text)
        setActive(TARGET.AGENT)
      }
    }
    window.addEventListener(ASSISTANT_EVENT, onEvent)
    return () => window.removeEventListener(ASSISTANT_EVENT, onEvent)
  }, [close, toggle])

  const value = useMemo(
    () => ({
      active,
      isOpen: (t) => active === t,
      open,
      close,
      toggle,
      agentTask,
      consumeAgentTask,
      sendToAgent,
      navigate,
    }),
    [active, open, close, toggle, agentTask, consumeAgentTask, sendToAgent, navigate],
  )

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}

/**
 * 读取助手中心状态。未包裹 Provider 时返回 null（组件会退回自身的独立状态）。
 */
export function useAssistants() {
  return useContext(AssistantContext)
}
