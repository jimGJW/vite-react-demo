/* =====================================================================
 * Vue 3 通用 composables 统一出口
 * 与 @myorg/react-core-hooks 功能一一对应，但 API 遵循 Vue 习惯：
 *   - React Hook → Vue composable
 *   - React Context.Provider → Vue provide/inject（可选 <AuthProvider>）
 *   - 命令式弹窗（扫码 / Toast）的用法在两版中保持一致
 * ===================================================================== */

// Auth · 会话（localStorage 持久化，刷新不掉线）
export {
  createAuth,
  getDefaultAuth,
  useAuth,
  AuthPlugin,
  AUTH_KEY,
  STORAGE_KEY,
} from './auth.js'
export { default as AuthProvider } from './AuthProvider.vue'

// 本地离线语音识别（transformers.js + Whisper）
export { useWhisperRecorder } from './useWhisperRecorder.js'

// 摄像头扫码（命令式弹窗）+ 轻提示 Toast
export { openQrScanner } from './openQrScanner.js'
export { showToast } from './showToast.js'
export { default as QrScannerOverlay } from './QrScannerOverlay.vue'
export { default as Toast } from './Toast.vue'
