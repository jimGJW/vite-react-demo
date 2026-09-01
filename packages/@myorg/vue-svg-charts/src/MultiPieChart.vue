<script setup>
import { ref, computed } from 'vue'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.js'

/** 扇区路径（饼图，从中心放射）。 */
function sectorPath(cx, cy, r, a0, a1) {
  const start = polar(cx, cy, r, a0)
  const end = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

/**
 * 多维饼图（多组并列对比）。
 * groups: [{ name, data: [{ label, value, color? }] }]
 */
const props = defineProps({
  groups: { type: Array, default: () => [] },
  size: { type: Number, default: 240 },
  colors: { type: Array, default: () => PALETTE },
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
const sectorHover = ref(null)   // { g, i } | null
const legendHover = ref(-1)

const hasData = computed(
  () => props.groups.length > 0 && Array.isArray(props.groups[0]?.data) && props.groups[0].data.length > 0,
)

const geom = computed(() => {
  if (!hasData.value) return null
  const cx = props.size / 2, cy = props.size / 2, r = props.size * 0.4
  const pies = props.groups.map((g, gi) => {
    const total = g.data.reduce((s, d) => s + d.value, 0)
    const safeTotal = total > 0 ? total : 1
    const sectors = g.data.map((d, i) => {
      // 前缀和推算起止角，避免可变累加器
      const a0 = -90 + g.data.slice(0, i).reduce((s, p) => s + (p.value / safeTotal) * 360, 0)
      const sweep = (d.value / safeTotal) * 360
      const a1 = a0 + sweep, mid = a0 + sweep / 2
      return {
        ...d, i, a0, a1, mid,
        path: sweep >= 360 ? null : sectorPath(cx, cy, r, a0, a1),
        pct: d.value / safeTotal,
        color: d.color || props.colors[i % props.colors.length],
      }
    })
    return { gi, name: g.name, sectors, total, single: sectors.length === 1 }
  })

  // 共享图例：取所有组 label 的并集（按出现顺序）
  const legendItems = []
  const seen = new Set()
  pies.forEach((gp) => {
    gp.sectors.forEach((s) => {
      if (!seen.has(s.label)) {
        seen.add(s.label)
        legendItems.push({ label: s.label, color: s.color })
      }
    })
  })
  // 按图例下标聚合各组的同 label 数值合计
  const legendTotals = legendItems.map((it) => {
    const total = props.groups.reduce((sum, g) => {
      const found = g.data.find((d) => d.label === it.label)
      return sum + (found ? found.value : 0)
    }, 0)
    return { ...it, value: props.formatValue(total) + props.unit }
  })

  return { cx, cy, r, pies, legendItems, legendTotals }
})

/** 当前 hover 扇区的 tooltip 数据（图例 hover 时高亮所有组同 label 扇区） */
const tip = computed(() => {
  const h = sectorHover.value
  if (!h || !geom.value) return null
  const gp = geom.value.pies[h.g]
  if (!gp) return null
  const s = gp.sectors[h.i]
  if (!s) return null
  return { ...s, groupName: gp.name, tipPt: polar(geom.value.cx, geom.value.cy, geom.value.r * 0.6, s.mid) }
})

function isSectorHover(gi, i) {
  const h = sectorHover.value
  return !!(h && h.g === gi && h.i === i)
}
function isLegendHover(label) {
  return legendHover.value >= 0 && geom.value?.legendItems[legendHover.value]?.label === label
}
function activeLegendIndex() {
  const h = sectorHover.value
  if (!h || !geom.value) return legendHover.value
  const s = geom.value.pies[h.g]?.sectors[h.i]
  return s ? geom.value.legendItems.findIndex((it) => it.label === s.label) : -1
}
</script>

<template>
  <div :class="`chart chart-multi-pie ${className}`">
    <ChartHeader :title="title" :subtitle="subtitle" :description="description" :actions="actions" :show-title="showTitle" />
    <ChartSkeleton v-if="loading" :height="size" />
    <ChartEmpty v-else-if="!hasData" :text="emptyText" />
    <template v-else>
      <div class="chart-canvas">
        <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center">
          <div
            v-for="gp in geom.pies" :key="`g${gp.gi}`"
            style="position: relative; flex: 0 1 240px; max-width: 240px; min-width: 180px"
            :style="{ flexBasis: size + 'px', maxWidth: size + 'px' }"
          >
            <div style="text-align: center; font-size: 0.85rem; font-weight: 600; color: var(--c-text-2, #475569); margin-bottom: 0.3rem">{{ gp.name }}</div>
            <div class="chart-canvas">
              <svg :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="`${gp.name} 饼图`">
                <circle
                  v-if="gp.single" :cx="geom.cx" :cy="geom.cy" :r="geom.r"
                  :fill="gp.sectors[0].color" class="chart-pie-sector"
                />
                <template v-else>
                  <g v-for="s in gp.sectors" :key="`s${s.i}`">
                    <path
                      :d="s.path" :fill="s.color"
                      :class="`chart-pie-sector ${mounted ? 'is-in' : ''} ${isSectorHover(gp.gi, s.i) || isLegendHover(s.label) ? 'is-hover' : ''}`"
                      :style="{
                        transform: isSectorHover(gp.gi, s.i) || isLegendHover(s.label)
                          ? `translate(${polar(0, 0, 6, s.mid).x.toFixed(2)}px, ${polar(0, 0, 6, s.mid).y.toFixed(2)}px)`
                          : 'translate(0,0)',
                        transitionDelay: `${s.i * 50}ms`,
                        cursor: 'pointer',
                      }"
                      @mouseenter="sectorHover = { g: gp.gi, i: s.i }; legendHover = -1"
                      @mouseleave="sectorHover = null"
                      @click="emit('point-click', { group: gp.name, ...s }, s.i)"
                    />
                    <text
                      v-if="showLabel && s.pct > 0.06"
                      :x="polar(geom.cx, geom.cy, geom.r * 0.7, s.mid).x"
                      :y="polar(geom.cx, geom.cy, geom.r * 0.7, s.mid).y"
                      class="chart-data-label" text-anchor="middle" dominant-baseline="middle"
                    >{{ (s.pct * 100).toFixed(0) }}%</text>
                  </g>
                </template>
              </svg>
              <Tooltip
                v-if="tip && sectorHover && sectorHover.g === gp.gi"
                :x="tip.tipPt.x" :y="tip.tipPt.y" :vb-w="size" :vb-h="size"
              >
                <span class="chart-tip-label">{{ tip.groupName }} · {{ tip.label }}</span>
                <span class="chart-tip-value">{{ formatValue(tip.value) }}{{ unit }} · {{ (tip.pct * 100).toFixed(1) }}%</span>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      <LegendList
        v-if="showLegend" :items="geom.legendTotals" :hover="activeLegendIndex()"
        @hover="(i) => { legendHover = i; sectorHover = null }"
      />
    </template>
  </div>
</template>
