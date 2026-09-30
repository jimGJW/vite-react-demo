/**
 * vue-app 自有组件库（m- 前缀）
 *
 * 定位：与 Element Plus 形成互补 —— EP 负责「通用企业级控件」，
 * 这里补齐 EP 没有或不便自定义的：SVG 图表、签名板、跑马灯、虚拟滚动、
 * 下拉刷新、触底加载、拖拽排序、环形进度、标签输入、异步选择器、时间轴。
 *
 * 全部零第三方依赖（只用 Vue 官方 API），可整体复制到其它 Vue 工程。
 */
import './styles.css'

export { default as MChart } from './MChart.vue'
export { default as MStatCard } from './MStatCard.vue'
export { default as Marquee } from './Marquee.vue'
export { default as Ellipsis } from './Ellipsis.vue'
export { default as Countdown } from './Countdown.vue'
export { default as ProgressRing } from './ProgressRing.vue'
export { default as SignaturePad } from './SignaturePad.vue'
export { default as TagInput } from './TagInput.vue'
export { default as AsyncSelect } from './AsyncSelect.vue'
export { default as VirtualList } from './VirtualList.vue'
export { default as PullRefresh } from './PullRefresh.vue'
export { default as InfiniteScroll } from './InfiniteScroll.vue'
export { default as Timeline } from './Timeline.vue'
export { default as DraggableList } from './DraggableList.vue'

/** 组件清单：KitPage 用它自动渲染「组件目录」并把每个组件挂到 `app.component()` */
export const COMPONENT_REGISTRY = [
  { name: 'MChart', label: 'SVG 图表', desc: '折线 / 面积 / 柱状 / 环形 / 迷你走势，纯 SVG 零依赖' },
  { name: 'MStatCard', label: '指标卡', desc: '主数值 + 环比趋势 + 迷你走势，涨红跌绿' },
  { name: 'ProgressRing', label: '环形进度', desc: 'SVG 描边进度 + 中心浮层插槽' },
  { name: 'Countdown', label: '倒计时', desc: '开始/暂停/重置 ±10s，进度环联动' },
  { name: 'Marquee', label: '跑马灯', desc: 'CSS 无缝滚动，hover 暂停，支持竖向' },
  { name: 'Ellipsis', label: '多行省略', desc: '按行数截断 + 自动判断是否需要「展开」' },
  { name: 'Timeline', label: '时间轴', desc: '四态色点 + 连接线 + 插槽' },
  { name: 'TagInput', label: '标签输入', desc: '回车/逗号成标签、去重、上限、退格删除' },
  { name: 'AsyncSelect', label: '异步选择器', desc: '远程搜索 + 防抖 + 键盘上下选择 + 空态' },
  { name: 'VirtualList', label: '虚拟滚动', desc: '只渲染可视窗口，万级数据不掉帧' },
  { name: 'PullRefresh', label: '下拉刷新', desc: '指针事件 + 阻尼曲线 + 阈值判定' },
  { name: 'InfiniteScroll', label: '触底加载', desc: '滚动到底自动 loadMore + 终止态' },
  { name: 'DraggableList', label: '拖拽排序', desc: 'HTML5 draggable，v-model 双向绑定数组' },
  { name: 'SignaturePad', label: '签名板', desc: 'Canvas 绘制 + 撤销 + 导出 PNG' },
]
