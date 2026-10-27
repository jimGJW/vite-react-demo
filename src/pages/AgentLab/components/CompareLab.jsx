import { Card, Tabs } from 'antd'
import { memo } from 'react'
import { useI18n } from '@i18n/index.js'
import StreamChannelDemo from './demos/StreamChannelDemo.jsx'
import RenderModeDemo from './demos/RenderModeDemo.jsx'
import ThinkingDemo from './demos/ThinkingDemo.jsx'

/**
 * 对比实验室：同一能力 × 多种主流实现方式的并排真机演示。
 * 只负责页签编排；每个 demo 自管状态（挂载才运行，切走即销毁，不留后台定时器）。
 */
function CompareLab() {
  const { t } = useI18n()

  const items = [
    { key: 'stream', label: t('agent.demoStream'), children: <StreamChannelDemo /> },
    { key: 'render', label: t('agent.demoRender'), children: <RenderModeDemo /> },
    { key: 'thinking', label: t('agent.demoThinking'), children: <ThinkingDemo /> },
  ]

  return (
    <Card size="small" className="agent-lab__compare">
      <Tabs items={items} size="small" destroyInactiveTabPane />
    </Card>
  )
}

export default memo(CompareLab)
