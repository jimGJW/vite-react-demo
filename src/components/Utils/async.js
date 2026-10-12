/**
 * 频率控制与异步 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   频率控制
   ===================================================================== */

/**
 * 防抖：wait 内重复调用只执行最后一次
 * @returns 带 .cancel() / .flush()
 */
export function debounce(fn, wait = 300, { leading = false } = {}) {
  let timer = null
  let lastArgs = null
  const invoke = () => { timer = null; if (lastArgs) fn(...lastArgs); lastArgs = null }
  function debounced(...args) {
    lastArgs = args
    if (leading && timer == null) { fn(...args); lastArgs = null }
    if (timer) clearTimeout(timer)
    timer = setTimeout(invoke, wait)
  }
  debounced.cancel = () => { if (timer) clearTimeout(timer); timer = null; lastArgs = null }
  debounced.flush = () => { if (timer) { clearTimeout(timer); invoke() } }
  return debounced
}

/**
 * 节流：wait 内最多执行一次
 * @returns 带 .cancel()
 */
export function throttle(fn, wait = 300, { leading = true, trailing = true } = {}) {
  let lastCallTime = 0
  let timer = null
  let pendingArgs = null
  function throttled(...args) {
    const now = Date.now()
    if (!lastCallTime && !leading) lastCallTime = now
    const remaining = wait - (now - lastCallTime)
    if (remaining <= 0 || remaining > wait) {
      if (timer) { clearTimeout(timer); timer = null }
      lastCallTime = now
      fn(...args)
    } else if (!timer && trailing) {
      pendingArgs = args
      timer = setTimeout(() => {
        lastCallTime = leading ? Date.now() : 0
        timer = null
        if (pendingArgs) fn(...pendingArgs)
        pendingArgs = null
      }, remaining)
    }
  }
  throttled.cancel = () => { if (timer) clearTimeout(timer); timer = null; pendingArgs = null; lastCallTime = 0 }
  return throttled
}

/** 等待 ms 毫秒 */
export function sleep(ms = 0) {
  return new Promise((resolve) => { setTimeout(resolve, ms) })
}

/**
 * 异步重试
 * @param {() => Promise<any>} fn
 * @param {{times?: number, delay?: number}} options
 */
export async function retry(fn, { times = 3, delay = 0 } = {}) {
  let lastErr
  for (let i = 0; i < times; i += 1) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < times - 1 && delay > 0) {
        await sleep(delay)
      }
    }
  }
  throw lastErr
}
