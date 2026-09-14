import { useRef, useState } from 'react'

/**
 * DraggableBoard · 可编排看板
 * =====================================================================
 * 移植自存量运维/自助看板项目里的 `draggable` 组件。原实现的价值在于三件事：
 *   1. **百分比定位**：拖动与缩放都换算成父容器的百分比写回，因此看板在不同
 *      分辨率下比例一致，不需要重算像素。
 *   2. **碰撞检测**：拖动中实时与其它卡片做矩形相交判断，非法位置不给落位，
 *      并用红/绿底色即时反馈。
 *   3. **鼠标与触摸统一**：两套事件在一处归一。
 *
 * 这里的改造：
 *   - 事件模型从 `mousedown/mousemove` 换成 **Pointer Events**，鼠标 / 触摸 /
 *     触控笔一套代码；配合 `touch-action: none` 彻底避免移动端拖动时页面滚动。
 *   - 原实现把「拖拽注册表」放在全局 `window.draggableComponents`，多实例会
 *     互相污染；这里改为组件内 `boardRef` 局部度量，可同页多实例。
 *   - 拖拽帧只更新一个轻量 `preview` state，落位才 `onChange` 提交——
 *     拖拽过程不污染上层数据，取消即回滚。
 *
 * 数据形态（x/y/w/h 均为 0~100 的百分比）：
 *   [{ id: 'a', x: 2, y: 4, w: 46, h: 40, title: '营收', content: <Chart /> }]
 *
 * 用法：
 *   <DraggableBoard items={cards} editable={edit} onChange={setCards}
 *     renderItem={(it) => it.content} />
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/** 矩形相交判定；gap 为允许的重叠容差（百分比），避免浮点误差导致误判 */
function isOverlap(a, b, gap = 0.6) {
  return (
    a.x < b.x + b.w - gap &&
    a.x + a.w - gap > b.x &&
    a.y < b.y + b.h - gap &&
    a.y + a.h - gap > b.y
  )
}

export default function DraggableBoard({
  items = [],
  editable = false,
  onChange,
  minW = 12,
  minH = 14,
  aspect = 0.42,
  renderItem,
  className = '',
}) {
  const boardRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [invalid, setInvalid] = useState(false)

  const startDrag = (event, item, mode) => {
    if (!editable) return
    const board = boardRef.current
    if (!board) return

    event.preventDefault()
    event.stopPropagation()

    const rect = board.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const origin = { x: item.x, y: item.y, w: item.w, h: item.h }
    const start = { x: event.clientX, y: event.clientY }
    const state = { next: { ...origin }, legal: true }

    const handleMove = (ev) => {
      const dx = ((ev.clientX - start.x) / rect.width) * 100
      const dy = ((ev.clientY - start.y) / rect.height) * 100

      let next
      if (mode === 'move') {
        next = {
          ...origin,
          x: clamp(origin.x + dx, 0, 100 - origin.w),
          y: clamp(origin.y + dy, 0, 100 - origin.h),
        }
      } else {
        next = {
          ...origin,
          w: clamp(origin.w + dx, minW, 100 - origin.x),
          h: clamp(origin.h + dy, minH, 100 - origin.y),
        }
      }

      const others = items.filter((it) => it.id !== item.id)
      const legal = !others.some((it) => isOverlap(next, it))

      state.next = next
      state.legal = legal
      setInvalid(!legal)
      setPreview({ id: item.id, ...next })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)

      setPreview(null)
      setInvalid(false)

      // 非法落位直接丢弃，卡片回弹到按下时的坐标
      if (!state.legal) return
      const changed =
        state.next.x !== origin.x ||
        state.next.y !== origin.y ||
        state.next.w !== origin.w ||
        state.next.h !== origin.h
      if (!changed) return

      onChange?.(items.map((it) => (it.id === item.id ? { ...it, ...state.next } : it)))
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)

    setPreview({ id: item.id, ...origin })
    setInvalid(false)
  }

  return (
    <div
      ref={boardRef}
      className={`st-board ${editable ? 'is-editable' : ''} ${invalid ? 'is-invalid' : ''} ${className}`}
      style={{ paddingTop: `${aspect * 100}%` }}
    >
      <div className="st-board__inner">
        {items.length === 0 && <div className="st-board__empty">暂无卡片</div>}
        {items.map((item) => {
          const box = preview && preview.id === item.id ? { ...item, ...preview } : item
          return (
            <div
              key={item.id}
              className="st-board__card"
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.w}%`,
                height: `${box.h}%`,
                zIndex: preview?.id === item.id ? 20 : undefined,
              }}
            >
              <div
                className="st-board__head"
                onPointerDown={(e) => startDrag(e, item, 'move')}
              >
                <span className="st-board__title">{item.title}</span>
                {editable && <span className="st-board__hint">拖动</span>}
              </div>
              <div className="st-board__body">{renderItem ? renderItem(item) : null}</div>
              {editable && (
                <span
                  className="st-board__resize"
                  onPointerDown={(e) => startDrag(e, item, 'resize')}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
