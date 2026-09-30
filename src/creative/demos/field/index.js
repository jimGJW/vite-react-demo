/**
 * 场与流体 —— 粒子替你把场走一遍
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import flowField from './flowField.js'
import water from './water.js'
import magnet from './magnet.js'
import lightning from './lightning.js'
import smoke from './smoke.js'
import vortexStreet from './vortexStreet.js'
import waveInterference from './waveInterference.js'
import plasma from './plasma.js'
import turbulence from './turbulence.js'
import aurora from './aurora.js'

export const fieldDemos = [
  flowField,
  water,
  magnet,
  lightning,
  smoke,
  vortexStreet,
  waveInterference,
  plasma,
  turbulence,
  aurora,
]
