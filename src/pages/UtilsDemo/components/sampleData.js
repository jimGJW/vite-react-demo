/**
 * UtilsDemo 各分组共用的演示数据。
 *
 * 全部为中性虚构数据（不涉任何真实项目代号），只服务于「看得懂工具怎么用」，
 * 因此集中放在一处：改样例不必翻十一个组件文件。
 */

/** 表格 / 分组 / 计数演示用的资源清单 */
export const SAMPLE_ROWS = [
  { name: '应用服务器-A', group: '机房组', value: 92, status: '在线' },
  { name: '核心交换机-01', group: '网络组', value: 78, status: '在线' },
  { name: '边缘网关-03', group: '物联网组', value: 41, status: '离线' },
  { name: '审计主机', group: '安全组', value: 63, status: '在线' },
  { name: '备份存储', group: '机房组', value: 55, status: '在线' },
]

/** 树演示用的嵌套结构 */
export const SAMPLE_TREE = [
  { id: 'g1', name: '分组一', children: [{ id: 'n1', name: '子项 1' }, { id: 'n2', name: '子项 2' }] },
  { id: 'g2', name: '分组二', children: [{ id: 'n3', name: '子项 3' }] },
]

/** 平铺结构，用于演示 arrayToTree 还原层级 */
export const FLAT_LIST = [
  { id: 1, parentId: null, name: '根' },
  { id: 2, parentId: 1, name: '子 A' },
  { id: 3, parentId: 1, name: '子 B' },
  { id: 4, parentId: 2, name: '孙 A-1' },
]

/** CSV 导出的列定义 */
export const CSV_COLUMNS = [
  { key: 'name', title: '资源名称' },
  { key: 'group', title: '分组' },
  { key: 'value', title: '数值' },
  { key: 'status', title: '状态' },
]

/** 稳定配色演示的种子串（含中英文混排，顺带验证编码一致） */
export const COLOR_SEEDS = ['星际控制台', 'Alice', 'Bob', 'Charlie', 'Diana']

/** 对比色演示：故意混入极浅与极深，验证 contrastColor 的亮度翻转 */
export const CONTRAST_HEX = ['#ffffff', '#f5f5f5', '#1677ff', '#52c41a', '#faad14', '#000000']

/** 数值统计演示用序列（含重复值，可验证 median 去重逻辑） */
export const NUMS = [3, 1, 4, 1, 5, 9, 2, 6]

/** 日期增强演示的基准时刻：2024-02-27 15:40:30（2024 是闰年，便于演示闰年判断） */
export const BASE_DATE = new Date(2024, 1, 27, 15, 40, 30)

/** useSet 演示的可选项 */
export const PICK_OPTIONS = ['A', 'B', 'C', 'D']

/** useCountdown 演示的默认秒数 */
export const COUNTDOWN_SECONDS = 10
