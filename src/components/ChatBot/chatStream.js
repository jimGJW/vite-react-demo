/**
 * ChatBot 流式协议层（纯函数 · 零依赖）
 * ===============================================================
 * 后端返回的「不是标准 SSE」：没有 `data:` 前缀，
 * 响应体是「逐行 JSON」——按 `\n` 切分后，每行 JSON.parse 得到一帧。
 *
 * 三类帧：
 *   ① 状态帧  { type: "status", state: "body-reset" | 其它, message: "正在查询…" }
 *   ② 内容帧  { sessionId, sessionDetailId, recommend, output: { choices: [ { finish_reason, message } ] } }
 *   ③ 错误帧  { code: "1001" | "1002" | "2001" | "2002" | "2003" | "3001" }
 *
 * message 字段：
 *   { content: "正文 或 卡片 JSON 字符串", contentType: null | "list" | "table" | "taskTable" | "echart",
 *     title: "卡片标题", taskIds: [] }
 */

/** 状态帧标识 */
export const FRAME_STATUS = 'status'

/** 「全新的开始」分隔条标记（后端约定 0000 表示此处开启新上下文） */
export const NEW_CHAT_MARK = '0000'

/** 错误码 → 语义 key */
export const STREAM_ERROR_CODES = {
  1001: 'invalid-user',
  1002: 'auth-error',
  2001: 'session-not-found',
  2002: 'points-exhausted',
  2003: 'quota-exhausted',
  3001: 'network-error',
}

/** 语义 key → 用户文案 */
export const STREAM_ERROR_MESSAGES = {
  'invalid-user': '登录状态已失效，请重新登录',
  'auth-error': '身份校验失败，请重新登录',
  'session-not-found': '会话不存在，已为你开启新会话',
  'points-exhausted': '可用积分已用完',
  'quota-exhausted': '今日额度已用完',
  'network-error': '网络或系统异常，请稍后重试',
  unknown: '服务异常，请稍后重试',
}

/**
 * 规则 1：只累加「无 contentType 且非 stop」的纯文本帧。
 * @param {{content?:any, contentType?:any}} delta 当前帧的 message
 * @param {string|null|undefined} finishReason 结束原因
 */
export function shouldAccumulateStreamText(delta, finishReason) {
  return delta?.content != null && !delta.contentType && finishReason !== 'stop'
}

/**
 * 规则 2：正文一到，立刻撤掉「状态条」（工具调用提示）。
 */
export function shouldClearStatusForText(delta, finishReason) {
  return !!delta?.content && !delta.contentType && finishReason !== 'stop'
}

/**
 * 规则 3：stop 帧的 content 是最终权威正文（完整文本或卡片 JSON）。
 *
 * 为什么这样设计：后端在 stop 帧会回传完整正文。
 * 若把 stop 帧内容再追加到已流式累积的文本后面，答案会重复一遍。
 * 因此流式文本只作为中间态，stop 帧一锤定音。
 */
export function resolveMessageBody({ delta, finishReason, streamedText = '' }) {
  return finishReason === 'stop' ? (delta?.content ?? streamedText) : streamedText
}

/**
 * 把原始帧归一化，便于上层 switch。
 * @returns {{kind:'status'|'content'|'error'|'unknown', frame:object, delta?:object, finishReason?:any, code?:string}}
 */
export function classifyFrame(frame) {
  if (!frame || typeof frame !== 'object') return { kind: 'unknown', frame }

  if (frame.type === FRAME_STATUS) {
    return { kind: 'status', frame, state: frame.state, message: frame.message }
  }

  const choice = frame?.output?.choices?.[0]
  if (choice) {
    return {
      kind: 'content',
      frame,
      delta: choice.message ?? {},
      finishReason: choice.finish_reason ?? null,
    }
  }

  if (frame.code != null) {
    return { kind: 'error', frame, code: String(frame.code) }
  }

  return { kind: 'unknown', frame }
}

/** 错误码/语义 → 用户文案 */
export function resolveErrorMessage(codeOrKey) {
  const key = STREAM_ERROR_CODES[codeOrKey] ?? codeOrKey ?? 'unknown'
  return STREAM_ERROR_MESSAGES[key] ?? STREAM_ERROR_MESSAGES.unknown
}

/**
 * 去掉标准 SSE 的 `data:` 前缀。
 * 我们的后端返回的是「裸」逐行 JSON，但同一套解析器也兼容标准 SSE 报文
 * （`data: {...}` / `data: [DONE]` / `event:`、`id:`、`retry:` 行与 `:` 心跳注释）。
 */
export function stripSsePrefix(line) {
  const text = String(line ?? '').trim()
  return text.startsWith('data:') ? text.slice(5).trim() : text
}

/**
 * 逐行 JSON 解析器：容忍 TCP 半包（尾行留在缓冲区）与空行；非法行静默忽略。
 * @param {(obj:object)=>void} onFrame
 */
export function createLineJsonParser(onFrame) {
  let buffer = ''

  const emit = (raw) => {
    const text = stripSsePrefix(raw)
    if (!text || text === '[DONE]') return
    try {
      onFrame(JSON.parse(text))
    } catch {
      /* 非 JSON 行：SSE 的 event/id/retry 行或心跳注释，忽略 */
    }
  }

  return {
    push(chunk) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? '' // 尾行可能是半包，留到下一片
      for (const line of lines) emit(line)
    },
    flush() {
      const rest = buffer
      buffer = ''
      emit(rest)
    },
  }
}

/**
 * 消费一个 fetch Response（需具备 body reader），逐帧回调。
 * 支持通过 AbortSignal 中断（停止回答）。
 */
export async function consumeStream(response, { onFrame, onError } = {}) {
  const reader = response?.body?.getReader?.()
  if (!reader) throw new Error('响应不可读：缺少 body reader')
  const decoder = new TextDecoder()
  const parser = createLineJsonParser(onFrame)
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      parser.push(decoder.decode(value, { stream: true }))
    }
    parser.flush()
  } catch (err) {
    onError?.(err)
    throw err
  }
}
