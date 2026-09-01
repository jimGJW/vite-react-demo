<script setup>
import { provide } from 'vue'
import { AUTH_KEY, createAuth, getDefaultAuth } from './auth.js'

/**
 * 会话 Provider（可选）。
 * - 默认共享模块级单例，因此**不使用本组件**也可直接调用 useAuth()
 * - 需要隔离会话（如 SSR、多租户）时传 `scoped`，会创建独立实例仅供子树使用
 */
const props = defineProps({
  scoped: { type: Boolean, default: false },
})

const auth = props.scoped ? createAuth() : getDefaultAuth()
provide(AUTH_KEY, auth)
</script>

<template>
  <slot />
</template>
