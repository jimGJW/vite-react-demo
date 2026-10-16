import { useMemo, useState } from 'react'
import {  Typography, Segmented, Empty } from 'antd'
import {  AppstoreOutlined } from '@ant-design/icons'
import { TEMPLATES, GROUPS } from '../../components/Templates/index.js'
import { useI18n } from '../../i18n/index.js'
import './TemplatesDemo.scss'

const { Title, Paragraph } = Typography

/* 各分组计数（与过滤无关，始终展示全量统计） */
const GROUP_COUNTS = GROUPS.map((g) => ({
  ...g,
  count: g.key === 'all' ? TEMPLATES.length : TEMPLATES.filter((t) => t.group === g.key).length,
}))


import { TemplateCard } from './components/templateCard.jsx'

export default function TemplatesDemo() {
  const { t } = useI18n()
  const [group, setGroup] = useState('all')

  const list = useMemo(
    () => (group === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.group === group)),
    [group],
  )

  return (
    <div className="templates-demo">
      <div className="templates-demo__header">
        <Title level={3} style={{ marginBottom: 4 }}>
          <AppstoreOutlined /> {t('templates.page.title')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('templates.page.descLead', { count: TEMPLATES.length })}
          {t('templates.page.descTail')}
        </Paragraph>
        <div className="templates-demo__stats">
          {GROUP_COUNTS.map((g) => (
            <span key={g.key} className="templates-demo__stat">
              <b>{g.count}</b> {t(`templates.groups.${g.labelKey}`)}
            </span>
          ))}
        </div>
      </div>

      <div className="templates-demo__filter">
        <Segmented
          options={GROUPS.map((g) => ({ label: t(`templates.groups.${g.labelKey}`), value: g.key }))}
          value={group}
          onChange={setGroup}
        />
      </div>

      {list.length === 0 ? (
        <Empty description={t('templates.empty')} />
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
