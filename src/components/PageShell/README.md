# PageShell · 全站统一页面外壳

38 个页面共用的一套「页头 + 栅格 + 分节 + KPI」骨架。目标不是少写几行 JSX，
而是让美化 / 动效 / 布局的规则**只有一个修改点**：改 `PageShell.scss` 或
`src/index.scss` 的 token，全站一起变。

依赖：`@/motion`（`<Animate>`、`.m-stagger`、`.m-aurora` 等）+ `src/index.scss` 的
`--sp-*` / `--r-*` / `--sh-*` / `--c-*` token。暗色主题（`[data-theme='dark']`）自动跟随，
因为外壳只消费变量、不写死颜色。

## 组成

| 文件 | 职责 |
| --- | --- |
| `index.jsx` | `Page` / `Section` / `Kpi` 三个组件 |
| `pageShellStyle.js` | 纯函数：强调色、间距、错峰序号 → CSS 变量（可单测） |
| `PageShell.scss` | `.pg-*` 样式层 |
| `../../../tests/unit/page-shell.test.mjs` | 令牌解析 + 类名/ token 对齐守卫 |

## 用法

```jsx
import { Page, Section, Kpi } from '@components/PageShell/index.jsx'

<Page
  eyebrow={t('geo.eyebrow')}
  title={t('geo.title')}
  subtitle={t('geo.sub')}
  accent="cyan"                 // primary|accent|cyan|success|warning|danger|info，或 '#08979c'
  gap="xl"                      // none|xs|sm|md|lg|xl|2xl|3xl|fluid，或 '20px'
  shine                         // 可选：标题流光
  actions={<Button icon={<ReloadOutlined />} onClick={refresh} />}
>
  <Section title={t('geo.kpi')} extra={<Segmented options={sizes} />}>
    <div className="pg-kpis m-stagger">
      {stats.map((s, i) => <Kpi key={s.key} index={i} {...s} />)}
    </div>
  </Section>

  <Section title={t('geo.list')}>
    <div className="pg-grid">…</div>          {/* 卡片继续用 .page-card */}
  </Section>

  <footer className="pg-foot">{t('geo.updated', { time })}</footer>
</Page>
```

eyebrow / title / subtitle / actions 四项全空时自动省略页头（只剩栅格），
纯装饰的极光氛围层可用 `aurora={false}` 关掉（登录页、嵌入页建议关）。

## 三条硬约定

1. **强调色走名字**：`accent="cyan"` → `var(--c-accent-2)`。写 `'red'`（裸单词）会被判非法并
   丢弃，因为自定义属性照收非法值时，消费处 `var(--pg-accent, 兜底)` 的兜底不会生效，
   颜色会静默继承错值；渐变同理被拒（`--pg-accent` 会被 `color-mix()` 消费）。
2. **间距走刻度**：`gap="xl"` → `var(--sp-xl)`，不要在页面里手写 `marginBottom: 18`。
3. **错峰序号有上限**：`stagger(i)` 把 `--i` 钳到 `STAGGER_MAX = 12`，30 项列表不会让最后一项等 2 秒。

## 卡片为什么不在这里定义

`.page-card` 已被 19 个文件使用，且 `motion.scss` 给了它 hover 上浮。再造一套
`.pg-card` 只会让「同一个圆角两种写法」长期并存。外壳只负责**排布与页头**。

## 无障碍 / 降级

- 页头入场用 `<Animate name="fadeInDown">`，`useReducedMotion` 为真时不加动画类。
- `prefers-reduced-motion: reduce` 下氛围层 `.pg-aurora` 直接隐藏，KPI hover 位移取消。
- 氛围层 `aria-hidden="true"` + `pointer-events: none`，不进入朗读顺序也不拦点击。
