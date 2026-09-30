<template>
  <div class="chart-page">
    <header class="page-header-vue">
      <h1>图表中心 · Charts</h1>
      <p>不引 ECharts 也能覆盖的常见图表：手写 SVG 的折线 / 面积 / 柱状 / 环形 / 迷你走势 + 数据下钻联动</p>
    </header>

    <section class="chart-card">
      <h3>选择数据维度（点击图例切换，联动下方所有图表）</h3>
      <div class="chart-row">
        <button
          v-for="m in metrics" :key="m.key"
          class="chart-metric" :class="{ 'is-active': metric === m.key }"
          type="button" @click="metric = m.key"
        >
          <span class="chart-metric__dot" :style="{ background: m.color }" />
          {{ m.label }}
          <b>{{ m.unit }}</b>
        </button>
        <button class="m-btn" type="button" @click="shuffle">随机造一批数据</button>
      </div>
    </section>

    <section class="chart-card">
      <h3>趋势（{{ currentMetric.label }}）</h3>
      <MChart :type="areaMode ? 'area' : 'line'" :data="liveData" :labels="days" :height="180" :color="currentMetric.color" />
      <div class="chart-row" style="margin-top: 10px">
        <label class="chart-switch">
          <input v-model="areaMode" type="checkbox" /> 面积模式
        </label>
        <span class="m-chip m-chip--info">合计 {{ formatNumber(total, 0) }}{{ currentMetric.unit }}</span>
        <span class="m-chip" :class="trend >= 0 ? 'm-chip--danger' : 'm-chip--ok'">
          {{ trend >= 0 ? '▲' : '▼' }} {{ Math.abs(trend).toFixed(1) }}% 环比
        </span>
        <span class="m-chip">峰值 {{ formatNumber(Math.max(...liveData), 0) }}{{ currentMetric.unit }}</span>
      </div>
    </section>

    <section class="chart-card">
      <h3>分布（环形）</h3>
      <div class="chart-grid2">
        <MChart type="donut" :data="donutData" center-text="100%" center-sub="占比合计" />
        <table class="chart-table">
          <thead><tr><th>渠道</th><th>数值</th><th>占比</th><th>进度</th></tr></thead>
          <tbody>
            <tr v-for="d in donutData" :key="d.label">
              <td><i class="chart-dot" :style="{ background: d.color }" />{{ d.label }}</td>
              <td class="chart-num">{{ d.value }}</td>
              <td class="chart-num">{{ ((d.value / donutTotal) * 100).toFixed(1) }}%</td>
              <td><ProgressRing :percent="(d.value / donutTotal) * 100" :size="40" :stroke="5" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="chart-card">
      <h3>分组柱状 + 排行</h3>
      <div class="chart-grid2">
        <MChart type="bar" :data="groupData" :labels="groupLabels" :height="170" color="#8e44ad" />
        <ol class="chart-rank">
          <li v-for="(g, i) in groupRanked" :key="g.label">
            <span class="chart-rank__no" :class="`is-top${i + 1}`">{{ i + 1 }}</span>
            <span class="chart-rank__label">{{ g.label }}</span>
            <span class="chart-rank__bar"><i :style="{ width: `${(g.value / groupMax) * 100}%` }" /></span>
            <span class="chart-num">{{ g.value }}</span>
          </li>
        </ol>
      </div>
    </section>

    <section class="chart-card">
      <h3>迷你走势（sparkline）</h3>
      <div class="chart-grid3">
        <MStatCard
          v-for="s in sparkCards" :key="s.title"
          :title="s.title" :value="s.value" :unit="s.unit"
          :trend="s.trend" :tone="s.tone" :spark="s.spark"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { MChart, MStatCard, ProgressRing } from '../components'
import { formatNumber } from '../utils'

const days = ['08-24', '08-25', '08-26', '08-27', '08-28', '08-29', '08-30']
const metrics = [
  { key: 'pv', label: '页面浏览', unit: '次', color: '#409eff' },
  { key: 'uv', label: '独立访客', unit: '人', color: '#67c23a' },
  { key: 'api', label: '接口调用', unit: '次', color: '#e6a23c' },
  { key: 'err', label: '错误数', unit: '次', color: '#f56c6c' },
]
const metric = ref('pv')
const areaMode = ref(true)

const SERIES = {
  pv: [3200, 4520, 3800, 5100, 6100, 7200, 6880],
  uv: [1200, 1450, 1380, 1610, 1820, 2010, 1980],
  api: [8400, 9200, 8800, 10300, 12400, 13800, 12900],
  err: [42, 31, 55, 28, 19, 24, 12],
}
const seed = ref(0)
const jitter = (i) => {
  if (!seed.value) return 0
  return Math.round(((i * 37 + seed.value * 13) % 17 - 8) * (seed.value / 4))
}
const currentMetric = computed(() => metrics.find((m) => m.key === metric.value))
const liveData = computed(() => SERIES[metric.value].map((v, i) => Math.max(0, v + jitter(i))))
const total = computed(() => liveData.value.reduce((a, b) => a + b, 0))
const trend = computed(() => {
  const d = liveData.value
  const first = d[0] || 1
  return ((d[d.length - 1] - first) / first) * 100
})
const shuffle = () => { seed.value = (seed.value + 1) % 7 }

const donutData = [
  { label: '自然搜索', value: 46, color: '#409eff' },
  { label: '直接访问', value: 28, color: '#67c23a' },
  { label: '外部链接', value: 18, color: '#e6a23c' },
  { label: '社交分享', value: 8, color: '#f56c6c' },
]
const donutTotal = donutData.reduce((a, b) => a + b.value, 0)

const groupLabels = ['周一', '周二', '周三', '周四', '周五']
const groupData = [86, 124, 98, 152, 118]
const groupRanked = computed(() => groupLabels
  .map((label, i) => ({ label, value: groupData[i] }))
  .sort((a, b) => b.value - a.value))
const groupMax = Math.max(...groupData)

const sparkCards = [
  { title: '签到率', value: 92, unit: '%', trend: 2.4, tone: 'ok', spark: [80, 84, 83, 88, 90, 91, 92] },
  { title: '平均停留', value: 186, unit: 's', trend: -6.1, tone: 'warn', spark: [220, 210, 205, 198, 192, 189, 186] },
  { title: '构建耗时', value: 33, unit: 's', trend: -18.9, tone: 'ok', spark: [52, 48, 44, 40, 36, 34, 33] },
  { title: '错误率', value: 0.6, unit: '%', trend: 0.2, tone: 'danger', spark: [0.2, 0.3, 0.35, 0.4, 0.5, 0.55, 0.6] },
]
</script>

<style scoped>
.chart-page { padding: 20px 24px 44px; }
.chart-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.chart-card h3 { margin: 0 0 12px; font-size: 15px; color: #303133; }
.chart-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.chart-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 14px; }
.chart-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }

.chart-metric {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid #dcdfe6; border-radius: 999px; background: #fff;
  padding: 5px 14px; font-size: 12.5px; color: #606266; cursor: pointer;
  transition: all 0.15s;
}
.chart-metric b { color: #c0c4cc; font-weight: 400; }
.chart-metric.is-active { border-color: #409eff; color: #409eff; background: #ecf5ff; }
.chart-metric__dot { width: 7px; height: 7px; border-radius: 50%; }
.chart-switch { font-size: 12.5px; color: #606266; display: inline-flex; align-items: center; gap: 4px; }

.chart-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.chart-table th, .chart-table td { text-align: left; padding: 7px 6px; border-bottom: 1px solid #f2f4f7; }
.chart-table th { color: #909399; font-weight: 600; font-size: 12px; }
.chart-num { font-variant-numeric: tabular-nums; color: #303133; }
.chart-dot { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 6px; }

.chart-rank { list-style: none; margin: 0; padding: 0; }
.chart-rank li { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12.5px; color: #606266; }
.chart-rank__no {
  width: 18px; height: 18px; border-radius: 4px; background: #f0f2f5; color: #909399;
  font-size: 11px; display: inline-flex; align-items: center; justify-content: center;
}
.chart-rank__no.is-top1 { background: #f56c6c; color: #fff; }
.chart-rank__no.is-top2 { background: #e6a23c; color: #fff; }
.chart-rank__no.is-top3 { background: #409eff; color: #fff; }
.chart-rank__label { width: 48px; }
.chart-rank__bar { flex: 1; height: 8px; border-radius: 4px; background: #f0f2f5; overflow: hidden; }
.chart-rank__bar i { display: block; height: 100%; background: linear-gradient(90deg, #409eff, #8e44ad); transition: width 0.3s; }
</style>
