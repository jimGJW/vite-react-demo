/**
 * 海洋看板抓取层：与 src/lib/geo/useGeoData.js 同构。
 * 组件只消费 data / error / loading，不感知数据来自哪个源。
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/** 海浪 30 分钟（预报数据小时级足够）、实测潮位 6 分钟、高低潮预报 1 小时、全球海域 1 小时、
 *  ONI 12 小时；气旋 10 分钟（风暴路径更新快）、气候振荡与海洋温度距平 12 小时（月更）、
 *  站点气温 30 分钟；浮标 20 分钟（NDBC 本身为整点后 10 分钟内回传，拉更勤是空转） */
const POLL = {
  waves: 30 * 60_000,
  tides: 6 * 60_000,
  tidePred: 60 * 60_000,
  globalWaves: 3600_000,
  oni: 12 * 3600_000,
  cyclones: 10 * 60_000,
  oscillations: 12 * 3600_000,
  ssta: 12 * 3600_000,
  stationWeather: 30 * 60_000,
  buoys: 20 * 60_000,
}

async function getJSON(url, signal) {
  const res = await fetch(url, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * 单源轮询。与 useGeoData 的 usePolling 相同：mountRef 跳过首次同步 setState
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

export function useOceanData() {
  const waves = usePolling('/api/ocean/waves', POLL.waves)
  const tides = usePolling('/api/ocean/tides', POLL.tides)
  const tidePred = usePolling('/api/ocean/tide-pred', POLL.tidePred)
  const globalWaves = usePolling('/api/ocean/global-waves', POLL.globalWaves)
  const oni = usePolling('/api/ocean/oni', POLL.oni)
  const cyclones = usePolling('/api/ocean/cyclones', POLL.cyclones)
  const oscillations = usePolling('/api/ocean/oscillations', POLL.oscillations)
  const ssta = usePolling('/api/ocean/ssta', POLL.ssta)
  const stationWeather = usePolling('/api/ocean/station-weather', POLL.stationWeather)
  const buoys = usePolling('/api/ocean/buoys', POLL.buoys)

  return {
    waves,
    tides,
    tidePred,
    globalWaves,
    oni,
    cyclones,
    oscillations,
    ssta,
    stationWeather,
    buoys,
    anyLoading:
      waves.loading || tides.loading || tidePred.loading || globalWaves.loading || oni.loading ||
      cyclones.loading || oscillations.loading || ssta.loading || stationWeather.loading ||
      buoys.loading,
    reloadAll: useCallback(() => {
      waves.reload()
      tides.reload()
      tidePred.reload()
      globalWaves.reload()
      oni.reload()
      cyclones.reload()
      oscillations.reload()
      ssta.reload()
      stationWeather.reload()
      buoys.reload()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      waves.reload,
      tides.reload,
      tidePred.reload,
      globalWaves.reload,
      oni.reload,
      cyclones.reload,
      oscillations.reload,
      ssta.reload,
      stationWeather.reload,
      buoys.reload,
    ]),
  }
}
