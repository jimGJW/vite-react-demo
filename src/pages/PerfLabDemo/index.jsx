import { Card, Tabs, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import VirtualScrollCase from './VirtualScrollCase.jsx'
import FpsCase from './FpsCase.jsx'
import WorkerCase from './WorkerCase.jsx'
import RerenderCase from './RerenderCase.jsx'
import './index.scss'

const { Title, Paragraph } = Typography

/* 模块级常量：Tabs 配置每次渲染都一样，没必要重建 */
const TAB_ITEMS = [
  { key: 'list', label: '虚拟滚动', children: <VirtualScrollCase /> },
  { key: 'fps', label: '帧率监测', children: <FpsCase /> },
  { key: 'worker', label: 'Web Worker', children: <WorkerCase /> },
  { key: 'rerender', label: '重渲染优化', children: <RerenderCase /> },
]

/**
 * 性能实验室演示页。
 * 四个实验都做成「当场能验证」的形式：不靠文字描述性能差异，
 * 而是把 DOM 行数、帧率、动画是否卡住直接摆出来。
 */
export default function PerfLabDemo() {
  return (
    <div className="perf-lab">
      <header className="perf-lab__header">
        <Title level={4} className="perf-lab__title">
          <ThunderboltOutlined /> 性能实验室 PerfLab
        </Title>
        <Paragraph type="secondary" className="perf-lab__lead">
          四个可当场验证的性能实验：10 万行列表、实时帧率、Web Worker 分流、重渲染优化。
          底层能力收敛在 <code>src/components/PerfLab/</code>，纯函数部分由
          <code> tests/unit/perf-lab.test.mjs</code> 覆盖，不用开浏览器也能验证边界。
        </Paragraph>
      </header>

      <Card size="small" className="perf-lab__card">
        <Tabs items={TAB_ITEMS} />
      </Card>
    </div>
  )
}
