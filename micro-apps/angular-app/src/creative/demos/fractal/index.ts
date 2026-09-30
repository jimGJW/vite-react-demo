/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/* eslint-disable */
/**
 * 分形与数学 —— 算一次就够，之后只是查表
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import mandelbrot from './mandelbrot'
import juliaSet from './juliaSet'
import newtonFractal from './newtonFractal'
import logisticMap from './logisticMap'
import primeSpiral from './primeSpiral'
import collatz from './collatz'

export const fractalDemos = [
  mandelbrot,
  juliaSet,
  newtonFractal,
  logisticMap,
  primeSpiral,
  collatz,
]
