import { Card, Col, Row, Space, Tag, Typography } from 'antd'
import { Tabs } from 'antd'
import { useMemo } from 'react'
import { ChatBot, createMockApi } from '@components/ChatBot/index.js'
import { NewMark } from '@components/Changelog/NewMark.jsx'
import { useI18n } from '@i18n/index.js'
import CompareLab from './components/CompareLab.jsx'
import FrameworkTab from './components/FrameworkTab.jsx'
import KnowledgeTab from './components/KnowledgeTab.jsx'
import PromptTab from './components/PromptTab.jsx'
import { FRAMEWORKS, KNOWLEDGE, PROMPTS } from './agentData.js'
import { agentAnswers } from './agentAnswers.js'
import './index.scss'

const { Title, Paragraph } = Typography

/**
 * AI Agent 实验室（薄编排层）
 * ===============================================================
 * - 左侧：ChatBot（注入 Agent 主题 mock 后端，api 引用 useMemo 固定）
 * - 右上：知识点 / 框架对比 / 提示词模板三页签（组件各自内聚状态）
 * - 下方：对比实验室（流式通道 × 渲染形态 × 思考链，多方案并排真机演示）
 * 所有区块解耦：本文件只做组合与 KPI 汇总，不含任何业务状态。
 */
export default function AgentLab() {
  const { t } = useI18n()

  /* ChatBot 的 mock api 引用必须稳定，否则每次渲染重建会话 */
  const api = useMemo(() => createMockApi({ answers: agentAnswers }), [])

  const recommend = useMemo(
    () => [t('agent.rec1'), t('agent.rec2'), t('agent.rec3'), t('agent.rec4')],
    [t],
  )

  const kpis = useMemo(() => [
    { n: KNOWLEDGE.length, label: t('agent.kpiKnowledge') },
    { n: KNOWLEDGE.filter((k) => k.cat === 'protocol').length, label: t('agent.kpiProtocol') },
    { n: FRAMEWORKS.length, label: t('agent.kpiFramework') },
    { n: PROMPTS.length, label: t('agent.kpiPrompt') },
  ], [t])

  const tabItems = useMemo(() => [
    { key: 'knowledge', label: t('agent.tabKnowledge'), children: <KnowledgeTab /> },
    { key: 'frameworks', label: t('agent.tabFrameworks'), children: <FrameworkTab /> },
    { key: 'prompts', label: t('agent.tabPrompts'), children: <PromptTab /> },
  ], [t])

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
            <Tabs items={tabItems} size="small" destroyInactiveTabPane />
          </Card>
        </Col>
      </Row>

      <CompareLab />
    </div>
  )
}
