/**
 * 微前端子应用注册表（qiankun）
 *
 * 主应用 = 本 React 工程（端口 5173），通过 qiankun 在运行时把以下「独立工程」融合进来。
 * 三个工程各自独立开发 / 独立构建 / 独立部署，由 qiankun 统一调度与样式、JS 隔离。
 *
 * - 开发态：子应用跑在各自端口（见 PORTS），entry 用 //host:port
 * - 生产态：子应用 build 到 dist/micros/<name>/，entry 改为静态托管前缀
 *   对应的 vite 配置见各子工程 micro-apps/<name>/vite.config.js
 *
 * 重要：qiankun + vite-plugin-qiankun 的生命周期桥是全局单例（window.proxy /
 * window.moudleQiankunAppLifeCycles），【同一时刻只能有一个子应用在加载流程中】，
 * 并发加载两个子应用会互相覆写导致 bootstrap 超时（single-spa #31）。
 * 因此每个子应用有独立宿主页（hostPath），页面内自动加载；总览页加载多个时必须串行。
 *
 * 新增子应用：在 MICRO_APPS 加一项 + 放置对应工程 + 加 hostPath 路由即可，宿主逻辑无需改动。
 */
const DEV = import.meta.env.DEV

export const PORTS = { main: 5173, vue: 7101, angular: 7102 }

export const MICRO_APPS = {
  vue: {
    key: 'vue',
    name: 'vue-app',
    title: 'Vue 3 子应用',
    color: '#42b883',
    port: 7101,
    entry: DEV ? '//localhost:7101' : '/micros/vue-app/',
    /** 子应用独立宿主页（侧边栏「Vue 子应用」直达，进入即自动加载） */
    hostPath: '/micro-vue',
    /** 容器内挂载点的 DOM id（子应用 HTML 会被 qiankun 注入到此容器） */
    container: 'micro-vue-container',
    qiankunConfig: { sandbox: true },
  },
  angular: {
    key: 'angular',
    name: 'angular-app',
    title: 'Angular 子应用',
    color: '#dd0031',
    port: 7102,
    entry: DEV ? '//localhost:7102' : '/micros/angular-app/',
    hostPath: '/micro-angular',
    container: 'micro-angular-container',
    /**
     * 必须开启沙箱（与 vue-app 一致）：vite-plugin-qiankun 的生命周期桥接
     * 依赖 qiankun 的 window.proxy（vitebootstrap/vitemount 等方法挂在代理上），
     * sandbox:false 时 window.proxy 不存在 → bootstrap 永远不 resolve →
     * single-spa #31「bootstrap 4000ms 超时」，容器里只剩空的 <app-root>。
     * zone.js 与 Proxy 沙箱实测可共存（qiankun 不会代理 document）。
     */
    qiankunConfig: { sandbox: true },
  },
}

/** 注册表数组视图（演示页遍历用，保持声明顺序） */
export const MICRO_APP_LIST = Object.values(MICRO_APPS)
