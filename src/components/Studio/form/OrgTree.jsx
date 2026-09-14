import { useMemo, useState } from 'react'
import { Button, Input, Space, Empty } from 'antd'
import { DownOutlined, RightOutlined, TeamOutlined } from '@ant-design/icons'

/**
 * OrgTree · 层级组织树
 * =====================================================================
 * 移植自存量后台项目里的「组织 / 资源层级选择器」。原实现把「任意深度的树」
 * 渲染成一个可逐级展开、可单选、可检索的面板——在配置下发、权限归属、资产归
 * 类等场景都很常用。这里去掉具体业务语义，只保留一棵可通用的树。
 *
 * 数据形态（递归）：
 *   [{ id, name, children?: [...] }]
 *
 * 用法：
 *   <OrgTree data={tree} selectedId={id} onSelect={fn} />
 */

function collectIds(nodes, acc = []) {
  nodes.forEach((n) => {
    acc.push(n.id)
    if (n.children?.length) collectIds(n.children, acc)
  })
  return acc
}

function TreeNode({ node, depth, selectedId, expanded, onToggle, onSelect }) {
  const hasChild = node.children?.length > 0
  const open = expanded.has(node.id)
  return (
    <div className="st-orgtree__node">
      <div
        className={`st-orgtree__row ${selectedId === node.id ? 'is-selected' : ''}`}
        style={{ paddingLeft: depth * 18 + 8 }}
        onClick={() => onSelect?.(node)}
      >
        {hasChild ? (
          <span
            className="st-orgtree__caret"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
          >
            {open ? <DownOutlined /> : <RightOutlined />}
          </span>
        ) : (
          <span className="st-orgtree__leaf">
            <TeamOutlined />
          </span>
        )}
        <span className="st-orgtree__name">{node.name}</span>
        {node.tag && <span className="st-orgtree__tag">{node.tag}</span>}
      </div>
      {hasChild && open && (
        <div className="st-orgtree__children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgTree({ data = [], selectedId, defaultExpanded = true, onSelect, className = '' }) {
  const allIds = useMemo(() => collectIds(data), [data])
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded ? allIds : []))
  const [keyword, setKeyword] = useState('')

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    if (!keyword.trim()) return data
    const kw = keyword.toLowerCase()
    const walk = (nodes) =>
      nodes
        .map((n) => {
          const hit = (n.name || '').toLowerCase().includes(kw)
          const kids = n.children ? walk(n.children) : []
          if (hit || kids.length) return { ...n, children: kids.length ? kids : n.children }
          return null
        })
        .filter(Boolean)
    return walk(data)
  }, [data, keyword])

  return (
    <div className={`st-orgtree ${className}`}>
      <div className="st-orgtree__toolbar">
        <Input.Search
          size="small"
          placeholder="搜索节点"
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Space size={4}>
          <Button size="small" onClick={() => setExpanded(new Set(allIds))}>展开</Button>
          <Button size="small" onClick={() => setExpanded(new Set())}>收起</Button>
        </Space>
      </div>
      <div className="st-orgtree__body">
        {filtered.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配节点" />
        ) : (
          filtered.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={toggle}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
