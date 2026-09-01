<script setup>
import { ref, computed } from 'vue'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, PALETTE, DEFAULT_FORMAT,
} from './shared.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
  size: { type: Number, default: 320 },
  palette: { type: Array, default: () => PALETTE },
  formatValue: { type: Function, default: DEFAULT_FORMAT },
  unit: { type: String, default: '' },
  className: { type: String, default: '' },
  title: [String, Object], subtitle: [String, Object],
  description: [String, Object], actions: [Object, Array],
  emptyText: String, loading: { type: Boolean, default: false },
  legend: { type: Boolean, default: true },
  showLabel: { type: Boolean, default: false },
  showTitle: { type: Boolean, default: true },
})
const emit = defineEmits(['point-click'])

const mounted = useMounted()
const hover = ref(-1)

function sectorPath(cx, cy, r, a0, a1) {
  const start = polar(cx, cy, r, a0)
  const end = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

const geom = computed(() => {
  const data = props.data
  if (!data.length) return null
  const total = data.reduce((s, d) => s + d.value, 0)
  const safeTotal = total > 0 ? total : 1
  const size = props.size
  const cx = size / 2, cy = size / 2, r = size * 0.4
  // 起始角 -90°（12 点方向）；用前缀和推算各扇区起止角，避免可变累加器
  const sectors = data.map((d, i) => {
    const a0 = -90 + data.slice(0, i).reduce((s, p) => s + (p.value / safeTotal) * 360, 0)
    const sweep = (d.value / safeTotal) * 360
    const a1 = a0 + sweep, mid = a0 + sweep / 2
    const path = sweep >= 360 ? null : sectorPath(cx, cy, r, a0, a1)
    const offset = polar(0, 0, 8, mid)
    const labelPt = polar(cx, cy, r * 0.7, mid)
    return { ...d, i, a0, a1, mid, path, pct: d.value / safeTotal, color: d.color || props.palette[i % props.palette.length], offset, labelPt }
  })
  const single = sectors.length === 1
  return { size, cx, cy, r, sectors, single }
})

const tip = computed(() => {
  if (hover.value < 0 || !geom.value) return null
  const g = geom.value
  const s = g.sectors[hover.value]
  const tipPt = polar(g.cx, g.cy, g.r * 0.6, s.mid)
  return { ...s, tipPtX: tipPt.x, tipPtY: tipPt.y }
})
</script>

<template>
  <div :class="`chart chart-pie ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="size" />
    <ChartEmpty v-else-if="!data.length" :text="emptyText" />
    <div v-else class="chart-pie-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="饼图">
        <circle v-if="geom.single" :cx="geom.cx" :cy="geom.cy" :r="geom.r" :fill="geom.sectors[0].color" class="chart-pie-sector" />
        <template v-else>
          <g v-for="s in geom.sectors" :key="s.i">
            <path :d="s.path" :fill="s.color"
              :class="`chart-pie-sector ${mounted ? 'is-in' : ''} ${hover === s.i ? 'is-hover' : ''}`"
              :style="{ transform: hover === s.i ? `translate(${s.offset.x}px, ${s.offset.y}px)` : 'translate(0,0)', transitionDelay: `${s.i * 70}ms`, cursor: 'pointer' }"
              @mouseenter="hover = s.i" @mouseleave="hover = -1"
              @click="emit('point-click', s, s.i)" />
            <text v-if="showLabel && s.pct > 0.04" :x="s.labelPt.x" :y="s.labelPt.y" class="chart-data-label" text-anchor="middle" dominant-baseline="middle">{{ (s.pct * 100).toFixed(0) }}%</text>
          </g>
        </template>
      </svg>
      <Tooltip v-if="tip" :x="tip.tipPtX" :y="tip.tipPtY" :vb-w="size" :vb-h="size">
        <span class="chart-tip-label">{{ tip.label }}</span>
        <span class="chart-tip-value">{{ formatValue(tip.value) }}{{ unit }} · {{ (tip.pct * 100).toFixed(1) }}%</span>
      </Tooltip>
    </div>
    <ul v-if="legend && geom" class="chart-legend">
      <li v-for="s in geom.sectors" :key="s.i" :class="hover === s.i ? 'is-hover' : ''" @mouseenter="hover = s.i" @mouseleave="hover = -1">
        <span class="chart-legend-dot" :style="{ background: s.color }" />
        <span class="chart-legend-label">{{ s.label }}</span>
        <span class="chart-legend-value">{{ formatValue(s.value) }}{{ unit }}</span>
        <span class="chart-legend-pct">{{ (s.pct * 100).toFixed(1) }}%</span>
      </li>
    </ul>
  </div>
</template>
