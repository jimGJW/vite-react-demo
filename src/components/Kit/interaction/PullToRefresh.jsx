import { useRef, useState } from 'react'

/**
 * PullToRefresh · 下拉刷新容器
 * =====================================================================
 * 移植自 旧移动端项目 `components/pulltorefresh/PullToRefresh.js`，改造点：
 *   1. 原实现用 `ReactDOM.findDOMNode(this.refs.content)`（React 19 已移除），
 *      改为标准 ref
 *   2. 原实现依赖 `e.preventDefault()`，需要 `{ passive: false }` 手动绑事件；
 *      这里改用 CSS `overscroll-behavior: contain` 切断滚动链，
 *      于是可以直接用 React 合成事件，不再需要手动 addEventListener
 *   3. 新增鼠标支持，桌面浏览器（含普通鼠标拖拽）也能直接调试
 *   4. 保留原实现最关键的正确性逻辑：**只有当所有可滚动祖先都到顶时才允许下拉**，
 *      否则内层列表滚到一半会被误触发刷新
 *
 * 用法：
 *   <PullToRefresh height={320} onRefresh={() => fetchList()}>
 *     <div>列表内容</div>
 *   </PullToRefresh>
 */

const PHASE = { IDLE: 'idle', PULLING: 'pulling', READY: 'ready', REFRESHING: 'refreshing' }

export default function PullToRefresh({
  onRefresh,
  height = 320,
  threshold = 56,
  resistence = 2.5,
  disabled = false,
  pullText = '下拉刷新',
  releaseText = '松手刷新',
  refreshingText = '正在刷新…',
  children,
  className = '',
}) {
  const contentRef = useRef(null)
  const startYRef = useRef(0)
  const activeRef = useRef(false)
  const busyRef = useRef(false)

  const [pull, setPull] = useState(0)
  const [phase, setPhase] = useState(PHASE.IDLE)

  /** 内容区及其所有可滚动祖先是否都在顶部 */
  const atTop = () => {
    const el = contentRef.current
    if (!el) return false
    if (el.scrollTop > 0) return false
    let node = el.parentElement
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node)
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollTop > 0) return false
      node = node.parentElement
    }
    return true
  }

  const begin = (y) => {
    if (disabled || busyRef.current || !atTop()) return
    startYRef.current = y
    activeRef.current = true
    setPhase(PHASE.PULLING)
  }

  const move = (y) => {
    if (!activeRef.current) return
    const delta = y - startYRef.current
    if (delta <= 0) {
      setPull(0)
      setPhase(PHASE.PULLING)
      return
    }
    // 阻尼：手指位移越大，实际位移增长越慢；上限避免拉出屏幕外
    const next = Math.min(delta / resistence, threshold * 1.8)
    setPull(next)
    setPhase(next >= threshold ? PHASE.READY : PHASE.PULLING)
  }

  const finish = async () => {
    if (!activeRef.current) return
    activeRef.current = false

    if (pull < threshold) {
      setPull(0)
      setPhase(PHASE.IDLE)
      return
    }

    busyRef.current = true
    setPhase(PHASE.REFRESHING)
    setPull(threshold * 0.9)
    try {
      await onRefresh?.()
    } finally {
      busyRef.current = false
      setPhase(PHASE.IDLE)
      setPull(0)
    }
  }

  /* ---------------- 触屏 ---------------- */
  const onTouchStart = (e) => begin(e.touches[0].clientY)
  const onTouchMove = (e) => move(e.touches[0].clientY)
  const onTouchEnd = () => { void finish() }

  /* ---------------- 鼠标（桌面调试） ---------------- */
  const onMouseDown = (e) => {
    if (e.button !== 0) return
    begin(e.clientY)
  }
  const onMouseMove = (e) => {
    if (!activeRef.current) return
    move(e.clientY)
  }
  const onMouseUp = () => { void finish() }

  const hintText =
    phase === PHASE.REFRESHING ? refreshingText : phase === PHASE.READY ? releaseText : pullText
  // 手指未松开时不加过渡，否则跟手位移会被动画拖慢
  const following = phase === PHASE.PULLING || phase === PHASE.READY

  return (
    <div className={`kit-ptr ${className}`} style={{ height }}>
      <div className="kit-ptr__indicator" style={{ height: Math.max(pull, 0) }}>
        {phase === PHASE.REFRESHING ? (
          <span className="kit-ptr__spinner" />
        ) : (
          <span className={`kit-ptr__arrow ${phase === PHASE.READY ? 'is-flip' : ''}`}>↓</span>
        )}
        <span>{hintText}</span>
      </div>

      <div
        ref={contentRef}
        className="kit-ptr__content"
        style={{ transform: `translateY(${pull}px)`, transition: following ? 'none' : 'transform 0.24s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {children}
      </div>
    </div>
  )
}
