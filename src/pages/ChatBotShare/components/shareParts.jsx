export const DEFAULT_SHARE_ID = 'demo-share'

export const USAGE = `// 1) 最小可用：注入请求实例与接口地址
import { SharedConversationView } from '@/pages/components/ChatBot'

<SharedConversationView
  userShareId={query.get('userShareId')}
  request={{ get: (url) => fetch(url).then((r) => r.json()) }}
  api={{ getShareMessage: '/aigc/shareMessage' }}
  onContinue={(id) => navigate(\`/chatbot?userShareId=\${id}\`)}
/>

// 2) 复用项目现成的请求客户端（createHttpApi / createMockApi）
import { toShareRequest } from '@/pages/components/ChatBot'
export const request = toShareRequest(createHttpApi({ baseURL: '/gateway' }))

// 3) 只要逻辑，UI 全自定义
import { useShareConversation } from '@/pages/components/ChatBot'
export const { data, loading, error, sessionId, reload } = useShareConversation({ userShareId })

// 4) 不要卡片依赖：renderers={{}} 即退化成 Markdown 渲染
<SharedConversationView userShareId={id} renderers={{}} />

// 5) 换主题色
.qa-sharing { --qa-primary: #00b9e6; }`

export const CONTRACT = `① 生成分享   POST /aigc/share          body { sessionDetailIds: [...] } → { id, userId }
② 分享落地页 GET  /aigc/shareMessage    ?userShareId=xxx[&flag=1] → ConversationItem[]
③ 续写回流   点击「继续追问」→ onContinue(userShareId, { sessionId, data })
                       主聊天页据此 setContinuedId(最后一条 sessionDetailId)`

export const PITFALLS = [
  ['sessionId 取错', '原实现写 QASharingData.sessionId —— 对数组取属性恒为 undefined；现取末条。'],
  ['匿名访问白屏', '不再读全局用户态，userId 改为可选；分享页恰恰最可能被未登录用户打开。'],
  ['postMessage 未传', '列表卡片点击回调全程可选链，不再 TypeError。'],
  ['空正文永久 loading', 'message 为空且无 contentType 时渲染为空，而不是留一个转圈动画。'],
  ['缺 flag 参数', 'flag 透传，与主聊天页请求同一份字段。'],
  ['分享链接硬编码', '组件不产出任何链接，续写交给 onContinue 回调。'],
]

export function WatermarkLayer({ text }) {
  return (
    <div className="share-demo__wm-grid" aria-hidden="true">
      {Array.from({ length: 30 }, (_, i) => (
        <span key={i}>{text}</span>
      ))}
    </div>
  )
}
