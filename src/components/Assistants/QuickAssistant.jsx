import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssistants } from './AssistantContext.jsx'
import './QuickAssistant.scss'

const LS_POS = 'assistant.quick.pos'
const LS_HIDDEN = 'assistant.quick.hidden'
const MENU_WIDTH = 208
const DRAG_THRESHOLD = 4

const DEFAULT_PAGES = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/agent', label: 'AI Agent 控制台', icon: '🤖' },
  { to: '/voice', label: '语音助手', icon: '🎙️' },
  { to: '/dashboard', label: '控制台', icon: '📊' },
  { to: '/test-center', label: '测试中心', icon: '🧪' },
]

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore */ }
}

/**
 * 可拖动快捷助手键
 *
 * 一个悬浮、可自由拖动（鼠标 / 触摸）的总入口，点击展开菜单：
 * - 开启 / 关闭 AI Agent 面板
 * - 开启 / 关闭 语音助手面板
 * - 一键跳转到指定页面（pages）
 * - 回到顶部、隐藏助手键
 *
 * 位置与隐藏状态写入 localStorage，刷新后保持。
 * 配合 <Assistants /> 使用时，开合状态与全局助手中心同步；单独使用时内部自建状态。
 *
 * props:
 * - pages         跳转页面列表 [{ to, label, icon }]，传 null 可关闭该区块
 * - items         完全自定义菜单项（覆盖默认），结构见下
 * - defaultTo     只跳转单一页面时的快捷配置，等价于 pages=[{ to: defaultTo }]
 * - size          圆形按钮直径，默认 52
 * - initialPos    初始位置 { x, y }，默认右下角
 *
 * 菜单项结构：
 *   { key, icon, label, type: 'toggle' | 'navigate' | 'top' | 'hide', target?, to?, onClick? }
 */
export default function QuickAssistant({
  pages = DEFAULT_PAGES,
  items,
  defaultTo,
  size = 52,
  initialPos,
  className = '',
}) {
  const navigate = useNavigate()
  const ctx = useAssistants()

  const [win, setWin] = useState(() => ({
    w: typeof window === 'undefined' ? 1280 : window.innerWidth,
    h: typeof window === 'undefined' ? 800 : window.innerHeight,
  }))

  const defaultPos = useCallback(
    () => ({
      x: Math.max(8, win.w - size - 24),
      y: Math.max(8, win.h - size - 24),
    }),
    [win.w, win.h, size],
  )

  const [pos, setPos] = useState(() => loadJSON(LS_POS, null) || initialPos || defaultPos())
  const [hidden, setHidden] = useState(() => loadJSON(LS_HIDDEN, false))
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [localActive, setLocalActive] = useState(null)

  const dragRef = useRef({ ox: 0, oy: 0, startX: 0, startY: 0, moved: false })
  const fabRef = useRef(null)
  const posRef = useRef(pos)

  useEffect(() => {
    posRef.current = pos
  }, [pos])

  /* 助手中心状态（无 Provider 时退回内部状态） */
  const active = ctx ? ctx.active : localActive
  const toggleTarget = ctx
    ? ctx.toggle
    : (t) => setLocalActive((prev) => (prev === t ? null : t))

  const clampPos = useCallback(
    (x, y) => ({
      x: clamp(x, 8, Math.max(8, win.w - size - 8)),
      y: clamp(y, 8, Math.max(8, win.h - size - 8)),
    }),
    [win.w, win.h, size],
  )

  /* 窗口尺寸变化时把按钮拉回可视区 */
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setWin({ w, h })
      setPos((p) => clampPos(p.x, p.y))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampPos])

  /* 拖拽（鼠标） */
  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const { ox, oy, startX, startY } = dragRef.current
      if (
        !dragRef.current.moved &&
        (Math.abs(e.clientX - startX) > DRAG_THRESHOLD || Math.abs(e.clientY - startY) > DRAG_THRESHOLD)
      ) {
        dragRef.current.moved = true
      }
      if (!dragRef.current.moved) return
      setPos(clampPos(e.clientX - ox, e.clientY - oy))
    }
    const onUp = () => {
      setDragging(false)
      saveJSON(LS_POS, posRef.current)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, clampPos])

  const startDrag = (clientX, clientY, rect) => {
    dragRef.current = {
      ox: clientX - rect.left,
      oy: clientY - rect.top,
      startX: clientX,
      startY: clientY,
      moved: false,
    }
    setMenuOpen(false)
    setDragging(true)
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    startDrag(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())
  }

  const onTouchStart = (e) => {
    const t = e.touches[0]
    startDrag(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect())
  }

  const onTouchMove = (e) => {
    if (!dragging) return
    const t = e.touches[0]
    dragRef.current.moved = true
    setPos(clampPos(t.clientX - dragRef.current.ox, t.clientY - dragRef.current.oy))
  }

  const onTouchEnd = () => {
    setDragging(false)
    saveJSON(LS_POS, posRef.current)
  }

  const onClickFab = () => {
    if (dragRef.current.moved) return // 拖动结束不触发菜单
    setMenuOpen((o) => !o)
  }

  /* Esc 关闭菜单 */
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const navPages = useMemo(() => {
    if (items) return []
    if (defaultTo) return [{ to: defaultTo, label: '跳转', icon: '🧭' }]
    return pages || []
  }, [items, defaultTo, pages])

  const menuItems = useMemo(() => {
    if (items) return items
    return [
      { key: 'voice', type: 'toggle', target: 'voice', icon: '🎙️', label: '语音助手' },
      { key: 'agent', type: 'toggle', target: 'agent', icon: '🤖', label: 'AI Agent' },
    ]
  }, [items])

  const handleItem = (item) => {
    switch (item.type) {
      case 'toggle':
        toggleTarget(item.target)
        setMenuOpen(false)
        break
      case 'navigate':
        navigate(item.to)
        setMenuOpen(false)
        break
      case 'top':
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setMenuOpen(false)
        break
      case 'hide':
        setHidden(true)
        saveJSON(LS_HIDDEN, true)
        setMenuOpen(false)
        break
      default:
        item.onClick?.()
        setMenuOpen(false)
    }
  }

  /* 菜单定位：默认在按钮上方展开，空间不足时向下 */
  const menuStyle = useMemo(() => {
    const upward = pos.y > win.h * 0.5
    const left = clamp(
      pos.x + size / 2 - MENU_WIDTH / 2,
      8,
      Math.max(8, win.w - MENU_WIDTH - 8),
    )
    return {
      left,
      width: MENU_WIDTH,
      ...(upward
        ? { bottom: Math.max(8, win.h - pos.y + 10) }
        : { top: pos.y + size + 10 }),
    }
  }, [pos, size, win])

  /* 隐藏态：右侧边缘保留一个清晰可见的竖向标签，点击即可恢复 */
  if (hidden) {
    return (
      <button
        type="button"
        className="qa-restore"
        onClick={() => {
          setHidden(false)
          saveJSON(LS_HIDDEN, false)
        }}
        title="展开快捷助手键"
        aria-label="展开快捷助手键"
      >
        <span className="qa-restore-icon">⚡</span>
        <span className="qa-restore-label">助手</span>
      </button>
    )
  }

  return (
    <div className={`qa-root ${className}`}>
      {menuOpen && <div className="qa-menu-backdrop" onClick={() => setMenuOpen(false)} />}

      {menuOpen && (
        <div className="qa-menu" style={menuStyle} role="menu">
          {menuItems.map((item) => {
            const on = item.type === 'toggle' && active === item.target
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={`qa-menu-item ${on ? 'on' : ''}`}
                onClick={() => handleItem(item)}
              >
                <span className="qa-menu-icon">{item.icon}</span>
                <span className="qa-menu-label">{item.label}</span>
                {item.type === 'toggle' && (
                  <span className={`qa-menu-state ${on ? 'on' : ''}`}>{on ? '已开启' : '已关闭'}</span>
                )}
              </button>
            )
          })}

          {navPages.length > 0 && (
            <>
              <div className="qa-menu-sep"><span>快捷跳转</span></div>
              {navPages.map((p) => (
                <button
                  key={p.to + p.label}
                  type="button"
                  role="menuitem"
                  className="qa-menu-item"
                  onClick={() => handleItem({ type: 'navigate', to: p.to })}
                >
                  <span className="qa-menu-icon">{p.icon || '🧭'}</span>
                  <span className="qa-menu-label">{p.label || p.to}</span>
                </button>
              ))}
            </>
          )}

          <div className="qa-menu-sep"><span>其他</span></div>
          <button
            type="button"
            role="menuitem"
            className="qa-menu-item"
            onClick={() => handleItem({ type: 'top' })}
          >
            <span className="qa-menu-icon">⬆️</span>
            <span className="qa-menu-label">回到顶部</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="qa-menu-item"
            onClick={() => handleItem({ type: 'hide' })}
          >
            <span className="qa-menu-icon">👁️</span>
            <span className="qa-menu-label">隐藏助手键</span>
          </button>
        </div>
      )}

      <div
        ref={fabRef}
        className={`qa-fab ${dragging ? 'dragging' : ''} ${menuOpen ? 'active' : ''} ${
          active ? 'busy' : ''
        }`}
        style={{ left: pos.x, top: pos.y, width: size, height: size }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClickFab}
        title="快捷助手键（可拖动）"
        aria-label="快捷助手键"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <span className="qa-fab-icon">{menuOpen ? '✕' : '⚡'}</span>
        {active && <span className="qa-fab-badge" />}
        {!menuOpen && <span className="qa-fab-tip">助手</span>}
      </div>
    </div>
  )
}
