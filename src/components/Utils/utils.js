/**
 * 小功能集 · 纯工具函数（零依赖，可直接 node 跑断言）
 *
 * 取材自存量项目里高频出现的小工具（debounce/throttle 出现在 5 个项目、
 * 日期转换 / copyText / downloadBlob / scrollToBottom 各 3 个、isNotUndefined 等），
 * 全部去除业务耦合，只保留通用能力。演示数据均为中性占位，不含任何业务实体。
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

/* =====================================================================
   格式化 / 脱敏
   ===================================================================== */

/** 千分位 */
export function formatThousands(value, separator = ',') {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const [int, dec] = String(n).split('.')
  const sign = int.startsWith('-') ? '-' : ''
  const digits = sign ? int.slice(1) : int
  const withSep = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return `${sign}${withSep}${dec ? `.${dec}` : ''}`
}

/** 字节 → 人类可读（KB/MB/GB/TB） */
export function formatFileSize(bytes, precision = 2) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return ''
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB', 'PB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(precision)} ${units[i]}`
}

/**
 * 字符串脱敏：保留前 start 位与后 end 位，中间打码
 * mask('13800138000', { start: 3, end: 4 }) → '138****8000'
 */
export function mask(str, { start = 3, end = 4, char = '*' } = {}) {
  const s = str == null ? '' : String(str)
  if (!s) return ''
  if (s.length <= start + end) {
    return char.repeat(Math.max(1, s.length))
  }
  return `${s.slice(0, start)}${char.repeat(s.length - start - end)}${s.slice(s.length - end)}`
}

/** 百分比（0.1234 → '12.34%'） */
export function formatPercent(value, precision = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return `${(n * 100).toFixed(precision)}%`
}

/* =====================================================================
   下载 / 剪贴板 / 导出
   ===================================================================== */

/** 触发 Blob 下载 */
export function downloadBlob(blob, filename = 'download') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 交给下一帧再释放，避免部分浏览器下载被中断
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** 按 URL 下载（同源或允许跨域时） */
export function downloadUrl(url, filename = 'download') {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const csvEscape = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * 导出 CSV（带 BOM，Excel 打开中文不乱码）
 * @param {{columns: Array<{key:string,title?:string,value?:Function}>, rows: Array, filename?: string}} options
 */
export function exportCsv({ columns = [], rows = [], filename = 'export.csv' } = {}) {
  const header = columns.map((c) => csvEscape(c.title ?? c.key)).join(',')
  const body = rows
    .map((row) => columns.map((c) => csvEscape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','))
    .join('\r\n')
  // \uFEFF = BOM，保证 Excel 打开中文不乱码（此处用转义写法，避免源码里出现不可见字符）
  const csv = `\uFEFF${header}\r\n${body}`
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
  return csv
}

/** 复制文本（优先 Clipboard API，降级 textarea + execCommand） */
export async function copyText(text) {
  const s = text == null ? '' : String(text)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s)
      return true
    }
  } catch { /* 继续走降级 */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = s
    ta.setAttribute('readonly', 'readonly')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/* =====================================================================
   数组 / 对象
   ===================================================================== */

const keyFn = (k) => (typeof k === 'function' ? k : (item) => item?.[k])

/** 数组转对象（存量项目高频：arrayToObject） */
export function arrayToObject(arr = [], key = 'id') {
  return arr.reduce((acc, item) => {
    const k = item?.[key]
    if (k != null) acc[k] = item
    return acc
  }, {})
}

/** 分组 */
export function groupBy(arr = [], key) {
  const get = keyFn(key)
  return arr.reduce((acc, item) => {
    const k = get(item)
    const kk = k == null ? '__other__' : String(k)
    if (!acc[kk]) acc[kk] = []
    acc[kk].push(item)
    return acc
  }, {})
}

/** 去重（可按 key 去重） */
export function unique(arr = [], key) {
  if (!key) return Array.from(new Set(arr))
  const get = keyFn(key)
  const seen = new Set()
  return arr.filter((item) => {
    const k = get(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** 排序（不修改原数组） */
export function sortBy(arr = [], key, order = 'asc') {
  const get = typeof key === 'function' ? key : (item) => item?.[key]
  const dir = order === 'desc' ? -1 : 1
  return [...arr].sort((a, b) => {
    const va = get(a)
    const vb = get(b)
    if (va === vb) return 0
    return (va > vb ? 1 : -1) * dir
  })
}

/** 扁平化（depth = Infinity 全部展开） */
export function flatten(arr = [], depth = 1) {
  if (depth === Infinity) {
    return arr.reduce((acc, v) => acc.concat(Array.isArray(v) ? flatten(v, Infinity) : v), [])
  }
  return depth > 0
    ? arr.reduce((acc, v) => acc.concat(Array.isArray(v) ? flatten(v, depth - 1) : v), [])
    : [...arr]
}

/** 深拷贝（优先 structuredClone，降级 JSON） */
export function deepClone(value) {
  if (value == null || typeof value !== 'object') return value
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value) } catch { /* 含函数时降级 */ }
  }
  return JSON.parse(JSON.stringify(value))
}

const isPlainObj = (v) => Object.prototype.toString.call(v) === '[object Object]'

/** 深合并（不修改 target） */
export function deepMerge(target = {}, source = {}) {
  const out = Array.isArray(target) ? [...target] : { ...target }
  Object.keys(source || {}).forEach((k) => {
    const sv = source[k]
    const tv = out[k]
    if (isPlainObj(sv) && isPlainObj(tv)) out[k] = deepMerge(tv, sv)
    else if (Array.isArray(sv)) out[k] = [...sv]
    else if (sv !== undefined) out[k] = sv
  })
  return out
}

/** 空值判断：null/undefined/空串/空数组/空对象 */
export function isEmpty(v) {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  if (isPlainObj(v)) return Object.keys(v).length === 0
  if (v instanceof Map || v instanceof Set) return v.size === 0
  return false
}

/** 已定义（非 null/undefined）— 存量项目 isNotUndefined */
export function isDef(v) { return v !== undefined && v !== null }

/** 选取字段 */
export function pick(obj = {}, keys = []) {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k]
    return acc
  }, {})
}

/** 排除字段 */
export function omit(obj = {}, keys = []) {
  const set = new Set(keys)
  return Object.keys(obj).reduce((acc, k) => {
    if (!set.has(k)) acc[k] = obj[k]
    return acc
  }, {})
}

/** 安全 JSON 解析 */
export function safeJsonParse(str, fallback = null) {
  try { return JSON.parse(str) } catch { return fallback }
}

/* =====================================================================
   树结构
   ===================================================================== */

/** 树 → 平铺数组 */
export function treeToArray(tree = [], childrenKey = 'children') {
  const out = []
  const walk = (nodes) => {
    nodes.forEach((n) => {
      out.push(n)
      if (Array.isArray(n?.[childrenKey])) walk(n[childrenKey])
    })
  }
  walk(tree)
  return out
}

/** 平铺数组 → 树 */
export function arrayToTree(arr = [], { id = 'id', parentId = 'parentId', childrenKey = 'children' } = {}) {
  const map = new Map()
  const roots = []
  const nodes = arr.map((n) => ({ ...n, [childrenKey]: [] }))
  nodes.forEach((n) => map.set(n[id], n))
  nodes.forEach((n) => {
    const p = map.get(n[parentId])
    if (p && p[id] !== n[id]) p[childrenKey].push(n)
    else roots.push(n)
  })
  return roots
}

/** 在树中按 id 查找节点（深度优先） */
export function findTreeNode(tree = [], id, { id: idKey = 'id', childrenKey = 'children' } = {}) {
  for (const node of tree) {
    if (node?.[idKey] === id) return node
    if (Array.isArray(node?.[childrenKey])) {
      const hit = findTreeNode(node[childrenKey], id, { id: idKey, childrenKey })
      if (hit) return hit
    }
  }
  return null
}

/* =====================================================================
   URL / 查询串
   ===================================================================== */

/** 查询串 → 对象 */
export function parseQuery(search = '') {
  const s = String(search).replace(/^\?/, '')
  return s.split('&').filter(Boolean).reduce((acc, pair) => {
    const [k, v = ''] = pair.split('=')
    if (!k) return acc
    acc[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '))
    return acc
  }, {})
}

/** 对象 → 查询串 */
export function stringifyQuery(obj = {}) {
  return Object.keys(obj)
    .filter((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join('&')
}

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

/* =====================================================================
   存储（带过期时间）
   ===================================================================== */

/** 写入（value 自动 JSON 序列化；expire 为毫秒） */
export function setStorage(key, value, { expire } = {}) {
  const payload = { value, __expire: expire ? Date.now() + expire : 0 }
  try { localStorage.setItem(key, JSON.stringify(payload)); return true } catch { return false }
}

/** 读取（过期自动清理，返回 fallback） */
export function getStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    const data = safeJsonParse(raw, null)
    if (!data || typeof data !== 'object') return fallback
    if (data.__expire && Date.now() > data.__expire) {
      localStorage.removeItem(key)
      return fallback
    }
    return data.value
  } catch { return fallback }
}

export function removeStorage(key) {
  try { localStorage.removeItem(key); return true } catch { return false }
}

/* =====================================================================
   环境判断（UA）
   ===================================================================== */

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent || '')

export const isMobile = () => /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua())
export const isIOS = () => /iPhone|iPad|iPod/i.test(ua())
export const isAndroid = () => /Android/i.test(ua())
export const isWeixin = () => /MicroMessenger/i.test(ua())

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
