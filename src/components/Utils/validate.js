/**
 * 常用校验 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   常用校验
   ===================================================================== */

export const isEmail = (s = '') => /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(String(s).trim())
/** 中国大陆手机号（11 位，1 开头第二位 3-9） */
export const isPhone = (s = '') => /^1[3-9]\d{9}$/.test(String(s).trim())
export const isNumeric = (s = '') => {
  const v = String(s).trim()
  return v !== '' && !Number.isNaN(Number(v))
}
export const isChinese = (s = '') => /^[\u4e00-\u9fa5]+$/.test(String(s).trim())

export function isUrl(s = '') {
  try {
    new URL(String(s))
    return true
  } catch { return false }
}

/**
 * 中国大陆 18 位身份证校验：格式 + 校验位（ISO 7064 MOD 11-2）。
 * 只校验编码是否合法，不代表该号码真实存在。
 */
export function isIdCard(s = '') {
  const v = String(s).trim().toUpperCase()
  if (!/^\d{17}[\dX]$/.test(v)) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let acc = 0
  for (let i = 0; i < 17; i += 1) acc += Number(v[i]) * weights[i]
  return codes[acc % 11] === v[17]
}
