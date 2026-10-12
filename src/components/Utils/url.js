/**
 * URL 与查询串 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   URL / 查询串
   ===================================================================== */

/** 查询串 → 对象 */
export function parseQuery(search = '') {
  const s = String(search).replace(/^\?/, '')
  return s.split('&').filter(Boolean).reduce((acc, pair) => {
    const [k, v = ''] = pair.split('=')
    if (!k) return acc
    acc[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '))
    return acc
  }, {})
}

/** 对象 → 查询串 */
export function stringifyQuery(obj = {}) {
  return Object.keys(obj)
    .filter((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join('&')
}
