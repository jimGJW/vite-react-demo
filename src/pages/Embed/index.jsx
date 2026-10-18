import { useState, useRef, useCallback } from 'react'
import './index.scss'
import { useI18n } from '@i18n/index.js'

import { devicePresets, MODES } from './components/embedData.js'

function Embed() {
  const { t } = useI18n()
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
            placeholder={t('embed.phUrl')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="btn embed-load-btn" onClick={handleLoad}>
            {t('embed.load')}
          </button>
          <button
            type="button"
            className="btn embed-test-btn"
            onClick={() => runFrameCheck(currentUrl || normalizeUrl(url))}
            disabled={frameCheck?.checking}
          >
            {frameCheck?.checking ? t('embed.detectChecking') : t('embed.detectEmbed')}
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
                <span className="embed-mode-label">{t(m.labelKey)}</span>
                <span className="embed-mode-desc">{t(m.descKey)}</span>
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
                <div className="embed-check-banner err">❌ {t('embed.detectFail')}: {r.error || t('embed.unknownError')}</div>
              )
            }
            if (r.statusBlocked) {
              const reason =
                r.status === 401
                  ? t('embed.reason401')
                  : r.status === 403
                    ? t('embed.reason403')
                    : t('embed.reasonErr', { status: r.status })
              return (
                <div className="embed-check-banner err">
                  ❌ {reason} —— {t('embed.reasonErrHint')}
                </div>
              )
            }
            if (!r.allowsFrame) {
              return (
                <div className="embed-check-banner warn">
                  ⚠️ {t('embed.forbiddenEmbed')}
                  {r.xFrameOptions && (
                    <span className="embed-check-detail">{t('embed.xFrameDetail', { opt: r.xFrameOptions })}</span>
                  )}
                  {r.frameAncestors && (
                    <span className="embed-check-detail">
                      {t('embed.cspDetail', { anc: r.frameAncestors })}
                    </span>
                  )}
                  —— {t('embed.useWindowMode')}
                </div>
              )
            }
            return (
              <div className="embed-check-banner ok">
                ✅ {t('embed.allowEmbed', { status: r.status })}
              </div>
            )
          })()}

        {/* 设备选择 */}
        <div className="embed-device-row">
          <span className="embed-device-label">{t('embed.deviceSize')}</span>
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
                <span className="embed-device-name">{t(device.labelKey)}</span>
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
              <span className="embed-device-name">{t('embed.deviceCustom')}</span>
              <span className="embed-device-size">
                {showCustom && customWidth && customHeight
                  ? `${customWidth}×${customHeight}`
                  : t('embed.customWH')}
              </span>
            </button>
          </div>
          {showCustom && (
            <div className="embed-custom-inputs">
              <input
                type="number"
                min="100"
                max="3840"
                placeholder={t('embed.phWidth')}
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
              />
              <span>×</span>
              <input
                type="number"
                min="100"
                max="2160"
                placeholder={t('embed.phHeight')}
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
                  🪟 {t('embed.openWindow', { w: activeWidth, h: activeHeight })}
                </button>
                <span className="embed-window-hint">
                  {t('embed.windowHint', { device: t(activeDevice.labelKey) })}
                </span>
              </div>

              {windows.length > 0 && (
                <div className="embed-window-list">
                  <div className="embed-window-list-title">
                    {t('embed.openedWindows', { n: windows.length })}
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
                        {t('embed.focus')}
                      </button>
                      <button type="button" className="btn embed-window-mini danger" onClick={() => closeWindow(w.id)}>
                        {t('embed.close')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="embed-empty">
              <p>{t('embed.emptyLoad')}</p>
              <p className="embed-empty-hint">
                {t('embed.emptyHint1')}
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
                      <span>{t('embed.loading')}</span>
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
                      ? `❌ ${t('embed.frameErr', { status: frameCheck.result.status })}`
                      : `⚠️ ${t('embed.frameWarn')}`}
                  </div>
                )}
              <div className="embed-info">
                <span>{t('embed.sizeLabel')} {activeWidth} × {activeHeight} px</span>
                <span className="embed-info-mode">{t('embed.embedMode')}</span>
                <span className="embed-info-url">{currentUrl}</span>
              </div>
            </>
          ) : (
            <div className="embed-empty">
              <p>{t('embed.emptyAddr')}</p>
              <p className="embed-empty-hint">
                {t('embed.emptyHint2')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Embed
