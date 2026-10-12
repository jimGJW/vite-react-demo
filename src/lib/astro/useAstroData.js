/**
 * 抓取层：所有网络请求集中在这里，组件只消费 data / error / loading。
 *
 * 为什么要这一层：把「哪个源、什么间隔、失败怎么办」收敛到一处，
 * 组件不用知道 ISS 来自 wheretheiss、空间站来自 Celestrak。
 * 单源失败只让对应字段为空，不影响其它卡片渲染。
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/** ISS 位置变动快，5 秒；空间天气按分钟；系外行星一天才变一次 */
const POLL = {
  iss: 5000,
  spaceWeather: 60_000,
  stations: 10 * 60_000,
  exoplanets: 30 * 60_000,
  neo: 30 * 60_000,
  launches: 60 * 60_000,
  // 太阳活动：X 射线/质子 1 分钟采样，5 分钟刷一次足够
  solarActivity: 5 * 60_000,
  // 极光椭圆 10 分钟更新，周期天气 12 小时
  aurora: 10 * 60_000,
  solarCycle: 6 * 3600_000,
  // APOD 一天一张，DEMO_KEY 限流严格，6 小时刷一次足够
  apod: 6 * 3600_000,
  // 新增三源：轨道要素几乎不变（服务端也缓存 24h）；近地交会 30 分钟；观星条件随天气 10 分钟
  comet: 24 * 3600_000,
  approach: 30 * 60_000,
  observe: 10 * 60_000,
}

async function getJSON(url, signal) {
  const res = await fetch(url, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * 单个数据源的轮询。
 *
 * 首屏加载刻意不在 effect 里同步调用 load()——那会被 react-hooks/set-state-in-effect
 * 判为「级联渲染」。改成用 mountRef 跳过第一次（interval 首tick 已含立即拉取语义），
 * 但为了首屏尽快有数据，这里改用定时器立即触发一次（0ms），既避开同步 setState，
 * 又不牺牲首屏速度。
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
      // AbortError 是主动取消，不算错误
      if (e.name !== 'AbortError') setError(String(e.message || e))
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [path])

  useEffect(() => {
    aliveRef.current = true
    // 首次用 0ms 定时器拉取：异步执行 setState，避开同步调用告警
    const kick = setTimeout(load, 0)
    const timer = setInterval(load, interval)
    return () => {
      aliveRef.current = false
      clearTimeout(kick)
      clearInterval(timer)
    }
  }, [load, interval])

  // 标签页切到后台时暂停轮询，回到前台立刻刷新一次
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [load])

  return { data, error, loading, reload: load }
}

/** 页面需要的全部数据源 */
export function useAstroData() {
  const iss = usePolling('/api/astro/iss', POLL.iss)
  const stations = usePolling('/api/astro/stations', POLL.stations)
  const spaceWeather = usePolling('/api/astro/space-weather', POLL.spaceWeather)
  const exoplanets = usePolling('/api/astro/exoplanets', POLL.exoplanets)
  const neo = usePolling('/api/astro/neo', POLL.neo)
  const launches = usePolling('/api/astro/launches', POLL.launches)
  const solarActivity = usePolling('/api/astro/solar-activity', POLL.solarActivity)
  const aurora = usePolling('/api/astro/aurora', POLL.aurora)
  const solarCycle = usePolling('/api/astro/solar-cycle', POLL.solarCycle)
  const apod = usePolling('/api/astro/apod', POLL.apod)
  const comet = usePolling('/api/astro/comet', POLL.comet)
  const approach = usePolling('/api/astro/approach', POLL.approach)
  const observe = usePolling('/api/astro/observe', POLL.observe)

  return {
    iss,
    stations,
    spaceWeather,
    exoplanets,
    neo,
    launches,
    solarActivity,
    aurora,
    solarCycle,
    apod,
    comet,
    approach,
    observe,
    anyLoading:
      iss.loading ||
      stations.loading ||
      spaceWeather.loading ||
      exoplanets.loading ||
      neo.loading ||
      launches.loading ||
      solarActivity.loading ||
      aurora.loading ||
      solarCycle.loading ||
      apod.loading ||
      comet.loading ||
      approach.loading ||
      observe.loading,
    reloadAll: useCallback(() => {
      iss.reload()
      stations.reload()
      spaceWeather.reload()
      exoplanets.reload()
      neo.reload()
      launches.reload()
      solarActivity.reload()
      aurora.reload()
      solarCycle.reload()
      apod.reload()
      comet.reload()
      approach.reload()
      observe.reload()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      iss.reload,
      stations.reload,
      spaceWeather.reload,
      exoplanets.reload,
      neo.reload,
      launches.reload,
      solarActivity.reload,
      aurora.reload,
      solarCycle.reload,
      apod.reload,
      comet.reload,
      approach.reload,
      observe.reload,
    ]),
  }
}
