import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  RadarComponent, DataZoomComponent, ToolboxComponent, MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {  Space, Tag, Typography } from 'antd'
import { useI18n } from '@i18n/index.js'
import './index.scss'

echarts.use([
  BarChart, LineChart, PieChart, RadarChart, ScatterChart,
  TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  RadarComponent, DataZoomComponent, ToolboxComponent, MarkLineComponent,
  CanvasRenderer,
])

const { Title, Paragraph } = Typography

// 散点图演示数据：模块级生成一次，避免在 render 期调用 Math.random（React Compiler 纯度规则禁止）

import {  BarChartCard, LineChartCard, PieChartCard, RadarChartCard, ScatterChartCard } from './components/echartsParts.jsx'

export default function EChartsDemo() {
  const { t } = useI18n()
  return (
    <div className="echarts-demo-page">
      <Typography>
        <Title level={2}>{t('echarts.title')}</Title>
        <Paragraph type="secondary">
          {t('echarts.subtitle')}
        </Paragraph>
      </Typography>

      <Space wrap className="echarts-tags">
        <Tag color="blue">Bar</Tag>
        <Tag color="green">Line</Tag>
        <Tag color="orange">Pie</Tag>
        <Tag color="purple">Radar</Tag>
        <Tag color="cyan">Scatter</Tag>
      </Space>

      <div className="echarts-grid">
        <BarChartCard />
        <LineChartCard />
        <PieChartCard />
        <RadarChartCard />
        <ScatterChartCard />
      </div>
    </div>
  )
}
