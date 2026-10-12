/**
 * 事件与 DOM（点击外部 / 悬停 / 尺寸 / 媒体查询 / 按键）。
 *
 * 本文件由 hooks.js 按职责域拆分而来，实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js。
 */

import { useState, useEffect, useRef } from 'react'
/* =====================================================================
   事件 / DOM
   ===================================================================== */

/** 点击元素外部时触发 */
export function useClickOutside(ref, handler) {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler }, [handler])
  useEffect(() => {
    const onPointerDown = (e) => {
      const el = ref?.current
      if (el && !el.contains(e.target)) handlerRef.current?.(e)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [ref])
}

/** 监听按键（e.key，大小写不敏感） */
export function useKeyPress(key, handler) {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler }, [handler])
  useEffect(() => {
    const onKeyDown = (e) => {
      if (String(e.key).toLowerCase() === String(key).toLowerCase()) handlerRef.current?.(e)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key])
}

/** 元素尺寸（ResizeObserver） */
export function useSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref?.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/** 元素是否悬停 */
export function useHover(ref) {
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    const el = ref?.current
    if (!el) return undefined
    const on = () => setHovered(true)
    const off = () => setHovered(false)
    el.addEventListener('pointerenter', on)
    el.addEventListener('pointerleave', off)
    return () => {
      el.removeEventListener('pointerenter', on)
      el.removeEventListener('pointerleave', off)
    }
  }, [ref])
  return hovered
}

/** 窗口滚动位置（rAF 节流） */
export function useScrollPosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setPos({ x: window.scrollX, y: window.scrollY })
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return pos
}

/** 仅在卸载时执行 */
export function useUnmount(fn) {
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn }, [fn])
  useEffect(() => () => { fnRef.current?.() }, [])
}
