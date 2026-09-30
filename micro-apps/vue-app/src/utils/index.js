/**
 * vue-app 纯函数工具库
 *
 * 设计约定：
 * - 零依赖、无副作用、不 import 任何框架 API → 可在 Node 里直接 import 单测
 * - 分组：函数控制 / 集合 / 对象 / 数字与格式化 / 字符串 / 时间 / 浏览器 / 数据结构
 */

/* ============================ 函数控制 ============================ */

/** 防抖：最后一次调用后 wait 毫秒才执行 */
export function debounce(fn, wait = 300) {
  let timer = null
  function debounced(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  debounced.flush = (...args) => {
    debounced.cancel()
    fn(...args)
  }
  return debounced
}

/** 节流：interval 毫秒内最多执行一次（首次立即执行，尾部可选补一次） */
export function throttle(fn, interval = 300, { trailing = false } = {}) {
  let last = 0
  let timer = null
  function throttled(...args) {
    const now = Date.now()
    const rest = interval - (now - last)
    if (rest <= 0) {
      last = now
      fn(...args)
    } else if (trailing && !timer) {
      timer = setTimeout(() => {
        timer = null
        last = Date.now()
        fn(...args)
      }, rest)
    }
  }
  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return throttled
}

/** 只执行一次 */
export function once(fn) {
  let called = false
  let result
  return (...args) => {
    if (!called) {
      called = true
      result = fn(...args)
    }
    return result
  }
}

/** 结果缓存（按第一个参数做 Map key） */
export function memoize(fn) {
  const cache = new Map()
  return (key, ...rest) => {
    if (!cache.has(key)) cache.set(key, fn(key, ...rest))
    return cache.get(key)
  }
}

/** 失败重试（指数退避），返回 Promise */
export async function retry(fn, { times = 3, delay = 300, factor = 2 } = {}) {
  let lastErr
  for (let i = 0; i < times; i += 1) {
    try {
      return await fn(i)
    } catch (e) {
      lastErr = e
      if (i < times - 1) await sleep(delay * factor ** i)
    }
  }
  throw lastErr
}

/** 等待 ms 毫秒 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ============================ 集合 ============================ */

/** 按 keyFn 分组 → { key: items[] } */
export function groupBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const k = typeof keyFn === 'function' ? keyFn(item) : item[keyFn]
    ;(acc[k] ||= []).push(item)
    return acc
  }, {})
}

/** 稳定排序：返回新数组，不改原数组 */
export function sortBy(list, keyFn, order = 'asc') {
  const dir = order === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    const ka = typeof keyFn === 'function' ? keyFn(a) : a[keyFn]
    const kb = typeof keyFn === 'function' ? keyFn(b) : b[keyFn]
    if (ka === kb) return 0
    return (ka > kb ? 1 : -1) * dir
  })
}

/** 切块 */
export function chunk(list, size = 2) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

/** 数字区间数组 */
export function range(start, end, step = 1) {
  if (end === undefined) {
    end = start
    start = 0
  }
  const out = []
  for (let i = start; i < end; i += step) out.push(i)
  return out
}

/** 按字段去重（保留首个） */
export function uniqueBy(list, keyFn) {
  const seen = new Set()
  return list.filter((item) => {
    const k = typeof keyFn === 'function' ? keyFn(item) : item[keyFn]
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** 分组求和（常见报表诉求：按分组键聚合多个数值字段） */
export function sumBy(list, keyFn) {
  return list.reduce((acc, item) => acc + (Number(keyFn(item)) || 0), 0)
}

/** 按分组键做多字段聚合 */
export function aggregateBy(list, keyFn, fields) {
  const buckets = groupBy(list, keyFn)
  return [...uniqueBy(list, keyFn).map((i) =>
    typeof keyFn === 'function' ? keyFn(i) : i[keyFn],
  )].map((key) => {
    const rows = buckets[key]
    const row = { key, count: rows.length }
    for (const f of fields) row[f] = Number(sumBy(rows, (r) => r[f]).toFixed(2))
    return row
  })
}

/** 深比较（数组/对象/原始值） */
export function isEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a == null || b == null) return false
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((v, i) => isEqual(v, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a)
    const kb = Object.keys(b)
    return ka.length === kb.length && ka.every((k) => isEqual(a[k], b[k]))
  }
  return false
}

/* ============================ 对象 ============================ */

/** 深拷贝（优先 structuredClone，回退 JSON —— JSON 版会丢函数/undefined） */
export function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

/** 深合并：后者覆盖前者，数组按索引递归合并 */
export function deepMerge(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    return source.map((v, i) => (i in target ? deepMerge(target[i], v) : v))
  }
  if (isPlainObject(target) && isPlainObject(source)) {
    const out = { ...target }
    for (const k of Object.keys(source)) {
      out[k] = k in target ? deepMerge(target[k], source[k]) : source[k]
    }
    return out
  }
  return source === undefined ? target : source
}

export function isPlainObject(v) {
  return Object.prototype.toString.call(v) === '[object Object]'
}

/** 取子集 */
export function pick(obj, keys) {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k]
    return acc
  }, {})
}

/** 去掉指定键 */
export function omit(obj, keys) {
  const drop = new Set(keys)
  return Object.keys(obj).reduce((acc, k) => {
    if (!drop.has(k)) acc[k] = obj[k]
    return acc
  }, {})
}

/** 展平一层 */
export function flattenOne(list) {
  return list.reduce((acc, v) => acc.concat(Array.isArray(v) ? v : [v]), [])
}

/** 拍平嵌套路径 → { 'a.b': 1 }（表单单据扁平化） */
export function flattenObject(obj, prefix = '') {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (isPlainObject(v)) Object.assign(out, flattenObject(v, path))
    else out[path] = v
  }
  return out
}

/* ============================ 数字与格式化 ============================ */

/** 数值夹取 */
export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

/** 千分位 + 固定小数位 */
export function formatNumber(n, digits = 0) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** 百分比格式化：0.1234 → 12.3% */
export function formatPercent(ratio, digits = 1) {
  const num = Number(ratio)
  if (!Number.isFinite(num)) return '-'
  return `${(num * 100).toFixed(digits)}%`
}

/** 金额格式化（默认人民币） */
export function formatCurrency(n, currency = 'CNY', digits = 2) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  return num.toLocaleString('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** 字节数人性化（1024 进制，中文单位） */
export function formatBytes(bytes, digits = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : digits)} ${units[i]}`
}

/** 秒数 → 00:05:09 */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const pad = (n) => String(n).padStart(2, '0')
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** 大数字缩写：12345 → 1.2万 */
export function abbrevNumber(n, digits = 1) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  const abs = Math.abs(num)
  if (abs >= 1e8) return `${(num / 1e8).toFixed(digits)}亿`
  if (abs >= 1e4) return `${(num / 1e4).toFixed(digits)}万`
  return String(num)
}

/* ============================ 字符串 ============================ */

/** kebab-case / snake_case → camelCase */
export function camelize(str) {
  return String(str).replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
}

/** camelCase → kebab-case */
export function kebabCase(str) {
  return String(str)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/** 首字母大写 */
export function capitalize(str) {
  const s = String(str)
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

/** 任意字符串 → URL slug（中文转拼音超出纯函数范围，非字母数字转连字符） */
export function slugify(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** 按显示宽度截断（中文按 1 个字符计，末尾可加省略号） */
export function truncate(str, max = 20, suffix = '…') {
  const s = String(str)
  return s.length <= max ? s : s.slice(0, max) + suffix
}

/** HTML 转义（把用户输入渲染进 innerHTML 前的第一道防线） */
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

/** 关键字高亮 → HTML 片段（内部已转义，可安全交给 v-html） */
export function highlight(text, keyword, cls = 'hl') {
  const safe = escapeHtml(text)
  if (!keyword) return safe
  const k = escapeHtml(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return safe.replace(new RegExp(k, 'gi'), (m) => `<mark class="${cls}">${m}</mark>`)
}

/** 短随机 id：prefix + 时间戳36进制 + 随机段 */
export function randomId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** UUID v4（crypto 存在时用 crypto，否则随机拼） */
export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** 脱敏：手机号 / 邮箱 / 身份证 */
export function maskPhone(phone) {
  return String(phone).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}
export function maskEmail(email) {
  return String(email).replace(/^(.{1,2}).*(@.*)$/, '$1***$2')
}

/* ============================ 时间 ============================ */

/** 日期格式化：支持 YYYY MM DD HH mm ss S 占位符 */
export function formatDate(input, fmt = 'YYYY-MM-DD HH:mm:ss') {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return String(input)
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  return fmt
    .replace(/YYYY/g, String(d.getFullYear()))
    .replace(/MM/g, pad(d.getMonth() + 1))
    .replace(/DD/g, pad(d.getDate()))
    .replace(/HH/g, pad(d.getHours()))
    .replace(/mm/g, pad(d.getMinutes()))
    .replace(/ss/g, pad(d.getSeconds()))
    .replace(/S/g, pad(d.getMilliseconds(), 3))
}

/** 相对时间：刚刚 / 3 分钟前 / 2 天前 / 具体日期 */
export function relativeTime(input, now = Date.now()) {
  const t = input instanceof Date ? input.getTime() : new Date(input).getTime()
  if (Number.isNaN(t)) return String(input)
  const diff = Math.floor((now - t) / 1000)
  if (diff < 0) return formatDate(t, 'YYYY-MM-DD')
  if (diff < 30) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  return formatDate(t, 'YYYY-MM-DD')
}

/** 当天起止时间戳 */
export function dayRange(input = new Date()) {
  const d = input instanceof Date ? new Date(input) : new Date(input)
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return { start, end: start + 86400000 - 1 }
}

/* ============================ 浏览器能力（SSR 安全） ============================ */

/** 复制文本：优先 navigator.clipboard，回退 execCommand */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 非安全上下文/无权限，走回退 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
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

/** 下载文本文件（Blob + a[download]） */
export function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 数组 → CSV 文本（自动加 BOM，Excel 打开不乱码） */
export function toCsv(rows, headers) {
  const cols = headers || Object.keys(rows[0] || {})
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))]
  return `\uFEFF${lines.join('\n')}`
}

/** 查询串互转 */
export function parseQuery(search) {
  const out = {}
  new URLSearchParams(search || '').forEach((v, k) => { out[k] = v })
  return out
}
export function stringifyQuery(obj) {
  const sp = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, v)
  })
  return sp.toString()
}

/** 输入值 → 防 XSS 的整数/浮点（表单数字字段常用） */
export function toNumber(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/* ============================ 数据结构 ============================ */

/** LRU 缓存：容量满时淘汰最久未使用 */
export function createLruCache(capacity = 3) {
  const map = new Map()
  return {
    get(key) {
      if (!map.has(key)) return undefined
      const val = map.get(key)
      map.delete(key)
      map.set(key, val)
      return val
    },
    set(key, val) {
      if (map.has(key)) map.delete(key)
      map.set(key, val)
      if (map.size > capacity) map.delete(map.keys().next().value)
      return val
    },
    get size() { return map.size },
    keys() { return [...map.keys()] },
    clear() { map.clear() },
  }
}

/** 极简事件总线（发布订阅） */
export function createEventBus() {
  const handlers = new Map()
  return {
    on(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set())
      handlers.get(type).add(fn)
      return () => this.off(type, fn)
    },
    off(type, fn) { handlers.get(type)?.delete(fn) },
    emit(type, payload) { handlers.get(type)?.forEach((fn) => fn(payload)) },
    once(type, fn) {
      const off = this.on(type, (p) => { off(); fn(p) })
      return off
    },
    clear() { handlers.clear() },
  }
}

/** 分页切片 + 元信息（表格/列表页统一口径） */
export function paginate(list, page = 1, pageSize = 10) {
  const total = list.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = clamp(page, 1, pageCount)
  const start = (current - 1) * pageSize
  return {
    rows: list.slice(start, start + pageSize),
    total,
    page: current,
    pageSize,
    pageCount,
    hasPrev: current > 1,
    hasNext: current < pageCount,
  }
}

/** 轻量表单校验器：规则数组 → { valid, errors, firstError } */
export function createValidator(rules) {
  return (values) => {
    const errors = {}
    for (const [field, fieldRules] of Object.entries(rules)) {
      for (const rule of fieldRules) {
        const value = values[field]
        const msg = rule(value, values)
        if (typeof msg === 'string') {
          errors[field] = msg
          break
        }
      }
    }
    const keys = Object.keys(errors)
    return { valid: keys.length === 0, errors, firstError: keys.length ? errors[keys[0]] : '' }
  }
}

/** 常用规则工厂 */
export const rules = {
  required: (label = '该字段') => (v) => (
    v === undefined || v === null || String(v).trim() === '' ? `${label}必填` : true
  ),
  minLen: (n, label = '长度') => (v) => (
    String(v ?? '').length < n ? `${label}至少 ${n} 个字符` : true
  ),
  maxLen: (n, label = '长度') => (v) => (
    String(v ?? '').length > n ? `${label}最多 ${n} 个字符` : true
  ),
  pattern: (re, msg = '格式不正确') => (v) => (re.test(String(v ?? '')) ? true : msg),
  range: (min, max, label = '数值') => (v) => (
    Number(v) < min || Number(v) > max ? `${label}需在 ${min} ~ ${max} 之间` : true
  ),
  sameAs: (other, label = '两次输入') => (v, values) => (
    v !== values[other] ? `${label}不一致` : true
  ),
}

/* ============================ 函数组合 ============================ */

/** 从左到右依次执行：pipe(f, g)(x) === g(f(x)) */
export function pipe(...fns) {
  return (input) => fns.reduce((acc, fn) => fn(acc), input)
}

/** 从右到左组合：compose(f, g)(x) === f(g(x)) */
export function compose(...fns) {
  return (input) => fns.reduceRight((acc, fn) => fn(acc), input)
}

/** 恒等函数（占位 / 默认回调） */
export const identity = (v) => v

/** 空函数（默认回调，避免调用点写 `() => {}`） */
export const noop = () => {}

/** 侧效应探针：原样返回入参，顺路执行 fn —— 塞进 pipe 里打点用 */
export function tap(fn) {
  return (v) => {
    fn(v)
    return v
  }
}

/** 执行 n 次并把每次下标交给 fn：times(3, i => i * 2) → [0, 2, 4] */
export function times(n, fn = identity) {
  return range(Math.max(0, n)).map((i) => fn(i))
}

/** 偏函数：预置左侧若干实参 */
export function partial(fn, ...preset) {
  return (...rest) => fn(...preset, ...rest)
}

/**
 * 柯里化：把 fn(a, b, c) 变成 fn(a)(b)(c)。
 * 用 fn.length 判断"还差几个参数"，播完才真正调用。
 */
export function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args)
    return (...rest) => curried(...args, ...rest)
  }
}

/* ============================ 数组进阶 ============================ */

/** 按断言一分为二 → [命中[], 未命中[]] */
export function partition(list, predicate) {
  const hit = []
  const miss = []
  for (const item of list) (predicate(item) ? hit : miss).push(item)
  return [hit, miss]
}

/** 计数分组：countBy([{t:'a'},{t:'b'},{t:'a'}], 't') → { a: 2, b: 1 } */
export function countBy(list, keyFn) {
  const out = {}
  for (const item of list) {
    const k = typeof keyFn === 'function' ? keyFn(item) : item[keyFn]
    out[k] = (out[k] || 0) + 1
  }
  return out
}

/** 拉链：zip([1,2],[a,b]) → [[1,a],[2,b]]，长度取最短 */
export function zip(...lists) {
  const len = Math.min(...lists.map((l) => l.length))
  return range(len).map((i) => lists.map((l) => l[i]))
}

/** 解拉链：unzip([[1,a],[2,b]]) → [[1,2],[a,b]] */
export function unzip(pairs) {
  return zip(...pairs)
}

/** 交集（按 keyFn 或原始值判定） */
export function intersect(a, b, keyFn = identity) {
  const keys = new Set(b.map(keyFn))
  return a.filter((item) => keys.has(keyFn(item)))
}

/** 差集：a 有而 b 没有 */
export function difference(a, b, keyFn = identity) {
  const keys = new Set(b.map(keyFn))
  return a.filter((item) => !keys.has(keyFn(item)))
}

/** 并集去重（保留首次出现的顺序） */
export function union(...lists) {
  return [...new Set(lists.flat())]
}

/** 洗牌：返回新数组（Fisher–Yates） */
export function shuffle(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 随机取一个 */
export function sample(list) {
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined
}

/** 随机取 n 个不重复（n 超长时返回整体洗牌） */
export function sampleMany(list, n) {
  return shuffle(list).slice(0, Math.max(0, n))
}

/** 按 keyFn 取最小值 / 最大值（返回元素本身） */
export function minBy(list, keyFn) {
  return list.reduce((best, item) => (
    best === undefined || keyFn(item) < keyFn(best) ? item : best
  ), undefined)
}
export function maxBy(list, keyFn) {
  return list.reduce((best, item) => (
    best === undefined || keyFn(item) > keyFn(best) ? item : best
  ), undefined)
}

/** 取前 n / 去掉前 n（负数表示从尾部算） */
export function take(list, n) {
  return n >= 0 ? list.slice(0, n) : list.slice(n)
}
export function drop(list, n) {
  return n >= 0 ? list.slice(n) : list.slice(0, n)
}

/** 元素搬家（拖拽排序的落点计算，负索引自动修正）——返回新数组 */
export function moveItem(list, from, to) {
  const out = [...list]
  if (from < 0 || from >= out.length) return out
  const target = clamp(to, 0, out.length - 1)
  const [moved] = out.splice(from, 1)
  out.splice(target, 0, moved)
  return out
}

/** 存在则移除、不存在则追加（多选切换，返回新数组） */
export function toggleInArray(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/* ============================ 数值统计 ============================ */

/** 随机整数，默认闭区间 [min, max] */
export function randomInt(min, max, { inclusive = true } = {}) {
  const lo = Math.ceil(min)
  const hi = Math.floor(max)
  return Math.floor(Math.random() * (hi - lo + (inclusive ? 1 : 0))) + lo
}

/** 按精度四舍五入：roundTo(1.005, 2) → 1.01（用 EPSILON 规避浮点误差） */
export function roundTo(n, digits = 2) {
  const num = Number(n)
  if (!Number.isFinite(num)) return 0
  const f = 10 ** digits
  return Math.round((num + Number.EPSILON) * f) / f
}

/** 均值 / 中位数 / 标准差 / 百分位（空数组返回 0） */
export function mean(list) {
  return list.length ? sumBy(list, identity) / list.length : 0
}

export function median(list) {
  if (!list.length) return 0
  const sorted = sortBy(list, identity)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function stdDev(list) {
  if (list.length < 2) return 0
  const avg = mean(list)
  return Math.sqrt(mean(list.map((v) => (v - avg) ** 2)))
}

/** 百分位（p ∈ [0,100]，线性插值） */
export function percentile(list, p) {
  if (!list.length) return 0
  const sorted = sortBy(list, identity)
  const idx = clamp(p, 0, 100) / 100 * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/** 占比：part / total → 百分比数字（不带 % 号，便于二次计算） */
export function percentOf(part, total, digits = 1) {
  if (!Number(total)) return 0
  return roundTo((Number(part) / Number(total)) * 100, digits)
}

/** 带符号数字：+1,234 / -1,234 —— 涨跌、环比差值直接可用 */
export function formatSigned(n, digits = 0) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  const sign = num > 0 ? '+' : num < 0 ? '-' : ''
  return sign + formatNumber(Math.abs(num), digits)
}

/** 线性插值 / 区间映射（进度条、色带、坐标换算） */
export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1)
}

export function mapRange(value, [inMin, inMax], [outMin, outMax]) {
  if (inMax === inMin) return outMin
  return outMin + ((clamp(value, Math.min(inMin, inMax), Math.max(inMin, inMax)) - inMin) / (inMax - inMin)) * (outMax - outMin)
}

/** 加权随机：weightedRandom([{w:3},{w:1}], x => x.w) */
export function weightedRandom(items, weightFn = (x) => x.weight) {
  const total = sumBy(items, weightFn)
  if (total <= 0) return sample(items)
  let r = Math.random() * total
  for (const item of items) {
    r -= weightFn(item)
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

/* ============================ 校验 ============================ */

/** 空值判定：null / undefined / 空串 / 纯空白 都算空 */
export function isBlank(v) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
}

export function isEmail(v) {
  return /^[\w.!#$%&'*+/=?^`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(String(v ?? ''))
}

export function isPhoneCN(v) {
  return /^1[3-9]\d{9}$/.test(String(v ?? ''))
}

export function isUrl(v) {
  try {
    const u = new URL(String(v))
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isNumeric(v) {
  return v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v))
}

/** 二代身份证 18 位：格式 + ISO 7064:1983.MOD 11-2 校验位 */
export function isIdCardCN(v) {
  const id = String(v ?? '').toUpperCase()
  if (!/^\d{17}[\dX]$/.test(id)) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = '10X98765432'
  const sum = weights.reduce((acc, w, i) => acc + Number(id[i]) * w, 0)
  return codes[sum % 11] === id[17]
}

/** 口令强度：长度 + 字符种类 → 0~4 分与中文标签（纯展示口径） */
export function passwordStrength(pwd) {
  const s = String(pwd ?? '')
  let score = 0
  if (s.length >= 6) score += 1
  if (s.length >= 10) score += 1
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) score += 1
  if (/\d/.test(s) && /[^\w\s]/.test(s)) score += 1
  const labels = ['极弱', '偏弱', '一般', '较强', '很强']
  return { score: clamp(score, 0, 4), label: labels[clamp(score, 0, 4)] }
}

/* ============================ 时间进阶 ============================ */

const toDate = (input) => (input instanceof Date ? new Date(input) : new Date(input))

/** 加减天数（返回新 Date，不改原对象） */
export function addDays(input, n) {
  const d = toDate(input)
  d.setDate(d.getDate() + n)
  return d
}

/** 加减月份：自动处理"1/31 加一月"溢出到 3 月的情况 */
export function addMonths(input, n) {
  const d = toDate(input)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
  return d
}

/** 整日差：diffDays(明天, 今天) → 1（按本地日界，忽略时分秒） */
export function diffDays(a, b) {
  const da = dayRange(a).start
  const db = dayRange(b).start
  return Math.round((da - db) / 86400000)
}

/** 当天 00:00:00 / 23:59:59.999 */
export function startOfDay(input = new Date()) {
  return new Date(dayRange(input).start)
}
export function endOfDay(input = new Date()) {
  return new Date(dayRange(input).end)
}

/** 本周起始（weekStartsOn: 0=周日, 1=周一） */
export function startOfWeek(input = new Date(), weekStartsOn = 1) {
  const d = startOfDay(input)
  const shift = (d.getDay() - weekStartsOn + 7) % 7
  return addDays(d, -shift)
}

/** 是否同一天（本地时区） */
export function isSameDay(a, b) {
  return formatDate(a, 'YYYY-MM-DD') === formatDate(b, 'YYYY-MM-DD')
}

/** 中文星期 */
export function weekdayCN(input = new Date()) {
  return `周${'日一二三四五六'[toDate(input).getDay()]}`
}

/** 毫秒 → 人话时长：1 小时 30 分 / 45 秒 */
export function humanDuration(ms) {
  const total = Math.max(0, Math.floor(Number(ms) || 0) / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  const parts = []
  if (d) parts.push(`${d} 天`)
  if (h) parts.push(`${h} 小时`)
  if (m) parts.push(`${m} 分`)
  if (s || !parts.length) parts.push(`${s} 秒`)
  return parts.slice(0, 2).join(' ')
}

/** 毫秒 → 倒计时分段：{ days, hours, minutes, seconds, total } */
export function countdownParts(ms) {
  const total = Math.max(0, Math.floor(Number(ms) || 0))
  return {
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
    total,
  }
}

/** 从生日算年龄（周岁，生日未到减 1） */
export function ageFrom(birthday, now = new Date()) {
  const b = toDate(birthday)
  if (Number.isNaN(b.getTime())) return null
  let age = now.getFullYear() - b.getFullYear()
  const beforeBirthday = now.getMonth() < b.getMonth()
    || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
  if (beforeBirthday) age -= 1
  return age
}

/* ============================ 颜色 ============================ */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** #abc / #aabbcc → { r, g, b }；非法输入返回 null */
export function hexToRgb(hex) {
  const m = HEX_RE.exec(String(hex ?? '').trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

/** { r, g, b } / [r,g,b] → #rrggbb */
export function rgbToHex(input) {
  const { r = 0, g = 0, b = 0 } = Array.isArray(input) ? { r: input[0], g: input[1], b: input[2] } : input
  const to2 = (v) => clamp(Math.round(Number(v) || 0), 0, 255).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

/** 线性混色：t=0 取 a，t=1 取 b */
export function mixHex(a, b, t = 0.5) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  if (!ca || !cb) return rgbToHex(ca || cb || { r: 0, g: 0, b: 0 })
  const k = clamp(t, 0, 1)
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * k,
    g: ca.g + (cb.g - ca.g) * k,
    b: ca.b + (cb.b - ca.b) * k,
  })
}

/** 提亮 / 加深（等价于向白色 / 黑色混色） */
export function lighten(hex, amount = 0.2) {
  return mixHex(hex, '#ffffff', amount)
}
export function darken(hex, amount = 0.2) {
  return mixHex(hex, '#000000', amount)
}

/** 转 rgba() 字符串（需要透明度时） */
export function hexToRgbaString(hex, alpha = 1) {
  const c = hexToRgb(hex)
  if (!c) return String(hex)
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${clamp(alpha, 0, 1)})`
}

/** 在给定底色上可读的文字色（相对亮度阈值法，够用且零依赖） */
export function readableTextOn(hex) {
  const c = hexToRgb(hex)
  if (!c) return '#111827'
  const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255
  return luminance > 0.62 ? '#111827' : '#ffffff'
}

/* ============================ 数据结构进阶 ============================ */

/** 队列（FIFO）：enqueue / dequeue / peek / size */
export function createQueue() {
  const items = []
  return {
    enqueue: (v) => (items.push(v), v),
    dequeue: () => items.shift(),
    peek: () => items[0],
    get size() { return items.length },
    get isEmpty() { return items.length === 0 },
    toArray: () => [...items],
    clear: () => { items.length = 0 },
  }
}

/** 栈（LIFO）：push / pop / peek / size */
export function createStack() {
  const items = []
  return {
    push: (v) => (items.push(v), v),
    pop: () => items.pop(),
    peek: () => items[items.length - 1],
    get size() { return items.length },
    get isEmpty() { return items.length === 0 },
    toArray: () => [...items],
    clear: () => { items.length = 0 },
  }
}

/**
 * 优先队列（二叉堆）：compare(a, b) < 0 表示 a 更优先。
 * 默认数字升序 —— 最小堆。
 */
export function createPriorityQueue(compare = (a, b) => a - b) {
  const heap = []
  const swap = (i, j) => { [heap[i], heap[j]] = [heap[j], heap[i]] }
  const up = (i) => {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (compare(heap[i], heap[parent]) >= 0) break
      swap(i, parent)
      i = parent
    }
  }
  const down = (i) => {
    for (;;) {
      const l = i * 2 + 1
      const r = l + 1
      let best = i
      if (l < heap.length && compare(heap[l], heap[best]) < 0) best = l
      if (r < heap.length && compare(heap[r], heap[best]) < 0) best = r
      if (best === i) break
      swap(i, best)
      i = best
    }
  }
  return {
    push(v) { heap.push(v); up(heap.length - 1); return v },
    pop() {
      if (!heap.length) return undefined
      const top = heap[0]
      const last = heap.pop()
      if (heap.length) { heap[0] = last; down(0) }
      return top
    },
    peek: () => heap[0],
    get size() { return heap.length },
    toArray: () => [...heap].sort(compare),
  }
}

/** 令牌桶限流：tryTake() 返回是否放行（按钮防连点 / 接口节流） */
export function createRateLimiter({ limit = 3, interval = 1000 } = {}) {
  const hits = []
  return {
    tryTake(now = Date.now()) {
      while (hits.length && now - hits[0] >= interval) hits.shift()
      if (hits.length >= limit) return false
      hits.push(now)
      return true
    },
    get remaining() { return Math.max(0, limit - hits.length) },
    reset: () => { hits.length = 0 },
  }
}

/** 带 TTL 的缓存（接口结果缓存 / 防抖升级版） */
export function createTtlCache({ ttl = 60000, capacity = 50 } = {}) {
  const map = new Map()
  const dropExpired = (now = Date.now()) => {
    for (const [k, entry] of map) if (entry.expire <= now) map.delete(k)
  }
  return {
    get(key, now = Date.now()) {
      const hit = map.get(key)
      if (!hit) return undefined
      if (hit.expire <= now) { map.delete(key); return undefined }
      // 触碰即刷新 LRU 顺序
      map.delete(key)
      map.set(key, hit)
      return hit.value
    },
    set(key, value, now = Date.now()) {
      dropExpired(now)
      map.delete(key)
      map.set(key, { value, expire: now + ttl })
      if (map.size > capacity) map.delete(map.keys().next().value)
      return value
    },
    has: (key, now = Date.now()) => this.get(key, now) !== undefined,
    get size() { return map.size },
    clear: () => map.clear(),
  }
}

/** 自增计数器：next() / reset() / value */
export function createCounter(start = 0) {
  let value = start
  let initial = start
  return {
    next: (step = 1) => (value += step),
    get value() { return value },
    reset(to = initial) { initial = to; value = to; return value },
  }
}

/** 自增 ID 生成器：有序、可读、不依赖时间戳 */
export function createIdGenerator(prefix = 'id', start = 1) {
  let n = start
  return {
    next: (pad = 0) => `${prefix}-${String(n++).padStart(pad, '0')}`,
    get count() { return n - start },
    reset(to = start) { n = to },
  }
}

/** 环形缓冲区：固定容量，写满后覆盖最旧的一条（日志/波形采样） */
export function createRingBuffer(size = 10) {
  const buf = []
  return {
    push(v) {
      if (buf.length >= size) buf.shift()
      buf.push(v)
      return v
    },
    toArray: () => [...buf],
    get size() { return buf.length },
    get isFull() { return buf.length >= size },
    clear: () => { buf.length = 0 },
  }
}

/* ============================ 导航分组（三端共用口径） ============================ */

/**
 * 把扁平的菜单项按 group 归组并排序。
 *
 * 三端（React 主应用侧边栏 / Vue 页内导航 / Angular 页内导航）用同一份口径，
 * 避免"分组顺序、组内顺序、未知分组兜底"在各处各写一遍而慢慢跑偏。
 *
 * @param {{path:string,label:string,group:string}[]} items 扁平菜单项
 * @param {{ order?: string[], fallbackGroup?: string }} [options]
 * @returns {{ name:string, items:object[] }[]}
 */
export function buildNavGroups(items, { order = [], fallbackGroup = '其它' } = {}) {
  const map = new Map()
  for (const item of items) {
    const name = item.group || fallbackGroup
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(item)
  }
  const rank = (name) => {
    const i = order.indexOf(name)
    return i === -1 ? order.length : i
  }
  return [...map.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([name, groupItems]) => ({ name, items: groupItems }))
}

/**
 * 关键字过滤导航分组：命中 label 或 path 即保留；空组自动剔除。
 * 关键字为空时原样返回（引用不变，便于 Vue computed / Angular computed 缓存）。
 */
export function filterNavGroups(groups, keyword) {
  const kw = String(keyword ?? '').trim().toLowerCase()
  if (!kw) return groups
  return groups
    .map((g) => ({
      name: g.name,
      items: g.items.filter((i) => (
        String(i.label).toLowerCase().includes(kw) || String(i.path).toLowerCase().includes(kw)
      )),
    }))
    .filter((g) => g.items.length > 0)
}
