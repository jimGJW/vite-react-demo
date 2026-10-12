/**
 * 数组增强 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

import { sum } from './number.js'

/* =====================================================================
   数组增强（均返回新数组，不改原数组）
   ===================================================================== */

/** 按固定长度分块：chunk([1,2,3], 2) → [[1,2],[3]] */
export function chunk(arr = [], size = 1) {
  const n = Math.max(1, Math.floor(size))
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

/** 生成序列：range(3) → [0,1,2]；range(1, 5) → [1,2,3,4]；range(5, 0, -2) → [5,3,1] */
export function range(start = 0, end, step = 1) {
  const stop = end === undefined ? start : end
  const from = end === undefined ? 0 : start
  const s = step === 0 ? 1 : step
  const out = []
  if (s > 0) for (let i = from; i < stop; i += s) out.push(i)
  else for (let i = from; i > stop; i += s) out.push(i)
  return out
}

/** 洗牌（Fisher-Yates） */
export function shuffle(arr = []) {
  const list = arr.slice()
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = list[i]
    list[i] = list[j]
    list[j] = t
  }
  return list
}

/** 随机抽 n 个不重复元素 */
export function sample(arr = [], n = 1) {
  return shuffle(arr).slice(0, Math.max(0, n))
}

/** 差集：在 a 中但不在 b 中 */
export const difference = (a = [], b = []) => a.filter((x) => !b.includes(x))
/** 交集：同时在 a 和 b 中 */
export const intersection = (a = [], b = []) => a.filter((x) => b.includes(x))
/** 并集（去重） */
export const union = (a = [], b = []) => Array.from(new Set([...a, ...b]))
/** 去掉 falsy 项：0 也会被去掉，这是刻意的 */
export const compact = (arr = []) => arr.filter(Boolean)

/**
 * 按 key 计数。key 可传属性名，也可传取值函数。
 * countBy(rows, 'status') → { 在线: 3, 离线: 1 }
 */
export function countBy(arr = [], key) {
  const pickVal = typeof key === 'function' ? key : (item) => (item == null ? undefined : item[key])
  return arr.reduce((acc, item) => {
    const k = String(pickVal(item))
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

/** 按 key 求和 */
export function sumBy(arr = [], key) {
  const pickVal = typeof key === 'function' ? key : (item) => (item == null ? undefined : item[key])
  return sum(arr.map((item) => Number(pickVal(item)) || 0))
}

/** 把元素从 from 挪到 to（拖拽排序的底层操作）；下标越界时原样返回 */
export function move(arr = [], from = 0, to = 0) {
  const list = arr.slice()
  if (from < 0 || from >= list.length) return list
  const [item] = list.splice(from, 1)
  list.splice(Math.max(0, Math.min(list.length, to)), 0, item)
  return list
}
