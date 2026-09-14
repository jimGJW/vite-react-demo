/* =====================================================================
 * Kit · 纯函数工具集
 * ---------------------------------------------------------------------
 * 全部零 React 依赖，可单独 import 做单测。
 *
 * 移植来源：旧移动端项目 / 旧平板端项目
 *   - dataURLtoFile  ← mobile `components/Signature.js` 尾部同名工具
 *   - arrayMove      ← mobile `components/SortCards.js` 内部实现
 *   - 时段校验        ← mobile `components/WorkHoursInput.js` 的三条校验规则
 * ===================================================================== */

/**
 * base64 dataURL → File。
 * 用于把画布/签名结果直接交给上传组件，省掉一次手动的 base64 解码。
 * @param {string} dataURL 形如 `data:image/png;base64,xxxx`
 * @param {string} [filename='file.png']
 * @returns {File}
 */
export function dataURLtoFile(dataURL, filename = 'file.png') {
  const [meta, payload] = String(dataURL).split(',')
  const mime = /:(.*?);/.exec(meta || '')?.[1] || 'image/png'
  const binary = atob(payload || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}

/**
 * 数组内移动元素，返回**新数组**（不修改入参）。
 * 越界或原地移动时返回浅拷贝，保证引用一定变化，便于受控组件判断。
 * @param {any[]} list
 * @param {number} from
 * @param {number} to
 */
export function arrayMove(list, from, to) {
  const next = Array.isArray(list) ? list.slice() : []
  const last = next.length - 1
  if (from === to || from < 0 || to < 0 || from > last || to > last) return next
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

/** 把数值夹在 [min, max] 区间内。 */
export function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

/**
 * 归一化为时间戳。接受 Date / number / 时间字符串。
 * @returns {number} 非法输入返回 NaN
 */
export function toTime(input) {
  if (input == null) return NaN
  if (input instanceof Date) return input.getTime()
  if (typeof input === 'number') return input
  const parsed = new Date(input).getTime()
  return Number.isNaN(parsed) ? NaN : parsed
}

/**
 * 毫秒 → 天/时/分/秒拆分。
 * @param {number} ms
 */
export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(Number(ms) || 0))
  const DAY = 86400000
  const HOUR = 3600000
  const MINUTE = 60000
  return {
    total,
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MINUTE),
    seconds: Math.floor((total % MINUTE) / 1000),
  }
}

const pad2 = (n) => String(n).padStart(2, '0')

/**
 * 按 pattern 格式化毫秒。支持的占位符：DD / HH / mm / ss。
 * 天数会被计入 HH（即 25 小时显示为 25），需要独立天数字段时自行用 splitDuration。
 * @param {number} ms
 * @param {string} [pattern='HH:mm:ss']
 * @example formatDuration(93000, 'HH:mm:ss') // '00:01:33'
 */
export function formatDuration(ms, pattern = 'HH:mm:ss') {
  const { total, days, hours, minutes, seconds } = splitDuration(ms)
  if (!Number.isFinite(Number(ms))) return pattern
  return pattern
    .replace(/DD/g, pad2(days))
    .replace(/HH/g, pad2(days * 24 + hours))
    .replace(/mm/g, pad2(minutes))
    .replace(/ss/g, pad2(seconds))
    .replace(/SSS/g, pad2(total % 60000))
}

/**
 * `HH:mm` → 当日分钟数。非法输入返回 NaN。
 * @param {string} value
 */
export function timeToMinutes(value) {
  const matched = /^(\d{1,2}):(\d{1,2})$/.exec(String(value || '').trim())
  if (!matched) return NaN
  const h = Number(matched[1])
  const m = Number(matched[2])
  if (h > 23 || m > 59) return NaN
  return h * 60 + m
}

/** 分钟数 → `HH:mm`。 */
export function minutesToTime(minutes) {
  const safe = clamp(Math.round(Number(minutes) || 0), 0, 24 * 60)
  return `${pad2(Math.floor(safe / 60))}:${pad2(safe % 60)}`
}

/**
 * 校验一组时段，返回错误清单与合计工时。
 * 规则（沿用 WorkHoursInput 的三条，并补一条完整性校验）：
 *   1. 分段的起止都必须填写
 *   2. 结束时间必须晚于开始时间
 *   3. 单段时长不得超过 maxHours
 *   4. 任意两段不得时间重叠
 *
 * @param {{start?:string, end?:string}[]} ranges
 * @param {{maxHours?:number}} [options]
 * @returns {{ok:boolean, errors:string[], totalMinutes:number}}
 */
export function validateTimeRanges(ranges, { maxHours = 24 } = {}) {
  const list = Array.isArray(ranges) ? ranges : []
  const errors = []
  let totalMinutes = 0
  const spans = []

  list.forEach((range, index) => {
    const label = `第 ${index + 1} 段`
    const start = timeToMinutes(range?.start)
    const end = timeToMinutes(range?.end)
    if (Number.isNaN(start) || Number.isNaN(end)) {
      errors.push(`${label}的起止时间未填写完整`)
      return
    }
    if (end <= start) {
      errors.push(`${label}的结束时间需晚于开始时间`)
      return
    }
    const duration = end - start
    if (duration > maxHours * 60) {
      errors.push(`${label}时长超过 ${maxHours} 小时`)
      return
    }
    totalMinutes += duration
    spans.push({ start, end, index })
  })

  spans.forEach((a, i) => {
    spans.slice(i + 1).forEach((b) => {
      if (a.start < b.end && a.end > b.start) {
        errors.push(`第 ${a.index + 1} 段与第 ${b.index + 1} 段时间重叠`)
      }
    })
  })

  return { ok: errors.length === 0, errors, totalMinutes }
}

/** 生成一个短随机 id（列表 key / 新增行用）。 */
export function uid(prefix = 'k') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** 千分位数字。空值（null / undefined / ''）返回空字符串而不是 0。 */
export function formatNumber(value, precision) {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: precision ?? 0,
    maximumFractionDigits: precision ?? 0,
  })
}
