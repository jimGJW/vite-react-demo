import { inject } from '@angular/core'
import { type CanActivateFn, Router, type UrlTree } from '@angular/router'
import { AuthService } from '../services/auth.service'

/**
 * 函数式路由守卫（Angular 15+ 官方写法，取代 class + interface 的旧写法）
 *
 * 要点：
 * 1. 守卫是**普通函数**，通过 `inject()` 取依赖 —— 不需要 `@Injectable`，也不需要注册 provider。
 * 2. 返回值语义：
 *    - `true`            → 放行
 *    - `false`           → 取消导航（URL 停在原地，用户会感觉"点了没反应"）
 *    - `UrlTree`         → **改道**（推荐）：直接跳到登录页并带上回跳地址
 * 3. 因为守卫早于组件创建，登录态只能来自服务，不能来自组件 state。
 */
export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService)
  const router = inject(Router)

  if (auth.isLoggedIn()) return true

  // 改道到登录页，并把原本想去的地址塞进 query，登录后可以跳回来
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } })
}

/** 已登录时禁止再进登录页（反向守卫，常与 authGuard 成对出现） */
export const guestOnlyGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService)
  const router = inject(Router)
  return auth.isLoggedIn() ? router.createUrlTree(['/components']) : true
}

/** 守卫清单：directives-view 里当"能力目录"展示 */
export const GUARD_REGISTRY = [
  { name: 'authGuard', kind: 'CanActivateFn', desc: '未登录 → createUrlTree 改道 /login?redirect=…' },
  { name: 'guestOnlyGuard', kind: 'CanActivateFn', desc: '已登录再进 /login 会被弹回首页' },
  { name: 'monitorResolver', kind: 'ResolveFn', desc: '导航完成前预取数据，组件通过 input() 直接拿到' },
]
