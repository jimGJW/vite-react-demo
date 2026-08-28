// AuthContext：会话 Provider + Hook
export { AuthProvider, useAuth } from './AuthContext.jsx'

// 浏览器录音 Hook（Whisper / MediaRecorder + AudioContext，可对接 Whisper 推理引擎）
export { default as useWhisperRecorder } from './useWhisperRecorder.jsx'

// 摄像头扫码 Hook（内部调用 peerDependency: qr-scanner）
export { default as useWebQrScanner } from './useWebQrScanner.jsx'

// 供打包产物 named exports 使用，避免 MIXED_EXPORTS 警告
export default { AuthProvider: 'AuthProvider' }

