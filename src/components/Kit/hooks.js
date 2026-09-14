/* =====================================================================
 * Kit · 自定义 Hook 集合
 * ---------------------------------------------------------------------
 * 只导出 Hook，不含组件 —— 满足 react-refresh/only-export-components。
 * 返回对象一律**不含 ref**，避免触发 react-hooks/refs 静态检查。
 *
 * 移植来源：
 *   useCountdown  ← pad `components/CountDown`（原实现用 setTimeout 自减，
 *                    后台标签页会被节流导致累积漂移；此处改为每 tick 用
 *                    Date.now() 重算剩余，天然免疫）
 *   useInView     ← mobile `components/LoadMore` 的触底加载思路，
 *                    改用 IntersectionObserver，免去手写滚动监听
 *   useOverflow   ← pad `components/Ellipsis` 的溢出判定，
 *                    原实现用 shadowNode 二分法测高，此处交给浏览器测量
 * ===================================================================== */

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDuration, splitDuration, toTime } from './utils.js'

/**
 * 倒计时。每 tick 用 `Date.now()` 重算剩余时间，不做自减，因此：
 *   - 后台标签页被浏览器节流后回到前台，数值会立刻校正
 *   - 系统时间被修改时会跟随（业务如需单调递增请自行换 performance.now）
 *
 * @param {Date|number|string} target 目标时刻
 * @param {{interval?:number, onEnd?:()=>void}} [options]
 * @returns {{remaining:number, days:number, hours:number, minutes:number, seconds:number, finished:boolean}}
 */
export function useCountdown(target, { interval = 1000, onEnd } = {}) {
  const [now, setNow] = useState(() => Date.now())
  const endTime = useMemo(() => toTime(target), [target])
  const onEndRef = useRef(onEnd)
  const firedRef = useRef(false)

  useEffect(() => {
    onEndRef.current = onEnd
  }, [onEnd])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(timer)
  }, [interval])

  const remaining = Number.isNaN(endTime) ? 0 : Math.max(0, endTime - now)

  useEffect(() => {
    if (Number.isNaN(endTime)) return
    if (remaining > 0) {
      firedRef.current = false
      return
    }
    if (firedRef.current) return
    firedRef.current = true
    onEndRef.current?.()
  }, [remaining, endTime])

  return useMemo(() => {
    const parts = splitDuration(remaining)
    return { remaining, ...parts, finished: remaining <= 0 }
  }, [remaining])
}

/**
 * 元素是否进入视口。用于触底加载、懒渲染、曝光埋点。
 *
 * @param {{current: Element|null}} targetRef 目标元素 ref（由调用方创建并传入）
 * @param {{rootMargin?:string, threshold?:number, once?:boolean}} [options]
 * @returns {boolean}
 */
export function useInView(targetRef, { rootMargin = '0px', threshold = 0, once = false } = {}) {
  // 不支持 IntersectionObserver 的环境（老 WebView / SSR）直接视为可见，走降级逻辑
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = targetRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setInView(false)
          }
        })
      },
      { rootMargin, threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [targetRef, rootMargin, threshold, once])

  return inView
}

/**
 * 内容是否溢出容器（用于「是否需要 tooltip / 是否显示展开按钮」）。
 *
 * @param {{current: Element|null}} targetRef 目标元素 ref
 * @param {string|number} [watchKey] 内容变化的标识（如文本、行数）；变化时重新测量
 * @returns {boolean}
 */
export function useOverflow(targetRef, watchKey = '') {
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return undefined

    let raf = 0
    const measure = () => {
      // 1px 容差：亚像素布局下 clientHeight 可能比 scrollHeight 小 0.5
      const next = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
      setOverflowing(next)
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    schedule()

    if (typeof ResizeObserver === 'undefined') return () => cancelAnimationFrame(raf)

    const observer = new ResizeObserver(schedule)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [targetRef, watchKey])

  return overflowing
}

/**
 * 把毫秒格式化成倒计时文案（纯函数封装，便于组件里直接用）。
 * @param {number} ms
 * @param {string} [pattern='HH:mm:ss']
 */
export function useFormattedDuration(ms, pattern = 'HH:mm:ss') {
  return useMemo(() => formatDuration(ms, pattern), [ms, pattern])
}
