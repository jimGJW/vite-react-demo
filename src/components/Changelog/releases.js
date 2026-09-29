/**
 * 功能版本时间轴数据
 * 把"新功能"按上线批次（时间段）归类，每个 release 对应一次集中改动。
 * changes 列出该批次改动的具体页面与说明，changedAt 为改动日期。
 *
 * 数据以仓库真实 git 提交批次为依据：
 *   r1  2026-09-14  b776892  四大基础模块上线（Kit/Studio/Templates/Utils/ChatBot/QASharing）
 *   r2  2026-09-20  396587e  React 核心 API 演示 + 五层验证体系
 *   r3  2026-09-27  5f67751  四大进阶模块 + Utils 大扩充
 *
 * 纯数据文件（无 React），可被单测直接 import。
 */

export const RELEASES = [
  {
    id: 'r1',
    short: '9/14',
    label: '2026-09-14',
    date: '2026-09-14',
    color: '#1677ff',
    title: '四大基础模块上线',
    commit: 'b776892',
    changes: [
      { route: '/kit', title: '组件工具箱 Kit', desc: '从存量项目提炼 18 个通用组件（签名板 / 下拉刷新 / 虚拟列表等）', changedAt: '2026-09-14' },
      { route: '/studio', title: '组件工坊 Studio', desc: '24 个去业务化零依赖组件，按能力分组展示', changedAt: '2026-09-14' },
      { route: '/templates', title: '开源模板库', desc: '识别并归档 19 个纯上游开源模板', changedAt: '2026-09-14' },
      { route: '/utils', title: '小功能集 Utils', desc: '50+ 纯函数 + 20 Hook 统一收口', changedAt: '2026-09-14' },
      { route: '/chatbot', title: '对话助手 ChatBot', desc: '从云端文档库复用的流式对话 + 卡片渲染能力', changedAt: '2026-09-14' },
      { route: '/share', title: '对话分享 QASharing', desc: '对话分享只读落地页，可跨项目复用', changedAt: '2026-09-14' },
    ],
  },
  {
    id: 'r2',
    short: '9/20',
    label: '2026-09-20',
    date: '2026-09-20',
    color: '#52c41a',
    title: '核心 API 演示 + 验证体系',
    commit: '396587e',
    changes: [
      { route: '/react-hooks', title: 'React 核心 API 演示', desc: 'useContext / useCallback / useMemo / useId 组合案例 + React 19 新特性', changedAt: '2026-09-20' },
      { route: '__infra__', title: '五层验证体系', desc: '新增 SSR 冒烟 + CDP 浏览器冒烟，dist 剔重 wasm 瘦身（93M→73M）', changedAt: '2026-09-20' },
    ],
  },
  {
    id: 'r3',
    short: '9/27',
    label: '2026-09-27',
    date: '2026-09-27',
    color: '#fa8c16',
    title: '四大进阶模块 + Utils 大扩充',
    commit: '5f67751',
    changes: [
      { route: '/perf-lab', title: '性能实验室', desc: '虚拟滚动 / FPS / Web Worker / 重渲染优化四实验', changedAt: '2026-09-27' },
      { route: '/error-boundary', title: '错误边界与容错', desc: 'ErrorBoundary + useAsyncError 异常治理', changedAt: '2026-09-27' },
      { route: '/state-machine', title: '状态机与时间旅行', desc: '纯函数状态机 + 撤销栈（commit / undo / redo / jumpTo）', changedAt: '2026-09-27' },
      { route: '/web-api', title: '浏览器原生能力', desc: '全屏 / 常亮 / 定位 / 通知 / 分享 / 网络探测统一收敛', changedAt: '2026-09-27' },
      { route: '/utils', title: '小功能集 Utils（扩充）', desc: '+20 纯函数 + 5 Hook，演示页新增 3 个分类', changedAt: '2026-09-27' },
    ],
  },
]

export const getRelease = (id) => RELEASES.find((r) => r.id === id) || null

/** 路由 → 最近一次改动所属 release（用于侧边栏下标 icon，取最新批次） */
export const ROUTE_LATEST = (() => {
  const map = {}
  for (const r of RELEASES) {
    for (const c of r.changes) {
      if (typeof c.route === 'string' && c.route.startsWith('/')) map[c.route] = r.id
    }
  }
  return map
})()

/** 路由 → 所有包含它的批次 id 数组（用于选中批次时高亮对应侧边栏项） */
export const ROUTE_RELEASES = (() => {
  const map = {}
  for (const r of RELEASES) {
    for (const c of r.changes) {
      if (typeof c.route === 'string' && c.route.startsWith('/')) {
        (map[c.route] ||= []).push(r.id)
      }
    }
  }
  return map
})()

/** 全部改动条目数 */
export const TOTAL_CHANGES = RELEASES.reduce((n, r) => n + r.changes.length, 0)
