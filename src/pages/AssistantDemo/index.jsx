import { useState } from 'react'
import { Button, Space, Tag, Typography } from 'antd'
import {
  useAssistants,
  openAssistant,
  closeAssistant,
  controlAssistant,
} from '../../components/Assistants/index.jsx'
import VoiceAssistantPanel from '../../components/Assistants/VoiceAssistantPanel.jsx'
import './index.scss'

const { Paragraph, Text, Title } = Typography

function CodeBlock({ children }) {
  return <pre className="ad-code">{children}</pre>
}

function Method({ index, title, desc, code, children }) {
  return (
    <section className="ad-method">
      <Title level={4} className="ad-method-title">
        <Tag color="blue">方式 {index}</Tag>
        {title}
      </Title>
      <Paragraph className="ad-method-desc">{desc}</Paragraph>
      <Space wrap className="ad-method-actions">
        {children}
      </Space>
      <CodeBlock>{code}</CodeBlock>
    </section>
  )
}

/**
 * 快捷助手 Demo —— 演示「在其他页面调用语音助手 / AI Agent 弹窗」的三种方式。
 */
export default function AssistantDemo() {
  const assistants = useAssistants()
  const [standaloneOpen, setStandaloneOpen] = useState(false)

  const voiceOn = assistants?.isOpen('voice')
  const agentOn = assistants?.isOpen('agent')

  return (
    <div className="page-card ad-page">
      <Title level={3}>⚡ 快捷助手</Title>
      <Paragraph className="ad-lead">
        语音助手与 AI Agent 都已经组件化，可以在任意页面唤起弹窗。右下角的
        <Text strong> 快捷助手键 </Text>
        可自由拖动，点击展开菜单即可开关两个助手、或一键跳转到指定页面。
      </Paragraph>

      <div className="ad-status">
        当前状态：
        <Tag color={voiceOn ? 'green' : 'default'}>语音助手 {voiceOn ? '已开启' : '已关闭'}</Tag>
        <Tag color={agentOn ? 'green' : 'default'}>AI Agent {agentOn ? '已开启' : '已关闭'}</Tag>
      </div>

      <Method
        index={1}
        title="useAssistants Hook（React 组件内推荐）"
        desc="在 Layout 挂载 <Assistants /> 后，任意页面组件都可以通过 Hook 读取并控制助手面板。"
        code={`import { useAssistants } from '@/components/Assistants'

const { isOpen, open, close, toggle, sendToAgent } = useAssistants()

<button onClick={() => open('voice')}>打开语音助手</button>
<button onClick={() => toggle('agent')}>开关 AI Agent</button>
<button onClick={() => sendToAgent('滚动到底部')}>把指令交给 Agent</button>`}
      >
        <Button type="primary" onClick={() => assistants?.open('voice')}>
          🎙️ 打开语音助手
        </Button>
        <Button onClick={() => assistants?.toggle('agent')}>
          🤖 {agentOn ? '关闭' : '打开'} AI Agent
        </Button>
        <Button onClick={() => assistants?.sendToAgent('帮我分析当前页面有哪些按钮')}>
          ➡️ 指令交给 Agent
        </Button>
        <Button danger onClick={() => assistants?.close()}>
          全部关闭
        </Button>
      </Method>

      <Method
        index={2}
        title="命令式 API（任意 JS / Vue 页面可用）"
        desc="不依赖 React 上下文，Vue SFC、原生 JS、浏览器控制台里都能直接调用。"
        code={`import { openAssistant, closeAssistant, controlAssistant } from '@/components/Assistants'

openAssistant('voice')                             // 打开语音助手
closeAssistant('voice')                            // 关闭语音助手
controlAssistant('agent', 'fill', { text: '点一下提交按钮' })  // 打开 Agent 并填入指令`}
      >
        <Button onClick={() => openAssistant('voice')}>openAssistant('voice')</Button>
        <Button onClick={() => closeAssistant('voice')}>closeAssistant('voice')</Button>
        <Button onClick={() => controlAssistant('agent', 'fill', { text: '滚动到页面底部' })}>
          Agent 填入「滚动到页面底部」
        </Button>
      </Method>

      <Method
        index={3}
        title="window 原生事件（跨框架 / 跨技术栈）"
        desc="Vue、Angular 页面或 iframe 内都可以用这条事件唤起助手，与项目里已有的 app:navigate 用法一致。"
        code={`window.dispatchEvent(
  new CustomEvent('app:assistant', { detail: { action: 'open', target: 'voice' } })
)
// action: 'open' | 'close' | 'toggle' | 'fill'
// target: 'agent' | 'voice'`}
      >
        <Button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('app:assistant', { detail: { action: 'open', target: 'voice' } }),
            )
          }
        >
          dispatchEvent → 打开语音助手
        </Button>
        <Button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('app:assistant', { detail: { action: 'toggle', target: 'agent' } }),
            )
          }
        >
          dispatchEvent → 开关 AI Agent
        </Button>
      </Method>

      <Method
        index={4}
        title="组件内嵌（脱离助手中心独立受控）"
        desc="语音助手面板本身就是一个普通受控组件，也可以只在某个页面里单独使用，配合自己的 state。"
        code={`const [open, setOpen] = useState(false)

<VoiceAssistantPanel
  open={open}
  onClose={() => setOpen(false)}
  onSendToAgent={(text) => console.log(text)}
/>`}
      >
        <Button type="primary" onClick={() => setStandaloneOpen(true)}>
          打开独立语音助手面板
        </Button>
      </Method>

      <VoiceAssistantPanel
        open={standaloneOpen}
        onClose={() => setStandaloneOpen(false)}
        onSendToAgent={(text) => {
          setStandaloneOpen(false)
          assistants?.sendToAgent(text)
        }}
        persistKey="demo-standalone"
        title="语音助手（独立实例）"
      />
    </div>
  )
}
