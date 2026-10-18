import { useEffect, useRef, useState } from 'react'
import useWhisperRecorder from '@/hooks/useWhisperRecorder.jsx'
import { useI18n } from '@i18n/index.js'
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
  placeholder,
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
  const { t } = useI18n()
  const resolvedPlaceholder = placeholder ?? t('voice.input.placeholder')

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
        setError(t('voice.micPermission'))
      } else if (event.error === 'no-speech') {
        setError(t('voice.errors.noSpeech'))
      } else if (event.error === 'network') {
        setError(t('voice.errors.network'))
        setWebUnavailable(true)
      } else if (event.error !== 'aborted') {
        setError(t('voice.errors.recognize', { code: event.error }))
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
      setError(t('voice.errors.startFailed'))
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
        setError(t('voice.errors.noResponse'))
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
          title={t('voice.input.webEngineTip')}
        >
          <MicIcon /> {t('voice.input.webEngine')}
          {!webSupported && <span className="voice-input-engine-flag">{t('voice.input.unsupportedFlag')}</span>}
        </button>
        <button
          type="button"
          className={`voice-input-engine ${isLocal ? 'active' : ''}`}
          onClick={() => switchEngine('local')}
          disabled={!local.supported || disabled}
          title={t('voice.input.localEngineTip')}
        >
          <ChipIcon /> {t('voice.input.localEngine')}
          {local.modelState === 'loading' && <span className="voice-input-engine-flag">{t('voice.input.loadingFlag')}</span>}
          {local.modelState === 'ready' && <span className="voice-input-engine-flag ok">{t('voice.input.readyFlag')}</span>}
        </button>
      </div>

      {/* 自动降级提示 */}
      {webUnavailable && !isLocal && (
        <div className="voice-input-fallback">
          <span>{t('voice.input.fallbackHint')}</span>
          <button type="button" className="voice-input-btn mic small" onClick={() => switchEngine('local')}>
            <ChipIcon /> {t('voice.input.switchLocal')}
          </button>
        </div>
      )}

      {!isLocal && !webSupported && (
        <div className="voice-input-unsupported">
          {t('voice.input.webUnsupported')}
          <button type="button" className="voice-input-link-btn" onClick={() => switchEngine('local')}>
            {t('voice.input.clickSwitchLocal')}
          </button>
        </div>
      )}

      {isLocal && !local.supported && (
        <div className="voice-input-unsupported">
          {t('voice.input.recordUnsupported')}
        </div>
      )}

      {/* 本地模型加载进度 */}
      {isLocal && local.modelState === 'loading' && (
        <div className="voice-input-model">
          <div className="voice-input-model-info">
            {t('voice.input.modelLoading')}
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
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          onChange={(e) => updateValue(e.target.value)}
        />
        {interim && !isLocal && <div className="voice-input-interim">{t('voice.input.recognizing', { text: interim })}</div>}
      </div>

      {activeError && <div className="voice-input-error">{activeError}</div>}

      <div className="voice-input-toolbar">
        {isLocal ? (
          local.recognizing ? (
            <button type="button" className="voice-input-btn stop" disabled>
              <StopIcon /> {t('voice.input.localRecognizing')}
            </button>
          ) : local.recording ? (
            <button type="button" className="voice-input-btn stop" onClick={local.stop} disabled={disabled}>
              <StopIcon /> {t('voice.input.stopAndRecognize')}
            </button>
          ) : (
            <button
              type="button"
              className="voice-input-btn mic"
              onClick={local.start}
              disabled={!local.supported || disabled}
            >
              <MicIcon /> {t('voice.input.startRecord')}
            </button>
          )
        ) : listening ? (
          <button type="button" className="voice-input-btn stop" onClick={stopWebListening} disabled={disabled}>
            <StopIcon /> {t('voice.input.stopRecognize')}
          </button>
        ) : (
          <button
            type="button"
            className="voice-input-btn mic"
            onClick={startWebListening}
            disabled={!webSupported || disabled}
          >
            <MicIcon /> {t('voice.input.startVoice')}
          </button>
        )}

        {isLocal && local.recording && (
          <span className="voice-input-status">{t('voice.input.recordingHint')}</span>
        )}
        {isLocal && local.recognizing && (
          <span className="voice-input-status recognizing">{t('voice.input.transcribing')}</span>
        )}
        {!isLocal && listening && (
          <span className="voice-input-status">{t('voice.input.listening')}</span>
        )}

        <button
          type="button"
          className="voice-input-btn ghost"
          onClick={() => updateValue('')}
          disabled={!value || disabled}
        >
          {t('voice.input.clear')}
        </button>
        <button
          type="button"
          className="voice-input-btn ghost"
          onClick={handleCopy}
          disabled={!value || disabled}
        >
          {copied ? t('voice.input.copied') : t('voice.input.copyAll')}
        </button>
      </div>
    </div>
  )
}
