/**
 * 数值统计 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   数值统计
   ===================================================================== */

export const sum = (arr = []) => arr.reduce((acc, n) => acc + (Number(n) || 0), 0)
export const avg = (arr = []) => (arr.length ? sum(arr) / arr.length : 0)

/** 中位数：偶数个取中间两项平均；忽略非数字 */
export function median(arr = []) {
  const list = arr.filter((n) => typeof n === 'number' && !Number.isNaN(n)).sort((a, b) => a - b)
  if (!list.length) return 0
  const mid = Math.floor(list.length / 2)
  return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2
}

/** 闭区间判断：inRange(5, 1, 10) → true */
export const inRange = (n, min, max) => Number(n) >= min && Number(n) <= max

/** 四舍五入到指定小数位：roundTo(1.234, 2) → 1.23 */
export function roundTo(n, digits = 0) {
  const p = 10 ** digits
  return Math.round(Number(n) * p) / p
}

/** 计算占比（返回数字，不带 % 号）；total 为 0 时返回 0，不产生 NaN */
export function percentOf(part, total, digits = 1) {
  const t = Number(total)
  if (!t) return 0
  return roundTo((Number(part) / t) * 100, digits)
}

/** 毫秒 → 中文时长：3天2小时1分 / 1小时5分3秒 / 42秒 */
export function formatDuration(ms = 0) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (d) return `${d}天${h}小时${m}分`
  if (h) return `${h}小时${m}分${s}秒`
  if (m) return `${m}分${s}秒`
  return `${s}秒`
}

/**
 * 把数值夹在 [min, max] 区间内。
 *
 * 全项目唯一实现：此前 clamp 散落在 creative/utils/math、Kit/utils、
 * PerfLab/virtual、Studio 三个组件、Assistants 两个面板等十来处，语义各不相同
 * （有的 NaN 回落 min、有的直接返回 NaN），改一处忘一处就会有微妙漂移。
 * 这里统一为：NaN 回落 min，±Infinity 落到对应边界，其余按大小夹取。
 */
export function clamp(n, min, max) {
  const v = typeof n === 'number' ? n : Number(n)
  if (Number.isNaN(v)) return min
  return v < min ? min : v > max ? max : v
}
