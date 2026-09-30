// JIT compiler 必须先于 bootstrap 加载：Vite dev 下 @analogjs 插件对部分组件走 JIT 编译，
// 缺少 '@angular/compiler' 会报
// "AppComponent needs to be compiled using the JIT compiler, but '@angular/compiler' is not available"
import '@angular/compiler'
import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser'
import { NavigationEnd, Router } from '@angular/router'
import { filter, type Subscription } from 'rxjs'
import { AppComponent } from './app/app.component'
import { appConfig } from './app/app.config'
// 注意：不能从 'vite-plugin-qiankun' 包名导入——包入口 es/index.js 只有 default（htmlPlugin），
// qiankunWindow/renderWithQiankun 的命名导出在 es/helper 子模块（官方示例同款用法）。
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/es/helper'
import { MENU_ITEMS } from './app/view-state'
import './styles.css'

let appRef: { destroy: () => void; injector: { get: (t: unknown) => unknown } } | null = null
let router: Router | null = null
/** bootstrapApplication 是异步的：若 update 早于 bootstrap 完成，先把 path 存下来补跳 */
let pendingPath: string | null = null
/** 路由事件订阅：卸载时要退订，避免内存泄漏 */
let routeSub: Subscription | null = null
/**
 * qiankun 传入的 props（mount 时赋值）。
 * 用模块级变量持有，是为了让「路由变化 → 通知宿主」能落在 Router 事件订阅里。
 */
type HostProps = { onRouteChange?: (path: string) => void }
let hostProps: HostProps = {}

/**
 * 没有显式 pendingPath 时的落点。
 *
 * ⚠️ 独立运行时**不能**无条件 navigateByUrl('/components')：
 * 本应用用 `withHashLocation()`，地址栏里的 `#/playground` 就是真实初始路由，
 * 无条件跳默认页会把深链整个吃掉（表现是「输什么地址都回到 /components」）。
 * 融合运行时则由 qiankun 宿主统一控制，hash 没有语义，走默认页。
 */
function landingPath() {
  if (qiankunWindow.__POWERED_BY_QIANKUN__) return '/components'
  const raw = qiankunWindow.location?.hash ?? ''
  const p = raw.replace(/^#/, '')
  return p && p !== '/' ? p : '/components'
}

async function render() {
  if (appRef) {
    appRef.destroy()
    appRef = null
    router = null
    routeSub?.unsubscribe()
    routeSub = null
  }
  try {
    // qiankun 会把子应用 HTML 注入主应用容器内的 <app-root>，
    // bootstrapApplication 默认挂载到文档中的 <app-root> 即可。
    const ref = await bootstrapApplication(AppComponent, appConfig)
    appRef = ref as never
    router = ref.injector.get(Router) as Router
    /**
     * 把「当前子应用内部路由」回传给主应用 → 侧边栏据此高亮所在菜单项。
     * 用 hash 模式 + 子应用内部跳转不会改动主应用 URL（宿主页恒为 /micro-angular），
     * 所以主应用只能靠这个回调知道「现在在哪一页」。
     */
    routeSub = router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => { hostProps.onRouteChange?.(e.urlAfterRedirects) })
    await router.navigateByUrl(pendingPath ?? landingPath()).catch(() => router?.navigateByUrl('/404'))
    pendingPath = null
    // 首屏同步一次：navigateByUrl 的 NavigationEnd 可能早于订阅（不会，但保持幂等更稳）
    hostProps.onRouteChange?.(router.url)
  } catch (err) {
    console.error('[angular-app] bootstrap failed', err)
  }
}

// 交给 qiankun 托管生命周期（bootstrap/mount/update/unmount）
renderWithQiankun({
  mount(props = {}) {
    /**
     * 只挑我们真正消费的字段收编。
     * 不能直接写 `hostProps = props` —— 形参类型是 QiankunProps
     * （`{ container?: HTMLElement; [x: string]: any }`，只有 container 一个具名可选属性），
     * 赋给全可选的 HostProps 会触发 TS2559「弱类型检查：两个类型没有任何共同属性」。
     */
    hostProps = { onRouteChange: props.onRouteChange }
    // 把功能菜单注册到主应用侧边栏（由主应用渲染，点击回调 update）
    props.registerMenu?.(props.menuItems || MENU_ITEMS)
    render()
  },
  bootstrap() {},
  /** 主应用侧边栏菜单点击 → 切换子应用内部路由（协议统一为 { path }） */
  update(props = {}) {
    hostProps = { ...hostProps, ...props }
    if (!props.path) return
    if (!router) {
      pendingPath = props.path // bootstrap 未完成，先记下
      return
    }
    router.navigateByUrl(props.path).catch((e: unknown) => {
      // 未匹配的 path 由 `**` 通配路由兜到 NotFound
      console.warn('[angular-app] 路由跳转失败，已兜底 404：', props.path, e)
      router?.navigateByUrl('/404')
    })
  },
  unmount() {
    routeSub?.unsubscribe()
    routeSub = null
    if (appRef) {
      appRef.destroy()
      appRef = null
      router = null
      hostProps = {}
    }
  },
})

// 独立运行（不被 qiankun 加载时）直接挂载
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
