import { useMemo } from 'react'
import { treeToArray, arrayToTree, findTreeNode } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { SAMPLE_TREE, FLAT_LIST } from './sampleData.js'

/** 树结构：平铺 / 还原 / 深度查找 */
export default function TreeDemos() {
  const tree = useMemo(() => arrayToTree(FLAT_LIST), [])
  return (
    <>
      <DemoCard
        title="treeToArray · 平铺"
        desc="树结构拍平为一维数组，便于搜索 / 统计。"
        usage="treeToArray(tree)"
      >
        <div className="utils-demo__out">
          {treeToArray(SAMPLE_TREE).map((n) => n.name).join(' / ')}（共 {treeToArray(SAMPLE_TREE).length} 个）
        </div>
      </DemoCard>

      <DemoCard
        title="arrayToTree · 建树"
        desc="按 id / parentId 还原层级，常用于接口平铺数据。"
        usage="arrayToTree(list, { id, parentId })"
      >
        <pre className="utils-demo__json">{JSON.stringify(tree, null, 2)}</pre>
      </DemoCard>

      <DemoCard
        title="findTreeNode · 深度查找"
        desc="深度优先按 id 查节点，未找到返回 null。"
        usage="findTreeNode(tree, 'n3')"
      >
        <div className="utils-demo__out">
          n3 → {JSON.stringify(findTreeNode(SAMPLE_TREE, 'n3'))}
        </div>
        <div className="utils-demo__out">不存在 → {String(findTreeNode(SAMPLE_TREE, 'zzz'))}</div>
      </DemoCard>
    </>
  )
}
