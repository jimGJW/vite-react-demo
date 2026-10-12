/**
 * 颜色 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   颜色
   ===================================================================== */

/**
 * 字符串 → 稳定颜色：同一输入永远得到同一颜色。
 * 适合给用户头像、标签自动配色，省掉维护一张映射表。
 */
export function colorFromString(s = '') {
  const str = String(s)
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) % 360
  }
  return `hsl(${h}, 65%, 52%)`
}

/** 按背景亮度返回可读前景色（黑或白），避免浅色底配白字 */
export function contrastColor(hex = '') {
  let h = String(hex).trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return '#000000'
  const n = parseInt(h, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const yiq = (r * 299 + g * 587 + b * 114) / 1000   // YIQ 亮度
  return yiq >= 128 ? '#000000' : '#ffffff'
}
