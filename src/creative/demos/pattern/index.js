/**
 * 几何与图案 —— 一个公式画出整族形状
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import kaleidoscope from './kaleidoscope.js'
import chladni from './chladni.js'
import voronoi from './voronoi.js'
import lsystem from './lsystem.js'
import stringArt from './stringArt.js'
import lissajous from './lissajous.js'
import supershape from './supershape.js'
import attractor from './attractor.js'
import harmonograph from './harmonograph.js'
import polarRose from './polarRose.js'
import truchet from './truchet.js'
import moire from './moire.js'
import hilbert from './hilbert.js'
import maze from './maze.js'
import circlePacking from './circlePacking.js'
import spirograph from './spirograph.js'

export const patternDemos = [
  kaleidoscope,
  chladni,
  voronoi,
  lsystem,
  stringArt,
  lissajous,
  supershape,
  attractor,
  harmonograph,
  polarRose,
  truchet,
  moire,
  hilbert,
  maze,
  circlePacking,
  spirograph,
]
