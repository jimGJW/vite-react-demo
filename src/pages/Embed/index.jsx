import { useState, useRef, useCallback } from 'react'
import './index.scss'

const devicePresets = [
  { label: '手机', icon: '📱', key: 'mobile', width: 375, height: 667 },
  { label: '大屏手机', icon: '📱', key: 'mobile-lg', width: 414, height: 896 },
  { label: '平板', icon: '📱', key: 'pad', width: 768, height: 1024 },
  { label: '平板横屏', icon: '📲', key: 'pad-ls', width: 1024, height: 768 },
  { label: '桌面', icon: '💻', key: 'pc', width: 1280, height: 800 },
  { label: '大屏桌面', icon: '🖥️', key: 'pc-lg', width: 1920, height: 1080 },
]

const MODES = [
  { key: 'window', label: '新窗口预览', icon: '🪟', desc: '真实浏览器窗口，兼容所有项目' },
  { key: 'embed', label: '内嵌预览', icon: '🖼️', desc: '页面内 iframe，仅限允许嵌套的站点' },
]

function Embed() {
  const [url, setUrl] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [mode, setMode] = useState('window')
  const [activeDevice, setActiveDevice] = useState(devicePresets[0])
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [frameCheck, setFrameCheck] = useState(null) // { checking, result }
  const [iframeLoading, setIframeLoading] = useState(false)
  const [windows, setWindows] = useState([]) // [{ id, label, url, width, height, openedAt }]
  const windowRefs = useRef({})

  const normalizeUrl = (input) => {
    let target = input.trim()
    if (!/^https?:\/\//i.test(target)) {
      // 本地开发地址（localhost/127.0.0.1）默认 http —— Vite/Webpack dev server 基本都是 http，
      // 若默认 https 会导致 iframe 与探测全部 SSL 失败
      target = /^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(target)
        ? 'http://' + target
        : 'https://' + target
    }
    return target
  }

  const activeWidth = showCustom && customWidth ? Number(customWidth) : activeDevice.width
  const activeHeight = showCustom && customHeight ? Number(customHeight) : activeDevice.height

  const runFrameCheck = useCallback(
    async (target) => {
      setFrameCheck({ checking: true, result: null })
      try {
        const resp = await fetch(`/__frame-check?url=${encodeURIComponent(target)}`)
        const data = await resp.json()
        setFrameCheck({ checking: false, result: data })
        return data
      } catch (e) {
        setFrameCheck({ checking: false, result: { ok: false, error: e.message } })
        return null
      }
    },
    [],
  )

  const handleLoad = async () => {
    if (!url.trim()) return
    const target = normalizeUrl(url)
    setCurrentUrl(target)
    setFrameCheck(null)
    if (mode === 'embed') setIframeLoading(true)
    // 加载后自动探测可否内嵌，给用户明确提示
    runFrameCheck(target)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLoad()
  }

  const openWindow = () => {
    if (!currentUrl) return
    const w = activeWidth
    const h = activeHeight
    const id = `${currentUrl}-${w}x${h}-${Date.now()}`
    const win = window.open(
      currentUrl,
      `embed-preview-${w}x${h}`,
      `width=${w},height=${h},resizable=yes,scrollbars=yes,status=yes`,
    )
    if (win) {
      windowRefs.current[id] = win
      setWindows((prev) => [
        { id, label: activeDevice.label, url: currentUrl, width: w, height: h, openedAt: Date.now() },
        ...prev,
      ].slice(0, 12))
    }
  }

  const focusWindow = (id) => {
    const win = windowRefs.current[id]
    if (win && !win.closed) win.focus()
  }

  const closeWindow = (id) => {
    const win = windowRefs.current[id]
    if (win && !win.closed) win.close()
    setWindows((prev) => prev.filter((w) => w.id !== id))
  }

  const handleIframeLoad = () => setIframeLoading(false)

  return (
    <div className="embed-page">
      <div className="embed-toolbar">
        <div className="embed-input-row">
          <input
            type="text"
            className="embed-url-input"
            placeholder="输入项目地址，例如 https://example.com 或 localhost:3000"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="btn embed-load-btn" onClick={handleLoad}>
            加载
          </button>
          <button
            type="button"
            className="btn embed-test-btn"
            onClick={() => runFrameCheck(currentUrl || normalizeUrl(url))}
            disabled={frameCheck?.checking}
          >
            {frameCheck?.checking ? '检测中…' : '检测可否内嵌'}
          </button>
        </div>

        {/* 模式切换 */}
        <div className="embed-mode-row">
          <div className="embed-mode-switch">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`embed-mode-item ${mode === m.key ? 'active' : ''}`}
                onClick={() => setMode(m.key)}
              >
                <span className="embed-mode-icon">{m.icon}</span>
                <span className="embed-mode-label">{m.label}</span>
                <span className="embed-mode-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* frame-check 提示条 */}
        {frameCheck?.result &&
          (() => {
            const r = frameCheck.result
            if (!r.ok) {
              return (
                <div className="embed-check-banner err">❌ 探测失败：{r.error || '未知错误'}</div>
              )
            }
            if (r.statusBlocked) {
              const reason =
                r.status === 401
                  ? '目标需要登录（HTTP 401），请先登录再预览'
                  : r.status === 403
                    ? '目标服务器拒绝访问（HTTP 403），可能因防盗链 / Referer 校验 / IP 限制'
                    : `目标服务器返回错误（HTTP ${r.status}）`
              return (
                <div className="embed-check-banner err">
                  ❌ {reason} —— 即使检测无嵌套限制，iframe 也可能加载失败，建议「新窗口预览」
                </div>
              )
            }
            if (!r.allowsFrame) {
              return (
                <div className="embed-check-banner warn">
                  ⚠️ 该站点禁止被内嵌
                  {r.xFrameOptions && (
                    <span className="embed-check-detail">（X-Frame-Options: {r.xFrameOptions}）</span>
                  )}
                  {r.frameAncestors && (
                    <span className="embed-check-detail">
                      （CSP frame-ancestors: {r.frameAncestors}）
                    </span>
                  )}
                  —— 建议使用「新窗口预览」模式
                </div>
              )
            }
            return (
              <div className="embed-check-banner ok">
                ✅ 该站点允许被内嵌 · HTTP {r.status}，两种模式均可使用
              </div>
            )
          })()}

        {/* 设备选择 */}
        <div className="embed-device-row">
          <span className="embed-device-label">设备尺寸:</span>
          <div className="embed-device-list">
            {devicePresets.map((device) => (
              <button
                key={device.key}
                type="button"
                className={`embed-device-item ${activeDevice.key === device.key && !showCustom ? 'active' : ''}`}
                onClick={() => {
                  setActiveDevice(device)
                  setShowCustom(false)
                }}
                title={`${device.width} × ${device.height}`}
              >
                <span className="embed-device-icon">{device.icon}</span>
                <span className="embed-device-name">{device.label}</span>
                <span className="embed-device-size">
                  {device.width}×{device.height}
                </span>
              </button>
            ))}
            <button
              type="button"
              className={`embed-device-item embed-device-custom ${showCustom ? 'active' : ''}`}
              onClick={() => setShowCustom(!showCustom)}
            >
              <span className="embed-device-icon">✏️</span>
              <span className="embed-device-name">自定义</span>
              <span className="embed-device-size">
                {showCustom && customWidth && customHeight
                  ? `${customWidth}×${customHeight}`
                  : '宽×高'}
              </span>
            </button>
          </div>
          {showCustom && (
            <div className="embed-custom-inputs">
              <input
                type="number"
                min="100"
                max="3840"
                placeholder="宽"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
              />
              <span>×</span>
              <input
                type="number"
                min="100"
                max="2160"
                placeholder="高"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
              />
              <span className="embed-custom-unit">px</span>
            </div>
          )}
        </div>
      </div>

      {/* 新窗口模式：打开记录管理 */}
      {mode === 'window' && (
        <div className="embed-stage">
          {currentUrl ? (
            <>
              <div className="embed-window-action">
                <button type="button" className="btn embed-window-open-btn" onClick={openWindow}>
                  🪟 打开 {activeWidth}×{activeHeight} 新窗口
                </button>
                <span className="embed-window-hint">
                  以「{activeDevice.label}」尺寸打开真实浏览器窗口，完整支持登录、SPA、WebSocket 等一切能力
                </span>
              </div>

              {windows.length > 0 && (
                <div className="embed-window-list">
                  <div className="embed-window-list-title">
                    已打开 {windows.length} 个预览窗口
                  </div>
                  {windows.map((w) => (
                    <div key={w.id} className="embed-window-item">
                      <span className="embed-window-device">{w.label}</span>
                      <span className="embed-window-size">
                        {w.width}×{w.height}
                      </span>
                      <span className="embed-window-url" title={w.url}>{w.url}</span>
                      <span className="embed-window-time">
                        {new Date(w.openedAt).toLocaleTimeString('zh-CN', { hour12: false })}
                      </span>
                      <button type="button" className="btn embed-window-mini" onClick={() => focusWindow(w.id)}>
                        聚焦
                      </button>
                      <button type="button" className="btn embed-window-mini danger" onClick={() => closeWindow(w.id)}>
                        关闭
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="embed-empty">
              <p>输入项目地址并点击「加载」，然后以设备尺寸在新窗口打开</p>
              <p className="embed-empty-hint">
                新窗口是真实浏览器窗口，不会被安全策略拦截，所有项目都能正常打开
              </p>
            </div>
          )}
        </div>
      )}

      {/* 内嵌模式：iframe 直接加载 */}
      {mode === 'embed' && (
        <div className="embed-stage">
          {currentUrl ? (
            <>
              <div className="embed-frame-wrapper" style={{ width: `${activeWidth + 24}px` }}>
                <div className="embed-frame" style={{ width: `${activeWidth}px`, height: `${activeHeight}px` }}>
                  {iframeLoading && (
                    <div className="embed-loading">
                      <div className="embed-loading-spinner" />
                      <span>加载中...</span>
                    </div>
                  )}
                  <iframe
                    key={currentUrl}
                    src={currentUrl}
                    title="embedded-preview"
                    className="embed-iframe"
                    frameBorder="0"
                    onLoad={handleIframeLoad}
                    allow="camera; microphone; fullscreen"
                    allowFullScreen
                  />
                </div>
              </div>
              {frameCheck?.result &&
                frameCheck.result.ok &&
                !frameCheck.result.allowsFrame && (
                  <div
                    className={`embed-check-banner ${frameCheck.result.statusBlocked ? 'err' : 'warn'} embed-frame-tip`}
                  >
                    {frameCheck.result.statusBlocked
                      ? `❌ 服务器返回 HTTP ${frameCheck.result.status}，iframe 无法加载 —— 建议切换到「新窗口预览」`
                      : '⚠️ 站点禁止被内嵌，iframe 可能显示空白 —— 建议切换到「新窗口预览」'}
                  </div>
                )}
              <div className="embed-info">
                <span>尺寸: {activeWidth} × {activeHeight} px</span>
                <span className="embed-info-mode">内嵌模式（直接 iframe）</span>
                <span className="embed-info-url">{currentUrl}</span>
              </div>
            </>
          ) : (
            <div className="embed-empty">
              <p>请在上方输入地址并点击「加载」按钮</p>
              <p className="embed-empty-hint">
                只有允许被嵌套的站点才能内嵌显示，禁止嵌套的站点请使用新窗口模式
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Embed
