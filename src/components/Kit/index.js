/* =====================================================================
 * Kit · 统一出口
 * ---------------------------------------------------------------------
 * 组件按能力分三组：交互（interaction）/ 展示（display）/ 表单（form）。
 * 另导出 4 个 Hook 与一组纯函数工具，可脱离组件单独使用。
 *
 * 全部组件零业务耦合、零内部依赖，样式走 `--c-*` 主题变量且带 fallback，
 * 可直接整目录复制到其他项目使用。
 *
 * 来源：旧移动端项目（移动端）/ 旧平板端项目（平板端）——
 * 逐组件的移植说明见同目录 README.md。
 * ===================================================================== */

import './kit.scss'

/* —— 交互 —— */
export { default as SignaturePad } from './interaction/SignaturePad.jsx'
export { default as PullToRefresh } from './interaction/PullToRefresh.jsx'
export { default as InfiniteScroll } from './interaction/InfiniteScroll.jsx'
export { default as FloatingBall } from './interaction/FloatingBall.jsx'
export { default as SortableList } from './interaction/SortableList.jsx'
export { default as AutoScrollText } from './interaction/AutoScrollText.jsx'

/* —— 展示 —— */
export { default as Ellipsis } from './display/Ellipsis.jsx'
export { default as StatCard } from './display/StatCard.jsx'
export { default as Countdown } from './display/Countdown.jsx'
export { default as NoticePanel } from './display/NoticePanel.jsx'
export { default as MiniArea } from './display/charts/MiniArea.jsx'
export { default as MiniBar } from './display/charts/MiniBar.jsx'
export { default as MiniProgress } from './display/charts/MiniProgress.jsx'
export { default as WaterWave } from './display/charts/WaterWave.jsx'
export { default as TimelineChart } from './display/charts/TimelineChart.jsx'

/* —— 表单 —— */
export { default as TagInput } from './form/TagInput.jsx'
export { default as AsyncSelect } from './form/AsyncSelect.jsx'
export { default as TimeRangeInput } from './form/TimeRangeInput.jsx'

/* —— Hook —— */
export { useCountdown, useFormattedDuration, useInView, useOverflow } from './hooks.js'

/* —— 纯函数 —— */
export * from './utils.js'
