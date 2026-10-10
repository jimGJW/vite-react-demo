/**
 * 星表加载 hook —— 一次性拉取 public/data/star-catalog.json，进程内缓存。
 *
 * 为什么不用通用 usePolling：
 *   星表是**静态**资源（build-star-catalog.mjs 的产物），既不需要轮询也不需要失败重试。
 *   唯一要处理的是「多组件同时挂载时别发多次请求」，
 *   所以这里用一个模块级 promise 做去重（单飞 / single-flight）。
 */

import { useEffect, useState } from 'react'

const CATALOG_URL = '/data/star-catalog.json'

/** 模块级缓存：null=未开始，Promise=请求中，对象=已加载成功 */
let cache = null
/** 缓存解析出来的数据（供惰性初始化直接取，避免首帧后再 setState） */
let resolved = null

/** 供测试与手动刷新使用 */
export function resetStarCatalogCache() {
  cache = null
  resolved = null
}

/** 结构校验：字段缺失说明产物结构变了，前端会拿到一堆 undefined */
function assertShape(d) {
  if (!d || !Array.isArray(d.stars) || !Array.isArray(d.constellations)) {
    throw new Error('星表结构异常（缺 stars / constellations 字段）')
  }
  return d
}

/**
 * 启动一次加载（单飞）。失败时把 cache 清成 null，下次调用会重试。
 */
function start() {
  if (!cache) {
    cache = fetch(CATALOG_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`星表加载失败 HTTP ${r.status}`)
        return r.json()
      })
      .then(assertShape)
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

export function useStarCatalog() {
  // 惰性初始化：命中模块级缓存时首帧就有数据，
  // 绕开「在 effect 里同步 setState」这个级联渲染反模式（react-hooks/set-state-in-effect）
  const [catalog, setCatalog] = useState(resolved)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (resolved) return undefined // 已在首帧拿到，无需订阅
    let alive = true
    start().then(
      (d) => {
        if (alive) setCatalog(d)
      },
      (e) => {
        if (alive) setError(String((e && e.message) || e))
      },
    )
    return () => {
      alive = false
    }
  }, [])

  return { catalog, error }
}
