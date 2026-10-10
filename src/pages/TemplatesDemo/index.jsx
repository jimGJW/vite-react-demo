import { useMemo, useState } from 'react'
import { Card, Tag, Typography, Segmented, Empty, Tooltip } from 'antd'
import { GithubOutlined, AppstoreOutlined, BranchesOutlined } from '@ant-design/icons'
import { TEMPLATES, GROUPS, FRAMEWORK_COLOR } from '../../components/Templates/index.js'
import './TemplatesDemo.scss'

const { Title, Paragraph, Text } = Typography

/* 各分组计数（与过滤无关，始终展示全量统计） */
const GROUP_COUNTS = GROUPS.map((g) => ({
  ...g,
  count: g.key === 'all' ? TEMPLATES.length : TEMPLATES.filter((t) => t.group === g.key).length,
}))


import { TemplateCard } from './components/templateCard.jsx'

export default function TemplatesDemo() {
  const [group, setGroup] = useState('all')

  const list = useMemo(
    () => (group === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.group === group)),
    [group],
  )

  return (
    <div className="templates-demo">
      <div className="templates-demo__header">
        <Title level={3} style={{ marginBottom: 4 }}>
          <AppstoreOutlined /> 开源模板库 Templates
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          从本地 Front-End 归档中识别出的 {TEMPLATES.length} 个纯上游开源模板（此前判为 D 类，未做移植）。
          仅收录技术栈与能力点等元信息，全部为公开项目，不含任何内部代码或敏感数据。
        </Paragraph>
        <div className="templates-demo__stats">
          {GROUP_COUNTS.map((g) => (
            <span key={g.key} className="templates-demo__stat">
              <b>{g.count}</b> {g.label}
            </span>
          ))}
        </div>
      </div>

      <div className="templates-demo__filter">
        <Segmented
          options={GROUPS.map((g) => ({ label: g.label, value: g.key }))}
          value={group}
          onChange={setGroup}
        />
      </div>

      {list.length === 0 ? (
        <Empty description="该分类下暂无模板" />
      ) : (
        <div className="templates-demo__grid">
          {list.map((item) => (
            <TemplateCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
