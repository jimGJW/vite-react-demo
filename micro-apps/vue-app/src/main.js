import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElIcons from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './style.css'
// 自有组件库的样式按「全局工具类」使用（m-btn / m-chip …），
// 因此在这里全局引入，避免只有访问 Kit 页时才被加载
import './components/styles.css'
import App from './App.vue'
import { createAppRouter, MENU_ITEMS } from './router.js'
import { installDirectives } from './directives'
// 注意：不能从 'vite-plugin-qiankun' 包名导入——包入口 es/index.js 只导出 htmlPlugin（default），
// 预构建后没有 qiankunWindow/renderWithQiankun 命名导出，浏览器会报
// "does not provide an export named 'qiankunWindow'"。官方示例也是从 es/helper 子路径导入的。
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/es/helper'

let app = null
let router = null
/**
 * qiankun 传入的 props（mount 时赋值）。
 * 用模块级变量持有，是为了让「路由变化 → 通知宿主」这件事能落在 router 守卫里，
 * 而守卫在 setupGuards 时就注册好了，拿不到 props。
 */
let hostProps = {}

function render(props = {}) {
  const { container } = props
  const mountEl = container ? container.querySelector('#app') : document.querySelector('#app')
  if (app) app.unmount()
  app = createApp(App)
  // 独立运行 → web history（真实 URL，可刷新/可分享）；qiankun 融合 → memory history（不抢主应用 URL）
  router = createAppRouter(!qiankunWindow.__POWERED_BY_QIANKUN__)
  /**
   * 把「当前子应用内部路由」回传给主应用 → 侧边栏据此高亮所在菜单项。
   * 子应用内部跳转不会改变主应用 URL（宿主页恒为 /micro-vue），
   * 所以主应用只能靠这个回调知道「现在在哪一页」。
   */
  router.afterEach((to) => { hostProps.onRouteChange?.(to.path) })
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })
  app.use(installDirectives) // 注册全部自定义指令：v-focus / v-copy / v-debounce ...
  Object.keys(ElIcons).forEach((k) => app.component(k, ElIcons[k]))
  app.mount(mountEl)
  // 首屏同步一次：初始导航可能早于 afterEach 注册完成
  hostProps.onRouteChange?.(router.currentRoute.value.path)
}

// 交给 qiankun 托管生命周期（bootstrap/mount/update/unmount）
renderWithQiankun({
  mount(props = {}) {
    hostProps = props
    // 把功能菜单注册到主应用侧边栏（由主应用渲染，点击回调 update）
    // 主应用可用 props.menuItems 覆盖（联调时临时裁剪菜单），默认用本应用路由派生的清单
    props.registerMenu?.(props.menuItems || MENU_ITEMS)
    render(props)
  },
  bootstrap() {},
  /** 主应用侧边栏菜单点击 → 切换子应用内部页面 */
  update(props = {}) {
    hostProps = { ...hostProps, ...props }
    if (!props.path || !router) return
    // 未匹配的 path 由路由表的 catchAll 兜到 NotFound，因此这里无需额外 try/catch
    router.push(props.path)
  },
  unmount() {
    if (app) {
      app.unmount()
      app = null
      router = null
      hostProps = {}
    }
  },
})

// 独立运行（不被 qiankun 加载时）直接挂载
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
