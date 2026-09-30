<template>
  <!-- 指标卡：标题 / 主数值 / 单位 / 环比趋势 / 迷你走势 -->
  <div class="m-stat" :class="`m-stat--${tone}`">
    <div class="m-stat__head">
      <span class="m-stat__title">{{ title }}</span>
      <span v-if="badge" class="m-stat__badge">{{ badge }}</span>
    </div>

    <div class="m-stat__value">
      <span class="m-stat__num">{{ display }}</span>
      <span v-if="unit" class="m-stat__unit">{{ unit }}</span>
    </div>

    <div v-if="trend !== null" class="m-stat__trend" :class="trendClass">
      <span class="m-stat__arrow">{{ trendUp ? '▲' : '▼' }}</span>
      <span>{{ Math.abs(trend) }}%</span>
      <span class="m-stat__vs">较上期</span>
    </div>

    <MChart
      v-if="spark?.length"
      class="m-stat__spark"
      type="sparkline"
      :data="spark"
      :color="sparkColor"
      :height="34"
      :show-grid="false"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MChart from './MChart.vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  unit: { type: String, default: '' },
  badge: { type: String, default: '' },
  trend: { type: Number, default: null }, // 环比百分比，null 表示不展示
  tone: { type: String, default: 'primary' }, // primary | ok | warn | danger
  spark: { type: Array, default: () => [] },
  digits: { type: Number, default: null },
})

const display = computed(() => {
  if (typeof props.value !== 'number') return props.value
  return props.value.toLocaleString('zh-CN', {
    minimumFractionDigits: props.digits ?? 0,
    maximumFractionDigits: props.digits ?? 0,
  })
})

const trendUp = computed(() => (props.trend ?? 0) >= 0)
/** 中国市场约定：涨红跌绿 */
const trendClass = computed(() => (trendUp.value ? 'is-up' : 'is-down'))
const sparkColor = computed(() => (trendUp.value ? '#f56c6c' : '#67c23a'))
</script>

<style scoped>
.m-stat {
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 12px 14px 6px;
  background: #fff;
  overflow: hidden;
}
.m-stat::before {
  content: '';
  position: absolute; inset: 0 auto 0 0; width: 3px;
  background: var(--tone, #409eff);
}
.m-stat--primary { --tone: #409eff; }
.m-stat--ok { --tone: #67c23a; }
.m-stat--warn { --tone: #e6a23c; }
.m-stat--danger { --tone: #f56c6c; }

.m-stat__head { display: flex; align-items: center; gap: 6px; }
.m-stat__title { font-size: 12.5px; color: #909399; }
.m-stat__badge {
  font-size: 11px; padding: 0 6px; border-radius: 999px;
  background: #ecf5ff; color: #409eff;
}
.m-stat__value { display: flex; align-items: baseline; gap: 4px; margin: 4px 0 2px; }
.m-stat__num {
  font-size: 24px; font-weight: 700; color: #303133;
  font-variant-numeric: tabular-nums;
}
.m-stat__unit { font-size: 12px; color: #909399; }
.m-stat__trend { display: flex; align-items: center; gap: 3px; font-size: 12px; }
.m-stat__trend.is-up { color: #f56c6c; }
.m-stat__trend.is-down { color: #67c23a; }
.m-stat__arrow { font-size: 10px; }
.m-stat__vs { color: #c0c4cc; margin-left: 2px; }
.m-stat__spark { display: block; margin-top: 2px; }
</style>
