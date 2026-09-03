import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import VoiceInput from '../VoiceInput/index.jsx'
import './VoiceAssistantPanel.scss'

const PERSIST_PREFIX = 'assistant.voice.pos'

/** 浏览器原生语音识别支持检测 */
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const getBrowserName = () => {
  if (typeof navigator === 'undefined') return '未知'
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/')) return 'Google Chrome'
  if (ua.includes('Firefox/')) return 'Mozilla Firefox'
  if (ua.includes('Safari/')) return 'Apple Safari'
  return '未知浏览器'
}

const STATUS_TEXT = {
  listening: { text: '在线聆听中', tone: 'busy' },
  recording: { text: '录音中', tone: 'busy' },
  recognizing: { text: '离线转写中', tone: 'busy' },
  idle: { text: '空闲', tone: 'idle' },
}

function loadPos(key) {
  try {
    const raw = localStorage.getItem(`${PERSIST_PREFIX}.${key}`)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function savePos(key, pos) {
  try {
    localStorage.setItem(`${PERSIST_PREFIX}.${key}`, JSON.stringify(pos))
  } catch { /* ignore */ }
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

/**
 * 语音助手弹窗组件
 *
 * 把「语音转文字」能力封装成一个可在任意页面唤起的浮层面板，用法与全局 AI Agent 一致。
 * 支持在线识别（Web Speech API）与离线识别（本地 Whisper）双引擎。
 *
 * 独立用法（自带状态）：
 *   <VoiceAssistantPanel defaultOpen />
 *   const [open, setOpen] = useState(false)
 *   <VoiceAssistantPanel open={open} onClose={() => setOpen(false)} />
 *
 * 配合助手中心（推荐，由 QuickAssistant / 任意页面统一唤起）：
 *   const { isOpen, close, sendToAgent } = useAssistants()
 *   <VoiceAssistantPanel open={isOpen('voice')} onClose={close} onSendToAgent={sendToAgent} />
 *
 * props:
 * - open / onClose / onOpenChange  受控开关（不传 open 则内部维护，可用 defaultOpen 指定初值）
 * - defaultOpen                    非受控模式初始是否展开
 * - onCommit(chunk)                每识别完一句话回调
 * - onSendToAgent(text)            传入后出现「交给 AI Agent 执行」按钮
 * - engine                         'auto' | 'web' | 'local'
 * - lang                           识别语言，默认 zh-CN
 * - rows / width                   文本框行数 / 面板宽度
 * - enableShortcut                 是否绑定 Ctrl+Shift+V 开关快捷键（多实例场景请只开一个）
 * - persistKey                     位置持久化 key
 * - showDiagnose                   是否展示环境诊断折叠区
 * - embedded                       内嵌模式：去掉浮层 / 遮罩 / 拖拽，直接在页面内渲染（用于 /voice 页面复用同一套 UI）
 */
export default function VoiceAssistantPanel({
  open: controlledOpen,
  defaultOpen = false,
  onClose,
  onOpenChange,
  onCommit,
  onSendToAgent,
  title = '语音助手',
  subtitle = '语音转文字 · 在线 / 离线双引擎',
  engine = 'auto',
  lang = 'zh-CN',
  rows = 4,
  width = 380,
  shortcutText = 'Ctrl+Shift+V',
  enableShortcut = false,
  persistKey = 'default',
  showDiagnose = true,
  maxHistory = 8,
  embedded = false,
  className = '',
}) {
  const isControlled = controlledOpen !== undefined
  const [innerOpen, setInnerOpen] = useState(defaultOpen)
  const open = isControlled ? controlledOpen : innerOpen
  // 内嵌模式常驻可见，不再受 open/onClose 控制
  const visible = embedded ? true : open

  const setOpenState = useCallback(
    (next) => {
      if (isControlled) {
        onOpenChange?.(next)
        if (!next) onClose?.()
      } else {
        setInnerOpen(next)
        onOpenChange?.(next)
        if (!next) onClose?.()
      }
    },
    [isControlled, onOpenChange, onClose],
  )

  const [text, setText] = useState('')
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState('idle')
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const [pos, setPos] = useState(() => loadPos(persistKey))
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef(null)
  const posRef = useRef(pos)

  useEffect(() => {
    posRef.current = pos
  }, [pos])

  const close = useCallback(() => setOpenState(false), [setOpenState])
  const toggle = useCallback(() => setOpenState(!open), [open, setOpenState])

  /* —— 快捷键：Ctrl/Cmd+Shift+V —— */
  useEffect(() => {
    if (!enableShortcut) return
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enableShortcut, toggle])

  /* —— 面板拖拽（按住标题栏拖动，位置持久化） —— */
  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const w = panelRef.current?.offsetWidth || width
      const h = panelRef.current?.offsetHeight || 320
      setPos({
        x: clamp(e.clientX - dragOffset.current.x, 0, Math.max(0, window.innerWidth - w)),
        y: clamp(e.clientY - dragOffset.current.y, 0, Math.max(0, window.innerHeight - Math.min(h, 80))),
      })
    }
    const onUp = () => {
      setDragging(false)
      if (posRef.current) savePos(persistKey, posRef.current)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, persistKey, width])

  const onHeaderMouseDown = (e) => {
    if (e.target.closest('.vap-btn-icon')) return
    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) return
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    // 首次拖动时若还是默认吸附位置，先换算成 left/top 坐标
    if (!pos) setPos({ x: rect.left, y: rect.top })
    setDragging(true)
  }

  const handleCommit = (chunk) => {
    if (!chunk) return
    setHistory((prev) => [{ text: chunk, time: new Date().toLocaleTimeString() }, ...prev].slice(0, maxHistory))
    onCommit?.(chunk)
  }

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 非 HTTPS 环境剪贴板不可用，静默忽略 */
    }
  }

  const envInfo = useMemo(() => {
    if (typeof window === 'undefined') return { web: false, local: false, browser: '-' }
    return {
      web: !!getSpeechRecognition(),
      local:
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined' &&
        typeof AudioContext !== 'undefined',
      browser: getBrowserName(),
    }
  }, [])

  const statusMeta = STATUS_TEXT[status] || STATUS_TEXT.idle

  // 默认吸附右下角；底部留 88px 避开快捷助手键
  const panelStyle = pos
    ? { left: pos.x, top: pos.y, width }
    : { right: 20, bottom: 88, width }

  if (!visible) return null

  return (
    <div className={`vap-root ${embedded ? 'embedded-root' : ''} ${className}`}>
      {/* 透明遮罩：仅用于点击外部关闭，不遮挡页面视觉（内嵌模式不需要） */}
      {!embedded && (
        <div
          className="vap-backdrop"
          onClick={(e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) close()
          }}
        />
      )}
      <div
        ref={panelRef}
        className={`vap-panel ${collapsed ? 'collapsed' : ''} ${dragging ? 'dragging' : ''} ${
          embedded ? 'embedded' : ''
        }`}
        style={embedded ? undefined : panelStyle}
        role="dialog"
        aria-label={title}
      >
        <div className="vap-header" onMouseDown={embedded ? undefined : onHeaderMouseDown}>
          <div className="vap-title">
            <span className="vap-title-icon">🎙️</span>
            <span className="vap-title-text">
              {title}
              {subtitle && <em className="vap-title-sub">{subtitle}</em>}
            </span>
            {shortcutText && !embedded && <span className="vap-shortcut">{shortcutText}</span>}
          </div>
          <div className="vap-actions">
            <button
              type="button"
              className="vap-btn-icon"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? '展开' : '折叠'}
            >
              {collapsed ? '▢' : '—'}
            </button>
            {!embedded && (
              <button type="button" className="vap-btn-icon" onClick={close} title="关闭">
                ✕
              </button>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="vap-body">
            <div className="vap-statusbar">
              <span className={`vap-dot ${statusMeta.tone}`} />
              <span className="vap-status-text">{statusMeta.text}</span>
              <span className="vap-status-sep">·</span>
              <span className="vap-status-count">{text.length} 字</span>
              <span className="vap-status-env">
                在线 {envInfo.web ? '✓' : '✗'} / 离线 {envInfo.local ? '✓' : '✗'}
              </span>
            </div>

            <VoiceInput
              engine={engine}
              lang={lang}
              rows={rows}
              value={text}
              onChange={setText}
              onCommit={handleCommit}
              onStatusChange={setStatus}
              className="vap-voice-input"
            />

            <div className="vap-toolbar">
              <button type="button" className="vap-btn ghost" onClick={handleCopy} disabled={!text}>
                {copied ? '已复制 ✓' : '复制全文'}
              </button>
              <button
                type="button"
                className="vap-btn ghost"
                onClick={() => setText('')}
                disabled={!text}
              >
                清空
              </button>
              {onSendToAgent && (
                <button
                  type="button"
                  className="vap-btn primary"
                  onClick={() => onSendToAgent(text)}
                  disabled={!text.trim()}
                  title="把识别出的文字交给 AI Agent 执行"
                >
                  交给 AI Agent →
                </button>
              )}
            </div>

            <div className="vap-section">
              <div className="vap-section-title">识别记录</div>
              {history.length === 0 ? (
                <p className="vap-empty">还没有识别记录，点击上方「开始语音输入」或「开始录音」试试</p>
              ) : (
                <ul className="vap-history">
                  {history.map((item, idx) => (
                    <li key={`${item.time}-${idx}`} className="vap-history-item">
                      <span className="vap-history-text">{item.text}</span>
                      <span className="vap-history-time">{item.time}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showDiagnose && (
              <details className="vap-diagnose">
                <summary>环境诊断</summary>
                <ul>
                  <li>
                    浏览器：<strong>{envInfo.browser}</strong>
                  </li>
                  <li>
                    在线识别（Web Speech API）：
                    <strong>{envInfo.web ? '支持' : '不支持'}</strong>
                    {envInfo.web && '（Chrome 中文识别依赖 Google 服务，国内网络可能无法使用）'}
                  </li>
                  <li>
                    离线识别（本地 Whisper）：
                    <strong>{envInfo.local ? '支持' : '不支持'}</strong>
                    {envInfo.local && '（模型已内置在 public/models/，完全离线）'}
                  </li>
                  <li>当前状态：{status}</li>
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
