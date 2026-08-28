# @myorg/react-ui-basic

纯 React + 原生 SCSS 的通用 UI 组件合集。**零外部 UI 库依赖**（不依赖 antd / MUI 等），所有样式消费 `@myorg/react-styles-reset` 的设计 token，使用方不引入 styles 时也会用 fallback 默认值正常显示 Indigo 玻璃态风格。

包含 5 类组件：

| 组件 | 说明 |
| --- | --- |
| `ThemeProvider` / `ThemeToggle` / `useTheme` | 三态主题（light / dark / auto），持久化到 localStorage + 跟随系统，用 `data-theme` 属性切换 |
| `NotificationProvider` / `NotificationDrawer` / `useNotification` | 零依赖通知中心：Toast 堆叠 + 历史抽屉 + 未读计数 + 自动消失进度条，`notify/success/warning/error/info` 方法 |
| `CommandPalette` | 全局命令面板（默认快捷键 `Cmd/Ctrl + K`），关键字模糊搜索 + 回车直接跳转 |
| `DataTable` | 零依赖通用数据表格：列定义、列排序、搜索过滤、分页、行选择、行点击回调 |
| `StarArray` + `STARS` | 365 颗星辰周天防御大阵：5 层同心环反向旋转 + 环内流动 + 径向跨环脉动，每颗星可点击查看真实数据 |

---

## 安装

```bash
npm install @myorg/react-ui-basic react react-dom
# 推荐同时引入设计 token（不是必须）：
npm install @myorg/react-styles-reset
```

```js
// main.jsx：引入样式（只需一次）
import '@myorg/react-styles-reset/style.css'  // 可选
import '@myorg/react-ui-basic/style.css'      // 必选
```

## 快速使用

### 三态主题

```jsx
import { ThemeProvider, ThemeToggle, useTheme } from '@myorg/react-ui-basic'
createRoot(rootEl).render(
  <ThemeProvider defaultTheme="auto">
    <ThemeToggle />
  </ThemeProvider>
)
```

### 通知中心

```jsx
import { NotificationProvider, NotificationDrawer, useNotification } from '@myorg/react-ui-basic'

function Header() {
  const { success, error } = useNotification()
  return (
    <header>
      <button onClick={() => success('保存成功', '表单已更新')}>保存</button>
      <NotificationDrawer />
    </header>
  )
}

createRoot(rootEl).render(
  <NotificationProvider><Header /></NotificationProvider>
)
```

### 周天星辰大阵（首页特效）

```jsx
import { StarArray, STARS, TOTAL_DEGREES } from '@myorg/react-ui-basic'

export default function HomePage() {
  return (
    <StarArray
      radius={280}
      onStarClick={(star, e) => alert(`${star.name} · ${star.chineseName}  ${star.magnitude} 等星`)}
    />
  )
}
```

---

## 打包 & 发布

```bash
npm install
npm run build
# 产物：dist/index.js / index.cjs / style.css + 每个组件单独的 .d.ts
npm pack --dry-run
npm publish
```
