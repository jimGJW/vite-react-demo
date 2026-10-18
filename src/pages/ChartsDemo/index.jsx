import { useCallback, useState } from 'react'
import {
  ChartCard, LineChart, BarChart, PieChart, GaugeChart, RadarChart,
  MultiLineChart, MultiBarChart, StackedBarChart, MultiPieChart,
  NestedPieChart, // 二级饼图（钻取 Drill-down）
  DrilledBarChart, // 二级柱状图（钻取 Drill-down）
  SwitchableChart, // 图标切换 折线/柱状/饼图
} from '@components/Charts/index.js'
import './index.scss'

import {  makeData } from './components/chartData.js'
import { useI18n } from '@i18n/index.js'

function ChartsDemo() {
  const { t } = useI18n()
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
          <h1>{t('charts.title')}</h1>
          <p>
            {t('charts.desc')}
          </p>
        </div>
        <div className="charts-demo-actions">
          <button type="button" className="btn" onClick={() => setLoading((v) => !v)}>
            {t(loading ? 'charts.showData' : 'charts.loadSkeleton')}
          </button>
          <button type="button" className="btn charts-demo-refresh" onClick={onRefresh}>
            <span>⟳</span>{t('charts.refresh')}
          </button>
        </div>
      </header>

      <div className="charts-demo-grid">
        <ChartCard key={`line-${refreshKey}`}>
          <LineChart
            data={data.line} height={300} unit=" 次"
            title={t('charts.lineTitle')} subtitle={t('charts.lineSubtitle')}
            description={t('charts.lineDesc')}
            legend loading={loading}
            actions={<button type="button" className="btn" onClick={onRefresh} aria-label="刷新">↻</button>}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`bar-${refreshKey}`}>
          <BarChart
            data={data.bar} height={300} unit=" 单位"
            title={t('charts.barTitle')} subtitle={t('charts.barSubtitle')}
            description={t('charts.barDesc')}
            legend loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`pie-${refreshKey}`}>
          <PieChart
            data={data.pie} size={320} unit=" 访客"
            title={t('charts.pieTitle')} subtitle={t('charts.pieSubtitle')}
            description={t('charts.pieDesc')}
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`gauge-${refreshKey}`} className="charts-demo-card-sm">
          <GaugeChart
            value={data.gauge.value} max={data.gauge.max} size={240}
            label={t('charts.gaugeLabel')} unit="%" formatValue={(v) => `${v}`}
            title={t('charts.gaugeTitle')} subtitle={t('charts.gaugeSubtitle')}
            loading={loading}
          />
        </ChartCard>

        <ChartCard key={`radar-${refreshKey}`} className="charts-demo-card-sm">
          <RadarChart
            data={data.radar} size={320} unit=" 分"
            title={t('charts.radarTitle')} subtitle={t('charts.radarSubtitle')}
            description={t('charts.radarDesc')}
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        {/* —— 多维 / 二级图表 —— */}
        <ChartCard key={`mline-${refreshKey}`}>
          <MultiLineChart
            series={data.multiLine} height={300} unit=" 次"
            title={t('charts.mlineTitle')} subtitle={t('charts.mlineSubtitle')}
            description={t('charts.mlineDesc')}
            showLabel loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`mbar-${refreshKey}`}>
          <MultiBarChart
            series={data.multiBar} height={300} unit=" 单位"
            title={t('charts.mbarTitle')} subtitle={t('charts.mbarSubtitle')}
            description={t('charts.mbarDesc')}
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`stack-${refreshKey}`}>
          <StackedBarChart
            series={data.stacked} height={300} unit=" 单位"
            title={t('charts.stackTitle')} subtitle={t('charts.stackSubtitle')}
            description={t('charts.stackDesc')}
            showLabel loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`mpie-${refreshKey}`} className="charts-demo-card-sm">
          <MultiPieChart
            groups={data.multiPie} size={240} unit=" 访客"
            title={t('charts.mpieTitle')} subtitle={t('charts.mpieSubtitle')}
            description={t('charts.mpieDesc')}
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`npie-${refreshKey}`} className="charts-demo-card-sm">
          <NestedPieChart
            data={data.drillRegionChannel} size={320} unit=" 单" donut showLabel
            title={t('charts.npieTitle')} subtitle={t('charts.npieSubtitle')}
            description={t('charts.npieDesc')}
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        <ChartCard key={`dbar-${refreshKey}`} className="charts-demo-card-sm">
          <DrilledBarChart
            data={data.drillCategoryMonth} height={300} unit=" 件" showLabel
            title={t('charts.dbarTitle')} subtitle={t('charts.dbarSubtitle')}
            description={t('charts.dbarDesc')}
            loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        {/* —— 图标切换类型 —— */}
        <ChartCard key={`sw1-${refreshKey}`}>
          <SwitchableChart
            data={data.line} types={['line', 'bar', 'pie']} defaultType="line"
            unit=" 次" height={300} size={280}
            title={t('charts.sw1Title')} subtitle={t('charts.sw1Subtitle')}
            description={t('charts.sw1Desc')}
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
            title={t('charts.sw2Title')} subtitle={t('charts.sw2Subtitle')}
            description={t('charts.sw2Desc')}
            showLegend loading={loading}
            onPointClick={(item) => setPicked(item)}
          />
        </ChartCard>

        {/* ChartCard 包装自定义内容示例 */}
        <ChartCard
          title={t('charts.cardTitle')}
          subtitle={t('charts.cardSubtitle')}
          description={t('charts.cardDesc')}
        >
          <div className="charts-demo-stats">
            <div className="charts-demo-stat">
              <span className="charts-demo-stat-value">
                {data.line.reduce((s, d) => s + d.value, 0).toLocaleString()}
              </span>
              <span className="charts-demo-stat-label">{t('charts.statWeek')}</span>
            </div>
            <div className="charts-demo-stat">
              <span className="charts-demo-stat-value">{data.gauge.value}%</span>
              <span className="charts-demo-stat-label">{t('charts.statRate')}</span>
            </div>
            <div className="charts-demo-stat">
              <span className="charts-demo-stat-value">{data.bar.length}</span>
              <span className="charts-demo-stat-label">{t('charts.statMonths')}</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {picked && (
        <div className="charts-demo-picked">
          {t('charts.pickedPrefix')}<b>{picked.label}</b> = {picked.value}
          {picked.pct != null ? t('charts.pickedPct', { pct: (picked.pct * 100).toFixed(1) }) : ''}
          <button type="button" className="btn" onClick={() => setPicked(null)}>{t('charts.clear')}</button>
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
          {t('charts.footTip')}
        </span>
      </footer>
    </div>
  )
}

export default ChartsDemo
