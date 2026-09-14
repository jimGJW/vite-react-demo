import { useEffect, useMemo, useRef, useState } from 'react'
import AutoScrollList from './AutoScrollList.jsx'

/**
 * AdaptTable · 大屏自适应表格
 * =====================================================================
 * 移植自存量看板项目里的 `table` 组件。它解决了大屏上的三个具体问题：
 *   1. **列宽按百分比平分**，容器变宽变窄都不出现横向滚动条；
 *   2. **拖拽调列宽 / 调行高**：表头分隔条拖拽改列宽，表头下沿拖拽统一改行高
 *      （原实现还支持按行号指定特殊行高，这里简化为统一行高）；
 *   3. **单元格跑马灯**：内容超出列宽时自动横向循环滚动，而不是省略号截断
 *      ——大屏上省略号等于信息丢失。
 *
 * 实现要点：跑马灯不做 state 开关。测量结果直接写成 DOM 的 `data-overflow`
 * 属性，由 CSS 决定是否播放动画——滚动是纯视觉行为，不该引起 React 重渲染。
 *
 * 用法：
 *   <AdaptTable columns={[{key:'name',title:'名称',width:40}]} dataSource={rows} autoScroll />
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export default function AdaptTable({
  columns = [],
  dataSource = [],
  rowHeight = 38,
  headerHeight = 42,
  marquee = true,
  autoScroll = false,
  maxBodyHeight = 240,
  emptyText = '暂无数据',
  className = '',
}) {
  const wrapRef = useRef(null)
  const [widths, setWidths] = useState(() => columns.map((c) => c.width ?? 0))
  const [rowH, setRowH] = useState(rowHeight)

  /** 列宽兜底：列数变化（切换数据集）时自动退回 props 定义，避免错位 */
  const cols = useMemo(() => {
    const raw = widths.length === columns.length ? widths : columns.map((c) => c.width ?? 0)
    const total = raw.reduce((sum, w) => sum + (Number(w) || 0), 0)
    const useEven = total <= 0
    return columns.map((col, i) => ({
      ...col,
      w: useEven ? 100 / columns.length : ((Number(raw[i]) || 0) / total) * 100,
    }))
  }, [columns, widths])

  /** 超出列宽 → 打标记，交给 CSS 跑马灯 */
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined

    const mark = () => {
      wrap.querySelectorAll('.st-adapttable__txt').forEach((el) => {
        el.dataset.overflow = el.scrollWidth > el.clientWidth + 1 ? '1' : '0'
      })
    }

    mark()
    const timer = setTimeout(mark, 80)

    let observer = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(mark)
      observer.observe(wrap)
    } else {
      window.addEventListener('resize', mark)
    }

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', mark)
      clearTimeout(timer)
    }
  }, [cols, dataSource, rowH, marquee])

  /** 拖拽表头分隔条：相邻两列此消彼长，总宽恒定 */
  const startColResize = (event, index) => {
    const wrap = wrapRef.current
    if (!wrap) return
    event.preventDefault()
    event.stopPropagation()

    const rect = wrap.getBoundingClientRect()
    const startX = event.clientX
    const base = cols.map((c) => c.w)
    const pair = base[index] + base[index + 1]

    const move = (ev) => {
      const delta = ((ev.clientX - startX) / rect.width) * 100
      const left = clamp(base[index] + delta, 6, pair - 6)
      const next = base.slice()
      next[index] = left
      next[index + 1] = pair - left
      setWidths(next)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  /** 拖拽表头下沿：统一改行高 */
  const startRowResize = (event) => {
    event.preventDefault()
    const startY = event.clientY
    const base = rowH
    const move = (ev) => setRowH(clamp(base + (ev.clientY - startY), 26, 88))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const renderRow = (row, index) => (
    <div className="st-adapttable__tr" style={{ height: rowH }}>
      {cols.map((col) => (
        <div key={col.key} className="st-adapttable__td" style={{ width: `${col.w}%` }}>
          <span className="st-adapttable__txt">
            {col.render ? col.render(row[col.key], row, index) : row[col.key]}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div ref={wrapRef} className={`st-adapttable ${className}`}>
      <div className="st-adapttable__head" style={{ height: headerHeight }}>
        {cols.map((col, i) => (
          <div key={col.key} className="st-adapttable__th" style={{ width: `${col.w}%` }}>
            <span className="st-adapttable__txt">{col.title}</span>
            {i < cols.length - 1 && (
              <span
                className="st-adapttable__split"
                onPointerDown={(e) => startColResize(e, i)}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
        <span
          className="st-adapttable__rowsplit"
          onPointerDown={startRowResize}
          title="拖动调整行高"
          aria-hidden="true"
        />
      </div>

      <div className="st-adapttable__body" style={autoScroll ? undefined : { maxHeight: maxBodyHeight }}>
        {dataSource.length === 0 ? (
          <div className="st-adapttable__empty">{emptyText}</div>
        ) : autoScroll ? (
          <AutoScrollList
            items={dataSource}
            rowHeight={rowH}
            maxHeight={maxBodyHeight}
            speed={22}
            renderItem={renderRow}
          />
        ) : (
          dataSource.map(renderRow)
        )}
      </div>
    </div>
  )
}
