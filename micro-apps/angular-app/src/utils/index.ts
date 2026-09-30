/**
 * angular-app 纯函数工具库
 *
 * 设计约定：
 * - 零依赖、无副作用、不 import 任何 Angular API → 可被 Node 直接 import 单测
 * - 与 vue-app / 主应用 React 侧保持同一套函数名与行为，形成三端对照
 * - 分组：函数控制 / 集合 / 对象 / 数字与格式化 / 字符串 / 时间 / 浏览器 / 数据结构
 */

/* ============================ 函数控制 ============================ */

/** 防抖：最后一次调用后 wait 毫秒才执行 */
export function debounce<T extends (...args: never[]) => void>(fn: T, wait = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: Parameters<T>) => {
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
  debounced.flush = (...args: Parameters<T>) => {
    debounced.cancel()
    fn(...args)
  }
  return debounced
}

/** 节流：interval 毫秒内最多执行一次（首次立即执行，可选尾部补一次） */
export function throttle<T extends (...args: never[]) => void>(
  fn: T, interval = 300, { trailing = false } = {},
) {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  const throttled = (...args: Parameters<T>) => {
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
export function once<T extends (...args: never[]) => unknown>(fn: T) {
  let called = false
  let result: unknown
  const wrapped = (...args: Parameters<T>) => {
    if (!called) {
      called = true
      result = fn(...args)
    }
    return result
  }
  wrapped.reset = () => { called = false }
  return wrapped
}

/** 结果缓存（按第一个参数做 Map key） */
export function memoize<K, R>(fn: (key: K, ...rest: never[]) => R) {
  const cache = new Map<K, R>()
  return (key: K, ...rest: never[]): R => {
    if (!cache.has(key)) cache.set(key, fn(key, ...rest))
    return cache.get(key) as R
  }
}

/** 失败重试（指数退避），返回 Promise */
export async function retry<T>(
  fn: (attempt: number) => Promise<T> | T,
  { times = 3, delay = 300, factor = 2 } = {},
): Promise<T> {
  let lastErr: unknown
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
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ============================ 集合 ============================ */

/** 按 keyFn 分组 → { key: items[] } */
export function groupBy<T, K extends string | number>(
  list: T[], keyFn: ((item: T) => K) | keyof T,
): Record<K, T[]> {
  return list.reduce((acc, item) => {
    const k = (typeof keyFn === 'function' ? keyFn(item) : item[keyFn]) as K
    ;(acc[k] ||= []).push(item)
    return acc
  }, {} as Record<K, T[]>)
}

/** 稳定排序：返回新数组，不改原数组 */
export function sortBy<T>(list: T[], keyFn: ((item: T) => unknown) | keyof T, order: 'asc' | 'desc' = 'asc') {
  const dir = order === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    const ka = (typeof keyFn === 'function' ? keyFn(a) : a[keyFn]) as never
    const kb = (typeof keyFn === 'function' ? keyFn(b) : b[keyFn]) as never
    if (ka === kb) return 0
    return (ka > kb ? 1 : -1) * dir
  })
}

/** 切块 */
export function chunk<T>(list: T[], size = 2): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

/** 数字区间数组 */
export function range(start: number, end?: number, step = 1) {
  if (end === undefined) {
    end = start
    start = 0
  }
  const out: number[] = []
  for (let i = start; i < end; i += step) out.push(i)
  return out
}

/** 按字段去重（保留首个） */
export function uniqueBy<T>(list: T[], keyFn: ((item: T) => unknown) | keyof T) {
  const seen = new Set<unknown>()
  return list.filter((item) => {
    const k = typeof keyFn === 'function' ? keyFn(item) : item[keyFn]
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** 求和 */
export function sumBy<T>(list: T[], keyFn: ((item: T) => number) | keyof T) {
  return list.reduce((acc, item) => acc + (Number(typeof keyFn === 'function' ? keyFn(item) : item[keyFn]) || 0), 0)
}

/** 按分组键做多字段聚合 */
export function aggregateBy<T>(
  list: T[], keyFn: ((item: T) => string) | keyof T, fields: string[],
) {
  const buckets = groupBy(list, keyFn as never) as Record<string, T[]>
  return Object.keys(buckets).map((key) => {
    const rows = buckets[key]
    const row: Record<string, string | number> = { key, count: rows.length }
    for (const f of fields) {
      row[f] = Number(sumBy(rows, f as never).toFixed(2))
    }
    return row
  })
}

/** 深比较（数组/对象/原始值） */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a == null || b == null) return false
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((v, i) => isEqual(v, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a as object)
    const kb = Object.keys(b as object)
    return ka.length === kb.length
      && ka.every((k) => isEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
  }
  return false
}

/* ============================ 对象 ============================ */

/** 深拷贝（优先 structuredClone，回退 JSON —— JSON 版会丢函数/undefined） */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

/** 深合并：后者覆盖前者，数组按索引递归合并 */
export function deepMerge<T>(target: T, source: unknown): T {
  if (Array.isArray(target) && Array.isArray(source)) {
    return (source as unknown[]).map((v, i) => (
      i < target.length ? deepMerge(target[i], v) : v
    )) as unknown as T
  }
  if (isPlainObject(target) && isPlainObject(source)) {
    const out: Record<string, unknown> = { ...(target as object) }
    for (const k of Object.keys(source as object)) {
      const src = (source as Record<string, unknown>)[k]
      out[k] = k in (target as object)
        ? deepMerge((target as Record<string, unknown>)[k], src)
        : src
    }
    return out as T
  }
  return (source === undefined ? target : source) as T
}

export function isPlainObject(v: unknown): boolean {
  return Object.prototype.toString.call(v) === '[object Object]'
}

/** 取子集 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k]
    return acc
  }, {} as Pick<T, K>)
}

/** 去掉指定键 */
export function omit<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
  const drop = new Set<keyof T>(keys)
  return (Object.keys(obj) as (keyof T)[]).reduce((acc, k) => {
    if (!drop.has(k)) acc[k] = obj[k]
    return acc
  }, {} as Partial<T>)
}

/** 展平一层 */
export function flattenOne<T>(list: (T | T[])[]): T[] {
  return list.reduce<T[]>((acc, v) => acc.concat(Array.isArray(v) ? v : [v]), [])
}

/** 拍平嵌套路径 → { 'a.b': 1 }（表单单据扁平化） */
export function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (isPlainObject(v)) Object.assign(out, flattenObject(v as Record<string, unknown>, path))
    else out[path] = v
  }
  return out
}

/* ============================ 数字与格式化 ============================ */

/** 数值夹取 */
export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

/** 千分位 + 固定小数位 */
export function formatNumber(n: number, digits = 0) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** 百分比格式化：0.1234 → 12.3% */
export function formatPercent(ratio: number, digits = 1) {
  const num = Number(ratio)
  if (!Number.isFinite(num)) return '-'
  return `${(num * 100).toFixed(digits)}%`
}

/** 金额格式化（默认人民币） */
export function formatCurrency(n: number, currency = 'CNY', digits = 2) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  return num.toLocaleString('zh-CN', {
    style: 'currency', currency,
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  })
}

/** 字节数人性化（1024 进制，中文单位） */
export function formatBytes(bytes: number, digits = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : digits)} ${units[i]}`
}

/** 秒数 → 00:05:09 */
export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** 大数字缩写：12345 → 1.2万 */
export function abbrevNumber(n: number, digits = 1) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  const abs = Math.abs(num)
  if (abs >= 1e8) return `${(num / 1e8).toFixed(digits)}亿`
  if (abs >= 1e4) return `${(num / 1e4).toFixed(digits)}万`
  return String(num)
}

/* ============================ 字符串 ============================ */

/** kebab-case / snake_case → camelCase */
export function camelize(str: string) {
  return String(str).replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())
}

/** camelCase → kebab-case */
export function kebabCase(str: string) {
  return String(str)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/** 首字母大写 */
export function capitalize(str: string) {
  const s = String(str)
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

/** 任意字符串 → URL slug（中文转拼音超出纯函数范围，非字母数字转连字符） */
export function slugify(str: string) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** 按显示宽度截断 */
export function truncate(str: string, max = 20, suffix = '…') {
  const s = String(str)
  return s.length <= max ? s : s.slice(0, max) + suffix
}

/** HTML 转义（把用户输入渲染进 innerHTML 前的第一道防线） */
export function escapeHtml(str: unknown) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string))
}

/** 关键字高亮 → HTML 片段（内部已转义，可安全交给 [innerHTML] / v-html） */
export function highlight(text: unknown, keyword = '', cls = 'ng-hl') {
  const safe = escapeHtml(text)
  if (!keyword) return safe
  const k = escapeHtml(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return safe.replace(new RegExp(k, 'gi'), (m) => `<mark class="${cls}">${m}</mark>`)
}

/** 短随机 id */
export function randomId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** UUID v4 */
export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** 脱敏：手机号 / 邮箱 */
export function maskPhone(phone: string) {
  return String(phone).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}
export function maskEmail(email: string) {
  return String(email).replace(/^(.{1,2}).*(@.*)$/, '$1***$2')
}

/* ============================ 时间 ============================ */

/** 日期格式化：支持 YYYY MM DD HH mm ss S 占位符 */
export function formatDate(input: Date | string | number, fmt = 'YYYY-MM-DD HH:mm:ss') {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return String(input)
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
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
export function relativeTime(input: Date | string | number, now = Date.now()) {
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

/** 当天起止时间戳（接受 Date / ISO 字符串 / 时间戳） */
export function dayRange(input: Date | string | number = new Date()) {
  const d = input instanceof Date ? new Date(input) : new Date(input)
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return { start, end: start + 86400000 - 1 }
}

/* ============================ 浏览器能力（SSR 安全） ============================ */

/** 复制文本：优先 navigator.clipboard，回退 execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
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
export function downloadText(filename: string, content: string | Blob, mime = 'text/plain;charset=utf-8') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content
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
export function toCsv(rows: Record<string, unknown>[], headers?: string[]) {
  const cols = headers || Object.keys(rows[0] || {})
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))]
  return `\uFEFF${lines.join('\n')}`
}

/** 查询串互转 */
export function parseQuery(search: string) {
  const out: Record<string, string> = {}
  new URLSearchParams(search || '').forEach((v, k) => { out[k] = v })
  return out
}
export function stringifyQuery(obj: Record<string, unknown>) {
  const sp = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, String(v))
  })
  return sp.toString()
}

export function toNumber(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/* ============================ 数据结构 ============================ */

/** LRU 缓存：容量满时淘汰最久未使用 */
export function createLruCache<K, V>(capacity = 3) {
  const map = new Map<K, V>()
  return {
    get(key: K) {
      if (!map.has(key)) return undefined
      const val = map.get(key) as V
      map.delete(key)
      map.set(key, val)
      return val
    },
    set(key: K, val: V) {
      if (map.has(key)) map.delete(key)
      map.set(key, val)
      if (map.size > capacity) map.delete(map.keys().next().value as K)
      return val
    },
    get size() { return map.size },
    keys() { return [...map.keys()] },
    clear() { map.clear() },
  }
}

/** 极简事件总线（发布订阅） */
export function createEventBus<T extends Record<string, unknown>>() {
  const handlers = new Map<keyof T, Set<(p: never) => void>>()
  const bus = {
    on<K extends keyof T>(type: K, fn: (payload: T[K]) => void) {
      if (!handlers.has(type)) handlers.set(type, new Set())
      handlers.get(type)?.add(fn as (p: never) => void)
      return () => bus.off(type, fn)
    },
    off<K extends keyof T>(type: K, fn: (payload: T[K]) => void) {
      handlers.get(type)?.delete(fn as (p: never) => void)
    },
    emit<K extends keyof T>(type: K, payload: T[K]) {
      handlers.get(type)?.forEach((fn) => (fn as (p: T[K]) => void)(payload))
    },
    clear() { handlers.clear() },
  }
  return bus
}

/** 分页切片 + 元信息（表格/列表页统一口径） */
export function paginate<T>(list: T[], page = 1, pageSize = 10) {
  const total = list.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = clamp(page, 1, pageCount)
  const start = (current - 1) * pageSize
  return {
    rows: list.slice(start, start + pageSize),
    total, page: current, pageSize, pageCount,
    hasPrev: current > 1,
    hasNext: current < pageCount,
    offset: start,
  }
}

/** 轻量表单校验器：规则数组 → { valid, errors, firstError } */export type Rule = (value: unknown, values: Record<string, unknown>) => true | string
export function createValidator(rulesMap: Record<string, Rule[]>) {
  return (values: Record<string, unknown>) => {
    const errors: Record<string, string> = {}
    for (const [field, fieldRules] of Object.entries(rulesMap)) {
      for (const rule of fieldRules) {
        const msg = rule(values[field], values)
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
  required: (label = '该字段') => (v: unknown) => (
    v === undefined || v === null || String(v).trim() === '' ? `${label}必填` : true as const
  ),
  minLen: (n: number, label = '长度') => (v: unknown) => (
    String(v ?? '').length < n ? `${label}至少 ${n} 个字符` : true as const
  ),
  maxLen: (n: number, label = '长度') => (v: unknown) => (
    String(v ?? '').length > n ? `${label}最多 ${n} 个字符` : true as const
  ),
  pattern: (re: RegExp, msg = '格式不正确') => (v: unknown) => (
    re.test(String(v ?? '')) ? true as const : msg
  ),
  range: (min: number, max: number, label = '数值') => (v: unknown) => (
    Number(v) < min || Number(v) > max ? `${label}需在 ${min} ~ ${max} 之间` : true as const
  ),
  sameAs: (other: string, label = '两次输入') => (v: unknown, values: Record<string, unknown>) => (
    v !== values[other] ? `${label}不一致` : true as const
  ),
}

/* ============================ 函数组合 ============================ */

/** 从左到右依次执行：pipe(f, g)(x) === g(f(x)) */
export function pipe<A, B>(f: (a: A) => B): (a: A) => B
export function pipe<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C
export function pipe<A, B, C, D>(f: (a: A) => B, g: (b: B) => C, h: (c: C) => D): (a: A) => D
export function pipe(...fns: ((v: never) => unknown)[]): (input: unknown) => unknown {
  return (input: unknown) => fns.reduce((acc, fn) => fn(acc as never), input)
}

/** 从右到左组合：compose(f, g)(x) === f(g(x)) */
export function compose<A, B>(f: (a: A) => B): (a: A) => B
export function compose<A, B, C>(g: (b: B) => C, f: (a: A) => B): (a: A) => C
export function compose(...fns: ((v: never) => unknown)[]): (input: unknown) => unknown {
  return (input: unknown) => fns.reduceRight((acc, fn) => fn(acc as never), input)
}

/** 恒等函数（占位 / 默认回调） */
export const identity = <T>(v: T): T => v

/** 空函数（默认回调） */
export const noop = (): void => {}

/** 侧效应探针：原样返回入参，顺路执行 fn —— 塞进 pipe 里打点用 */
export function tap<T>(fn: (v: T) => void) {
  return (v: T) => {
    fn(v)
    return v
  }
}

/** 执行 n 次并把每次下标交给 fn：times(3, i => i * 2) → [0, 2, 4] */
export function times<T>(n: number, fn: (i: number) => T = identity as (i: number) => T): T[] {
  return range(Math.max(0, n)).map((i) => fn(i))
}

/** 偏函数：预置左侧若干实参 */
export function partial<A extends unknown[], R>(fn: (...args: A) => R, ...preset: unknown[]) {
  return (...rest: unknown[]) => fn(...(preset.concat(rest) as A))
}

/**
 * 柯里化：把 fn(a, b, c) 变成 fn(a)(b)(c)。
 * 用 fn.length 判断"还差几个参数"，播完才真正调用。
 */
export function curry(fn: (...args: never[]) => unknown) {
  const arity = fn.length
  const build = (collected: unknown[]): ((...rest: unknown[]) => unknown) => (
    (...rest: unknown[]) => {
      const next = collected.concat(rest)
      return next.length >= arity ? fn(...(next as never[])) : build(next)
    }
  )
  return build([])
}

/* ============================ 数组进阶 ============================ */

/** 按断言一分为二 → [命中[], 未命中[]] */
export function partition<T>(list: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const hit: T[] = []
  const miss: T[] = []
  for (const item of list) (predicate(item) ? hit : miss).push(item)
  return [hit, miss]
}

/** 计数分组：countBy([{t:'a'},{t:'b'},{t:'a'}], 't') → { a: 2, b: 1 } */
export function countBy<T, K extends string | number>(
  list: T[], keyFn: ((item: T) => K) | keyof T,
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of list) {
    const k = String(typeof keyFn === 'function' ? keyFn(item) : item[keyFn])
    out[k] = (out[k] || 0) + 1
  }
  return out
}

/** 拉链：zip([1,2],[a,b]) → [[1,a],[2,b]]，长度取最短 */
export function zip<A, B>(a: A[], b: B[]): [A, B][]
export function zip(...lists: unknown[][]): unknown[][] {
  const len = Math.min(...lists.map((l) => l.length))
  return range(len).map((i) => lists.map((l) => l[i]))
}

/** 解拉链：unzip([[1,a],[2,b]]) → [[1,2],[a,b]] */
export function unzip<A, B>(pairs: [A, B][]): [A[], B[]] {
  return [pairs.map((p) => p[0]), pairs.map((p) => p[1])]
}

/** 交集（按 keyFn 或原始值判定） */
export function intersect<T>(a: T[], b: T[], keyFn: (item: T) => unknown = identity as (i: T) => unknown) {
  const keys = new Set(b.map((i) => keyFn(i)))
  return a.filter((item) => keys.has(keyFn(item)))
}

/** 差集：a 有而 b 没有 */
export function difference<T>(a: T[], b: T[], keyFn: (item: T) => unknown = identity as (i: T) => unknown) {
  const keys = new Set(b.map((i) => keyFn(i)))
  return a.filter((item) => !keys.has(keyFn(item)))
}

/** 并集去重（保留首次出现的顺序） */
export function union<T>(...lists: T[][]): T[] {
  return [...new Set(lists.flat())]
}

/** 洗牌：返回新数组（Fisher–Yates） */
export function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 随机取一个 */
export function sample<T>(list: T[]): T | undefined {
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined
}

/** 随机取 n 个不重复 */
export function sampleMany<T>(list: T[], n: number): T[] {
  return shuffle(list).slice(0, Math.max(0, n))
}

/** 按 keyFn 取最小值 / 最大值（返回元素本身） */
export function minBy<T>(list: T[], keyFn: (item: T) => number): T | undefined {
  return list.reduce<T | undefined>((best, item) => (
    best === undefined || keyFn(item) < keyFn(best) ? item : best
  ), undefined)
}
export function maxBy<T>(list: T[], keyFn: (item: T) => number): T | undefined {
  return list.reduce<T | undefined>((best, item) => (
    best === undefined || keyFn(item) > keyFn(best) ? item : best
  ), undefined)
}

/** 取前 n / 去掉前 n（负数表示从尾部算） */
export function take<T>(list: T[], n: number): T[] {
  return n >= 0 ? list.slice(0, n) : list.slice(n)
}
export function drop<T>(list: T[], n: number): T[] {
  return n >= 0 ? list.slice(n) : list.slice(0, n)
}

/** 元素搬家（拖拽排序的落点计算）——返回新数组 */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const out = [...list]
  if (from < 0 || from >= out.length) return out
  const target = clamp(to, 0, out.length - 1)
  const [moved] = out.splice(from, 1)
  out.splice(target, 0, moved)
  return out
}

/** 存在则移除、不存在则追加（多选切换，返回新数组） */
export function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/* ============================ 数值统计 ============================ */

/** 随机整数，默认闭区间 [min, max] */
export function randomInt(min: number, max: number, { inclusive = true } = {}) {
  const lo = Math.ceil(min)
  const hi = Math.floor(max)
  return Math.floor(Math.random() * (hi - lo + (inclusive ? 1 : 0))) + lo
}

/** 按精度四舍五入（用 EPSILON 规避浮点误差） */
export function roundTo(n: number, digits = 2) {
  const num = Number(n)
  if (!Number.isFinite(num)) return 0
  const f = 10 ** digits
  return Math.round((num + Number.EPSILON) * f) / f
}

/** 均值 / 中位数 / 标准差 / 百分位（空数组返回 0） */
export function mean(list: number[]): number {
  return list.length ? sumBy(list, (v) => v) / list.length : 0
}

export function median(list: number[]): number {
  if (!list.length) return 0
  const sorted = sortBy(list, (v) => v)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function stdDev(list: number[]): number {
  if (list.length < 2) return 0
  const avg = mean(list)
  return Math.sqrt(mean(list.map((v) => (v - avg) ** 2)))
}

/** 百分位（p ∈ [0,100]，线性插值） */
export function percentile(list: number[], p: number): number {
  if (!list.length) return 0
  const sorted = sortBy(list, (v) => v)
  const idx = (clamp(p, 0, 100) / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/** 占比：part / total → 百分比数字（不带 % 号） */
export function percentOf(part: number, total: number, digits = 1): number {
  if (!Number(total)) return 0
  return roundTo((Number(part) / Number(total)) * 100, digits)
}

/** 带符号数字：+1,234 / -1,234 —— 涨跌、环比差值直接可用 */
export function formatSigned(n: number, digits = 0) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  const sign = num > 0 ? '+' : num < 0 ? '-' : ''
  return sign + formatNumber(Math.abs(num), digits)
}

/** 线性插值 / 区间映射（进度条、色带、坐标换算） */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1)
}

export function mapRange(value: number, [inMin, inMax]: [number, number], [outMin, outMax]: [number, number]) {
  if (inMax === inMin) return outMin
  const lo = Math.min(inMin, inMax)
  const hi = Math.max(inMin, inMax)
  return outMin + ((clamp(value, lo, hi) - inMin) / (inMax - inMin)) * (outMax - outMin)
}

/** 加权随机 */
export function weightedRandom<T>(items: T[], weightFn: (item: T) => number): T | undefined {
  const total = sumBy(items, (i) => weightFn(i))
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
export function isBlank(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
}

export function isEmail(v: unknown): boolean {
  return /^[\w.!#$%&'*+/=?^`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(String(v ?? ''))
}

export function isPhoneCN(v: unknown): boolean {
  return /^1[3-9]\d{9}$/.test(String(v ?? ''))
}

export function isUrl(v: unknown): boolean {
  try {
    const u = new URL(String(v))
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isNumeric(v: unknown): boolean {
  return v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v))
}

/** 二代身份证 18 位：格式 + ISO 7064:1983.MOD 11-2 校验位 */
export function isIdCardCN(v: unknown): boolean {
  const id = String(v ?? '').toUpperCase()
  if (!/^\d{17}[\dX]$/.test(id)) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = '10X98765432'
  const sum = weights.reduce((acc, w, i) => acc + Number(id[i]) * w, 0)
  return codes[sum % 11] === id[17]
}

/** 口令强度：0~4 分与中文标签 */
export function passwordStrength(pwd: unknown) {
  const s = String(pwd ?? '')
  let score = 0
  if (s.length >= 6) score += 1
  if (s.length >= 10) score += 1
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) score += 1
  if (/\d/.test(s) && /[^\w\s]/.test(s)) score += 1
  const labels = ['极弱', '偏弱', '一般', '较强', '很强']
  const safe = clamp(score, 0, 4)
  return { score: safe, label: labels[safe] }
}

/* ============================ 时间进阶 ============================ */

const toDate = (input: Date | string | number) => (input instanceof Date ? new Date(input) : new Date(input))

/** 加减天数（返回新 Date） */
export function addDays(input: Date | string | number, n: number): Date {
  const d = toDate(input)
  d.setDate(d.getDate() + n)
  return d
}

/** 加减月份：自动处理"1/31 加一月"溢出到 3 月的情况 */
export function addMonths(input: Date | string | number, n: number): Date {
  const d = toDate(input)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
  return d
}

/** 整日差（按本地日界，忽略时分秒） */
export function diffDays(a: Date | string | number, b: Date | string | number): number {
  return Math.round((dayRange(a).start - dayRange(b).start) / 86400000)
}

/** 当天 00:00:00 / 23:59:59.999 */
export function startOfDay(input: Date | string | number = new Date()): Date {
  return new Date(dayRange(input).start)
}
export function endOfDay(input: Date | string | number = new Date()): Date {
  return new Date(dayRange(input).end)
}

/** 本周起始（weekStartsOn: 0=周日, 1=周一） */
export function startOfWeek(input: Date | string | number = new Date(), weekStartsOn = 1): Date {
  const d = startOfDay(input)
  const shift = (d.getDay() - weekStartsOn + 7) % 7
  return addDays(d, -shift)
}

/** 是否同一天（本地时区） */
export function isSameDay(a: Date | string | number, b: Date | string | number): boolean {
  return formatDate(a, 'YYYY-MM-DD') === formatDate(b, 'YYYY-MM-DD')
}

/** 中文星期 */
export function weekdayCN(input: Date | string | number = new Date()): string {
  return `周${'日一二三四五六'[toDate(input).getDay()]}`
}

/** 毫秒 → 人话时长：1 小时 30 分 */
export function humanDuration(ms: number): string {
  const total = Math.max(0, Math.floor(Number(ms) || 0) / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  const parts: string[] = []
  if (d) parts.push(`${d} 天`)
  if (h) parts.push(`${h} 小时`)
  if (m) parts.push(`${m} 分`)
  if (s || !parts.length) parts.push(`${s} 秒`)
  return parts.slice(0, 2).join(' ')
}

/** 毫秒 → 倒计时分段 */
export function countdownParts(ms: number) {
  const total = Math.max(0, Math.floor(Number(ms) || 0))
  return {
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
    total,
  }
}

/** 从生日算周岁（生日未到减 1） */
export function ageFrom(birthday: Date | string | number, now = new Date()): number | null {
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

export interface Rgb { r: number; g: number; b: number }

/** #abc / #aabbcc → { r, g, b }；非法输入返回 null */
export function hexToRgb(hex: unknown): Rgb | null {
  const m = HEX_RE.exec(String(hex ?? '').trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

/** { r, g, b } / [r,g,b] → #rrggbb */
export function rgbToHex(input: Rgb | [number, number, number]): string {
  const { r = 0, g = 0, b = 0 } = Array.isArray(input) ? { r: input[0], g: input[1], b: input[2] } : input
  const to2 = (v: number) => clamp(Math.round(Number(v) || 0), 0, 255).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

/** 线性混色：t=0 取 a，t=1 取 b */
export function mixHex(a: string, b: string, t = 0.5): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  if (!ca || !cb) return rgbToHex(ca ?? cb ?? { r: 0, g: 0, b: 0 })
  const k = clamp(t, 0, 1)
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * k,
    g: ca.g + (cb.g - ca.g) * k,
    b: ca.b + (cb.b - ca.b) * k,
  })
}

/** 提亮 / 加深（等价于向白 / 黑混色） */
export function lighten(hex: string, amount = 0.2): string {
  return mixHex(hex, '#ffffff', amount)
}
export function darken(hex: string, amount = 0.2): string {
  return mixHex(hex, '#000000', amount)
}

/** 转 rgba() 字符串 */
export function hexToRgbaString(hex: string, alpha = 1): string {
  const c = hexToRgb(hex)
  if (!c) return String(hex)
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${clamp(alpha, 0, 1)})`
}

/** 给定底色上可读的文字色（相对亮度阈值法） */
export function readableTextOn(hex: string): string {
  const c = hexToRgb(hex)
  if (!c) return '#111827'
  const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255
  return luminance > 0.62 ? '#111827' : '#ffffff'
}

/* ============================ 数据结构进阶 ============================ */

/** 队列（FIFO） */
export function createQueue<T>() {
  const items: T[] = []
  return {
    enqueue: (v: T) => (items.push(v), v),
    dequeue: (): T | undefined => items.shift(),
    peek: (): T | undefined => items[0],
    get size() { return items.length },
    get isEmpty() { return items.length === 0 },
    toArray: () => [...items],
    clear: () => { items.length = 0 },
  }
}

/** 栈（LIFO） */
export function createStack<T>() {
  const items: T[] = []
  return {
    push: (v: T) => (items.push(v), v),
    pop: (): T | undefined => items.pop(),
    peek: (): T | undefined => items[items.length - 1],
    get size() { return items.length },
    get isEmpty() { return items.length === 0 },
    toArray: () => [...items],
    clear: () => { items.length = 0 },
  }
}

/** 优先队列（二叉堆）：compare(a, b) < 0 表示 a 更优先（默认最小堆） */
export function createPriorityQueue<T>(compare: (a: T, b: T) => number = (a, b) => Number(a) - Number(b)) {
  const heap: T[] = []
  const swap = (i: number, j: number) => { [heap[i], heap[j]] = [heap[j], heap[i]] }
  const up = (i: number) => {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (compare(heap[i], heap[parent]) >= 0) break
      swap(i, parent)
      i = parent
    }
  }
  const down = (i: number) => {
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
    push(v: T) { heap.push(v); up(heap.length - 1); return v },
    pop(): T | undefined {
      if (!heap.length) return undefined
      const top = heap[0]
      const last = heap.pop() as T
      if (heap.length) { heap[0] = last; down(0) }
      return top
    },
    peek: (): T | undefined => heap[0],
    get size() { return heap.length },
    toArray: () => [...heap].sort(compare),
  }
}

/** 令牌桶限流：tryTake() 返回是否放行 */
export function createRateLimiter({ limit = 3, interval = 1000 } = {}) {
  const hits: number[] = []
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

/** 带 TTL 的缓存 */
export function createTtlCache<V>({ ttl = 60000, capacity = 50 } = {}) {
  const map = new Map<string, { value: V; expire: number }>()
  return {
    get(key: string, now = Date.now()): V | undefined {
      const hit = map.get(key)
      if (!hit) return undefined
      if (hit.expire <= now) { map.delete(key); return undefined }
      map.delete(key)
      map.set(key, hit)
      return hit.value
    },
    set(key: string, value: V, now = Date.now()): V {
      map.delete(key)
      map.set(key, { value, expire: now + ttl })
      if (map.size > capacity) map.delete(map.keys().next().value as string)
      return value
    },
    has(key: string, now = Date.now()): boolean { return this.get(key, now) !== undefined },
    get size() { return map.size },
    clear: () => map.clear(),
  }
}

/** 自增计数器 */
export function createCounter(start = 0) {
  let value = start
  let initial = start
  return {
    next: (step = 1) => (value += step),
    get value() { return value },
    reset(to = initial) { initial = to; value = to; return value },
  }
}

/** 自增 ID 生成器 */
export function createIdGenerator(prefix = 'id', start = 1) {
  let n = start
  return {
    next: (pad = 0) => `${prefix}-${String(n++).padStart(pad, '0')}`,
    get count() { return n - start },
    reset(to = start) { n = to },
  }
}

/** 环形缓冲区：写满后覆盖最旧的一条 */
export function createRingBuffer<T>(size = 10) {
  const buf: T[] = []
  return {
    push(v: T) {
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

export interface NavItem { path: string; label: string; group?: string }
export interface NavGroup<T extends NavItem = NavItem> { name: string; items: T[] }

/**
 * 把扁平的菜单项按 group 归组并排序。
 *
 * 三端（React 主应用侧边栏 / Vue 页内导航 / Angular 页内导航）用同一份口径，
 * 避免"分组顺序、组内顺序、未知分组兜底"在各处各写一遍而慢慢跑偏。
 */
export function buildNavGroups<T extends NavItem>(
  items: T[],
  { order = [], fallbackGroup = '其它' }: { order?: string[]; fallbackGroup?: string } = {},
): NavGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const name = item.group || fallbackGroup
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(item)
  }
  const rank = (name: string) => {
    const i = order.indexOf(name)
    return i === -1 ? order.length : i
  }
  return [...map.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([name, groupItems]) => ({ name, items: groupItems }))
}

/**
 * 关键字过滤导航分组：命中 label 或 path 即保留；空组自动剔除。
 * 关键字为空时原样返回（引用不变，便于 computed 缓存）。
 */
export function filterNavGroups<T extends NavItem>(groups: NavGroup<T>[], keyword: unknown): NavGroup<T>[] {
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

/* ============================ 框架无关的状态容器 ============================ */

/**
 * 极简 store：不依赖任何框架，Angular / Vue / React 都能消费（也可在 Node 里单测）
 *
 * 用法：
 *   const store = createStore('demo', { count: 0, lastAction: 'init' })
 *   store.subscribe(() => render(store.getState()))
 *   store.set({ count: 1 })            // 合并式更新，并通知订阅者
 *   store.reset()                      // 回到初始值
 *
 * 说明：Angular 侧真正的推荐答案是「DI 服务 + signal」（见 core/services），
 * 这里保留纯函数实现，是为了演示「状态容器本身与框架解耦」这件事。
 */
export function createStore<S extends Record<string, unknown>>(id: string, initialState: S) {
  let state: S = deepClone(initialState)
  const listeners = new Set<(s: S, patch: Partial<S>) => void>()
  const logs: { at: Date; patch: Partial<S> }[] = []

  return {
    id,
    getState(): Readonly<S> { return state },
    /** 合并式更新 + 通知 */
    set(patch: Partial<S>) {
      state = { ...state, ...deepClone(patch) }
      logs.unshift({ at: new Date(), patch })
      if (logs.length > 20) logs.splice(20)
      listeners.forEach((fn) => fn(state, patch))
      return state
    },
    /** 函数式更新（拿到旧值返回新值） */
    update(fn: (s: Readonly<S>) => Partial<S>) {
      return this.set(fn(state))
    },
    subscribe(fn: (s: S, patch: Partial<S>) => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    reset() {
      state = deepClone(initialState)
      listeners.forEach((fn) => fn(state, {}))
      return state
    },
    get logs() { return logs },
  }
}
