<script setup>
import { ref, computed, h, useId } from 'vue'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.js'

/**
 * 二级柱状图（钻取 Drill-down）：先展示一级柱状图；点击某根柱子后，
 * 整图切换为该柱子对应的二级（子级）数据，可通过面包屑返回上一级。
 *
 * 数据约定：data: [{ label, value, color?, children: [...] }]
 */
const props = defineProps({
  data: { type: Array, default: () => [] },
  height: { type: Number, default: 300 },
  colors: { type: Array, default: () => PALETTE },
  color: { type: String, default: undefined },
  formatValue: { type: Function, default: DEFAULT_FORMAT },
  unit: { type: String, default: '' },
  className: { type: String, default: '' },
  title: [String, Object], subtitle: [String, Object],
  description: [String, Object], actions: [Object, Array],
  emptyText: String, loading: { type: Boolean, default: false },
  showLabel: { type: Boolean, default: false },
  showAxis: { type: Boolean, default: true },
  showGrid: { type: Boolean, default: true },
  showLegend: { type: Boolean, default: false },
  showTitle: { type: Boolean, default: true },
})
const emit = defineEmits(['point-click', 'level-change'])

const mounted = useMounted()
const rawId = useId()
const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')
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

function drillTo(parentIndex, parentLabel) {
  const next = [{ index: parentIndex, label: parentLabel }]
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

const W = 600, padL = 48, padR = 18, padT = 20, padB = 42
const H = computed(() => props.height)
const plotW = W - padL - padR
const plotH = computed(() => H.value - padT - padB)
const baseY = computed(() => padT + plotH.value)

const hasData = computed(() => Array.isArray(currentData.value) && currentData.value.length > 0)

const geom = computed(() => {
  if (!hasData.value) return null
  const data = currentData.value
  const { niceMin, niceMax, step } = niceBounds(0, Math.max(...data.map((d) => d.value)))
  const n = data.length
  const groupW = plotW / n
  const barW = Math.min(groupW * 0.58, 62)
  const barGap = (groupW - barW) / 2

  const yTicks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) yTicks.push(v)
  const yScale = (v) => baseY.value - ((v - niceMin) / (niceMax - niceMin || 1)) * plotH.value

  const bars = data.map((d, i) => {
    const y = yScale(d.value)
    const hasChildren = crumb.value.length === 0 && Array.isArray(d.children) && d.children.length > 0
    return {
      ...d, i,
      x: padL + i * groupW + barGap,
      y,
      w: barW,
      h: Math.max(0, baseY.value - y),
      color: props.color || d.color || props.colors[i % props.colors.length],
      hasChildren,
    }
  })

  return { bars, yTicks, yScale, barW }
})

const hoverIdx = computed(() => (hover.value >= 0 ? hover.value : legendHover.value))
const tip = computed(() => {
  const i = hoverIdx.value
  if (i < 0 || !geom.value) return null
  const b = geom.value.bars[i]
  return b ? { ...b, tipX: b.x + b.w / 2, tipY: b.y - 2 } : null
})

const legendItems = computed(() => {
  if (!geom.value) return []
  return geom.value.bars.map((b) => ({
    label: crumb.value.length === 0 && b.hasChildren ? `${b.label} ▾` : b.label,
    value: props.formatValue(b.value) + props.unit,
    color: b.color,
  }))
})

function handleBarClick(b) {
  emit('point-click', { level: level.value, parentLabel: parentLabel.value, crumb: crumb.value, ...b }, b.i)
  if (crumb.value.length === 0 && b.hasChildren) drillTo(b.i, b.label)
}
</script>

<template>
  <div :class="`chart chart-drilled-bar ${className}`">
    <ChartHeader
      :title="title" :subtitle="subtitle" :description="description"
      :actions="mergedActions" :show-title="showTitle"
    />
    <ChartSkeleton v-if="loading" :height="height" />
    <ChartEmpty v-else-if="!hasData" :text="emptyText || (crumb.length ? '该分类暂无子级数据' : '暂无数据')" />
    <template v-else>
      <div :key="`L${level}`" class="chart-canvas">
        <svg
          :viewBox="`0 0 ${W} ${H}`" role="img"
          :aria-label="level === 1 ? '一级柱状图' : `二级柱状图（${parentLabel}）`"
        >
          <defs>
            <linearGradient
              v-for="b in geom.bars" :key="`gd${b.i}`"
              :id="`${uid}-bg-${b.i}`" x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%" :stop-color="b.color" stop-opacity="0.95" />
              <stop offset="100%" :stop-color="b.color" stop-opacity="0.65" />
            </linearGradient>
          </defs>

          <line
            v-for="(v, i) in (showGrid ? geom.yTicks : [])" :key="`gl${i}`"
            :x1="padL" :x2="W - padR" :y1="geom.yScale(v)" :y2="geom.yScale(v)"
            class="chart-grid-line" stroke-dasharray="3 4"
          />

          <template v-if="showAxis">
            <text
              v-for="(v, i) in geom.yTicks" :key="`yt${i}`"
              :x="padL - 8" :y="geom.yScale(v)" class="chart-axis-label"
              text-anchor="end" dominant-baseline="middle"
            >{{ formatValue(v) }}</text>
            <line :x1="padL" :x2="W - padR" :y1="baseY" :y2="baseY" class="chart-axis" />
            <line :x1="padL" :x2="padL" :y1="padT" :y2="baseY" class="chart-axis" />
          </template>

          <g v-for="b in geom.bars" :key="`b${b.i}`">
            <rect
              :x="b.x" :y="mounted ? b.y : baseY" :width="b.w" :height="mounted ? b.h : 0"
              rx="6" ry="6" :fill="`url(#${uid}-bg-${b.i})`"
              :class="`chart-bar ${hover === b.i || legendHover === b.i ? 'is-hover' : ''} ${b.hasChildren ? 'is-drillable' : ''}`"
              :style="{
                transform: hover === b.i || legendHover === b.i ? 'translate(0px, -3px)' : 'translate(0,0)',
                transformBox: 'fill-box',
                transition: 'y 0.6s ease, height 0.6s ease, transform 0.15s ease',
                transitionDelay: `${b.i * 40}ms, ${b.i * 40}ms, 0ms`,
                cursor: b.hasChildren ? 'pointer' : 'pointer',
              }"
              @mouseenter="hover = b.i; legendHover = -1"
              @mouseleave="hover = -1"
              @click="handleBarClick(b)"
            />
            <!-- 可钻取提示：柱子顶端一个倒三角 -->
            <polygon
              v-if="b.hasChildren && mounted && b.h > 10"
              :points="`${b.x + b.w / 2 - 4},${b.y - 6} ${b.x + b.w / 2 + 4},${b.y - 6} ${b.x + b.w / 2},${b.y - 1}`"
              :fill="b.color" stroke="#fff" stroke-width="0.6"
              :style="{
                transformOrigin: `${b.x + b.w / 2}px ${b.y - 4}px`,
                animation: 'chart-pulse 1.6s ease-in-out infinite',
                animationDelay: `${b.i * 70}ms`,
              }"
            />
            <text
              v-if="showLabel" :x="b.x + b.w / 2" :y="b.y - 8"
              class="chart-data-label" text-anchor="middle" dominant-baseline="middle"
            >{{ formatValue(b.value) }}{{ unit }}</text>
            <text
              v-if="showAxis" :x="b.x + b.w / 2" :y="baseY + 16"
              class="chart-axis-label" text-anchor="middle"
            >{{ b.label }}</text>
          </g>
        </svg>
        <Tooltip v-if="tip" :x="tip.tipX" :y="tip.tipY" :vb-w="W" :vb-h="H">
          <span class="chart-tip-label">{{ tip.label }}</span>
          <span class="chart-tip-value">{{ formatValue(tip.value) }}{{ unit }}</span>
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
