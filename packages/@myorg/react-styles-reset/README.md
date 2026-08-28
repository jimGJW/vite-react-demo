# @myorg/react-styles-reset

Indigo + Glassmorphism 设计系统的全局样式 Reset。包含：
- `:root` 设计 token（主色、文本/背景、描边、语义色、圆角、阴影、玻璃态参数、动效）
- `body` / `#root` 基础重置 + 全网状背景（渐变 + 多层径向光斑 mesh）
- `h1-h3` / `p` / `a` / `code` / `ul` / `pre` / `::selection` 排版重置
- 细滚动条（Indigo 玻璃态）
- `@media (prefers-reduced-motion: reduce)` 全局动效降级

**零 JS 依赖**（只提供 SCSS/CSS）。所有消费 CSS 变量的组件，都带了 fallback 默认值——即使用方没引入此样式，也会显示正常的 Indigo 风格。

---

## 安装

```bash
# 与 react-svg-charts 等其他 @myorg 包配合使用时：
npm install @myorg/react-styles-reset
```

## 使用

```js
// 推荐：main.jsx 全局入口（只需引入一次）
import '@myorg/react-styles-reset/style.css'
```

如果使用方已经有全局 SCSS 入口，也可以引入源码 SCSS 做二次变量 override：

```scss
@import '@myorg/react-styles-reset/src/styles.scss';
@import '@myorg/react-styles-reset/src/app.scss';
```

---

## 设计 Token 列表（`var(--xxx, fallback)` 即可消费）

| 分类 | 常用 token |
| --- | --- |
| 主色 | `--c-primary` `--c-primary-600` `--c-accent` `--grad-primary` `--grad-primary-3` |
| 文本 | `--c-text-1` `--c-text-2` `--c-text-3` |
| 背景 | `--c-bg` `--c-bg-soft` `--c-card` `--mesh-bg` |
| 语义色 | `--c-success` / `--soft`  `--c-warning` / `--soft`  `--c-danger` / `--soft`  `--c-info` / `--soft` |
| 圆角 | `--r-sm` `--r-md` `--r-lg` `--r-xl` `--r-pill` |
| 阴影 | `--sh-sm` `--sh-md` `--sh-lg` `--sh-glass` |
| 玻璃态 | `--glass-bg` `--glass-bg-strong` `--glass-border` `--glass-blur` |
| 动效 | `--t-fast` `--t` |

---

## 打包 & 发布

```bash
npm install
npm run build
# 产物：dist/index.js  dist/index.cjs  dist/style.css  dist/index.d.ts
npm pack --dry-run    # 本地预览包内容
npm publish           # 发布到 npm / GPR
```
