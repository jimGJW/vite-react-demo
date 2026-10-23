import { Card, Tabs, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import VirtualScrollCase from './VirtualScrollCase.jsx'
import FpsCase from './FpsCase.jsx'
import WorkerCase from './WorkerCase.jsx'
import RerenderCase from './RerenderCase.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const { Title, Paragraph } = Typography

/**
 * 性能实验室演示页。
 * 四个实验都做成「当场能验证」的形式：不靠文字描述性能差异，
 * 而是把 DOM 行数、帧率、动画是否卡住直接摆出来。
 */
export default function PerfLabDemo() {
  const { t } = useI18n()
  /* Tabs 配置：children 是稳定节点，这里只用 t() 取标签，每次渲染重建代价可忽略 */
  const TAB_ITEMS = [
    { key: 'list', label: t('perf.tab.list'), children: <VirtualScrollCase /> },
    { key: 'fps', label: t('perf.tab.fps'), children: <FpsCase /> },
    { key: 'worker', label: t('perf.tab.worker'), children: <WorkerCase /> },
    { key: 'rerender', label: t('perf.tab.rerender'), children: <RerenderCase /> },
  ]

  return (
    <div className="perf-lab">
      <header className="perf-lab__header page-hero">
        <Title level={4} className="perf-lab__title">
          <ThunderboltOutlined /> {t('perf.title')}
        </Title>
        <Paragraph type="secondary" className="perf-lab__lead">
          {t('perf.lead1')}<code>src/components/PerfLab/</code>{t('perf.lead2')}
          <code> tests/unit/perf-lab.test.mjs</code>{t('perf.lead3')}{t('perf.lead4')}
        </Paragraph>
      </header>

      <Card size="small" className="perf-lab__card">
        <Tabs items={TAB_ITEMS} />
      </Card>
    </div>
  )
}
