/**
 * 剪贴板 / 文档标题 / 网络状态。
 *
 * 本文件由 hooks.js 按职责域拆分而来，实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js。
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { copyText } from './utils.js'

/* =====================================================================
   剪贴板 / 标题 / 网络
   ===================================================================== */

/** 复制文本，带 copied 状态（自动复位） */
export function useCopy(resetDelay = 1500) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)
  const copy = useCallback(async (text) => {
    const ok = await copyText(text)
    setCopied(ok)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), resetDelay)
    return ok
  }, [resetDelay])
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  return { copied, copy }
}

/** 设置文档标题 */
export function useTitle(title) {
  useEffect(() => { document.title = title }, [title])
}

/** 网络在线状态 */
export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

/** 媒体查询 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false
  ))
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}
