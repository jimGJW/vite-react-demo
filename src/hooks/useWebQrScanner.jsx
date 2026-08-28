import { createRoot } from 'react-dom/client'
import QrScanner from 'qr-scanner'

let scanningLock = false
const genId = () => `qr-${Date.now()}-${Math.random().toString(36).slice(2)}`

function Toast({ type, message }) {
  const color =
    type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#10b981'
  return (
    <div
      style={{
        position: 'fixed',
        top: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15,23,42,0.9)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 6,
        fontSize: 14,
        zIndex: 10000,
        borderLeft: `4px solid ${color}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      {message}
    </div>
  )
}

function showToast(type, message) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  root.render(<Toast type={type} message={message} />)
  setTimeout(() => {
    root.unmount()
    host.remove()
  }, 2200)
}

function ScannerOverlay({
  videoId,
  uploadId,
  loadingId,
  onClose,
  onUpload,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        onClick={onClose}
        aria-label="关闭扫码"
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
          zIndex: 100,
          background: 'rgba(255,255,255,0.15)',
          color: '#fff',
        }}
      >
        ✕
      </button>

      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <video
          id={videoId}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          playsInline
          muted
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '72vw',
            maxWidth: 340,
            height: '72vw',
            maxHeight: 340,
            border: '2px solid #00ff44',
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -2,
              left: -2,
              width: 20,
              height: 20,
              borderTop: '2px solid #00ff44',
              borderLeft: '2px solid #00ff44',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 20,
              height: 20,
              borderTop: '2px solid #00ff44',
              borderRight: '2px solid #00ff44',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              left: -2,
              width: 20,
              height: 20,
              borderBottom: '2px solid #00ff44',
              borderLeft: '2px solid #00ff44',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 20,
              height: 20,
              borderBottom: '2px solid #00ff44',
              borderRight: '2px solid #00ff44',
            }}
          />
        </div>
      </div>

      <span
        id={loadingId}
        style={{
          visibility: 'hidden',
          color: '#fff',
          position: 'absolute',
          bottom: 140,
          fontSize: 14,
        }}
      >
        图片识别中...
      </span>

      <input
        id={uploadId}
        type="file"
        accept="image/*"
        onChange={onUpload}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => document.getElementById(uploadId).click()}
        aria-label="从相册选择图片"
        style={{
          position: 'absolute',
          bottom: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.15)',
          color: '#fff',
        }}
      >
        🖼
      </button>
      <div
        style={{
          color: '#fff',
          position: 'absolute',
          bottom: 82,
          fontSize: 14,
        }}
      >
        将二维码放入框内扫描
      </div>
    </div>
  )
}

export default function useWebQrScanner({ onSuccess, onCancel, onError }) {
  if (scanningLock) {
    showToast('info', '扫码窗口已打开，请先关闭')
    return () => {}
  }
  scanningLock = true

  const uniqueId = genId()
  const videoId = `${uniqueId}-video`
  const uploadId = `${uniqueId}-upload`
  const loadingId = `${uniqueId}-loading`

  let scannerInstance = null
  let overlayRoot = null
  let destroyed = false

  const host = document.createElement('div')
  host.id = uniqueId
  const rootEl = document.querySelector('#root') || document.body
  rootEl.appendChild(host)
  overlayRoot = createRoot(host)

  const safeStop = () => {
    if (!scannerInstance) return
    try {
      const ret = scannerInstance.stop()
      if (ret && typeof ret.catch === 'function') {
        ret.catch(() => {})
      }
    } catch {
      /* ignore */
    }
    scannerInstance = null
  }

  const destroy = (isCancel = false) => {
    if (destroyed) return
    destroyed = true
    scanningLock = false
    safeStop()
    try {
      overlayRoot?.unmount()
    } catch {
      /* ignore */
    }
    if (host.parentNode) host.parentNode.removeChild(host)
    if (isCancel) onCancel?.()
  }

  const fileToImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = reader.result
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })

  const handleUpload = async (e) => {
    const loadingDom = document.getElementById(loadingId)
    const file = e.target.files?.[0]
    if (!file) return
    if (loadingDom) loadingDom.style.visibility = 'visible'
    safeStop()

    try {
      const img = await fileToImage(file)
      const res = await QrScanner.scanImage(img, {
        returnDetailedScanResult: true,
      })
      if (loadingDom) loadingDom.style.visibility = 'hidden'
      if (res?.data) {
        onSuccess(res.data)
        destroy()
      } else {
        showToast('warn', '图片未识别到二维码')
      }
    } catch (err) {
      if (loadingDom) loadingDom.style.visibility = 'hidden'
      showToast('warn', '图片未识别到二维码')
      onError?.(err)
    } finally {
      e.target.value = ''
    }
  }

  overlayRoot.render(
    <ScannerOverlay
      videoId={videoId}
      uploadId={uploadId}
      loadingId={loadingId}
      onClose={() => destroy(true)}
      onUpload={handleUpload}
    />
  )

  QrScanner.hasCamera()
    .then((hasCam) => {
      if (!hasCam) {
        showToast('warn', '当前设备未检测到摄像头')
        destroy(true)
        return
      }
      const videoDom = document.getElementById(videoId)
      if (!videoDom) return
      scannerInstance = new QrScanner(videoDom, (result) => {
        if (result?.data) {
          onSuccess(result.data)
          destroy()
        }
      }, {
        preferredCamera: 'environment',
        maxScansPerSecond: 10,
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      })
      scannerInstance.start().catch((err) => {
        showToast('error', '摄像头启动失败，请检查设备权限或使用 HTTPS 访问')
        onError?.(err)
        destroy(true)
      })
    })
    .catch((err) => {
      showToast('error', '无法获取摄像头权限')
      onError?.(err)
      destroy(true)
    })

  return () => destroy(true)
}