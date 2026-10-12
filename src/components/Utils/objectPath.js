/**
 * 对象路径存取 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   对象路径存取（支持 'a.b[0].c' 写法）
   ===================================================================== */

const toPathKeys = (path = '') => String(path)
  .replace(/\[(\d+)\]/g, '.$1')
  .split('.')
  .filter((k) => k !== '')

/** 安全取深层值，取不到返回 fallback，不会因为中间层是 undefined 而抛错 */
export function get(obj, path = '', fallback) {
  const keys = toPathKeys(path)
  if (obj == null || !keys.length) return fallback
  let cur = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return fallback
    cur = cur[k]
  }
  return cur === undefined ? fallback : cur
}

/** 不可变地设置深层值，返回新对象（中间层缺失时自动补对象） */
export function set(obj, path = '', value) {
  const keys = toPathKeys(path)
  if (!keys.length) return obj
  const root = Array.isArray(obj) ? obj.slice() : { ...(obj || {}) }
  let cur = root
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i]
    const next = cur[k]
    cur[k] = Array.isArray(next) ? next.slice() : (next && typeof next === 'object' ? { ...next } : {})
    cur = cur[k]
  }
  cur[keys[keys.length - 1]] = value
  return root
}

/** 判断路径是否存在（即使末端值是 undefined，只要键在就返回 true） */
export function has(obj, path = '') {
  const keys = toPathKeys(path)
  if (obj == null || !keys.length) return false
  let cur = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object' || !(k in cur)) return false
    cur = cur[k]
  }
  return true
}

/** 键值互换：{ a: 1 } → { 1: 'a' } */
export function invert(obj = {}) {
  return Object.keys(obj).reduce((acc, k) => {
    acc[String(obj[k])] = k
    return acc
  }, {})
}

/** 映射对象的值，键保持不变 */
export function mapValues(obj = {}, fn) {
  if (typeof fn !== 'function') return { ...obj }
  return Object.keys(obj).reduce((acc, k) => {
    acc[k] = fn(obj[k], k)
    return acc
  }, {})
}
