export const STATUS_LIST = [
  { key: 'active', label: '正常', tone: 'success' },
  { key: 'pending', label: '待审', tone: 'warning' },
  { key: 'banned', label: '禁用', tone: 'danger' },
]
export const STATUS_MAP = Object.fromEntries(STATUS_LIST.map((s) => [s.key, s]))

export const NAMES = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二']
export const DEPTS = ['研发部', '产品部', '设计部', '运营部', '市场部', '财务部', '人事部']
export const ROLES = ['工程师', '产品经理', '设计师', '运营专员', '主管', '总监']

/** 生成 50 行演示数据 */
export function makeRows() {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${i + 1}` : ''),
    age: 22 + (i * 7) % 30,
    email: `user${i + 1}@example.com`,
    dept: DEPTS[i % DEPTS.length],
    role: ROLES[i % ROLES.length],
    salary: 8000 + (i * 1234) % 22000,
    status: STATUS_LIST[i % STATUS_LIST.length].key,
    createdAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  }))
}

/** 状态标签 */
