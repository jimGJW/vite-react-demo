/**
 * ChatBot HTTP 客户端
 * ===============================================================
 * 把「请求封装」从组件里彻底解耦出来：调用方注入 baseURL / token / endpoints 即可，
 * 组件本身不关心是 fetch、axios 还是别的实现。
 *
 * 与 mockBackend 保持完全一致的方法签名，因此可以在两者之间自由切换：
 *   api.sendChat(payload, { signal, onFrame, onError })
 *   api.get(path, params, { signal })
 *   api.post(path, body, { signal })
 *   api.del(path, params, { signal })
 *
 * 内置能力：
 *   · 超时（默认 30s；流式请求只对「建立连接」计时，正文流不限时）
 *   · 401 回调、错误体解析（把后端的 msg / message 带进异常信息）
 *   · credentials 可配（跨域带 Cookie 的场景）
 *   · 响应信封兼容 { code, msg, data } 与 { success: false }
 */

import { DEFAULT_ENDPOINTS } from './config.js'
import { consumeStream } from './chatStream.js'

/** 默认超时（ms）。设为 0 表示不限时 */
export const DEFAULT_TIMEOUT = 30_000

function joinUrl(baseURL, path) {
  if (!path) return baseURL || ''
  if (/^https?:\/\//i.test(path)) return path
  const base = (baseURL || '').replace(/\/+$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

function buildQuery(params) {
  if (!params) return ''
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    usp.append(k, String(v))
  })
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}

/**
 * 把「外部 signal」与「超时」合成一个 signal。
 * 返回 clearTimer（停止计时）与 dispose（解除监听）——流式请求在拿到响应头后
 * 需要停止超时计时，但仍要保留外部 signal 的中断能力。
 */
function timeoutSignal(signal, ms) {
  if (!ms || ms <= 0) return { signal, clearTimer: () => {}, dispose: () => {} }

  const ctrl = new AbortController()
  const timer = setTimeout(() => {
    const err = new Error('请求超时')
    err.name = 'TimeoutError'
    ctrl.abort(err)
  }, ms)

  const onAbort = () => ctrl.abort(signal?.reason)
  if (signal) {
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  return {
    signal: ctrl.signal,
    clearTimer: () => clearTimeout(timer),
    dispose: () => {
      clearTimeout(timer)
      signal?.removeEventListener?.('abort', onAbort)
    },
  }
}

/** 尽量从错误响应体里取出可读信息 */
async function readError(res) {
  let detail = ''
  try {
    const text = await res.text()
    if (text) {
      try {
        const json = JSON.parse(text)
        detail = json?.msg || json?.message || json?.error || ''
      } catch {
        detail = text.slice(0, 200)
      }
    }
  } catch {
    /* 忽略：读不出就用状态码 */
  }
  return detail ? `HTTP ${res.status}：${detail}` : `HTTP ${res.status}`
}

/** 兼容 { code, msg, data } / { success:false } 信封：成功取 data，失败抛错 */
function unwrap(json) {
  if (!json || typeof json !== 'object') return json
  if (json.success === false) throw new Error(json.msg || json.message || '接口返回失败')
  if ('data' in json && ('code' in json || 'msg' in json)) {
    const code = json.code
    const ok = code === undefined || code === 0 || code === 200 || code === '0' || code === '200'
    if (!ok) throw new Error(json.msg || `接口返回错误码 ${code}`)
    return json.data
  }
  return json
}

/**
 * @param {object} options
 * @param {string} [options.baseURL] 网关前缀，如 'https://api.example.com'
 * @param {object} [options.endpoints] 覆盖 DEFAULT_ENDPOINTS
 * @param {() => string} [options.getToken] 返回 Authorization 头（不含前缀）
 * @param {object} [options.headers] 额外请求头
 * @param {number} [options.timeout] 超时毫秒数，默认 30000，0 为不限时
 * @param {RequestCredentials} [options.credentials] fetch 的 credentials，默认 'same-origin'
 * @param {(res:Response)=>void} [options.onUnauthorized] 401 回调
 */
export function createHttpApi({
  baseURL = '',
  endpoints = {},
  getToken,
  headers: extraHeaders,
  timeout = DEFAULT_TIMEOUT,
  credentials = 'same-origin',
  onUnauthorized,
} = {}) {
  const ep = { ...DEFAULT_ENDPOINTS, ...endpoints }

  const buildHeaders = (stream) => ({
    ...(stream ? { Accept: 'text/event-stream' } : {}),
    'Content-Type': 'application/json',
    ...(getToken ? { Authorization: getToken() || '' } : {}),
    ...(extraHeaders || {}),
  })

  async function request(method, path, { params, body, signal, timeout: perCall } = {}) {
    const t = timeoutSignal(signal, perCall ?? timeout)
    try {
      const res = await fetch(joinUrl(baseURL, path) + buildQuery(params), {
        method,
        signal: t.signal,
        credentials,
        headers: buildHeaders(false),
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (res.status === 401) onUnauthorized?.(res)
      if (!res.ok) throw new Error(await readError(res))
      const text = await res.text()
      if (!text) return null
      return unwrap(JSON.parse(text))
    } finally {
      t.dispose()
    }
  }

  return {
    kind: 'http',
    endpoints: ep,

    /** 发消息：流式读取逐行 JSON，逐帧回调 onFrame */
    async sendChat(payload, { signal, onFrame, onError, timeout: perCall } = {}) {
      const t = timeoutSignal(signal, perCall ?? timeout)
      let res
      try {
        res = await fetch(joinUrl(baseURL, ep.generation), {
          method: 'POST',
          signal: t.signal,
          credentials,
          headers: buildHeaders(true),
          body: JSON.stringify(payload),
        })
      } catch (err) {
        t.dispose()
        throw err
      }

      // 已拿到响应头：连接阶段结束，停止计时；正文流可以长时间输出
      t.clearTimer()
      if (res.status === 401) onUnauthorized?.(res)
      if (!res.ok) {
        t.dispose()
        throw new Error(await readError(res))
      }

      try {
        await consumeStream(res, { onFrame, onError })
      } finally {
        t.dispose()
      }
    },

    get: (path, params, opts) => request('GET', path, { params, ...opts }),
    post: (path, body, opts) => request('POST', path, { body, ...opts }),
    del: (path, params, opts) => request('DELETE', path, { params, ...opts }),
  }
}
