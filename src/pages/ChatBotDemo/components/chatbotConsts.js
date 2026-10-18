export const USAGE = `// 1) 开箱即用：内置模拟后端，直接渲染即可
import { ChatBot } from '@/pages/components/ChatBot'
<ChatBot title="AI 助手" height={620} />

// 2) 接入真实后端：注入自己的请求封装
import { createHttpApi, ChatBot } from '@/pages/components/ChatBot'
export const api = createHttpApi({
  baseURL: '/gateway',
  getToken: () => localStorage.getItem('token'),
  endpoints: { generation: '/aigc/generation' },  // 按需覆盖
})
<ChatBot api={api} userId={uid} title="AI 助手" />

// 3) 只要逻辑，自己写 UI
import { useMessage, createHttpApi } from '@/pages/components/ChatBot'
export const chat = useMessage({ api: createHttpApi({ baseURL }) })`

export const PROTOCOL = `① 状态帧  { type:"status", state:"body-reset"|其它, message:"正在查询…" }
② 内容帧  { output:{ choices:[{ finish_reason, message:{ content, contentType, title } }] } }
③ 错误帧  { code: "1001" | "2001" | "2002" | ... }

累积规则（chatStream.js）：
· 只累加「无 contentType 且非 stop」的纯文本帧
· 正文一到，立刻撤掉状态条
· stop 帧的 content 是最终权威正文（避免重复追加）`

