<script setup>
import { ref, computed } from 'vue'
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

const W = 600, padL = 44, padR = 18, padT = 16, padB = 30
const plotW = W - padL - padR
const H = computed(() => props.height)
const plotH = computed(() => H.value - padT - padB)
const baseY = computed(() => padT + plotH.value)

const geom = computed(() => {
  const data = props.data
  if (!data.length) return null
  const values = data.map((d) => d.value)
  const { niceMin, niceMax, step } = niceBounds(0, Math.max(...values))
  const span = niceMax - niceMin || 1
  const ph = plotH.value, by = baseY.value
  const yAt = (v) => padT + ph - ((v - niceMin) / span) * ph
  const n = data.length, band = plotW / n, barW = Math.min(band * 0.56, 46)
  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(v)
  return { niceMin, niceMax, span, yAt, n, band, barW, ticks, by }
})

const bars = computed(() => {
  if (!geom.value) return []
  const g = geom.value
  return props.data.map((d, i) => ({
    ...d, i,
    x: padL + i * g.band + (g.band - g.barW) / 2,
    y: g.yAt(d.value),
    h: g.by - g.yAt(d.value),
  }))
})

const tip = computed(() => {
  if (hover.value < 0 || !geom.value) return null
  const g = geom.value
  return { ...props.data[hover.value], x: padL + hover.value * g.band + g.band / 2, y: g.yAt(props.data[hover.value].value) }
})

const legendItems = computed(() => props.legend && geom.value ? props.data.map((d) => ({ label: d.label, value: props.formatValue(d.value) + props.unit, color: props.color })) : [])
</script>

<template>
  <div :class="`chart chart-bar ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="height" />
    <ChartEmpty v-else-if="!data.length" :text="emptyText" />
    <div v-else class="chart-canvas">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="柱状图">
        <template v-if="showGrid">
          <g v-for="(v, i) in geom.ticks" :key="`g${i}`">
            <line :x1="padL" :y1="geom.yAt(v)" :x2="W - padR" :y2="geom.yAt(v)" class="chart-grid" />
            <text v-if="showAxis" :x="padL - 8" :y="geom.yAt(v)" class="chart-axis-label" text-anchor="end" dominant-baseline="middle">{{ formatValue(v) }}</text>
          </g>
        </template>
        <g v-for="(b, i) in bars" :key="`b${i}`">
          <rect :x="b.x" :y="b.y" :width="geom.barW" :height="b.h" rx="5" :fill="color"
            :class="`chart-bar ${hover === i ? 'is-hover' : ''}`"
            :style="{ transform: mounted ? 'scaleY(1)' : 'scaleY(0)', cursor: 'pointer' }"
            @mouseenter="hover = i" @mouseleave="hover = -1"
            @click="emit('point-click', b, i)" />
          <text v-if="showAxis" :x="b.x + geom.barW / 2" :y="H - 8" class="chart-axis-label" text-anchor="middle">{{ b.label }}</text>
          <text v-if="showLabel" :x="b.x + geom.barW / 2" :y="b.y - 6" class="chart-data-label" text-anchor="middle">{{ formatValue(b.value) }}{{ unit }}</text>
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
