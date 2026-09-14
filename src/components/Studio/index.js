/* =====================================================================
 * Studio · 组件工坊 统一出口
 * ---------------------------------------------------------------------
 * 从本地 80+ 存量前端项目里筛选、去业务化、零依赖重写而成的可复用组件。
 * 按来源能力分十个分组（每组有自己的子出口）：
 *   screen  · 大屏 / BI 可视化
 *   builder · 规则与编排
 *   media   · 图像与标注
 *   form    · 表单与树
 *   report  · 报告与溯源
 *   nav     · 导航与多标签工作区
 *   table   · 表格增强（高亮 / 树表 / 行内编辑）
 *   layout  · 自由拖拽布局
 *   viz     · 可视化交互（仪表盘 / 3D 轮播 / 帧播放）
 *   util    · 工具（右键菜单 / 错误边界 / 全屏）
 *
 * 全部组件零业务耦合、零内部依赖，样式走 --c-* 主题变量且带 fallback，
 * 可直接整目录复制到其他项目使用。逐组件移植说明见同目录 README.md。
 * ===================================================================== */

import './studio.scss'

export * from './screen/index.js'
export * from './builder/index.js'
export * from './media/index.js'
export * from './form/index.js'
export * from './report/index.js'
export * from './nav/index.js'
export * from './table/index.js'
export * from './layout/index.js'
export * from './viz/index.js'
export * from './util/index.js'
