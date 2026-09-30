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
 * 天体与力学 —— 数值积分出来的轨道与混沌
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import galaxy from './galaxy'
import nbody from './nbody'
import doublePendulum from './doublePendulum'
import lorenz from './lorenz'
import spacetime from './spacetime'
import cloth from './cloth'
import orbitTransfer from './orbitTransfer'
import ballistic from './ballistic'
import robotArm from './robotArm'
import springChain from './springChain'
import magneticPendulum from './magneticPendulum'
import idealGas from './idealGas'
import traffic from './traffic'

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
