# PerfLab 性能实验室

一组解决「页面卡」的可复用能力：虚拟滚动、帧率采样、渲染计数、Web Worker 分流。
零第三方依赖，纯函数部分可直接用 node 跑断言。

```
src/components/PerfLab/
├── virtual.js        纯函数：可见区间计算 / 帧率汇总 / 折线坐标
├── VirtualList.jsx   定高虚拟滚动列表组件
├── useFps.js         FPS 采样 Hook
├── RenderTally.jsx   渲染次数计数徽标
├── workerClient.js   Worker 封装 + 一组 CPU 密集型纯函数
├── PerfLab.scss      样式（消费 --c-* 变量）
└── index.js          统一出口
```

演示页：`src/pages/PerfLabDemo/`，路由 `/perf-lab`。

---

## 1. VirtualList 虚拟滚动

只渲染视口内的行，10 万行数据在 DOM 里也只有约 20 个节点。

```jsx
import { VirtualList } from '@/components/PerfLab'

<VirtualList
  items={rows}          // 任意数组
  itemHeight={36}       // 每行固定高度（px），定高方案的前提
  height={360}          // 容器可视高度（px）
  overscan={4}          // 上下各多渲染几行做缓冲，防快速滚动露白
  renderItem={(row, i) => (
    <div key={row.id} className="row">{row.name}</div>   // key 必须用业务 id
  )}
  onStatsChange={({ rendered, total }) => { /* 可用于展示对比 */ }}
/>
```

**注意**：`renderItem` 返回的元素必须自带 `key`，且用业务 id 不要用数组下标 ——
下标作 key 时插入/删除行会让 React 复用错节点。

## 2. useFps 帧率采样

```jsx
import { useFps } from '@/components/PerfLab'

const { fps, history } = useFps({ running: true, sampleMs: 500, keep: 60 })
// fps:     当前帧率
// history: 最近 60 个采样点，可直接喂给折线图
```

每 `sampleMs`（默认 500ms）汇总一次才 setState。
**不要改成每帧 setState** —— 那样测出来的是「监控组件自己的开销」，结论失真。

## 3. RenderTally 渲染计数

```jsx
import { RenderTally } from '@/components/PerfLab'

function Child() {
  return <div>子组件 <RenderTally label="渲染" /></div>
}
```

计数用 `ref + effect` 直接写 `textContent`，不用 state —— 用 state 计数等于「数自己」，
每数一次就再渲染一次，观测结果被污染。渲染期读写 `ref.current` 也会被
React Compiler 规则拦下，所以递增放在 effect 里。

## 4. createWorker Web Worker

```js
import { createWorker, crunch } from '@/components/PerfLab'

const worker = createWorker(crunch)          // 把纯函数变成 Worker
const result = await worker.run({ n: 32, size: 200000 })
worker.terminate()                           // 用完务必销毁
```

函数源码会被字符串化搬进 Worker，所以**传入的函数必须自包含**，
不能引用外部闭包变量（这是 Worker 的固有限制）。

配套的三个纯函数既能在主线程跑也能在 Worker 跑，方便做对照实验：

| 函数 | 作用 |
|---|---|
| `fib(n)` | 朴素递归斐波那契，纯 CPU 消耗 |
| `sortHuge(size)` | 生成并排序大数组，只返回长度 |
| `crunch({ n, size })` | 两者叠加的综合负载 |

---

## 纯函数 API（可单测）

| 函数 | 说明 |
|---|---|
| `clamp(n, min, max)` | 区间截断，非数字回落 min |
| `computeVisibleRange({ scrollTop, viewportHeight, itemHeight, total, overscan })` | 返回 `{ start, end, padTop, padBottom, offsetTop, totalHeight, rendered }`，`end` 为开区间 |
| `summarizeFrames(durations, budget)` | 帧间隔数组 → `{ avgFps, minFps, maxFps, p95Fps, jank, jankRatio, worstFrame }`，掉帧判定为单帧 > 2 倍预算（约 33ms） |
| `toPolylinePoints(series, box, max)` | fps 序列 → SVG `polyline` 的 points 字符串，上限默认 60fps |

单测见 `tests/unit/perf-lab.test.mjs`。
