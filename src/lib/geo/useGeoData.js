/**
 * 地球看板抓取层：与 src/lib/astro/useAstroData.js 同构。
 * 组件只消费 data / error / loading，不感知数据来自哪个源。
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/** 地震 2 分钟（EMSC feed 本身分钟级）、影像 1 小时、环境 10 分钟、自然事件 1 小时、
 *  温室气体/海冰/温度距平 12 小时（上游月更，拉再勤也没用）、强震统计 30 分钟、
 *  火山警报 30 分钟（HANS 通报按天级）、海啸公告 10 分钟（真有事件时是分钟级） */
const POLL = {
  quakes: 2 * 60_000,
  epic: 3600_000,
  env: 10 * 60_000,
  eonet: 3600_000,
  ghg: 12 * 3600_000,
  seaIce: 12 * 3600_000,
  tempAnomaly: 12 * 3600_000,
  bigQuakes: 30 * 60_000,
  volcanoes: 30 * 60_000,
  tsunami: 10 * 60_000,
  // 新增三源：空气与天气随实况 10 分钟；气候档案是十年年均值，服务端缓存 24h，12 小时拉一次即可
  air: 10 * 60_000,
  weather: 10 * 60_000,
  archive: 12 * 3600_000,
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
  const ghg = usePolling('/api/geo/ghg', POLL.ghg)
  const seaIce = usePolling('/api/geo/sea-ice', POLL.seaIce)
  const tempAnomaly = usePolling('/api/geo/temp-anomaly', POLL.tempAnomaly)
  const bigQuakes = usePolling('/api/geo/big-quakes', POLL.bigQuakes)
  const volcanoes = usePolling('/api/geo/volcanoes', POLL.volcanoes)
  const tsunami = usePolling('/api/geo/tsunami', POLL.tsunami)
  const air = usePolling('/api/geo/air', POLL.air)
  const weather = usePolling('/api/geo/weather', POLL.weather)
  const archive = usePolling('/api/geo/archive', POLL.archive)

  return {
    quakes,
    epic,
    env,
    eonet,
    ghg,
    seaIce,
    tempAnomaly,
    bigQuakes,
    volcanoes,
    tsunami,
    air,
    weather,
    archive,
    anyLoading:
      quakes.loading || epic.loading || env.loading || eonet.loading || ghg.loading ||
      seaIce.loading || tempAnomaly.loading || bigQuakes.loading ||
      volcanoes.loading || tsunami.loading || air.loading || weather.loading || archive.loading,
    reloadAll: useCallback(() => {
      quakes.reload()
      epic.reload()
      env.reload()
      eonet.reload()
      ghg.reload()
      seaIce.reload()
      tempAnomaly.reload()
      bigQuakes.reload()
      volcanoes.reload()
      tsunami.reload()
      air.reload()
      weather.reload()
      archive.reload()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      quakes.reload,
      epic.reload,
      env.reload,
      eonet.reload,
      ghg.reload,
      seaIce.reload,
      tempAnomaly.reload,
      bigQuakes.reload,
      volcanoes.reload,
      tsunami.reload,
      air.reload,
      weather.reload,
      archive.reload,
    ]),
  }
}
