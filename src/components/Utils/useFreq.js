/**
 * 频率控制（防抖 / 节流值）。
 *
 * 本文件由 hooks.js 按职责域拆分而来，实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js。
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { debounce } from './utils.js'

/* =====================================================================
   频率控制
   ===================================================================== */

/** 防抖值：value 停止变化 delay 毫秒后才更新 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** 节流值：delay 内最多更新一次 */
export function useThrottle(value, delay = 300) {
  const [throttled, setThrottled] = useState(value)
  const lastRef = useRef(0)
  useEffect(() => {
    const now = Date.now()
    const remaining = delay - (now - lastRef.current)
    if (remaining <= 0) {
      lastRef.current = now
      setThrottled(value)
      return undefined
    }
    const t = setTimeout(() => {
      lastRef.current = Date.now()
      setThrottled(value)
    }, remaining)
    return () => clearTimeout(t)
  }, [value, delay])
  return throttled
}

/** 防抖回调（引用稳定，卸载自动取消） */
export function useDebouncedCallback(fn, delay = 300) {
  const fnRef = useRef(fn)
  const debouncedRef = useRef(null)
  useEffect(() => { fnRef.current = fn }, [fn])
  useEffect(() => {
    debouncedRef.current = debounce((...args) => fnRef.current?.(...args), delay)
    return () => { debouncedRef.current?.cancel() }
  }, [delay])
  return useCallback((...args) => { debouncedRef.current?.(...args) }, [])
}
