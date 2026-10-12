/**
 * 本地存储 state。
 *
 * 本文件由 hooks.js 按职责域拆分而来，实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js。
 */

import { useState, useEffect } from 'react'
import { getStorage, setStorage } from './utils.js'

/* =====================================================================
   存储
   ===================================================================== */

/** 与 localStorage 双向同步的 state（支持过期时间） */
export function useLocalStorage(key, initial, { expire } = {}) {
  const [value, setValue] = useState(() => getStorage(key, initial))
  useEffect(() => { setStorage(key, value, { expire }) }, [key, value, expire])
  return [value, setValue]
}

/** 与 sessionStorage 同步的 state */
export function useSessionStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw == null ? initial : JSON.parse(raw)
    } catch { return initial }
  })
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* 忽略配额/隐私模式 */ }
  }, [key, value])
  return [value, setValue]
}
