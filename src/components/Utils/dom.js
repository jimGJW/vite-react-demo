/**
 * DOM 与浏览器 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   DOM / 浏览器
   ===================================================================== */

/** 滚动到底部 */
export function scrollToBottom(el) {
  const node = el && el.current ? el.current : el
  if (!node) return
  if (typeof node.scrollTo === 'function') node.scrollTo({ top: node.scrollHeight })
  else node.scrollTop = node.scrollHeight
}

/** 预加载图片 */
export function preloadImages(urls = []) {
  return Promise.all(
    urls.map((src) => new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ src, ok: true })
      img.onerror = () => resolve({ src, ok: false })
      img.src = src
    })),
  )
}

/** className 拼接（支持字符串 / 对象 / 数组） */
export function classNames(...args) {
  const out = []
  const walk = (v) => {
    if (!v) return
    if (typeof v === 'string' || typeof v === 'number') { out.push(v); return }
    if (Array.isArray(v)) { v.forEach(walk); return }
    if (typeof v === 'object') {
      Object.keys(v).forEach((k) => { if (v[k]) out.push(k) })
    }
  }
  args.forEach(walk)
  return out.join(' ')
}
