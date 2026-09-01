<script setup>
import { ref, computed } from 'vue'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.js'

/**
 * 堆叠柱状图（每个类别多系列自底向上累计堆叠）。
 * series: [{ name, color?, data: [{ label, value }] }]
 * hover: { ci, si } | null；图例 hover 时 ci = -1，高亮整系列
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

const hasData = computed(
  () => props.series.length > 0 && Array.isArray(props.series[0]?.data) && props.series[0].data.length > 0,
)

const geom = computed(() => {
  if (!hasData.value) return null
  const series = props.series
  const labels = series[0].data.map((d) => d.label)
  const nCat = labels.length, nSer = series.length

  // 每个类别的累计值（堆叠顶部）
  const totals = labels.map((_, ci) =>
    series.reduce((s, ser) => s + (ser.data[ci]?.value || 0), 0))
  const { niceMin, niceMax, step } = niceBounds(0, Math.max(...totals))
  const span = niceMax - niceMin || 1
  const yAt = (v) => padT + plotH.value - ((v - niceMin) / span) * plotH.value

  const band = plotW / nCat
  const barW = Math.min(band * 0.56, 46)

  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push({ v, y: yAt(v) })
  const labelPts = labels.map((label, i) => ({ i, label, x: padL + i * band + band / 2 }))

  // 自底向上累计，生成各段几何
  const segs = []
  const seriesSums = new Array(nSer).fill(0)
  for (let ci = 0; ci < nCat; ci++) {
    let cum = 0
    for (let si = 0; si < nSer; si++) {
      const s = series[si]
      const d = s.data[ci]
      const color = s.color || props.colors[si % props.colors.length]
      const v = d.value
      seriesSums[si] += v
      const yTop = yAt(cum + v)
      const yBot = yAt(cum)
      segs.push({
        si, ci, color, x: padL + ci * band + (band - barW) / 2,
        y: yTop, h: yBot - yTop, barW,
        value: v, label: d.label, name: s.name,
      })
      cum += v
    }
  }

  return { segs, ticks, labelPts, band, barW, totals, seriesSums, labels, yAt }
})

/** 段 hover 时按类别聚合整组（tooltip 展示该类所有系列明细） */
const tip = computed(() => {
  const h = hover.value
  if (!h || h.ci < 0 || !geom.value) return null
  const g = geom.value
  const ci = h.ci
  const segments = g.segs
    .filter((s) => s.ci === ci)
    .map((s) => ({ name: s.name, value: s.value, color: s.color }))
  return {
    x: padL + ci * g.band + g.band / 2,
    // tooltip 浮在堆叠顶部稍上方
    y: g.yAt(g.totals[ci]) - 4,
    label: g.labels[ci],
    total: g.totals[ci],
    segments,
  }
})

const legendItems = computed(() => {
  if (!geom.value) return []
  return props.series.map((s, i) => ({
    label: s.name,
    value: props.formatValue(geom.value.seriesSums[i] || 0) + props.unit,
    color: s.color || props.colors[i % props.colors.length],
  }))
})

/** 段是否高亮：段 hover（同类别同段）或图例 hover（整系列） */
function isSegHover(s) {
  const h = hover.value
  if (!h) return false
  return (h.ci >= 0 && h.ci === s.ci && (h.si === -1 || h.si === s.si))
    || (h.ci === -1 && h.si === s.si)
}
</script>

<template>
  <div :class="`chart chart-stacked-bar ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="height" />
    <ChartEmpty v-else-if="!hasData" :text="emptyText" />
    <template v-else>
      <div class="chart-canvas">
        <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="堆叠柱状图">
          <g v-for="(t, i) in geom.ticks" :key="`t${i}`">
            <line :x1="padL" :y1="t.y" :x2="W - padR" :y2="t.y" class="chart-grid" />
            <text :x="padL - 8" :y="t.y" class="chart-axis-label" text-anchor="end" dominant-baseline="middle">{{ formatValue(t.v) }}</text>
          </g>
          <text v-for="lab in geom.labelPts" :key="`x${lab.i}`" :x="lab.x" :y="H - 8" class="chart-axis-label" text-anchor="middle">{{ lab.label }}</text>

          <g
            v-for="(s, idx) in geom.segs" :key="`sg${idx}`"
            :style="{ opacity: hover && !isSegHover(s) ? 0.45 : 1, transition: 'opacity 0.2s ease' }"
          >
            <rect
              :x="s.x" :y="s.y" :width="s.barW" :height="s.h" :fill="s.color"
              :class="`chart-bar ${isSegHover(s) ? 'is-hover' : ''}`"
              :style="{ transform: mounted ? 'scaleY(1)' : 'scaleY(0)', cursor: 'pointer' }"
              @mouseenter="hover = { ci: s.ci, si: s.si }" @mouseleave="hover = null"
              @click="emit('point-click', { series: s.name, label: s.label, value: s.value }, s.ci)"
            />
            <text
              v-if="showLabel && s.h > 14" :x="s.x + s.barW / 2" :y="s.y + s.h / 2"
              class="chart-data-label" text-anchor="middle" dominant-baseline="middle"
            >{{ formatValue(s.value) }}{{ unit }}</text>
          </g>
        </svg>
        <Tooltip v-if="tip" :x="tip.x" :y="tip.y" :vb-w="W" :vb-h="H">
          <span class="chart-tip-label">{{ tip.label }}</span>
          <span
            v-for="(seg, i) in tip.segments" :key="`ts${i}`"
            class="chart-tip-value" :style="{ color: seg.color, fontWeight: 600 }"
          >{{ seg.name }}: {{ formatValue(seg.value) }}{{ unit }}</span>
          <span class="chart-tip-value">合计: {{ formatValue(tip.total) }}{{ unit }}</span>
        </Tooltip>
      </div>
      <LegendList
        v-if="showLegend" :items="legendItems" :hover="hover ? hover.si : -1"
        @hover="(i) => hover = i >= 0 ? { ci: -1, si: i } : null"
      />
    </template>
  </div>
</template>
