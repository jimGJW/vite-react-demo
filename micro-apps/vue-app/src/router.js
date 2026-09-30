/**
 * vue-app 路由与菜单注册表
 *
 * 官方 vue-router 用法：
 * - history 双模式：独立访问（7101 直开）用 createWebHistory（地址栏可分享/可刷新/前进后退可用）；
 *   被 qiankun 融合时切 createMemoryHistory，避免污染主应用 URL
 * - 路由级懒加载：() => import() 拆 chunk，首屏只加载当前页
 * - 嵌套路由：/nested 父级持有 <router-view />，子路由渲染在父组件内部
 * - 路由 meta：title / icon / group，供主应用侧边栏与面包屑消费
 * - 全局前置守卫：写 document.title + 鉴权（meta.requiresAuth）+ 记录访问日志
 * - 路由级守卫：beforeEnter（单条路由独享）
 * - scrollBehavior：切换路由回滚到顶部（嵌套子路由保留父级滚动位置）
 * - 兜底路由：未匹配的 path 落到 NotFound，而不是白屏
 *
 * MENU_ITEMS 通过 qiankun props.registerMenu 注册到主应用侧边栏；
 * 主应用菜单点击 → microApp.update({ path }) → router.push(path) 切换页面。
 */
import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'
import { isLoggedIn } from './store'
import ComponentsPage from './pages/ComponentsPage.vue'
import StyleShowcasePage from './pages/StyleShowcasePage.vue'
import UtilsPage from './pages/UtilsPage.vue'
import ComposablesPage from './pages/ComposablesPage.vue'
import PatternsIndex from './pages/PatternsIndex.vue'
import ParentChild from './pages/patterns/ParentChild.vue'
import TwoWay from './pages/patterns/TwoWay.vue'
import Provide from './pages/patterns/Provide.vue'
import State from './pages/patterns/State.vue'
import Slot from './pages/patterns/Slot.vue'
import Ref from './pages/patterns/Ref.vue'

/** 懒加载工具：Vite 会为每个 import() 生成独立 chunk */
const lazy = (loader) => () => loader()

/**
 * 路由表
 * meta.group 用于主应用侧边栏分组显示（见下方 MENU_ITEMS 生成逻辑）
 */
export const routes = [
  { path: '/', name: 'components', component: ComponentsPage, meta: { title: '组件库展示', group: '基础' } },
  { path: '/style', name: 'style', component: StyleShowcasePage, meta: { title: '样式对比', group: '基础' } },

  { path: '/utils', name: 'utils', component: UtilsPage, meta: { title: '工具函数', group: '能力' } },
  { path: '/composables', name: 'composables', component: ComposablesPage, meta: { title: '组合式函数', group: '能力' } },
  { path: '/kit', name: 'kit', component: lazy(() => import('./pages/KitPage.vue')), meta: { title: '组件工具箱 Kit', group: '能力' } },
  { path: '/charts', name: 'charts', component: lazy(() => import('./pages/ChartsPage.vue')), meta: { title: '图表中心', group: '能力' } },
  { path: '/table', name: 'table', component: lazy(() => import('./pages/TablePage.vue')), meta: { title: '数据表格', group: '能力' } },
  { path: '/form', name: 'form', component: lazy(() => import('./pages/FormPage.vue')), meta: { title: '表单与校验', group: '能力' } },
  { path: '/feedback', name: 'feedback', component: lazy(() => import('./pages/FeedbackPage.vue')), meta: { title: '反馈与加载', group: '能力' } },
  { path: '/directives', name: 'directives', component: lazy(() => import('./pages/DirectivesPage.vue')), meta: { title: '自定义指令', group: '能力' } },
  { path: '/store', name: 'store', component: lazy(() => import('./pages/StorePage.vue')), meta: { title: '状态管理', group: '能力' } },

  { path: '/patterns', name: 'patterns', component: PatternsIndex, meta: { title: '通信模式索引', group: '通信' } },
  { path: '/pattern/parent-child', name: 'pattern-parent-child', component: ParentChild, meta: { title: '父子传值', group: '通信' } },
  { path: '/pattern/two-way', name: 'pattern-two-way', component: TwoWay, meta: { title: '双向绑定', group: '通信' } },
  { path: '/pattern/provide', name: 'pattern-provide', component: Provide, meta: { title: '跨层传值', group: '通信' } },
  { path: '/pattern/state', name: 'pattern-state', component: State, meta: { title: '全局状态', group: '通信' } },
  { path: '/pattern/slot', name: 'pattern-slot', component: Slot, meta: { title: '插槽', group: '通信' } },
  { path: '/pattern/ref', name: 'pattern-ref', component: Ref, meta: { title: '模板引用', group: '通信' } },

  /* —— 嵌套路由：父级持有 <router-view />，子级渲染在父组件内部 —— */
  {
    path: '/nested',
    component: lazy(() => import('./pages/NestedLayout.vue')),
    meta: { title: '嵌套路由', group: '基础' },
    children: [
      // path 为空 → 就是 /nested 本身；子路由不写 meta.title，故不单独出现在侧边栏
      { path: '', name: 'nested-overview', component: lazy(() => import('./pages/nested/NestedChildA.vue')) },
      {
        path: 'detail/:id',
        name: 'nested-detail',
        component: lazy(() => import('./pages/nested/NestedChildB.vue')),
        // 路由级守卫：只作用于这一条路由（与全局 guard 互补）
        beforeEnter: (to) => {
          routeLog.unshift({
            path: to.path, name: to.name, at: new Date(),
            guard: `beforeEnter 校验 id=${to.params.id}`,
          })
          if (routeLog.length > 20) routeLog.splice(20)
          return true
        },
      },
    ],
  },

  /* —— 鉴权演示：受保护路由 + 登录页 —— */
  {
    path: '/admin',
    name: 'admin',
    component: lazy(() => import('./pages/AdminPage.vue')),
    meta: { title: '受保护页面', group: '鉴权', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: lazy(() => import('./pages/LoginPage.vue')),
    meta: { title: '登录', group: '鉴权' },
  },

  /* 兜底：放在最后，未匹配全部落到 404 */
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: lazy(() => import('./pages/NotFound.vue')),
    meta: { title: '页面不存在', hidden: true },
  },
]

/** 侧边栏菜单：由 routes 自动派生（带 meta.title 且未标 hidden） */
export const MENU_ITEMS = routes
  .filter((r) => r.meta?.title && !r.meta.hidden)
  .map((r) => ({
    path: r.path,
    label: r.meta.group === '通信' && r.path !== '/patterns'
      ? `└ ${r.meta.title}`
      : `${r.meta.title}${r.path === '/kit' ? ' · 自有组件' : ''}`,
    group: r.meta.group,
  }))

/** 访问日志：守卫里 append，页面可展示「路由跳转轨迹」 */
export const routeLog = []

/**
 * 全局前置守卫
 * 1) 鉴权：命中 `meta.requiresAuth` 且未登录 → 改道 `/login?redirect=<原地址>`
 * 2) 反向拦截：已登录还去 `/login` → 直接回首页（避免"登录后再登录"）
 * 3) 记账：写 routeLog，AdminPage 里当"守卫日志"展示
 * 4) 想接真实登录态时，只需把 isLoggedIn() 换成读你后端的 token
 */
export function setupGuards(router) {
  router.beforeEach((to) => {
    const needsAuth = Boolean(to.meta?.requiresAuth)
    const authed = isLoggedIn()
    const verdict = needsAuth ? (authed ? '放行' : '拦截 → /login') : (authed ? '公开(已登录)' : '公开')

    routeLog.unshift({ path: to.path, name: to.name, at: new Date(), guard: verdict })
    if (routeLog.length > 20) routeLog.splice(20)

    if (needsAuth && !authed) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (authed && to.path === '/login') {
      return { path: '/' }
    }
    return true
  })

  router.afterEach((to) => {
    const base = 'Vue 3 子应用'
    document.title = to.meta?.title ? `${to.meta.title} · ${base}` : base
  })

  return router
}

/**
 * 创建 router 实例（main.js 调用）
 * @param {boolean} standalone 是否独立运行（未被 qiankun 加载）
 *   - 独立：createWebHistory —— 真实 URL，可刷新、可前进后退、链接可分享
 *   - 融合：createMemoryHistory —— 不写主应用地址栏，避免和主应用路由抢 URL
 */
export function createAppRouter(standalone = false) {
  const router = createRouter({
    history: standalone ? createWebHistory() : createMemoryHistory(),
    routes,
    /** 换页回到顶部；浏览器前进后退时还原原位置 */
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, behavior: 'smooth' }
      return { top: 0 }
    },
  })
  setupGuards(router)
  return router
}
