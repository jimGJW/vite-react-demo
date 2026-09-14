/**
 * 极简断言库（零依赖，供 tests/unit/*.test.mjs 使用）
 * 断言失败抛 AssertionError，由 scripts/run-tests.mjs 捕获统计。
 */

export class AssertionError extends Error {}

const show = (v) => {
  if (typeof v === 'string') return JSON.stringify(v)
  try { return JSON.stringify(v) } catch { return String(v) }
}

export function ok(value, msg = '期望为真') {
  if (!value) throw new AssertionError(`${msg}（实际 ${show(value)}）`)
}

export function eq(actual, expected, msg = '值不相等') {
  if (actual !== expected) {
    throw new AssertionError(`${msg}：期望 ${show(expected)}，实际 ${show(actual)}`)
  }
}

export function notEq(actual, expected, msg = '值不应相等') {
  if (actual === expected) throw new AssertionError(`${msg}：实际 ${show(actual)}`)
}

/** 深度相等（JSON 序列化比较，够用于纯数据） */
export function deepEq(actual, expected, msg = '结构不相等') {
  const a = show(actual)
  const b = show(expected)
  if (a !== b) throw new AssertionError(`${msg}：期望 ${b}，实际 ${a}`)
}

/** 数值近似（浮点/时间误差容忍） */
export function close(actual, expected, tolerance = 1, msg = '数值不接近') {
  if (Math.abs(Number(actual) - Number(expected)) > tolerance) {
    throw new AssertionError(`${msg}：期望 ${expected}±${tolerance}，实际 ${actual}`)
  }
}

export async function throws(fn, msg = '期望抛出异常') {
  let threw = false
  try { await fn() } catch { threw = true }
  if (!threw) throw new AssertionError(msg)
}

/** 数组长度断言 */
export function length(arr, n, msg = '长度不符') {
  const l = Array.isArray(arr) ? arr.length : -1
  if (l !== n) throw new AssertionError(`${msg}：期望 ${n}，实际 ${l}`)
}

export const sleep = (ms) => new Promise((r) => { setTimeout(r, ms) })
