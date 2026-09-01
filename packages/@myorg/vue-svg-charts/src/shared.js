import { ref, onMounted, onUnmounted, h, defineComponent } from 'vue'
import './Charts.scss'

/* =====================================================================
 * 图表共享层 · 工具函数 + composable + 通用函数式组件（Vue 3 版本）
 * 所有图表组件均从本文件引入，样式在此处统一导入一次
 * 样式全部带 fallback，其他项目无需定义 CSS 变量即可显示 Indigo 风格
 * ===================================================================== */

/** 默认数值格式化：千分位 */
export const DEFAULT_FORMAT = (v) =>
  Number.isFinite(v) ? Math.round(v).toLocaleString() : String(v)

/** 默认调色板（多系列图表），全部引用 CSS 变量带 fallback */
export const PALETTE = [
  'var(--c-primary, #4f46e5)',
  'var(--c-accent, #06b6d4)',
  'var(--c-accent-2, #8b5cf6)',
  'var(--c-success, #10b981)',
  'var(--c-warning, #f59e0b)',
  'var(--c-danger, #ef4444)',
  'var(--c-info, #3b82f6)',
]

/** 入场动画触发器：挂载后下一帧返回 true */
export function useMounted() {
  const mounted = ref(false)
  let raf = 0
  onMounted(() => {
    raf = requestAnimationFrame(() => { mounted.value = true })
  })
  onUnmounted(() => cancelAnimationFrame(raf))
  return mounted
}

/** 取一个近似步长（nice number）。 */
export function niceNum(x) {
  if (x <= 0) return 1
  const exp = Math.floor(Math.log10(x))
  const f = x / 10 ** exp
  let nf
  if (f < 1.5) nf = 1
  else if (f < 3) nf = 2
  else if (f < 7) nf = 5
  else nf = 10
  return nf * 10 ** exp
}

/** 计算坐标轴友好的上下界与步长。 */
export function niceBounds(min, max, ticks = 4) {
  if (min === max) {
    min = min < 0 ? min - 1 : 0
    max = (max || 0) + 1
  }
  const span = max - min
  const step = niceNum(span / ticks) || 1
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  return { niceMin, niceMax, step }
}

/** 极坐标转笛卡尔（SVG y 向下：0°=右，90°=下，-90°=上）。 */
export function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

/* =====================================================================
 * 通用函数式组件（用 h 渲染，便于图表 SFC 直接 import 使用）
 * ===================================================================== */

/** 空状态占位 */
export const ChartEmpty = defineComponent({
  name: 'ChartEmpty',
  props: { text: { type: String, default: '暂无数据' } },
  setup(props) {
    return () => h('div', { class: 'chart-empty' }, [h('span', props.text)])
  },
})

/** 加载骨架 */
export const ChartSkeleton = defineComponent({
  name: 'ChartSkeleton',
  props: { height: { type: Number, default: 300 } },
  setup(props) {
    return () => h('div', { class: 'chart-skeleton', style: { height: props.height + 'px' }, 'aria-hidden': 'true' })
  },
})

/** Tooltip 浮层（玻璃态），按 viewBox 坐标百分比定位 */
export const Tooltip = defineComponent({
  name: 'ChartTooltip',
  props: {
    x: Number, y: Number, vbW: Number, vbH: Number,
  },
  setup(props, { slots }) {
    return () => h('div', {
      class: 'chart-tip',
      style: {
        left: `${(props.x / props.vbW) * 100}%`,
        top: `${(props.y / props.vbH) * 100}%`,
      },
    }, slots.default?.())
  },
})

/** 标题区 */
export const ChartHeader = defineComponent({
  name: 'ChartHeader',
  props: {
    title: [String, Object], subtitle: [String, Object],
    description: [String, Object], actions: [Object, Array],
    showTitle: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    return () => {
      if (!props.showTitle || (props.title == null && props.subtitle == null && props.description == null && props.actions == null && !slots.actions)) return null
      const children = []
      const textChildren = []
      if (props.title != null) textChildren.push(h('h4', { class: 'chart-title' }, props.title))
      if (props.subtitle != null) textChildren.push(h('p', { class: 'chart-subtitle' }, props.subtitle))
      if (props.description != null) textChildren.push(h('div', { class: 'chart-desc' }, props.description))
      if (textChildren.length) children.push(h('div', { class: 'chart-head-text' }, textChildren))
      const actions = props.actions != null ? props.actions : slots.actions?.()
      if (actions != null) children.push(h('div', { class: 'chart-actions' }, [actions]))
      return h('div', { class: 'chart-head' }, children)
    }
  },
})

/** 通用图例列表 */
export const LegendList = defineComponent({
  name: 'LegendList',
  props: {
    items: { type: Array, default: () => [] },
    hover: { type: Number, default: -1 },
  },
  emits: ['hover'],
  setup(props, { emit }) {
    return () => h('ul', { class: 'chart-legend' },
      props.items.map((it, i) => h('li', {
        key: i,
        class: props.hover === i ? 'is-hover' : '',
        onMouseenter: () => emit('hover', i),
        onMouseleave: () => emit('hover', -1),
      }, [
        h('span', { class: 'chart-legend-dot', style: { background: it.color } }),
        h('span', { class: 'chart-legend-label' }, it.label),
        h('span', { class: 'chart-legend-value' }, it.value),
        it.pct != null && h('span', { class: 'chart-legend-pct' }, it.pct),
      ].filter(Boolean)))
    )
  },
})

/* —— SVG 小图标 —— */
export const ChartLineIcon = (props) =>
  h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true', ...props }, [
    h('path', { d: 'M3 20h18' }),
    h('path', { d: 'M3 16V3h18' }),
    h('path', { d: 'M4 13 l4 -5 l4 3 l4 -8 l4 7', fill: 'none' }),
  ])
export const ChartBarIcon = (props) =>
  h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true', ...props }, [
    h('path', { d: 'M3 20h18' }),
    h('rect', { x: 4, y: 10, width: 3.2, height: 10, rx: 1 }),
    h('rect', { x: 9.4, y: 5, width: 3.2, height: 15, rx: 1 }),
    h('rect', { x: 14.8, y: 13, width: 3.2, height: 7, rx: 1 }),
  ])
export const ChartPieIcon = (props) =>
  h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true', ...props }, [
    h('path', { d: 'M12 3 a9 9 0 0 1 9 9 h -9 z' }),
    h('path', { d: 'M12 3 v9 h 9 a9 9 0 0 1 -9 9 a9 9 0 0 1 -9 -9 a9 9 0 0 1 9 -9' }),
  ])
export const ChartAreaIcon = (props) =>
  h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true', ...props }, [
    h('path', { d: 'M3 20h18' }),
    h('path', { d: 'M3 16V3h18v13' }),
    h('path', { d: 'M4 14 l4 -6 l4 3 l4 -9 l4 10 l-16 2 z' }),
  ])
export const ChartRadarIcon = (props) =>
  h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true', ...props }, [
    h('polygon', { points: '12,3 21,8 18,19 6,19 3,8' }),
    h('polygon', { points: '12,7 17,10 15.5,16.5 8.5,16.5 7,10', opacity: 0.7 }),
  ])

/** 图标类型 -> SVG 组件的默认映射 */
export const DEFAULT_ICON_MAP = {
  line: ChartLineIcon, bar: ChartBarIcon, pie: ChartPieIcon,
  area: ChartAreaIcon, radar: ChartRadarIcon,
}
/** 默认类型 -> 标题映射 */
export const DEFAULT_LABEL_MAP = {
  line: '切换为折线图', bar: '切换为柱状图', pie: '切换为饼图',
  area: '切换为面积图', radar: '切换为雷达图',
}

/** ChartTypeSwitch · 图表类型切换图标按钮组 */
export const ChartTypeSwitch = defineComponent({
  name: 'ChartTypeSwitch',
  props: {
    types: { type: Array, default: () => ['line', 'bar', 'pie'] },
    value: String,
    iconMap: { type: Object, default: () => DEFAULT_ICON_MAP },
    labelMap: { type: Object, default: () => DEFAULT_LABEL_MAP },
    className: { type: String, default: '' },
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () => h('div', {
      class: `chart-type-switch ${props.className}`,
      role: 'tablist', 'aria-label': '图表类型切换',
    }, props.types.map((t) => {
      const Icon = props.iconMap[t] || DEFAULT_ICON_MAP[t] || ChartLineIcon
      const title = props.labelMap[t] || t
      const active = props.value === t
      return h('button', {
        type: 'button',
        key: t, role: 'tab', 'aria-selected': active,
        'aria-label': title, title, tabindex: active ? 0 : -1,
        class: active ? 'is-active' : '',
        onClick: () => emit('change', t),
      }, [h(Icon)])
    }))
  },
})

/** ChartCard · 通用图表容器 */
export const ChartCard = defineComponent({
  name: 'ChartCard',
  props: {
    title: [String, Object], subtitle: [String, Object],
    description: [String, Object], actions: [Object, Array],
    className: { type: String, default: '' },
    bodyClassName: { type: String, default: '' },
    showTitle: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    return () => {
      const header = h(ChartHeader, {
        title: props.title, subtitle: props.subtitle,
        description: props.description, actions: props.actions,
        showTitle: props.showTitle,
      }, { actions: slots.actions })
      return h('div', { class: `chart-card ${props.className}` }, [
        header,
        h('div', { class: `chart-card-body ${props.bodyClassName}` }, slots.default?.()),
      ])
    }
  },
})
