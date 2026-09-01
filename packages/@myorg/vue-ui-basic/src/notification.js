import { ref, computed, inject } from 'vue'

/* =====================================================================
 * 通知中心（Vue 3 版本，与 @myorg/react-ui-basic 的 Notification 一一对应）
 * 零外部依赖，仅依赖 Vue；全部消费 :root 设计 token
 * ===================================================================== */

/** 可用通知类型 */
export const NOTIFY_TYPES = ['info', 'success', 'warning', 'error', 'primary']

/** 默认自动消失时长（毫秒）；0 表示常驻不自动关闭 */
export const DEFAULT_DURATION = 4000

/** provide/inject 注入键 */
export const NOTIFICATION_KEY = Symbol('vue-ui-notification')

/** 类型元数据：图标 + 主色 + 浅底色（全部消费全局 CSS 变量） */
export const TYPE_META = {
  info:    { icon: 'ℹ️', accent: 'var(--c-info)',    soft: 'var(--c-info-soft)' },
  success: { icon: '✅', accent: 'var(--c-success)', soft: 'var(--c-success-soft)' },
  warning: { icon: '⚠️', accent: 'var(--c-warning)', soft: 'var(--c-warning-soft)' },
  error:   { icon: '⛔', accent: 'var(--c-danger)',  soft: 'var(--c-danger-soft)' },
  primary: { icon: '🔔', accent: 'var(--c-primary)', soft: 'var(--c-primary-soft)' },
}

/** 类型中文标签 */
export const TYPE_LABEL = {
  info: '信息',
  success: '成功',
  warning: '警告',
  error: '错误',
  primary: '通知',
}

let _seq = 0

/** 生成唯一通知 id */
export function genId() {
  _seq += 1
  return `notify-${Date.now().toString(36)}-${_seq}`
}

/** 取类型元数据，未知类型回退到 info */
export function metaOf(type) {
  return TYPE_META[type] || TYPE_META.info
}

/** 相对时间格式化（刚刚 / x 分钟前 / x 小时前 / 日期） */
export function relativeTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 创建一个独立的通知中心实例。
 * @typedef {Object} NotifyOptions
 * @property {string} [title]       标题
 * @property {string} [description] 描述正文
 * @property {('info'|'success'|'warning'|'error'|'primary')} [type='info'] 类型
 * @property {number} [duration=4000] 自动消失时长(ms)；0 不自动关闭
 */
export function createNotification() {
  /** 全部通知（新→旧），每条带 read / active 状态 */
  const items = ref([])
  /** 自动关闭计时器集合：id -> timeoutId */
  const timers = new Map()

  function clearTimer(id) {
    const t = timers.get(id)
    if (t) {
      clearTimeout(t)
      timers.delete(id)
    }
  }

  /** 移除单条（仅从屏幕移除，保留在历史） */
  function remove(id) {
    clearTimer(id)
    items.value = items.value.map((it) => (it.id === id ? { ...it, active: false } : it))
  }

  /** 移除全部活动通知 */
  function removeAll() {
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
    items.value = items.value.map((it) => ({ ...it, active: false }))
  }

  /** 弹出一条通知，返回 id */
  function notify(options = {}) {
    const {
      title = '',
      description = '',
      type = 'info',
      duration = DEFAULT_DURATION,
    } = options
    const id = genId()
    const dur = Number.isFinite(duration) ? duration : DEFAULT_DURATION
    const item = {
      id,
      title,
      description,
      type: NOTIFY_TYPES.includes(type) ? type : 'info',
      duration: dur,
      createdAt: Date.now(),
      read: false,
      active: true,
    }
    items.value = [item, ...items.value]
    if (dur > 0) {
      timers.set(id, setTimeout(() => remove(id), dur))
    }
    return id
  }

  /** 便捷方法：首参可为标题字符串或选项对象 */
  const make = (type) => (title, description, duration) => {
    if (title && typeof title === 'object') return notify({ ...title, type })
    return notify({ title, description, duration, type })
  }

  /** 标记单条已读 */
  function markRead(id) {
    items.value = items.value.map((it) => (it.id === id ? { ...it, read: true } : it))
  }

  /** 全部标记已读 */
  function markAllRead() {
    items.value = items.value.map((it) => ({ ...it, read: true }))
  }

  /** 清空全部历史（同时清掉计时器） */
  function clearHistory() {
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
    items.value = []
  }

  /** 卸载时清理所有计时器，避免内存泄漏 */
  function dispose() {
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
  }

  const toasts = computed(() => items.value.filter((it) => it.active))
  const unreadCount = computed(() =>
    items.value.reduce((n, it) => (it.read ? n : n + 1), 0))

  return {
    items,
    toasts,
    history: computed(() => items.value),
    unreadCount,
    notify,
    success: make('success'),
    error: make('error'),
    warning: make('warning'),
    info: make('info'),
    remove,
    removeAll,
    markRead,
    markAllRead,
    clearHistory,
    dispose,
  }
}

let defaultNotification = null

/** 获取进程内共享的默认通知中心实例（惰性创建） */
export function getDefaultNotification() {
  if (!defaultNotification) defaultNotification = createNotification()
  return defaultNotification
}

/**
 * 读取通知上下文。
 * - 若祖先组件通过 `<NotificationProvider>` 或 `app.use(NotificationPlugin)` 注入过实例，则使用注入的实例
 * - 否则回退到模块级共享单例（无需 Provider 也可直接使用）
 */
export function useNotification() {
  return inject(NOTIFICATION_KEY, null) || getDefaultNotification()
}

/** Vue 插件：安装后全应用可通过 inject(NOTIFICATION_KEY) / useNotification() 获取通知中心 */
export const NotificationPlugin = {
  install(app) {
    const n = getDefaultNotification()
    app.provide(NOTIFICATION_KEY, n)
    app.config.globalProperties.$notify = n
  },
}
