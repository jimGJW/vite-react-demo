/**
 * 字符串与随机 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   字符串 / 随机
   ===================================================================== */

export const capitalize = (s = '') => String(s).charAt(0).toUpperCase() + String(s).slice(1)
export const camelToKebab = (s = '') => String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
export const kebabToCamel = (s = '') => String(s).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

/** HTML 转义，防 XSS */
export function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

/** #hex / #rrggbb → rgba() */
export function hexToRgba(hex = '', alpha = 1) {
  let h = String(hex).trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return `rgba(0, 0, 0, ${alpha})`
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export const randomInt = (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min
export const randomPick = (arr = []) => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined)
export const randomId = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

/* =====================================================================
   字符串增强
   ===================================================================== */

/** 截断字符串并追加省略号；max 指的是「含省略号」的总长度 */
export function truncate(s = '', max = 20, suffix = '…') {
  const str = String(s)
  if (max <= 0) return ''
  if (str.length <= max) return str
  return str.slice(0, Math.max(0, max - suffix.length)) + suffix
}

/**
 * 中英混排字数统计：中日韩按「字」计，拉丁字母数字按「词」计。
 * 用于字数上限提示、阅读时长估算。
 */
export function wordCount(s = '') {
  const str = String(s)
  const cjk = str.match(/[\u4e00-\u9fa5\u3040-\u30ff]/g) || []
  const words = str
    .replace(/[\u4e00-\u9fa5\u3040-\u30ff]/g, ' ')
    .match(/[A-Za-z0-9_'-]+/g) || []
  return cjk.length + words.length
}

/** 全角转半角（全角空格 → 普通空格），表单输入归一化常用 */
export function toHalfWidth(s = '') {
  return String(s)
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ')
}

/** 转义正则元字符 —— 把用户输入拼进 new RegExp 前必须过一遍，否则会炸 */
export function escapeRegExp(s = '') {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** URL 友好化：小写、空白转连字符、丢弃非法字符 */
export function slugify(s = '') {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** 取姓名首字母做头像占位：中文取前两字，英文取两段首字母 */
export function initials(name = '') {
  const s = String(name).trim()
  if (!s) return ''
  if (/[\u4e00-\u9fa5]/.test(s)) return s.slice(0, 2)
  return s.split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('')
}

/** 去首尾空白，并把中间连续空白压成一个 */
export const trimAll = (s = '') => String(s).trim().replace(/\s+/g, ' ')
