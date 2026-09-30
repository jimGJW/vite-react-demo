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
 * 数值与优化 —— 逼近、迭代与取舍
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import anneal from './anneal'
import galton from './galton'
import monteCarloPi from './monteCarloPi'
import kMeans from './kMeans'
import sortVisual from './sortVisual'
import splineFit from './splineFit'
import linreg from './linreg'
import powerIter from './powerIter'
import antColony from './antColony'
import sliceTerrain from './sliceTerrain'

export const numericDemos = [
  anneal,
  galton,
  monteCarloPi,
  kMeans,
  sortVisual,
  splineFit,
  linreg,
  powerIter,
  antColony,
  sliceTerrain,
]
