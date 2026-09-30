import { useCallback, useEffect, useRef, useState } from 'react'
import { MICRO_APPS } from './config.js'
import { loadMicro } from './qiankunHost.js'
import { useSubApps } from '../contexts/SubAppContext.jsx'

/**
 * 单个子应用的加载器 Hook（qiankun）
 *
 * 职责：容器 ref、加载状态机（idle/loading/loaded/error）、load/unload、
 * 子应用卸载兜底、pendingPath 定位（侧边栏/Compare 页跳转过来时自动定位子应用内部页面）。
 *
 * 用法：每个子应用调用一次（不要在循环里调用）：
 *   const vue = useSubAppLoader('vue')
 *   const angular = useSubAppLoader('angular')
 *
 * 注意：qiankun + vite-plugin-qiankun 的生命周期桥是全局单例，同一时刻
 * 只能有一个子应用处于加载流程（并发会互相覆写导致 bootstrap 超时），
 * 需要加载多个时请串行 await。
 */
export function useSubAppLoader(key) {
  const { registerMenus, unregister, setMicroApp, consumePendingPath, setCurrentPath } = useSubApps()
  const containerRef = useRef(null)
  const handleRef = useRef(null)
  const busyRef = useRef(false)
  const [status, setStatus] = useState('idle')

  const load = useCallback(async () => {
    if (!containerRef.current || busyRef.current || handleRef.current) return
    busyRef.current = true
    /* 让出同步上下文：本函数常在 effect 中直接调用，
       先 await 再 setState 避免触发 react-hooks/set-state-in-effect */
    await Promise.resolve()
    setStatus('loading')
    try {
      if (handleRef.current) {
        await handleRef.current.unmount()
        handleRef.current = null
      }
      const title = MICRO_APPS[key]?.title || key
      const { microApp, unmount } = await loadMicro(key, containerRef.current, {
        registerMenu: (menus) => registerMenus(key, title, menus),
        /* 子应用路由变化时回传内部路径 → 侧边栏高亮「当前所在页」 */
        onRouteChange: (path) => setCurrentPath(key, path),
      })
      handleRef.current = { microApp, unmount }
      setMicroApp(key, microApp)
      setStatus('loaded')
      /* 侧边栏/Compare 页跳转过来时的定位意图：切换子应用内部页面 */
      const path = consumePendingPath(key)
      if (path && microApp) {
        try {
          microApp.update({ path })
        } catch {
          /* 子应用可能正在卸载 */
        }
      }
    } catch (e) {
      console.error('[micro] 子应用加载失败', e)
      setStatus('error')
    } finally {
      busyRef.current = false
    }
  }, [key, registerMenus, setMicroApp, consumePendingPath, setCurrentPath])

  const unload = useCallback(async () => {
    if (handleRef.current) {
      await handleRef.current.unmount().catch(() => {})
      handleRef.current = null
    }
    setMicroApp(key, null)
    unregister(key)
    setStatus('idle')
  }, [key, setMicroApp, unregister])

  /* 离开页面：卸载子应用并清掉侧边栏动态菜单 */
  useEffect(
    () => () => {
      handleRef.current?.unmount().catch(() => {})
      handleRef.current = null
      setMicroApp(key, null)
      unregister(key)
    },
    [key, setMicroApp, unregister],
  )

  return { containerRef, status, load, unload }
}
