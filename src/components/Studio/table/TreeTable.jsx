import { useMemo, useState } from 'react'
import { Input, Empty } from 'antd'

/**
 * 树形表格：可逐级展开 / 收起，支持按名称检索。
 * 检索时自动「保留祖先链」——命中子孙的父节点不会被过滤掉，且自动展开。
 * 来自某中台项目的树表格 + 祖先保留搜索思路，去业务化重写。
 */
export default function TreeTable({ treeData = [], searchable = true, valueTitle = '数值' }) {
  const [keyword, setKeyword] = useState('')
  const [collapsed, setCollapsed] = useState(() => new Set())

  const matched = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return null
    const hitIds = new Set()
    const walk = (nodes, ancestors) => {
      let any = false
      for (const n of nodes) {
        const selfHit = n.name.toLowerCase().includes(kw)
        const childHit = walk(n.children || [], [...ancestors, n])
        if (selfHit || childHit) {
          hitIds.add(n.id)
          any = true
        }
      }
      return any
    }
    walk(treeData, [])
    return hitIds
  }, [keyword, treeData])

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const renderRows = (nodes, depth) =>
    nodes.flatMap((n) => {
      if (matched && !matched.has(n.id)) return []
      const isCollapsed = matched ? false : collapsed.has(n.id)
      const hasChildren = n.children && n.children.length
      const row = (
        <div key={n.id} className="st-treetable__row" style={{ paddingLeft: depth * 18 + 8 }}>
          <span
            className={`st-treetable__caret ${hasChildren ? '' : 'is-leaf'}`}
            onClick={() => hasChildren && toggle(n.id)}
          >
            {hasChildren ? (isCollapsed ? '▸' : '▾') : '·'}
          </span>
          <span className="st-treetable__name">{n.name}</span>
          {n.value !== undefined && <span className="st-treetable__value">{n.value}</span>}
        </div>
      )
      const childrenRows =
        hasChildren && !isCollapsed ? renderRows(n.children, depth + 1) : []
      return [row, ...childrenRows]
    })

  const rows = renderRows(treeData, 0)

  return (
    <div className="st-treetable">
      {searchable && (
        <Input.Search
          placeholder="检索名称（自动保留父级）"
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ marginBottom: 8 }}
        />
      )}
      <div className="st-treetable__head">
        <span className="st-treetable__name">名称</span>
        <span className="st-treetable__value">{valueTitle}</span>
      </div>
      <div className="st-treetable__body">
        {rows.length ? rows : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配" />}
      </div>
    </div>
  )
}
