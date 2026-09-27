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

/* =====================================================================
   对象路径存取（支持 'a.b[0].c' 写法）
   ===================================================================== */

const toPathKeys = (path = '') => String(path)
  .replace(/\[(\d+)\]/g, '.$1')
  .split('.')
  .filter((k) => k !== '')

/** 安全取深层值，取不到返回 fallback，不会因为中间层是 undefined 而抛错 */
export function get(obj, path = '', fallback) {
  const keys = toPathKeys(path)
  if (obj == null || !keys.length) return fallback
  let cur = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return fallback
    cur = cur[k]
  }
  return cur === undefined ? fallback : cur
}

/** 不可变地设置深层值，返回新对象（中间层缺失时自动补对象） */
export function set(obj, path = '', value) {
  const keys = toPathKeys(path)
  if (!keys.length) return obj
  const root = Array.isArray(obj) ? obj.slice() : { ...(obj || {}) }
  let cur = root
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i]
    const next = cur[k]
    cur[k] = Array.isArray(next) ? next.slice() : (next && typeof next === 'object' ? { ...next } : {})
    cur = cur[k]
  }
  cur[keys[keys.length - 1]] = value
  return root
}

/** 判断路径是否存在（即使末端值是 undefined，只要键在就返回 true） */
export function has(obj, path = '') {
  const keys = toPathKeys(path)
  if (obj == null || !keys.length) return false
  let cur = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object' || !(k in cur)) return false
    cur = cur[k]
  }
  return true
}

/** 键值互换：{ a: 1 } → { 1: 'a' } */
export function invert(obj = {}) {
  return Object.keys(obj).reduce((acc, k) => {
    acc[String(obj[k])] = k
    return acc
  }, {})
}

/** 映射对象的值，键保持不变 */
export function mapValues(obj = {}, fn) {
  if (typeof fn !== 'function') return { ...obj }
  return Object.keys(obj).reduce((acc, k) => {
    acc[k] = fn(obj[k], k)
    return acc
  }, {})
}

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
