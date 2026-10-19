# Motion · 全局动效插件

整个项目的「动效中枢」，集中维护所有共享动画与微交互。所有效果均走 `--c-*` / `--r-*` / `--sh-*` 主题变量，明暗主题自动适配，并统一尊重系统「减少动效」偏好。

## 已自动生效（无需改业务代码）

- **路由切换过渡**：`<PageTransition>` 包裹 `<Outlet>`，每次跳转页面淡入上浮。
- **卡片悬停上浮**：`.page-card` 与 antd `Card` 悬停时上浮 4px + 柔光 + 主色描边。
- **按钮按压回弹**：antd `Button` 按下时 `scale(0.96)`。
- **表格行悬停**：antd Table 行悬停时左侧主色高亮条。
- **标题流光** / **按钮流光**：给标题加 `.m-shine-text`、给按钮加 `.m-shimmer-btn` 即有流光。

## 工具类（直接挂到任意元素）

入场：`m-fade` `m-fade-up` `m-fade-down` `m-fade-left` `m-fade-right` `m-zoom-in` `m-zoom-out` `m-pop`
循环：`m-float` `m-pulse` `m-pulse-ring` `m-spin-slow` `m-breathe` `m-wobble`
延迟：`m-delay-1` ~ `m-delay-6`（或 inline `style={{ animationDelay }}`）

```jsx
<h1 className="m-pop">欢迎</h1>
<div className="m-float">漂浮图标</div>
<button className="m-shimmer-btn">加载中</button>
```

## 错峰入场

```jsx
<ul className="m-stagger">
  {items.map((it, i) => (
    <li key={it} className="m-stagger-item" style={{ '--i': i }}>{it}</li>
  ))}
</ul>
```

## React 组件

```jsx
import { Reveal, Motion, PageTransition, useTilt, useCountUp } from '@/motion'

// 滚动到视口才揭示
<Reveal type="fade-up" delay={0.1}>
  <Card>…</Card>
</Reveal>

// 命令式动画
<Motion type="zoom-in" duration={0.6}>…</Motion>

// 鼠标 3D 倾斜
const { ref, onMouseMove, onMouseLeave } = useTilt({ max: 8 })
<div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>…</div>

// 数字滚动
const n = useCountUp(1234, { decimals: 0 })
<span>{n}</span>
```

## 调速

在根节点设置 `data-motion="slow"` 或 `"fast"` 即可整体调整速度（覆盖 `--m-speed`）。

## 文件

- `motion.scss` — keyframes + 工具类 + 全局基础增强
- `index.jsx` — `Reveal` / `Motion` / `PageTransition` / `MotionProvider` + 导出 hooks
- `hooks/` — `useReveal` / `useReducedMotion` / `useTilt` / `useCountUp`
