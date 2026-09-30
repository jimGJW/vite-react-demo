<template>
  <!-- 拖拽排序列表：HTML5 draggable，零依赖（v-model 双向绑定数组） -->
  <ul class="m-drag">
    <li
      v-for="(item, i) in model"
      :key="item[valueKey] ?? i"
      class="m-drag__item"
      :class="{
        'is-dragging': dragIndex === i,
        'is-over': overIndex === i && dragIndex !== i,
      }"
      draggable="true"
      @dragstart="onDragStart(i)($event)"
      @dragover="onDragOver(i)($event)"
      @drop="onDrop(i)($event)"
      @dragend="onDragEnd"
    >
      <span class="m-drag__handle">⋮⋮</span>
      <span class="m-drag__order">{{ i + 1 }}</span>
      <slot :item="item" :index="i">{{ item[textKey] }}</slot>
      <span class="m-drag__pos">{{ i === 0 ? '置顶' : '' }}</span>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { useDragList } from '../composables'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  textKey: { type: String, default: 'text' },
  valueKey: { type: String, default: 'id' },
})
const emit = defineEmits(['update:modelValue', 'reorder'])

const model = computed(() => props.modelValue)
const { dragIndex, overIndex, onDragStart, onDragOver, onDrop, onDragEnd } = useDragList(
  model,
  (next) => {
    emit('update:modelValue', next)
    emit('reorder', next)
  },
)
</script>

<style scoped>
.m-drag { list-style: none; margin: 0; padding: 0; }
.m-drag__item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; margin-bottom: 6px;
  border: 1px solid #e4e7ed; border-radius: 7px; background: #fff;
  font-size: 13px; color: #606266; cursor: grab;
  transition: all 0.15s;
}
.m-drag__item:hover { border-color: #c6e2ff; }
.m-drag__item.is-dragging { opacity: 0.45; border-style: dashed; }
.m-drag__item.is-over { border-color: #409eff; background: #f2f8ff; }
.m-drag__handle { color: #c0c4cc; letter-spacing: -2px; user-select: none; }
.m-drag__order {
  width: 20px; height: 20px; border-radius: 50%;
  background: #f0f2f5; color: #909399; font-size: 11px;
  display: inline-flex; align-items: center; justify-content: center;
}
.m-drag__pos { margin-left: auto; font-size: 11px; color: #409eff; }
</style>
