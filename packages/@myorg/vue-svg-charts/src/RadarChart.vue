<script setup>
import { ref, computed } from 'vue'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, DEFAULT_FORMAT,
} from './shared.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
  size: { type: Number, default: 320 },
  color: { type: String, default: 'var(--c-primary, #4f46e5)' },
  formatValue: { type: Function, default: DEFAULT_FORMAT },
  unit: { type: String, default: '' },
  className: { type: String, default: '' },
  title: [String, Object], subtitle: [String, Object],
  description: [String, Object], actions: [Object, Array],
  emptyText: String, loading: { type: Boolean, default: false },
  showLabel: { type: Boolean, default: false },
  showAxis: { type: Boolean, default: true },
  showGrid: { type: Boolean, default: true },
  showTitle: { type: Boolean, default: true },
})
const emit = defineEmits(['point-click'])

const mounted = useMounted()
const hover = ref(-1)

const geom = computed(() => {
  const data = props.data
  if (!data.length) return null
  const size = props.size
  const cx = size / 2, cy = size / 2, R = size * 0.36, n = data.length
  const angleOf = (i) => -90 + (i * 360) / n
  const vertex = (i, ratio) => polar(cx, cy, R * ratio, angleOf(i))
  const rings = [0.25, 0.5, 0.75, 1]
  const ringPolys = rings.map((f) =>
    Array.from({ length: n }, (_, i) => vertex(i, f)).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '))
  const dataPts = data.map((d, i) => {
    const max = d.max > 0 ? d.max : 1
    return vertex(i, Math.max(0, Math.min(d.value / max, 1)))
  })
  const dataPoly = dataPts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const axisVerts = data.map((_, i) => vertex(i, 1))
  const axisPts = data.map((d, i) => polar(cx, cy, R + size * 0.07, angleOf(i)))
  return { size, cx, cy, R, n, ringPolys, dataPts, dataPoly, axisVerts, axisPts }
})

const tip = computed(() => {
  if (hover.value < 0 || !geom.value) return null
  const g = geom.value
  return { ...props.data[hover.value], pt: g.dataPts[hover.value] }
})
</script>

<template>
  <div :class="`chart chart-radar ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="size" />
    <ChartEmpty v-else-if="!data.length" :text="emptyText" />
    <div v-else class="chart-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="雷达图">
        <template v-if="showGrid">
          <polygon v-for="(points, i) in geom.ringPolys" :key="`r${i}`" :points="points" class="chart-radar-grid" />
        </template>
        <template v-if="showGrid">
          <line v-for="(p, i) in geom.axisVerts" :key="`a${i}`" :x1="geom.cx" :y1="geom.cy" :x2="p.x.toFixed(2)" :y2="p.y.toFixed(2)" class="chart-radar-axis" />
        </template>
        <polygon :points="geom.dataPoly" :fill="color" fill-opacity="0.18" :stroke="color" stroke-width="2"
          :class="`chart-radar-poly ${mounted ? 'is-in' : ''}`" :style="{ transformOrigin: `${geom.cx}px ${geom.cy}px` }" />
        <g v-for="(p, i) in geom.dataPts" :key="`d${i}`">
          <circle :cx="p.x" :cy="p.y" :r="hover === i ? 5 : 3.5" fill="#fff" :stroke="color" stroke-width="2"
            class="chart-dot" style="cursor: pointer"
            @click="emit('point-click', data[i], i)" />
          <circle :cx="p.x" :cy="p.y" :r="size * 0.12" fill="transparent"
            @mouseenter="hover = i" @mouseleave="hover = -1" />
          <text v-if="showLabel" :x="p.x" :y="p.y - 8" class="chart-data-label" text-anchor="middle">{{ formatValue(data[i].value) }}{{ unit }}</text>
        </g>
        <template v-if="showAxis">
          <text v-for="(p, i) in geom.axisPts" :key="`l${i}`" :x="p.x" :y="p.y" class="chart-axis-label" text-anchor="middle" dominant-baseline="middle">{{ data[i].label }}</text>
        </template>
      </svg>
      <Tooltip v-if="tip" :x="tip.pt.x" :y="tip.pt.y" :vb-w="size" :vb-h="size"><span class="chart-tip-label">{{ tip.label }}</span><span class="chart-tip-value">{{ formatValue(tip.value) }}{{ unit }}</span></Tooltip>
    </div>
  </div>
</template>
