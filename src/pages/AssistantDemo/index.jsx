import { useState } from 'react'
import { Button, Tag, Typography } from 'antd'
import {
  useAssistants,
  openAssistant,
  closeAssistant,
  controlAssistant,
} from '../../components/Assistants/index.jsx'
import VoiceAssistantPanel from '../../components/Assistants/VoiceAssistantPanel.jsx'
import { useI18n } from '../../i18n/index.js'
import './index.scss'

const { Paragraph, Text, Title } = Typography


import {  Method } from './components/assistantParts.jsx'

export default function AssistantDemo() {
  const { t } = useI18n()
  const assistants = useAssistants()
  const [standaloneOpen, setStandaloneOpen] = useState(false)

  const voiceOn = assistants?.isOpen('voice')
  const agentOn = assistants?.isOpen('agent')

  return (
    <div className="page-card ad-page">
      <Title level={3}>{t('assistantDemo.demo.title')}</Title>
      <Paragraph className="ad-lead">
        {t('assistantDemo.demo.leadBefore')}
        <Text strong>{t('assistantDemo.demo.leadKey')}</Text>
        {t('assistantDemo.demo.leadAfter')}
      </Paragraph>

      <div className="ad-status">
        {t('assistantDemo.demo.statusLabel')}{' '}
        <Tag color={voiceOn ? 'green' : 'default'}>{t('assistantDemo.demo.voiceLabel')} {voiceOn ? t('assistantDemo.demo.on') : t('assistantDemo.demo.off')}</Tag>
        <Tag color={agentOn ? 'green' : 'default'}>{t('assistantDemo.demo.agentLabel')} {agentOn ? t('assistantDemo.demo.on') : t('assistantDemo.demo.off')}</Tag>
      </div>

      <Method
        index={1}
        title={t('assistantDemo.method.m1Title')}
        desc={t('assistantDemo.method.m1Desc')}
        code={`import { useAssistants } from '@/components/Assistants'

const { isOpen, open, close, toggle, sendToAgent } = useAssistants()

<button onClick={() => open('voice')}>打开语音助手</button>
<button onClick={() => toggle('agent')}>开关 AI Agent</button>
<button onClick={() => sendToAgent('滚动到底部')}>把指令交给 Agent</button>`}
      >
        <Button type="primary" onClick={() => assistants?.open('voice')}>
          {t('assistantDemo.demo.openVoice')}
        </Button>
        <Button onClick={() => assistants?.toggle('agent')}>
          {t('assistantDemo.demo.agentPrefix')}{agentOn ? t('assistantDemo.demo.closeBtn') : t('assistantDemo.demo.openBtn')}{t('assistantDemo.demo.agentSuffix')}
        </Button>
        <Button onClick={() => assistants?.sendToAgent('帮我分析当前页面有哪些按钮')}>
          {t('assistantDemo.demo.sendToAgent')}
        </Button>
        <Button danger onClick={() => assistants?.close()}>
          {t('assistantDemo.demo.closeAll')}
        </Button>
      </Method>

      <Method
        index={2}
        title={t('assistantDemo.method.m2Title')}
        desc={t('assistantDemo.method.m2Desc')}
        code={`import { openAssistant, closeAssistant, controlAssistant } from '@/components/Assistants'

openAssistant('voice')                             // 打开语音助手
closeAssistant('voice')                            // 关闭语音助手
controlAssistant('agent', 'fill', { text: '点一下提交按钮' })  // 打开 Agent 并填入指令`}
      >
        <Button onClick={() => openAssistant('voice')}>openAssistant('voice')</Button>
        <Button onClick={() => closeAssistant('voice')}>closeAssistant('voice')</Button>
        <Button onClick={() => controlAssistant('agent', 'fill', { text: '滚动到页面底部' })}>
          {t('assistantDemo.demo.fillAgentBtn', { text: '滚动到页面底部' })}
        </Button>
      </Method>

      <Method
        index={3}
        title={t('assistantDemo.method.m3Title')}
        desc={t('assistantDemo.method.m3Desc')}
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
          {t('assistantDemo.demo.dispatchOpen')}
        </Button>
        <Button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('app:assistant', { detail: { action: 'toggle', target: 'agent' } }),
            )
          }
        >
          {t('assistantDemo.demo.dispatchToggle')}
        </Button>
      </Method>

      <Method
        index={4}
        title={t('assistantDemo.method.m4Title')}
        desc={t('assistantDemo.method.m4Desc')}
        code={`const [open, setOpen] = useState(false)

<VoiceAssistantPanel
  open={open}
  onClose={() => setOpen(false)}
  onSendToAgent={(text) => console.log(text)}
/>`}
      >
        <Button type="primary" onClick={() => setStandaloneOpen(true)}>
          {t('assistantDemo.demo.standaloneBtn')}
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
        title={t('assistantDemo.demo.standaloneTitle')}
      />
    </div>
  )
}
