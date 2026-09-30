<template>
  <!-- 虚拟滚动：只渲染可视窗口内的行，万级数据也不掉帧 -->
  <div
    ref="viewportEl"
    class="m-virtual"
    :style="{ height: `${height}px` }"
    @scroll="onScroll"
  >
    <div class="m-virtual__phantom" :style="{ height: `${totalHeight}px` }" />
    <div class="m-virtual__window" :style="{ transform: `translateY(${offsetY}px)` }">
      <div
        v-for="item in visible"
        :key="item.__index"
        class="m-virtual__row"
        :style="{ height: `${itemSize}px` }"
      >
        <slot :item="item" :index="item.__index">
          <span class="m-virtual__idx">#{{ item.__index + 1 }}</span>
          <span>{{ item[textKey] }}</span>
        </slot>
      </div>
    </div>
    <div class="m-virtual__hud">
      <span class="m-chip m-chip--info">总数 {{ items.length }}</span>
      <span class="m-chip m-chip--ok">已渲染 {{ visible.length }}</span>
      <span class="m-chip">滚动 {{ Math.round(scrollTop) }}px</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  itemSize: { type: Number, default: 34 },
  height: { type: Number, default: 300 },
  overscan: { type: Number, default: 4 },
  textKey: { type: String, default: 'text' },
})

const viewportEl = ref(null)
const scrollTop = ref(0)

const totalHeight = computed(() => props.items.length * props.itemSize)
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / props.itemSize) - props.overscan))
const visibleCount = computed(() => Math.ceil(props.height / props.itemSize) + props.overscan * 2)
const endIndex = computed(() => Math.min(props.items.length, startIndex.value + visibleCount.value))
const offsetY = computed(() => startIndex.value * props.itemSize)

const visible = computed(() => props.items
  .slice(startIndex.value, endIndex.value)
  .map((item, i) => ({ ...item, __index: startIndex.value + i })))

const onScroll = (e) => { scrollTop.value = e.target.scrollTop }
onMounted(() => { scrollTop.value = viewportEl.value?.scrollTop || 0 })
</script>

<style scoped>
.m-virtual {
  position: relative; overflow-y: auto;
  border: 1px solid #e4e7ed; border-radius: 8px; background: #fff;
  contain: strict;
}
.m-virtual__phantom { width: 1px; opacity: 0; }
.m-virtual__window { position: absolute; top: 0; left: 0; right: 0; will-change: transform; }
.m-virtual__row {
  display: flex; align-items: center; gap: 10px;
  padding: 0 12px; font-size: 12.5px; color: #606266;
  border-bottom: 1px solid #f7f8fa;
  box-sizing: border-box;
}
.m-virtual__idx { color: #c0c4cc; font-variant-numeric: tabular-nums; min-width: 46px; }
.m-virtual__hud {
  position: sticky; bottom: 0; display: flex; gap: 6px;
  padding: 6px 8px; background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid #f0f2f5;
}
</style>
