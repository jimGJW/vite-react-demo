import './Notification.scss'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

/* =====================================================================
 * 通知中心 · 零外部依赖（仅依赖 React）
 * 可整目录拷贝至任意 React 19 项目复用；全部消费 :root 设计 token
 * ===================================================================== */

/** 可用通知类型 */
export const NOTIFY_TYPES = ['info', 'success', 'warning', 'error', 'primary']

/** 默认自动消失时长（毫秒）；0 表示常驻不自动关闭 */
export const DEFAULT_DURATION = 4000

/** 类型元数据：图标 + 主色 + 浅底色（全部消费全局 CSS 变量） */
const TYPE_META = {
  info:    { icon: 'ℹ️', accent: 'var(--c-info)',    soft: 'var(--c-info-soft)' },
  success: { icon: '✅', accent: 'var(--c-success)', soft: 'var(--c-success-soft)' },
  warning: { icon: '⚠️', accent: 'var(--c-warning)', soft: 'var(--c-warning-soft)' },
  error:   { icon: '⛔', accent: 'var(--c-danger)',  soft: 'var(--c-danger-soft)' },
  primary: { icon: '🔔', accent: 'var(--c-primary)', soft: 'var(--c-primary-soft)' },
}

/** 类型中文标签 */
const TYPE_LABEL = {
  info: '信息',
  success: '成功',
  warning: '警告',
  error: '错误',
  primary: '通知',
}

let _seq = 0
/** 生成唯一通知 id */
function genId() {
  _seq += 1
  return `notify-${Date.now().toString(36)}-${_seq}`
}

/** 取类型元数据，未知类型回退到 info */
function metaOf(type) {
  return TYPE_META[type] || TYPE_META.info
}

/** 相对时间格式化（刚刚 / x 分钟前 / x 小时前 / 日期） */
function relativeTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 通知选项
 * @typedef {Object} NotifyOptions
 * @property {string} [title]         标题
 * @property {string} [description]   描述正文
 * @property {('info'|'success'|'warning'|'error'|'primary')} [type='info'] 通知类型
 * @property {number} [duration=4000]  自动消失时长(ms)；0 不自动关闭
 */

/**
 * 通知条目（内部数据模型）
 * @typedef {Object} NotifyItem
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {('info'|'success'|'warning'|'error'|'primary')} type
 * @property {number} duration
 * @property {number} createdAt
 * @property {boolean} read
 * @property {boolean} active        是否仍在屏幕上（移除后置 false，保留在历史）
 */

/**
 * 通知上下文值
 * @typedef {Object} NotificationContextValue
 * @property {(options?: NotifyOptions) => string} notify
 *   弹出一条通知，返回 id
 * @property {(title: string|NotifyOptions, description?: string, duration?: number) => string} success
 * @property {(title: string|NotifyOptions, description?: string, duration?: number) => string} error
 * @property {(title: string|NotifyOptions, description?: string, duration?: number) => string} warning
 * @property {(title: string|NotifyOptions, description?: string, duration?: number) => string} info
 * @property {(id: string) => void} remove      移除单条活动通知（保留历史）
 * @property {() => void} removeAll             移除全部活动通知
 * @property {NotifyItem[]} toasts              当前屏幕上的活动通知
 * @property {NotifyItem[]} history            历史通知（新→旧）
 * @property {number} unreadCount               未读数量
 * @property {() => void} markAllRead           全部标记已读
 * @property {(id: string) => void} markRead    标记单条已读
 * @property {() => void} clearHistory          清空全部历史
 */

export const NotificationContext = createContext(null)

/**
 * 通知中心 Provider：管理全局通知状态，并通过 createPortal 将 Toast 堆叠
 * 挂载到 document.body 右上角。零外部依赖，仅依赖 React。
 *
 * @param {{ children: import('react').ReactNode }} props
 * @returns {import('react').ReactElement}
 */
function NotificationProvider({ children }) {
  /** 全部通知（新→旧），每条带 read / active 状态 */
  const [items, setItems] = useState([])
  /** 自动关闭计时器集合：id -> timeoutId */
  const timers = useRef(new Map())

  /** 清除某条通知的自动关闭计时器 */
  const clearTimer = useCallback((id) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
  }, [])

  /** 移除单条（仅从屏幕移除，保留在历史） */
  const remove = useCallback((id) => {
    clearTimer(id)
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, active: false } : it)))
  }, [clearTimer])

  /** 移除全部活动通知 */
  const removeAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current.clear()
    setItems((prev) => prev.map((it) => ({ ...it, active: false })))
  }, [])

  /**
   * 弹出一条通知
   * @param {NotifyOptions} [options]
   * @returns {string} 通知 id
   */
  const notify = useCallback((options = {}) => {
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
    setItems((prev) => [item, ...prev])
    if (dur > 0) {
      const t = setTimeout(() => remove(id), dur)
      timers.current.set(id, t)
    }
    return id
  }, [remove])

  /** 成功通知：首参可为标题字符串或选项对象 */
  const success = useCallback((title, description, duration) => {
    if (title && typeof title === 'object') return notify({ ...title, type: 'success' })
    return notify({ title, description, duration, type: 'success' })
  }, [notify])

  /** 错误通知 */
  const error = useCallback((title, description, duration) => {
    if (title && typeof title === 'object') return notify({ ...title, type: 'error' })
    return notify({ title, description, duration, type: 'error' })
  }, [notify])

  /** 警告通知 */
  const warning = useCallback((title, description, duration) => {
    if (title && typeof title === 'object') return notify({ ...title, type: 'warning' })
    return notify({ title, description, duration, type: 'warning' })
  }, [notify])

  /** 信息通知 */
  const info = useCallback((title, description, duration) => {
    if (title && typeof title === 'object') return notify({ ...title, type: 'info' })
    return notify({ title, description, duration, type: 'info' })
  }, [notify])

  /** 标记单条已读 */
  const markRead = useCallback((id) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, read: true } : it)))
  }, [])

  /** 全部标记已读 */
  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((it) => ({ ...it, read: true })))
  }, [])

  /** 清空全部历史（同时清掉计时器） */
  const clearHistory = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current.clear()
    setItems([])
  }, [])

  // 卸载时清理所有计时器，避免内存泄漏
  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((t) => clearTimeout(t))
      map.clear()
    }
  }, [])

  const toasts = useMemo(() => items.filter((it) => it.active), [items])
  const unreadCount = useMemo(
    () => items.reduce((n, it) => (it.read ? n : n + 1), 0),
    [items],
  )

  const value = {
    notify,
    success,
    error,
    warning,
    info,
    remove,
    removeAll,
    toasts,
    history: items,
    unreadCount,
    markAllRead,
    markRead,
    clearHistory,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onClose={remove} />
    </NotificationContext.Provider>
  )
}

/**
 * Toast 堆叠容器：通过 portal 挂载到 body 右上角。
 * @param {{ toasts: NotifyItem[], onClose: (id: string) => void }} props
 */
function ToastStack({ toasts, onClose }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="notify-stack" role="region" aria-label="通知" aria-live="polite">
      {toasts.map((it) => (
        <ToastCard key={it.id} item={it} onClose={onClose} />
      ))}
    </div>,
    document.body,
  )
}

/**
 * 单条 Toast 卡片：左侧类型色条 + 图标 + 标题/描述 + 关闭 + 底部进度条。
 * @param {{ item: NotifyItem, onClose: (id: string) => void }} props
 */
function ToastCard({ item, onClose }) {
  const meta = metaOf(item.type)
  return (
    <div
      className={`notify-toast notify-toast--${item.type}`}
      style={{
        '--notify-accent': meta.accent,
        '--notify-accent-soft': meta.soft,
      }}
      role="status"
    >
      <span className="notify-icon" aria-hidden="true">{meta.icon}</span>
      <div className="notify-body">
        {item.title && <div className="notify-title">{item.title}</div>}
        {item.description && <div className="notify-desc">{item.description}</div>}
      </div>
      <button
        type="button"
        className="notify-close"
        aria-label="关闭通知"
        onClick={() => onClose(item.id)}
      >
        ✕
      </button>
      {item.duration > 0 && (
        <span
          className="notify-progress"
          style={{ animationDuration: `${item.duration}ms` }}
        />
      )}
    </div>
  )
}

/**
 * 通知抽屉：渲染一个触发按钮（含未读徽标）与从右侧滑入的历史面板
 * （panel 经 portal 挂载到 body）。列表项带未读红点，点击可标记已读。
 *
 * 必须在 `<NotificationProvider>` 内部使用。
 *
 * @param {{ triggerLabel?: string, className?: string }} props
 * @returns {import('react').ReactElement}
 */
function NotificationDrawer({ triggerLabel = '通知', className = '' }) {
  const ctx = useContext(NotificationContext)
  const [open, setOpen] = useState(false)

  if (!ctx) {
    throw new Error('NotificationDrawer 必须在 <NotificationProvider> 内部使用')
  }

  const { history, unreadCount, markAllRead, clearHistory, markRead } = ctx

  // Escape 关闭抽屉
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className={`notify-drawer-trigger ${className}`.trim()}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="notify-drawer-icon" aria-hidden="true">🔔</span>
        <span className="notify-drawer-label">{triggerLabel}</span>
        {unreadCount > 0 && (
          <span className="notify-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div className="notify-drawer-root">
          <div className="notify-drawer-backdrop" onClick={() => setOpen(false)} />
          <aside className="notify-drawer" role="dialog" aria-label="通知中心">
            <header className="notify-drawer-header">
              <div className="notify-drawer-title">
                <span aria-hidden="true">🔔</span>
                <span>通知中心</span>
                {unreadCount > 0 && (
                  <span className="notify-drawer-count">{unreadCount} 条未读</span>
                )}
              </div>
              <div className="notify-drawer-actions">
                <button
                  type="button"
                  className="notify-link-btn"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                >
                  全部已读
                </button>
                <button
                  type="button"
                  className="notify-link-btn"
                  onClick={clearHistory}
                  disabled={history.length === 0}
                >
                  清空
                </button>
                <button
                  type="button"
                  className="notify-close"
                  aria-label="关闭抽屉"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>
            </header>

            <div className="notify-drawer-body">
              {history.length === 0 ? (
                <div className="notify-empty">
                  <span aria-hidden="true">📭</span>
                  <p>暂无通知</p>
                </div>
              ) : (
                <ul className="notify-list">
                  {history.map((it) => {
                    const meta = metaOf(it.type)
                    return (
                      <li
                        key={it.id}
                        className={`notify-item ${it.read ? '' : 'is-unread'}`}
                        onClick={() => markRead(it.id)}
                      >
                        {!it.read && <span className="notify-item-dot" aria-label="未读" />}
                        <span
                          className="notify-item-icon"
                          style={{ color: meta.accent, background: meta.soft }}
                          aria-hidden="true"
                        >
                          {meta.icon}
                        </span>
                        <div className="notify-item-main">
                          <div className="notify-item-title">{it.title || '通知'}</div>
                          {it.description && (
                            <div className="notify-item-desc">{it.description}</div>
                          )}
                          <div className="notify-item-meta">
                            {relativeTime(it.createdAt)} · {TYPE_LABEL[it.type] || it.type}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  )
}

export default NotificationProvider
export { NotificationDrawer }
