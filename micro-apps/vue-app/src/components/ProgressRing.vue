<template>
  <!-- 环形进度：SVG 描边 + HTML 浮层插槽（浮层用于放文字/图标，避免 SVG 文本定位麻烦） -->
  <div class="m-ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :viewBox="`0 0 ${size} ${size}`" class="m-ring__svg">
      <circle
        :cx="half" :cy="half" :r="radius"
        fill="none" :stroke="trackColor" :stroke-width="stroke"
      />
      <circle
        :cx="half" :cy="half" :r="radius"
        fill="none" :stroke="strokeColor" :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${half} ${half})`"
        class="m-ring__bar"
      />
    </svg>
    <div class="m-ring__overlay">
      <slot>
        <span class="m-ring__value">{{ percent }}%</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percent: { type: Number, default: 0 },
  size: { type: Number, default: 96 },
  stroke: { type: Number, default: 8 },
  tone: { type: String, default: 'primary' }, // primary | ok | warn | danger
})

const TONES = { primary: '#409eff', ok: '#67c23a', warn: '#e6a23c', danger: '#f56c6c' }
const half = computed(() => props.size / 2)
const radius = computed(() => props.size / 2 - props.stroke / 2 - 1)
const circumference = computed(() => 2 * Math.PI * radius.value)
const ratio = computed(() => Math.min(100, Math.max(0, props.percent)) / 100)
const dashOffset = computed(() => circumference.value * (1 - ratio.value))
const strokeColor = computed(() => TONES[props.tone] || TONES.primary)
const trackColor = '#f0f2f5'
</script>

<style scoped>
.m-ring { position: relative; display: inline-flex; }
.m-ring__svg { width: 100%; height: 100%; display: block; }
.m-ring__bar { transition: stroke-dashoffset 0.45s ease; }
.m-ring__overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; gap: 1px;
}
.m-ring__value { font-size: 16px; font-weight: 700; color: #303133; font-variant-numeric: tabular-nums; }
</style>
