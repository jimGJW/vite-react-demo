import { useState, useEffect, useRef, useCallback } from 'react'
import UniversalPageAgent from './UniversalPageAgent.jsx'
import { useNavigate as useReactRouterNavigate } from 'react-router-dom'

import './index.scss'

const STORAGE_KEY = 'global-agent-position'
const TOGGLE_SHORTCUT = { ctrlKey: true, shiftKey: true, key: 'a' }

function loadPosition() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return null
}

function savePosition(pos) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
    } catch { /* ignore */ }
}

/** 平滑滚动（相对量） */
function smoothScroll(delta) {
    window.scrollBy({ top: delta, behavior: 'smooth' })
}

/** 平滑滚动（绝对位置） */
function smoothScrollTo(top) {
    window.scrollTo({ top, behavior: 'smooth' })
}

/** 判断焦点是否在输入控件中（此时不拦截键盘） */
function isTyping(e) {
    const t = e.target
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}

function GlobalAgent() {
    const routerNavigate = useReactRouterNavigate()
    const [open, setOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [pos, setPos] = useState(() => loadPosition())
    const [dragging, setDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const panelRef = useRef(null)

    const defaultPos = () => ({
        x: window.innerWidth - 300,
        y: Math.max(60, Math.floor(window.innerHeight * 0.15)),
    })

    const currentPos = pos || defaultPos()

    const toggle = useCallback(() => {
        setOpen((o) => !o)
        setCollapsed(false)
    }, [])

    const close = useCallback(() => {
        setOpen(false)
        setCollapsed(false)
    }, [])

    useEffect(() => {
        const onKey = (e) => {
            // Escape：关闭面板
            if (e.key === 'Escape' && open) {
                close()
                return
            }
            // Ctrl/Cmd+Shift+A：呼出/关闭面板
            if (
                TOGGLE_SHORTCUT.ctrlKey === (e.ctrlKey || e.metaKey) &&
                TOGGLE_SHORTCUT.shiftKey === e.shiftKey &&
                TOGGLE_SHORTCUT.key.toLowerCase() === e.key.toLowerCase()
            ) {
                e.preventDefault()
                toggle()
                return
            }
            // 焦点在输入控件时，不拦截滚动/跳转快捷键（避免影响打字）
            if (isTyping(e)) return

            const mod = e.metaKey || e.ctrlKey

            // —— 页面滚动快捷键 ——
            if (e.key === 'PageDown') { e.preventDefault(); smoothScroll(window.innerHeight * 0.9); return }
            if (e.key === 'PageUp') { e.preventDefault(); smoothScroll(-window.innerHeight * 0.9); return }
            if (e.key === 'Home') { e.preventDefault(); smoothScrollTo(0); return }
            if (e.key === 'End') { e.preventDefault(); smoothScrollTo(document.body.scrollHeight); return }
            if (mod && e.key === 'ArrowDown') { e.preventDefault(); smoothScroll(window.innerHeight * 0.5); return }
            if (mod && e.key === 'ArrowUp') { e.preventDefault(); smoothScroll(-window.innerHeight * 0.5); return }

            // —— 前进 / 后退（页面跳转）——
            if (mod && e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); history.back(); return }
            if (mod && e.altKey && e.key === 'ArrowRight') { e.preventDefault(); history.forward(); return }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, toggle, close])

    useEffect(() => {
        if (!dragging) return
        const onMove = (e) => {
            const x = Math.min(window.innerWidth - 60, Math.max(0, e.clientX - dragOffset.x))
            const y = Math.min(window.innerHeight - 60, Math.max(0, e.clientY - dragOffset.y))
            setPos({ x, y })
        }
        const onUp = () => {
            setDragging(false)
            if (pos) savePosition(pos)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [dragging, dragOffset, pos])

    const onBubbleMouseDown = (e) => {
        if (!open) {
            const rect = e.currentTarget.getBoundingClientRect()
            setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
            setDragging(true)
        }
    }

    const onBubbleTouchStart = (e) => {
        if (!open) {
            const t = e.touches[0]
            const rect = e.currentTarget.getBoundingClientRect()
            setDragOffset({ x: t.clientX - rect.left, y: t.clientY - rect.top })
            setDragging(true)
        }
    }

    const onBubbleTouchMove = (e) => {
        if (!dragging) return
        const t = e.touches[0]
        const x = Math.min(window.innerWidth - 60, Math.max(0, t.clientX - dragOffset.x))
        const y = Math.min(window.innerHeight - 60, Math.max(0, t.clientY - dragOffset.y))
        setPos({ x, y })
    }

    const onBubbleTouchEnd = () => {
        setDragging(false)
        if (pos) savePosition(pos)
    }

    const onBackdropClick = (e) => {
        if (panelRef.current && !panelRef.current.contains(e.target)) {
            close()
        }
    }

    return (
        <>
            {open && (
                <div className="ga-backdrop" onClick={onBackdropClick}>
                    <div
                        ref={panelRef}
                        className={`ga-panel ${collapsed ? 'collapsed' : ''}`}
                        style={{ left: currentPos.x, top: currentPos.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="ga-panel-header">
                            <div className="ga-panel-title">
                                <span className="ga-panel-icon">🤖</span>
                                <span>AI Agent</span>
                                <span className="ga-panel-shortcut">Ctrl+Shift+A</span>
                            </div>
                            <div className="ga-panel-actions">
                                <button className="ga-btn-icon" onClick={() => setCollapsed((c) => !c)} title={collapsed ? '展开' : '折叠'}>
                                    {collapsed ? '▢' : '—'}
                                </button>
                                <button className="ga-btn-icon" onClick={close} title="关闭">✕</button>
                            </div>
                        </div>
                        {!collapsed && (
                            <div className="ga-panel-body">
                                <UniversalPageAgent mode="direct" className="ga-agent" router={{ navigate: routerNavigate }} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div
                className={`ga-bubble ${open ? 'hidden' : ''}`}
                style={{ left: currentPos.x, top: currentPos.y }}
                onMouseDown={onBubbleMouseDown}
                onTouchStart={onBubbleTouchStart}
                onTouchMove={onBubbleTouchMove}
                onTouchEnd={onBubbleTouchEnd}
                onClick={() => {
                    if (!dragging) toggle()
                }}
            >
                <div className="ga-bubble-inner">
                    <span className="ga-bubble-icon">🤖</span>
                    <span className="ga-bubble-ring" />
                </div>
                <div className="ga-bubble-tooltip">AI Agent</div>
            </div>

            {!open && (
                <div className="ga-hint" onClick={toggle}>
                    <span>🤖 Ctrl+Shift+A 呼出 Agent · Ctrl+↑↓ 滚动 · Ctrl+⌥+←→ 前进后退</span>
                </div>
            )}
        </>
    )
}

export default GlobalAgent