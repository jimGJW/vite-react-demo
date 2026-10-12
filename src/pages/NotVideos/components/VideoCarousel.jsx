import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fmtSize, fmtTime } from './notVideoUtils.js'

/**
 * 视频轮播（从旧 NotVideos 主页抽出）。
 * 只负责「给定一个视频列表怎么播」，数据从哪来（选择器 objectURL / 后端 /local-file）由父级决定，
 * 因此这里只认统一的 { name, size, mtime, url } 结构。
 *
 * 三个刻意的设计沿用旧版：
 * 1. 当前播放项按**文件名**定位而非数组下标 —— 列表前插新视频时下标会整体漂移，
 *    按 name 定位则正看着的视频不会莫名跳到另一个。
 * 2. 默认静音起播 —— 浏览器自动播放策略拦截带声音的 autoplay，静音才能真正轮起来。
 * 3. muted 是 DOM property 不是 attribute，React 不会可靠同步，手动补一刀。
 */
function VideoCarouselImpl({ videos }) {
  const [currentName, setCurrentName] = useState(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)

  // 按 rel 定位（递归扫描后不同子目录会有同名文件；选择器通道没有 rel，退回 name）
  const keyOf = (v) => v.rel || v.name

  // 当前项按 key 定位，找不到（被删/初始）就落到第一项；不做 effect 收敛，纯派生
  const index = useMemo(() => {
    const i = videos.findIndex((v) => keyOf(v) === currentName)
    return i >= 0 ? i : 0
  }, [videos, currentName])
  const current = videos[index] || null

  const step = useCallback(
    (delta) => {
      if (!videos.length) return
      const next = (index + delta + videos.length) % videos.length
      setCurrentName(keyOf(videos[next]))
    },
    [videos, index],
  )

  useEffect(() => {
    const el = videoRef.current
    if (el) el.muted = muted
  }, [muted, current?.url])

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      const p = el.play()
      if (p && p.catch) p.catch(() => setPlaying(false))
    } else {
      el.pause()
    }
  }, [])

  /* 左右方向键翻页：轮播页的手感 */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') step(-1)
      if (e.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  if (!current) return null

  return (
    <div className="notvideos__body">
      <div className="notvideos__stage">
        <video
          key={current.url}
          ref={videoRef}
          className="notvideos__video"
          src={current.url}
          autoPlay
          playsInline
          preload="auto"
          onEnded={() => step(1)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => step(1)}
        />
        <div className="notvideos__caption">
          <span className="notvideos__name" title={current.name}>
            {current.name}
          </span>
          <span className="notvideos__sub">
            {fmtSize(current.size)} · {fmtTime(current.mtime)}
          </span>
        </div>
        <div className="notvideos__controls">
          <button type="button" className="notvideos__btn" onClick={() => step(-1)}>
            上一个
          </button>
          <button type="button" className="notvideos__btn" onClick={togglePlay}>
            {playing ? '暂停' : '播放'}
          </button>
          <button type="button" className="notvideos__btn" onClick={() => step(1)}>
            下一个
          </button>
          <button type="button" className="notvideos__btn" onClick={() => setMuted((m) => !m)}>
            {muted ? '取消静音' : '静音'}
          </button>
        </div>
      </div>

      <aside className="notvideos__list">
        {videos.map((v, i) => (
          <button
            type="button"
            key={keyOf(v)}
            className={`notvideos__item${i === index ? ' is-current' : ''}`}
            onClick={() => setCurrentName(keyOf(v))}
            title={keyOf(v)}
          >
            <span className="notvideos__idx">{i + 1}</span>
            <span className="notvideos__itemName">{keyOf(v)}</span>
            <span className="notvideos__itemSub">{fmtSize(v.size)}</span>
          </button>
        ))}
      </aside>
    </div>
  )
}

/* memo：轮询 304 时父级不更新 serverData，videos 引用不变 → 整个轮播（含 video 元素）跳过重渲染 */
const VideoCarousel = memo(VideoCarouselImpl)
export default VideoCarousel
