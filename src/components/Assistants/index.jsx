import { useCallback } from 'react'
import { AssistantProvider, useAssistants, TARGET } from './AssistantContext.jsx'

import GlobalAgent from '../GlobalAgent/index.jsx'
import VoiceAssistantPanel from './VoiceAssistantPanel.jsx'
import QuickAssistant from './QuickAssistant.jsx'

function AssistantHost({ pages, quickItems, voiceProps }) {
  const { active, close, toggle, agentTask, consumeAgentTask, sendToAgent } = useAssistants()

  const handleAgentOpenChange = useCallback(
    (next) => {
      if (next) toggle(TARGET.AGENT)
      else close(TARGET.AGENT)
    },
    [toggle, close],
  )

  // 语音面板也要传 onOpenChange，否则其内置快捷键（Ctrl+Shift+V）在受控模式下无效
  const handleVoiceOpenChange = useCallback(
    (next) => {
      if (next) toggle(TARGET.VOICE)
      else close(TARGET.VOICE)
    },
    [toggle, close],
  )

  return (
    <>
      {/* AI Agent：受控模式，隐藏自带气泡，统一由快捷助手键唤起 */}
      <GlobalAgent
        open={active === TARGET.AGENT}
        onOpenChange={handleAgentOpenChange}
        hideBubble
        pendingTask={agentTask}
        onPendingTaskConsumed={consumeAgentTask}
      />

      {/* 语音助手：受控模式，识别结果可一键转交 AI Agent */}
      <VoiceAssistantPanel
        open={active === TARGET.VOICE}
        onOpenChange={handleVoiceOpenChange}
        onSendToAgent={sendToAgent}
        enableShortcut
        {...voiceProps}
      />

      {/* 可拖动快捷助手键：开关上面两个面板 + 页面快捷跳转 */}
      <QuickAssistant pages={pages} items={quickItems} />
    </>
  )
}

/**
 * 助手中心组合件 —— 渲染两个助手面板 + 可拖动快捷助手键。
 *
 * 通常两处配合：
 *   // App.jsx：Provider 放在路由外层，任意页面都能 useAssistants()
 *   <AssistantProvider><Routes>...<Routes></AssistantProvider>
 *
 *   // Layout.jsx：面板与快捷助手键挂在这里
 *   <Assistants />
 *
 * 若外层没有 Provider，<Assistants /> 会自建一个，保证单独使用也能跑起来。
 *
 * props:
 * - pages        快捷助手键里的跳转页面列表 [{ to, label, icon }]
 * - quickItems   完全自定义快捷助手键的菜单项
 * - voiceProps   透传给 VoiceAssistantPanel 的额外属性
 */
export default function Assistants(props) {
  const ctx = useAssistants()
  // 外层已有 Provider 时直接复用，保证页面与面板共享同一份状态
  if (ctx) return <AssistantHost {...props} />
  return (
    <AssistantProvider>
      <AssistantHost {...props} />
    </AssistantProvider>
  )
}

export { AssistantProvider, useAssistants, TARGET } from './AssistantContext.jsx'
export { openAssistant, closeAssistant, toggleAssistant, controlAssistant } from './AssistantContext.jsx'
export { default as VoiceAssistantPanel } from './VoiceAssistantPanel.jsx'
export { default as QuickAssistant } from './QuickAssistant.jsx'
