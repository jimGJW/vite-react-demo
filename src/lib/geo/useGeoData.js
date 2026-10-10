/**
 * 地球看板抓取层：与 src/lib/astro/useAstroData.js 同构。
 * 组件只消费 data / error / loading，不感知数据来自哪个源。
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/** 地震 2 分钟（USGS feed 本身分钟级）、影像 1 小时、环境 10 分钟、自然事件 1 小时、气候指标 12 小时 */
const POLL = {
  quakes: 2 * 60_000,
  epic: 3600_000,
  env: 10 * 60_000,
  eonet: 3600_000,
  co2: 12 * 3600_000,
  seaIce: 12 * 3600_000,
}

async function getJSON(url, signal) {
  const res = await fetch(url, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * 单源轮询。与 useAstroData 的 usePolling 相同：mountRef 跳过首次同步 setState
 * （避免 react-hooks/set-state-in-effect），用 0ms 定时器立即拉一次保证首屏速度。
 */
function usePolling(path, interval) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const aliveRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const d = await getJSON(path)
      if (!aliveRef.current) return
      setData(d)
      setError(d && d.ok === false ? d.error : null)
    } catch (e) {
      if (!aliveRef.current) return
      if (e.name !== 'AbortError') setError(String(e.message || e))
    } finally {
      if (aliveRef.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  useEffect(() => {
    aliveRef.current = true
    const first = setTimeout(load, 0)
    const timer = setInterval(load, interval)
    return () => {
      aliveRef.current = false
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [load, interval])

  return { data, error, loading, reload: load }
}

export function useGeoData() {
  const quakes = usePolling('/api/geo/quakes', POLL.quakes)
  const epic = usePolling('/api/geo/epic', POLL.epic)
  const env = usePolling('/api/geo/env', POLL.env)
  const eonet = usePolling('/api/geo/eonet', POLL.eonet)
  const co2 = usePolling('/api/geo/co2', POLL.co2)
  const seaIce = usePolling('/api/geo/sea-ice', POLL.seaIce)

  return {
    quakes,
    epic,
    env,
    eonet,
    co2,
    seaIce,
    anyLoading:
      quakes.loading || epic.loading || env.loading || eonet.loading || co2.loading || seaIce.loading,
    reloadAll: useCallback(() => {
      quakes.reload()
      epic.reload()
      env.reload()
      eonet.reload()
      co2.reload()
      seaIce.reload()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      quakes.reload,
      epic.reload,
      env.reload,
      eonet.reload,
      co2.reload,
      seaIce.reload,
    ]),
  }
}
