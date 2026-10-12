/**
 * 时间与倒计时。
 *
 * 本文件由 hooks.js 按职责域拆分而来，实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js。
 */

import { useState, useEffect, useRef, useCallback } from 'react'

/** setInterval 封装（delay 为 null 时暂停） */
export function useInterval(fn, delay) {
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn }, [fn])
  useEffect(() => {
    if (delay == null) return undefined
    const id = setInterval(() => fnRef.current?.(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/** setTimeout 封装（delay 为 null 时不启动） */
export function useTimeout(fn, delay) {
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn }, [fn])
  useEffect(() => {
    if (delay == null) return undefined
    const id = setTimeout(() => fnRef.current?.(), delay)
    return () => clearTimeout(id)
  }, [delay])
}
/* =====================================================================
   时间与倒计时
   ===================================================================== */

/**
 * 返回「当前时间」，按 intervalMs 自动刷新。
 * 做时钟、相对时间（刚刚 / 3 分钟前）自动更新时很好用。
 * @param {number} intervalMs 刷新间隔；传 null 则不自动刷新
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useInterval(() => setNow(new Date()), intervalMs)
  return now
}

/**
 * 倒计时。基于「目标时间戳」而不是每轮减一 ——
 * 标签页被浏览器降频时 setInterval 会漂，按时间戳算才不会越走越慢。
 *
 * @param {number} seconds 总秒数
 * @param {object} [o]
 * @param {boolean}[o.autoStart] 是否立即开始
 * @param {Function}[o.onFinish] 归零时回调
 * @returns {{ left:number, running:boolean, start:(s?:number)=>void, stop:()=>void, reset:()=>void }}
 */
export function useCountdown(seconds = 60, { autoStart = false, onFinish } = {}) {
  const total = Math.max(0, Math.floor(seconds))
  const [left, setLeft] = useState(total)
  const [deadline, setDeadline] = useState(null)
  const onFinishRef = useRef(onFinish)

  useEffect(() => { onFinishRef.current = onFinish }, [onFinish])

  const start = useCallback((s) => {
    const n = Math.max(0, Math.floor(typeof s === 'number' ? s : total))
    setLeft(n)
    setDeadline(Date.now() + n * 1000)
  }, [total])

  const stop = useCallback(() => setDeadline(null), [])

  const reset = useCallback(() => {
    setDeadline(null)
    setLeft(total)
  }, [total])

  useInterval(() => {
    if (deadline == null) return
    const rest = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    setLeft(rest)
    if (rest === 0) {
      setDeadline(null)
      if (onFinishRef.current) onFinishRef.current()
    }
  }, deadline == null ? null : 500)

  /* 声明了 autoStart 就在挂载后启动一次（惰性触发，避免挂载即加载） */
  const startedRef = useRef(false)
  useEffect(() => {
    if (!autoStart || startedRef.current) return
    startedRef.current = true
    start(total)
  }, [autoStart, start, total])

  return { left, running: deadline != null, start, stop, reset }
}
