/**
 * vue-app 组合式函数（Composables）—— Vue 官方推荐的逻辑复用方式
 *
 * 全部基于 ref / computed / watch / 生命周期钩子实现，
 * 在任意组件 setup 中直接调用；副作用一律在 onUnmounted 里清理。
 */
import { computed, onUnmounted, reactive, readonly, ref, shallowRef, watch } from 'vue'
import { debounce, paginate, sortBy, clamp, formatDuration } from '../utils'

/* ============================ 状态类 ============================ */

/** 计数器：步进 + min/max 边界 + 重置 */
export function useCounter(initial = 0, { min = -Infinity, max = Infinity, step = 1 } = {}) {
  const count = ref(initial)
  const inc = () => { count.value = Math.min(count.value + step, max) }
  const dec = () => { count.value = Math.max(count.value - step, min) }
  const reset = (v = initial) => { count.value = v }
  const atMax = computed(() => count.value >= max)
  const atMin = computed(() => count.value <= min)
  return { count, inc, dec, reset, atMax, atMin }
}

/** 布尔开关 */
export function useToggle(initial = false) {
  const on = ref(initial)
  const toggle = (v) => { on.value = typeof v === 'boolean' ? v : !on.value }
  return { on, toggle }
}

/** localStorage 持久化 ref：读写自动同步，跨刷新保留 */
export function useLocalStorage(key, initial) {
  const read = () => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : JSON.parse(raw)
    } catch {
      return initial
    }
  }
  const state = ref(read())
  watch(
    state,
    (v) => {
      try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* 容量满/隐私模式 */ }
    },
    { deep: true },
  )
  const remove = () => {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    state.value = initial
  }
  return { state, remove }
}

/** sessionStorage 版本 */
export function useSessionStorage(key, initial) {
  const read = () => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw === null ? initial : JSON.parse(raw)
    } catch {
      return initial
    }
  }
  const state = ref(read())
  watch(state, (v) => {
    try { sessionStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ }
  }, { deep: true })
  return { state }
}

/* ============================ 时序 / 副作用 ============================ */

/** 响应式当前时间（默认每秒 tick） */
export function useNow(interval = 1000) {
  const now = ref(new Date())
  const timer = setInterval(() => { now.value = new Date() }, interval)
  onUnmounted(() => clearInterval(timer))
  return { now }
}

/** 防抖 ref：写入后延迟 ms 才更新（搜索框、筛选条件） */
export function useDebouncedRef(value, delay = 300) {
  const source = ref(value)
  const debounced = ref(value)
  const update = debounce((v) => { debounced.value = v }, delay)
  watch(source, (v) => update(v))
  onUnmounted(() => update.cancel())
  return { source, debounced }
}

/** 倒计时：start/pause/reset，秒级递减，结束回调一次 */
export function useCountdown(seconds = 60, { autoStart = false, onEnd } = {}) {
  const remain = ref(Math.max(0, Math.floor(seconds)))
  const running = ref(false)
  let timer = null

  const stop = () => {
    running.value = false
    if (timer) clearInterval(timer)
    timer = null
  }
  const start = (s = remain.value) => {
    stop()
    remain.value = Math.max(0, Math.floor(s))
    if (remain.value === 0) return
    running.value = true
    timer = setInterval(() => {
      remain.value -= 1
      if (remain.value <= 0) {
        stop()
        onEnd?.()
      }
    }, 1000)
  }
  const reset = (s = seconds) => { stop(); remain.value = Math.max(0, Math.floor(s)) }
  if (autoStart) start()
  onUnmounted(stop)

  return { remain, running, start, stop, reset, text: computed(() => formatDuration(remain.value)) }
}

/** 轮询：立即执行一次后按 interval 重复，可暂停 */
export function usePolling(fn, interval = 5000, { immediate = true } = {}) {
  const active = ref(false)
  let timer = null
  const tick = async () => { await fn() }
  const start = () => {
    if (active.value) return
    active.value = true
    if (immediate) tick()
    timer = setInterval(tick, interval)
  }
  const stop = () => {
    active.value = false
    if (timer) clearInterval(timer)
    timer = null
  }
  const toggle = () => (active.value ? stop() : start())
  onUnmounted(stop)
  return { active, start, stop, toggle }
}

/* ============================ DOM / 浏览器 ============================ */

/** 鼠标位置追踪（组件卸载自动移除监听） */
export function useMouse() {
  const x = ref(0)
  const y = ref(0)
  const onMove = (e) => { x.value = e.clientX; y.value = e.clientY }
  window.addEventListener('mousemove', onMove, { passive: true })
  onUnmounted(() => window.removeEventListener('mousemove', onMove))
  return { x, y }
}

/** 事件监听：自动绑/解，支持 window/target 与 passive */
export function useEventListener(target, type, handler, options = { passive: true }) {
  const el = typeof target === 'function' ? target() : target
  el?.addEventListener?.(type, handler, options)
  onUnmounted(() => el?.removeEventListener?.(type, handler, options))
}

/** 元素进入视口（IntersectionObserver 封装） */
export function useIntersection(options = { threshold: 0.1 }) {
  const elRef = shallowRef(null)
  const isVisible = ref(false)
  let ob = null

  watch(elRef, (el) => {
    ob?.disconnect()
    if (!el || typeof IntersectionObserver === 'undefined') return
    ob = new IntersectionObserver(([entry]) => { isVisible.value = entry.isIntersecting }, options)
    ob.observe(el)
  }, { flush: 'post' })
  onUnmounted(() => ob?.disconnect())

  return { elRef, isVisible }
}

/** 媒体查询匹配 */
export function useMediaQuery(query) {
  const matches = ref(false)
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mql = window.matchMedia(query)
    matches.value = mql.matches
    const onChange = (e) => { matches.value = e.matches }
    mql.addEventListener('change', onChange)
    onUnmounted(() => mql.removeEventListener('change', onChange))
  }
  return { matches }
}

/** 剪贴板：copy(text) + 最近一次结果 */
export function useClipboard(timeout = 1600) {
  const copied = ref('')
  const supported = typeof navigator !== 'undefined' && !!navigator.clipboard
  let timer = null
  const copy = async (text) => {
    const { copyText } = await import('../utils')
    const ok = await copyText(text)
    if (ok) {
      copied.value = text
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { copied.value = '' }, timeout)
    }
    return ok
  }
  onUnmounted(() => { if (timer) clearTimeout(timer) })
  return { copied, copy, supported, isCopied: computed(() => copied.value !== '') }
}

/* ============================ 异步 / 数据 ============================ */

/** 异步任务状态机：data / loading / error + run/reset */
export function useAsync(fn, { immediate = false, initial = null } = {}) {
  const data = ref(initial)
  const loading = ref(false)
  const error = ref(null)
  let seq = 0

  const run = async (...args) => {
    const mySeq = ++seq
    loading.value = true
    error.value = null
    try {
      const res = await fn(...args)
      if (mySeq === seq) data.value = res
      return res
    } catch (e) {
      if (mySeq === seq) error.value = e
      throw e
    } finally {
      if (mySeq === seq) loading.value = false
    }
  }
  const reset = () => { seq += 1; data.value = initial; loading.value = false; error.value = null }
  if (immediate) run()

  return { data, loading, error, run, reset }
}

/** 表格状态：排序 + 分页 + 关键字过滤（列表页三件套） */
export function useTableState(source, { pageSize = 5, filterKeys = [] } = {}) {
  const page = ref(1)
  const size = ref(pageSize)
  const keyword = ref('')
  const sortKey = ref('')
  const sortOrder = ref('asc')

  const filtered = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return source.value
    return source.value.filter((row) => filterKeys.some((k) => (
      String(row[k] ?? '').toLowerCase().includes(kw)
    )))
  })
  const sorted = computed(() => (
    sortKey.value ? sortBy(filtered.value, sortKey.value, sortOrder.value) : filtered.value
  ))
  const paged = computed(() => paginate(sorted.value, page.value, size.value))

  const toggleSort = (key) => {
    if (sortKey.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    else { sortKey.value = key; sortOrder.value = 'asc' }
    page.value = 1
  }
  watch(keyword, () => { page.value = 1 })

  return { page, size, keyword, sortKey, sortOrder, filtered, sorted, paged, toggleSort }
}

/** 热更新（每 1.5s push 一条到环形缓冲，演示流式数据） */
export function useStream(maxPoints = 24) {
  const points = ref([])
  let timer = null
  const push = (v) => {
    points.value = [...points.value, v].slice(-maxPoints)
  }
  const start = (gen, interval = 1500) => {
    stop()
    timer = setInterval(() => push(gen()), interval)
  }
  const stop = () => { if (timer) clearInterval(timer); timer = null }
  onUnmounted(stop)
  return { points, push, start, stop }
}

/* ============================ 交互 ============================ */

/** 撤销/重做栈：commit 记录快照，undo/redo 切换，支持 jumpTo */
export function useUndoRedo(initial, { limit = 30 } = {}) {
  const state = ref(initial)
  const past = ref([])
  const future = ref([])

  const commit = (next) => {
    past.value = [...past.value, state.value].slice(-limit)
    future.value = []
    state.value = next
  }
  const undo = () => {
    if (!past.value.length) return false
    future.value = [state.value, ...future.value].slice(0, limit)
    state.value = past.value[past.value.length - 1]
    past.value = past.value.slice(0, -1)
    return true
  }
  const redo = () => {
    if (!future.value.length) return false
    past.value = [...past.value, state.value].slice(-limit)
    state.value = future.value[0]
    future.value = future.value.slice(1)
    return true
  }
  const reset = (v = initial) => { state.value = v; past.value = []; future.value = [] }

  return {
    state, commit, undo, redo, reset,
    canUndo: computed(() => past.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
    history: computed(() => past.value.length),
  }
}

/** 拖拽排序（HTML5 draggable，零依赖） */
export function useDragList(listRef, onReorder) {
  const dragIndex = ref(-1)
  const overIndex = ref(-1)

  const onDragStart = (i) => (e) => {
    dragIndex.value = i
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(i))
  }
  const onDragOver = (i) => (e) => {
    e.preventDefault()
    overIndex.value = i
  }
  const onDrop = (i) => (e) => {
    e.preventDefault()
    const from = dragIndex.value
    dragIndex.value = -1
    overIndex.value = -1
    if (from < 0 || from === i) return
    const next = [...listRef.value]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    onReorder?.(next)
  }
  const onDragEnd = () => { dragIndex.value = -1; overIndex.value = -1 }

  return { dragIndex, overIndex, onDragStart, onDragOver, onDrop, onDragEnd }
}

/** 分步流程（向导）：步骤数组 + next/prev/goTo + 完成度 */
export function useStepper(steps, { initial = 0 } = {}) {
  const index = ref(clamp(initial, 0, steps.length - 1))
  const current = computed(() => steps[index.value])
  const progress = computed(() => Math.round(((index.value + 1) / steps.length) * 100))
  const isFirst = computed(() => index.value === 0)
  const isLast = computed(() => index.value === steps.length - 1)
  const next = () => { if (!isLast.value) index.value += 1 }
  const prev = () => { if (!isFirst.value) index.value -= 1 }
  const goTo = (i) => { index.value = clamp(i, 0, steps.length - 1) }
  return { index, current, progress, isFirst, isLast, next, prev, goTo }
}

/* ============================ 全局共享状态 ============================ */

/**
 * 极简 store：reactive + 只读出口 + 可选 localStorage 持久化
 * 演示「不引 Pinia 也能做跨组件共享状态」的原理（ref 提升到模块作用域 + readonly 暴露）
 */
export function createStore(initialState, { persistKey } = {}) {
  const read = () => {
    if (!persistKey) return null
    try {
      const raw = localStorage.getItem(persistKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  const state = reactive({ ...initialState, ...(read() || {}) })

  if (persistKey) {
    watch(state, (v) => {
      try { localStorage.setItem(persistKey, JSON.stringify(v)) } catch { /* ignore */ }
    }, { deep: true })
  }

  const set = (patch) => Object.assign(state, patch)
  const reset = () => Object.assign(state, initialState)

  return { state: readonly(state), raw: state, set, reset }
}

/* ============================ 提示 ============================ */

/** 轻量 toast 队列（不依赖 Element Plus，任何子应用可复用） */
export function useToast(timeout = 2200) {
  const items = ref([])
  const push = (text, type = 'info') => {
    const id = Date.now() + Math.random()
    items.value = [...items.value, { id, text, type }]
    setTimeout(() => {
      items.value = items.value.filter((t) => t.id !== id)
    }, timeout)
  }
  return {
    items,
    info: (t) => push(t, 'info'),
    success: (t) => push(t, 'success'),
    warn: (t) => push(t, 'warn'),
    error: (t) => push(t, 'error'),
    clear: () => { items.value = [] },
  }
}
