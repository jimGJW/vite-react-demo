import type { Routes } from '@angular/router'
import { authGuard, guestOnlyGuard } from './core/guards'
import { monitorResolver } from './core/resolvers'

/**
 * angular-app 路由表（官方 @angular/router）
 *
 * 与 vue-app 的 vue-router 一一对应，但用 Angular 官方写法：
 * - `loadComponent` 路由级懒加载（等价 Vue 的 `() => import()`）
 * - `canActivate` 函数式守卫（等价 Vue 的 `beforeEach` / `beforeEnter`）
 * - `resolve` 导航前预取数据（Vue 侧用 `beforeRouteEnter` + 手写 promise 达到同样效果）
 * - `data: { title, group, desc }` 路由数据，供侧边栏菜单与标题消费
 * - `redirectTo` + `pathMatch: 'full'` 处理空路径
 * - 通配 `**` 落到 NotFound，避免白屏
 * - `title` 路由级标题（官方 Router 会自动写 document.title）
 */
export const APP_ROUTES: Routes = [
  { path: '', redirectTo: '/components', pathMatch: 'full' },

  {
    path: 'components',
    loadComponent: () => import('./views/components-view').then((m) => m.ComponentsView),
    title: '组件与模板 · Angular 子应用',
    data: { title: '组件与模板', group: '基础' },
  },
  {
    path: 'services',
    loadComponent: () => import('./views/services-view').then((m) => m.ServicesView),
    title: '服务注入与管道 · Angular 子应用',
    data: { title: '服务注入与管道', group: '基础' },
  },

  {
    path: 'utils',
    loadComponent: () => import('./views/utils-view').then((m) => m.UtilsView),
    title: '工具函数 · Angular 子应用',
    data: { title: '工具函数 Utils', group: '能力' },
  },
  {
    path: 'kit',
    loadComponent: () => import('./views/kit-view').then((m) => m.KitView),
    title: '自有组件库 Kit · Angular 子应用',
    data: { title: '自有组件库 Kit', group: '能力' },
  },
  {
    path: 'charts',
    loadComponent: () => import('./views/charts-view').then((m) => m.ChartsView),
    title: '图表中心 · Angular 子应用',
    data: { title: '图表中心', group: '能力' },
  },
  {
    path: 'rxjs',
    loadComponent: () => import('./views/rxjs-view').then((m) => m.RxjsView),
    title: 'RxJS 与信号 · Angular 子应用',
    data: { title: 'RxJS 与信号对照', group: '能力' },
  },
  {
    path: 'directives',
    loadComponent: () => import('./views/directives-view').then((m) => m.DirectivesView),
    title: '指令与管道 · Angular 子应用',
    data: { title: '自定义指令 / 管道', group: '能力' },
  },
  {
    path: 'table',
    loadComponent: () => import('./views/table-view').then((m) => m.TableView),
    title: '数据表格 · Angular 子应用',
    data: { title: '数据表格', group: '能力' },
  },
  {
    path: 'forms-advanced',
    loadComponent: () => import('./views/forms-advanced-view').then((m) => m.FormsAdvancedView),
    title: '响应式表单 · Angular 子应用',
    data: { title: '响应式表单 Reactive', group: '能力' },
  },
  {
    path: 'forms',
    loadComponent: () => import('./views/forms-view').then((m) => m.FormsView),
    title: '表单与指令 · Angular 子应用',
    data: { title: '模板式表单 (ngModel)', group: '能力' },
  },
  {
    path: 'store',
    loadComponent: () => import('./views/store-view').then((m) => m.StoreView),
    title: '状态与持久化 · Angular 子应用',
    data: { title: '状态管理与持久化', group: '能力' },
  },

  /* —— 鉴权演示：受保护路由（canActivate + resolve）+ 登录页（反向守卫）—— */
  {
    path: 'guarded',
    loadComponent: () => import('./views/guarded-view').then((m) => m.GuardedView),
    canActivate: [authGuard],
    resolve: { snapshot: monitorResolver },
    title: '受保护页面 · Angular 子应用',
    data: { title: '受保护页面', group: '鉴权' },
  },
  {
    path: 'login',
    loadComponent: () => import('./views/login-view').then((m) => m.LoginView),
    canActivate: [guestOnlyGuard],
    title: '登录 · Angular 子应用',
    data: { title: '登录', group: '鉴权' },
  },

  {
    path: '**',
    loadComponent: () => import('./views/not-found-view').then((m) => m.NotFoundView),
    title: '页面不存在 · Angular 子应用',
    data: { title: '页面不存在', hidden: true },
  },
]
