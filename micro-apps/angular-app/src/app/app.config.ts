import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import {
  provideRouter, withComponentInputBinding, withHashLocation, withInMemoryScrolling,
} from '@angular/router'
import { APP_ROUTES } from './app.routes'
import { LoggerService } from './views/services-view'
import { routeLog } from './view-state'

/**
 * 应用配置（官方 `ApplicationConfig` + `providers` 数组）
 *
 * 路由要点：
 * - `withHashLocation()`：qiankun 场景下用 hash 模式，子应用的路由状态不会与
 *   主应用（react-router BrowserRouter）抢同一段 path。若用默认 PathLocation，
 *   子应用 pushState 会改写主应用 URL，切页时两边就会互相打架。
 * - `withComponentInputBinding()`：路由参数可直接作为组件 `input()` 绑定（官方推荐）
 * - `withInMemoryScrolling()`：切页滚动到顶部（等价 vue-router 的 scrollBehavior）
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // 官方推荐的变更检测配置（显式声明，便于后续切 zoneless）
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(
      APP_ROUTES,
      withHashLocation(),
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),

    // app 级 Provider：切换视图时 LoggerService 实例与日志状态保留
    LoggerService,
  ],
}

/** 路由跳转记账：由 AppComponent 订阅 Router 事件后写入（避免在 config 里注入） */
export function recordRoute(url: string) {
  routeLog.unshift({ url, at: new Date() })
  if (routeLog.length > 20) routeLog.splice(20)
}
