import { useRef, useState } from 'react'
import { HolderOutlined } from '@ant-design/icons'
import { arrayMove } from '../utils.js'

/**
 * SortableList · 拖拽排序列表
 * =====================================================================
 * 移植自 旧移动端项目 `components/SortCards.js` 的交互（拖拽 + 每项可开关显隐），
 * 但实现整个重写了：
 *   - 原实现用 `react-sortable-hoc`，该库依赖 findDOMNode，已停止维护，
 *     与 React 19 不兼容
 *   - 这里不引入任何拖拽库，用 pointer 事件 + 命中矩形自己算目标位置
 *     （pointer 事件天然统一鼠标 / 触屏 / 触控笔）
 *   - 补了键盘排序：手柄聚焦后用 ↑ / ↓ 移动，符合无障碍要求
 *
 * 用法：
 *   <SortableList
 *     items={cards}
 *     onChange={setCards}
 *     keyOf={(it) => it.key}
 *     renderItem={(it, index, { dragging }) => <span>{it.title}</span>}
 *   />
 */

export default function SortableList({
  items = [],
  onChange,
  renderItem,
  keyOf = (item, index) => item?.key ?? item?.id ?? index,
  disabled = false,
  className = '',
}) {
  const listRef = useRef(null)
  const dragRef = useRef(null)
  const overRef = useRef(-1)
  const [dragIndex, setDragIndex] = useState(-1)
  const [overIndex, setOverIndex] = useState(-1)

  const commit = (from, to) => {
    if (to < 0 || to === from || to >= items.length) return
    onChange?.(arrayMove(items, from, to), { from, to })
  }

  const handlePointerDown = (index, event) => {
    if (disabled) return
    event.preventDefault()
    event.stopPropagation()
    const rects = Array.from(listRef.current?.children || []).map((node) => node.getBoundingClientRect())
    dragRef.current = { index, rects }
    overRef.current = index
    setDragIndex(index)
    setOverIndex(index)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || !drag.rects.length) return
    const y = event.clientY
    let target = drag.index
    drag.rects.forEach((rect, i) => {
      if (y >= rect.top && y <= rect.bottom) target = i
    })
    if (y < drag.rects[0].top) target = 0
    const last = drag.rects[drag.rects.length - 1]
    if (last && y > last.bottom) target = drag.rects.length - 1
    overRef.current = target
    setOverIndex(target)
  }

  const handlePointerUp = () => {
    const drag = dragRef.current
    if (!drag) return
    const from = drag.index
    const to = overRef.current
    dragRef.current = null
    overRef.current = -1
    setDragIndex(-1)
    setOverIndex(-1)
    commit(from, to)
  }

  const handleKeyDown = (index, event) => {
    if (disabled) return
    const offset = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
    if (!offset) return
    event.preventDefault()
    commit(index, index + offset)
  }

  return (
    <div className={`kit-sort ${className}`} ref={listRef}>
      {items.map((item, index) => {
        const dragging = dragIndex === index
        const over = dragIndex !== -1 && overIndex === index && !dragging
        return (
          <div
            key={keyOf(item, index)}
            className={`kit-sort__item ${dragging ? 'is-dragging' : ''} ${over ? 'is-over' : ''}`}
          >
            <span
              className="kit-sort__handle"
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label="拖拽排序，或用上下方向键移动"
              onPointerDown={(e) => handlePointerDown(index, e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={(e) => handleKeyDown(index, e)}
            >
              <HolderOutlined />
            </span>
            <div className="kit-sort__body">
              {renderItem ? renderItem(item, index, { dragging }) : String(item?.label ?? item)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
