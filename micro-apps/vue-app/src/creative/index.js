/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 创意 demo 合集 —— **框架无关**的纯 canvas 实现，唯一对外入口。
 *
 * 目录结构
 * --------
 *   src/creative/
 *   ├── index.js              本文件：汇总出 DEMOS / DEMO_GROUPS
 *   ├── groups.js             分组表（唯一手工维护的分组信息）
 *   ├── utils/                math / canvas / color 三个公共工具模块
 *   └── demos/
 *       ├── field/            场与流体（10）
 *       ├── cellular/         元胞自动机与自组织（14）
 *       ├── mechanics/        天体与力学（13）
 *       ├── pattern/          几何与图案（16）
 *       ├── render/           粒子与渲染（13）
 *       ├── fractal/          分形与数学（6）
 *       └── numeric/          数值与优化（10）
 *
 * 为什么拆这么细：原来是单文件一万行，改一个 demo 要在里面翻半天，而且 82 个 demo
 * 的 diff 永远糊在一起。现在一个 demo 一个文件，「谁引用了哪个工具」「哪组有几项」
 * 都是一眼的事；顺带把噪声 / 色表 / 离屏缓冲这些公共件收敛到 utils/。
 *
 * 三端同步：这份目录是唯一真相，另两份拷贝（vue-app / angular-app 下的 creative/）
 * 由 `scripts/sync-creative-demos.mjs` 整体镜像生成，别直接手改。
 *
 * 薄壳只依赖下面这个契约，不依赖任何框架 API：
 *
 *   create(ctx) → {
 *     resize(w, h)          画布 CSS 尺寸变了（ctx 已按 dpr 设好 transform，按 CSS px 画）
 *     frame(ts, dt)         逐帧：ts = 毫秒时间戳，dt = 秒（调用方已 clamp 到 ≤ 0.05）
 *     pointer(kind, x, y)   kind ∈ 'down' | 'move' | 'up' | 'leave'；x/y 是画布内 CSS px
 *     setParam(key, value)  参数控件变化
 *     action(key)           动作按钮
 *     destroy()             清理（本项目里都是无状态 demo，基本是空实现）
 *   }
 *
 * 每个 demo 的写法约定见 `src/creative/README.md`（四条硬约定，都是踩过坑之后定下来的）。
 */
import { SECTIONS } from './groups.js'

/**
 * 全集 —— **顺序即页面左栏的显示顺序**。
 * 由 SECTIONS 摊平而来，所以 DOM 里 `[data-pg="demo"]` 的先后永远等于本数组下标
 * （`scripts/playground-probe.mjs` 拿这个当结构断言）。
 */
export const DEMOS = SECTIONS.flatMap((s) => s.demos)

/**
 * 分组元信息 —— `from` 是段起点在 DEMOS 里的下标（含），`to` 是终点（含）。
 *
 * 下标由 SECTIONS 累积推出、不手写：增删 demo 后这里不可能算错。
 * 单测里「分组表恰好铺满 DEMOS（连续、不重叠、不漏项）」现在是一条恒等式，
 * 留着它主要是防止有人把这里改回手写下标。
 */
export const DEMO_GROUPS = SECTIONS.reduce((acc, s) => {
  const from = acc.length ? acc[acc.length - 1].to + 1 : 0
  acc.push({ label: s.label, hint: s.hint, from, to: from + s.demos.length - 1 })
  return acc
}, [])
