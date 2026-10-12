/**
 * 树结构 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

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
