/**
 * 本地存储（带过期） —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

import { safeJsonParse } from './collection.js'

/* =====================================================================
   存储（带过期时间）
   ===================================================================== */

/** 写入（value 自动 JSON 序列化；expire 为毫秒） */
export function setStorage(key, value, { expire } = {}) {
  const payload = { value, __expire: expire ? Date.now() + expire : 0 }
  try { localStorage.setItem(key, JSON.stringify(payload)); return true } catch { return false }
}

/** 读取（过期自动清理，返回 fallback） */
export function getStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    const data = safeJsonParse(raw, null)
    if (!data || typeof data !== 'object') return fallback
    if (data.__expire && Date.now() > data.__expire) {
      localStorage.removeItem(key)
      return fallback
    }
    return data.value
  } catch { return fallback }
}

export function removeStorage(key) {
  try { localStorage.removeItem(key); return true } catch { return false }
}
