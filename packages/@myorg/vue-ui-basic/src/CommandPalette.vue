<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import './CommandPalette.scss'
import { matchCommand } from './commandPalette.js'

/**
 * CommandPalette —— Indigo 玻璃态命令面板
 *
 * 零外部依赖（仅 Vue 3）。通过 Teleport 挂载到 document.body。
 *
 * 功能：
 * - `Cmd/Ctrl + K` 全局唤起，再次按下可切换
 * - 模糊搜索（同时匹配 label 与 keywords，子串优先、按序字符兜底）
 * - `↑/↓` 键盘选择、`Enter` 执行、`ESC` 或点击遮罩关闭
 * - 按 `group` 分组展示，空查询时保留传入顺序
 * - 空状态友好提示、底部快捷键说明与结果计数
 *
 * 相对 React 版的增强：通过 `defineExpose` 暴露 `open/close/toggle`，
 * 父组件可用 `ref` 命令式唤起，无需依赖全局快捷键。
 */
const props = defineProps({
  /**
   * 命令列表。每项：`id` 唯一标识；`label` 显示名；`group` 分组名（缺省归「其他」）；
   * `icon` 任意可渲染内容（emoji / 字符）；`keywords` 字符串或字符串数组，参与模糊匹配；
   * `action(command)` 回调，回车或点击时触发。
   */
  commands: { type: Array, default: () => [] },
  placeholder: { type: String, default: '搜索命令…' },
})

const emit = defineEmits(['close', 'select'])

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputRef = ref(null)
const listRef = ref(null)

/** 过滤 + 评分排序 */
const filtered = computed(() =>
  props.commands
    .map((cmd) => {
      const { matched, score } = matchCommand(query.value, cmd)
      return matched ? { cmd, score } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.cmd),
)

/** 分组（保持过滤后的相对顺序，按首次出现的 group 聚合，并记录全局索引） */
const grouped = computed(() => {
  const groups = []
  const map = new Map()
  filtered.value.forEach((cmd, i) => {
    const g = cmd.group || '其他'
    if (!map.has(g)) {
      const item = { group: g, items: [] }
      map.set(g, item)
      groups.push(item)
    }
    map.get(g).items.push({ cmd, i })
  })
  return groups
})

/** activeIndex 越界时钳制（过滤结果变少时保持最近的有效项） */
const activeIdx = computed(() =>
  filtered.value.length ? Math.min(activeIndex.value, filtered.value.length - 1) : 0,
)

/** 关闭面板的统一收口：重置查询与选中项，下次打开即全新状态 */
function closePalette() {
  open.value = false
  query.value = ''
  activeIndex.value = 0
  emit('close')
}

function toggle() {
  if (open.value) closePalette()
  else open.value = true
}

/** 执行某条命令：先关闭再触发 action，避免面板遮挡结果 */
function run(cmd) {
  closePalette()
  emit('select', cmd)
  if (typeof cmd?.action === 'function') cmd.action(cmd)
}

function onKeydown(e) {
  // 全局 Cmd/Ctrl + K 唤起 / 切换
  if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    toggle()
    return
  }

  if (!open.value) return

  if (e.key === 'Escape') {
    e.preventDefault()
    closePalette()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = filtered.value.length
      ? (activeIdx.value + 1) % filtered.value.length
      : 0
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = filtered.value.length
      ? (activeIdx.value - 1 + filtered.value.length) % filtered.value.length
      : 0
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const target = filtered.value[activeIdx.value]
    if (target) run(target)
  }
}

// 打开时聚焦输入框（rAF → nextTick）
watch(open, (v) => {
  if (v) nextTick(() => inputRef.value?.focus())
})

// 滚动 active 项到可见区
watch(
  [activeIdx, open, query],
  () => {
    if (!open.value) return
    nextTick(() => {
      listRef.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
    })
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

defineExpose({ open: () => (open.value = true), close: closePalette, toggle })
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cp-overlay" @mousedown="closePalette">
      <div
        class="cp-panel"
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        @mousedown.stop
      >
        <div class="cp-search">
          <span class="cp-search-icon" aria-hidden="true">
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref="inputRef"
            class="cp-input"
            type="text"
            v-model="query"
            :placeholder="placeholder"
            autocomplete="off"
            spellcheck="false"
            aria-label="搜索命令"
            @input="activeIndex = 0"
          />
          <kbd class="cp-kbd">ESC</kbd>
        </div>

        <div ref="listRef" class="cp-list">
          <div v-if="filtered.length === 0" class="cp-empty">
            <div class="cp-empty-icon">⌘</div>
            <div class="cp-empty-text">没有匹配的命令</div>
            <div class="cp-empty-hint">试试更换关键词，或清空搜索查看全部命令</div>
          </div>
          <div v-for="group in grouped" :key="group.group" class="cp-group">
            <div class="cp-group-title">{{ group.group }}</div>
            <button
              v-for="it in group.items"
              :key="it.cmd.id"
              type="button"
              class="cp-item"
              :class="{ active: it.i === activeIdx }"
              :data-active="it.i === activeIdx"
              @mouseenter="activeIndex = it.i"
              @click="run(it.cmd)"
            >
              <span class="cp-item-icon">{{ it.cmd.icon ?? '·' }}</span>
              <span class="cp-item-label">{{ it.cmd.label }}</span>
              <span v-if="it.cmd.keywords" class="cp-item-kw">
                {{ Array.isArray(it.cmd.keywords) ? it.cmd.keywords[0] : it.cmd.keywords }}
              </span>
            </button>
          </div>
        </div>

        <div class="cp-footer">
          <span class="cp-tip"><kbd>↑</kbd><kbd>↓</kbd>选择</span>
          <span class="cp-tip"><kbd>↵</kbd>执行</span>
          <span class="cp-tip"><kbd>ESC</kbd>关闭</span>
          <span class="cp-spacer" />
          <span class="cp-count">{{ filtered.length }} 条结果</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
