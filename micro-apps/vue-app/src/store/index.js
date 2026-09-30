/**
 * vue-app 轻量状态管理
 *
 * 不引入 Pinia 的「原理版」实现：模块级 reactive 对象 + readonly 出口 +
 * 可选 localStorage 持久化 + 变更日志（devtools 雏形）。
 * 页面里演示：多组件共享、持久化、撤销重做。
 */
import { computed, reactive, readonly, watch } from 'vue'
import { deepClone } from '../utils'

/**
 * 创建一个带日志与持久化的 store
 * @param {string} id  store 唯一标识（日志/持久化键名）
 * @param {object} initialState 初始状态
 * @param {{ persist?: boolean, actions?: object }} options
 */
export function defineStore(id, initialState, options = {}) {
  const { persist = false, actions = {} } = options
  const STORAGE_KEY = `vue-app:store:${id}`

  const restore = () => {
    if (!persist) return {}
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const raw = reactive({ ...deepClone(initialState), ...restore() })
  /** 变更日志：最近 20 条，页面里当"时间机器"展示 */
  const logs = reactive([])
  let subscriber = null

  const pushLog = (type, payload) => {
    logs.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, payload, at: new Date() })
    if (logs.length > 20) logs.splice(20)
  }

  if (persist) {
    watch(raw, (v) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* ignore */ }
    }, { deep: true })
  }

  /** 订阅变更：页面可用它做「操作流水」 */
  const subscribe = (fn) => {
    subscriber = fn
    return () => { subscriber = null }
  }

  const api = {
    id,
    state: readonly(raw),
    raw,
    logs,
    /** $patch({ k: v })：合并式更新 */
    $patch(patch) {
      Object.assign(raw, typeof patch === 'function' ? patch(raw) : patch)
      pushLog('patch', deepClone(patch))
      subscriber?.(deepClone(raw))
    },
    /** $reset()：回到初始值 */
    $reset() {
      Object.assign(raw, deepClone(initialState))
      pushLog('reset', null)
      subscriber?.(deepClone(raw))
    },
    /** $persistClear()：清掉本地缓存 */
    $persistClear() {
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    },
    $clearLogs() { logs.splice(0) },
  }

  // 注入自定义 action：action 内部可用 this.$patch
  for (const [name, fn] of Object.entries(actions)) {
    api[name] = (...args) => fn.call(api, ...args)
  }

  return api
}

/**
 * 单例包装：让 `useXxxStore()` 具备**幂等**语义。
 * Pinia 的 useStore() 在同一个 app 里重复调用返回同一实例；这里用闭包缓存复刻同一约定：
 *   - 调用方可以随处 `const s = useCartStore()`，拿到的始终是同一份状态
 *   - 首次调用才真正创建 reactive 对象（懒初始化，import 时不产生副作用）
 */
const singleton = (create) => {
  let inst = null
  return () => {
    if (inst === null) inst = create()
    return inst
  }
}

/* —— 具体业务 store（导出的是工厂函数，与 Pinia 的 useXxxStore() 形态一致）—— */

/** 主题 store：主色 / 圆角 / 紧凑模式，持久化 */
export const useThemeStore = singleton(() => defineStore('theme', {
  primary: '#409eff',
  radius: 8,
  compact: false,
}, { persist: true, actions: {
  setPrimary(color) { this.$patch({ primary: color }) },
  toggleCompact() { this.$patch({ compact: !this.raw.compact }) },
} }))

/** 购物车 store：多组件共享，带派生计算 */
export const useCartStore = singleton(() => defineStore('cart', {
  wallet: 500,
  items: [
    { id: 'p1', name: 'Vue 3 实战', price: 68, count: 1 },
    { id: 'p2', name: 'React 设计模式', price: 89, count: 0 },
  ],
}, { persist: true, actions: {
  add(id) {
    const item = this.raw.items.find((i) => i.id === id)
    if (item) item.count += 1
    this.$patch({})
  },
  remove(id) {
    this.$patch({ items: this.raw.items.filter((i) => i.id !== id) })
  },
  checkout() {
    const total = this.raw.items.reduce((s, i) => s + i.price * i.count, 0)
    if (total > this.raw.wallet) return { ok: false, msg: '余额不足' }
    this.$patch({ wallet: this.raw.wallet - total, items: this.raw.items.map((i) => ({ ...i, count: 0 })) })
    return { ok: true, msg: `结算成功，扣款 ¥${total}` }
  },
} }))

/** 派生值：直接复用 store 的 reactive 状态，跨组件共享同一个 computed */
export const cartTotal = computed(() => useCartStore().raw.items
  .reduce((s, i) => s + i.price * i.count, 0))
export const cartCount = computed(() => useCartStore().raw.items
  .reduce((s, i) => s + i.count, 0))

/** 任务看板 store：演示撤销重做（页面侧用 useUndoRedo 包裹 $patch） */
export const useBoardStore = singleton(() => defineStore('board', {
  columns: [
    { id: 'todo', title: '待办', tone: 'primary' },
    { id: 'doing', title: '进行中', tone: 'warn' },
    { id: 'done', title: '已完成', tone: 'ok' },
  ],
  cards: [
    { id: 'c1', col: 'todo', text: '补齐 Vue 子应用工具库' },
    { id: 'c2', col: 'doing', text: 'Angular 接入官方 Router' },
    { id: 'c3', col: 'done', text: 'qiankun 三项目拆分' },
  ],
}, { persist: true }))

/**
 * 登录态 store：给「路由守卫」演示提供真实的鉴权数据源。
 * token 持久化，所以刷新后仍是登录态（这也是守卫要读 store 而不是读组件局部 state 的原因）。
 */
export const useAuthStore = singleton(() => defineStore('auth', {
  token: '',
  name: '',
}, { persist: true, actions: {
  login(name) {
    this.$patch({ token: `tk_${Math.random().toString(36).slice(2, 10)}`, name: name || '访客' })
  },
  logout() { this.$patch({ token: '', name: '' }) },
} }))

/** 是否已登录（守卫与页面共用同一判据） */
export const isLoggedIn = () => Boolean(useAuthStore().state.token)
