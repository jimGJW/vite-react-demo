<script setup>
import { ref, computed, h } from 'vue'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.js'

/** 生成饼图扇区路径（普通饼图 / donut 饼图通用） */
function sectorPath(cx, cy, rOuter, rInner, a0, a1) {
  const p0 = polar(cx, cy, rOuter, a0)
  const p1 = polar(cx, cy, rOuter, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  if (rInner > 0) {
    const p2 = polar(cx, cy, rInner, a1)
    const p3 = polar(cx, cy, rInner, a0)
    return [
      `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
      'Z',
    ].join(' ')
  }
  return [
    `M ${cx} ${cy}`,
    `L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

/**
 * 二级饼图（钻取 Drill-down）：先展示一级饼图；点击某扇区后，
 * 整图切换为该扇区对应的二级（子级）数据，可返回上一级。
 *
 * 数据约定：data: [{ label, value, color?, children: [...] }]
 */
const props = defineProps({
  data: { type: Array, default: () => [] },
  size: { type: Number, default: 320 },
  colors: { type: Array, default: () => PALETTE },
  donut: { type: Boolean, default: false },
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
const emit = defineEmits(['point-click', 'level-change'])

const mounted = useMounted()
const crumb = ref([])        // [{ index, label }]，长度 0 或 1
const hover = ref(-1)
const legendHover = ref(-1)

const level = computed(() => crumb.value.length + 1)
const currentData = computed(() => {
  if (crumb.value.length === 0) return props.data
  const parent = props.data[crumb.value[0]?.index]
  return (parent && parent.children) || []
})
const parentLabel = computed(() => crumb.value[0]?.label ?? null)

function drillTo(parentIndex, label) {
  const next = [{ index: parentIndex, label }]
  crumb.value = next
  hover.value = -1
  legendHover.value = -1
  emit('level-change', 2, next)
}
function goBack() {
  crumb.value = []
  hover.value = -1
  legendHover.value = -1
  emit('level-change', 1, [])
}

/** 外部 actions + 面包屑合并（React 版用 JSX 合并，此处用 h() 构造等价 VNode） */
const mergedActions = computed(() => {
  const list = []
  if (props.actions != null) {
    list.push(...(Array.isArray(props.actions) ? props.actions : [props.actions]))
  }
  if (crumb.value.length > 0) {
    list.push(h('div', {
      class: 'chart-crumb',
      style: {
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        fontSize: '0.8rem', color: 'var(--c-text-2, #475569)',
        background: 'var(--c-primary-soft, rgba(79, 70, 229, 0.08))',
        padding: '0.25rem 0.55rem', borderRadius: '999px',
        border: '1px solid var(--c-primary-softer, rgba(79, 70, 229, 0.15))',
      },
    }, [
      h('button', {
        type: 'button', class: 'btn', 'aria-label': '返回上一级', onClick: goBack,
        style: { padding: '0 0.4rem', minWidth: 'auto', height: '1.35rem', lineHeight: '1.3rem', fontSize: '0.75rem' },
      }, '← 返回'),
      h('span', { style: { fontWeight: 600, color: 'var(--c-primary-700, #4338ca)' } }, parentLabel.value),
      h('span', { style: { opacity: 0.6 } }, '二级'),
    ]))
  }
  return list.length ? list : null
})

const hasData = computed(() => Array.isArray(currentData.value) && currentData.value.length > 0)

const geom = computed(() => {
  if (!hasData.value) return null
  const data = currentData.value
  const cx = props.size / 2, cy = props.size / 2
  const R = props.size * 0.44
  const rInner = props.donut ? R * 0.55 : 0

  const total = data.reduce((s, d) => s + d.value, 0)
  const safe = total > 0 ? total : 1
  const sectors = data.map((d, i) => {
    const a0 = -90 + data.slice(0, i).reduce((s, p) => s + (p.value / safe) * 360, 0)
    const sweep = (d.value / safe) * 360
    const a1 = a0 + sweep, mid = a0 + sweep / 2
    const path = sweep >= 360
      ? (props.donut ? sectorPath(cx, cy, R, rInner, 0, 359.999) : null /* 整饼：用圆兜底 */)
      : sectorPath(cx, cy, R, rInner, a0, a1)
    const hasChildren = crumb.value.length === 0 && Array.isArray(d.children) && d.children.length > 0
    return {
      ...d, i, a0, a1, mid, path,
      pct: d.value / safe,
      color: d.color || props.colors[i % props.colors.length],
      rMid: (R + (rInner || 0)) / 2,
      hasChildren,
    }
  })

  return { cx, cy, R, rInner, sectors, total }
})

const tipSector = computed(() => {
  if (!geom.value) return null
  const i = hover.value >= 0 ? hover.value : legendHover.value
  return i >= 0 ? geom.value.sectors[i] || null : null
})
const tip = computed(() => {
  const s = tipSector.value
  if (!s || !geom.value) return null
  return { ...s, tipPt: polar(geom.value.cx, geom.value.cy, s.rMid, s.mid) }
})

const legendItems = computed(() => {
  if (!geom.value) return []
  return geom.value.sectors.map((s) => ({
    label: crumb.value.length === 0 && s.hasChildren ? `${s.label} ▾` : s.label,
    value: props.formatValue(s.value) + props.unit,
    pct: `(${(s.pct * 100).toFixed(0)}%)`,
    color: s.color,
  }))
})

function handleSectorClick(s, i) {
  emit('point-click', { level: level.value, parentLabel: parentLabel.value, crumb: crumb.value, ...s }, i)
  if (crumb.value.length === 0 && s.hasChildren) drillTo(i, s.label)
}
</script>

<template>
  <div :class="`chart chart-nested-pie ${className}`">
    <ChartHeader
      :title="title" :subtitle="subtitle" :description="description"
      :actions="mergedActions" :show-title="showTitle"
    />
    <ChartSkeleton v-if="loading" :height="size" />
    <ChartEmpty v-else-if="!hasData" :text="emptyText || (crumb.length ? '该分类暂无子级数据' : '暂无数据')" />
    <template v-else>
      <div :key="`L${level}`" class="chart-canvas">
        <svg
          :viewBox="`0 0 ${size} ${size}`" role="img"
          :aria-label="level === 1 ? '一级饼图' : `二级饼图（${parentLabel}）`"
        >
          <!-- 整饼兜底（单扇区 100% 时 sectorPath 可能为 null） -->
          <path
            v-if="geom.sectors.length === 1 && geom.sectors[0].pct >= 1 && donut"
            :d="geom.sectors[0].path" :fill="geom.sectors[0].color"
            :class="`chart-pie-sector ${mounted ? 'is-in' : ''}`"
          />

          <g v-for="s in geom.sectors" :key="`s${s.i}`">
            <path
              v-if="s.path" :d="s.path" :fill="s.color"
              :class="`chart-pie-sector ${mounted ? 'is-in' : ''} ${hover === s.i || legendHover === s.i ? 'is-hover' : ''} ${s.hasChildren ? 'is-drillable' : ''}`"
              :style="{
                transform: hover === s.i || legendHover === s.i
                  ? `translate(${polar(0, 0, s.hasChildren ? 8 : 6, s.mid).x.toFixed(2)}px, ${polar(0, 0, s.hasChildren ? 8 : 6, s.mid).y.toFixed(2)}px)`
                  : 'translate(0,0)',
                transitionDelay: `${s.i * 55}ms`,
                cursor: 'pointer',
              }"
              @mouseenter="hover = s.i; legendHover = -1"
              @mouseleave="hover = -1"
              @click="handleSectorClick(s, s.i)"
            />
            <text
              v-if="showLabel && s.pct > 0.05"
              :x="polar(geom.cx, geom.cy, s.rMid, s.mid).x" :y="polar(geom.cx, geom.cy, s.rMid, s.mid).y"
              class="chart-data-label" text-anchor="middle" dominant-baseline="middle"
            >{{ (s.pct * 100).toFixed(0) }}%</text>
            <!-- 一级可钻取的扇区，在边缘加一个小三角提示 -->
            <polygon
              v-if="s.hasChildren && mounted"
              :points="`${polar(geom.cx, geom.cy, geom.R + 10, s.mid).x.toFixed(2)},${(polar(geom.cx, geom.cy, geom.R + 10, s.mid).y - 4).toFixed(2)} ${(polar(geom.cx, geom.cy, geom.R + 10, s.mid).x + 4).toFixed(2)},${(polar(geom.cx, geom.cy, geom.R + 10, s.mid).y + 3).toFixed(2)} ${(polar(geom.cx, geom.cy, geom.R + 10, s.mid).x - 4).toFixed(2)},${(polar(geom.cx, geom.cy, geom.R + 10, s.mid).y + 3).toFixed(2)}`"
              :fill="s.color" stroke="#fff" stroke-width="0.8"
              :style="{
                transformOrigin: `${polar(geom.cx, geom.cy, geom.R + 10, s.mid).x}px ${polar(geom.cx, geom.cy, geom.R + 10, s.mid).y}px`,
                animation: 'chart-pulse 1.6s ease-in-out infinite',
                animationDelay: `${s.i * 80}ms`,
              }"
            />
          </g>

          <!-- 二级中心显示父级标签（仅 donut 模式） -->
          <template v-if="crumb.length > 0 && donut">
            <text :x="geom.cx" :y="geom.cy - 4" class="chart-center-label" text-anchor="middle" dominant-baseline="middle">{{ parentLabel }}</text>
            <text :x="geom.cx" :y="geom.cy + 14" class="chart-center-sub" text-anchor="middle" dominant-baseline="middle">{{ formatValue(geom.total) }}{{ unit }}</text>
          </template>
        </svg>
        <Tooltip v-if="tip" :x="tip.tipPt.x" :y="tip.tipPt.y" :vb-w="size" :vb-h="size">
          <span class="chart-tip-label">{{ tip.label }}</span>
          <span class="chart-tip-value">{{ formatValue(tip.value) }}{{ unit }} · {{ (tip.pct * 100).toFixed(1) }}%</span>
          <span v-if="crumb.length === 0 && tip.hasChildren" style="font-size: 0.72rem; opacity: 0.7; display: block">点击进入子级 ▸</span>
        </Tooltip>
      </div>
      <LegendList
        v-if="showLegend" :items="legendItems" :hover="hover >= 0 ? hover : legendHover"
        @hover="(i) => { legendHover = i; hover = -1 }"
      />
    </template>
  </div>
</template>
