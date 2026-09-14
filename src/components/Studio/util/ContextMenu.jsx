import { useEffect, useRef, useState } from 'react'

/**
 * 右键上下文菜单：在包裹区域内右键弹出菜单，点击任意处或滚动即关闭。
 * 思路来自 iws-web 的 ContextMenuWrapper，去业务重写。
 */
export default function ContextMenu({ menu = [], children, className }) {
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!pos) return undefined
    const close = () => setPos(null)
    window.addEventListener('click', close)
    window.addEventListener('contextmenu', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [pos])

  const onContext = (e) => {
    e.preventDefault()
    setPos({ x: e.clientX, y: e.clientY })
  }

  return (
    <span ref={useRef(null)} className={className} onContextMenu={onContext} style={{ display: 'inline-block' }}>
      {children}
      {pos && (
        <ul className="st-ctxmenu" style={{ left: pos.x, top: pos.y }}>
          {menu.map((m) => (
            <li key={m.key} onClick={() => { m.onClick?.(); setPos(null) }}>{m.label}</li>
          ))}
        </ul>
      )}
    </span>
  )
}
