import { useState } from 'react'
import { Menu, Tabs, Card, Typography } from 'antd'
import { CodepenOutlined } from '@ant-design/icons'
import { CATEGORIES, CodeBlock } from './components/StudioDemos.jsx'
import { useI18n } from '@i18n/index.js'
import './StudioDemo.scss'

const { Title, Paragraph, Text } = Typography

export default function StudioDemo() {
  const { t } = useI18n()
  const [cat, setCat] = useState('screen')
  const cats = CATEGORIES(t)
  const current = cats.find((c) => c.key === cat)

  const totalCount = cats.reduce((n, c) => n + c.demos.length, 0)

  const menuItems = cats.map((c) => ({
    key: c.key,
    icon: c.icon,
    label: <span className="studio-demo__menu-label">{c.label}<em>{c.demos.length}</em></span>,
  }))

  const tabItems = current.demos.map((d) => ({
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
  }))

  return (
    <div className="studio-demo">
      <div className="studio-demo__header page-hero">
        <Title level={3} style={{ marginBottom: 4 }}>
          <CodepenOutlined /> {t('studio.page.title')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('studio.page.descLead', { count: totalCount, groups: cats.length })} {t('studio.page.descTail')}
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
