import { useCallback, useEffect, useRef, useState } from 'react'

/* =====================================================================
   浏览器原生能力 Hooks

   通用约定：
     · 每个 Hook 都返回 supported 字段，不支持时页面直接给出说明，而不是静默失败；
     · SSR 安全 —— 所有 navigator / document 访问都带 typeof 保护；
     · 内部状态放 state，不放 ref（WakeLock 的 sentinel 只在回调里用，不返回）。
   ===================================================================== */

/**
 * 全屏切换。
 * @param {object} [targetRef] 要全屏的元素；不传则全屏整个文档
 */
export function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const supported = typeof document !== 'undefined'
    && typeof document.documentElement.requestFullscreen === 'function'

  const toggle = useCallback(() => {
    if (typeof document === 'undefined') return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      return
    }
    const el = targetRef && targetRef.current
    if (el && typeof el.requestFullscreen === 'function') el.requestFullscreen()
    else document.documentElement.requestFullscreen?.()
  }, [targetRef])

  return { isFullscreen, toggle, supported }
}

/**
 * Screen Wake Lock：阻止屏幕休眠。
 * 页面隐藏时浏览器会自动释放，回到前台需要重新申请 —— 这点在 returned 的
 * autoReleaseHint 里说明，避免调用方以为锁一直有效。
 */
export function useWakeLock() {
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const sentinelRef = useRef(null)

  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  const request = useCallback(async () => {
    if (!supported) {
      setError('当前浏览器不支持 Screen Wake Lock（Safari 低版本 / 非安全上下文）')
      return false
    }
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      sentinelRef.current = sentinel
      sentinel.addEventListener('release', () => setActive(false))
      setActive(true)
      setError('')
      return true
    } catch (err) {
      setError(String((err && err.message) || err))
      return false
    }
  }, [supported])

  const release = useCallback(() => {
    const sentinel = sentinelRef.current
    if (sentinel && typeof sentinel.release === 'function') sentinel.release()
    sentinelRef.current = null
    setActive(false)
  }, [])

  /* 卸载时务必释放，否则锁会一直挂着 */
  useEffect(() => () => {
    const sentinel = sentinelRef.current
    if (sentinel && typeof sentinel.release === 'function') sentinel.release()
    sentinelRef.current = null
  }, [])

  return { active, error, supported, request, release }
}

/** 地理定位：一次性获取当前坐标 */
export function useGeolocation() {
  const [state, setState] = useState({ loading: false, coords: null, error: '' })

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const locate = useCallback(() => {
    if (!supported) {
      setState({ loading: false, coords: null, error: '当前环境不支持地理定位' })
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ loading: false, coords: pos.coords, error: '' }),
      (err) => setState({ loading: false, coords: null, error: err.message || '定位失败或被拒绝' }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  }, [supported])

  return { ...state, supported, locate }
}

/** 系统通知：授权 + 发送 */
export function useNotification() {
  const supported = typeof Notification !== 'undefined'
  const [permission, setPermission] = useState(
    supported ? Notification.permission : 'unsupported',
  )

  const request = useCallback(async () => {
    if (!supported) return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [supported])

  const notify = useCallback((title, options) => {
    if (!supported || permission !== 'granted') return false
    new Notification(title, options)
    return true
  }, [supported, permission])

  return { supported, permission, request, notify }
}

/** Web Share：调起系统分享面板 */
export function useShare() {
  const supported = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const share = useCallback(async (data) => {
    if (!supported) return false
    try {
      await navigator.share(data)
      return true
    } catch {
      return false                 // 用户取消也会走这里，不算错误
    }
  }, [supported])

  return { supported, share }
}

/**
 * 网络信息（Network Information API）。
 * 初值在 useState 惰性初始化里读，effect 只挂监听 ——
 * 避免在 effect 里同步 setState 触发 React Compiler 告警。
 */
function readConnection() {
  if (typeof navigator === 'undefined') return null
  const conn = navigator.connection
  if (!conn) return null
  return {
    effectiveType: conn.effectiveType || '',
    downlink: typeof conn.downlink === 'number' ? conn.downlink : 0,
    rtt: typeof conn.rtt === 'number' ? conn.rtt : 0,
    saveData: Boolean(conn.saveData),
  }
}

export function useNetworkInfo() {
  const [info, setInfo] = useState(readConnection)

  useEffect(() => {
    if (typeof navigator === 'undefined') return undefined
    const conn = navigator.connection
    if (!conn || typeof conn.addEventListener !== 'function') return undefined

    const sync = () => setInfo(readConnection())
    conn.addEventListener('change', sync)
    return () => conn.removeEventListener('change', sync)
  }, [])

  return info
}

/** 设备震动 */
export function useVibrate() {
  const supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  const vibrate = useCallback((pattern) => {
    if (!supported) return false
    return navigator.vibrate(pattern)
  }, [supported])
  return { supported, vibrate }
}
