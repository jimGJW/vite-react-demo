
export const rnd = (min, max) => Math.round(min + Math.random() * (max - min))
export const seriesNames = ['本季', '上季', '目标']

/** 生成单系列数据（无 children） */
export function singleSeries(labels, min, max) {
  return labels.map((label) => ({ label, value: rnd(min, max) }))
}

/** 生成多系列数据（共享 x 轴标签） */
export function multiSeries(labels, min, max, names = seriesNames) {
  return names.map((name) => ({
    name,
    data: labels.map((label) => ({ label, value: rnd(min, max) })),
  }))
}

/** 生成二级钻取数据：一级每项带 children（子级数据） */
export function drillSeries(level1Labels, level2Labels, l1Min, l1Max, l2Min, l2Max) {
  return level1Labels.map((l1) => {
    const l1Val = rnd(l1Min, l1Max)
    // 子级值在 l1 附近拆分，保证可读性
    const raw = level2Labels.map(() => rnd(l2Min, l2Max))
    const sum = raw.reduce((s, v) => s + v, 0) || 1
    // 让子级总和 ≈ 父级值（仅用于演示，不严格等价）
    const scaled = raw.map((v) => Math.max(1, Math.round((v / sum) * l1Val)))
    // 取第一个子级调整尾差，保证 scaled 求和 == l1Val
    const diff = l1Val - scaled.reduce((s, v) => s + v, 0)
    scaled[0] = Math.max(1, scaled[0] + diff)
    return {
      label: l1,
      value: l1Val,
      children: level2Labels.map((l2, i) => ({ label: l2, value: scaled[i] })),
    }
  })
}

/** 生成演示数据集 */
export function makeData() {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  const channels = ['搜索', '直达', '社媒', '推荐', '其他']
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
  const regions = ['华东', '华北', '华南', '西部']
  return {
    line: singleSeries(days, 20, 100),
    bar: singleSeries(months, 80, 320),
    pie: singleSeries(channels, 120, 480),
    gauge: { value: rnd(30, 98), max: 100 },
    radar: [
      { label: '速度', value: rnd(40, 100), max: 100 },
      { label: '稳定', value: rnd(40, 100), max: 100 },
      { label: '体验', value: rnd(40, 100), max: 100 },
      { label: '安全', value: rnd(40, 100), max: 100 },
      { label: '生态', value: rnd(40, 100), max: 100 },
      { label: '成本', value: rnd(40, 100), max: 100 },
    ],
    // 多维折线/分组柱状/堆叠柱状共用 series 结构
    multiLine: multiSeries(days, 20, 100),
    multiBar: multiSeries(months, 60, 260),
    stacked: multiSeries(quarters, 40, 180),
    // 多组饼图：并列展示多个独立饼图，共享图例
    multiPie: [
      { name: '华东', data: singleSeries(channels, 80, 300) },
      { name: '华北', data: singleSeries(channels, 80, 300) },
      { name: '华南', data: singleSeries(channels, 80, 300) },
    ],
    // 二级钻取数据：区域 → 渠道；DrilledBarChart / NestedPieChart 共用
    drillRegionChannel: drillSeries(regions, channels, 260, 560, 20, 160),
    // 二级钻取柱状图：品类 → 月份
    drillCategoryMonth: drillSeries(['3C', '服饰', '食品', '家居'], months, 300, 700, 20, 180),
  }
}
