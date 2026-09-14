# @myorg/vue-media-tools

Vue 3 媒体工具组件：QrScanBtn（摄像头扫码按钮）+ VoiceInput（在线/离线双引擎语音输入）。

> 与 [@myorg/react-media-tools](../../react-media-tools/README.md) 功能一一对应，Vue 3 `<script setup>` SFC 实现。

---

## 安装

```bash
npm install @myorg/vue-media-tools @myorg/vue-core-composables vue
```

`peerDependencies`: `vue@^3.0.0`、`@myorg/vue-core-composables@^1.0.0`。

## 使用

```vue
<script setup>
import { ref } from 'vue'
import { QrScanBtn, VoiceInput } from '@myorg/vue-media-tools'

const text = ref('')
const onScan = (code) => console.log('扫码：', code)
const onChunk = (chunk) => console.log('语音片段：', chunk)
</script>

<template>
  <QrScanBtn @scan-success="onScan" />
  <!-- VoiceInput 支持双引擎：在线 Web Speech + 离线 Whisper -->
  <VoiceInput v-model="text" engine="auto" @commit="onChunk" />
</template>
```

---

## 全部导出

| 导出         | 说明                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `QrScanBtn`  | 摄像头扫码按钮；成功 emit `scan-success`（`{ raw, type, timestamp }`）。依赖 `@myorg/vue-core-composables` 的 `openQrScanner` |
| `VoiceInput` | 语音输入组件。`v-model` 双向绑定文本；`engine="auto \| web \| whisper"` 选择引擎；emit `update:modelValue` / `commit` / `status-change` |

### VoiceInput 关键 props

| prop          | 类型                  | 说明                                |
| ------------- | --------------------- | ----------------------------------- |
| `modelValue`  | `string`              | 当前文本（`v-model`）               |
| `engine`      | `'auto' \| 'web' \| 'whisper'` | 识别引擎，`auto` 优先 Web Speech 失败回退 Whisper |
| `lang`        | `string`              | 识别语言（如 `zh-CN`）              |
| `rows`        | `number`              | 文本框行数                          |
| `disabled`    | `boolean`             | 禁用                                |

样式来自 `@myorg/vue-styles-reset`（`--c-*` / `--glass-*` 等 CSS 变量），需先行引入。
