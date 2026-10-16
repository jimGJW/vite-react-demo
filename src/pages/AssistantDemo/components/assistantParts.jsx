import {  Space, Tag, Typography } from 'antd'
import { useI18n } from '../../../i18n/index.js'
import {
  
  
  
  
} from '../../../components/Assistants/index.jsx'

const { Paragraph, Title } = Typography


export function CodeBlock({ children }) {
  return <pre className="ad-code">{children}</pre>
}

export function Method({ index, title, desc, code, children }) {
  const { t } = useI18n()
  return (
    <section className="ad-method">
      <Title level={4} className="ad-method-title">
        <Tag color="blue">{t('assistantDemo.method.tag')} {index}</Tag>
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
