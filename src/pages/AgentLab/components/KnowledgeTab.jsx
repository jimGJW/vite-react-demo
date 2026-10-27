import { Card, Empty, Input, Modal, Segmented, Space, Tag, Typography } from 'antd'
import { memo, useCallback, useMemo, useState } from 'react'
import { FireOutlined, SearchOutlined } from '@ant-design/icons'
import { useI18n, pickText } from '@i18n/index.js'
import { KNOWLEDGE } from '../agentData.js'

const { Paragraph, Text } = Typography

const CAT_META = {
  frontend: { color: 'blue' },
  backend: { color: 'purple' },
  protocol: { color: 'cyan' },
  framework: { color: 'orange' },
}

/** 知识卡片（memo 化：筛选/搜索时未命中变化的卡片不重渲染） */
const TopicCard = memo(function TopicCard({ topic, lang, active, onOpen }) {
  const t = useI18n().t
  return (
    <Card
      size="small"
      hoverable
      className={`agent-lab__card ${active ? 'is-active' : ''}`}
      onClick={() => onOpen(topic)}
    >
      <div className="agent-lab__card-head">
        <span className="agent-lab__card-name">{pickText(topic.name, lang)}</span>
        {topic.hot ? <Tag className="agent-lab__hot" color="volcano" icon={<FireOutlined />}>{t('agent.hot')}</Tag> : null}
      </div>
      <div className="agent-lab__card-alias">
        <Tag color={CAT_META[topic.cat].color}>{t(`agent.cat-${topic.cat}`)}</Tag>
        {topic.alias ? <Text type="secondary" code style={{ fontSize: 12 }}>{topic.alias}</Text> : null}
      </div>
      <Paragraph type="secondary" className="agent-lab__card-desc" ellipsis={{ rows: 2 }}>
        {pickText(topic.desc, lang)}
      </Paragraph>
    </Card>
  )
})

/** 知识点页签：分类筛选 + 搜索 + 详情弹窗，状态完全内聚 */
function KnowledgeTab() {
  const { lang, t } = useI18n()
  const [cat, setCat] = useState('all')
  const [kw, setKw] = useState('')
  const [active, setActive] = useState(null)

  const catOptions = useMemo(() => [
    { label: t('agent.filterAll'), value: 'all' },
    { label: t('agent.filterFrontend'), value: 'frontend' },
    { label: t('agent.filterBackend'), value: 'backend' },
    { label: t('agent.filterProtocol'), value: 'protocol' },
    { label: t('agent.filterFramework'), value: 'framework' },
  ], [t])

  const filtered = useMemo(() => {
    const q = kw.trim().toLowerCase()
    if (!q && cat === 'all') return KNOWLEDGE
    return KNOWLEDGE.filter((k) => {
      if (cat !== 'all' && k.cat !== cat) return false
      if (!q) return true
      const hay = [
        pickText(k.name, lang),
        k.alias,
        pickText(k.desc, lang),
        ...k.points.map((p) => pickText(p, lang)),
      ].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [cat, kw, lang])

  const onClose = useCallback(() => setActive(null), [])

  return (
    <div className="agent-lab__knowledge">
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Segmented block options={catOptions} value={cat} onChange={setCat} />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t('agent.searchPlaceholder')}
          value={kw}
          onChange={(e) => setKw(e.target.value)}
        />
        {filtered.length === 0 ? (
          <Empty description={t('agent.empty')} />
        ) : (
          <div className="agent-lab__grid">
            {filtered.map((k) => (
              <TopicCard key={k.id} topic={k} lang={lang} active={active?.id === k.id} onOpen={setActive} />
            ))}
          </div>
        )}
      </Space>

      <Modal
        open={!!active}
        onCancel={onClose}
        footer={null}
        title={active ? (
          <Space wrap>
            <span>{pickText(active.name, lang)}</span>
            {active.alias ? <Text code>{active.alias}</Text> : null}
            <Tag color={CAT_META[active.cat].color}>{t(`agent.cat-${active.cat}`)}</Tag>
          </Space>
        ) : null}
        width={560}
      >
        {active ? (
          <>
            <Paragraph type="secondary">{pickText(active.desc, lang)}</Paragraph>
            <ul className="agent-lab__points">
              {active.points.map((p, i) => (
                <li key={i}>{pickText(p, lang)}</li>
              ))}
            </ul>
          </>
        ) : null}
      </Modal>
    </div>
  )
}

export default memo(KnowledgeTab)
