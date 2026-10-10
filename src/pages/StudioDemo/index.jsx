import { useMemo, useState } from 'react'
import { Menu, Tabs, Card, Typography } from 'antd'
import { CodepenOutlined } from '@ant-design/icons'
import { CATEGORIES, CodeBlock } from './components/StudioDemos.jsx'
import './StudioDemo.scss'

const { Title, Paragraph, Text } = Typography

export default function StudioDemo() {
  const [cat, setCat] = useState('screen')
  const current = CATEGORIES.find((c) => c.key === cat)

  const totalCount = CATEGORIES.reduce((n, c) => n + c.demos.length, 0)

  const menuItems = useMemo(
    () => CATEGORIES.map((c) => ({
      key: c.key,
      icon: c.icon,
      label: <span className="studio-demo__menu-label">{c.label}<em>{c.demos.length}</em></span>,
    })),
    [],
  )

  const tabItems = useMemo(
    () => current.demos.map((d) => ({
      key: d.key,
      label: d.title.split(' · ')[0],
      children: (
        <div className="studio-demo__panel">
          <div className="studio-demo__meta">
            <Text strong>{d.title}</Text>
            <Paragraph type="secondary" className="studio-demo__desc">{d.desc}</Paragraph>
          </div>
          <div className="studio-demo__stage">{d.render()}</div>
          <CodeBlock code={d.usage} />
        </div>
      ),
    })),
    [current],
  )

  return (
    <div className="studio-demo">
      <div className="studio-demo__header">
        <Title level={3} style={{ marginBottom: 4 }}>
          <CodepenOutlined /> 组件工坊 Studio
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          从本地 80+ 存量前端项目里筛选、去业务化、零依赖重写而成的 {totalCount} 个可复用组件，按能力分为 {CATEGORIES.length} 组。
          所有演示数据均为中性虚构占位，不含任何原始敏感信息。
        </Paragraph>
      </div>

      <div className="studio-demo__layout">
        <Menu
          mode="inline"
          className="studio-demo__menu"
          selectedKeys={[cat]}
          items={menuItems}
          onClick={({ key }) => setCat(key)}
        />
        <div className="studio-demo__content">
          <Card size="small" className="studio-demo__card" title={current.label}>
            <Tabs items={tabItems} />
          </Card>
        </div>
      </div>
    </div>
  )
}
