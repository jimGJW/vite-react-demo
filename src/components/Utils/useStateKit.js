/**
 * 状态小工具（开关 / 计数器）。
 *
 * 本文件由 hooks.js 按职责域拆分而来，实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js。
 */

import { useState, useCallback } from 'react'
/* =====================================================================
   状态小工具
   ===================================================================== */

/** 布尔开关 */
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = useCallback(() => setValue((v) => !v), [])
  const setOn = useCallback(() => setValue(true), [])
  const setOff = useCallback(() => setValue(false), [])
  return { value, toggle, setOn, setOff, setValue }
}

/** 计数器（可设上下限） */
export function useCounter(initial = 0, { min = -Infinity, max = Infinity } = {}) {
  const [count, setCount] = useState(initial)
  const inc = useCallback((step = 1) => setCount((c) => Math.min(max, c + step)), [max])
  const dec = useCallback((step = 1) => setCount((c) => Math.max(min, c - step)), [min])
  const reset = useCallback(() => setCount(initial), [initial])
  return { count, inc, dec, reset, setCount }
}
