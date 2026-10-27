import { useMemo, useState } from 'react'
import {
  Button, Card, Col, Empty, Input, Modal, Row, Segmented, Space, Table, Tabs, Tag, Typography, message,
} from 'antd'
import { CopyOutlined, FireOutlined, SearchOutlined } from '@ant-design/icons'
import { ChatBot, createMockApi } from '@components/ChatBot/index.js'
import { NewMark } from '@components/Changelog/NewMark.jsx'
import { useI18n, pickText } from '@i18n/index.js'
import { KNOWLEDGE, FRAMEWORKS, PROMPTS } from './agentData.js'
import { agentAnswers } from './agentAnswers.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

const CAT_META = {
  frontend: { color: 'blue' },
  backend: { color: 'purple' },
  protocol: { color: 'cyan' },
  framework: { color: 'orange' },
}

export default function AgentLab() {
  const { lang, t } = useI18n()

  /* —— ChatBot：注入 Agent 主题 mock 后端（useMemo 固定引用，避免重建会话） —— */
  const api = useMemo(() => createMockApi({ answers: agentAnswers }), [])

  /* —— 知识点：分类筛选 + 搜索 + 详情弹窗 —— */
  const [cat, setCat] = useState('all')
  const [kw, setKw] = useState('')
  const [active, setActive] = useState(null)

  const catOptions = [
    { label: t('agent.filterAll'), value: 'all' },
    { label: t('agent.filterFrontend'), value: 'frontend' },
    { label: t('agent.filterBackend'), value: 'backend' },
    { label: t('agent.filterProtocol'), value: 'protocol' },
    { label: t('agent.filterFramework'), value: 'framework' },
  ]

  const filtered = useMemo(() => {
    const q = kw.trim().toLowerCase()
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

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(t('agent.copied'))
    } catch {
      message.error(t('agent.copyFail'))
    }
  }

  /* —— 框架对比表列（本地化取词） —— */
  const fwColumns = [
    { title: t('agent.colName'), dataIndex: 'name', key: 'name', width: 190, render: (v) => <Text strong>{v}</Text> },
    { title: t('agent.colKind'), dataIndex: 'kind', key: 'kind', width: 150, render: (v) => pickText(v, lang) },
    { title: t('agent.colLang'), dataIndex: 'lang', key: 'lang', width: 110, render: (v) => <Text code>{v}</Text> },
    { title: t('agent.colHighlight'), dataIndex: 'highlight', key: 'highlight', render: (v) => pickText(v, lang) },
    { title: t('agent.colScene'), dataIndex: 'scene', key: 'scene', width: 170, render: (v) => pickText(v, lang) },
  ]

  const kpis = [
    { n: KNOWLEDGE.length, label: t('agent.kpiKnowledge') },
    { n: KNOWLEDGE.filter((k) => k.cat === 'protocol').length, label: t('agent.kpiProtocol') },
    { n: FRAMEWORKS.length, label: t('agent.kpiFramework') },
    { n: PROMPTS.length, label: t('agent.kpiPrompt') },
  ]

  const recommend = [t('agent.rec1'), t('agent.rec2'), t('agent.rec3'), t('agent.rec4')]

  /* —— 页签：知识点 / 框架对比 / 提示词模板 —— */
  const tabItems = [
    {
      key: 'knowledge',
      label: t('agent.tabKnowledge'),
      children: (
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
                  <Card
                    key={k.id}
                    size="small"
                    hoverable
                    className={`agent-lab__card ${active?.id === k.id ? 'is-active' : ''}`}
                    onClick={() => setActive(k)}
                  >
                    <div className="agent-lab__card-head">
                      <span className="agent-lab__card-name">{pickText(k.name, lang)}</span>
                      {k.hot ? <Tag className="agent-lab__hot" color="volcano" icon={<FireOutlined />}>{t('agent.hot')}</Tag> : null}
                    </div>
                    <div className="agent-lab__card-alias">
                      <Tag color={CAT_META[k.cat].color}>{t(`agent.cat-${k.cat}`)}</Tag>
                      {k.alias ? <Text type="secondary" code style={{ fontSize: 12 }}>{k.alias}</Text> : null}
                    </div>
                    <Paragraph type="secondary" className="agent-lab__card-desc" ellipsis={{ rows: 2 }}>
                      {pickText(k.desc, lang)}
                    </Paragraph>
                  </Card>
                ))}
              </div>
            )}
          </Space>
        </div>
      ),
    },
    {
      key: 'frameworks',
      label: t('agent.tabFrameworks'),
      children: (
        <Table
          size="small"
          pagination={false}
          dataSource={FRAMEWORKS}
          rowKey="id"
          columns={fwColumns}
          scroll={{ x: 640 }}
        />
      ),
    },
    {
      key: 'prompts',
      label: t('agent.tabPrompts'),
      children: (
        <div className="agent-lab__prompts">
          {PROMPTS.map((p) => (
            <Card
              key={p.id}
              size="small"
              title={pickText(p.name, lang)}
              extra={
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => copyText(pickText(p.text, lang))}
                >
                  {t('agent.copy')}
                </Button>
              }
            >
              <Paragraph type="secondary" style={{ marginBottom: 8 }}>{pickText(p.scene, lang)}</Paragraph>
              <pre className="agent-lab__prompt-text">{pickText(p.text, lang)}</pre>
            </Card>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="agent-lab">
      <div className="agent-lab__head page-hero">
        <Title level={3} style={{ marginBottom: 6 }}>
          {t('agent.title')} <NewMark route="/agent-lab" />
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 10 }}>{t('agent.desc')}</Paragraph>
        <Space wrap size={6} style={{ marginBottom: 4 }}>
          {kpis.map((k) => (
            <Tag key={k.label} color="geekblue">{`${k.label} · ${k.n}`}</Tag>
          ))}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={13}>
          <ChatBot
            api={api}
            title={t('agent.chatTitle')}
            subtitle={t('agent.chatSubtitle')}
            height={680}
            recommend={recommend}
          />
        </Col>
        <Col xs={24} xl={11}>
          <Card size="small" className="agent-lab__panel">
            <Tabs items={tabItems} size="small" />
          </Card>
        </Col>
      </Row>

      <Modal
        open={!!active}
        onCancel={() => setActive(null)}
        footer={<Button type="primary" onClick={() => setActive(null)}>{t('agent.close')}</Button>}
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
