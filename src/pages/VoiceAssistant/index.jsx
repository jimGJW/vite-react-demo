import { useState } from 'react'
import VoiceInput from '../../components/VoiceInput/index.jsx'
import './index.scss'

const getBrowserName = () => {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/')) return 'Google Chrome'
  if (ua.includes('Firefox/')) return 'Mozilla Firefox'
  if (ua.includes('Safari/')) return 'Apple Safari'
  return '未知浏览器'
}

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export default function VoiceAssistant() {
  const [text, setText] = useState('')
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState('idle')

  const webSupported = !!getSpeechRecognition()
  const localSupported =
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    typeof AudioContext !== 'undefined'

  const handleCommit = (chunk) => {
    setHistory((prev) =>
      [{ text: chunk, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20),
    )
  }

  return (
    <div className="page-card voice-page">
      <h1>语音助手</h1>
      <p className="voice-page-desc">
        语音转文字，支持两种引擎：<strong>在线识别</strong>（浏览器原生，实时连续）与
        <strong>离线识别</strong>（本地 Whisper 模型，语音不出本机，无需外网，模型已内置无需下载）。
        识别出的文字会自动填入文本框，可直接编辑修改。
      </p>

      <div className="voice-page-demo">
        <VoiceInput
          engine="auto"
          value={text}
          onChange={setText}
          onCommit={handleCommit}
          onStatusChange={setStatus}
        />
      </div>

      {text && (
        <div className="voice-page-meta">
          当前文本 <strong>{text.length}</strong> 字 · 状态：
          {status === 'listening' ? (
            <span className="voice-page-status listening">在线聆听中</span>
          ) : status === 'recording' ? (
            <span className="voice-page-status listening">录音中</span>
          ) : status === 'recognizing' ? (
            <span className="voice-page-status listening">离线转写中</span>
          ) : (
            <span className="voice-page-status idle">空闲</span>
          )}
        </div>
      )}

      <h2>识别记录</h2>
      {history.length === 0 ? (
        <p className="voice-page-empty">还没有识别记录，点击「开始语音输入」或「开始录音」试试</p>
      ) : (
        <ul className="voice-page-history">
          {history.map((item, idx) => (
            <li key={idx} className="voice-page-history-item">
              <span className="voice-page-history-text">{item.text}</span>
              <span className="voice-page-history-time">{item.time}</span>
            </li>
          ))}
        </ul>
      )}

      <details className="voice-page-diagnose">
        <summary>环境诊断</summary>
        <ul>
          <li>
            浏览器：<strong>{getBrowserName()}</strong>（{navigator.userAgent.split(' ').slice(-2).join(' ')}）
          </li>
          <li>
            在线识别（Web Speech API）：<strong>{webSupported ? '支持' : '不支持'}</strong>
            {webSupported && '（Chrome 中文识别依赖 Google 服务，国内网络可能无法使用）'}
          </li>
          <li>
            离线识别（本地 Whisper）：<strong>{localSupported ? '支持' : '不支持'}</strong>
            {localSupported && '（模型已内置在 public/models/，加载快、完全离线）'}
          </li>
          <li>当前状态：{status}</li>
        </ul>
      </details>

      <div className="voice-page-tip">
        <strong>使用提示：</strong> 若「在线识别」点了没反应或长时间无结果，通常是网络无法连接识别服务，
        请切换到「离线识别」；离线识别使用本地 Whisper 模型，语音不出本机、无需联网，模型已内置，
        首次识别时加载模型会稍慢几秒；生产环境需 HTTPS，localhost 本地开发可直接使用。
      </div>
    </div>
  )
}
