/**
 * 日期增强 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   日期增强
   ===================================================================== */

export function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** 加减天数，支持负数 */
export function addDays(d = new Date(), n = 0) {
  const x = new Date(d)
  x.setDate(x.getDate() + Number(n))
  return x
}

export function isSameDay(a, b) {
  const x = new Date(a)
  const y = new Date(b)
  if (Number.isNaN(x.getTime()) || Number.isNaN(y.getTime())) return false
  return x.getFullYear() === y.getFullYear()
    && x.getMonth() === y.getMonth()
    && x.getDate() === y.getDate()
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
export function weekdayOf(d = new Date()) {
  const x = new Date(d)
  const day = x.getDay()
  return WEEKDAYS[day] || ''
}

/** 某年某月的天数；month 传 1-12 */
export const daysInMonth = (year, month) => new Date(Number(year), Number(month), 0).getDate()

export const isLeapYear = (year) => {
  const y = Number(year)
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}
