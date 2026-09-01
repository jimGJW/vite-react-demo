<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotification, metaOf, relativeTime, TYPE_LABEL } from './notification.js'

/** 通知抽屉：触发按钮（含未读徽标）+ 从右侧滑入的历史面板 */
const props = defineProps({
  triggerLabel: { type: String, default: '通知' },
  className: { type: String, default: '' },
})

const { history, unreadCount, markAllRead, clearHistory, markRead } = useNotification()

const open = ref(false)
const badge = computed(() => (unreadCount.value > 99 ? '99+' : unreadCount.value))

function onKey(e) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="notify-drawer-wrap">
    <button
      type="button"
      class="notify-drawer-trigger"
      :class="className"
      aria-haspopup="dialog" :aria-expanded="open"
      @click="open = !open"
    >
      <span class="notify-drawer-icon" aria-hidden="true">🔔</span>
      <span class="notify-drawer-label">{{ triggerLabel }}</span>
      <span v-if="unreadCount > 0" class="notify-badge">{{ badge }}</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="notify-drawer-root">
        <div class="notify-drawer-backdrop" @click="open = false" />

        <aside class="notify-drawer" role="dialog" aria-label="通知中心">
          <header class="notify-drawer-header">
            <div class="notify-drawer-title">
              <span aria-hidden="true">🔔</span>
              <span>通知中心</span>
              <span v-if="unreadCount > 0" class="notify-drawer-count">{{ unreadCount }} 条未读</span>
            </div>
            <div class="notify-drawer-actions">
              <button
                type="button" class="notify-link-btn"
                :disabled="unreadCount === 0"
                @click="markAllRead"
              >
                全部已读
              </button>
              <button
                type="button" class="notify-link-btn"
                :disabled="history.length === 0"
                @click="clearHistory"
              >
                清空
              </button>
              <button
                type="button" class="notify-close" aria-label="关闭抽屉"
                @click="open = false"
              >
                ✕
              </button>
            </div>
          </header>

          <div class="notify-drawer-body">
            <div v-if="history.length === 0" class="notify-empty">
              <span aria-hidden="true">📭</span>
              <p>暂无通知</p>
            </div>
            <ul v-else class="notify-list">
              <li
                v-for="it in history" :key="it.id"
                class="notify-item" :class="{ 'is-unread': !it.read }"
                @click="markRead(it.id)"
              >
                <span v-if="!it.read" class="notify-item-dot" aria-label="未读" />
                <span
                  class="notify-item-icon" aria-hidden="true"
                  :style="{ color: metaOf(it.type).accent, background: metaOf(it.type).soft }"
                >{{ metaOf(it.type).icon }}</span>
                <div class="notify-item-main">
                  <div class="notify-item-title">{{ it.title || '通知' }}</div>
                  <div v-if="it.description" class="notify-item-desc">{{ it.description }}</div>
                  <div class="notify-item-meta">
                    {{ relativeTime(it.createdAt) }} · {{ TYPE_LABEL[it.type] || it.type }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>
