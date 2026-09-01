# @myorg/vue-styles-reset

Indigo + Glassmorphism 设计系统的全局 CSS（Vue 3 版本）。

## 安装

```bash
npm install @myorg/vue-styles-reset
```

## 使用

### 直接引入样式（推荐）

```js
// main.js
import '@myorg/vue-styles-reset/style.css'
```

### 作为组件引入（触发样式加载）

```js
import { DesignTokensReset } from '@myorg/vue-styles-reset'
// 在 Vue 模板中使用（渲染为空，仅触发样式）
```

## 包含内容

- `:root` 设计 token（主色 / 文本 / 背景 / 圆角 / 阴影 / 玻璃态 / 动效）
- `body` / `#app` 重置
- 标题 / 链接 / code / 列表 / 滚动条样式
- `prefers-reduced-motion` 媒体查询支持
- 玻璃态应用外壳样式（`.app-shell` / `.app-header` / `.page-card` / `.btn` 等）

与 `@myorg/react-styles-reset` 共享同一套 CSS，纯样式与框架无关。
