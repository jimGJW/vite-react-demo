<script setup>
import { provide, onUnmounted } from 'vue'
import './Notification.scss'
import { NOTIFICATION_KEY, createNotification, getDefaultNotification, metaOf } from './notification.js'

/**
 * 通知中心 Provider：管理全局通知状态，并通过 Teleport 将 Toast 堆叠
 * 挂载到 body 右上角。零外部依赖，仅依赖 Vue。
 */
const props = defineProps({
  scoped: { type: Boolean, default: false },
})

const ctx = props.scoped ? createNotification() : getDefaultNotification()
provide(NOTIFICATION_KEY, ctx)

const { toasts, remove } = ctx

onUnmounted(() => {
  if (props.scoped) ctx.dispose()
})
</script>

<template>
  <slot />

  <Teleport to="body">
    <div class="notify-stack" role="region" aria-label="通知" aria-live="polite">
      <div
        v-for="it in toasts" :key="it.id"
        class="notify-toast" :class="`notify-toast--${it.type}`"
        :style="{ '--notify-accent': metaOf(it.type).accent, '--notify-accent-soft': metaOf(it.type).soft }"
        role="status"
      >
        <span class="notify-icon" aria-hidden="true">{{ metaOf(it.type).icon }}</span>
        <div class="notify-body">
          <div v-if="it.title" class="notify-title">{{ it.title }}</div>
          <div v-if="it.description" class="notify-desc">{{ it.description }}</div>
        </div>
        <button
          type="button" class="notify-close" aria-label="关闭通知"
          @click="remove(it.id)"
        >
          ✕
        </button>
        <span
          v-if="it.duration > 0" class="notify-progress"
          :style="{ animationDuration: `${it.duration}ms` }"
        />
      </div>
    </div>
  </Teleport>
</template>
