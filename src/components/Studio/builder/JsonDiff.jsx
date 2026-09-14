import { useMemo, useState } from 'react'
import { Tag, Segmented } from 'antd'

/**
 * JsonDiff · 结构化对象对比
 * =====================================================================
 * 移植自存量审计/配置对比项目里的 diff 视图。与「文本 diff」不同，它做的是
 * **结构 diff**：把两个对象展平成「路径 → 值」的映射后逐键比较，因此能准确标出
 * 新增 / 删除 / 修改 / 未变四类变化，而不是把整段 JSON 当成字符串重排。
 *
 * 价值点：
 *   - 路径前缀（a.b[0].c）让变化定位一眼可见；
 *   - 数组按索引对齐比较，而不是 naive 去重；
 *   - 提供「全部 / 仅变化」两种视图，千人千面的审计场景下很实用。
 *
 * 用法：
 *   <JsonDiff left={before} right={after} />
 */

function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v // object | string | number | boolean
}

/** 把任意 JSON 展平成 { 'a.b[0]': value } */
function flatten(obj, prefix = '', out = {}) {
  const t = typeOf(obj)
  if (t === 'object') {
    if (Object.keys(obj).length === 0) { out[prefix || '∅'] = obj; return out }
    Object.keys(obj).forEach((k) => {
      const key = /^[a-zA-Z_$][\w$]*$/.test(k) ? k : `["${k}"]`
      flatten(obj[k], prefix ? `${prefix}.${key}` : key, out)
    })
  } else if (t === 'array') {
    if (obj.length === 0) { out[prefix || '[]'] = obj; return out }
    obj.forEach((item, i) => flatten(item, `${prefix}[${i}]`, out))
  } else {
    out[prefix] = obj
  }
  return out
}

/** 比较两棵展平树，产出变化行 */
function diff(left, right) {
  const a = flatten(left)
  const b = flatten(right)
  const paths = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort()
  const rows = []
  paths.forEach((p) => {
    const inA = p in a
    const inB = p in b
    if (inA && !inB) rows.push({ path: p, type: 'removed', left: a[p], right: undefined })
    else if (!inA && inB) rows.push({ path: p, type: 'added', left: undefined, right: b[p] })
    else if (JSON.stringify(a[p]) !== JSON.stringify(b[p]))
      rows.push({ path: p, type: 'changed', left: a[p], right: b[p] })
    else rows.push({ path: p, type: 'same', left: a[p], right: b[p] })
  })
  return rows
}

const TYPE_META = {
  added: { color: 'success', label: '新增' },
  removed: { color: 'error', label: '删除' },
  changed: { color: 'warning', label: '修改' },
  same: { color: 'default', label: '未变' },
}

function fmt(v) {
  if (v === undefined) return '—'
  if (v === null) return 'null'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export default function JsonDiff({ left, right, className = '' }) {
  const rows = useMemo(() => diff(left, right), [left, right])
  const [mode, setMode] = useState('changed')

  const shown = mode === 'all' ? rows : rows.filter((r) => r.type !== 'same')
  const counts = rows.reduce(
    (acc, r) => ((acc[r.type] = (acc[r.type] || 0) + 1), acc),
    {},
  )

  return (
    <div className={`st-jsondiff ${className}`}>
      <div className="st-jsondiff__bar">
        <Segmented
          size="small"
          value={mode}
          onChange={setMode}
          options={[
            { label: `变化 (${counts.added || 0}+${counts.removed || 0}+${counts.changed || 0})`, value: 'changed' },
            { label: '全部', value: 'all' },
          ]}
        />
        <div className="st-jsondiff__legend">
          {['added', 'removed', 'changed'].map((t) => (
            <Tag key={t} color={TYPE_META[t].color}>{TYPE_META[t].label} {counts[t] || 0}</Tag>
          ))}
        </div>
      </div>

      <div className="st-jsondiff__list">
        {shown.length === 0 && <div className="st-jsondiff__empty">两份数据完全一致</div>}
        {shown.map((r) => (
          <div key={r.path} className={`st-jsondiff__row is-${r.type}`}>
            <code className="st-jsondiff__path">{r.path}</code>
            <Tag color={TYPE_META[r.type].color} className="st-jsondiff__tag">
              {TYPE_META[r.type].label}
            </Tag>
            <span className="st-jsondiff__val st-jsondiff__val--left">{fmt(r.left)}</span>
            <span className="st-jsondiff__arrow">→</span>
            <span className="st-jsondiff__val st-jsondiff__val--right">{fmt(r.right)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
