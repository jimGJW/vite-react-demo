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
 * 创意 demo 的分组表 —— **唯一手工维护的分组信息**。
 *
 * 为什么不做成「从 DEMOS 里按 from/to 圈段」：那样每次增删 demo 都要重算一堆下标，
 * 错一位就是整组贴错标签，而且只能靠单测事后发现。这里改成「先分组、再摊平」，
 * 下标由代码推出来，结构上就不可能错位。
 *
 * 页面左栏的手风琴、`scripts/playground-probe.mjs` 的结构断言都读这张表。
 */
import { fieldDemos } from './demos/field/index'
import { cellularDemos } from './demos/cellular/index'
import { mechanicsDemos } from './demos/mechanics/index'
import { patternDemos } from './demos/pattern/index'
import { renderDemos } from './demos/render/index'
import { fractalDemos } from './demos/fractal/index'
import { numericDemos } from './demos/numeric/index'

export const SECTIONS = [
  {
    dir: 'field',
    label: '场与流体',
    hint: '粒子替你把场走一遍',
    demos: fieldDemos,
  },
  {
    dir: 'cellular',
    label: '元胞自动机与自组织',
    hint: '局部规则长出全局秩序',
    demos: cellularDemos,
  },
  {
    dir: 'mechanics',
    label: '天体与力学',
    hint: '数值积分出来的轨道与混沌',
    demos: mechanicsDemos,
  },
  {
    dir: 'pattern',
    label: '几何与图案',
    hint: '一个公式画出整族形状',
    demos: patternDemos,
  },
  {
    dir: 'render',
    label: '粒子与渲染',
    hint: '万级实体怎么保持流畅',
    demos: renderDemos,
  },
  {
    dir: 'fractal',
    label: '分形与数学',
    hint: '算一次就够，之后只是查表',
    demos: fractalDemos,
  },
  {
    dir: 'numeric',
    label: '数值与优化',
    hint: '逼近、迭代与取舍',
    demos: numericDemos,
  },
]
