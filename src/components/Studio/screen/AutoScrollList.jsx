import { useCallback, useEffect, useRef } from 'react'

/**
 * AutoScrollList · 无缝滚动榜单
 * =====================================================================
 * 移植自三个存量看板项目里近乎同源的 `autoscroll` 组件。原实现的核心价值是
 * **「等 DOM 撑开再滚动」**：内容不足一屏时不滚，一旦超过容器高度就自动
 * 垂直循环，鼠标悬停暂停（方便点选），鼠标离开接着滚。
 *
 * 原实现用 `document.head.appendChild(<style>)` 动态注入唯一的 @keyframes
 * （带随机后缀防冲突），并在拖拽后重算关键帧实现「断点续滚」。
 * 这里做了三处改造：
 *   1. **不再动态注入样式**：位移量通过 CSS 变量 `--st-ascroll-dist` 传入，
 *      关键帧静态写死在样式表里——无样式泄漏，SSR 友好，也便于主题覆盖。
 *   2. **不再轮询等待**：原实现用 `setTimeout` 重试最多 100 次 × 50ms 等
 *      `scrollHeight` 就位；改用 `ResizeObserver` 观察内容与容器，
 *      内容变化（懒加载图片、字体回流）时自动重算。
 *   3. 往复（alternate）滚动替代「克隆一份内容」的无缝循环——省一半 DOM，
 *      且不会出现克隆节点被误当作数据项读屏的问题。
 *
 * 用法：
 *   <AutoScrollList items={rows} renderItem={(r) => <span>{r.name}</span>} />
 */

const DEFAULTS = { rowHeight: 36, speed: 28, maxHeight: 220 }

export default function AutoScrollList({
  items = [],
  rowHeight = DEFAULTS.rowHeight,
  speed = DEFAULTS.speed,
  maxHeight = DEFAULTS.maxHeight,
  gap = 0,
  pauseOnHover = true,
  emptyText = '暂无数据',
  className = '',
  renderItem,
}) {
  const wrapRef = useRef(null)
  const innerRef = useRef(null)
  const timerRef = useRef(null)

  /**
   * 量取「内容高度 − 容器高度」并写进 CSS 变量。
   * 全程只写 DOM，不进 state —— 滚动是纯视觉行为，不该触发 React 重渲染。
   */
  const sync = useCallback(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return

    const diff = inner.scrollHeight - wrap.clientHeight
    if (diff > 1) {
      wrap.style.setProperty('--st-ascroll-dist', `-${diff}px`)
      // 速度恒定：时长随位移等比放大，而不是「每次滚完固定 n 秒」
      wrap.style.setProperty('--st-ascroll-dur', `${Math.max(2, diff / Math.max(1, speed))}s`)
      wrap.dataset.scroll = 'on'
    } else {
      wrap.dataset.scroll = 'off'
    }
  }, [speed])

  useEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return undefined

    sync()
    // 字体加载 / 图片回流会在首帧之后才改变高度，延迟再量一次
    timerRef.current = setTimeout(sync, 80)

    let observer = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(sync)
      observer.observe(wrap)
      observer.observe(inner)
    } else {
      window.addEventListener('resize', sync)
    }

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', sync)
      clearTimeout(timerRef.current)
    }
  }, [sync, items, rowHeight, gap])

  return (
    <div
      ref={wrapRef}
      data-scroll="off"
      className={`st-ascroll ${pauseOnHover ? 'is-hoverable' : ''} ${className}`}
      style={{ maxHeight }}
    >
      <div ref={innerRef} className="st-ascroll__inner" style={{ gap }}>
        {items.length === 0 && <div className="st-ascroll__empty">{emptyText}</div>}
        {items.map((item, index) => (
          <div
            key={item?.key ?? item?.id ?? index}
            className="st-ascroll__row"
            style={{ height: rowHeight }}
          >
            {renderItem ? renderItem(item, index) : <span className="st-ascroll__txt">{item?.label}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
