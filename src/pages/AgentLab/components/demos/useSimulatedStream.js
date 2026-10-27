/**
 * 共享演示 Hook：按指定节奏把一段文本「流式」吐出
 * ===============================================================
 * AgentLab 对比演示的公共引擎（与 ChatBot 正式协议解耦，纯演示用）：
 * - mode 'char' 逐字 / 'word' 逐词（按空格与 CJK 边界）/ 'instant' 整段
 * - speed 为每秒字符数（instant 忽略）
 * - 卸载自动清理定时器；stop 保留已输出（AbortController 语义），reset 清空
 */
import { useCallback, useEffect, useRef, useState } from 'react'

/** 逐词切分：连续 CJK 逐字为词，拉丁串按空格聚合成词 */
function toTokens(text) {
  const tokens = []
  const re = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]|[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+|\s+/g
  let m
  while ((m = re.exec(text)) !== null) tokens.push(m[0])
  return tokens.length ? tokens : [text]
}

export function useSimulatedStream({ text, mode = 'char', speed = 60 }) {
  const [out, setOut] = useState('')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const tickRef = useRef(null)
  const startedAtRef = useRef(0)

  const clearTimers = useCallback(() => {
    clearInterval(timerRef.current)
    clearInterval(tickRef.current)
    timerRef.current = null
    tickRef.current = null
  }, [])

  const start = useCallback(() => {
    clearTimers()
    if (!text) return
    if (mode === 'instant') {
      setOut(text)
      setRunning(true)
      setElapsed(0)
      /* 整段渲染也要有「完成」时刻：一个短定时器后停表 */
      tickRef.current = setTimeout(() => setRunning(false), 300)
      return
    }
    const tokens = mode === 'word' ? toTokens(text) : Array.from(text)
    const msPerTick = 30
    const perTick = Math.max(1, (speed * msPerTick) / 1000)
    let i = 0
    setOut('')
    setRunning(true)
    startedAtRef.current = Date.now()
    setElapsed(0)
    tickRef.current = setInterval(() => {
      setElapsed(Date.now() - startedAtRef.current)
    }, 100)
    timerRef.current = setInterval(() => {
      i = Math.min(tokens.length, i + perTick)
      setOut(tokens.slice(0, Math.floor(i)).join(''))
      if (i >= tokens.length) {
        clearTimers()
        setElapsed(Date.now() - startedAtRef.current)
        setRunning(false)
      }
    }, msPerTick)
  }, [text, mode, speed, clearTimers])

  const stop = useCallback(() => {
    clearTimers()
    setRunning(false)
  }, [clearTimers])

  const reset = useCallback(() => {
    clearTimers()
    setRunning(false)
    setOut('')
    setElapsed(0)
  }, [clearTimers])

  /* 卸载清理（不含 setState，符合 react-hooks 纯度规则） */
  useEffect(() => clearTimers, [clearTimers])

  const done = !running && out.length >= text.length && text.length > 0
  const progress = text.length ? Math.min(1, out.length / text.length) : 0
  const cps = elapsed > 0 ? Math.round((out.length / elapsed) * 1000) : 0

  return { out, running, done, elapsed, progress, cps, start, stop, reset }
}
