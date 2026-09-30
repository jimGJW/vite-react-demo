/**
 * angular-app 自有组件库（ng- 前缀）
 *
 * 定位：与 vue-app 的 `m-*` 组件一一对应，两边都是「纯 SVG / CSS / 原生 API」实现，
 * 不引任何第三方 UI 库，方便对比 Angular signals 与 Vue ref/computed 的写法差异。
 */
export { MiniChartComponent } from './mini-chart.component'
export type { ChartType, DonutDatum } from './mini-chart.component'
export { StatCardComponent } from './stat-card.component'
export { ProgressRingComponent } from './progress-ring.component'
export { CountdownComponent } from './countdown.component'
export { MarqueeComponent } from './marquee.component'
export { EllipsisComponent } from './ellipsis.component'
export { TimelineComponent } from './timeline.component'
export type { TimelineNode } from './timeline.component'
export { TagInputComponent } from './tag-input.component'
export { VirtualListComponent } from './virtual-list.component'
export { ToastHostComponent } from './toast-host.component'

import { MiniChartComponent } from './mini-chart.component'
import { StatCardComponent } from './stat-card.component'
import { ProgressRingComponent } from './progress-ring.component'
import { CountdownComponent } from './countdown.component'
import { MarqueeComponent } from './marquee.component'
import { EllipsisComponent } from './ellipsis.component'
import { TimelineComponent } from './timeline.component'
import { TagInputComponent } from './tag-input.component'
import { VirtualListComponent } from './virtual-list.component'
import { ToastHostComponent } from './toast-host.component'

/** 一次性导入清单：视图 `imports: [...NG_COMPONENTS]` */
export const NG_COMPONENTS = [
  MiniChartComponent, StatCardComponent, ProgressRingComponent, CountdownComponent,
  MarqueeComponent, EllipsisComponent, TimelineComponent, TagInputComponent,
  VirtualListComponent, ToastHostComponent,
]

/** 组件目录：Kit 视图用它渲染清单 */
export const COMPONENT_REGISTRY = [
  { name: 'ng-mini-chart', label: 'SVG 图表', desc: '折线 / 面积 / 柱状 / 环形 / 迷你走势，纯 SVG' },
  { name: 'ng-stat-card', label: '指标卡', desc: '主数值 + 环比 + 迷你走势（涨红跌绿）' },
  { name: 'ng-progress-ring', label: '环形进度', desc: 'SVG 描边 + ng-content 浮层' },
  { name: 'ng-countdown', label: '倒计时', desc: 'linkedSignal 派生 + output() 事件' },
  { name: 'ng-marquee', label: '跑马灯', desc: 'CSS 无缝滚动，hover 暂停' },
  { name: 'ng-ellipsis', label: '多行省略', desc: 'viewChild + 真实测量判断是否溢出' },
  { name: 'ng-timeline', label: '时间轴', desc: '四态色点 + 连接线' },
  { name: 'ng-tag-input', label: '标签输入', desc: 'model() 官方双向绑定' },
  { name: 'ng-virtual-list', label: '虚拟滚动', desc: 'computed 派生可视区间' },
  { name: 'ng-toast-host', label: '提示宿主', desc: '服务 + 单一宿主组件（对照 Portal/Teleport）' },
]
