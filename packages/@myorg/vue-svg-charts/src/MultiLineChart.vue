<script setup>
import { ref, computed, useId } from 'vue'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.js'

/**
 * 多维折线图（多系列，首系列渐变面积填充）。
 * series: [{ name, color?, data: [{ label, value }] }]
 * hover: { s, i } | null；i = -1 表示由图例触发（仅高亮系列，不显示具体点 tooltip）
 */
const props = defineProps({
  series: { type: Array, default: () => [] },
  colors: { type: Array, default: () => PALETTE },
  height: { type: Number, default: 300 },
  formatValue: { type: Function, default: DEFAULT_FORMAT },
  unit: { type: String, default: '' },
  className: { type: String, default: '' },
  title: [String, Object], subtitle: [String, Object],
  description: [String, Object], actions: [Object, Array],
  emptyText: String, loading: { type: Boolean, default: false },
  showLabel: { type: Boolean, default: false },
  showLegend: { type: Boolean, default: true },
  showTitle: { type: Boolean, default: true },
})
const emit = defineEmits(['point-click'])

const mounted = useMounted()
const hover = ref(null)
const rawId = useId()
const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')

const W = 600, padL = 44, padR = 18, padT = 16, padB = 30
const plotW = W - padL - padR
const H = computed(() => props.height)
const plotH = computed(() => H.value - padT - padB)
const baseY = computed(() => padT + plotH.value)

const hasData = computed(
  () => props.series.length > 0 && Array.isArray(props.series[0]?.data) && props.series[0].data.length > 0,
)

const geom = computed(() => {
  if (!hasData.value) return null
  const series = props.series
  const labels = series[0].data.map((d) => d.label)
  const n = labels.length
  const allValues = series.flatMap((s) => s.data.map((d) => d.value))
  const { niceMin, niceMax, step } = niceBounds(Math.min(...allValues), Math.max(...allValues))
  const span = niceMax - niceMin || 1
  const xAt = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yAt = (v) => padT + plotH.value - ((v - niceMin) / span) * plotH.value
  const base = baseY.value

  const lines = series.map((s, si) => {
    const color = s.color || props.colors[si % props.colors.length]
    const pts = s.data.map((d, i) => ({ x: xAt(i), y: yAt(d.value), ...d }))
    const linePath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ')
    const areaPath = pts.length > 1
      ? `${linePath} L${pts[pts.length - 1].x.toFixed(2)},${base} L${pts[0].x.toFixed(2)},${base} Z`
      : ''
    const lineLen = pts.reduce(
      (acc, p, i) => (i === 0 ? 0 : acc + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)),
      0,
    )
    const sum = pts.reduce((acc, p) => acc + p.value, 0)
    return { si, name: s.name, color, pts, linePath, areaPath, lineLen, sum }
  })

  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push({ v, y: yAt(v) })
  const labelPts = labels.map((label, i) => ({ i, label, x: xAt(i) }))
  const band = plotW / Math.max(n, 1)

  return { lines, ticks, labelPts, band }
})

const tip = computed(() => {
  const h = hover.value
  if (!h || h.i < 0 || !geom.value) return null
  const l = geom.value.lines[h.s]
  if (!l) return null
  const p = l.pts[h.i]
  return p ? { ...p, color: l.color, sName: l.name } : null
})

const legendItems = computed(() =>
  geom.value
    ? geom.value.lines.map((l) => ({ label: l.name, value: props.formatValue(l.sum) + props.unit, color: l.color }))
    : [],
)
</script>

<template>
  <div :class="`chart chart-multi-line ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="height" />
    <ChartEmpty v-else-if="!hasData" :text="emptyText" />
    <template v-else>
      <div class="chart-canvas">
        <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="多维折线图">
          <defs>
            <linearGradient
              v-for="(l, i) in geom.lines" :key="`gd${i}`"
              :id="`mlc-fill-${uid}-${i}`" x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%" :stop-color="l.color" stop-opacity="0.28" />
              <stop offset="100%" :stop-color="l.color" stop-opacity="0" />
            </linearGradient>
          </defs>

          <g v-for="(t, i) in geom.ticks" :key="`t${i}`">
            <line :x1="padL" :y1="t.y" :x2="W - padR" :y2="t.y" class="chart-grid" />
            <text :x="padL - 8" :y="t.y" class="chart-axis-label" text-anchor="end" dominant-baseline="middle">{{ formatValue(t.v) }}</text>
          </g>
          <text v-for="lab in geom.labelPts" :key="`x${lab.i}`" :x="lab.x" :y="H - 8" class="chart-axis-label" text-anchor="middle">{{ lab.label }}</text>

          <!-- 仅首系列渐变面积填充，避免多系列互相遮挡 -->
          <path
            v-if="geom.lines.length && geom.lines[0].areaPath"
            :d="geom.lines[0].areaPath" :fill="`url(#mlc-fill-${uid}-0)`"
            :class="`chart-area ${mounted ? 'is-in' : ''}`"
          />

          <g
            v-for="l in geom.lines" :key="`s${l.si}`"
            :style="{ opacity: hover && hover.s !== l.si ? 0.45 : 1, transition: 'opacity 0.2s ease' }"
          >
            <path
              :d="l.linePath" fill="none" :stroke="l.color" class="chart-line-path"
              :style="{ strokeDasharray: l.lineLen || 1, strokeDashoffset: mounted ? 0 : l.lineLen || 1 }"
            />
            <text
              v-for="(p, i) in (showLabel ? l.pts : [])" :key="`lb${i}`"
              :x="p.x" :y="p.y - 10" class="chart-data-label" text-anchor="middle"
            >{{ formatValue(p.value) }}{{ unit }}</text>
            <g v-for="(p, i) in l.pts" :key="`p${i}`">
              <circle
                :cx="p.x" :cy="p.y" :r="hover && hover.s === l.si && hover.i === i ? 5 : 3.5"
                fill="#fff" :stroke="l.color" stroke-width="2" class="chart-dot"
                @click="emit('point-click', { series: l.name, ...p }, i)"
              />
              <rect
                :x="p.x - geom.band / 2" :y="padT" :width="geom.band" :height="plotH" fill="transparent"
                @mouseenter="hover = { s: l.si, i }" @mouseleave="hover = null"
              />
            </g>
          </g>
        </svg>
        <Tooltip v-if="tip" :x="tip.x" :y="tip.y" :vb-w="W" :vb-h="H">
          <span class="chart-tip-label">{{ tip.sName }} · {{ tip.label }}</span>
          <span class="chart-tip-value">{{ formatValue(tip.value) }}{{ unit }}</span>
        </Tooltip>
      </div>
      <LegendList
        v-if="showLegend" :items="legendItems" :hover="hover ? hover.s : -1"
        @hover="(i) => hover = i >= 0 ? { s: i, i: -1 } : null"
      />
    </template>
  </div>
</template>
