import { useState } from 'react'
import QrScanBtn from '@components/QrScanBtn'
import { useI18n } from '@i18n'
import './index.scss'

export default function ScanDemo() {
  const { t, lang } = useI18n()
  const [lastResult, setLastResult] = useState(null)
  const [history, setHistory] = useState([])

  const handleSuccess = (text) => {
    setLastResult(text)
    setHistory((prev) => [
      { text, time: new Date().toLocaleTimeString(lang) },
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
      <h1>{t('scan.page.title')}</h1>
      <p className="scan-demo-desc">
        {t('scan.page.desc')}
      </p>

      <div className="scan-demo-actions">
        <QrScanBtn onScanSuccess={handleSuccess} onScanCancel={handleCancel} onScanError={handleError} />

        <QrScanBtn onScanSuccess={handleSuccess}>
          <div className="scan-demo-custom-btn">{t('scan.page.customTrigger')}</div>
        </QrScanBtn>
      </div>

      {lastResult && (
        <div className="scan-demo-result">
          <div className="scan-demo-result-label">{t('scan.page.lastResult')}</div>
          {isUrl(lastResult) ? (
            <a href={lastResult} target="_blank" rel="noreferrer" className="scan-demo-result-link">
              {lastResult}
            </a>
          ) : (
            <code className="scan-demo-result-code">{lastResult}</code>
          )}
        </div>
      )}

      <h2>{t('scan.page.historyTitle')}</h2>
      {history.length === 0 ? (
        <p className="scan-demo-history-empty">{t('scan.page.historyEmpty')}</p>
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
        <strong>{t('scan.tip.label')}</strong> {t('scan.tip.body')}
      </div>
    </div>
  )
}