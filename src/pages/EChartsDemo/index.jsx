import { useEffect, useRef, useState, useMemo } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  RadarComponent, DataZoomComponent, ToolboxComponent, MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Card, Segmented, Space, Tag, Typography } from 'antd'
import './index.scss'

echarts.use([
  BarChart, LineChart, PieChart, RadarChart, ScatterChart,
  TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  RadarComponent, DataZoomComponent, ToolboxComponent, MarkLineComponent,
  CanvasRenderer,
])

const { Title, Paragraph } = Typography

// 散点图演示数据：模块级生成一次，避免在 render 期调用 Math.random（React Compiler 纯度规则禁止）
const SCATTER_DATA = (() => {
  const d = []
  for (let i = 0; i < 50; i++) {
    d.push([
      +(Math.random() * 100).toFixed(2),
      +(Math.random() * 100).toFixed(2),
      +(Math.random() * 1000).toFixed(0),
    ])
  }
  return d
})()

/* —— 通用 Hook：挂载 echarts 实例，resize 自适应 —— */
function useChart(option) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    chartRef.current = echarts.init(ref.current)
    const onResize = () => chartRef.current?.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chartRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true })
  }, [option])

  return ref
}

/* —— 1. 柱状图 —— */
function BarChartCard() {
  const [stack, setStack] = useState(false)
  const option = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['产品A', '产品B', '产品C'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
    yAxis: { type: 'value' },
    series: [
      { name: '产品A', type: 'bar', data: [320, 332, 301, 334], itemStyle: { borderRadius: [4, 4, 0, 0] } },
      { name: '产品B', type: 'bar', data: [220, 182, 191, 234], itemStyle: { borderRadius: [4, 4, 0, 0] } },
      { name: '产品C', type: 'bar', data: [150, 232, 201, 154], itemStyle: { borderRadius: [4, 4, 0, 0] } },
    ].map(s => ({ ...s, stack: stack ? 'total' : undefined })),
  }), [stack])

  const ref = useChart(option)
  return (
    <Card
      title="柱状图 · 季度营收"
      extra={<Segmented options={[{ label: '分组', value: false }, { label: '堆叠', value: true }]} value={stack} onChange={setStack} />}
    >
      <div ref={ref} className="echart-box" />
    </Card>
  )
}

/* —— 2. 折线图 —— */
function LineChartCard() {
  const [smooth, setSmooth] = useState(true)
  const option = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际', '预测'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['周一','周二','周三','周四','周五','周六','周日'] },
    yAxis: { type: 'value' },
    series: [
      { name: '实际', type: 'line', data: [820, 932, 901, 934, 1290, 1330, 1320], smooth, areaStyle: { opacity: 0.15 } },
      { name: '预测', type: 'line', data: [620, 732, 701, 734, 1090, 1130, 1120], smooth, lineStyle: { type: 'dashed' } },
    ],
  }), [smooth])

  const ref = useChart(option)
  return (
    <Card
      title="折线图 · 周流量趋势"
      extra={<Segmented options={[{ label: '平滑', value: true }, { label: '折线', value: false }]} value={smooth} onChange={setSmooth} />}
    >
      <div ref={ref} className="echart-box" />
    </Card>
  )
}

/* —— 3. 饼图 —— */
function PieChartCard() {
  const [ring, setRing] = useState(true)
  const option = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      name: '访问来源',
      type: 'pie',
      radius: ring ? ['40%', '70%'] : '70%',
      data: [
        { value: 1048, name: '搜索引擎' },
        { value: 735, name: '直接访问' },
        { value: 580, name: '邮件营销' },
        { value: 484, name: '联盟广告' },
        { value: 300, name: '视频广告' },
      ],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
  }), [ring])

  const ref = useChart(option)
  return (
    <Card
      title="饼图 · 访问来源占比"
      extra={<Segmented options={[{ label: '环形', value: true }, { label: '饼图', value: false }]} value={ring} onChange={setRing} />}
    >
      <div ref={ref} className="echart-box" />
    </Card>
  )
}

/* —— 4. 雷达图 —— */
function RadarChartCard() {
  const option = useMemo(() => ({
    tooltip: {},
    legend: { data: ['预算分配', '实际开销'], top: 0 },
    radar: {
      indicator: [
        { name: '销售', max: 6500 },
        { name: '管理', max: 16000 },
        { name: '技术', max: 30000 },
        { name: '客服', max: 38000 },
        { name: '研发', max: 52000 },
        { name: '市场', max: 25000 },
      ],
    },
    series: [{
      type: 'radar',
      data: [
        { value: [4200, 8000, 20000, 35000, 50000, 18000], name: '预算分配' },
        { value: [5000, 14000, 28000, 31000, 42000, 21000], name: '实际开销' },
      ],
    }],
  }), [])

  const ref = useChart(option)
  return (
    <Card title="雷达图 · 预算 vs 开销">
      <div ref={ref} className="echart-box" />
    </Card>
  )
}

/* —— 5. 散点图 —— */
function ScatterChartCard() {
  const data = SCATTER_DATA

  const option = useMemo(() => ({
    tooltip: { formatter: (p) => `X: ${p.value[0]}<br/>Y: ${p.value[1]}<br/>值: ${p.value[2]}` },
    xAxis: { type: 'value', scale: true },
    yAxis: { type: 'value', scale: true },
    series: [{ type: 'scatter', data, symbolSize: (val) => val[2] / 12 + 8 }],
  }), [data])

  const ref = useChart(option)
  return (
    <Card title="散点图 · 气泡数据分布">
      <div ref={ref} className="echart-box" />
    </Card>
  )
}

/* —— 主页面 —— */
export default function EChartsDemo() {
  return (
    <div className="echarts-demo-page">
      <Typography>
        <Title level={2}>ECharts 图表演示</Title>
        <Paragraph type="secondary">
          基于 ECharts 6 + Ant Design 5 的数据可视化展示，支持实时交互切换图表样式。
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
