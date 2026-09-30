import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * 子应用（qiankun）注册表上下文
 *
 * 职责：
 * 1. 菜单注册表：子应用 mount 时通过 qiankun props.registerMenu 把功能菜单注册进来，
 *    Layout 侧边栏据此动态渲染「已加载子应用」分组。
 * 2. microApp 句柄：保存 loadMicroApp 返回的实例，侧边栏菜单点击时调
 *    microApp.update({ path }) 切换子应用内部页面。
 * 3. 加载请求调度：其他页面（如 Compare 系列）点「在子应用中打开」时，
 *    requestSubApp(key, path) 记录意图并跳转 /micro-frontend，
 *    MicroFrontendDemo 挂载后按意图自动加载子应用并定位到目标页面。
 * 4. **当前内部路由（currentPath）**：侧边栏高亮要用。
 *    子应用内部路由不会反映到主应用 URL（宿主页恒为 /micro-vue、/micro-angular），
 *    所以必须由子应用在路由变化时回调 props.onRouteChange(path) 回传；
 *    宿主侧主动 update({ path }) 或 requestSubApp 时也会先行写入，
 *    保证「点下去立刻高亮」，不必等子应用加载完。
 *
 * 注：子应用容器随宿主页（SubAppPage / MicroFrontendDemo）挂载/卸载，离开页面即卸载并清空菜单 ——
 *     「已加载」与「菜单可见」语义一致。
 */
const SubAppContext = createContext(null)

export function SubAppProvider({ children }) {
  const [subApps, setSubApps] = useState({})

  /** 子应用 mount 后注册菜单（qiankun props.registerMenu 回调） */
  const registerMenus = useCallback((key, title, menus) => {
    setSubApps((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), title, menus: Array.isArray(menus) ? menus : [] },
    }))
  }, [])

  /** 子应用卸载时清除菜单与句柄 */
  const unregister = useCallback((key) => {
    setSubApps((prev) => {
      const next = { ...prev }
      const entry = prev[key]
      if (entry) {
        next[key] = {
          ...entry,
          menus: undefined,
          microApp: undefined,
          pendingPath: undefined,
          currentPath: undefined,
        }
      }
      return next
    })
  }, [])

  /** 保存 loadMicroApp 返回的实例句柄 */
  const setMicroApp = useCallback((key, microApp) => {
    setSubApps((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), microApp } }))
  }, [])

  /**
   * 记录子应用内部当前路由 → 侧边栏据此高亮 `micro:<key>:<path>` 那一项。
   * 来源有二：
   *   a) 宿主主动导航（requestSubApp / 已在宿主页时直接 update）—— 先行写入，点击立刻有反馈；
   *   b) 子应用内部自己跳转（含走子应用自带导航条）—— 由子应用回调 props.onRouteChange 回传。
   * 相同路径直接返回原 state，避免子应用每次路由变化都触发一次无意义的重渲染。
   */
  const setCurrentPath = useCallback((key, path) => {
    setSubApps((prev) => {
      const entry = prev[key]
      if (!entry || !path || entry.currentPath === path) return prev
      return { ...prev, [key]: { ...entry, currentPath: path } }
    })
  }, [])

  /** 请求打开某个子应用的某个页面（可能尚未加载） */
  const requestSubApp = useCallback((key, path) => {
    setSubApps((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), pendingPath: path, currentPath: path },
    }))
  }, [])

  /** 取出并清除待定位路径（宿主页加载完成后调用） */
  const consumePendingPath = useCallback(
    (key) => {
      const path = subApps[key]?.pendingPath
      if (path) {
        setSubApps((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), pendingPath: undefined } }))
      }
      return path
    },
    [subApps],
  )

  const value = useMemo(
    () => ({
      subApps,
      registerMenus,
      unregister,
      setMicroApp,
      requestSubApp,
      consumePendingPath,
      setCurrentPath,
    }),
    [
      subApps,
      registerMenus,
      unregister,
      setMicroApp,
      requestSubApp,
      consumePendingPath,
      setCurrentPath,
    ],
  )

  return <SubAppContext.Provider value={value}>{children}</SubAppContext.Provider>
}

export function useSubApps() {
  const ctx = useContext(SubAppContext)
  if (!ctx) throw new Error('useSubApps 必须在 <SubAppProvider> 内使用')
  return ctx
}
