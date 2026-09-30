<template>
  <!-- 下拉刷新：触摸/鼠标下拉超过阈值触发 refresh（移动端交互） -->
  <div class="m-pull">
    <div class="m-pull__hint" :style="{ height: `${pullHeight}px` }">
      <span v-if="state === 'pulling'">↓ 继续下拉刷新（{{ Math.round(pullHeight) }}px）</span>
      <span v-else-if="state === 'ready'">↑ 松手立即刷新</span>
      <span v-else-if="state === 'loading'">⟳ 正在刷新…</span>
      <span v-else>下拉可刷新 · 松手回弹</span>
    </div>
    <div
      class="m-pull__body"
      :style="{ transform: `translateY(${state === 'ready' ? 6 : 0}px)` }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onUp"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  threshold: { type: Number, default: 56 },
})
const emit = defineEmits(['refresh'])

const state = ref('idle') // idle | pulling | ready | loading
const pullHeight = ref(0)
let startY = 0
let tracking = false

const onDown = (e) => {
  if (state.value === 'loading') return
  startY = e.clientY
  tracking = true
}

const onMove = (e) => {
  if (!tracking || state.value === 'loading') return
  const delta = e.clientY - startY
  if (delta <= 0) {
    pullHeight.value = 0
    state.value = 'idle'
    return
  }
  /** 阻尼曲线：越往下拉越"沉"，避免无限拉伸 */
  pullHeight.value = Math.min(props.threshold * 1.6, delta * 0.55)
  state.value = pullHeight.value >= props.threshold ? 'ready' : 'pulling'
}

const onUp = async () => {
  if (!tracking) return
  tracking = false
  if (state.value !== 'ready') {
    pullHeight.value = 0
    state.value = 'idle'
    return
  }
  state.value = 'loading'
  pullHeight.value = props.threshold * 0.9
  try {
    await new Promise((resolve) => emit('refresh', resolve))
  } finally {
    state.value = 'idle'
    pullHeight.value = 0
  }
}
</script>

<style scoped>
.m-pull {
  border: 1px solid #e4e7ed; border-radius: 8px; background: #fff; overflow: hidden;
}
.m-pull__hint {
  display: flex; align-items: center; justify-content: center;
  font-size: 12.5px; color: #909399;
  transition: height 0.18s ease; overflow: hidden;
  background: #fafcff;
}
.m-pull__body {
  padding: 12px 14px;
  transition: transform 0.15s ease;
  touch-action: pan-y;
  user-select: none;
}
</style>
