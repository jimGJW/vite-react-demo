/* =====================================================================
 * 扫码弹窗的纯 UI 层：Toast 提示 + 全屏扫码遮罩
 * 从 useWebQrScanner 拆出，使各文件单一职责（组件文件 / 命令式入口文件）
 * ===================================================================== */

export function Toast({ type, message }) {
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

export function ScannerOverlay({
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
