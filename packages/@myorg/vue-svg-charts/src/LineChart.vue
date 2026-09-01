<script setup>
import { ref, computed, useId } from 'vue'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, DEFAULT_FORMAT,
} from './shared.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
  height: { type: Number, default: 300 },
  color: { type: String, default: 'var(--c-primary, #4f46e5)' },
  formatValue: { type: Function, default: DEFAULT_FORMAT },
  unit: { type: String, default: '' },
  className: { type: String, default: '' },
  title: [String, Object], subtitle: [String, Object],
  description: [String, Object], actions: [Object, Array],
  emptyText: String, loading: { type: Boolean, default: false },
  legend: { type: Boolean, default: false },
  showLabel: { type: Boolean, default: false },
  showAxis: { type: Boolean, default: true },
  showGrid: { type: Boolean, default: true },
  showTitle: { type: Boolean, default: true },
})
const emit = defineEmits(['point-click'])

const mounted = useMounted()
const hover = ref(-1)
const rawId = useId()
const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')
const gradId = `lc-fill-${uid}`

const W = 600, padL = 44, padR = 18, padT = 16, padB = 30
const plotW = W - padL - padR
const H = computed(() => props.height)
const plotH = computed(() => H.value - padT - padB)
const baseY = computed(() => padT + plotH.value)

const geom = computed(() => {
  const data = props.data
  if (!data.length) return null
  const values = data.map((d) => d.value)
  const { niceMin, niceMax, step } = niceBounds(Math.min(...values), Math.max(...values))
  const span = niceMax - niceMin || 1
  const ph = plotH.value, by = baseY.value
  const xAt = (i) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const yAt = (v) => padT + ph - ((v - niceMin) / span) * ph
  const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value), ...d }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const areaPath = pts.length > 1 ? `${linePath} L${pts[pts.length - 1].x.toFixed(2)},${by} L${pts[0].x.toFixed(2)},${by} Z` : ''
  const lineLen = pts.reduce((s, p, i) => (i === 0 ? 0 : s + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)), 0)
  const band = plotW / Math.max(data.length, 1)
  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(v)
  return { niceMin, niceMax, span, pts, linePath, areaPath, lineLen, band, ticks, yAt }
})

const tip = computed(() => geom.value && hover.value >= 0 ? geom.value.pts[hover.value] : null)
const legendItems = computed(() => props.legend && geom.value ? props.data.map((d) => ({ label: d.label, value: props.formatValue(d.value) + props.unit, color: props.color })) : [])
</script>

<template>
  <div :class="`chart chart-line ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="height" />
    <ChartEmpty v-else-if="!data.length" :text="emptyText" />
    <div v-else class="chart-canvas">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="折线图">
        <defs>
          <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="color" stop-opacity="0.34" />
            <stop offset="100%" :stop-color="color" stop-opacity="0" />
          </linearGradient>
        </defs>
        <template v-if="showGrid">
          <g v-for="(v, i) in geom.ticks" :key="`g${i}`">
            <line :x1="padL" :y1="geom.yAt(v)" :x2="W - padR" :y2="geom.yAt(v)" class="chart-grid" />
            <text v-if="showAxis" :x="padL - 8" :y="geom.yAt(v)" class="chart-axis-label" text-anchor="end" dominant-baseline="middle">{{ formatValue(v) }}</text>
          </g>
        </template>
        <template v-if="showAxis">
          <text v-for="(p, i) in geom.pts" :key="`a${i}`" :x="p.x" :y="H - 8" class="chart-axis-label" text-anchor="middle">{{ p.label }}</text>
        </template>
        <path v-if="geom.areaPath" :d="geom.areaPath" :fill="`url(#${gradId})`" :class="`chart-area ${mounted ? 'is-in' : ''}`" />
        <path v-if="geom.linePath" :d="geom.linePath" fill="none" :stroke="color" class="chart-line-path" :style="{ strokeDasharray: geom.lineLen || 1, strokeDashoffset: mounted ? 0 : (geom.lineLen || 1) }" />
        <template v-if="showLabel">
          <text v-for="(p, i) in geom.pts" :key="`l${i}`" :x="p.x" :y="p.y - 10" class="chart-data-label" text-anchor="middle">{{ formatValue(p.value) }}{{ unit }}</text>
        </template>
        <g v-for="(p, i) in geom.pts" :key="`p${i}`">
          <circle :cx="p.x" :cy="p.y" :r="hover === i ? 5 : 3.5" fill="#fff" :stroke="color" stroke-width="2" class="chart-dot" style="cursor: pointer" @click="emit('point-click', p, i)" />
          <rect :x="p.x - geom.band / 2" :y="padT" :width="geom.band" :height="plotH" fill="transparent" @mouseenter="hover = i" @mouseleave="hover = -1" @click="emit('point-click', p, i)" />
        </g>
      </svg>
      <Tooltip v-if="tip" :x="tip.x" :y="tip.y" :vb-w="W" :vb-h="H">
        <span class="chart-tip-label">{{ tip.label }}</span>
        <span class="chart-tip-value">{{ formatValue(tip.value) }}{{ unit }}</span>
      </Tooltip>
    </div>
    <LegendList v-if="legend" :items="legendItems" :hover="hover" @hover="hover = $event" />
  </div>
</template>
