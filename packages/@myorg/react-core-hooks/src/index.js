// AuthContext：会话 Provider + Hook（context 定义 / Provider / hook 三文件分离）
export { AuthProvider } from './AuthProvider.jsx'
export { useAuth } from './useAuth.js'

// 浏览器录音 Hook（Whisper / MediaRecorder + AudioContext，可对接 Whisper 推理引擎）
export { default as useWhisperRecorder } from './useWhisperRecorder.jsx'

// 摄像头扫码 Hook（内部调用 peerDependency: qr-scanner）
// openQrScanner 为正式名称（命令式弹窗函数，非 Hook）；useWebQrScanner 为旧名兼容导出
export { openQrScanner, useWebQrScanner } from './useWebQrScanner.jsx'

// 供打包产物 named exports 使用，避免 MIXED_EXPORTS 警告
export default { AuthProvider: 'AuthProvider' }

