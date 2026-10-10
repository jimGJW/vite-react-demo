/* KitDemo 模拟数据与工具函数，从 index.jsx 拆出 */
export const LONG_TEXT =
  '资产全生命周期管理平台覆盖采购论证、安装验收、日常巡检、预防性维护、计量校准、故障维修、效益分析与报废处置等环节，' +
  '任一环节的记录缺失都会影响资产状态判断与合规审计，因此需要把每一次操作都沉淀为可追溯的电子档案。'

export const DEVICES = [
  { id: 'SRV-001', name: '应用服务器 A', dept: '机房', py: 'ying yong fu wu qi a' },
  { id: 'SRV-002', name: '应用服务器 B', dept: '机房', py: 'ying yong fu wu qi b' },
  { id: 'NET-101', name: '核心交换机', dept: '网络组', py: 'he xin jiao huan ji' },
  { id: 'IOT-201', name: '边缘采集网关', dept: '物联网组', py: 'bian yuan cai ji wang guan' },
  { id: 'TER-301', name: '自助终端一体机', dept: '终端组', py: 'zi zhu zhong duan' },
  { id: 'SEC-401', name: '日志审计一体机', dept: '安全组', py: 'ri zhi shen ji' },
]

export const STAT_AREA = [
  { x: '周一', y: 32 }, { x: '周二', y: 45 }, { x: '周三', y: 38 },
  { x: '周四', y: 61 }, { x: '周五', y: 54 }, { x: '周六', y: 72 }, { x: '周日', y: 66 },
]

export const STAT_BAR = [
  { x: '机房', y: 42 }, { x: '网络组', y: 68 },
  { x: '物联网组', y: 31 }, { x: '终端组', y: 55 },
]

export const TIMELINE = Array.from({ length: 24 }, (_, i) => ({
  x: `${String(i).padStart(2, '0')}:00`,
  y1: Math.round(20 + Math.sin(i / 3) * 12 + Math.random() * 6),
  y2: Math.round(14 + Math.cos(i / 4) * 9 + Math.random() * 5),
}))

export const NOTICE_TABS = [
  {
    key: 'todo',
    title: '待办',
    count: 3,
    items: [
      { id: 'n1', title: '工单 WO-2081 待验收', desc: '应用服务器 A · 电源模块更换', time: '10 分钟前' },
      { id: 'n2', title: '计量校准即将到期', desc: '6 台资产将在 7 天内到期', time: '1 小时前' },
      { id: 'n3', title: '巡检计划待确认', desc: '本周机房巡检排期', time: '昨天' },
    ],
  },
  {
    key: 'message',
    title: '消息',
    count: 1,
    items: [
      { id: 'm1', title: '系统升级通知', desc: '本周六 02:00-04:00 停机维护', time: '周一', read: true },
    ],
  },
]

export const DEFAULT_RANGES = [
  { id: 'r1', start: '09:00', end: '12:00' },
  { id: 'r2', start: '13:30', end: '18:00' },
]

export const OVERLAP_RANGES = [
  { id: 'r1', start: '09:00', end: '13:00' },
  { id: 'r2', start: '12:30', end: '18:00' },
]

export const INITIAL_CARDS = [
  { key: 'overview', title: '概览卡片', desc: '设备总数、在线率、告警数', visible: true },
  { key: 'alarm', title: '告警卡片', desc: '实时告警与处理进度', visible: true },
  { key: 'workorder', title: '工单卡片', desc: '待办工单与超期提醒', visible: false },
  { key: 'report', title: '报表卡片', desc: '月度统计与导出入口', visible: true },
]

export const INITIAL_TAGS = ['巡检', '预防性维护', '计量检定']

/** 倒计时目标写在模块级：渲染期调用 Date.now() 会被判为不纯函数 */
export const COUNTDOWN_TARGET = Date.now() + 2 * 3600 * 1000 + 45 * 1000

export function makeRows(start, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `r_${start + i}`,
    title: `巡检记录 #${String(start + i + 1).padStart(3, '0')}`,
    time: `${String(8 + ((start + i) % 10)).padStart(2, '0')}:${String(((start + i) * 7) % 60).padStart(2, '0')}`,
  }))
}

/** 模拟异步查询：按名称 / 拼音 / 分组过滤，400ms 延迟 */
export function loadDevices(keyword) {
  const kw = String(keyword || '').trim().toLowerCase()
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        DEVICES.filter(
          (item) =>
            !kw ||
            item.name.toLowerCase().includes(kw) ||
            item.py.includes(kw) ||
            item.dept.includes(kw) ||
            item.id.toLowerCase().includes(kw),
        ),
      )
    }, 400)
  })
}

/* =====================================================================
 * 各分组内容
 * ===================================================================== */
