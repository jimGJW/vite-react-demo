/**
 * 时间处理 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   时间
   ===================================================================== */

const pad2 = (n) => String(n).padStart(2, '0')

/** 把 Date / 时间戳 / 字符串 统一成 Date；非法输入返回 null */
function toDate(input) {
  if (input == null || input === '') return null
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  let v = input
  if (typeof v === 'number' || /^\d+$/.test(String(v).trim())) {
    v = Number(v)
    // 秒级时间戳补成毫秒
    if (v > 0 && v < 1e11) v *= 1000
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  // 'YYYY-MM-DD HH:mm:ss' 在部分浏览器需转成 'YYYY/MM/DD HH:mm:ss'
  const s = String(v).trim().replace(/-/g, '/').replace('T', ' ').replace(/\..*$/, '')
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}
export { toDate }

/**
 * 日期格式化
 * @param {Date|number|string} input
 * @param {string} pattern 支持 YYYY YY MM M DD D HH H mm m ss s
 */
export function formatDate(input, pattern = 'YYYY-MM-DD HH:mm:ss') {
  const d = toDate(input)
  if (!d) return ''
  const map = {
    YYYY: d.getFullYear(),
    YY: String(d.getFullYear()).slice(-2),
    MM: pad2(d.getMonth() + 1), M: d.getMonth() + 1,
    DD: pad2(d.getDate()), D: d.getDate(),
    HH: pad2(d.getHours()), H: d.getHours(),
    mm: pad2(d.getMinutes()), m: d.getMinutes(),
    ss: pad2(d.getSeconds()), s: d.getSeconds(),
  }
  return pattern.replace(/YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g, (t) => String(map[t] ?? t))
}

/** 相对时间：刚刚 / x 分钟前 / x 小时前 / x 天前 / 具体日期 */
export function formatRelativeTime(input, now = Date.now()) {
  const d = toDate(input)
  if (!d) return ''
  const diff = Math.floor((now - d.getTime()) / 1000)
  if (diff < 0) return formatDate(d, 'YYYY-MM-DD')
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`
  return formatDate(d, 'YYYY-MM-DD')
}

/** 两个日期相差天数（b - a，向下取整） */
export function diffDays(a, b) {
  const da = toDate(a)
  const db = toDate(b)
  if (!da || !db) return 0
  return Math.floor((db.getTime() - da.getTime()) / 86400000)
}
