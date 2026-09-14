/**
 * 消息气泡层
 * ===============================================================
 * Conversation  —— 渲染「一轮」：1 条提问（右侧）+ 1 条回答（左侧）
 * LeftMessage   —— 助手气泡：AnswerWidget + 工具栏（复制/重生成/赞踩）
 * PendingBubble —— 等待中的占位气泡（单独消费高频的 loading/statusLine）
 * RightMessage  —— 用户气泡
 *
 * 性能约定：本文件所有组件都是 React.memo 的。
 * ChatBot 在流式生成时每帧都会重渲染（它持有 rounds 状态），
 * 靠 memo + 稳定的 props 引用，把重渲染收敛到「正在生成的那一条气泡」。
 * 因此调用方必须保证 onReload 等回调引用稳定（见 ChatBot.jsx 的 useCallback）。
 */

import { memo, useState } from 'react'
import { Avatar, Button, Divider, Tooltip, message as antdMessage } from 'antd'
import {
  CheckOutlined,
  CopyOutlined,
  DislikeFilled,
  DislikeOutlined,
  LikeFilled,
  LikeOutlined,
  ReloadOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useChatContext, useChatStatus } from './ChatContext.jsx'
import AnswerWidget from './AnswerWidget.jsx'
import { NEW_CHAT_MARK } from './chatStream.js'

async function copyText(text) {
  const value = String(text ?? '')
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    /* 降级 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ 用户气泡 */

export const RightMessage = memo(function RightMessage({ message }) {
  const { head } = useChatContext()
  return (
    <div className="cb-msg cb-msg--right">
      <div className="cb-bubble cb-bubble--user">{message}</div>
      <Avatar className="cb-avatar cb-avatar--user" size={30} icon={<UserOutlined />}>
        {head}
      </Avatar>
    </div>
  )
})

/* ------------------------------------------------------------ 等待中的占位气泡 */

/**
 * 只有「正在等待回答」的那一条气泡需要实时状态。
 * 把它单独拆出来消费 ChatStatusContext，流式期间状态条每帧更新时，
 * 只有这个组件重渲染，其余历史气泡完全不受影响。
 */
export const PendingBubble = memo(function PendingBubble() {
  const { loading, statusLine } = useChatStatus()
  if (!loading) return null

  return (
    <div className="cb-status" role="status" aria-live="polite">
      {statusLine ? (
        <>
          <span className="cb-status__spinner" aria-hidden="true" />
          <span>{statusLine}</span>
        </>
      ) : (
        <span className="cb-dots" aria-label="正在生成">
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  )
})

/* ------------------------------------------------------------------ 助手气泡 */

export const LeftMessage = memo(function LeftMessage({ data, isLast, roundId, onReload }) {
  const { toolBox = true, updateMessageState, shareState, onAsk, api } = useChatContext()
  const [copied, setCopied] = useState(false)

  const streamId = data.sessionDetailId || roundId
  const state = data.messageState || ''

  const doCopy = async () => {
    const ok = await copyText(data.message)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } else {
      antdMessage.warning('复制失败，请手动选择文本复制')
    }
  }

  const doFeedback = (next) => {
    // 再点一次取消
    updateMessageState?.(streamId, state === next ? '' : next)
  }

  return (
    <div className="cb-msg cb-msg--left">
      <Avatar className="cb-avatar cb-avatar--ai" size={30} icon={<RobotOutlined />} />
      <div className="cb-msg__body">
        {data.message ? (
          <>
            <div className="cb-bubble">
              <AnswerWidget
                message={data.message}
                contentType={data.contentType}
                title={data.title}
                taskIds={data.taskIds}
                sessionDetailId={streamId}
                onAsk={onAsk}
                shareState={shareState}
                api={api}
              />
            </div>

            {toolBox && !shareState && (
              <div className="cb-tools">
                <Tooltip title={copied ? '已复制' : '复制'}>
                  <Button
                    size="small"
                    type="text"
                    aria-label="复制回答"
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={doCopy}
                  />
                </Tooltip>

                {isLast && onReload && (
                  <Tooltip title="重新生成">
                    <Button
                      size="small"
                      type="text"
                      aria-label="重新生成"
                      icon={<ReloadOutlined />}
                      onClick={onReload}
                    />
                  </Tooltip>
                )}

                <Tooltip title="有帮助">
                  <Button
                    size="small"
                    type="text"
                    aria-label="有帮助"
                    aria-pressed={state === '1'}
                    className={state === '1' ? 'is-active' : ''}
                    icon={state === '1' ? <LikeFilled /> : <LikeOutlined />}
                    onClick={() => doFeedback('1')}
                  />
                </Tooltip>

                <Tooltip title="没帮助">
                  <Button
                    size="small"
                    type="text"
                    aria-label="没帮助"
                    aria-pressed={state === '0'}
                    className={state === '0' ? 'is-active cb-tools__down' : ''}
                    icon={state === '0' ? <DislikeFilled /> : <DislikeOutlined />}
                    onClick={() => doFeedback('0')}
                  />
                </Tooltip>
              </div>
            )}
          </>
        ) : (
          <PendingBubble />
        )}
      </div>
    </div>
  )
})

/* ------------------------------------------------------------------ 一轮对话 */

export const Conversation = memo(function Conversation({ data, isLast, onReload }) {
  if (data.sessionDetailId === NEW_CHAT_MARK && !data.conversation.length) {
    return (
      <Divider plain className="cb-divider">
        全新的开始
      </Divider>
    )
  }

  return (
    <div className="cb-round">
      {data.conversation.map((msg, i) =>
        msg.type === 0 ? (
          <RightMessage key={`u-${i}`} message={msg.message} />
        ) : (
          <LeftMessage
            key={`a-${i}`}
            data={msg}
            isLast={isLast}
            roundId={data.sessionDetailId}
            onReload={onReload}
          />
        ),
      )}
    </div>
  )
})

export default Conversation
