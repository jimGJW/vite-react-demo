<template>
  <!-- 纯 SVG 图表：零依赖，line / area / bar / donut / sparkline -->
  <div class="m-chart">
    <svg v-if="type !== 'donut'" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="m-chart__svg">
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.35" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- 网格线 -->
      <g v-if="showGrid" class="m-chart__grid">
        <line v-for="g in 4" :key="g" :x1="0" :x2="W" :y1="(H / 4) * g" :y2="(H / 4) * g" />
      </g>

      <!-- 折线 / 面积 -->
      <template v-if="type === 'line' || type === 'area' || type === 'sparkline'">
        <path v-if="type === 'area'" :d="areaPath" :fill="`url(#${gradId})`" stroke="none" />
        <path :d="linePath" fill="none" :stroke="color" :stroke-width="type === 'sparkline' ? 1.5 : 2"
          stroke-linejoin="round" stroke-linecap="round" />
        <circle v-for="(p, i) in points" :key="i" :cx="p.x" :cy="p.y" :r="2.5" :fill="color" />
      </template>

      <!-- 柱状 -->
      <template v-if="type === 'bar'">
        <rect v-for="(p, i) in bars" :key="i" :x="p.x" :y="p.y" :width="p.w" :height="p.h"
          :fill="color" rx="2" opacity="0.85" />
      </template>
    </svg>

    <!-- 环形 -->
    <svg v-else :viewBox="`0 0 120 120`" class="m-chart__svg m-chart__svg--donut">
      <circle cx="60" cy="60" :r="R" fill="none" stroke="#f0f2f5" stroke-width="16" />
      <circle
        v-for="(seg, i) in donutSegments" :key="i"
        cx="60" cy="60" :r="R" fill="none"
        :stroke="seg.color" stroke-width="16" stroke-linecap="butt"
        :stroke-dasharray="`${seg.len} ${CIRC - seg.len}`"
        :stroke-dashoffset="-seg.offset"
        :transform="`rotate(-90 60 60)`"
      />
      <text x="60" y="58" text-anchor="middle" class="m-chart__center">{{ centerText }}</text>
      <text x="60" y="74" text-anchor="middle" class="m-chart__center-sub">{{ centerSub }}</text>
    </svg>

    <ul v-if="type === 'donut' && legend" class="m-chart__legend">
      <li v-for="(seg, i) in donutSegments" :key="i">
        <i :style="{ background: seg.color }" /> {{ seg.label }}
        <span class="m-metric">{{ seg.value }}</span>
      </li>
    </ul>

    <ul v-else-if="labels?.length" class="m-chart__axis">
      <li v-for="(l, i) in labels" :key="i">{{ l }}</li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'line' }, // line | area | bar | donut | sparkline
  data: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
  color: { type: String, default: '#409eff' },
  height: { type: Number, default: 120 },
  showGrid: { type: Boolean, default: true },
  legend: { type: Boolean, default: true },
  centerText: { type: String, default: '' },
  centerSub: { type: String, default: '' },
})

const W = 300
const R = 46
const CIRC = 2 * Math.PI * R

const gradId = `mg-${Math.random().toString(36).slice(2, 8)}`
const H = computed(() => props.height)

const values = computed(() => props.data.map((d) => (typeof d === 'number' ? d : Number(d.value) || 0)))
const max = computed(() => (Math.max(1, ...values.value) * 1.12))
const min = computed(() => Math.min(0, ...values.value))

const points = computed(() => {
  const n = values.value.length
  const span = max.value - min.value || 1
  const step = n > 1 ? W / (n - 1) : W
  return values.value.map((v, i) => ({
    x: n > 1 ? i * step : W / 2,
    y: H.value - ((v - min.value) / span) * (H.value - 8) - 4,
    v,
  }))
})

const linePath = computed(() => points.value
  .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
  .join(' '))

const areaPath = computed(() => {
  if (!points.value.length) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `${linePath.value} L${last.x.toFixed(2)},${H.value} L${first.x.toFixed(2)},${H.value} Z`
})

const bars = computed(() => {
  const n = values.value.length || 1
  const span = max.value - min.value || 1
  const slot = W / n
  const w = Math.max(2, slot * 0.62)
  return values.value.map((v, i) => {
    const h = ((v - min.value) / span) * (H.value - 8)
    return { x: i * slot + (slot - w) / 2, y: H.value - h - 2, w, h: Math.max(1, h) }
  })
})

const PALETTE = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#8e44ad']

const donutSegments = computed(() => {
  const total = values.value.reduce((a, b) => a + b, 0) || 1
  let offset = 0
  return props.data.map((d, i) => {
    const value = values.value[i]
    const len = (value / total) * CIRC
    const seg = {
      label: (typeof d === 'object' && d.label) || props.labels[i] || `项 ${i + 1}`,
      value,
      color: (typeof d === 'object' && d.color) || PALETTE[i % PALETTE.length],
      len,
      offset,
    }
    offset += len
    return seg
  })
})
</script>

<style scoped>
.m-chart__svg { width: 100%; display: block; overflow: visible; }
.m-chart__svg--donut { max-width: 150px; margin: 0 auto; }
.m-chart__grid line { stroke: #f0f2f5; stroke-width: 1; stroke-dasharray: 3 4; }
.m-chart__center { font-size: 18px; font-weight: 700; fill: #303133; }
.m-chart__center-sub { font-size: 9px; fill: #909399; }
.m-chart__axis {
  list-style: none; display: flex; justify-content: space-between;
  margin: 6px 0 0; padding: 0; font-size: 10px; color: #a8abb2;
}
.m-chart__legend { list-style: none; margin: 10px 0 0; padding: 0; font-size: 12px; color: #606266; }
.m-chart__legend li { display: flex; align-items: center; gap: 6px; padding: 2px 0; }
.m-chart__legend i { width: 8px; height: 8px; border-radius: 2px; }
.m-chart__legend span { margin-left: auto; }
</style>
