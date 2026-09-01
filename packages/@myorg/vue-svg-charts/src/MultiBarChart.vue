<script setup>
import { ref, computed } from 'vue'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.js'

/**
 * 多维分组柱状图（每个类别下多系列柱并排）。
 * series: [{ name, color?, data: [{ label, value }] }]
 * hover: { s, i } | null；i = -1 表示图例触发（高亮整系列）
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
  const nCat = labels.length, nSer = series.length
  const allValues = series.flatMap((s) => s.data.map((d) => d.value))
  const { niceMin, niceMax, step } = niceBounds(0, Math.max(...allValues))
  const span = niceMax - niceMin || 1
  const yAt = (v) => padT + plotH.value - ((v - niceMin) / span) * plotH.value
  const base = baseY.value

  const band = plotW / nCat
  const groupW = band * 0.8
  // 柱宽：组宽扣去系列间隙后均分；系列间留 2px 间隙
  const gapInGroup = nSer > 1 ? 2 * (nSer - 1) : 0
  const barW = Math.min((groupW - gapInGroup) / nSer, 48)

  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push({ v, y: yAt(v) })
  const labelPts = labels.map((label, i) => ({ i, label, x: padL + i * band + band / 2 }))

  // 展开为 flat bars 数组
  const bars = []
  const sums = []
  for (let si = 0; si < nSer; si++) {
    const s = series[si]
    const color = s.color || props.colors[si % props.colors.length]
    let sum = 0
    for (let ci = 0; ci < nCat; ci++) {
      const d = s.data[ci]
      const catX = padL + ci * band + (band - groupW) / 2
      const x = catX + si * (barW + (nSer > 1 ? 2 : 0))
      const y = yAt(d.value)
      sum += d.value
      bars.push({ si, ci, color, x, y, h: base - y, barW, value: d.value, label: d.label, name: s.name })
    }
    sums[si] = sum
  }

  return { bars, ticks, labelPts, band, barW, sums }
})

const tip = computed(() => {
  const h = hover.value
  if (!h || h.i < 0 || !geom.value) return null
  return geom.value.bars.find((b) => b.si === h.s && b.ci === h.i) || null
})

const legendItems = computed(() => {
  if (!geom.value) return []
  return props.series.map((s, i) => ({
    label: s.name,
    value: props.formatValue(geom.value.sums[i] || 0) + props.unit,
    color: s.color || props.colors[i % props.colors.length],
  }))
})
</script>

<template>
  <div :class="`chart chart-multi-bar ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="height" />
    <ChartEmpty v-else-if="!hasData" :text="emptyText" />
    <template v-else>
      <div class="chart-canvas">
        <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="多维分组柱状图">
          <g v-for="(t, i) in geom.ticks" :key="`t${i}`">
            <line :x1="padL" :y1="t.y" :x2="W - padR" :y2="t.y" class="chart-grid" />
            <text :x="padL - 8" :y="t.y" class="chart-axis-label" text-anchor="end" dominant-baseline="middle">{{ formatValue(t.v) }}</text>
          </g>
          <text v-for="lab in geom.labelPts" :key="`x${lab.i}`" :x="lab.x" :y="H - 8" class="chart-axis-label" text-anchor="middle">{{ lab.label }}</text>

          <g
            v-for="(b, idx) in geom.bars" :key="`b${idx}`"
            :style="{ opacity: hover && !(hover.s === b.si && (hover.i === -1 || hover.i === b.ci)) ? 0.45 : 1, transition: 'opacity 0.2s ease' }"
          >
            <rect
              :x="b.x" :y="b.y" :width="b.barW" :height="b.h" rx="4" :fill="b.color"
              :class="`chart-bar ${hover && hover.s === b.si && (hover.i === -1 || hover.i === b.ci) ? 'is-hover' : ''}`"
              :style="{ transform: mounted ? 'scaleY(1)' : 'scaleY(0)', cursor: 'pointer' }"
              @mouseenter="hover = { s: b.si, i: b.ci }" @mouseleave="hover = null"
              @click="emit('point-click', { series: b.name, label: b.label, value: b.value }, b.ci)"
            />
            <text
              v-if="showLabel" :x="b.x + b.barW / 2" :y="b.y - 6"
              class="chart-data-label" text-anchor="middle"
            >{{ formatValue(b.value) }}{{ unit }}</text>
          </g>
        </svg>
        <Tooltip v-if="tip" :x="tip.x + tip.barW / 2" :y="tip.y" :vb-w="W" :vb-h="H">
          <span class="chart-tip-label">{{ tip.name }} · {{ tip.label }}</span>
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
