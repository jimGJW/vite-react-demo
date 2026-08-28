import { useState } from 'react'
import QrScanBtn from '../../components/QrScanBtn'
import './index.scss'

export default function ScanDemo() {
  const [lastResult, setLastResult] = useState(null)
  const [history, setHistory] = useState([])

  const handleSuccess = (text) => {
    setLastResult(text)
    setHistory((prev) => [
      { text, time: new Date().toLocaleTimeString() },
      ...prev,
    ].slice(0, 10))
  }

  const handleCancel = () => {
    console.log('用户关闭扫码弹窗')
  }

  const handleError = (err) => {
    console.error('扫码异常', err)
  }

  const isUrl = (str) => {
    try {
      const u = new URL(str)
      return !!u.protocol.startsWith('http')
    } catch {
      return false
    }
  }

  return (
    <div className="page-card">
      <h1>通用扫码功能演示</h1>
      <p className="scan-demo-desc">
        纯浏览器 WebRTC 摄像头扫码组件,已剥离任何业务逻辑,可在任意页面复用。
      </p>

      <div className="scan-demo-actions">
        <QrScanBtn onScanSuccess={handleSuccess} onScanCancel={handleCancel} onScanError={handleError} />

        <QrScanBtn onScanSuccess={handleSuccess}>
          <div className="scan-demo-custom-btn">自定义触发节点</div>
        </QrScanBtn>
      </div>

      {lastResult && (
        <div className="scan-demo-result">
          <div className="scan-demo-result-label">最近识别结果</div>
          {isUrl(lastResult) ? (
            <a href={lastResult} target="_blank" rel="noreferrer" className="scan-demo-result-link">
              {lastResult}
            </a>
          ) : (
            <code className="scan-demo-result-code">{lastResult}</code>
          )}
        </div>
      )}

      <h2>识别历史</h2>
      {history.length === 0 ? (
        <p className="scan-demo-history-empty">暂无记录</p>
      ) : (
        <ul className="scan-demo-history-list">
          {history.map((item, idx) => (
            <li key={idx} className="scan-demo-history-item">
              <code>{item.text}</code>
              <span className="scan-demo-history-time">{item.time}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="scan-demo-tip">
        <strong>使用提示:</strong> 生产环境必须使用 HTTPS;localhost 本地开发可正常调用摄像头;
        兼容移动端与 PC 端 Chrome / Edge / Safari。
      </div>
    </div>
  )
}