import { useEffect, useState } from 'react'

/**
 * 实时帧率采样。
 *
 * 设计取舍：不是每帧都 setState，而是每 sampleMs 汇总一次再更新。
 * 否则「测帧率的组件自己每帧重渲染」，测出来的就是自己的开销，结论失真。
 *
 * @param {object}  o
 * @param {boolean}[o.running]  是否开始采样（false 时自动停掉 rAF）
 * @param {number} [o.sampleMs] 汇总间隔（ms），默认 500
 * @param {number} [o.keep]     保留多少个采样点用于画折线，默认 60
 * @returns {{ fps: number, history: number[] }}
 */
export function useFps({ running = true, sampleMs = 500, keep = 60 } = {}) {
  const [fps, setFps] = useState(0)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!running) return undefined
    if (typeof requestAnimationFrame === 'undefined') return undefined

    let raf = 0
    let last = 0
    let frames = 0
    let acc = 0
    let stopped = false

    const tick = (now) => {
      if (stopped) return
      if (last === 0) {                      // 首帧只记基准时间，不算间隔
        last = now
        raf = requestAnimationFrame(tick)
        return
      }
      const dt = now - last
      last = now
      frames += 1
      acc += dt
      if (acc >= sampleMs) {
        const value = Math.round((frames * 1000) / acc)
        setFps(value)
        setHistory((h) => [...h, value].slice(-keep))
        frames = 0
        acc = 0
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [running, sampleMs, keep])

  return { fps, history }
}
