/**
 * 数值与优化 —— 逼近、迭代与取舍
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import anneal from './anneal.js'
import galton from './galton.js'
import monteCarloPi from './monteCarloPi.js'
import kMeans from './kMeans.js'
import sortVisual from './sortVisual.js'
import splineFit from './splineFit.js'
import linreg from './linreg.js'
import powerIter from './powerIter.js'
import antColony from './antColony.js'
import sliceTerrain from './sliceTerrain.js'

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
