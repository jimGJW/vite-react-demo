# @myorg/react-core-hooks

通用 React Context + Hooks 合集。全部零 UI，方便在任何 React 项目复用。

- `AuthProvider / useAuth`：轻量登录态 Provider + Hook，持久化到 `localStorage`，刷新不掉线，支持 `login(name)` / `logout()` / `user` / `ready`。
- `useWhisperRecorder({ onResult, onError })`：浏览器端录音 Hook（MediaRecorder + AudioContext 导出 WAV），支持调用方自行对接 Whisper。内部对 `@huggingface/transformers` 使用了 **动态 import + peerDependencies**，**不会把 56MB 的 transformers 打包进产物**（使用方如果想启用本地离线 ASR，需要自己安装 `@huggingface/transformers` 并在项目中调用）。
- `useWebQrScanner({ onSuccess, onCancel, onError })`：调用摄像头实时扫二维码。内部使用 peerDependencies 的 `qr-scanner`（二维码解析引擎）。

---

## 安装

```bash
npm install @myorg/react-core-hooks react react-dom
# 可选：要启用扫码功能
npm install qr-scanner
# 可选：要启用浏览器本地 Whisper ASR（useWhisperRecorder 里的离线推理分支）
npm install @huggingface/transformers
```

## 快速使用

### 1) AuthProvider / useAuth

```jsx
// main.jsx
import { AuthProvider } from '@myorg/react-core-hooks'
import App from './App'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)

// 任意子组件
import { useAuth } from '@myorg/react-core-hooks'
function UserPanel() {
  const { user, ready, login, logout } = useAuth()
  if (!ready) return <span>加载会话中...</span>
  return user
    ? <button onClick={logout}>登出 ({user.name})</button>
    : <button onClick={() => login('舰长')}>登录</button>
}
```

### 2) useWebQrScanner

```jsx
import { useWebQrScanner } from '@myorg/react-core-hooks'
const trigger = useWebQrScanner({
  onSuccess: (data) => alert('扫描成功: ' + data),
  onError:   (e) => console.error('扫码失败:', e),
})
<button onClick={trigger.open}>打开摄像头扫码</button>
```

### 3) useWhisperRecorder

```jsx
import { useWhisperRecorder } from '@myorg/react-core-hooks'
const { recording, start, stop, lastText } = useWhisperRecorder({
  onResult: (text) => console.log('识别结果:', text),
  onError:  (e)    => console.error('录音出错:', e),
})
<>
  <button onClick={recording ? stop : start}>
    {recording ? '停止并识别' : '按住录音'}
  </button>
  {lastText && <p>上一条：{lastText}</p>}
</>
```

---

## 打包 & 发布

```bash
npm install
npm run build
# 产物：dist/index.js (ESM)  dist/index.cjs (CJS)  各自对应 .d.ts
npm pack --dry-run
npm publish
```
