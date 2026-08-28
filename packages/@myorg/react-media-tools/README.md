# @myorg/react-media-tools

媒体工具组件合集：扫码 + 语音输入（可对接 Whisper 本地离线 ASR）。

- `QrScanBtn`：按钮式扫码组件（封装 `useWebQrScanner`）。调用 `navigator.mediaDevices.getUserMedia` 打开摄像头，用 `qr-scanner` 实时解析二维码。
- `VoiceInput`：带按钮的语音输入组件。同时支持浏览器原生 `Web Speech API`（在线，Chrome/Edge/Safari 好用）和 `@huggingface/transformers` 的 Whisper 本地推理（可选，完全离线）。
- 底层 hooks 由 `@myorg/react-core-hooks` 提供：`useWebQrScanner` / `useWhisperRecorder`。

---

## 安装

```bash
npm install @myorg/react-media-tools @myorg/react-core-hooks react react-dom

# 使用扫码功能需要 peerDep（QrScanBtn 会用）：
npm install qr-scanner

# 使用离线 Whisper 录音功能可选：
npm install @huggingface/transformers
```

```js
// main.jsx
import '@myorg/react-media-tools/style.css'
```

## 快速使用

### 扫码按钮 QrScanBtn

```jsx
import { QrScanBtn } from '@myorg/react-media-tools'

<QrScanBtn
  onScanSuccess={(data) => alert('扫码成功：' + data)}
  onScanError={(e) => console.warn('扫码失败：', e)}
  btnProps={{ className: 'btn-primary' }}
>
  📱 扫描二维码
</QrScanBtn>
```

### 语音输入 VoiceInput（支持 Web Speech API + 离线 Whisper 双引擎）

```jsx
import { VoiceInput } from '@myorg/react-media-tools'

<VoiceInput
  placeholder="点击麦克风说话..."
  engine="auto"          // 'auto' | 'web-speech' | 'local-whisper'
  onResult={(text) => console.log('语音 → 文本：', text)}
/>
```

---

## 打包 & 发布

```bash
npm install
npm run build
npm pack --dry-run
npm publish
```
