import { Card, Typography } from 'antd'

const { Paragraph, Text } = Typography

/**
 * 每个工具一张卡：标题 + 一句话说明 + 交互区 + 用法代码。
 *
 * 说明文字刻意只写一句：这一页的作用是让人一眼看懂「这函数干什么」，
 * 不是文档站，详细 API 看 Utils 的 README。
 */
export default function DemoCard({ title, desc, usage, children }) {
  return (
    <Card size="small" className="utils-demo__card">
      <Text strong className="utils-demo__title">{title}</Text>
      <Paragraph type="secondary" className="utils-demo__desc">{desc}</Paragraph>
      <div className="utils-demo__stage">{children}</div>
      {usage && <pre className="utils-demo__code">{usage}</pre>}
    </Card>
  )
}
