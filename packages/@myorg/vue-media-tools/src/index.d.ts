import type { DefineComponent } from 'vue'

/** 扫码按钮：点击拉起摄像头扫码弹窗（底层依赖 @myorg/vue-core-composables 的 openQrScanner） */
export declare const QrScanBtn: DefineComponent<
  {
    /** 默认按钮文案 */
    label?: string
    /** 禁用 */
    disabled?: boolean
    /** 默认按钮附加类名 */
    className?: string
    /** 默认按钮背景色 */
    background?: string
    /** 默认按钮文字色 */
    color?: string
  },
  {
    /** 扫码成功 */
    (e: 'scan-success', text: string): void
    /** 用户取消 */
    (e: 'scan-cancel'): void
    /** 扫码失败 */
    (e: 'scan-error', error: unknown): void
  },
  any
>

/** 语音输入组件：在线（Web Speech API）/ 离线（本地 Whisper）双引擎 */
export declare const VoiceInput: DefineComponent<
  {
    /** 受控值（v-model） */
    modelValue?: string
    /** 引擎：auto | web | local */
    engine?: 'auto' | 'web' | 'local'
    /** 在线识别语言 */
    lang?: string
    /** 文本框行数 */
    rows?: number
    /** 占位文案 */
    placeholder?: string
    /** 禁用 */
    disabled?: boolean
    /** 附加类名 */
    className?: string
  },
  {
    /** 值变化（v-model） */
    (e: 'update:modelValue', value: string): void
    /** 每句识别完成回调 */
    (e: 'commit', chunk: string): void
    /** 状态变化：listening | recording | recognizing | idle */
    (e: 'status-change', status: string): void
  },
  any
>
