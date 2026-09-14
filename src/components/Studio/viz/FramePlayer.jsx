import { useEffect, useState } from 'react'
import { Button, Slider } from 'antd'

/**
 * 帧序列播放器：按 fps 在若干「帧」之间循环播放，支持播放/暂停、逐帧、进度拖动。
 * 帧可以是任意 ReactNode（图片、图表快照、SVG 等）。思路来自 iws-web 的 FramePlayer。
 */
export default function FramePlayer({ frames = [], fps = 4, height = 220 }) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const total = frames.length

  useEffect(() => {
    if (!playing || total === 0) return undefined
    const t = setInterval(() => setI((p) => (p + 1) % total), 1000 / fps)
    return () => clearInterval(t)
  }, [playing, fps, total])

  return (
    <div className="st-frameplayer" style={{ height }}>
      <div className="st-frameplayer__screen">{frames[i]}</div>
      <div className="st-frameplayer__controls">
        <Button size="small" onClick={() => setPlaying((p) => !p)}>{playing ? '暂停' : '播放'}</Button>
        <Button size="small" onClick={() => setI((p) => (p - 1 + total) % total)}>上一帧</Button>
        <Button size="small" onClick={() => setI((p) => (p + 1) % total)}>下一帧</Button>
        <Slider
          min={0}
          max={Math.max(0, total - 1)}
          value={i}
          onChange={setI}
          style={{ flex: 1, margin: '0 12px' }}
          tooltip={{ formatter: (v) => `帧 ${(v ?? 0) + 1}` }}
        />
        <span className="st-frameplayer__count">{i + 1}/{total}</span>
      </div>
    </div>
  )
}
