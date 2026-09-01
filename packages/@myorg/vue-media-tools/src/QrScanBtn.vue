<script setup>
import { ref } from 'vue'
import { openQrScanner } from '@myorg/vue-core-composables'

/**
 * 扫码按钮 —— 点击拉起摄像头扫码弹窗
 *
 * 底层调用 `@myorg/vue-core-composables` 的命令式 `openQrScanner`。
 * 支持默认按钮样式，或通过默认插槽自定义触发区域。
 */
const props = defineProps({
  /** 按钮文案（使用默认按钮时生效） */
  label: { type: String, default: '打开扫码' },
  /** 禁用 */
  disabled: { type: Boolean, default: false },
  /** 默认按钮的附加类名 */
  className: { type: String, default: '' },
  /** 默认按钮的背景色 */
  background: { type: String, default: '' },
  /** 默认按钮的文字色 */
  color: { type: String, default: '' },
})

const emit = defineEmits([
  /** 扫码成功：(text) => void */
  'scan-success',
  /** 用户取消：() => void */
  'scan-cancel',
  /** 扫码失败：(error) => void */
  'scan-error',
])

const loading = ref(false)

function openScan() {
  if (loading.value || props.disabled) return
  loading.value = true

  const done = () => {
    loading.value = false
  }

  openQrScanner({
    onSuccess: (text) => {
      done()
      emit('scan-success', text)
    },
    onCancel: () => {
      done()
      emit('scan-cancel')
    },
    onError: (err) => {
      done()
      emit('scan-error', err)
    },
  })
}

defineExpose({ open: openScan, loading })
</script>

<template>
  <!-- 自定义触发区域：交由使用方完全控制外观 -->
  <div v-if="$slots.default" style="display: inline-block; cursor: pointer" @click="openScan">
    <slot :loading="loading" />
  </div>

  <!-- 默认按钮（内联样式，零样式依赖） -->
  <button
    v-else
    type="button"
    :class="className"
    :disabled="disabled"
    :style="{
      display: 'inline-block',
      padding: '8px 16px',
      background: background || '#1677ff',
      color: color || '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: loading || disabled ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      transition: 'opacity 0.2s',
    }"
    @click="openScan"
  >
    {{ loading ? '启动中...' : label }}
  </button>
</template>
