<script setup>
import { ref, computed, h, useId } from 'vue'
import {
  useMounted, ChartEmpty, ChartSkeleton, ChartHeader,
  ChartTypeSwitch, PALETTE, DEFAULT_FORMAT,
} from './shared.js'
import LineChart from './LineChart.vue'
import BarChart from './BarChart.vue'
import PieChart from './PieChart.vue'
import RadarChart from './RadarChart.vue'

/** 支持切换的图表类型（<script setup> 不支持 export，统一在 index.js 中对外导出） */
const SUPPORTED_TYPES = ['line', 'bar', 'pie', 'radar']

/**
 * SwitchableChart · 图标切换 折线图 / 柱状图 / 饼图 / 雷达图。
 * 同一份统一数据 data: [{ label, value, max?, color? }]，点击右上角图标按钮切换类型。
 */
const props = defineProps({
  data: { type: Array, default: () => [] },
  types: { type: Array, default: () => ['line', 'bar', 'pie'] },
  defaultType: { type: String, default: 'line' },
  type: { type: String, default: undefined },   // 受控模式
  height: { type: Number, default: 300 },
  size: { type: Number, default: 300 },
  color: { type: String, default: undefined },
  colors: { type: Array, default: () => PALETTE },
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
const emit = defineEmits(['point-click', 'type-change', 'switch'])

const mounted = useMounted()
const rawId = useId()
const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')
const internalType = ref(props.defaultType)

const activeType = computed(() => props.type || internalType.value)
const safeType = computed(() =>
  props.types.includes(activeType.value) ? activeType.value : props.types[0] || props.defaultType,
)

function changeType(t) {
  if (t === safeType.value || !props.types.includes(t)) return
  internalType.value = t
  emit('type-change', t)
  emit('switch', t, props.data)
}

/** 把统一 data 适配为各底层组件的要求 */
const adapted = computed(() => {
  const maxVal = Math.max(...props.data.map((d) => d.value), 0)
  const radarMax = Math.max(
    ...props.data.map((d) => (typeof d.max === 'number' && Number.isFinite(d.max) ? d.max : Math.ceil(maxVal * 1.1 || 1))),
    1,
  )
  const base = props.data.map((d) => ({ label: d.label, value: d.value, color: d.color }))
  return {
    base,
    pie: base,
    radar: props.data.map((d) => ({
      label: d.label,
      value: d.value,
      max: (typeof d.max === 'number' && Number.isFinite(d.max)) ? d.max : radarMax,
      color: d.color,
    })),
  }
})

/** 单色：line/bar/radar 常用；pie 走 colors 调色板 */
const lineColor = computed(() => props.color || props.colors[0])

/** 外部 actions + 类型切换器合并 */
const mergedActions = computed(() => {
  const list = []
  if (props.actions != null) {
    list.push(...(Array.isArray(props.actions) ? props.actions : [props.actions]))
  }
  list.push(h(ChartTypeSwitch, { types: props.types, value: safeType.value, onChange: changeType }))
  return list
})

const skeletonHeight = computed(() => (safeType.value === 'pie' ? props.size : props.height))
</script>

<template>
  <div
    :class="`chart chart-switchable ${className}`"
    :data-active-type="safeType"
    :aria-label="`当前图表类型：${safeType}`"
  >
    <ChartHeader
      :title="title" :subtitle="subtitle" :description="description"
      :actions="mergedActions" :show-title="showTitle"
    />
    <ChartSkeleton v-if="loading" :height="skeletonHeight" />
    <ChartEmpty v-else-if="!data || !data.length" :text="emptyText" />

    <!-- 仅当 mounted 后渲染内部图表，保证各底层组件 useMounted 入场动画正常 -->
    <template v-else-if="mounted">
      <LineChart
        v-if="safeType === 'line'" :key="`${uid}-line`"
        :data="adapted.base" :height="height"
        :color="lineColor" :format-value="formatValue" :unit="unit"
        :loading="false" :legend="showLegend" :show-label="showLabel"
        :show-axis="showAxis" :show-grid="showGrid" :show-title="false"
        class-name="chart-switchable-inner"
        @point-click="(item, i) => emit('point-click', item, i)"
      />
      <BarChart
        v-else-if="safeType === 'bar'" :key="`${uid}-bar`"
        :data="adapted.base" :height="height"
        :color="lineColor" :format-value="formatValue" :unit="unit"
        :loading="false" :legend="showLegend" :show-label="showLabel"
        :show-axis="showAxis" :show-grid="showGrid" :show-title="false"
        class-name="chart-switchable-inner"
        @point-click="(item, i) => emit('point-click', item, i)"
      />
      <PieChart
        v-else-if="safeType === 'pie'" :key="`${uid}-pie`"
        :data="adapted.pie" :size="size"
        :palette="colors" :format-value="formatValue" :unit="unit"
        :loading="false" :legend="showLegend" :show-label="showLabel" :show-title="false"
        class-name="chart-switchable-inner"
        @point-click="(item, i) => emit('point-click', item, i)"
      />
      <RadarChart
        v-else-if="safeType === 'radar'" :key="`${uid}-radar`"
        :data="adapted.radar" :size="size"
        :color="lineColor" :format-value="formatValue" :unit="unit"
        :loading="false" :show-label="showLabel"
        :show-axis="showAxis" :show-grid="showGrid" :show-title="false"
        class-name="chart-switchable-inner"
        @point-click="(item, i) => emit('point-click', item, i)"
      />
    </template>
  </div>
</template>
