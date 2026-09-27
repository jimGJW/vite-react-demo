import { useCallback, useEffect, useRef, useState } from 'react'
import { computeVisibleRange } from './virtual.js'
import './PerfLab.scss'

/**
 * 定高虚拟滚动列表。
 *
 * 原理：容器高度撑成「总行数 × 行高」拿到真实滚动条，但只把视口内的
 * 十几行渲染成 DOM。10 万行数据在屏幕上也只存在约 20 个节点。
 *
 * 用法：
 *   <VirtualList
 *     items={rows}
 *     itemHeight={36}
 *     height={360}
 *     renderItem={(row, i) => (
 *       <div key={row.id} className="row">{row.name}</div>
 *     )}
 *   />
 *
 * 注意：renderItem 返回的元素必须自带 key（用业务 id，不要用下标，
 * 否则插入/删除行时 React 会复用错节点）。
 */
export default function VirtualList({
  items = [],
  itemHeight = 36,
  height = 320,
  overscan = 4,
  renderItem,
  className = '',
  empty = null,
  onStatsChange,
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(height)
  const viewportRef = useRef(null)

  /* 容器高度可能被父级布局压缩/拉伸，用 ResizeObserver 跟踪真实值 */
  useEffect(() => {
    const node = viewportRef.current
    if (!node || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height
      if (typeof h === 'number' && h > 0) setViewport(h)
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const range = computeVisibleRange({
    scrollTop,
    viewportHeight: viewport || height,
    itemHeight,
    total: items.length,
    overscan,
  })

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  /* 把「渲染了多少行 / 总共多少行」透出去，页面用它做对比展示。
     依赖只放 rendered —— 滚动时 start/end 每行都在变，跟着通知会让调用方频繁重渲染。 */
  useEffect(() => {
    if (!onStatsChange) return undefined
    onStatsChange({ rendered: range.rendered, total: items.length })
    return undefined
  }, [onStatsChange, range.rendered, items.length])

  const slice = items.slice(range.start, range.end)

  return (
    <div
      ref={viewportRef}
      className={`perf-vlist ${className}`.trim()}
      style={{ height }}
      onScroll={onScroll}
    >
      {items.length === 0 ? empty : (
        <div className="perf-vlist__spacer" style={{ height: range.totalHeight }}>
          <div className="perf-vlist__window" style={{ transform: `translateY(${range.padTop}px)` }}>
            {slice.map((item, i) => renderItem(item, range.start + i))}
          </div>
        </div>
      )}
    </div>
  )
}
