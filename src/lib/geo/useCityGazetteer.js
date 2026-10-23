/**
 * 城市词典加载 hook —— 一次性拉取 public/data/city-gazetteer.json，进程内缓存。
 *
 * 与 useStarCatalog 同一套做法（静态产物、不轮询、不重试）：
 *   - 模块级单飞 promise，避免多处挂载发多次请求；
 *   - 惰性初始化读缓存结果，命中时首帧就有数据，绕开「effect 里同步 setState」；
 *   - 3MB 产物只在**真正用到城市查询时**才拉，所以本 hook 由按需挂载的组件调用，
 *     页面本身不提前挂载。
 */

import { useEffect, useState } from 'react'
import { parseGazetteer } from './cityGazetteer.js'

const GAZETTEER_URL = '/data/city-gazetteer.json'

/** 模块级缓存：null=未开始，Promise=请求中，对象=已加载成功 */
let cache = null
/** 缓存解析出来的表（供惰性初始化直接取，避免首帧后再 setState） */
let resolved = null

/** 供测试与手动重载使用 */
export function resetCityGazetteerCache() {
  cache = null
  resolved = null
}

/**
 * 结构校验：产物字段名换了要立刻报错，而不是让检索静默返回空列表。
 * 这里顺带把竖线行解析成对象表（一次性开销，之后每次输入只做纯查找）。
 */
function load() {
  return fetch(GAZETTEER_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`城市词典加载失败 HTTP ${r.status}`)
      return r.json()
    })
    .then((json) => {
      const table = parseGazetteer(json)
      if (!table.cities.length) throw new Error('城市词典为空（产物可能被截断）')
      return table
    })
}

function start() {
  if (!cache) {
    cache = load()
      .then((d) => {
        resolved = d
        return d
      })
      .catch((e) => {
        cache = null
        throw e
      })
  }
  return cache
}

export function useCityGazetteer() {
  const [table, setTable] = useState(resolved)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (resolved) return undefined // 已在首帧拿到，无需订阅
    let alive = true
    start().then(
      (d) => {
        if (alive) setTable(d)
      },
      (e) => {
        if (alive) setError(String((e && e.message) || e))
      },
    )
    return () => {
      alive = false
    }
  }, [])

  return { table, error, loading: !table && !error }
}
