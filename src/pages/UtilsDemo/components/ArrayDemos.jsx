import { groupBy, unique, sortBy, arrayToObject, flatten, deepMerge, pick, omit } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { SAMPLE_ROWS } from './sampleData.js'

/** 数组与对象：分组 / 去重 / 排序 / 建索引 / 扁平化 / 合并 / 裁剪 */
export default function ArrayDemos() {
  return (
    <>
      <DemoCard
        title="groupBy / unique / sortBy"
        desc="按字段分组、去重、排序；均返回新数组，不改原数据。"
        usage="groupBy(rows, 'group')  sortBy(rows, 'value', 'desc')"
      >
        <div className="utils-demo__out">分组：{Object.keys(groupBy(SAMPLE_ROWS, 'group')).join(' / ')}</div>
        <div className="utils-demo__out">
          降序：{sortBy(SAMPLE_ROWS, 'value', 'desc').map((r) => r.value).join(' > ')}
        </div>
        <div className="utils-demo__out">
          去重分组数：{unique(SAMPLE_ROWS.map((r) => r.group)).length}
        </div>
      </DemoCard>

      <DemoCard
        title="arrayToObject · 建索引"
        desc="数组按 key 转成对象，O(1) 查找。"
        usage="arrayToObject(list, 'id')"
      >
        <pre className="utils-demo__json">
          {JSON.stringify(arrayToObject(SAMPLE_ROWS.slice(0, 2), 'name'), null, 2)}
        </pre>
      </DemoCard>

      <DemoCard
        title="flatten · 扁平化"
        desc="按深度展开嵌套数组，Infinity 全展开。"
        usage="flatten([1,[2,[3,[4]]]], 2)"
      >
        <div className="utils-demo__out">{JSON.stringify(flatten([1, [2, [3, [4]]]], 2))}</div>
        <div className="utils-demo__out">{JSON.stringify(flatten([1, [2, [3, [4]]]], Infinity))}</div>
      </DemoCard>

      <DemoCard
        title="deepMerge / pick / omit"
        desc="递归合并与字段裁剪，均不修改入参。"
        usage="deepMerge(a, b)   pick(obj, ['x'])   omit(obj, ['y'])"
      >
        <div className="utils-demo__out">
          merge: {JSON.stringify(deepMerge({ a: 1, b: { p: 1 } }, { b: { q: 2 }, c: 3 }))}
        </div>
        <div className="utils-demo__out">pick: {JSON.stringify(pick(SAMPLE_ROWS[0], ['name', 'status']))}</div>
        <div className="utils-demo__out">omit: {JSON.stringify(omit(SAMPLE_ROWS[0], ['value', 'group']))}</div>
      </DemoCard>
    </>
  )
}
