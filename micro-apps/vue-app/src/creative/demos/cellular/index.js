/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 元胞自动机与自组织 —— 局部规则长出全局秩序
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import life from './life.js'
import elementaryCa from './elementaryCa.js'
import langtonAnt from './langtonAnt.js'
import sandpile from './sandpile.js'
import ising from './ising.js'
import grayScott from './grayScott.js'
import physarum from './physarum.js'
import dla from './dla.js'
import belousov from './belousov.js'
import forestFire from './forestFire.js'
import cyclicCA from './cyclicCA.js'
import crystalGrowth from './crystalGrowth.js'
import latticeGas from './latticeGas.js'
import slimeMaze from './slimeMaze.js'

export const cellularDemos = [
  life,
  elementaryCa,
  langtonAnt,
  sandpile,
  ising,
  grayScott,
  physarum,
  dla,
  belousov,
  forestFire,
  cyclicCA,
  crystalGrowth,
  latticeGas,
  slimeMaze,
]
