/**
 * qiankun 宿主逻辑（主应用侧）
 *
 * 设计要点：
 * 1. 对 'qiankun' 一律用【动态 import】，避免 SSR / 生产构建在 node 端误触 window。
 *    只有真正调用 loadMicro / registerAllMicroApps 时才加载 qiankun。
 * 2. loadMicro：手动按需把一个子应用挂到指定 DOM 容器，返回 unmount 句柄，
 *    便于 React effect 精确管理生命周期（演示页用此方式，交互最直观）。
 * 3. registerAllMicroApps：路由式自动融合（预留能力），导航到 /micro-frontend
 *    时按 activeRule 自动挂载对应子应用。当前演示页用手动控制，暂不自动 start。
 */
import { MICRO_APPS } from './config.js'

/** 当前主应用是否本身正运行在另一个 qiankun 主应用内 */
export const isInQiankun = () =>
  typeof window !== 'undefined' && !!window.__POWERED_BY_QIANKUN__

/**
 * 手动加载一个子应用到容器元素。
 * @param {keyof typeof MICRO_APPS} key
 * @param {HTMLElement} containerEl
 * @param {object} [props] 透传给子应用的 qiankun props（如 registerMenu 回调）
 * @returns {{ microApp: Promise<any>, unmount: () => Promise<void> }}
 */
export async function loadMicro(key, containerEl, props = {}) {
  const cfg = MICRO_APPS[key]
  if (!cfg) throw new Error(`未知子应用 key: ${String(key)}`)
  const { loadMicroApp } = await import('qiankun')
  const microApp = loadMicroApp(
    { name: cfg.name, entry: cfg.entry, container: containerEl },
    { ...cfg.qiankunConfig, props },
  )
  return { microApp, unmount: () => microApp.unmount() }
}

let registered = false

/** 路由式自动融合（预留）：导航到 /micro-frontend 时按 activeRule 自动挂载子应用 */
export async function registerAllMicroApps() {
  if (registered || isInQiankun()) return
  registered = true
  const { registerMicroApps, start } = await import('qiankun')
  const log = (stage) => (app) => {
    console.info(`[qiankun] ${stage} ${app?.name}`)
    return Promise.resolve()
  }
  registerMicroApps(
    Object.values(MICRO_APPS).map((cfg) => ({
      name: cfg.name,
      entry: cfg.entry,
      container: `#${cfg.container}`,
      activeRule: '/micro-frontend',
    })),
    { beforeLoad: [log('beforeLoad')], afterMount: [log('afterMount')], afterUnmount: [log('afterUnmount')] },
  )
  start({ prefetch: false })
}
