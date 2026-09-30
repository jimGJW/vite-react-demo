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

/** 当天起止时间戳 */
export function dayRange(input: Date | number = new Date()) {
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
