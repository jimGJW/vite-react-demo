/**
 * useShareConversation —— 分享对话的取数与归一化
 * ===============================================================
 * 只做一件事：把 `userShareId` 变成 `ConversationItem[]`。
 * 不含任何 UI，想自己画界面时单独用它即可。
 *
 *   const { data, loading, error, sessionId, reload } = useShareConversation({
 *     userShareId, request, api: { getShareMessage: '/aigc/shareMessage' },
 *   })
 *
 * ── 为什么注入项都放进 ref ────────────────────────────────────────
 * `request` / `api` / `transform` 在调用方通常写成内联对象，
 * 每次父组件重渲染都是新引用。若把它们放进 useCallback 依赖，
 * 就会「父组件一动 → 重新请求一次」。放进 ref 后，
 * 只有 `userShareId` 变化才真正触发拉取（文档「3.2」的约定）。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_ENDPOINTS } from '../config.js'
import {
  buildShareMessageUrl,
  normalizeShareItems,
  pickSessionId,
} from './shareProtocol.js'

/**
 * 把 `createHttpApi` / `createMockApi` 的产物适配成文档约定的
 * `{ get(url): Promise }` 形态 —— 拆掉 query，走客户端自己的 params 通道，
 * 这样 mock 与 http 两种实现都能正确匹配路由。
 */
export function toShareRequest(api) {
  return {
    get: (url, opts) => {
      const [path, qs] = String(url).split('?')
      const params = qs ? Object.fromEntries(new URLSearchParams(qs)) : undefined
      return api.get(path, params, opts)
    },
  }
}

/** 兜底请求实现：不注入任何客户端时直接走 fetch（演示 / 极简接入用） */
export function createFetchShareRequest({
  baseURL = '',
  getToken,
  headers,
  credentials = 'same-origin',
} = {}) {
  return {
    async get(url, { signal } = {}) {
      const full = /^https?:\/\//i.test(url)
        ? url
        : `${String(baseURL || '').replace(/\/+$/, '')}${url}`
      const res = await fetch(full, {
        signal,
        credentials,
        headers: {
          ...(getToken ? { Authorization: getToken() || '' } : {}),
          ...(headers || {}),
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      // 兼容 { code, msg, data } 信封
      if (json && typeof json === 'object' && !Array.isArray(json) && 'data' in json) {
        return json.data
      }
      return json
    },
  }
}

const FALLBACK_REQUEST = createFetchShareRequest()

/**
 * @param {object} options
 * @param {string} options.userShareId 分享 ID（来自 URL query）
 * @param {{ get(url: string): Promise }} [options.request] 请求实例
 * @param {{ getShareMessage?: string, endpoints?: object }} [options.api] 接口地址 / 客户端
 * @param {string|number|null} [options.flag] 权限标记，非空时拼 `&flag=`
 * @param {(res:any)=>any[]} [options.transform] 响应适配（不是数组时用它掰成数组）
 * @param {(payload:{data:any[],sessionId:string,userShareId:string})=>void} [options.onLoaded] 加载成功（埋点）
 * @param {(err:Error)=>void} [options.onError] 加载失败
 * @returns {{ data: any[], loading: boolean, error: Error|null, sessionId: string, userShareId: string, reload: () => Promise<any[]> }}
 */
export default function useShareConversation({
  userShareId,
  request,
  api,
  flag = null,
  transform,
  onLoaded,
  onError,
} = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState('')

  /* 注入项：先进 ref，避免内联对象导致重复请求 */
  const requestRef = useRef(FALLBACK_REQUEST)
  const endpointRef = useRef(DEFAULT_ENDPOINTS.shareMessage)
  const flagRef = useRef(flag)
  const transformRef = useRef(transform)
  const onLoadedRef = useRef(onLoaded)
  const onErrorRef = useRef(onError)
  const idRef = useRef(userShareId)
  const abortRef = useRef(null)

  useEffect(() => {
    idRef.current = userShareId
  }, [userShareId])

  useEffect(() => {
    requestRef.current = request || (api ? toShareRequest(api) : FALLBACK_REQUEST)
    endpointRef.current =
      api?.getShareMessage || api?.endpoints?.shareMessage || DEFAULT_ENDPOINTS.shareMessage
    flagRef.current = flag
    transformRef.current = transform
    onLoadedRef.current = onLoaded
    onErrorRef.current = onError
  })

  const reload = useCallback(async () => {
    const id = idRef.current
    if (!id) {
      setData([])
      setSessionId('')
      setError(null)
      setLoading(false)
      return []
    }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)

    try {
      const url = buildShareMessageUrl(endpointRef.current, {
        userShareId: id,
        flag: flagRef.current,
      })
      const res = await requestRef.current.get(url, { signal: ctrl.signal })
      if (ctrl.signal.aborted) return []

      const items = normalizeShareItems(res, transformRef.current)
      const sid = pickSessionId(items)

      setData(items)
      setSessionId(sid)
      onLoadedRef.current?.({ data: items, sessionId: sid, userShareId: id })
      return items
    } catch (err) {
      if (ctrl.signal.aborted || err?.name === 'AbortError') return []
      setData([])
      setSessionId('')
      setError(err instanceof Error ? err : new Error(String(err)))
      onErrorRef.current?.(err)
      return []
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }, [])

  /* userShareId 变化 → 重新拉取；卸载 / 换 ID 时中断在途请求 */
  useEffect(() => {
    reload().catch(() => {})
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [reload, userShareId])

  return { data, loading, error, sessionId, userShareId: userShareId ?? '', reload }
}
