import { useCallback, useEffect, useState } from 'react'

/**
 * 全屏 Hook：对指定元素调用 Fullscreen API，并同步当前全屏状态。
 * 来自某存量后台项目的全屏写法（多前缀兼容），收敛为 Hook。
 */
export function useFullscreen(targetRef) {
  const [isFull, setIsFull] = useState(false)

  const enter = useCallback(() => {
    const el = targetRef.current
    if (el?.requestFullscreen) el.requestFullscreen()
  }, [targetRef])

  const exit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
  }, [])

  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return { isFull, enter, exit, toggle: () => (isFull ? exit() : enter()) }
}
