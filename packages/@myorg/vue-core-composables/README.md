# @myorg/vue-core-composables

Vue 3 通用 composables 集合：会话（Auth）/ 本地离线语音识别（Whisper）/ 摄像头扫码（命令式弹窗）。

> 与 [@myorg/react-core-hooks](../../react-core-hooks/README.md) 功能一一对应，但 API 遵循 Vue 习惯：Hook → composable，React `Context.Provider` → Vue `provide/inject`（可选 `<AuthProvider>`）。

---

## 安装

```bash
npm install @myorg/vue-core-composables vue
```

`peerDependencies`: `vue@^3.0.0`、`qr-scanner@^1.4.2`。

## 使用

### Auth · 会话（localStorage 持久化，刷新不掉线）

```vue
<!-- 根组件挂载一次 AuthProvider，注入 useAuth 单例 -->
<script setup>
import { AuthProvider } from '@myorg/vue-core-composables'
</script>
<template>
  <AuthProvider>
    <App />
  </AuthProvider>
</template>
```

```js
import { useAuth } from '@myorg/vue-core-composables'
const { user, isAuthenticated, login, logout } = useAuth()
// user 为响应式 ref（模板自动解包）；login/logout 内部持久化到 localStorage
```

### 离线语音识别（transformers.js + Whisper）

```js
import { useWhisperRecorder } from '@myorg/vue-core-composables'
const { supported, recording, modelState, modelProgress, start, stop } = useWhisperRecorder()
```

### 摄像头扫码 / 轻提示（命令式）

```js
import { openQrScanner, showToast } from '@myorg/vue-core-composables'
openQrScanner({ onResult: (code) => showToast('扫码结果：' + code) })
```

---

## 全部导出

| 导出                  | 类型            | 说明                                       |
| --------------------- | --------------- | ------------------------------------------ |
| `createAuth`          | 工厂函数        | 创建会话 store                              |
| `getDefaultAuth`      | 工厂函数        | 获取模块级默认会话单例                       |
| `useAuth`             | composable     | 读取会话状态：`user` / `login` / `logout`  |
| `AuthProvider`        | 组件            | 提供 `useAuth` 单例的 Provider             |
| `AuthPlugin`          | 插件            | `app.use(AuthPlugin)` 全局注册             |
| `AUTH_KEY` / `STORAGE_KEY` | 常量       | inject key / 存储 key                      |
| `useWhisperRecorder`  | composable     | 本地 Whisper 离线语音识别                   |
| `openQrScanner`       | 函数            | 命令式摄像头扫码弹窗                        |
| `showToast` / `Toast` | 函数 / 组件     | 轻提示                                     |
| `QrScannerOverlay`    | 组件            | 扫码遮罩（被 `openQrScanner` 内部使用）     |

样式来自 `@myorg/vue-styles-reset`（`--c-*` / `--glass-*` 等 CSS 变量），需先行引入。
