<template>
  <!-- 跑马灯：CSS 动画无缝滚动，hover 暂停 -->
  <div class="m-marquee" :class="{ 'is-vertical': vertical }" @mouseenter="paused = true" @mouseleave="paused = false">
    <div
      class="m-marquee__track"
      :class="{ 'is-paused': paused }"
      :style="trackStyle"
    >
      <span v-for="(item, i) in loopItems" :key="i" class="m-marquee__item">
        <slot :item="item" :index="i % (items.length || 1)">{{ item }}</slot>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  speed: { type: Number, default: 40 }, // 秒/圈（越大越慢）
  vertical: { type: Boolean, default: false },
  gap: { type: Number, default: 32 },
})
const paused = ref(false)
/** 内容复制一份，配合 translateX(-50%) 实现无缝衔接 */
const loopItems = computed(() => [...props.items, ...props.items])
const trackStyle = computed(() => ({
  '--dur': `${props.speed}s`,
  '--gap': `${props.gap}px`,
}))
</script>

<style scoped>
.m-marquee {
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
  padding: 7px 0;
}
.m-marquee__track {
  display: flex;
  gap: var(--gap);
  width: max-content;
  animation: m-scroll-x var(--dur) linear infinite;
}
.m-marquee__track.is-paused { animation-play-state: paused; }
.m-marquee__item { font-size: 12.5px; color: #606266; white-space: nowrap; }

@keyframes m-scroll-x {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* 竖向：内容需换行排布 */
.m-marquee.is-vertical { height: 96px; }
.m-marquee.is-vertical .m-marquee__track {
  flex-direction: column;
  animation-name: m-scroll-y;
}
@keyframes m-scroll-y {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}
</style>
