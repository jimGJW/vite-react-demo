<template>
  <!-- 触底加载：滚动到底部自动 loadMore，带「没有更多了」终止态 -->
  <div ref="rootEl" class="m-infinite" :style="{ maxHeight: `${height}px` }" @scroll="onScroll">
    <div v-for="(item, i) in items" :key="i" class="m-infinite__row">
      <slot :item="item" :index="i">
        <span class="m-infinite__idx">#{{ i + 1 }}</span>
        <span>{{ item[textKey] ?? item }}</span>
      </slot>
    </div>

    <div class="m-infinite__footer">
      <span v-if="loading" class="m-infinite__spinner" /> <span v-if="loading">加载中…</span>
      <span v-else-if="finished">— 没有更多了（共 {{ items.length }} 条）—</span>
      <span v-else>滚动到底部自动加载</span>
    </div>

    <!-- 兜底：IntersectionObserver 不可用时的哨兵节点仍可手动点击 -->
    <button v-if="!finished && !loading" class="m-btn m-infinite__more" type="button" @click="trigger">
      手动加载更多
    </button>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue'

const props = defineProps({
  loadMore: { type: Function, required: true }, // () => Promise<{ items, finished }>
  height: { type: Number, default: 260 },
  textKey: { type: String, default: 'text' },
})
const emit = defineEmits(['loaded'])

const items = ref([])
const loading = ref(false)
const finished = ref(false)
const rootEl = ref(null)
let page = 0
let sentinelOb = null

const trigger = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    page += 1
    const res = await props.loadMore(page)
    const chunk = Array.isArray(res) ? res : (res?.items || [])
    items.value = [...items.value, ...chunk]
    if (res?.finished || !chunk.length) finished.value = true
    emit('loaded', { page, count: items.value.length })
  } finally {
    loading.value = false
  }
}

const onScroll = (e) => {
  const el = e.target
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) trigger()
}

/** 首屏先来一页 */
trigger()

onUnmounted(() => { if (sentinelOb) sentinelOb.disconnect() })
defineExpose({ trigger, reset: () => { items.value = []; page = 0; finished.value = false; trigger() } })
</script>

<style scoped>
.m-infinite {
  overflow-y: auto; border: 1px solid #e4e7ed; border-radius: 8px; background: #fff;
}
.m-infinite__row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; font-size: 12.5px; color: #606266;
  border-bottom: 1px solid #f7f8fa;
}
.m-infinite__idx { color: #c0c4cc; min-width: 44px; font-variant-numeric: tabular-nums; }
.m-infinite__footer {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; font-size: 12px; color: #a8abb2;
}
.m-infinite__spinner {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid #d9ecff; border-top-color: #409eff;
  animation: m-inf-spin 0.7s linear infinite;
}
@keyframes m-inf-spin { to { transform: rotate(360deg); } }
.m-infinite__more { display: block; margin: 0 auto 10px; }
</style>
