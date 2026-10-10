import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.scss'

/**
 * 本地视频轮播页 —— 目录由用户自己选，不绑定任何固定路径
 *
 * 两条数据通路，按浏览器能力自动选择：
 * 1. **目录选择器**（首选，`window.showDirectoryPicker`，Chromium 系）
 *    点按钮弹系统原生文件夹选择框，选完直接在客户端读目录 —— 不经过后端，
 *    因此能选到 iCloud 云盘 / 外接硬盘 / 任意位置，路径完全不写死。
 * 2. **路径直填**（兜底，Safari / Firefox 没有选择器）
 *    手动填绝对目录，后端 `?dir=` 扫描；路径存 localStorage，下次自动恢复。
 *
 * 「实时」：两个通道都是每 8 秒重扫一次，且都不缓存目录列表。
 *
 * 三个刻意的设计：
 * 1. 当前播放项用**文件名**追踪而不是数组下标 —— 新视频插到列表最前时，
 *    下标会整体漂移导致「正看着的视频突然跳到另一个」，按 name 定位则稳如磐石。
 * 2. 默认静音起播 —— 浏览器自动播放策略会拦截带声音的 autoplay，
 *    静音才能真的轮起来；想听声音点一下喇叭按钮即可。
 * 3. 选择器通道用 createObjectURL，**必须按 lastModified 复用并及时 revoke** ——
 *    否则每 8 秒轮询就会漏一批 objectURL，几十轮后内存直接被拖垮。
 */


import { POLL_MS, LS_DIR_KEY, VIDEO_RE, CAN_PICK_DIR, readSavedDir, saveDir, fmtSize, fmtTime } from './components/notVideoUtils.js'

export default function NotVideos() {
  const [mode, setMode] = useState(() => (readSavedDir() ? 'server' : 'none')) // none | picker | server
  const [pickerName, setPickerName] = useState('')
  const [pathInput, setPathInput] = useState(() => readSavedDir())
  const [videos, setVideos] = useState([])
  const [currentName, setCurrentName] = useState(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [nonce, setNonce] = useState(0) // 手动刷新用：变一次就重跑一轮扫描

  const videoRef = useRef(null)
  const [activeDir, setActiveDir] = useState(() => readSavedDir()) // 当前生效的目录（路径直填通道）
  const handleRef = useRef(null) // FileSystemDirectoryHandle
  const cacheRef = useRef(new Map()) // name -> { url, lastModified, size }

  /* ---------- 释放选择器通道的 objectURL：换源 + 卸载时都要做 ---------- */
  const dropObjectUrls = useCallback(() => {
    for (const v of cacheRef.current.values()) URL.revokeObjectURL(v.url)
    cacheRef.current.clear()
  }, [])

  useEffect(() => dropObjectUrls, [dropObjectUrls])

  /* ---------- 通道 1：目录选择器（客户端直读，不经后端） ---------- */
  const scanPicker = useCallback(async (handle) => {
    if (!handle) throw new Error('还没有选择文件夹')
    const cache = cacheRef.current
    const alive = new Set()
    const list = []
    for await (const [name, entry] of handle.entries()) {
      if (entry.kind !== 'file' || !VIDEO_RE.test(name)) continue
      let file
      try {
        file = await entry.getFile()
      } catch {
        continue // 正在写入 / 权限失效的文件，跳过而不是让整轮失败
      }
      alive.add(name)
      const hit = cache.get(name)
      // 文件没动就复用旧 objectURL；变了才重建（重建前先 revoke 旧的）
      let item = hit
      if (!hit || hit.lastModified !== file.lastModified || hit.size !== file.size) {
        if (hit) URL.revokeObjectURL(hit.url)
        item = { url: URL.createObjectURL(file), lastModified: file.lastModified, size: file.size }
        cache.set(name, item)
      }
      list.push({ name, size: file.size, mtime: file.lastModified, url: item.url })
    }
    // 目录里已被删掉的视频，连带 revoke，否则 URL 永远不释放
    for (const [k, v] of cache) {
      if (!alive.has(k)) {
        URL.revokeObjectURL(v.url)
        cache.delete(k)
      }
    }
    list.sort((a, b) => b.mtime - a.mtime)
    return list
  }, [])

  /* ---------- 通道 2：路径直填（后端 ?dir= 扫描） ---------- */
  const scanServer = useCallback(async (dir) => {
    const res = await fetch(`/api/not-videos?dir=${encodeURIComponent(dir)}`, { cache: 'no-store' })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || '读取失败')
    const q = encodeURIComponent(dir)
    return data.videos.map((v) => ({
      ...v,
      url: `/not-videos/${encodeURIComponent(v.name)}?dir=${q}`,
    }))
  }, [])

  /* ---------- 轮询：两个通道都是每 8 秒重扫，目录变了自动反映 ---------- */
  useEffect(() => {
    if (mode === 'none') return undefined
    let stopped = false
    const tick = async () => {
      setBusy(true)
      try {
        const list =
          mode === 'picker'
            ? await scanPicker(handleRef.current)
            : await scanServer(activeDir)
        if (stopped) return
        setVideos(list)
        setErr(null)
        setCurrentName((prev) => (prev && list.some((v) => v.name === prev) ? prev : list[0]?.name ?? null))
      } catch (e) {
        if (!stopped) setErr(String((e && e.message) || e))
      } finally {
        if (!stopped) setBusy(false)
      }
    }
    tick()
    const timer = setInterval(tick, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [mode, nonce, activeDir, scanPicker, scanServer])

  /* ---------- 选目录 ---------- */
  const pickDir = useCallback(async () => {
    if (!CAN_PICK_DIR) return
    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' })
      dropObjectUrls() // 换源了，上一个源的 objectURL 没必要留着
      handleRef.current = handle
      setPickerName(handle.name)
      setMode('picker')
      setErr(null)
    } catch (e) {
      // 用户点取消不算错误，别弹红字
      if (e && e.name !== 'AbortError') setErr(`选择文件夹失败：${e && e.message}`)
    }
  }, [dropObjectUrls])

  /* ---------- 路径直填 ---------- */
  const applyPath = useCallback(() => {
    const p = pathInput.trim()
    if (!p) {
      setErr('请填写目录的绝对路径')
      return
    }
    dropObjectUrls()
    saveDir(p)
    setActiveDir(p)
    setMode('server')
    setErr(null)
  }, [pathInput, dropObjectUrls])

  /* ---------- 当前项：按 name 定位，列表变化也不会错位 ---------- */
  const index = useMemo(() => {
    const i = videos.findIndex((v) => v.name === currentName)
    return i >= 0 ? i : 0
  }, [videos, currentName])
  const current = videos[index] || null

  const step = useCallback(
    (delta) => {
      if (!videos.length) return
      const next = (index + delta + videos.length) % videos.length
      setCurrentName(videos[next].name)
    },
    [videos, index],
  )

  /* muted 是 DOM property 不是 attribute，React 不会可靠地同步它，手动补一刀 */
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

  /* ---------- 渲染 ---------- */
  const sourceLabel = mode === 'picker' ? pickerName : mode === 'server' ? activeDir : ''

  return (
    <div className="notvideos">
      <header className="notvideos__head">
        <div className="notvideos__title">
          <span className="notvideos__badge">隐藏</span>
          <h2>本地视频轮播</h2>
        </div>
        {videos.length ? (
          <div className="notvideos__stat">
            <span>
              共 <b>{videos.length}</b> 个
            </span>
            <span>
              第 <b>{index + 1}</b> / {videos.length}
            </span>
            <button
              type="button"
              className="notvideos__btn"
              onClick={() => setNonce((n) => n + 1)}
              disabled={busy}
            >
              {busy ? '扫描中…' : '重新扫描'}
            </button>
          </div>
        ) : null}
      </header>

      {/* ============ 目录来源：自己选，不写死任何路径 ============ */}
      <section className="notvideos__source">
        {CAN_PICK_DIR ? (
          <button type="button" className="notvideos__pick" onClick={pickDir}>
            选择文件夹
          </button>
        ) : (
          <span className="notvideos__noPick">
            当前浏览器不支持原生目录选择器（Chrome / Edge 支持），请用下方路径直填
          </span>
        )}

        <div className="notvideos__pathRow">
          <input
            className="notvideos__input"
            value={pathInput}
            placeholder="或直接填目录绝对路径，例如：/Users/你/Movies/Clip"
            onChange={(e) => setPathInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyPath()
            }}
          />
          <button type="button" className="notvideos__btn" onClick={applyPath}>
            连接
          </button>
        </div>

        {sourceLabel ? (
          <div className="notvideos__sourceNow">
            <span>
              当前目录：<b>{sourceLabel}</b>
            </span>
            <span className="notvideos__mode">{mode === 'picker' ? '目录选择器' : '路径直填'}</span>
            {mode === 'server' && pickerName ? (
              <button
                type="button"
                className="notvideos__linkBtn"
                onClick={() => {
                  dropObjectUrls()
                  handleRef.current = null
                  setMode('picker')
                }}
              >
                切回选择器目录
              </button>
            ) : null}
          </div>
        ) : null}

        {err ? <div className="notvideos__err">{err}</div> : null}
      </section>

      {mode === 'none' ? (
        <div className="notvideos__hint">
          <p>先选一个存放视频的文件夹，页面会自动把它接成轮播。</p>
          <p className="notvideos__dir">
            不会读取任何固定路径，选到哪儿就放哪儿；目录里新增视频后页面会自动跟着变。
          </p>
        </div>
      ) : !videos.length ? (
        <div className="notvideos__hint">
          <p>这个目录里还没有视频，或读取失败。</p>
          {err ? <p className="notvideos__err">{err}</p> : null}
        </div>
      ) : (
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
                key={v.name}
                className={`notvideos__item${i === index ? ' is-current' : ''}`}
                onClick={() => setCurrentName(v.name)}
                title={v.name}
              >
                <span className="notvideos__idx">{i + 1}</span>
                <span className="notvideos__itemName">{v.name}</span>
                <span className="notvideos__itemSub">{fmtSize(v.size)}</span>
              </button>
            ))}
          </aside>
        </div>
      )}

      <footer className="notvideos__foot">
        <span>每 {POLL_MS / 1000} 秒自动扫描一次 · ← → 切换</span>
      </footer>
    </div>
  )
}
