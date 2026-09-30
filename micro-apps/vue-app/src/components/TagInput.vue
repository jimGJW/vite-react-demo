<template>
  <!-- 标签输入：回车/逗号成标签，退格删末尾，支持去重与上限 -->
  <div class="m-tags" :class="{ 'is-focus': focused }">
    <span v-for="(tag, i) in model" :key="tag" class="m-tags__item">
      <em v-if="i === 0" class="m-tags__star">★</em>{{ tag }}
      <button type="button" class="m-tags__close" @click="remove(i)">×</button>
    </span>
    <input
      ref="inputEl"
      v-model="draft"
      class="m-tags__input"
      :placeholder="model.length >= max ? `已达上限 ${max} 个` : placeholder"
      :disabled="model.length >= max"
      @focus="focused = true"
      @blur="focused = false"
      @keydown="onKeydown"
    />
  </div>
  <div class="m-row">
    <span class="m-chip m-chip--info">已选 {{ model.length }} / {{ max }}</span>
    <span v-if="dupTip" class="m-chip m-chip--warn">{{ dupTip }}</span>
    <button class="m-btn" type="button" @click="$emit('update:modelValue', [])">清空</button>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 6 },
  placeholder: { type: String, default: '输入后回车生成标签' },
  suggestions: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'change'])

const draft = ref('')
const focused = ref(false)
const dupTip = ref('')
const inputEl = ref(null)
const model = computed(() => props.modelValue)

let tipTimer = null
const flashTip = (msg) => {
  dupTip.value = msg
  if (tipTimer) clearTimeout(tipTimer)
  tipTimer = setTimeout(() => { dupTip.value = '' }, 1600)
}

const commit = () => {
  const v = draft.value.trim()
  if (!v) return
  if (model.value.includes(v)) {
    flashTip(`「${v}」已存在`)
    draft.value = ''
    return
  }
  if (model.value.length >= props.max) {
    flashTip(`最多 ${props.max} 个`)
    return
  }
  const next = [...model.value, v]
  emit('update:modelValue', next)
  emit('change', next)
  draft.value = ''
  nextTick(() => inputEl.value?.focus())
}

const remove = (i) => {
  const next = model.value.filter((_, idx) => idx !== i)
  emit('update:modelValue', next)
  emit('change', next)
}

/** 空输入时退格删掉最后一个标签 */
const onBackspace = () => {
  if (draft.value || !model.value.length) return
  remove(model.value.length - 1)
}

/** 统一键位处理：Enter / 逗号 提交，空输入 Backspace 删末尾（Vue 的按键修饰符不支持逗号，故手写） */
const onKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
    e.preventDefault()
    commit()
    return
  }
  if (e.key === 'Backspace') onBackspace()
}

watch(() => props.suggestions?.length, () => { /* 建议项由外部渲染，组件只负责值 */ })
</script>

<style scoped>
.m-tags {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  min-height: 36px; padding: 4px 8px;
  border: 1px solid #dcdfe6; border-radius: 6px; background: #fff;
  transition: border-color 0.15s;
}
.m-tags.is-focus { border-color: #409eff; box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12); }
.m-tags__item {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 4px 2px 8px; border-radius: 4px;
  background: #ecf5ff; color: #409eff; font-size: 12.5px;
}
.m-tags__star { font-style: normal; font-size: 10px; color: #e6a23c; }
.m-tags__close {
  border: 0; background: none; cursor: pointer;
  color: #409eff; font-size: 14px; line-height: 1; padding: 0 2px;
}
.m-tags__close:hover { color: #f56c6c; }
.m-tags__input {
  flex: 1; min-width: 140px; border: 0; outline: none;
  font-size: 13px; padding: 4px 2px; background: transparent;
}
</style>
