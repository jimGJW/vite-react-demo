# ChatBot · 流式对话助手组件

一套可独立复用的 **AI 流式对话** 前端能力：逐行 JSON 流式渲染、Markdown 与四类结构化卡片、历史会话、赞踩反馈、停止 / 重新生成。

组件本身**不包含任何业务耦合**——后端请求封装、用户信息、权限判断全部由外部注入，因此可以直接搬到任意 React 项目里使用。

> 技术栈：React 19 · Ant Design 5 · ECharts 6 · Sass
> 在线演示：启动项目后访问 `/chatbot` 路由

***

## 目录

* [能力总览](#能力总览)
* [目录结构](#目录结构)
* [快速开始](#快速开始)
* [流式协议](#流式协议)
* [卡片数据格式](#卡片数据格式)
* [API 参考](#api-参考)
* [接入真实后端](#接入真实后端)
* [性能设计](#性能设计)
* [主题与样式](#主题与样式)
* [对话分享（QASharing）](#对话分享qasharing)
* [常见问题](#常见问题)

***

## 能力总览

| 能力 | 说明 |
| --- | --- |
| 流式回答 | 逐行 JSON 协议，边收边渲染；状态帧驱动「正在检索数据…」这类进度条 |
| 正文重置与收口 | `body-reset` 帧清空正文重新累积；`stop` 帧作为最终权威正文，避免答案重复 |
| 四类卡片 | 列表 / 数据表 / 任务表 / 折线图，按 `contentType` 自动分发 |
| Markdown | 支持 GFM（表格、任务列表、删除线、代码块） |
| 表格交互 | 自动列、含 `time` 字段可切换表格 ↔ 图表（多数值列多序列）、导出 CSV |
| 任务批量导出 | 勾选行 → 提交打包任务 → 轮询结果 → 下载 ZIP |
| 历史会话 | 分页列表、点击回读、单条删除、一键清空 |
| 消息工具栏 | 复制、重新生成、赞 / 踩 |
| 智能吸底 | 用户上翻阅读时不被强行拽回底部，滚回底部后自动恢复跟随 |
| 对话分享 | `SharedConversationView`：把若干轮对话渲染成只读落地页，支持续写回流（详见下节） |
| 可注入后端 | `createHttpApi`（真实接口）与 `createMockApi`（离线演示）签名一致，可无缝替换 |

***

## 目录结构

```
src/components/ChatBot/
├── index.js                # 统一出口（组件 / Hook / 适配器 / 协议）
├── ChatBot.jsx             # 主容器：头部 + 消息区 + 推荐问题 + 输入区 + 历史抽屉
├── Message.jsx             # 气泡层：Conversation / LeftMessage / RightMessage / PendingBubble
├── AnswerWidget.jsx        # 回答分发器：按 contentType 选择卡片或 Markdown
├── HistoryList.jsx         # 历史会话抽屉
├── ChatContext.jsx         # 跨气泡上下文（低频配置 + 高频状态，拆成两个）
├── useMessage.js           # 核心状态机：流式消费、轮次结构、历史、赞踩
├── useAutoScroll.js        # 智能吸底滚动
├── api.js                  # HTTP 客户端（createHttpApi）
├── mockBackend.js          # 本地模拟后端（createMockApi）
├── chatStream.js           # 流式协议纯函数（零依赖，可单测）
├── config.js               # 接口路径、内容类型、列名映射等默认配置
├── ChatBot.scss            # 样式（全部使用项目主题变量）
├── cards/
│   ├── ListCard.jsx        # 列表卡片
│   ├── DataTable.jsx       # 数据表卡片（含图表切换 / CSV 导出）
│   ├── TaskTable.jsx       # 任务表卡片（含批量打包轮询）
│   ├── LineChart.jsx       # 折线图卡片（ECharts）
│   └── utils.js            # 卡片公共工具：解析 / 建列 / CSV / 序列归一化
└── sharing/                # ★ 对话分享只读落地页（QASharing，含 README.md）
    ├── SharedConversationView.jsx  # 页面级组件
    ├── ConversationList.jsx        # 只读对话列表
    ├── useShareConversation.js     # 取数 hook
    ├── sharedRenderers.jsx         # 四类只读卡片预设
    ├── shareProtocol.js            # 协议纯函数
    └── qa-sharing.scss             # 样式
```

***

## 快速开始

### 1. 开箱即用（内置模拟后端）

不传 `api` 时自动使用本地模拟后端，无需任何后端即可体验完整链路：

```jsx
import { ChatBot } from '../../components/ChatBot'

<ChatBot title="AI 助手" height={620} />
```

### 2. 接入真实后端

```jsx
import { ChatBot, createHttpApi } from '../../components/ChatBot'

const api = createHttpApi({
  baseURL: '/gateway',
  getToken: () => localStorage.getItem('token'),
  endpoints: { generation: '/aigc/generation' }, // 按需覆盖
})

<ChatBot api={api} userId={uid} title="AI 助手" onFinish={(r) => console.log(r)} />
```

### 3. 只要逻辑，自己写 UI

```jsx
import { useMessage, createHttpApi } from '../../components/ChatBot'

const chat = useMessage({ api: createHttpApi({ baseURL }) })
// chat.conversationData / chat.postMessage / chat.busy / chat.stopFetch ...
```

### 4. 任意页面唤起（配合全局助手）

组件内部不依赖路由，可以放在抽屉、Modal、Tab 或页面任意位置：

```jsx
<Drawer open={open} onClose={close} width={720} destroyOnHidden>
  <ChatBot title="AI 助手" height={560} subtitle={null} />
</Drawer>
```

***

## 流式协议

### 帧格式

后端返回的**不是标准 SSE**：响应体是「逐行 JSON」——按 `\n` 切分后逐行 `JSON.parse`。解析器同时兼容标准 SSE 的 `data:` 前缀、`[DONE]` 终止符、`event:` / `id:` / `retry:` 行与 `:` 心跳注释。

| 类型 | 形态 | 作用 |
| --- | --- | --- |
| ① 状态帧 | `{ type:"status", state:"body-reset"\|其它, message:"正在检索数据…" }` | 显示工具调用进度；`body-reset` 表示清空当前正文重新累积 |
| ② 内容帧 | `{ sessionId, sessionDetailId, recommend, output:{ choices:[{ finish_reason, message:{ content, contentType, title, taskIds } }] } }` | 正文增量 / 卡片 JSON；`finish_reason: "stop"` 为收尾帧 |
| ③ 错误帧 | `{ code:"1001" \| "2001" \| "2002" \| "2003" \| "3001" }` | 语义化错误，映射为可读文案 |

### 三条累积规则

实现在 `chatStream.js`，是纯函数、可单测：

1. **只累加**「无 `contentType` 且 `finish_reason !== "stop"`」的纯文本帧；
2. **正文一到，立刻撤掉状态条**（说明工具调用已结束）；
3. **`stop` 帧的 `content` 是最终权威正文**——流式文本只作中间态。若把 stop 帧内容再追加到已累积文本后，答案会重复一遍。

### 错误码映射

| 错误码 | 语义 | 提示文案 |
| --- | --- | --- |
| 1001 | 用户失效 | 登录状态已失效，请重新登录 |
| 1002 | 鉴权失败 | 身份校验失败，请重新登录 |
| 2001 | 会话不存在 | 会话不存在，已为你开启新会话 |
| 2002 | 积分耗尽 | 可用积分已用完 |
| 2003 | 额度耗尽 | 今日额度已用完 |
| 3001 | 网络异常 | 网络或系统异常，请稍后重试 |

***

## 卡片数据格式

`message.contentType` 决定渲染形态，`message.content` 是内容（卡片类为 JSON 字符串，容器会宽松解析：数组 / JSON 字符串 / `{ content: [] }` / `{ data: [] }` 均可）。

| contentType | 组件 | message 期望格式 |
| --- | --- | --- |
| `null` / 其它 | Markdown | Markdown 文本 |
| `list` | ListCard | `[{ id, name, type, location, note }]` |
| `table` | DataTable | `[{ time, temperature, humidity, pressure }]` |
| `taskTable` | TaskTable | `[{ time, id, type, status, report }]` |
| `echart` | LineChart | `[[时间, 值]]` 或 `[{ time, value }]` |

**表格列名**：命中 `config.js` 的 `FIELD_LABELS` 白名单用中文列名，未命中的字段按 key 自动生成列（最多 8 列）。扩展列名只要往 `FIELD_LABELS` 里加一条即可。

**多序列图表**：表格数据同时含 `time` 与多个数值列时，切到「图表」视图会把**全部数值列**画成多条折线（不再是只取第一列）。

***

## API 参考

### `<ChatBot />`

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `api` | object | `createMockApi()` | 请求封装，见下方「接入真实后端」 |
| `title` | string | `'AI 助手'` | 头部标题，同时用于欢迎语 |
| `subtitle` | string \| null | `'流式对话 · 卡片渲染 · 历史会话'` | 传 `null` 可隐藏 |
| `userId` | string | — | 透传给 `useMessage` |
| `head` | ReactNode | — | 用户头像内容（文字或图标） |
| `perm` | `{ canChat(), onDenied?() }` | — | 发言权限门禁 |
| `placeholder` | string | `DEFAULT_PLACEHOLDER` | 输入框占位文案 |
| `recommend` | string[] | `DEFAULT_RECOMMEND` | 欢迎页推荐问题 |
| `height` | number \| string | `640` | 容器高度 |
| `className` | string | `''` | 追加到根节点的类名 |
| `toolBox` | boolean | `true` | 是否显示气泡工具栏（复制 / 重生成 / 赞踩） |
| `maxLength` | number | — | 输入框最大字数 |
| `initialRounds` | array | — | 初始轮次（外部已有上下文时直接注入） |
| `onFinish` | `(result) => void` | — | 一轮回答结束（`stop` 帧）时回调 |
| `onError` | `(msg, raw) => void` | — | 错误上报 |

### `useMessage(options)`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `api` | object | **必传**，`createHttpApi` 或 `createMockApi` 的产物 |
| `userId` | string | 用户标识 |
| `perm` | object | 权限门禁 |
| `onError` | function | 错误上报 |
| `onFinish` | function | 一轮结束回调 |
| `initialRounds` | array | 初始轮次 |
| `contDom` | ref | 滚动容器 ref（不传则内部自建） |

返回值（节选）：

| 字段 | 说明 |
| --- | --- |
| `conversationData` | 轮次数组，一轮 = `{ sessionDetailId, sessionId, conversation: [提问, 回答] }` |
| `statusLine` / `fetchState` / `busy` / `errorText` | 状态 |
| `postMessage(text, opts)` | 发消息；`opts.regenerate` 为重新生成 |
| `stopFetch()` / `reloadConversation()` / `creatNewChat()` / `clearScreen()` | 停止 / 重生成 / 新对话 / 清空屏幕 |
| `recommend` / `sessionId` | 推荐问题 / 当前会话 ID |
| `updateMessageState(detailId, state)` | 赞踩（`'1'` 赞 / `'0'` 踩 / `''` 取消） |
| `history` / `historyTotal` / `historyLoading` | 历史会话 |
| `loadHistory(page, { append })` / `loadDetail(id)` / `deleteHistory(id)` / `clearHistory()` | 历史操作 |
| `scrollToBottom(behavior)` / `pinToBottom(behavior)` | 滚动控制 |

### `createHttpApi(options)`

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `baseURL` | `''` | 网关前缀 |
| `endpoints` | `DEFAULT_ENDPOINTS` | 接口路径覆盖 |
| `getToken` | — | 返回 `Authorization` 头（不含前缀） |
| `headers` | — | 额外请求头 |
| `timeout` | `30000` | 超时毫秒（`0` 不限时；流式请求只对建立连接计时） |
| `credentials` | `'same-origin'` | 跨域带 Cookie 时设为 `'include'` |
| `onUnauthorized` | — | 401 回调 |

产物：`{ kind:'http', endpoints, sendChat, get, post, del }`，与 `createMockApi` 完全同签名。

### 其他导出

| 导出 | 说明 |
| --- | --- |
| `recordsToRounds(records)` | 服务端历史记录 → 轮次结构（兼容扁平消息与 Q/A 两种形态） |
| `useAutoScroll(ref, signal)` | 智能吸底：返回 `{ scrollToBottom, pinToBottom, stickRef }` |
| `ChatProvider` / `ChatStatusProvider` | 气泡层上下文（低频配置 / 高频状态） |
| `ListCard` / `DataTable` / `TaskTable` / `LineChart` | 四类卡片可单独使用 |
| `CONTENT_TYPE` / `FIELD_LABELS` / `DEFAULT_ENDPOINTS` | 配置常量 |

***

## 接入真实后端

只需要实现 4 个方法（或直接用 `createHttpApi`）。默认接口路径集中在 `config.js` 的 `DEFAULT_ENDPOINTS`：

| 字段 | 默认路径 | 用途 |
| --- | --- | --- |
| `generation` | `/aigc/generation` | 发消息（流式，POST） |
| `stopGenerating` | `/aigc/stopGenerating` | 停止生成 |
| `historyList` | `/aigc/historyList` | 历史列表（分页，`page` 从 0 开始） |
| `detailList` | `/aigc/detailList` | 会话详情（分页） |
| `deleteHistory` | `/aigc/deleteHistory` | 删除会话 |
| `commentStatus` | `/aigc/commentStatus` | 赞 / 踩 |
| `share` / `shareMessage` | `/aigc/share` `/aigc/shareMessage` | 分享 |
| `recommend` | `/ai/recommend` | 推荐问题 |
| `batchExport` | `/batch/export` | 提交批量打包任务 |
| `batchExportResult` | `/batch/export/result` | 轮询打包结果（实际请求为 `{path}/{pollId}`） |

自定义后端只需保证签名一致即可替换：

```js
const api = {
  endpoints: { ...DEFAULT_ENDPOINTS, generation: '/my/chat' },
  async sendChat(payload, { signal, onFrame, onError }) {
    const res = await fetch('/my/chat', { method: 'POST', signal, body: JSON.stringify(payload) })
    await consumeStream(res, { onFrame, onError })   // 复用现成的逐行 JSON 解析
  },
  get: (path, params, opts) => myClient.get(path, params, opts),
  post: (path, body, opts) => myClient.post(path, body, opts),
  del: (path, params, opts) => myClient.del(path, params, opts),
}
```

***

## 性能设计

流式对话的天然压力是：**每收到一小段文本就更新一次状态**。如果放任其扩散，一帧就要把整屏消息全部重渲染一遍。这里做了三件事：

**1. 上下文按变化频率拆分**

`ChatContext` 只放低频且稳定的内容（工具栏开关、头像、赞踩回调、`api`）；`ChatStatusContext` 单独承载高频的 `loading` / `statusLine`，并且**只有「等待中的那一条气泡」消费它**（`PendingBubble`）。状态条每帧刷新时，历史气泡完全不受影响。

**2. 气泡与卡片全部 `React.memo`**

`Conversation` / `LeftMessage` / `RightMessage` / `AnswerWidget` / 四类卡片都是 memo 组件。由于 `patchAssistant` 只为被修改的那一轮创建新对象、其余轮次保持原引用，重渲染自然收敛到「正在生成的那一条」。

> 新增 props 时请保持同样纪律：传给气泡的**回调必须用 `useCallback` 固定引用**，否则所有历史气泡的 memo 都会失效。`ChatBot.jsx` 里已按此约定处理。

**3. Markdown 解析降级为低优先级**

`useDeferredValue` 让 React 先处理输入与滚动这类紧急更新，Markdown 的解析被推迟到空闲阶段，中途的半截文本会被自动跳过。

**4. 智能吸底**

`useAutoScroll` 监听滚动位置，只在用户停留底部（80px 内）时跟随新内容，且跟随使用 `behavior: 'instant'`——若用 `smooth`，流式期间每帧都会重启动画，反而更卡。用户向上翻看历史时不会被拽回底部。

***

## 主题与样式

样式全部走项目主题变量，自动跟随亮 / 暗主题切换：

| 变量 | 用途 |
| --- | --- |
| `--c-card` / `--c-bg-soft` | 容器与气泡背景 |
| `--c-border-soft` | 分隔线 |
| `--c-text-1` / `--c-text-3` | 主 / 次文本 |
| `--c-primary` / `--c-accent` | 主色、强调色（AI 与用户头像） |

类名统一以 `cb-` 为前缀（`cb-root` / `cb-header` / `cb-body` / `cb-bubble` / `cb-tools` / `cb-card__head` …），便于在外部做局部覆盖。

***

## 对话分享（QASharing）

把「一段 AI 对话」变成可以随手发给别人的**只读落地页**：A 勾选几轮对话生成分享，B（可能未登录）打开链接浏览，并可「继续追问」跳回主聊天接着问。

组件自己不发消息、不流式，只做「取数据 → 只读渲染 → 给一个续写入口」，因此没有 SSE / 输入框 / 赞踩。

```jsx
import { SharedConversationView, toShareRequest, createHttpApi } from '../../components/ChatBot'

const request = useMemo(
  () => toShareRequest(createHttpApi({ baseURL: '/gateway', getToken: () => token })),
  [],
)

<SharedConversationView
  userShareId={id}                       // 来自 URL query
  request={request}
  flag={isAiUser() ? 1 : null}           // 可选，需与主聊天页一致
  onContinue={(sid, { sessionId }) => navigate(`/chatbot?userShareId=${sid}`)}
  renderWatermark={({ userId }) => <MyWatermark text={userId} />}
/>
```

| 导出 | 用途 |
| --- | --- |
| `SharedConversationView` | 页面级只读组件（加载 / 错误 / 空态 + 续写 + 水印插槽） |
| `useShareConversation` | 取数 hook：`{ data, loading, error, sessionId, reload }` |
| `ConversationList` / `ConversationItem` / `MessageBubble` | 自定义布局时组合使用 |
| `createSharedRenderers` | 四类**只读**卡片渲染器预设（`renderers` 传 `{}` 可关闭） |
| `toShareRequest` / `createFetchShareRequest` | 请求适配 / 零依赖兜底实现 |
| `shareProtocol` 系列 | `pickSessionId` / `normalizeShareItems` / `buildShareMessageUrl` 等纯函数 |

> 📖 完整文档（全部 props / 数据结构 / 接口契约 / 迁移清单 / 去敏说明）：[sharing/README.md](sharing/README.md)
> 在线演示：`/share?userShareId=demo-share`（模拟后端内置了一条示例分享，并演示「生成分享 → 回读」闭环）

***

## 常见问题

**Q：答案重复出现了两遍？**
检查后端 `stop` 帧是否回传了**完整正文**。本组件按「流式文本只作中间态、`stop` 帧一锤定音」设计。若后端 `stop` 帧内容为空，请让 `resolveMessageBody` 走 `streamedText` 分支（默认已兼容）。

**Q：卡片不渲染，只显示一坨 JSON？**
`contentType` 必须与 `CONTENT_TYPE` 中的值完全一致（`list` / `table` / `taskTable` / `echart`），大小写敏感。

**Q：接了真实后端却提示「响应不可读」？**
`consumeStream` 需要 `response.body`（ReadableStream）。若你的 HTTP 库做了响应拦截并直接返回 `JSON`，请改传原始 `Response`，或自行实现 `sendChat` 并逐帧调用 `onFrame`。

**Q：跨域请求要带 Cookie？**
`createHttpApi({ credentials: 'include' })`。

**Q：流式回答迟迟没有首字节？**
默认 30s 连接超时，触发后抛 `TimeoutError`，界面提示「请求超时，请稍后重试」。可用 `timeout: 0` 关闭，或按次传 `timeout`。

**Q：想让助手在任意页面弹窗唤起？**
`ChatBot` 不依赖路由，直接放进 `Drawer` / `Modal` 即可；也可以只用 `useMessage` 自己写 UI，或用 `window` 事件在任意框架里唤起（参见项目内 `src/components/Assistants`）。

***

## 关于去敏

本组件由内部项目的对话实现改写而来，改写时**剔除了全部与环境、账号、业务强绑定的部分**：

* 内部网关地址与站点标识 → 改为相对路径 + 可注入 `baseURL`
* 权限站点判断、水印、微信 JS-SDK 注入 → 全部移除，权限改为可注入的 `perm`
* 具体业务的列名、状态枚举、示例数据 → 替换为通用的监测 / 任务示例
* `localStorage` 里带业务前缀的存储键 → 移除，历史会话改为走接口

保留的是**完整的通用能力**：流式协议、卡片渲染、历史会话、赞踩、批量导出与分享交互。

对话分享子模块（`sharing/`）同样做过一轮去敏：内部门户路径 / 站点标识 / 微信 JS-SDK / 埋点 SDK / 用户态 store 全部剔除，改为可注入的 `request` / `api` / `onContinue` / `onLoaded` / `renderWatermark`，并修掉了原实现的 6 个缺陷（详见 [sharing/README.md](sharing/README.md)）。
