/**
 * 格式化与脱敏 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   格式化 / 脱敏
   ===================================================================== */

/** 千分位 */
export function formatThousands(value, separator = ',') {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const [int, dec] = String(n).split('.')
  const sign = int.startsWith('-') ? '-' : ''
  const digits = sign ? int.slice(1) : int
  const withSep = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return `${sign}${withSep}${dec ? `.${dec}` : ''}`
}

/** 字节 → 人类可读（KB/MB/GB/TB） */
export function formatFileSize(bytes, precision = 2) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return ''
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB', 'PB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(precision)} ${units[i]}`
}

/**
 * 字符串脱敏：保留前 start 位与后 end 位，中间打码
 * mask('13800138000', { start: 3, end: 4 }) → '138****8000'
 */
export function mask(str, { start = 3, end = 4, char = '*' } = {}) {
  const s = str == null ? '' : String(str)
  if (!s) return ''
  if (s.length <= start + end) {
    return char.repeat(Math.max(1, s.length))
  }
  return `${s.slice(0, start)}${char.repeat(s.length - start - end)}${s.slice(s.length - end)}`
}

/** 百分比（0.1234 → '12.34%'） */
export function formatPercent(value, precision = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return `${(n * 100).toFixed(precision)}%`
}
