/**
 * 分享页的只读对话渲染层
 * ===============================================================
 *   ConversationList  —— 整段分享：轮次列表 + 结束语
 *   ConversationItem  —— 一轮：`0000` 渲染成「全新的开始」分隔条
 *   MessageBubble     —— 一条助手消息：按 contentType 派发给 renderers
 *
 * 设计取舍（对应原实现的坑）：
 *   · 卡片一律走 `renderers` 注入，未注册的 contentType 退化成 Markdown，
 *     分享页不会因为缺某个卡片组件而白屏；
 *   · `message` 为空时**渲染为空**，而不是留一个永远转圈的三点动画
 *     —— 分享页没有流，空正文就是空正文；
 *   · 全链路只读：不引入输入框、赞踩、重新生成。
 *
 * 性能：与主聊天页一致，全部 memo；renderers 由调用方 useMemo 固定引用。
 */

import { memo, useDeferredValue } from 'react'
import { Avatar, Divider, Empty } from 'antd'
import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { isNewChatItem } from './shareProtocol.js'

/* 插件数组是常量，提到模块级避免每次渲染新建数组、让 markdown 内部缓存失效 */
const REMARK_PLUGINS = [remarkGfm]

const DEFAULT_ANSWER_TIPS = '本答案由 AI 生成，仅供参考。'

/* ---------------------------------------------------------------- 正文 */

const MarkdownBody = memo(function MarkdownBody({ text, answerTips }) {
  const deferred = useDeferredValue(text)
  return (
    <div className="qa-md">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{String(deferred ?? '')}</ReactMarkdown>
      {answerTips ? <em className="qa-md__tips">{answerTips}</em> : null}
    </div>
  )
})

/* ---------------------------------------------------------------- 单条消息 */

/**
 * 一条助手消息。派发顺序：`renderers[contentType]` → `renderContent` → Markdown。
 * 注意 renderer 必须当作组件渲染（`<Renderer />`）而不是直接调用，
 * 否则卡片里的 hooks 会被算进当前组件的 hook 列表。
 */
export const MessageBubble = memo(function MessageBubble({
  message,
  contentType,
  title,
  taskIds,
  renderers,
  renderContent,
  answerTips,
}) {
  const Renderer = renderers && contentType ? renderers[contentType] : null

  if (typeof Renderer === 'function') {
    return <Renderer data={message} title={title} taskIds={taskIds} contentType={contentType} />
  }

  if (typeof renderContent === 'function') {
    return renderContent({ text: message, contentType, title })
  }

  return <MarkdownBody text={message} answerTips={answerTips} />
})

const AssistantMessage = memo(function AssistantMessage({
  data,
  renderers,
  renderContent,
  answerTips,
}) {
  const empty = data.message === null || data.message === undefined || data.message === ''
  /* 空正文且没有卡片类型 → 什么都不渲染（避免永久 loading 动画） */
  if (empty && !data.contentType) return null

  return (
    <div className="qa-msg qa-msg--left">
      <Avatar className="qa-avatar qa-avatar--ai" size={28} icon={<RobotOutlined />} />
      <div className="qa-bubble">
        <MessageBubble
          message={data.message}
          contentType={data.contentType}
          title={data.title}
          taskIds={data.taskIds}
          renderers={renderers}
          renderContent={renderContent}
          answerTips={answerTips}
        />
      </div>
    </div>
  )
})

/* ---------------------------------------------------------------- 一轮对话 */

export const ConversationItem = memo(function ConversationItem({
  item,
  renderers,
  renderContent,
  answerTips,
  dividerText = '全新的开始',
}) {
  if (isNewChatItem(item)) {
    return (
      <Divider plain className="qa-divider">
        {dividerText}
      </Divider>
    )
  }

  return (
    <div className="qa-round">
      {item.conversation.map((msg, i) =>
        msg.type === 0 ? (
          <div className="qa-msg qa-msg--right" key={`u-${i}`}>
            <div className="qa-bubble qa-bubble--user">{msg.message}</div>
            <Avatar className="qa-avatar qa-avatar--user" size={28} icon={<UserOutlined />} />
          </div>
        ) : (
          <AssistantMessage
            key={`a-${i}`}
            data={msg}
            renderers={renderers}
            renderContent={renderContent}
            answerTips={answerTips}
          />
        ),
      )}
    </div>
  )
})

/* ---------------------------------------------------------------- 整段分享 */

const ConversationList = memo(function ConversationList({
  data,
  renderers,
  renderContent,
  emptyText = '暂无可展示的对话',
  endText = '以上为分享内容',
  dividerText,
  answerTips = DEFAULT_ANSWER_TIPS,
  className = '',
}) {
  const items = Array.isArray(data) ? data : []

  if (!items.length) {
    return (
      <div className="qa-empty">
        <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  return (
    <div className={`qa-list ${className}`}>
      {items.map((item, i) => (
        <ConversationItem
          key={item.sessionDetailId || `round-${i}`}
          item={item}
          renderers={renderers}
          renderContent={renderContent}
          answerTips={answerTips}
          dividerText={dividerText}
        />
      ))}
      {endText ? <div className="qa-list__end">{endText}</div> : null}
    </div>
  )
})

export default ConversationList
