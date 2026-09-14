# QASharing · 对话分享只读落地页

把「一段 AI 对话」变成可以随手发给别人的只读页面：**A 勾选几轮对话生成分享，B（可能未登录）打开链接浏览，并能「继续追问」跳回主聊天接着问。**

组件自己不发消息、不流式，只做三件事：**取数据 → 只读渲染 → 给一个续写入口**。因此没有 SSE、没有输入框、没有赞踩。

> 技术栈：React 19 · Ant Design 5 · react-markdown · Sass
> 在线演示：启动项目后访问 `/share?userShareId=demo-share`
> 来源：云端文档库《QASharing 分享页 —— 组件化方案》（已去敏重写并适配本项目技术栈）

***

## 目录

* [这个页面解决什么问题](#这个页面解决什么问题)
* [目录结构](#目录结构)
* [快速开始](#快速开始)
* [API 参考](#api-参考)
* [数据结构](#数据结构)
* [接口契约](#接口契约)
* [修掉的 6 个坑](#修掉的-6-个坑)
* [迁移检查清单](#迁移检查清单)
* [主题与样式](#主题与样式)
* [与原始方案的关系](#与原始方案的关系)
* [常见问题](#常见问题)

***

## 这个页面解决什么问题

它在整条分享链路里的位置：

```
① 主聊天页勾选对话      setChatIdArray('add', sessionDetailId)
        ↓
② 生成分享             POST /aigc/share  { sessionDetailIds: [...] } → { id, userId }
        ↓
③ 配置分享卡片/链接     `${origin}/share?userShareId=${id}`
        ↓
④ B 用户打开链接  ────► 【SharedConversationView】
                          GET /aigc/shareMessage?userShareId=xxx[&flag=1]
                          只读渲染 ConversationItem[]
        ↓
⑤ 点「继续追问」        onContinue(userShareId, { sessionId, data })
        ↓
⑥ 主聊天页接手          useEffect → 取回详情 → setContinuedId(最后一条 sessionDetailId)
                          下次 postMessage 带 continuedId，后端接着上下文回答
```

关键点：**QASharing 自己不发消息、不流式**。所以把 SSE、输入框、赞踩、工具栏全部砍掉之后，剩下的就是本组件。

***

## 目录结构

```
src/components/ChatBot/sharing/
├── index.js                    # 子模块统一出口
├── SharedConversationView.jsx  # 页面级组件：加载态 / 错误态 / 空态 / 续写 / 水印插槽
├── ConversationList.jsx        # ConversationList / ConversationItem / MessageBubble
├── useShareConversation.js     # 取数 hook（+ toShareRequest / createFetchShareRequest）
├── sharedRenderers.jsx         # 四类只读卡片渲染器预设（可选）
├── shareProtocol.js            # 协议纯函数：归一化 / URL 拼接 / 续写锚点
└── qa-sharing.scss             # 样式（qa- 前缀，全部走主题变量）

src/pages/ChatBotShare/         # 演示页（路由 /share）
```

***

## 快速开始

### 1. 最小可用

```jsx
import { SharedConversationView } from '../../components/ChatBot'

<SharedConversationView
  userShareId={new URLSearchParams(location.search).get('userShareId')}
  request={{ get: (url) => fetch(url).then((r) => r.json()) }}
  api={{ getShareMessage: '/aigc/shareMessage' }}
  onContinue={(id) => navigate(`/chatbot?userShareId=${id}`)}
/>
```

### 2. 复用项目现成的请求客户端

`createHttpApi` / `createMockApi` 的产物用 `toShareRequest` 适配一下即可（它会拆掉 query，走客户端自己的 params 通道，两种实现都能正确匹配路由）：

```jsx
import { createHttpApi, toShareRequest } from '../../components/ChatBot'
import { useMemo } from 'react'

const request = useMemo(
  () => toShareRequest(createHttpApi({ baseURL: '/gateway', getToken: () => token })),
  [],
)

<SharedConversationView userShareId={id} request={request} />
```

### 3. 只要逻辑，UI 全自定义

```jsx
import { useShareConversation } from '../../components/ChatBot'

const { data, loading, error, sessionId, reload } = useShareConversation({
  userShareId,
  request: rest,
  api: { getShareMessage: urls.getShareMessage },
})
```

### 4. 不要卡片依赖

`renderers` 传 `{}` 即退化成纯 Markdown 渲染，分享页不会因为缺某个卡片组件而崩：

```jsx
<SharedConversationView userShareId={id} renderers={{}} />
```

### 5. 换主题色

```less
.qa-sharing { --qa-primary: #00b9e6; }
```

***

## API 参考

### `<SharedConversationView />`（默认导出，页面级）

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `userShareId` | string | — | **核心入参**，分享 ID，来自 URL query；变化会自动重新拉取 |
| `request` | `{ get(url): Promise }` | 内置 fetch | 请求实例 |
| `api` | `{ getShareMessage?: string }` | `DEFAULT_ENDPOINTS.shareMessage` | 接口地址（也接受带 `endpoints.shareMessage` 的客户端对象） |
| `userId` | string | — | 当前查看者 ID（仅水印用，**可空**） |
| `flag` | string \| number \| null | `null` | 权限标记，非空时拼 `&flag=`，需与主聊天页一致 |
| `transform` | `(res) => ConversationItem[]` | — | 响应适配：接口不是直接返回数组时用它掰成数组 |
| `onContinue` | `(userShareId, { sessionId, data }) => void` | — | 点击「继续追问」 |
| `onLoaded` | `({ data, sessionId, userShareId }) => void` | — | 加载成功（埋点用） |
| `onError` | `(err) => void` | — | 拉取失败 |
| `renderers` | `{ [contentType]: Component }` | 内置卡片预设 | 富卡片渲染器；传 `{}` 关闭、传 `undefined` 用预设 |
| `renderContent` | `({ text, contentType, title }) => Node` | Markdown | 覆盖正文渲染 |
| `renderWatermark` | `({ userId, userShareId }) => Node` | — | 水印插槽，**默认不加水印** |
| `showContinue` | boolean | `true` | 是否显示续写按钮 |
| `title` / `subtitle` | string | `'AI 对话分享'` / 只读提示 | 页头文案，`subtitle` 传 `null` 可隐藏 |
| `continueText` | string | `'继续追问此对话'` | 续写按钮文案 |
| `loadingText` | string | `'正在加载分享内容…'` | 加载中文案 |
| `emptyText` | string | `'分享内容为空或已被撤回'` | 空态文案 |
| `endText` | string | `'以上为分享内容'` | 列表结束语，传 `null` 隐藏 |
| `dividerText` | string | `'全新的开始'` | `sessionDetailId === '0000'` 的分隔条文案 |
| `answerTips` | string \| null | `'本答案由 AI 生成，仅供参考。'` | Markdown 答案下方提示，传 `null` 隐藏 |
| `className` / `style` | — | — | 外层容器 |

### `useShareConversation(options)`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `userShareId` | string | 分享 ID |
| `request` | `{ get(url) }` | 请求实例 |
| `api` | `{ getShareMessage?, endpoints? }` | 接口地址 |
| `flag` | string \| number \| null | 权限标记 |
| `transform` | `(res) => any[]` | 响应适配 |
| `onLoaded` / `onError` | function | 回调 |

返回 `{ data, loading, error, sessionId, userShareId, reload }`。

> `request` / `api` / `transform` 通常写成内联对象，hook 内部用 ref 固定，**不会因父组件重渲染而重复请求**；只有 `userShareId` 变化才重新拉取。切换 ID 或卸载时会中断在途请求。

### `<ConversationList />` / `<ConversationItem />` / `<MessageBubble />`

需要自定义布局时组合使用。

| 组件 | props |
| --- | --- |
| `ConversationList` | `data`、`renderers`、`renderContent`、`emptyText`、`endText`、`dividerText`、`answerTips`、`className` |
| `ConversationItem` | `item`、`renderers`、`renderContent`、`answerTips`、`dividerText` |
| `MessageBubble` | `message`、`contentType`、`title`、`taskIds`、`renderers`、`renderContent`、`answerTips` |

`MessageBubble` 的派发顺序：`renderers[contentType]` → `renderContent` → 内置 Markdown。

### `createSharedRenderers({ api, onAsk })`

返回 `{ list, table, taskTable, echart }` 四个渲染器，全部为**只读态**（`shareState = true`，隐藏导出 CSV / 勾选 / 图表切换）。

```jsx
import { createSharedRenderers } from '../../components/ChatBot'

const renderers = useMemo(() => createSharedRenderers({ api }), [api])
```

### `shareProtocol.js`（纯函数，可单测）

| 导出 | 说明 |
| --- | --- |
| `pickSessionId(items)` | 取数组**末条**的 `sessionId`（续写锚点） |
| `normalizeShareItems(res, transform)` | 响应 → `ConversationItem[]` |
| `normalizeShareItem(item, i)` | 单个轮次归一化 |
| `normalizeMessage(msg, detailId, i)` | 单条消息归一化 |
| `buildShareMessageUrl(base, { userShareId, flag })` | 拼详情接口 URL |
| `isNewChatItem(item)` | 是否为 `0000` 分隔轮 |
| `countRounds(items)` | 统计提问轮数 |
| `DEFAULT_SHARE_MESSAGE_PATH` | 默认路径 `/aigc/shareMessage` |

### `toShareRequest(api)` / `createFetchShareRequest(opts)`

* `toShareRequest(api)`：把 `createHttpApi` / `createMockApi` 的产物适配成 `{ get(url) }`；
* `createFetchShareRequest({ baseURL, getToken, headers, credentials })`：零依赖兜底实现，也是不注入 `request` 时的默认值。

***

## 数据结构

```ts
type ConversationItem = {
  sessionDetailId: string      // '0000' 渲染成「全新的开始」分隔条
  sessionId?: string           // 末条带，作为续写锚点
  userShare?: boolean          // 主页面续写态标记（只读页用它区分来源轮次）
  conversation: Array<
    | { type: 0; message: string }                                  // 用户
    | { type: 1; message: string|null; contentType?: string;        // 助手
        title?: string; taskIds?: any[] }
  >
}
```

`contentType` 取值：`'list'`（设备列表）、`'table'`（数据表）、`'taskTable'`（任务表）、`'echart'`（折线图）、空（Markdown）。

**组件本身不内置这些卡片**——默认走 `createSharedRenderers()`，也可以完全由 `renderers` 注入；未注册的 `contentType` 会退化成 Markdown 正文，因此分享页不会因缺组件而崩。

***

## 接口契约

| 项 | 值 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `{BASE}/aigc/shareMessage?userShareId={id}[&flag={1｜null}]` |
| 成功 | `ConversationItem[]`（数组，末条带 `sessionId`） |
| 空 | `[]` / `{}` → 组件渲染 `emptyText` |

关联接口（在主聊天页，**不在本组件内**）：

| 用途 | 方法 | 路径 |
| --- | --- | --- |
| 生成分享 ID | POST | `{BASE}/aigc/share`，body `{ sessionDetailIds: [...] }` → `{ id, userId }` |
| 续写拉取 | GET | `{BASE}/aigc/detailList` / `shareMessage`（主页面 `getUserShareDetailData`） |

> 本项目内置模拟后端已实现这两条：`POST /aigc/share` 会真的生成一条分享记录，`GET /aigc/shareMessage` 能读回。演示页的「生成新的分享」按钮走的就是这条闭环。

***

## 修掉的 6 个坑

| # | 原实现的问题 | 本组件的处理 |
| --- | --- | --- |
| 1 | `sessionId` 取错：`QASharingData.sessionId` —— 对数组取属性恒为 `undefined` | `pickSessionId` 取数组**末条** |
| 2 | 匿名访问白屏：读全局用户态后立刻解构 `userAccount` | 归一化只认数据结构，不碰全局态；`userId` 改为可选 |
| 3 | `postMessage` 未传：列表卡片点击时 `TypeError` | `onAsk` 全程可选链，未注入即空操作 |
| 4 | 空正文永久 loading：某轮 `message` 为 `null` 时一直转圈 | 空正文且无 `contentType` 时**渲染为空** |
| 5 | 缺 `flag` 参数：与主聊天页请求字段不一致 | `flag` 透传，两处保持一致 |
| 6 | 分享链接硬编码：写死 `/wx/QASharing?...`，换路由就断 | 组件不产出任何链接，续写交给 `onContinue` 回调 |

***

## 迁移检查清单

- [ ] `getShareMessage` 返回的是数组还是 `{ data: [] }`？不是数组就传 `transform: (res) => res.data`
- [ ] 未登录能否访问该接口？本组件已把 `userId` 改成可选
- [ ] `contentType` 有哪些取值？逐个在 `renderers` 里注册；没注册的会退化成纯文本（不会崩）
- [ ] 续写跳转的路由路径改为自己项目的（在 `onContinue` 里）
- [ ] 需要微信 / 站内分享卡片就在 `onLoaded` 里调 `setShareInfo`，组件不关心 JS-SDK
- [ ] 水印：要么传 `renderWatermark`，要么干脆不要；组件默认不加水印
- [ ] `flag` 语义与后端确认，主聊天页和分享页保持一致

***

## 主题与样式

样式全部走项目主题变量，自动跟随亮 / 暗主题：

| 变量 | 用途 |
| --- | --- |
| `--qa-primary` | 分享页主色，默认继承 `--c-primary`，可在 `.qa-sharing` 上覆盖 |
| `--c-card` / `--c-bg-soft` | 容器与气泡背景 |
| `--c-border-soft` | 分隔线 |
| `--c-text-1` / `--c-text-2` / `--c-text-3` | 主 / 次 / 弱文本 |
| `--c-accent` | 用户头像 |

类名统一以 `qa-` 为前缀（`qa-sharing` / `qa-head` / `qa-body` / `qa-round` / `qa-bubble` / `qa-avatar` / `qa-md` / `qa-foot` / `qa-watermark`），便于在外部做局部覆盖。卡片部分沿用主模块的 `cb-*` 类名（`SharedConversationView` 已自动引入 `ChatBot.scss`，单独使用该组件时样式同样完整）。

***

## 与原始方案的关系

| 关注点 | 原始方案 | 本项目实现 |
| --- | --- | --- |
| 数据来源 | `rest.get(urls.getShareMessage + '?userShareId=')` | `request` / `api` 注入，另有零依赖 fetch 兜底 |
| 用户态 | `useSelector(state => state.preload.myself)` | `userId` 可选 prop，不依赖任何全局 store |
| 权限标记 | 未传（主页面传 `isAiUser() ? 1 : null`） | `flag` prop，可选 |
| 渲染 | 复用主聊天页 `<Conversation>` | 自带轻量 `ConversationList`，主聊天页零耦合 |
| 富卡片 | 复用 `AssetList` / `TempTable` | `renderers` 注入 + `createSharedRenderers()` 预设 |
| 水印 | 内置 `Watermark` 组件 | `renderWatermark` 插槽，默认关闭 |
| 续写 | `history.push('/wx/chatbot?userShareId=')` | `onContinue` 回调，路由由调用方决定 |
| 埋点 | `util.log(...)` | `onLoaded` 回调 |
| 主题 | `isIbSite() ? 'chatbot' : 'chatbot acct-chatbot'` | CSS 变量 `--qa-primary` |

**去敏说明**：改写时剔除了全部与环境、账号、业务强绑定的内容——内部网关地址与站点标识改为相对路径 + 可注入 `baseURL`；权限站点判断、水印组件、微信 JS-SDK、埋点 SDK 全部移除，改为可注入插槽 / 回调；具体业务的列名与示例数据替换为通用的监测 / 任务示例。保留的是**完整的通用能力**：只读渲染、卡片派发、续写回落、空态与错误态。

***

## 常见问题

**Q：打开链接一片空白，控制台报错？**
先确认 `userShareId` 是否真的传进了组件（有些路由库的 query 不在 `location.search` 里）。组件在未拿到 ID 时不会发请求，此时走的是空态。

**Q：接口返回 `{ code: 0, data: [...] }`，页面显示空？**
用 `transform`：`transform={(res) => res.data}`。归一化虽然内置了 `{ data: [] }` / `{ content: [] }` / `{ list: [] }` 的兜底，但显式声明更稳。

**Q：卡片不渲染，只显示一坨 JSON？**
`contentType` 必须与 `CONTENT_TYPE` 完全一致（`list` / `table` / `taskTable` / `echart`，大小写敏感），并且要注册到 `renderers` 里。未注册会走 Markdown 兜底。

**Q：某轮回答是空的，页面什么都没有？**
这是刻意的：分享页没有流，空正文就是空正文，不会留一个永远转圈的三点动画（原实现会）。

**Q：想给分享页加水印 / 禁止复制？**
水印用 `renderWatermark` 插槽自行渲染；禁止复制属于浏览器层面的限制，组件不做处理。

**Q：续写按钮点了没反应？**
`onContinue` 默认为空操作。真实项目必须传入并完成「跳回主聊天 → `setContinuedId(最后一条 sessionDetailId)`」这一步，否则后端无从接上下文。

**Q：分享页可以不加登录校验吗？**
可以，而且应该——分享页最典型的访问者就是未登录用户。注意把 `/share` 路由放在 `RequireAuth` 之外，同时确认后端 `shareMessage` 接口允许匿名访问。
