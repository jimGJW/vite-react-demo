import { useEffect, useRef, useState } from 'react'
import useWhisperRecorder from '../../hooks/useWhisperRecorder.jsx'
import './index.scss'

/** 获取浏览器 SpeechRecognition 构造器（Chrome / Edge / Safari 等） */
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const MicIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

const ChipIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
  </svg>
)

/**
 * 语音输入组件 —— 支持在线 / 离线双引擎
 *
 * 在线引擎（web）：浏览器原生 Web Speech API，实时连续识别。
 *   注意：Chrome 中文识别依赖 Google 服务，国内网络可能不可用。
 * 离线引擎（local）：浏览器本地运行 Whisper 模型（transformers.js），
 *   语音不出本机，无需任何外部服务，国内可用。
 *
 * 引擎模式：
 * - 'auto'（默认）：优先在线识别；6 秒无结果时提示可切换离线识别
 * - 'web'：只用在线识别
 * - 'local'：只用离线识别
 *
 * props:
 * - value / onChange       受控模式（可选）
 * - onCommit(chunk)        每识别完成一句话时回调，参数为本次追加的文本片段
 * - onStatusChange(status) 状态回调: 'listening' | 'recording' | 'recognizing' | 'idle'
 * - engine                 'auto' | 'web' | 'local'，默认 'auto'
 * - lang                   在线识别语言，默认 'zh-CN'
 * - rows                   textarea 行数，默认 5
 * - placeholder            占位文案
 * - disabled               禁用
 * - className              附加类名
 */
export default function VoiceInput({
  value: externalValue,
  onChange,
  onCommit,
  onStatusChange,
  engine = 'auto',
  lang = 'zh-CN',
  rows = 5,
  placeholder = '点击麦克风开始语音输入，识别结果会自动填入此处，可直接编辑修改…',
  disabled = false,
  className = '',
}) {
  const webSupported = !!getSpeechRecognition()
  const isControlled = externalValue !== undefined

  const [innerValue, setInnerValue] = useState(externalValue ?? '')
  const [activeEngine, setActiveEngine] = useState(() =>
    engine === 'local' || !webSupported ? 'local' : engine === 'web' ? 'web' : 'web',
  )
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [webUnavailable, setWebUnavailable] = useState(false)

  const value = isControlled ? externalValue : innerValue

  const recognitionRef = useRef(null)
  const keepGoingRef = useRef(false)
  const langRef = useRef(lang)
  const valueRef = useRef(value)
  const hasAnyResultRef = useRef(false)
  const firstStartRef = useRef(null)

  useEffect(() => {
    langRef.current = lang
  }, [lang])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  // 组件卸载时停止在线识别
  useEffect(() => {
    return () => {
      keepGoingRef.current = false
      try {
        recognitionRef.current?.stop()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const updateValue = (next) => {
    if (isControlled) {
      onChange?.(next)
    } else {
      setInnerValue(next)
    }
  }

  // ============ 在线识别（Web Speech API） ============

  const startWebListening = () => {
    if (!webSupported || disabled || keepGoingRef.current) return

    const SpeechRecognition = getSpeechRecognition()
    const rec = new SpeechRecognition()
    recognitionRef.current = rec
    keepGoingRef.current = true
    hasAnyResultRef.current = false
    firstStartRef.current = Date.now()
    setWebUnavailable(false)

    rec.lang = langRef.current
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      setListening(true)
      setError(null)
      onStatusChange?.('listening')
    }

    rec.onresult = (event) => {
      hasAnyResultRef.current = true
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        const current = valueRef.current
        const needsSep = current.length > 0 && !/[，。！？；：,.!?;:\s]$/.test(current)
        const next = current + (needsSep ? '，' : '') + finalText
        updateValue(next)
        onCommit?.(finalText)
      }
      setInterim(interimText)
    }

    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('未获得麦克风权限，请在浏览器地址栏允许本页面使用麦克风后重试')
      } else if (event.error === 'no-speech') {
        setError('没有检测到声音，请靠近麦克风再试')
      } else if (event.error === 'network') {
        setError('在线语音服务连接失败（可能是网络原因），建议切换到「离线识别」')
        setWebUnavailable(true)
      } else if (event.error !== 'aborted') {
        setError(`识别出错（${event.error}），请重试`)
      }
    }

    rec.onend = () => {
      setListening(false)
      setInterim('')
      if (keepGoingRef.current) {
        // 连续识别：引擎静默结束后短暂延迟自动续听
        window.setTimeout(() => {
          if (keepGoingRef.current && recognitionRef.current === rec) {
            try {
              rec.start()
            } catch {
              /* ignore */
            }
          }
        }, 200)
      } else {
        onStatusChange?.('idle')
      }
    }

    try {
      rec.start()
    } catch {
      setError('无法启动在线语音识别，请刷新页面后重试')
      keepGoingRef.current = false
    }
  }

  const stopWebListening = () => {
    keepGoingRef.current = false
    setListening(false)
    setInterim('')
    onStatusChange?.('idle')
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
  }

  // 自动检测在线识别疑似不可用：启动 6 秒后仍无任何结果 → 提示切换离线识别
  useEffect(() => {
    if (!listening) return
    const timer = window.setTimeout(() => {
      if (listening && !hasAnyResultRef.current && Date.now() - (firstStartRef.current || 0) > 5000) {
        setWebUnavailable(true)
        setError('在线识别长时间无响应（通常是网络无法连接识别服务），建议切换到「离线识别」')
      }
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [listening])

  // ============ 离线识别（本地 Whisper） ============

  const local = useWhisperRecorder({
    onResult: (chunk) => {
      const current = valueRef.current
      const needsSep = current.length > 0 && !/[，。！？；：,.!?;:\s]$/.test(current)
      updateValue(current + (needsSep ? '，' : '') + chunk)
      onCommit?.(chunk)
      setError(null)
    },
    onError: () => {
      /* 错误已在 hook 内部通过 error 状态暴露 */
    },
  })

  useEffect(() => {
    if (local.recognizing) onStatusChange?.('recognizing')
  }, [local.recognizing, onStatusChange])

  const switchEngine = (next) => {
    // 切换前停止当前引擎
    if (activeEngine === 'web') stopWebListening()
    if (activeEngine === 'local') local.stop()
    setActiveEngine(next)
    setError(null)
    setWebUnavailable(false)
    setInterim('')
    onStatusChange?.('idle')
  }

  const activeError = activeEngine === 'web' ? error : local.error || error

  const handleCopy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 剪贴板不可用（非 HTTPS 环境）时静默忽略 */
    }
  }

  const isLocal = activeEngine === 'local'

  return (
    <div className={`voice-input ${className}`}>
      {/* 引擎选择 */}
      <div className="voice-input-engines">
        <button
          type="button"
          className={`voice-input-engine ${!isLocal ? 'active' : ''}`}
          onClick={() => switchEngine('web')}
          disabled={!webSupported || disabled}
          title="使用浏览器原生语音识别，实时连续转写"
        >
          <MicIcon /> 在线识别
          {!webSupported && <span className="voice-input-engine-flag">不支持</span>}
        </button>
        <button
          type="button"
          className={`voice-input-engine ${isLocal ? 'active' : ''}`}
          onClick={() => switchEngine('local')}
          disabled={!local.supported || disabled}
          title="本地运行 Whisper 模型，语音不出本机，离线可用"
        >
          <ChipIcon /> 离线识别
          {local.modelState === 'loading' && <span className="voice-input-engine-flag">加载中</span>}
          {local.modelState === 'ready' && <span className="voice-input-engine-flag ok">就绪</span>}
        </button>
      </div>

      {/* 自动降级提示 */}
      {webUnavailable && !isLocal && (
        <div className="voice-input-fallback">
          <span>在线识别疑似不可用（国内网络常无法连接 Chrome 识别服务），可一键切换：</span>
          <button type="button" className="voice-input-btn mic small" onClick={() => switchEngine('local')}>
            <ChipIcon /> 切换到离线识别
          </button>
        </div>
      )}

      {!isLocal && !webSupported && (
        <div className="voice-input-unsupported">
          当前浏览器不支持在线语音识别（需 Chrome / Edge / Safari）。
          <button type="button" className="voice-input-link-btn" onClick={() => switchEngine('local')}>
            点此切换到离线识别
          </button>
        </div>
      )}

      {isLocal && !local.supported && (
        <div className="voice-input-unsupported">
          当前浏览器不支持录音（需要支持 MediaRecorder 的现代浏览器）。
        </div>
      )}

      {/* 本地模型加载进度 */}
      {isLocal && local.modelState === 'loading' && (
        <div className="voice-input-model">
          <div className="voice-input-model-info">
            正在加载本地识别模型…
            {local.modelProgress != null && <strong>{local.modelProgress}%</strong>}
          </div>
          <div className="voice-input-model-bar">
            <div className="voice-input-model-fill" style={{ width: `${local.modelProgress ?? 0}%` }} />
          </div>
        </div>
      )}

      <div className="voice-input-box">
        <textarea
          className="voice-input-textarea"
          value={value}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => updateValue(e.target.value)}
        />
        {interim && !isLocal && <div className="voice-input-interim">正在识别：{interim}</div>}
      </div>

      {activeError && <div className="voice-input-error">{activeError}</div>}

      <div className="voice-input-toolbar">
        {isLocal ? (
          local.recognizing ? (
            <button type="button" className="voice-input-btn stop" disabled>
              <StopIcon /> 正在本地识别…
            </button>
          ) : local.recording ? (
            <button type="button" className="voice-input-btn stop" onClick={local.stop} disabled={disabled}>
              <StopIcon /> 停止并识别
            </button>
          ) : (
            <button
              type="button"
              className="voice-input-btn mic"
              onClick={local.start}
              disabled={!local.supported || disabled}
            >
              <MicIcon /> 开始录音
            </button>
          )
        ) : listening ? (
          <button type="button" className="voice-input-btn stop" onClick={stopWebListening} disabled={disabled}>
            <StopIcon /> 停止识别
          </button>
        ) : (
          <button
            type="button"
            className="voice-input-btn mic"
            onClick={startWebListening}
            disabled={!webSupported || disabled}
          >
            <MicIcon /> 开始语音输入
          </button>
        )}

        {isLocal && local.recording && (
          <span className="voice-input-status">正在录音… 点击「停止并识别」结束</span>
        )}
        {isLocal && local.recognizing && (
          <span className="voice-input-status recognizing">正在本地转写文字，请稍候…</span>
        )}
        {!isLocal && listening && (
          <span className="voice-input-status">正在聆听… 请开始说话</span>
        )}

        <button
          type="button"
          className="voice-input-btn ghost"
          onClick={() => updateValue('')}
          disabled={!value || disabled}
        >
          清空
        </button>
        <button
          type="button"
          className="voice-input-btn ghost"
          onClick={handleCopy}
          disabled={!value || disabled}
        >
          {copied ? '已复制 ✓' : '复制全文'}
        </button>
      </div>
    </div>
  )
}
