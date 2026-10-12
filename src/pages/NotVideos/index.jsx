import { useCallback, useEffect, useRef, useState } from 'react'
import './index.scss'
import VideoCarousel from './components/VideoCarousel.jsx'
import DocViewer from './components/DocViewer.jsx'
import PythonRunner from './components/PythonRunner.jsx'
import ImageGrid from './components/ImageGrid.jsx'
import { POLL_MS, VIDEO_RE, CAN_PICK_DIR, readSavedDir, saveDir } from './components/notVideoUtils.js'

/**
 * 本地媒体中心（由旧版「隐藏视频轮播页」升级）—— 目录由用户自己选，不绑定任何固定路径。
 *
 * 两条数据通路，按浏览器能力自动选择：
 * 1. **目录选择器**（首选，window.showDirectoryPicker，Chromium 系）
 *    点按钮弹原生文件夹选择框，客户端直读 —— 不经过后端，能选到 iCloud / 外接硬盘 / 任意位置。
 *    但浏览器安全限制拿不到绝对路径，因此**仅支持视频轮播**。
 * 2. **路径直填**（兜底 + 完整能力，Safari / Firefox 没有选择器时也用这条）
 *    手动填绝对目录，后端 ?dir= 扫描并**全分类**返回：视频 / 图片 / 文档 / Python 脚本，
 *    据内容分四区展示；路径存 localStorage，下次自动恢复。
 *
 * 「实时」：两个通道都是每 8 秒重扫一次，且都不缓存目录列表。
 */

const EMPTY = { videos: [], images: [], docs: [], pythons: [] }

export default function NotVideos() {
  const [mode, setMode] = useState(() => (readSavedDir() ? 'server' : 'none')) // none | picker | server
  const [pickerName, setPickerName] = useState('')
  const [pathInput, setPathInput] = useState(() => readSavedDir())
  const [serverData, setServerData] = useState(EMPTY) // 后端全分类（路径直填通道）
  const [pickerVideos, setPickerVideos] = useState([]) // 选择器通道（仅视频）
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [nonce, setNonce] = useState(0) // 手动刷新用：变一次就重跑一轮扫描
  const [activeDir, setActiveDir] = useState(() => readSavedDir())
  const handleRef = useRef(null) // FileSystemDirectoryHandle
  const cacheRef = useRef(new Map()) // name -> { url, lastModified, size }
  const etagRef = useRef('') // 最近一次扫描响应的 ETag，用于条件请求（304 = 目录没变）
  const hiddenRef = useRef(false) // 页面是否处于后台标签页（暂停轮询）

  /* ---------- 释放选择器通道的 objectURL：换源 + 卸载时都要做 ---------- */
  const dropObjectUrls = useCallback(() => {
    for (const v of cacheRef.current.values()) URL.revokeObjectURL(v.url)
    cacheRef.current.clear()
  }, [])

  useEffect(() => dropObjectUrls, [dropObjectUrls])

  /* ---------- 通道 1：目录选择器（客户端直读，仅视频，不经后端） ---------- */
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

  /* ---------- 通道 2：路径直填（后端全分类：视频/图片/文档/脚本） ---------- */
  const scanServer = useCallback(async (dir) => {
    // 条件请求：目录没变时后端回 304，这里返回 null —— 调用方据此「什么都不做」，
    // serverData 引用不变，下面所有 memo 化分区零重渲染（121 张图的网格也不重新 diff）
    const headers = {}
    if (etagRef.current) headers['If-None-Match'] = etagRef.current
    const res = await fetch(`/api/not-videos?dir=${encodeURIComponent(dir)}`, { cache: 'no-store', headers })
    if (res.status === 304) return null
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || '读取失败')
    // 旧版中间件识别：Vite 只热重载 vite.config.js 本身，不重载它 import 的 vite-local-media.mjs，
    // 改了中间件不重启 dev 就静默留在旧行为（平铺扫描/无模块方式/无解释器探测）——给明确指引
    if (!data.caps || !data.caps.recursive) {
      throw new Error('后端还是旧版中间件（看不到子目录、无法模块方式运行 Python）。请重启 dev server：Ctrl+C 停止，然后重新 npm run dev')
    }
    etagRef.current = res.headers.get('ETag') || ''
    const q = encodeURIComponent(dir)
    // 后端给的 url 已按 rel 编好子目录段，这里只补 ?dir=（扫描是递归的，rel 可能形如 fx/galaxy.py）
    const withUrl = (arr) => (arr || []).map((v) => ({ ...v, url: `${v.url}?dir=${q}` }))
    return {
      videos: withUrl(data.videos),
      images: withUrl(data.images),
      docs: withUrl(data.docs),
      pythons: withUrl(data.pythons),
    }
  }, [])

  /* ---------- 轮询：两个通道都是每 8 秒重扫，目录变了自动反映 ---------- */
  useEffect(() => {
    if (mode === 'none') return undefined
    let stopped = false
    const tick = async () => {
      try {
        if (mode === 'picker') {
          setBusy(true)
          const list = await scanPicker(handleRef.current)
          if (stopped) return
          setPickerVideos(list)
          setErr(null)
        } else {
          const data = await scanServer(activeDir)
          if (stopped || !data) return // null = 304 未变：连 busy 都不碰，整棵树不重渲染
          setServerData(data)
          setErr(null)
        }
      } catch (e) {
        if (!stopped) setErr(String((e && e.message) || e))
      } finally {
        if (!stopped) setBusy(false)
      }
    }
    // effect 重跑（切目录 / 手动刷新）总是立即扫：这类操作必须马上看到结果，
    // 不能因为页面恰好处于后台（headless、窗口失焦都会报 hidden）而被拦掉
    tick()
    const timer = setInterval(() => {
      // 只有定时轮询检查 hidden：后台标签页看不见内容，没必要反复扫描
      if (hiddenRef.current) return
      tick()
    }, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [mode, nonce, activeDir, scanPicker, scanServer])

  /* ---------- 页面可见性：后台暂停轮询（省 CPU），切回可见立刻补一轮 ---------- */
  useEffect(() => {
    const onVis = () => {
      hiddenRef.current = document.hidden
      // 切回可见立即补扫：否则要等下一个轮询周期（最长 8s）数据才是新的
      if (!document.hidden) setNonce((n) => n + 1)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  /* ---------- 手动刷新：Python 跑完产物落盘后，由效果区回调触发重扫 ---------- */
  const refreshScan = useCallback(() => setNonce((n) => n + 1), [])

  /* ---------- 选目录 ---------- */
  const pickDir = useCallback(async () => {    if (!CAN_PICK_DIR) return
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

  const counts =
    mode === 'picker'
      ? { videos: pickerVideos.length }
      : {
          videos: serverData.videos.length,
          images: serverData.images.length,
          docs: serverData.docs.length,
          pythons: serverData.pythons.length,
        }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const sourceLabel = mode === 'picker' ? pickerName : mode === 'server' ? activeDir : ''

  return (
    <div className="notvideos">
      <header className="notvideos__head">
        <div className="notvideos__title">
          <span className="notvideos__badge">隐藏</span>
          <h2>本地媒体中心</h2>
        </div>
        {total ? (
          <div className="notvideos__stat">
            {counts.videos ? (
              <span>
                视频 <b>{counts.videos}</b>
              </span>
            ) : null}
            {counts.images ? (
              <span>
                图片 <b>{counts.images}</b>
              </span>
            ) : null}
            {counts.docs ? (
              <span>
                文档 <b>{counts.docs}</b>
              </span>
            ) : null}
            {counts.pythons ? (
              <span>
                脚本 <b>{counts.pythons}</b>
              </span>
            ) : null}
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
            placeholder="填目录绝对路径（含子目录；可看文档 / 运行 Python），例如：/Users/你/Movies/Clip"
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
        {mode === 'picker' ? (
          <div className="notvideos__tip">
            选择器模式仅支持视频轮播（浏览器拿不到绝对路径，无法读取文档 / 运行 Python）；需要这两项请用上方路径直填。
          </div>
        ) : null}
      </section>

      {mode === 'none' ? (
        <div className="notvideos__hint">
          <p>先选一个文件夹，页面会按其中内容自动分区：视频轮播 / 图片 / 文档 / Python 效果。</p>
          <p className="notvideos__dir">
            不会读取任何固定路径，选到哪儿就放哪儿；目录里新增内容后页面会自动跟着变。
          </p>
        </div>
      ) : mode === 'picker' ? (
        pickerVideos.length ? (
          <VideoCarousel videos={pickerVideos} />
        ) : (
          <div className="notvideos__hint">
            <p>这个目录里还没有视频，或读取失败。</p>
            <p className="notvideos__tip">需要看文档 / 跑 Python 效果？请改用上方「路径直填」——选择器模式浏览器拿不到绝对路径，只有它能轮播视频。</p>
            {err ? <p className="notvideos__err">{err}</p> : null}
          </div>
        )
      ) : serverData.videos.length || serverData.images.length || serverData.docs.length || serverData.pythons.length ? (
        /* 路径直填：后端全分类，四区展示 */
        <div className="notvideos__sections">
          {serverData.videos.length ? <VideoCarousel videos={serverData.videos} /> : null}

          {serverData.images.length ? (
            <section className="notvideos__section">
              <div className="notvideos__secHead">
                <h3>🖼️ 图片</h3>
                <span className="notvideos__secCount">{serverData.images.length}</span>
              </div>
              <ImageGrid images={serverData.images} />
            </section>
          ) : null}

          <DocViewer docs={serverData.docs} dir={activeDir} />
          {/* python 跑完产物会落盘（如 output/*.webp），重扫一次让图片 / 视频区立刻能看到 */}
          <PythonRunner pythons={serverData.pythons} dir={activeDir} onRefresh={refreshScan} />
        </div>
      ) : (
        <div className="notvideos__hint">
          <p>这个目录里没有可展示的媒体 / 文档 / 脚本。</p>
          {err ? <p className="notvideos__err">{err}</p> : null}
        </div>
      )}

      <footer className="notvideos__foot">
        <span>每 {POLL_MS / 1000} 秒自动扫描一次 · 视频支持 ← → 切换</span>
      </footer>
    </div>
  )
}
