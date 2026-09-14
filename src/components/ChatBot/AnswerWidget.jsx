/**
 * AnswerWidget —— 回答渲染分发器
 * ===============================================================
 * 按 message.contentType 选择卡片组件，是复用价值最高的一块：
 * 把「后端返回什么类型」与「前端渲染成什么」之间的映射收拢在一处。
 *
 *   contentType       组件           message 期望格式
 *   ─────────────────────────────────────────────────────────────
 *   空 / 其它          Markdown       Markdown 文本
 *   list               ListCard       [{ id, name, type, location, note }, ...]
 *   table              DataTable      [{ time, temperature, humidity, ... }, ...]
 *   taskTable          TaskTable      [{ time, id, type, status, report }, ...]
 *   echart             LineChart      [[时间, 值], ...]
 *
 * 性能：流式生成时正文每几毫秒变一次，而 Markdown 解析是这里最贵的一步。
 * 用 useDeferredValue 把「解析」降到低优先级 —— 输入框与滚动保持跟手，
 * 中间的半截文本被 React 自动跳过，只在空闲时解析最新值。
 */

import { memo, useDeferredValue } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ListCard from './cards/ListCard.jsx'
import DataTable from './cards/DataTable.jsx'
import TaskTable from './cards/TaskTable.jsx'
import LineChart from './cards/LineChart.jsx'
import { CONTENT_TYPE } from './config.js'

/* 插件数组是常量，提到模块级避免每次渲染都新建数组（会让 react-markdown 内部缓存失效） */
const REMARK_PLUGINS = [remarkGfm]

const MarkdownAnswer = memo(function MarkdownAnswer({ text }) {
  const deferred = useDeferredValue(text)
  return (
    <div className="cb-md">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{String(deferred ?? '')}</ReactMarkdown>
      <em className="cb-md__tips">本答案由 AI 生成，仅供参考。</em>
    </div>
  )
})

const AnswerWidget = memo(function AnswerWidget({
  message,
  contentType,
  title,
  taskIds,
  sessionDetailId,
  onAsk,
  shareState,
  api,
}) {
  switch (contentType) {
    case CONTENT_TYPE.LIST:
      return <ListCard data={message} onAsk={onAsk} sessionDetailId={sessionDetailId} />

    case CONTENT_TYPE.TABLE:
      return <DataTable data={message} title={title} shareState={shareState} />

    case CONTENT_TYPE.TASK_TABLE:
      return (
        <TaskTable
          data={message}
          title={title}
          taskIds={taskIds}
          shareState={shareState}
          api={api}
        />
      )

    case CONTENT_TYPE.CHART:
      return <LineChart data={message} title={title} />

    default:
      return <MarkdownAnswer text={message} />
  }
})

export default AnswerWidget
