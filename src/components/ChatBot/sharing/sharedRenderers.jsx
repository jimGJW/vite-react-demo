/**
 * 分享页的「富卡片」渲染器预设
 * ===============================================================
 * 原方案的 SharedConversationView 是零 UI 库依赖的：卡片一律由调用方通过
 * `renderers` 注入，未注入就退化成纯文本 —— 好处是分享页不会因为缺组件而崩。
 *
 * 本项目已经有现成的四类卡片（ListCard / DataTable / TaskTable / LineChart），
 * 所以额外提供这个预设：一行拿到与主聊天页一致的卡片渲染，且全部为**只读态**
 * （shareState = true，隐藏导出 / 勾选 / 图表切换等交互）。
 *
 * 想彻底不要卡片依赖时，给 `SharedConversationView` 传 `renderers={{}}` 即可。
 */

import ListCard from '../cards/ListCard.jsx'
import DataTable from '../cards/DataTable.jsx'
import TaskTable from '../cards/TaskTable.jsx'
import LineChart from '../cards/LineChart.jsx'
import { CONTENT_TYPE } from '../config.js'

/**
 * @param {object} [options]
 * @param {object} [options.api] 请求客户端，任务表卡片导出用（只读态下用不到）
 * @param {(id:string)=>void} [options.onAsk] 列表卡片点击某项时回调（可选）
 * @returns {Record<string, (props:{data:any,title?:string,taskIds?:string[]})=>JSX.Element>}
 */
export function createSharedRenderers({ api, onAsk } = {}) {
  return {
    [CONTENT_TYPE.LIST]: ({ data }) => <ListCard data={data} onAsk={onAsk} />,

    [CONTENT_TYPE.TABLE]: ({ data, title }) => (
      <DataTable data={data} title={title} shareState />
    ),

    [CONTENT_TYPE.TASK_TABLE]: ({ data, title, taskIds }) => (
      <TaskTable data={data} title={title} taskIds={taskIds} shareState api={api} />
    ),

    [CONTENT_TYPE.CHART]: ({ data, title }) => <LineChart data={data} title={title} />,
  }
}

export default createSharedRenderers
