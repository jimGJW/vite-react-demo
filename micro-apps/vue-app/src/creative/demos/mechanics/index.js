/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 天体与力学 —— 数值积分出来的轨道与混沌
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import galaxy from './galaxy.js'
import nbody from './nbody.js'
import doublePendulum from './doublePendulum.js'
import lorenz from './lorenz.js'
import spacetime from './spacetime.js'
import cloth from './cloth.js'
import orbitTransfer from './orbitTransfer.js'
import ballistic from './ballistic.js'
import robotArm from './robotArm.js'
import springChain from './springChain.js'
import magneticPendulum from './magneticPendulum.js'
import idealGas from './idealGas.js'
import traffic from './traffic.js'

export const mechanicsDemos = [
  galaxy,
  nbody,
  doublePendulum,
  lorenz,
  spacetime,
  cloth,
  orbitTransfer,
  ballistic,
  robotArm,
  springChain,
  magneticPendulum,
  idealGas,
  traffic,
]
