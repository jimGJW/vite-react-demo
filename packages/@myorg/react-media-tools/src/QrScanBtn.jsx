import { useState } from 'react'
// 命令式「拉起扫码弹窗」函数（非 React Hook），已更名为 openQrScanner
import { openQrScanner } from '@myorg/react-core-hooks'

export default function QrScanBtn({
  onScanSuccess,
  onScanCancel,
  onScanError,
  children,
  btnProps = {},
}) {
  const [loading, setLoading] = useState(false)

  const openScan = () => {
    if (loading) return
    setLoading(true)

    openQrScanner({
      onSuccess: (text) => {
        setLoading(false)
        onScanSuccess?.(text)
      },
      onCancel: () => {
        setLoading(false)
        onScanCancel?.()
      },
      onError: (err) => {
        setLoading(false)
        onScanError?.(err)
      },
    })
  }

  const defaultBtnStyle = {
    display: 'inline-block',
    padding: '8px 16px',
    background: btnProps.background || '#1677ff',
    color: btnProps.color || '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'opacity 0.2s',
  }

  if (children) {
    return (
      <div onClick={openScan} style={{ cursor: 'pointer' }}>
        {children}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={openScan}
      style={defaultBtnStyle}
      {...btnProps}
    >
      {loading ? '启动中...' : btnProps.children || '打开扫码'}
    </button>
  )
}