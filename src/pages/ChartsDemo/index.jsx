import { useCallback, useState } from 'react'
import {
  ChartCard, LineChart, BarChart, PieChart, GaugeChart, RadarChart,
  MultiLineChart, MultiBarChart, StackedBarChart, MultiPieChart,
  NestedPieChart, // 二级饼图（钻取 Drill-down）
  DrilledBarChart, // 二级柱状图（钻取 Drill-down）
  SwitchableChart, // 图标切换 折线/柱状/饼图
} from '../../components/Charts/index.js'
import './index.scss'

import {  makeData } from './components/chartData.js'

function ChartsDemo() {
  const [data, setData] = useState(makeData)
  // 刷新即重挂载图表，重放入场动画
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState(null)

  const onRefresh = useCallback(() => {
    setData(makeData())
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="page-card charts-demo">
      <header className="charts-demo-header">
        <div>
          <h1>SVG 图表组件</h1>
          <p>
            纯 React + 原生 SVG，零依赖可移植。统一开放
            title / subtitle / description / actions / legend / loading / onPointClick 等参数，
            样式全部带 fallback，复制到其他项目可直接使用。
          </p>
        </div>
        <div className="charts-demo-actions">
          <button type="button" className="btn" onClick={() => setLoading((v) => !v)}>
            {loading ? '显示数据' : '加载骨架'}
          </button>
          <button type="button" className="btn charts-demo-refresh" onClick={onRefresh}>
            <span>⟳</span>实时刷新
          </button>
        </div>
      </header>

      <div className="charts-demo-grid">
        <ChartCard key={`line-${refreshKey}`}>
          <LineChart
            data={data.line} height={300} unit=" 次"
            title="访问趋势" subtitle="最近 7 天日均访问量"
            description="渐变面积填充 + 描边绘制入场，悬停查看每日数据，点击选中"
            legend loading={loading}
            actions={<button type="button" className="btn" onClick={onRefresh} aria-label="刷新">↻</button>}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`bar-${refreshKey}`}>
          <BarChart
            data={data.bar} height={300} unit=" 单位"
            title="月度对比" subtitle="上半年各月产量"
            description="自底向上生长入场，点击柱体查看详情"
            legend loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`pie-${refreshKey}`}>
          <PieChart
            data={data.pie} size={320} unit=" 访客"
            title="流量来源" subtitle="各渠道占比"
            description="扇区 + 图例联动，悬停外推，点击扇区选中"
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`gauge-${refreshKey}`} className="charts-demo-card-sm">
          <GaugeChart
            value={data.gauge.value} max={data.gauge.max} size={240}
            label="目标达成" unit="%" formatValue={(v) => `${v}`}
            title="完成率" subtitle="本季度目标进度"
            loading={loading}
          />
        </ChartCard>

        <ChartCard key={`radar-${refreshKey}`} className="charts-demo-card-sm">
          <RadarChart
            data={data.radar} size={320} unit=" 分"
            title="多维评估" subtitle="产品能力雷达"
            description="网格环 + 数据多边形缩放入场，点击顶点查看维度"
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        {/* —— 多维 / 二级图表 —— */}
        <ChartCard key={`mline-${refreshKey}`}>
          <MultiLineChart
            series={data.multiLine} height={300} unit=" 次"
            title="多维趋势" subtitle="本季 / 上季 / 目标 三线对比"
            description="多系列折线，首系列渐变面积填充；开启 showLabel 演示数据标签"
            showLabel loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`mbar-${refreshKey}`}>
          <MultiBarChart
            series={data.multiBar} height={300} unit=" 单位"
            title="分组柱状" subtitle="各月三系列并列对比"
            description="同类别多系列并列柱，悬停高亮整系列；点击柱体选中"
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`stack-${refreshKey}`}>
          <StackedBarChart
            series={data.stacked} height={300} unit=" 单位"
            title="堆叠柱状" subtitle="各季度三系列累计堆叠"
            description="多系列自底向上累计堆叠；开启 showLabel 演示各段数值"
            showLabel loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`mpie-${refreshKey}`} className="charts-demo-card-sm">
          <MultiPieChart
            groups={data.multiPie} size={240} unit=" 访客"
            title="多组饼图" subtitle="三区域渠道占比并列"
            description="多个独立饼图共享图例；悬停联动高亮同色扇区"
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`npie-${refreshKey}`} className="charts-demo-card-sm">
          <NestedPieChart
            data={data.drillRegionChannel} size={320} unit=" 单" donut showLabel
            title="二级饼图" subtitle="点击扇区进入子级渠道"
            description="钻取 Drill-down：先显示区域一级扇区（带 ▾ 提示），点击后切换为该区域各渠道子级数据，返回按钮回到一级"
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`dbar-${refreshKey}`} className="charts-demo-card-sm">
          <DrilledBarChart
            data={data.drillCategoryMonth} height={300} unit=" 件" showLabel
            title="二级柱状图" subtitle="点击柱子进入子级月度"
            description="钻取 Drill-down：先显示品类一级柱子（带 ▾ 提示），点击后切换为该品类各月度子级数据，返回按钮回到一级"
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        {/* —— 图标切换类型 —— */}
        <ChartCard key={`sw1-${refreshKey}`}>
          <SwitchableChart
            data={data.line} types={['line', 'bar', 'pie']} defaultType="line"
            unit=" 次" height={300} size={280}
            title="图标切换图表 · 三色" subtitle="折线 / 柱状 / 饼图 来回切换"
            description="右上角图标按钮切换同一数据的显示类型；切换时自动重放对应图表的入场动画，颜色一致"
            showLabel loading={loading}
            onSwitch={(t) => console.log('切图:', t)}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`sw2-${refreshKey}`} className="charts-demo-card-sm">
          <SwitchableChart
            data={data.radar.map((r) => ({ label: r.label, value: r.value, max: r.max }))}
            types={['bar', 'pie', 'radar', 'line']} defaultType="radar"
            unit=" 分" height={280} size={280}
            title="图标切换图表 · 四选" subtitle="柱状 / 饼图 / 雷达 / 折线"
            description="同一份能力评估数据，四种视图任意切换；支持受控 type/onTypeChange，可与外部筛选器联动"
            showLegend loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        {/* ChartCard 包装自定义内容示例 */}
        <ChartCard
          title="ChartCard 通用容器"
          subtitle="可包装任意图表或自定义内容"
          description="上述每个图表都用 ChartCard 包裹以获得卡片背景；此卡展示纯自定义内容用法。"
        >
          <div className="charts-demo-stats">
            <div className="charts-demo-stat">
              <span className="charts-demo-stat-value">
                {data.line.reduce((s, d) => s + d.value, 0).toLocaleString()}
              </span>
              <span className="charts-demo-stat-label">周总访问</span>
            </div>
            <div className="charts-demo-stat">
              <span className="charts-demo-stat-value">{data.gauge.value}%</span>
              <span className="charts-demo-stat-label">完成率</span>
            </div>
            <div className="charts-demo-stat">
              <span className="charts-demo-stat-value">{data.bar.length}</span>
              <span className="charts-demo-stat-label">月份数</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {picked && (
        <div className="charts-demo-picked">
          已选中：<b>{picked.label}</b> = {picked.value}
          {picked.pct != null ? `（占比 ${(picked.pct * 100).toFixed(1)}%）` : ''}
          <button type="button" className="btn" onClick={() => setPicked(null)}>清除</button>
        </div>
      )}

      <footer className="charts-demo-foot">
        <code>
          import &#123; ChartCard, LineChart, BarChart, PieChart, GaugeChart, RadarChart,
          MultiLineChart, MultiBarChart, StackedBarChart, MultiPieChart,
          DrilledBarChart, NestedPieChart /&#42; 或别名 DrilledPieChart &#42;/,
          SwitchableChart, ChartTypeSwitch, ChartLineIcon, ChartBarIcon &#125; from '@/components/Charts'
        </code>
        <span className="charts-demo-tip">
          选中数据点可查看详情 · 「加载骨架」演示 loading 态 · 「实时刷新」重放动画 ·
          <b> 二级饼图/柱状图：点击一级进入子级返回上一级</b> ·
          <b> SwitchableChart：右上角折线/柱状/饼图/雷达图标一键来回切换</b>
        </span>
      </footer>
    </div>
  )
}

export default ChartsDemo
