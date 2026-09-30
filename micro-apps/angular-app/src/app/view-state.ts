import { signal } from '@angular/core'
import { APP_ROUTES } from './app.routes'

/**
 * 应用级共享状态（模块作用域 signal，等价 Vue 的模块级 ref）
 * 保留给「壳层需要在路由之外读当前视图」的场景（例如 query 参数联动）；
 * 页面切换本身已交给官方 Router，这里只做只读镜像。
 */
export const currentView = signal('/components')

/** 侧边栏菜单：由路由表自动派生（有 data.title 且未标 hidden） */
export interface MenuItem { path: string; label: string; group: string }

export const MENU_ITEMS: MenuItem[] = APP_ROUTES
  .filter((r) => r.path && r.path !== '**' && r.data?.['title'] && !r.data?.['hidden'])
  .map((r) => ({
    path: `/${r.path}`,
    label: r.data?.['title'] as string,
    group: (r.data?.['group'] as string) || '其它',
  }))

/** 按 group 分组（侧边栏渲染用） */
export const MENU_GROUPS: { name: string; items: MenuItem[] }[] = (() => {
  const order = ['基础', '能力', '鉴权', '其它']
  const map = new Map<string, MenuItem[]>()
  for (const item of MENU_ITEMS) {
    if (!map.has(item.group)) map.set(item.group, [])
    map.get(item.group)!.push(item)
  }
  return [...map.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([name, items]) => ({ name, items }))
})()

/** 路由跳转轨迹（由 app.config 的守卫写入，页面可展示） */
export const routeLog: { url: string; at: Date }[] = []
