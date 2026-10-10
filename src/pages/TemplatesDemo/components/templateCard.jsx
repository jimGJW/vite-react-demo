import { useMemo, useState } from 'react'
import { Card, Tag, Typography, Segmented, Empty, Tooltip } from 'antd'
import { GithubOutlined, AppstoreOutlined, BranchesOutlined } from '@ant-design/icons'
import { TEMPLATES, GROUPS, FRAMEWORK_COLOR } from '../../../components/Templates/index.js'

const { Title, Paragraph, Text } = Typography

/* 各分组计数（与过滤无关，始终展示全量统计） */
const GROUP_COUNTS = GROUPS.map((g) => ({
  ...g,
  count: g.key === 'all' ? TEMPLATES.length : TEMPLATES.filter((t) => t.group === g.key).length,
}))


export function TemplateCard({ item }) {
  const color = FRAMEWORK_COLOR[item.framework] || '#1677ff'
  return (
    <Card
      className="tpl-card"
      size="small"
      styles={{ body: { padding: 16 } }}
      hoverable
    >
      <div className="tpl-card__head">
        <span className="tpl-card__fw" style={{ background: color }}>{item.framework}</span>
        <Text strong className="tpl-card__name">{item.name}</Text>
      </div>
      <div className="tpl-card__cat">{item.category}</div>
      <Paragraph type="secondary" className="tpl-card__desc">{item.desc}</Paragraph>

      <ul className="tpl-card__feats">
        {item.features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>

      <div className="tpl-card__tags">
        {item.tags.map((t) => (
          <Tag key={t} bordered={false} className="tpl-card__tag">{t}</Tag>
        ))}
      </div>

      <div className="tpl-card__foot">
        {item.upstream ? (
          <a className="tpl-card__link" href={item.upstream} target="_blank" rel="noreferrer">
            <GithubOutlined /> 查看上游仓库
          </a>
        ) : (
          <Tooltip title={item.derived ? '本地派生项目，无独立公开仓库' : '公开开源模板，无独立仓库地址'}>
            <span className="tpl-card__link tpl-card__link--disabled">
              <BranchesOutlined /> {item.derived ? '同基座衍生（本地）' : '开源模板（本地）'}
            </span>
          </Tooltip>
        )}
      </div>
    </Card>
  )
}

