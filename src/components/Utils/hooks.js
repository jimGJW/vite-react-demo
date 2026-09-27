import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { copyText, debounce, getStorage, setStorage } from './utils.js'

/**
 * 小功能集 · React Hooks
 *
 * 约定（遵循本项目 React 19 / React Compiler 子集 lint 规则）：
 *  - ref 由调用方 useRef 创建后【传入】hook，不放进 hook 的返回对象
 *  - 不在 effect 里同步 setState（窗口/媒体查询初值用 useState 惰性初始化）
 *  - 无模块级可变变量；定时器统一在卸载时清理
 */

/* =====================================================================
   频率控制
   ===================================================================== */

/** 防抖值：value 停止变化 delay 毫秒后才更新 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** 节流值：delay 内最多更新一次 */
export function useThrottle(value, delay = 300) {
  const [throttled, setThrottled] = useState(value)
  const lastRef = useRef(0)
  useEffect(() => {
    const now = Date.now()
    const remaining = delay - (now - lastRef.current)
    if (remaining <= 0) {
      lastRef.current = now
      setThrottled(value)
      return undefined
    }
    const t = setTimeout(() => {
      lastRef.current = Date.now()
      setThrottled(value)
    }, remaining)
    return () => clearTimeout(t)
  }, [value, delay])
  return throttled
}

/** 防抖回调（引用稳定，卸载自动取消） */
export function useDebouncedCallback(fn, delay = 300) {
  const fnRef = useRef(fn)
  const debouncedRef = useRef(null)
  useEffect(() => { fnRef.current = fn }, [fn])
  useEffect(() => {
    debouncedRef.current = debounce((...args) => fnRef.current?.(...args), delay)
    return () => { debouncedRef.current?.cancel() }
  }, [delay])
  return useCallback((...args) => { debouncedRef.current?.(...args) }, [])
}

/* =====================================================================
   存储
   ===================================================================== */

/** 与 localStorage 双向同步的 state（支持过期时间） */
export function useLocalStorage(key, initial, { expire } = {}) {
  const [value, setValue] = useState(() => getStorage(key, initial))
  useEffect(() => { setStorage(key, value, { expire }) }, [key, value, expire])
  return [value, setValue]
}

/** 与 sessionStorage 同步的 state */
export function useSessionStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw == null ? initial : JSON.parse(raw)
    } catch { return initial }
  })
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* 忽略配额/隐私模式 */ }
  }, [key, value])
  return [value, setValue]
}

/* =====================================================================
   剪贴板 / 标题 / 网络
   ===================================================================== */

/** 复制文本，带 copied 状态（自动复位） */
export function useCopy(resetDelay = 1500) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)
  const copy = useCallback(async (text) => {
    const ok = await copyText(text)
    setCopied(ok)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), resetDelay)
    return ok
  }, [resetDelay])
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  return { copied, copy }
}

/** 设置文档标题 */
export function useTitle(title) {
  useEffect(() => { document.title = title }, [title])
}

/** 网络在线状态 */
export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

/** 媒体查询 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false
  ))
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/* =====================================================================
   事件 / DOM
   ===================================================================== */

/** 点击元素外部时触发 */
export function useClickOutside(ref, handler) {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler }, [handler])
  useEffect(() => {
    const onPointerDown = (e) => {
      const el = ref?.current
      if (el && !el.contains(e.target)) handlerRef.current?.(e)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [ref])
}

/** 监听按键（e.key，大小写不敏感） */
export function useKeyPress(key, handler) {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler }, [handler])
  useEffect(() => {
    const onKeyDown = (e) => {
      if (String(e.key).toLowerCase() === String(key).toLowerCase()) handlerRef.current?.(e)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key])
}

/** setInterval 封装（delay 为 null 时暂停） */
export function useInterval(fn, delay) {
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn }, [fn])
  useEffect(() => {
    if (delay == null) return undefined
    const id = setInterval(() => fnRef.current?.(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/** setTimeout 封装（delay 为 null 时不启动） */
export function useTimeout(fn, delay) {
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn }, [fn])
  useEffect(() => {
    if (delay == null) return undefined
    const id = setTimeout(() => fnRef.current?.(), delay)
    return () => clearTimeout(id)
  }, [delay])
}

/** 元素尺寸（ResizeObserver） */
export function useSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref?.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/** 元素是否悬停 */
export function useHover(ref) {
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    const el = ref?.current
    if (!el) return undefined
    const on = () => setHovered(true)
    const off = () => setHovered(false)
    el.addEventListener('pointerenter', on)
    el.addEventListener('pointerleave', off)
    return () => {
      el.removeEventListener('pointerenter', on)
      el.removeEventListener('pointerleave', off)
    }
  }, [ref])
  return hovered
}

/** 窗口滚动位置（rAF 节流） */
export function useScrollPosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setPos({ x: window.scrollX, y: window.scrollY })
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return pos
}

/** 仅在卸载时执行 */
export function useUnmount(fn) {
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn }, [fn])
  useEffect(() => () => { fnRef.current?.() }, [])
}

/* =====================================================================
   状态小工具
   ===================================================================== */

/** 布尔开关 */
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = useCallback(() => setValue((v) => !v), [])
  const setOn = useCallback(() => setValue(true), [])
  const setOff = useCallback(() => setValue(false), [])
  return { value, toggle, setOn, setOff, setValue }
}

/** 计数器（可设上下限） */
export function useCounter(initial = 0, { min = -Infinity, max = Infinity } = {}) {
  const [count, setCount] = useState(initial)
  const inc = useCallback((step = 1) => setCount((c) => Math.min(max, c + step)), [max])
  const dec = useCallback((step = 1) => setCount((c) => Math.max(min, c - step)), [min])
  const reset = useCallback(() => setCount(initial), [initial])
  return { count, inc, dec, reset, setCount }
}

/* =====================================================================
   水印（取材自存量项目 useWatermark：canvas 平铺 + 防删除）
   ===================================================================== */

function buildWatermarkTile(lines, { fontSize, color, fontFamily, rotate, gapX, gapY }) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontSize}px ${fontFamily}`
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width), 1)
  const lineH = fontSize + 4
  const textH = lines.length * lineH
  const tileW = Math.ceil(textW + gapX)
  const tileH = Math.ceil(textH + gapY)
  canvas.width = tileW
  canvas.height = tileH
  // 修改 canvas 尺寸会重置上下文，需重新设置字体
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.translate(tileW / 2, tileH / 2)
  ctx.rotate((rotate * Math.PI) / 180)
  lines.forEach((l, i) => ctx.fillText(l, 0, -textH / 2 + i * lineH))
  return { url: canvas.toDataURL('image/png'), width: tileW, height: tileH }
}

/**
 * 容器水印（canvas 平铺 + MutationObserver 防删除/防改样式）
 * @param {React.RefObject<HTMLElement>} ref 由调用方 useRef 创建
 */
export function useWatermark(ref, text, options = {}) {
  const {
    rotate = -22, fontSize = 14, color = 'rgba(0, 0, 0, 0.12)',
    fontFamily = 'sans-serif', gapX = 120, gapY = 80, zIndex = 10,
  } = options
  const textKey = Array.isArray(text) ? text.join('|') : String(text ?? '')

  useEffect(() => {
    const container = ref?.current
    const lines = (Array.isArray(text) ? text : [text]).filter(Boolean).map(String)
    if (!container || lines.length === 0) return undefined

    if (window.getComputedStyle(container).position === 'static') {
      // 用 setProperty 而非属性赋值，避免直接改写由 ref 传入的节点属性
      container.style.setProperty('position', 'relative')
    }
    const { url, width, height } = buildWatermarkTile(lines, {
      fontSize, color, fontFamily, rotate, gapX, gapY,
    })
    const overlay = document.createElement('div')
    overlay.setAttribute('data-watermark', 'true')
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      backgroundImage: `url(${url})`,
      backgroundRepeat: 'repeat',
      backgroundSize: `${width}px ${height}px`,
      zIndex: String(zIndex),
    })
    container.appendChild(overlay)

    // 被删除或样式被篡改时自动恢复（我们的修复同样触发回调，但检测后无需再改，不会死循环）
    const restore = () => {
      if (!container.contains(overlay)) container.appendChild(overlay)
      if (overlay.style.pointerEvents !== 'none') overlay.style.pointerEvents = 'none'
      if (overlay.style.position !== 'absolute') overlay.style.position = 'absolute'
    }
    const mo = new MutationObserver(restore)
    mo.observe(container, { childList: true, attributes: true, subtree: true, attributeFilter: ['style'] })

    return () => {
      mo.disconnect()
      overlay.remove()
    }
  }, [ref, textKey, text, rotate, fontSize, color, fontFamily, gapX, gapY, zIndex])
}

/* =====================================================================
   时间与倒计时
   ===================================================================== */

/**
 * 返回「当前时间」，按 intervalMs 自动刷新。
 * 做时钟、相对时间（刚刚 / 3 分钟前）自动更新时很好用。
 * @param {number} intervalMs 刷新间隔；传 null 则不自动刷新
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useInterval(() => setNow(new Date()), intervalMs)
  return now
}

/**
 * 倒计时。基于「目标时间戳」而不是每轮减一 ——
 * 标签页被浏览器降频时 setInterval 会漂，按时间戳算才不会越走越慢。
 *
 * @param {number} seconds 总秒数
 * @param {object} [o]
 * @param {boolean}[o.autoStart] 是否立即开始
 * @param {Function}[o.onFinish] 归零时回调
 * @returns {{ left:number, running:boolean, start:(s?:number)=>void, stop:()=>void, reset:()=>void }}
 */
export function useCountdown(seconds = 60, { autoStart = false, onFinish } = {}) {
  const total = Math.max(0, Math.floor(seconds))
  const [left, setLeft] = useState(total)
  const [deadline, setDeadline] = useState(null)
  const onFinishRef = useRef(onFinish)

  useEffect(() => { onFinishRef.current = onFinish }, [onFinish])

  const start = useCallback((s) => {
    const n = Math.max(0, Math.floor(typeof s === 'number' ? s : total))
    setLeft(n)
    setDeadline(Date.now() + n * 1000)
  }, [total])

  const stop = useCallback(() => setDeadline(null), [])

  const reset = useCallback(() => {
    setDeadline(null)
    setLeft(total)
  }, [total])

  useInterval(() => {
    if (deadline == null) return
    const rest = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    setLeft(rest)
    if (rest === 0) {
      setDeadline(null)
      if (onFinishRef.current) onFinishRef.current()
    }
  }, deadline == null ? null : 500)

  /* 声明了 autoStart 就在挂载后启动一次（惰性触发，避免挂载即加载） */
  const startedRef = useRef(false)
  useEffect(() => {
    if (!autoStart || startedRef.current) return
    startedRef.current = true
    start(total)
  }, [autoStart, start, total])

  return { left, running: deadline != null, start, stop, reset }
}

/* =====================================================================
   事件与状态小工具
   ===================================================================== */

/**
 * 声明式事件监听，组件卸载自动解绑。
 * target 可以传 DOM 节点、window / document，也可以传 ref 对象。
 *
 * 注意：handler 用 ref 收编，不会因为父组件重建而反复解绑重绑；
 * options 请传常量（或用 useMemo），否则每次渲染都视为变化。
 */
export function useEventListener(target, type, handler, options) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!type) return undefined
    const el = (target && typeof target === 'object' && 'current' in target) ? target.current : target
    if (!el || typeof el.addEventListener !== 'function') return undefined

    const listener = (e) => {
      if (handlerRef.current) handlerRef.current(e)
    }
    el.addEventListener(type, listener, options)
    return () => el.removeEventListener(type, listener, options)
  }, [target, type, options])
}

/** 强制重渲染。调试、或者依赖了 React 之外的可变数据源时用 */
export function useUpdate() {
  const [, setTick] = useState(0)
  return useCallback(() => setTick((t) => t + 1), [])
}

/**
 * Set 状态的便捷封装：多选、标签勾选、批量选择场景少写一堆展开语法。
 * 每次操作返回新 Set，保证引用变化能被 React 感知。
 */
export function useSet(initial = []) {
  const [set, setSet] = useState(() => new Set(initial))

  const add = useCallback((v) => setSet((s) => new Set(s).add(v)), [])
  const remove = useCallback((v) => setSet((s) => {
    const next = new Set(s)
    next.delete(v)
    return next
  }), [])
  const toggle = useCallback((v) => setSet((s) => {
    const next = new Set(s)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }), [])
  const clear = useCallback(() => setSet(new Set()), [])
  const has = useCallback((v) => set.has(v), [set])
  const toArray = useMemo(() => Array.from(set), [set])

  return { set, has, add, remove, toggle, clear, toArray, size: set.size }
}
