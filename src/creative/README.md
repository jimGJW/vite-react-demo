# src/creative —— 框架无关的创意 demo 合集

82 个纯 canvas 的「算法 + 逐帧绘制」demo，不含任何框架 API。
React 主应用、Vue 子应用、Angular 子应用三份薄壳共用同一份实现。

## 目录

```
src/creative/
├── README.md          本文件
├── index.js           唯一对外入口：汇总出 DEMOS / DEMO_GROUPS
├── groups.js          分组表（唯一手工维护的分组信息）
├── utils/             公共工具
│   ├── math.js        数值：clamp / rand / TAU / hash2 / valueNoise / fbm / makeStepper …
│   ├── canvas.js      画布：BG / makePalette / makeFieldBuffer / fitCanvas …
│   └── color.js       颜色：hsl2rgb / makeRgbLut …
└── demos/             每 demo 一文件，按主题分目录
    ├── field/         场与流体（10）
    ├── cellular/      元胞自动机与自组织（14）
    ├── mechanics/     天体与力学（13）
    ├── pattern/       几何与图案（16）
    ├── render/        粒子与渲染（13）
    ├── fractal/       分形与数学（6）
    └── numeric/       数值与优化（10）
```

每个分组目录有自己的 `index.js`，导出 `<dir>Demos` 数组 —— **数组顺序即页面左栏顺序**。
`groups.js` 只声明「哪几组、每组叫什么」，`DEMO_GROUPS` 的 `from/to` 由下标累积推导，
所以增删 demo 后不可能算错下标（单测里那条「分组表恰好铺满」现在是一条恒等式）。

## 契约

```js
export default {
  id, title, tag, desc, bg,
  params:  [{ key, label, min, max, step, value }],
  actions: [{ key, label }],
  create(ctx) {
    return {
      resize(w, h)          // ctx 已按 dpr 设好 transform，一律按 CSS px 画
      frame(ts, dt)         // ts = 毫秒时间戳，dt = 秒（薄壳已 clamp 到 ≤ 0.05）
      pointer(kind, x, y)   // kind ∈ 'down' | 'move' | 'up' | 'leave'
      setParam(key, value)
      action(key)
      destroy()
    }
  },
}
```

## 四条硬约定（全是踩过坑才定下来的）

**0. `frame` 的第一个形参永远是 `ts`。**
写成 `frame(dt)` 会让 `dt` 收到毫秒时间戳（几十万），所有物理量瞬间变成天文数字，
而且画面只是「不对劲」不是「报错」，极难定位。ESLint 的 `args: 'after-used'`
本来就不报未使用的尾部形参，所以**不要写 `void ts`**（写了会被 `no-useless-assignment` 拦）。

**1. 逐像素算法先写低分辨率离屏缓冲，再整体放大贴回。**
用 `makeFieldBuffer(scale)`。全屏逐像素（比如 1600×900）每帧算一遍必掉帧。

**2. 写进 `ImageData` 的颜色必须是数值。**
把 `hsla(...)` 这种字符串塞进 `Uint8ClampedArray` 会得到**全黑且不报错**。
用 `hsl2rgb` / `makeRgbLut` 生成 `Uint8Array` 查色表。

**3. 进页面 1.5s 内必须有可见输出。**
探针（`scripts/playground-probe.mjs`）每个 demo 只等 1.5s 就采样画布。
逐帧推进型的 demo 要给足初始进度；「长满之后清空重来」这类设计会让画面有七成时间是黑的 ——
`l-system`（清屏那一瞬全黑）和 `lightning`（闪电只亮 420ms、间隔 900ms）都栽在这条上。

**4. 多实体要按颜色分桶。**
同色线段攒够一批再一次 `beginPath`/`stroke`，不要每个实体一次 —— 几千实体时会掉到个位数帧率。

## 三端同步

本目录是唯一真相。`scripts/sync-creative-demos.mjs` 会把整棵树镜像到：

- `micro-apps/vue-app/src/creative/`（原样复制，`.js`）
- `micro-apps/angular-app/src/creative/`（改后缀为 `.ts`，并去掉相对 import 的 `.js`）

**别直接手改那两份拷贝。** 改完源目录跑 `npm run sync:demos`。

## 校验

- `npm test` —— `tests/unit/creative-demos.test.mjs` 用假 2D context 把 82 个 demo 各跑 20 帧
- `npm run test:ssr` —— 断言页面真的渲染出分组标题与若干 demo 标题
- `npm run test:browser` —— CDP 逐路由抓 console error
- `node scripts/playground-probe.mjs` —— 逐 demo 点开、采样画布像素、断言参数控件数
