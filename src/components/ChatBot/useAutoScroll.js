/**
 * useAutoScroll —— 对话区「智能吸底」滚动
 * ===============================================================
 * 直接对内容变化无脑 `scrollTo(scrollHeight)` 有两个问题：
 *   ① 流式生成时每帧触发一次 smooth 滚动，动画被不断打断 → 视觉抖动、掉帧；
 *   ② 用户向上翻看历史时会被强行拽回底部，无法阅读。
 *
 * 这里改为「吸底」（stick-to-bottom）语义：
 *   - 监听滚动位置，距底部 NEAR_BOTTOM_PX 以内视为「用户想看最新内容」；
 *   - 内容变化时只有处于吸底状态才跟随，且用 instant 避免动画排队；
 *   - 用户主动发送消息时调用 pinToBottom() 强制回到吸底。
 *
 * 注意：跟随必须用 `behavior: 'instant'`。`'auto'` 会读取 CSS 的
 * `scroll-behavior`，若容器设了 smooth 依旧会每帧重启动画。
 */

import { useCallback, useEffect, useRef } from 'react'

/** 距底部多少像素以内仍视为「吸底」 */
const NEAR_BOTTOM_PX = 80

/**
 * @param {{current: HTMLElement|null}} containerRef 滚动容器
 * @param {unknown} signal 内容信号：变化即尝试跟随（通常传消息数组）
 */
export function useAutoScroll(containerRef, signal) {
  const stickRef = useRef(true)
  const rafRef = useRef(0)

  /** 立即滚到底（默认 instant，绕过 CSS smooth 以免动画被后续帧打断） */
  const scrollToBottom = useCallback(
    (behavior = 'instant') => {
      const el = containerRef?.current
      if (!el) return
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior })
      })
    },
    [containerRef],
  )

  /** 强制吸底并滚到底（用户主动发消息时调用） */
  const pinToBottom = useCallback(
    (behavior = 'smooth') => {
      stickRef.current = true
      scrollToBottom(behavior)
    },
    [scrollToBottom],
  )

  /* 记录用户是否停留在底部 */
  useEffect(() => {
    const el = containerRef?.current
    if (!el) return undefined
    const onScroll = () => {
      stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [containerRef])

  /* 内容变化：仅吸底状态下跟随 */
  useEffect(() => {
    if (!stickRef.current) return undefined
    scrollToBottom('instant')
    return () => cancelAnimationFrame(rafRef.current)
  }, [signal, scrollToBottom])

  return { scrollToBottom, pinToBottom, stickRef }
}

export default useAutoScroll
