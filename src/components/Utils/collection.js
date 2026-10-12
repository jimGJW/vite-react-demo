/**
 * 数组与对象基础 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   数组 / 对象
   ===================================================================== */

const keyFn = (k) => (typeof k === 'function' ? k : (item) => item?.[k])

/** 数组转对象（存量项目高频：arrayToObject） */
export function arrayToObject(arr = [], key = 'id') {
  return arr.reduce((acc, item) => {
    const k = item?.[key]
    if (k != null) acc[k] = item
    return acc
  }, {})
}

/** 分组 */
export function groupBy(arr = [], key) {
  const get = keyFn(key)
  return arr.reduce((acc, item) => {
    const k = get(item)
    const kk = k == null ? '__other__' : String(k)
    if (!acc[kk]) acc[kk] = []
    acc[kk].push(item)
    return acc
  }, {})
}

/** 去重（可按 key 去重） */
export function unique(arr = [], key) {
  if (!key) return Array.from(new Set(arr))
  const get = keyFn(key)
  const seen = new Set()
  return arr.filter((item) => {
    const k = get(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** 排序（不修改原数组） */
export function sortBy(arr = [], key, order = 'asc') {
  const get = typeof key === 'function' ? key : (item) => item?.[key]
  const dir = order === 'desc' ? -1 : 1
  return [...arr].sort((a, b) => {
    const va = get(a)
    const vb = get(b)
    if (va === vb) return 0
    return (va > vb ? 1 : -1) * dir
  })
}

/** 扁平化（depth = Infinity 全部展开） */
export function flatten(arr = [], depth = 1) {
  if (depth === Infinity) {
    return arr.reduce((acc, v) => acc.concat(Array.isArray(v) ? flatten(v, Infinity) : v), [])
  }
  return depth > 0
    ? arr.reduce((acc, v) => acc.concat(Array.isArray(v) ? flatten(v, depth - 1) : v), [])
    : [...arr]
}

/** 深拷贝（优先 structuredClone，降级 JSON） */
export function deepClone(value) {
  if (value == null || typeof value !== 'object') return value
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value) } catch { /* 含函数时降级 */ }
  }
  return JSON.parse(JSON.stringify(value))
}

const isPlainObj = (v) => Object.prototype.toString.call(v) === '[object Object]'

/** 深合并（不修改 target） */
export function deepMerge(target = {}, source = {}) {
  const out = Array.isArray(target) ? [...target] : { ...target }
  Object.keys(source || {}).forEach((k) => {
    const sv = source[k]
    const tv = out[k]
    if (isPlainObj(sv) && isPlainObj(tv)) out[k] = deepMerge(tv, sv)
    else if (Array.isArray(sv)) out[k] = [...sv]
    else if (sv !== undefined) out[k] = sv
  })
  return out
}

/** 空值判断：null/undefined/空串/空数组/空对象 */
export function isEmpty(v) {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  if (isPlainObj(v)) return Object.keys(v).length === 0
  if (v instanceof Map || v instanceof Set) return v.size === 0
  return false
}

/** 已定义（非 null/undefined）— 存量项目 isNotUndefined */
export function isDef(v) { return v !== undefined && v !== null }

/** 选取字段 */
export function pick(obj = {}, keys = []) {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k]
    return acc
  }, {})
}

/** 排除字段 */
export function omit(obj = {}, keys = []) {
  const set = new Set(keys)
  return Object.keys(obj).reduce((acc, k) => {
    if (!set.has(k)) acc[k] = obj[k]
    return acc
  }, {})
}

/** 安全 JSON 解析 */
export function safeJsonParse(str, fallback = null) {
  try { return JSON.parse(str) } catch { return fallback }
}
