/**
 * 卡片渲染层的公共工具函数
 * ===============================================================
 * 抽成独立模块，让卡片组件文件只导出组件（满足 react-refresh 单文件导出约束）。
 */

import { FIELD_LABELS } from '../config.js'

const MAX_COLUMNS = 8

/** 宽松解析：数组 / JSON 字符串 / { content: [] } / { data: [] } */
export function parseArray(data) {
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      return parseArray(JSON.parse(data))
    } catch {
      return []
    }
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.content)) return data.content
    if (Array.isArray(data.data)) return data.data
  }
  return []
}

/** 归一化表格行：只保留普通对象 */
export function normalizeRows(data) {
  return parseArray(data).filter((r) => r && typeof r === 'object' && !Array.isArray(r))
}

/** 依据数据 key + 白名单，推导列定义（未命中的字段按 key 自动生成列） */
export function buildColumns(rows) {
  const keys = []
  rows.forEach((row) => {
    Object.keys(row).forEach((k) => {
      // 下划线开头视为内部字段（如行唯一键 _key）：只用于渲染，不生成列
      if (k.startsWith('_') || keys.includes(k)) return
      keys.push(k)
    })
  })
  const preferred = Object.keys(FIELD_LABELS).filter((k) => keys.includes(k))
  const rest = keys.filter((k) => !preferred.includes(k))
  return [...preferred, ...rest].slice(0, MAX_COLUMNS).map((key) => ({
    title: FIELD_LABELS[key] || key,
    dataIndex: key,
    key,
    ellipsis: true,
    render: (v) => (v === null || v === undefined || v === '' ? '-' : String(v)),
  }))
}

function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** 行数据 → CSV 文本（带 BOM，Excel 打开不乱码） */
export function toCSV(rows, columns) {
  const head = columns.map((c) => csvCell(c.title)).join(',')
  const body = rows.map((row) => columns.map((c) => csvCell(row[c.dataIndex])).join(',')).join('\n')
  return `\uFEFF${head}\n${body}`
}

/** 触发浏览器下载 */
export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 图表数据归一化成 [{ name, value }] */
export function toSeries(data) {
  let arr = data
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr)
    } catch {
      arr = []
    }
  }
  if (!Array.isArray(arr)) return []

  return arr
    .map((point, i) => {
      if (Array.isArray(point)) return { name: String(point[0] ?? i), value: Number(point[1]) }
      if (point && typeof point === 'object') {
        const name = point.time ?? point.name ?? point.label ?? i
        const key = Object.keys(point).find((k) => typeof point[k] === 'number' && k !== 'id')
        return { name: String(name), value: Number(point[key ?? 'value']) }
      }
      return { name: String(i), value: Number(point) }
    })
    .filter((p) => Number.isFinite(p.value))
}
