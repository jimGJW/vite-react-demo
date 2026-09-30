/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 粒子与渲染 —— 万级实体怎么保持流畅
 *
 * 本组的顺序就是页面左栏的顺序，也是 DEMOS 里的下标顺序。
 * 增删条目后不用手改任何下标：DEMO_GROUPS 的 from/to 由 `groups.js` 累积推导。
 */
import particleText from './particleText.js'
import pointCloud from './pointCloud.js'
import fireflies from './fireflies.js'
import boids from './boids.js'
import terrain from './terrain.js'
import raymarch from './raymarch.js'
import lowPoly from './lowPoly.js'
import asciiArt from './asciiArt.js'
import halftone from './halftone.js'
import dithering from './dithering.js'
import pixelSort from './pixelSort.js'
import depthOfField from './depthOfField.js'
import chromaticWarp from './chromaticWarp.js'

export const renderDemos = [
  particleText,
  pointCloud,
  fireflies,
  boids,
  terrain,
  raymarch,
  lowPoly,
  asciiArt,
  halftone,
  dithering,
  pixelSort,
  depthOfField,
  chromaticWarp,
]
