<template>
  <!-- 多行省略 + 展开收起（按行数用 -webkit-line-clamp 截断） -->
  <div class="m-ellipsis">
    <p
      ref="textEl"
      class="m-ellipsis__text"
      :style="textStyle"
    >{{ text }}</p>
    <button
      v-if="overflow"
      class="m-ellipsis__toggle"
      type="button"
      @click="expanded = !expanded"
    >{{ expanded ? '收起' : '展开' }}</button>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  lines: { type: Number, default: 2 },
})
const expanded = ref(false)
const overflow = ref(false)
const textEl = ref(null)

const textStyle = computed(() => (
  expanded.value
    ? { display: 'block' }
    : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: String(props.lines), overflow: 'hidden' }
))

/** 真实测量：截断态高度 < 完整高度 → 说明被省略了 */
const measure = async () => {
  await nextTick()
  const el = textEl.value
  if (!el) return
  const clamped = el.scrollHeight
  const wasExpanded = expanded.value
  expanded.value = true
  await nextTick()
  const full = el.scrollHeight
  expanded.value = wasExpanded
  await nextTick()
  overflow.value = full > clamped + 1
}

onMounted(measure)
watch(() => [props.text, props.lines], measure)
</script>

<style scoped>
.m-ellipsis__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #606266;
}
.m-ellipsis__toggle {
  border: 0;
  background: none;
  color: #409eff;
  font-size: 12.5px;
  cursor: pointer;
  padding: 2px 0;
}
</style>
