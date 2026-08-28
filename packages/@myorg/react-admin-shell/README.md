# @myorg/react-admin-shell

后台管理应用「外壳」组合件：带玻璃态导航的 Layout、全局可拖拽 AI Agent 气泡、Playwright E2E 测试中心。

> 这是一组**强依赖**组合包：peerDependencies 包含 antd / react-router-dom / @huggingface/transformers / lodash / antd-form-builder / onnxruntime-web / @myorg/react-core-hooks。如果你的项目不需要这些依赖，直接使用 `@myorg/react-ui-basic`（零外部依赖）即可。

## 组件一览

| 组件 | 依赖 | 说明 |
| --- | --- | --- |
| `AdminLayout` | react-router-dom + `@myorg/react-core-hooks` | 玻璃态顶部导航 + 分组下拉菜单 + Outlet + 用户信息卡 + 登出，嵌入 `GlobalAgent` 气泡 |
| `GlobalAgent` | react-router-dom + `UniversalPageAgent`（含 antd icons/transformers/antd-form-builder/onnxruntime-web） | 可拖拽悬浮 AI Agent 气泡，快捷键 `Ctrl+Shift+A` 呼出面板，支持自然语言驱动页面操作（点击/滚动/跳转/填表等） |
| `UniversalPageAgent` | antd / antd icons / @huggingface/transformers / lodash / antd-form-builder | 「通用页面 Agent」引擎：繁体→简体归一化、语音指令识别、DOM 语义元素提取与可执行动作编排 |
| `TestCenter` | 可选 prop-types / lodash | Python Playwright E2E 测试中心：按分组展示用例、一键运行、实时日志、失败详情，适合把页面测试脚本集中管理。shell 里只是前端 UI，真正执行 Python 脚本请配置后端或使用主项目的测试中心页面实现 |

---

## 安装

```bash
# 最低依赖（只使用 AdminLayout / TestCenter 无 AI 功能）：
npm install @myorg/react-admin-shell @myorg/react-core-hooks react react-dom react-router-dom

# 完整依赖（启用 GlobalAgent + UniversalPageAgent AI 功能）：
npm install antd @ant-design/icons @ant-design/v5-patch-for-react-19 \
            lodash prop-types onnxruntime-web antd-form-builder \
            @huggingface/transformers
```

```js
// main.jsx
import '@myorg/react-admin-shell/style.css'
import '@myorg/react-styles-reset/style.css'   // 推荐，统一设计 token
```

## 快速使用

```jsx
// 路由入口
import { AdminLayout } from '@myorg/react-admin-shell'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AdminLayout
        brand={<span>⚡ 控制台</span>}
        showFooter
      />
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: '/users', element: <Users /> },
    ],
  },
])
```

```jsx
// 在任何页面放全局可拖拽 AI 气泡：
import { GlobalAgent } from '@myorg/react-admin-shell'
export default function App() { return <><Outlet /><GlobalAgent /></> }
```

```jsx
// 测试中心页面：
import { TestCenter } from '@myorg/react-admin-shell'
<TestCenter
  cases={[
    { group: '首页', id: 'login-success', name: '登录成功跳转首页', cmd: 'python tests/test_pages.py -k login' },
    { group: '图表', id: 'charts-switch',  name: '图表类型切换', cmd: 'python tests/test_pages.py -k charts' },
  ]}
  onRunCase={(c) => window.alert('执行：' + c.cmd)}  // 真实环境换成 fetch() 调后端执行器
/>
```

---

## 打包 & 发布

```bash
npm install
npm run build
npm pack --dry-run
npm publish
```
