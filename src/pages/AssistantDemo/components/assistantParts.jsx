import { useState } from 'react'
import { Button, Space, Tag, Typography } from 'antd'
import {
  useAssistants,
  openAssistant,
  closeAssistant,
  controlAssistant,
} from '../../../components/Assistants/index.jsx'
import VoiceAssistantPanel from '../../../components/Assistants/VoiceAssistantPanel.jsx'

const { Paragraph, Text, Title } = Typography


export function CodeBlock({ children }) {
  return <pre className="ad-code">{children}</pre>
}

export function Method({ index, title, desc, code, children }) {
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
