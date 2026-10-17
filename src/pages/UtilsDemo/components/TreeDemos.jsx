import { useMemo } from 'react'
import { treeToArray, arrayToTree, findTreeNode } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { SAMPLE_TREE, FLAT_LIST } from './sampleData.js'
import { useI18n } from '../../../i18n/index.js'

/** 树结构：平铺 / 还原 / 深度查找 */
export default function TreeDemos() {
  const { t } = useI18n()
  const tree = useMemo(() => arrayToTree(FLAT_LIST), [])
  return (
    <>
      <DemoCard
        title={t('utilsdemo.treeFlatTitle')}
        desc={t('utilsdemo.treeFlatDesc')}
        usage="treeToArray(tree)"
      >
        <div className="utils-demo__out">
          {treeToArray(SAMPLE_TREE).map((n) => n.name).join(' / ')}（共 {treeToArray(SAMPLE_TREE).length} 个）
        </div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.treeBuildTitle')}
        desc={t('utilsdemo.treeBuildDesc')}
        usage="arrayToTree(list, { id, parentId })"
      >
        <pre className="utils-demo__json">{JSON.stringify(tree, null, 2)}</pre>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.treeFindTitle')}
        desc={t('utilsdemo.treeFindDesc')}
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
