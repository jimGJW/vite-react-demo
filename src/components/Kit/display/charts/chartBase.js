/* =====================================================================
 * Kit · 图表共享配置（纯对象/纯函数，无 React 依赖）
 * ===================================================================== */

/** 通用 grid，默认贴边铺满（迷你图不做留白）。 */
export function baseGrid(extra = {}) {
  return { left: 0, right: 0, top: 6, bottom: 0, containLabel: false, ...extra }
}

/** 深色玻璃态 tooltip，浅色/深色主题下都清晰可读。 */
export function tooltipBase(extra = {}) {
  return {
    trigger: 'axis',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 0,
    padding: [6, 10],
    textStyle: { color: '#f1f5f9', fontSize: 12 },
    axisPointer: { type: 'line', lineStyle: { color: 'rgba(148, 163, 184, 0.5)' } },
    ...extra,
  }
}

/** 坐标轴线样式（迷你图用，刻意压淡）。 */
export const AXIS_LINE = { lineStyle: { color: 'rgba(148, 163, 184, 0.35)' } }

/** 分割线样式。 */
export const SPLIT_LINE = { lineStyle: { color: 'rgba(148, 163, 184, 0.16)' } }
