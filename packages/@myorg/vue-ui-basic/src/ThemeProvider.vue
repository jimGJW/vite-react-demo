<script setup>
import { provide, onUnmounted } from 'vue'
import './ThemeProvider.scss'
import { THEME_KEY, createTheme, getDefaultTheme } from './theme.js'

/**
 * 主题 Provider（可选）。
 * - 默认共享模块级单例，因此**不使用本组件**也可直接调用 useTheme()
 * - 需要隔离主题（如 SSR、多实例）时传 `scoped`
 */
const props = defineProps({
  defaultTheme: { type: String, default: 'light' },
  scoped: { type: Boolean, default: false },
})

const ctx = props.scoped ? createTheme(props.defaultTheme) : getDefaultTheme()
provide(THEME_KEY, ctx)

onUnmounted(() => {
  if (props.scoped) ctx.dispose()
})
</script>

<template>
  <slot />
</template>
