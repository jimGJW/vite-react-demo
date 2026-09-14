/**
 * SharedConversationView —— 对话分享的只读落地页
 * ===============================================================
 * 来源：云端文档《QASharing 分享页 —— 组件化方案》。
 * A 用户勾选几轮对话生成分享，B 用户（**可能未登录**）打开链接只读浏览，
 * 并能「继续追问」跳回主聊天接着问。
 *
 * 它自己不发消息、不流式，只做三件事：取数据 → 只读渲染 → 给一个续写入口。
 * 因此没有 SSE、没有输入框、没有赞踩。
 *
 * ── 最小可用 ─────────────────────────────────────────────────────
 *   <SharedConversationView
 *     userShareId={query.userShareId}
 *     request={{ get: url => fetch(url).then(r => r.json()) }}
 *     api={{ getShareMessage: '/aigc/shareMessage' }}
 *     onContinue={(id) => navigate(`/chatbot?userShareId=${id}`)}
 *   />
 *
 * ── 相对原实现修掉的 6 个坑 ───────────────────────────────────────
 *   1. sessionId 取数组末条（见 shareProtocol.pickSessionId）
 *   2. userId 可选：未登录不再白屏（水印插槽按需传）
 *   3. onAsk 全程可选链：列表卡片点击不会 TypeError
 *   4. 空正文渲染为空，不再永久 loading
 *   5. flag 透传，与主聊天页保持同一份字段
 *   6. 不产出任何写死的分享链接，续写交给 onContinue 回调
 */

import { useCallback, useMemo } from 'react'
import { Button, Result, Spin } from 'antd'
import { EditOutlined, LinkOutlined } from '@ant-design/icons'
import ConversationList from './ConversationList.jsx'
import useShareConversation from './useShareConversation.js'
import { createSharedRenderers } from './sharedRenderers.jsx'
import { countRounds } from './shareProtocol.js'
/* 分享页会渲染主聊天页的卡片，这里一并引入卡片样式，保证单独引入本组件时样式完整 */
import '../ChatBot.scss'
import './qa-sharing.scss'

export default function SharedConversationView({
  /** 分享 ID（来自 URL query）；变化会自动重新拉取 */
  userShareId,
  /** 请求实例：`{ get(url) }`。不传时依次回退到 api 客户端、内置 fetch */
  request,
  /** 接口地址 / 客户端：`{ getShareMessage: '/aigc/shareMessage' }` */
  api,
  /** 当前查看者 ID（水印用，可空） */
  userId,
  /** 权限标记，非 null 时拼 `&flag=`；与主聊天页保持一致 */
  flag = null,
  /** 响应适配：接口不是直接返回数组时用它掰成数组 */
  transform,
  /** 点击「继续追问」：`(userShareId, { sessionId, data }) => void` */
  onContinue,
  /** 加载成功（埋点用）：`({ data, sessionId, userShareId }) => void` */
  onLoaded,
  /** 加载失败：`(err) => void` */
  onError,

  /** 富卡片渲染器 `{ [contentType]: Component }`；不传则用内置的四类卡片预设，传 `{}` 可完全关闭 */
  renderers,
  /** 覆盖正文渲染：`({ text, contentType, title }) => Node` */
  renderContent,
  /** 水印插槽：`({ userId, userShareId }) => Node`；默认不加水印 */
  renderWatermark,

  /** 是否显示续写按钮 */
  showContinue = true,
  /** 页头 */
  title = 'AI 对话分享',
  subtitle = '以下内容由分享者从对话中截取，只读展示',

  /* 文案 */
  continueText = '继续追问此对话',
  loadingText = '正在加载分享内容…',
  emptyText = '分享内容为空或已被撤回',
  endText = '以上为分享内容',
  dividerText = '全新的开始',
  answerTips,

  className = '',
  style,
}) {
  const { data, loading, error, sessionId, reload } = useShareConversation({
    userShareId,
    request,
    api,
    flag,
    transform,
    onLoaded,
    onError,
  })

  /* renderers 由调用方决定：undefined → 用内置卡片预设；{} → 退化成纯 Markdown */
  const mergedRenderers = useMemo(
    () => (renderers === undefined ? createSharedRenderers({ api }) : renderers),
    [renderers, api],
  )

  const handleContinue = useCallback(() => {
    onContinue?.(userShareId, { sessionId, data })
  }, [onContinue, userShareId, sessionId, data])

  const canContinue = showContinue && !loading && !error && countRounds(data) > 0

  return (
    <div className={`qa-sharing ${className}`} style={style}>
      {/* 水印插槽：默认不渲染任何东西 */}
      {typeof renderWatermark === 'function' ? (
        <div className="qa-watermark">{renderWatermark({ userId, userShareId })}</div>
      ) : null}

      <header className="qa-head">
        <div className="qa-head__main">
          <LinkOutlined className="qa-head__logo" />
          <div className="qa-head__text">
            <div className="qa-head__title">{title}</div>
            {subtitle ? <div className="qa-head__sub">{subtitle}</div> : null}
          </div>
        </div>
      </header>

      <div className="qa-body">
        {loading ? (
          <div className="qa-loading">
            <Spin size="small" />
            <span>{loadingText}</span>
          </div>
        ) : error ? (
          <Result
            status="warning"
            title="分享内容加载失败"
            subTitle={error.message || '请稍后重试，或确认链接是否完整'}
            extra={
              <Button type="primary" onClick={() => reload()}>
                重新加载
              </Button>
            }
          />
        ) : (
          <ConversationList
            data={data}
            renderers={mergedRenderers}
            renderContent={renderContent}
            emptyText={emptyText}
            endText={endText}
            dividerText={dividerText}
            answerTips={answerTips}
          />
        )}
      </div>

      {canContinue ? (
        <footer className="qa-foot">
          <Button type="primary" block icon={<EditOutlined />} onClick={handleContinue}>
            {continueText}
          </Button>
        </footer>
      ) : null}
    </div>
  )
}
