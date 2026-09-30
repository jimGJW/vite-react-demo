<template>
  <!-- 异步选择器：远程搜索（可传 fetcher 或使用内置 mock）+ loading + 空态 + 键盘上下选择 -->
  <div class="m-async" ref="rootEl">
    <div class="m-async__control" :class="{ 'is-open': open }" @click="toggle">
      <span v-if="selected" class="m-async__value">
        {{ selected[labelKey] }}
        <b v-if="selected.desc" class="m-async__desc">{{ selected.desc }}</b>
      </span>
      <span v-else class="m-async__placeholder">{{ placeholder }}</span>
      <span class="m-async__caret">▾</span>
    </div>

    <div v-if="open" class="m-async__panel">
      <div class="m-async__search">
        <input
          ref="inputEl"
          v-model="keyword"
          class="m-async__input"
          placeholder="输入关键字远程搜索（400ms 防抖）"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="chooseActive"
        />
        <span v-if="loading" class="m-async__spinner" />
      </div>

      <ul class="m-async__list">
        <li
          v-for="(opt, i) in options"
          :key="opt[valueKey]"
          class="m-async__opt"
          :class="{ 'is-active': i === activeIndex, 'is-picked': selected?.[valueKey] === opt[valueKey] }"
          @mouseenter="activeIndex = i"
          @click="pick(opt)"
        >
          <span>{{ opt[labelKey] }}</span>
          <span v-if="opt.desc" class="m-async__opt-desc">{{ opt.desc }}</span>
        </li>
        <li v-if="!loading && !options.length" class="m-async__empty">
          {{ keyword ? `无匹配结果：${keyword}` : '输入关键字开始搜索' }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { debounce } from '../utils'

const props = defineProps({
  modelValue: { type: [String, Number, Object], default: null },
  fetcher: { type: Function, default: null }, // (keyword) => Promise<Array>
  placeholder: { type: String, default: '请选择' },
  labelKey: { type: String, default: 'label' },
  valueKey: { type: String, default: 'value' },
})
const emit = defineEmits(['update:modelValue', 'change'])

const open = ref(false)
const keyword = ref('')
const options = ref([])
const loading = ref(false)
const activeIndex = ref(0)
const rootEl = ref(null)
const inputEl = ref(null)
const selected = ref(typeof props.modelValue === 'object' ? props.modelValue : null)

/** 内置 mock 数据源：不传 fetcher 时用它演示远程搜索 */
const MOCK = [
  { value: 'ng', label: 'Angular', desc: 'DI + Signals' },
  { value: 'vue', label: 'Vue', desc: 'SFC + Composition' },
  { value: 'react', label: 'React', desc: 'Hooks' },
  { value: 'svelte', label: 'Svelte', desc: '编译期响应式' },
  { value: 'solid', label: 'Solid', desc: '细粒度响应式' },
  { value: 'qwik', label: 'Qwik', desc: '可恢复性' },
  { value: 'astro', label: 'Astro', desc: '内容优先' },
  { value: 'remix', label: 'Remix', desc: '全栈路由' },
]
const mockFetch = (kw) => new Promise((resolve) => {
  setTimeout(() => {
    const lower = kw.trim().toLowerCase()
    resolve(MOCK.filter((m) => !lower || m.label.toLowerCase().includes(lower) || m.desc.includes(kw)))
  }, 320)
})

const search = debounce(async (kw) => {
  loading.value = true
  try {
    const fn = props.fetcher || mockFetch
    const list = await fn(kw)
    options.value = Array.isArray(list) ? list : []
    activeIndex.value = 0
  } catch {
    options.value = []
  } finally {
    loading.value = false
  }
}, 400)

watch(keyword, (kw) => search(kw))

const toggle = () => {
  open.value = !open.value
  if (open.value) {
    search(keyword.value)
    requestAnimationFrame(() => inputEl.value?.focus())
  }
}

const pick = (opt) => {
  selected.value = opt
  emit('update:modelValue', opt[props.valueKey])
  emit('change', opt)
  open.value = false
}

const move = (delta) => {
  if (!options.value.length) return
  activeIndex.value = (activeIndex.value + delta + options.value.length) % options.value.length
}
const chooseActive = () => {
  const opt = options.value[activeIndex.value]
  if (opt) pick(opt)
}

/** 点击组件外部自动收起 */
const onDocClick = (e) => {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target)) open.value = false
}
document.addEventListener('click', onDocClick)
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  search.cancel()
})
</script>

<style scoped>
.m-async { position: relative; min-width: 240px; }
.m-async__control {
  display: flex; align-items: center; gap: 6px;
  min-height: 34px; padding: 5px 10px;
  border: 1px solid #dcdfe6; border-radius: 6px; background: #fff; cursor: pointer;
}
.m-async__control.is-open { border-color: #409eff; }
.m-async__value { font-size: 13px; color: #303133; display: flex; align-items: center; gap: 6px; }
.m-async__desc { font-weight: 400; font-size: 11px; color: #909399; }
.m-async__placeholder { font-size: 13px; color: #c0c4cc; }
.m-async__caret { margin-left: auto; color: #c0c4cc; font-size: 11px; }
.m-async__panel {
  position: absolute; z-index: 20; left: 0; right: 0; top: calc(100% + 4px);
  border: 1px solid #e4e7ed; border-radius: 8px; background: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08); overflow: hidden;
}
.m-async__search { position: relative; padding: 8px; border-bottom: 1px solid #f0f2f5; }
.m-async__input {
  width: 100%; border: 1px solid #e4e7ed; border-radius: 5px;
  padding: 5px 8px; font-size: 12.5px; outline: none;
}
.m-async__input:focus { border-color: #409eff; }
.m-async__spinner {
  position: absolute; right: 14px; top: 15px;
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid #d9ecff; border-top-color: #409eff;
  animation: m-spin 0.7s linear infinite;
}
@keyframes m-spin { to { transform: rotate(360deg); } }
.m-async__list { list-style: none; margin: 0; padding: 4px; max-height: 210px; overflow-y: auto; }
.m-async__opt {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 6px 8px; border-radius: 5px; font-size: 13px; color: #606266; cursor: pointer;
}
.m-async__opt.is-active { background: #f5f7fa; }
.m-async__opt.is-picked { color: #409eff; font-weight: 600; }
.m-async__opt-desc { font-size: 11px; color: #a8abb2; }
.m-async__empty { padding: 12px 8px; text-align: center; font-size: 12.5px; color: #c0c4cc; }
</style>
