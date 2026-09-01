<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import UniversalPageAgent from './UniversalPageAgent.vue'
import './Agent.scss'

const STORAGE_KEY = 'global-agent-position'
const TOGGLE_SHORTCUT = { ctrlKey: true, shiftKey: true, key: 'a' }

function loadPosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}
function savePosition(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

/** 平滑滚动（相对量） */
function smoothScroll(delta) { window.scrollBy({ top: delta, behavior: 'smooth' }) }
/** 平滑滚动（绝对位置） */
function smoothScrollTo(top) { window.scrollTo({ top, behavior: 'smooth' }) }
/** 判断焦点是否在输入控件中（此时不拦截键盘） */
function isTyping(e) {
  const t = e.target
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}

const router = useRouter()
const open = ref(false)
const collapsed = ref(false)
const pos = ref(loadPosition())
const dragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const panelRef = ref(null)

const defaultPos = () => ({
  x: window.innerWidth - 300,
  y: Math.max(60, Math.floor(window.innerHeight * 0.15)),
})
const currentPos = computed(() => pos.value || defaultPos())

const toggle = () => { open.value = !open.value; collapsed.value = false }
const close = () => { open.value = false; collapsed.value = false }

function onKey(e) {
  if (e.key === 'Escape' && open.value) { close(); return }
  if (
    TOGGLE_SHORTCUT.ctrlKey === (e.ctrlKey || e.metaKey) &&
    TOGGLE_SHORTCUT.shiftKey === e.shiftKey &&
    TOGGLE_SHORTCUT.key.toLowerCase() === e.key.toLowerCase()
  ) {
    e.preventDefault(); toggle(); return
  }
  if (isTyping(e)) return
  const mod = e.metaKey || e.ctrlKey
  if (e.key === 'PageDown') { e.preventDefault(); smoothScroll(window.innerHeight * 0.9); return }
  if (e.key === 'PageUp') { e.preventDefault(); smoothScroll(-window.innerHeight * 0.9); return }
  if (e.key === 'Home') { e.preventDefault(); smoothScrollTo(0); return }
  if (e.key === 'End') { e.preventDefault(); smoothScrollTo(document.body.scrollHeight); return }
  if (mod && e.key === 'ArrowDown') { e.preventDefault(); smoothScroll(window.innerHeight * 0.5); return }
  if (mod && e.key === 'ArrowUp') { e.preventDefault(); smoothScroll(-window.innerHeight * 0.5); return }
  if (mod && e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); history.back(); return }
  if (mod && e.altKey && e.key === 'ArrowRight') { e.preventDefault(); history.forward(); return }
}

function onMove(e) {
  const x = Math.min(window.innerWidth - 60, Math.max(0, e.clientX - dragOffset.value.x))
  const y = Math.min(window.innerHeight - 60, Math.max(0, e.clientY - dragOffset.value.y))
  pos.value = { x, y }
}
function onUp() {
  dragging.value = false
  if (pos.value) savePosition(pos.value)
}

function onBubbleMouseDown(e) {
  if (!open.value) {
    const rect = e.currentTarget.getBoundingClientRect()
    dragOffset.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    dragging.value = true
  }
}
function onBubbleTouchStart(e) {
  if (!open.value) {
    const t = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    dragOffset.value = { x: t.clientX - rect.left, y: t.clientY - rect.top }
    dragging.value = true
  }
}
function onBubbleTouchMove(e) {
  if (!dragging.value) return
  const t = e.touches[0]
  const x = Math.min(window.innerWidth - 60, Math.max(0, t.clientX - dragOffset.value.x))
  const y = Math.min(window.innerHeight - 60, Math.max(0, t.clientY - dragOffset.value.y))
  pos.value = { x, y }
}
function onBubbleTouchEnd() {
  dragging.value = false
  if (pos.value) savePosition(pos.value)
}
function onBackdropClick(e) {
  if (panelRef.value && !panelRef.value.contains(e.target)) close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

watch(dragging, (d) => {
  if (d) {
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  } else {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
})

// 把 vue-router 的 navigate 适配成 UniversalPageAgent 所需 { navigate } 形态
const routerAdapter = { navigate: (to) => router.push(to) }
</script>

<template>
  <template v-if="open">
    <div class="ga-backdrop" @click="onBackdropClick">
      <div
        ref="panelRef"
        :class="['ga-panel', collapsed ? 'collapsed' : '']"
        :style="{ left: currentPos.x + 'px', top: currentPos.y + 'px' }"
        @click.stop
      >
        <div class="ga-panel-header">
          <div class="ga-panel-title">
            <span class="ga-panel-icon">🤖</span>
            <span>AI Agent</span>
            <span class="ga-panel-shortcut">Ctrl+Shift+A</span>
          </div>
          <div class="ga-panel-actions">
            <button class="ga-btn-icon" @click="collapsed = !collapsed" :title="collapsed ? '展开' : '折叠'">
              {{ collapsed ? '▢' : '—' }}
            </button>
            <button class="ga-btn-icon" @click="close" title="关闭">✕</button>
          </div>
        </div>
        <div v-if="!collapsed" class="ga-panel-body">
          <UniversalPageAgent mode="direct" class="ga-agent" :router="routerAdapter" />
        </div>
      </div>
    </div>
  </template>

  <div
    :class="['ga-bubble', open ? 'hidden' : '']"
    :style="{ left: currentPos.x + 'px', top: currentPos.y + 'px' }"
    @mousedown="onBubbleMouseDown"
    @touchstart="onBubbleTouchStart"
    @touchmove="onBubbleTouchMove"
    @touchend="onBubbleTouchEnd"
    @click="() => { if (!dragging) toggle() }"
  >
    <div class="ga-bubble-inner">
      <span class="ga-bubble-icon">🤖</span>
      <span class="ga-bubble-ring" />
    </div>
    <div class="ga-bubble-tooltip">AI Agent</div>
  </div>

  <div v-if="!open" class="ga-hint" @click="toggle">
    <span>🤖 Ctrl+Shift+A 呼出 Agent · Ctrl+↑↓ 滚动 · Ctrl+⌥+←→ 前进后退</span>
  </div>
</template>
