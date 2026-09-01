<script setup>
import { ref, computed } from 'vue'
import {
  useMounted, polar, ChartSkeleton, ChartHeader,
  Tooltip, DEFAULT_FORMAT,
} from './shared.js'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  size: { type: Number, default: 240 },
  color: { type: String, default: 'var(--c-primary, #4f46e5)' },
  label: { type: String, default: '' },
  formatValue: { type: Function, default: DEFAULT_FORMAT },
  unit: { type: String, default: '' },
  className: { type: String, default: '' },
  title: [String, Object], subtitle: [String, Object],
  description: [String, Object], actions: [Object, Array],
  loading: { type: Boolean, default: false },
  showTitle: { type: Boolean, default: true },
})

const mounted = useMounted()
const hover = ref(false)

const geom = computed(() => {
  const safeMax = props.max > 0 ? props.max : 1
  const ratio = Math.max(0, Math.min(props.value / safeMax, 1))
  const size = props.size
  const cx = size / 2, cy = size / 2, r = size * 0.4
  const pctText = `${(ratio * 100).toFixed(0)}%`
  const start = polar(cx, cy, r, -90)
  const endAngle = -90 + ratio * 360
  const end = polar(cx, cy, r, endAngle)
  const largeArc = ratio > 0.5 ? 1 : 0
  const valueArc = ratio <= 0 ? '' : ratio >= 1
    ? `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 1 1 ${cx + 0.01} ${start.y.toFixed(2)}`
    : `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
  const midAngle = -90 + ratio * 180
  const tipPt = polar(cx, cy, r, midAngle)
  return { size, cx, cy, r, pctText, valueArc, tipPt }
})
</script>

<template>
  <div :class="`chart chart-gauge ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="size" />
    <div v-else class="chart-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="`进度环 ${geom.pctText}`"
        @mouseenter="hover = true" @mouseleave="hover = false">
        <circle :cx="geom.cx" :cy="geom.cy" :r="geom.r" fill="none" stroke="var(--c-border, #e2e8f0)" :stroke-width="size * 0.05" class="chart-gauge-track" />
        <path v-if="geom.valueArc" :d="geom.valueArc" fill="none" :stroke="color" :stroke-width="size * 0.05" stroke-linecap="round" pathLength="1" class="chart-gauge-value"
          :style="{ strokeDasharray: '1 1', strokeDashoffset: mounted ? 0 : -1 }" />
        <text :x="geom.cx" :y="geom.cy - 4" class="chart-gauge-pct" text-anchor="middle" dominant-baseline="middle">{{ geom.pctText }}</text>
        <text v-if="label" :x="geom.cx" :y="geom.cy + size * 0.12" class="chart-gauge-label" text-anchor="middle" dominant-baseline="middle">{{ label }}</text>
      </svg>
      <Tooltip v-if="hover" :x="geom.tipPt.x" :y="geom.tipPt.y" :vb-w="size" :vb-h="size"><span class="chart-tip-value">{{ formatValue(value) }}{{ unit }} / {{ formatValue(max) }}{{ unit }}</span></Tooltip>
    </div>
  </div>
</template>
