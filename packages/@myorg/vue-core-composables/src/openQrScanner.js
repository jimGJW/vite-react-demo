import { createApp, h } from 'vue'
import QrScanner from 'qr-scanner'
import QrScannerOverlay from './QrScannerOverlay.vue'
import { showToast } from './showToast.js'

/* =====================================================================
 * 摄像头扫码（命令式弹窗，非 composable）
 * （@myorg/react-core-hooks 中 openQrScanner 的 Vue 3 对应实现）
 *
 * openQrScanner({ onSuccess, onCancel, onError })
 *   - 拉起全屏扫码遮罩，识别成功回调 onSuccess(data) 后自动销毁
 *   - 返回清理函数，调用即销毁弹窗（等同用户取消）
 *   - 同一时刻只允许一个扫码弹窗（scanningLock 模块级互斥）
 * ===================================================================== */

let scanningLock = false
const genId = () => `qr-${Date.now()}-${Math.random().toString(36).slice(2)}`

export function openQrScanner({ onSuccess, onCancel, onError } = {}) {
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
  let app = null
  let destroyed = false

  const host = document.createElement('div')
  host.id = uniqueId
  const rootEl = document.querySelector('#app') || document.querySelector('#root') || document.body
  rootEl.appendChild(host)
  app = createApp({
    render: () => h(QrScannerOverlay, {
      videoId,
      uploadId,
      loadingId,
      onClose: () => destroy(true),
      onUpload: handleUpload,
    }),
  })
  app.mount(host)

  const safeStop = () => {
    if (!scannerInstance) return
    try {
      const ret = scannerInstance.stop()
      if (ret && typeof ret.catch === 'function') ret.catch(() => {})
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
      app?.unmount()
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

  async function handleUpload(e) {
    const loadingDom = document.getElementById(loadingId)
    const file = e.target.files?.[0]
    if (!file) return
    if (loadingDom) loadingDom.style.visibility = 'visible'
    safeStop()

    try {
      const img = await fileToImage(file)
      const res = await QrScanner.scanImage(img, { returnDetailedScanResult: true })
      if (loadingDom) loadingDom.style.visibility = 'hidden'
      if (res?.data) {
        onSuccess?.(res.data)
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

  QrScanner.hasCamera()
    .then((hasCam) => {
      if (!hasCam) {
        showToast('warn', '当前设备未检测到摄像头')
        destroy(true)
        return
      }
      const videoDom = document.getElementById(videoId)
      if (!videoDom) return
      scannerInstance = new QrScanner(
        videoDom,
        (result) => {
          if (result?.data) {
            onSuccess?.(result.data)
            destroy()
          }
        },
        {
          preferredCamera: 'environment',
          maxScansPerSecond: 10,
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        },
      )
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

export default openQrScanner
