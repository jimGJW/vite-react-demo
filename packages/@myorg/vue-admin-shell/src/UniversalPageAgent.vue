<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useWhisperRecorder } from '@myorg/vue-core-composables'
import {
  AGENT_PROTOCOL,
  normalizeVoiceText,
  SimplePageAgent,
  createDirectBridge,
} from './agentEngine.js'
import './index.scss'

const props = defineProps({
  /** 每次执行后回调：(task, { actions, results, successCount, failCount }) => void */
  onExecute: { type: Function, default: undefined },
  /** 同 onExecute（语义别名） */
  onAgentExecute: { type: Function, default: undefined },
  systemPrompt: {
    type: String,
    default: '你是一个智能助手，可以帮用户操作页面。支持：点击、输入、滚动、分析、查找元素等。',
  },
  className: { type: String, default: '' },
  /** 外部 iframe 元素（iframe 模式下桥接目标） */
  iframeRef: { type: Object, default: null },
  /** 初始模式：direct | iframe */
  mode: { type: String, default: 'direct' },
  /** 路由适配器：{ navigate: (to) => void }，用于站内跳转 */
  router: { type: Object, default: null },
})

const inputValue = ref('')
const isLoading = ref(false)
const history = ref([])
const mode = ref(props.mode || 'direct')
const statusMsg = ref('')

const internalIframeRef = ref(null)
const agentId = { current: 0 }
const pendingHandlers = new Map()

const activeIframeRef = computed(() => props.iframeRef || (internalIframeRef.value && internalIframeRef.value.$el ? { value: internalIframeRef.value.$el } : internalIframeRef.value) || null)
// 兼容：props.iframeRef 可能直接是 DOM 元素或组件实例；统一取出 contentWindow
function getIframeWindow() {
  const el = props.iframeRef
  if (!el) return null
  const win = el.contentWindow || (el.$el && el.$el.contentWindow) || (el.value && el.value.contentWindow)
  return win || null
}

/** 通过 postMessage 与 iframe 内的桥接脚本通信 */
function sendBridgeMessage(command, payload = {}) {
  const win = getIframeWindow()
  if (!win) return Promise.reject(new Error('iframe 未就绪'))
  const id = ++agentId.current
  const msg = { protocol: AGENT_PROTOCOL, id, command, payload }
  win.postMessage(msg, '*')
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingHandlers.delete(id)
      resolve({ ok: false, error: '超时（5s）' })
    }, 5000)
    pendingHandlers.set(id, (result) => {
      clearTimeout(timer)
      pendingHandlers.delete(id)
      resolve(result)
    })
  })
}

function runTask(taskText, source = 'input') {
  const task = (taskText || '').trim()
  if (!task) return
  isLoading.value = true
  inputValue.value = ''
  statusMsg.value = `🔄 正在解析「${task.length > 20 ? task.slice(0, 20) + '…' : task}」...`

  ;(async () => {
    try {
      const agent = new SimplePageAgent({ systemPrompt: props.systemPrompt, mode: mode.value })
      const { actions, results } = await agent.execute(task, bridge.value)
      const successCount = results.filter((r) => r.result.ok).length
      const failCount = results.length - successCount
      const summary =
        failCount === 0 && actions.length > 0
          ? `✓ 全部成功 · ${actions.length} 个动作`
          : failCount > 0 && successCount === 0
            ? `✗ 全部失败 · ${actions.length} 个动作`
            : `部分成功 · ${successCount}/${actions.length}`

      history.value = [
        {
          task,
          actions,
          results,
          summary,
          timestamp: new Date().toLocaleTimeString(),
          fromVoice: source === 'voice',
          id: Date.now() + Math.random(),
        },
        ...history.value,
      ]

      props.onExecute?.(task, { actions, results, successCount, failCount })
      props.onAgentExecute?.(task, { actions, results, successCount, failCount })
      statusMsg.value =
        failCount === 0 && successCount > 0
          ? `✅ 完成：${summary}`
          : successCount === 0 && failCount > 0
            ? `❌ 失败：${summary}`
            : `⚠️ 完成：${summary}`
    } catch (error) {
      console.error('执行错误:', error)
      history.value = [
        { task, error: error.message, timestamp: new Date().toLocaleTimeString(), fromVoice: source === 'voice', id: Date.now() + Math.random() },
        ...history.value,
      ]
      statusMsg.value = `❌ 错误：${error.message}`
    } finally {
      isLoading.value = false
    }
  })()
}

const executeTask = () => {
  if (!inputValue.value.trim()) return
  runTask(inputValue.value)
}

// 语音识别：结果填入输入框并自动执行
const whisper = useWhisperRecorder({
  onResult: (text) => {
    const normalized = normalizeVoiceText(text)
    inputValue.value = normalized
    statusMsg.value = `🎙️ 识别：${normalized}${normalized !== text ? `（已修正：${text}）` : ''}`
    setTimeout(() => runTask(normalized, 'voice'), 120)
  },
  onError: (e) => {
    statusMsg.value = `❌ 语音识别失败：${e?.message || e}`
  },
})

const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    executeTask()
  }
}

const toggleMode = () => {
  mode.value = mode.value === 'direct' ? 'iframe' : 'direct'
  history.value = []
}

// —— 统计 —— //
const stats = computed(() => {
  let totalActions = 0
  let successActions = 0
  let failActions = 0
  let voiceCount = 0
  for (const item of history.value) {
    if (item.fromVoice) voiceCount += 1
    if (item.results) {
      for (const r of item.results) {
        totalActions += 1
        if (r.result?.ok) successActions += 1
        else failActions += 1
      }
    }
  }
  const successRate = totalActions > 0 ? Math.round((successActions / totalActions) * 100) : null
  return { total: history.value.length, totalActions, successActions, failActions, voiceCount, successRate }
})

const handleClearHistory = () => { history.value = [] }
const handleCopy = (task) => {
  navigator.clipboard?.writeText(task).then(
    () => (statusMsg.value = `📋 已复制「${task}」`),
    () => (statusMsg.value = '❌ 复制失败'),
  )
}
const handleRedo = (task) => runTask(task, 'redo')

// 每条历史记录的徽标（成功/失败计数），对应 React 版 .map 内的局部 successCount/failCount
const historyBadge = (item) => {
  const successCount = item.results?.filter((r) => r.result?.ok).length || 0
  const failCount = (item.results?.length || 0) - successCount
  const cls = item.error ? 'all-fail' : failCount === 0 && successCount > 0 ? 'all-ok' : 'partial'
  const text = item.error
    ? '失败'
    : failCount === 0 && successCount > 0
      ? `✓ ${successCount}`
      : `${successCount}/${successCount + failCount}`
  return { cls, text }
}

const formatActionIcon = (type) => {
  const map = {
    navigate: '🧭', click: '👆', type: '⌨️', search: '🔎', scroll: '📜', analyze: '🔍', find: '🔎',
    hover: '🖱️', select: '📋', check: '✅', press: '🔘', wait: '⏳', reload: '🔄', back: '⬅️', forward: '➡️',
    'form-fill': '📝', 'form-submit': '📮', 'form-clear': '🧹', 'form-detect': '🧾', unknown: '❓',
  }
  return map[type] || '⚡'
}
const formatActionText = (action) => {
  switch (action.type) {
    case 'navigate': return `跳转到「${action.target}」`
    case 'click': return `点击「${action.target}」`
    case 'type': return `在「${action.target || '输入框'}」输入「${action.value}」`
    case 'search': return `搜索「${action.value}」`
    case 'scroll': return `滚动到${{ top: '顶部', bottom: '底部', up: '向上', down: '向下' }[action.direction] || action.direction}`
    case 'analyze': return '分析页面'
    case 'find': return `查找「${action.target}」`
    case 'hover': return `悬停在「${action.target}」`
    case 'select': return `选择「${action.target}」`
    case 'check': return `勾选「${action.target}」`
    case 'press': return `按下 ${action.key}`
    case 'form-fill': {
      const f = action.fields || []
      if (!f.length) return '填写表单（自动检测字段）'
      const names = f.map((x) => x.name || x.raw).filter(Boolean).slice(0, 3).join('、')
      return `填写表单 ${f.length} 个字段${names ? `（${names}…）` : ''}`
    }
    case 'form-submit': return '提交表单'
    case 'form-clear': return '清空表单'
    case 'form-detect': return '检测表单'
    case 'wait': return `等待 ${action.ms || 1000}ms`
    case 'reload': return '刷新页面'
    case 'back': return '后退'
    case 'forward': return '前进'
    default: return action.raw || '未知操作'
  }
}

// ============ iframe 模式桥接 ============
function createIframeBridge() {
  return {
    findAndClick: async (target) => {
      try {
        const res = await sendBridgeMessage('find', { text: target })
        if (!res.ok || !res.data?.length) return { ok: false, error: `未找到「${target}」` }
        return sendBridgeMessage('act', { action: 'click', elementId: res.data[0].elementId })
      } catch (e) { return { ok: false, error: e.message } }
    },
    findAndType: async (target, value) => {
      try {
        const res = await sendBridgeMessage('find', { text: target, types: ['input', 'textarea', 'select'] })
        if (!res.ok || !res.data?.length) return { ok: false, error: `未找到输入框「${target}」` }
        return sendBridgeMessage('act', { action: 'type', elementId: res.data[0].elementId, value })
      } catch (e) { return { ok: false, error: e.message } }
    },
    scroll: async (direction) => { try { return await sendBridgeMessage('scroll', { direction }) } catch (e) { return { ok: false, error: e.message } } },
    analyze: async () => { try { return await sendBridgeMessage('analyze') } catch (e) { return { ok: false, error: e.message } } },
    findElements: async (keyword) => { try { return await sendBridgeMessage('find', { text: keyword }) } catch (e) { return { ok: false, error: e.message } } },
    findAndHover: async (target) => {
      try {
        const res = await sendBridgeMessage('find', { text: target })
        if (!res.ok || !res.data?.length) return { ok: false, error: `未找到「${target}」` }
        return sendBridgeMessage('act', { action: 'hover', elementId: res.data[0].elementId })
      } catch (e) { return { ok: false, error: e.message } }
    },
    reload: async () => { try { return await sendBridgeMessage('reload') } catch (e) { return { ok: false, error: e.message } } },
    goBack: async () => { try { return await sendBridgeMessage('navigate', { direction: 'back' }) } catch (e) { return { ok: false, error: e.message } } },
    goForward: async () => { try { return await sendBridgeMessage('navigate', { direction: 'forward' }) } catch (e) { return { ok: false, error: e.message } } },
    navigate: async (target) => { try { return await sendBridgeMessage('navigate', { target }) } catch (e) { return { ok: false, error: e.message } } },
    search: async (value) => { try { return await sendBridgeMessage('search', { value }) } catch (e) { return { ok: false, error: e.message } } },
    press: async (key) => { try { return await sendBridgeMessage('act', { action: 'press', key }) } catch (e) { return { ok: false, error: e.message } } },
    select: async (target) => { try { return await sendBridgeMessage('act', { action: 'select', target }) } catch (e) { return { ok: false, error: e.message } } },
    check: async (target) => { try { return await sendBridgeMessage('act', { action: 'check', target }) } catch (e) { return { ok: false, error: e.message } } },
    wait: async (ms) => { try { return await sendBridgeMessage('wait', { ms }) } catch (e) { return { ok: false, error: e.message } } },
    fillForm: async (fields) => { try { return await sendBridgeMessage('form', { action: 'fill', fields }) } catch (e) { return { ok: false, error: e.message } } },
    submitForm: async () => { try { return await sendBridgeMessage('form', { action: 'submit' }) } catch (e) { return { ok: false, error: e.message } } },
    clearForm: async () => { try { return await sendBridgeMessage('form', { action: 'clear' }) } catch (e) { return { ok: false, error: e.message } } },
    detectForm: async () => { try { return await sendBridgeMessage('form', { action: 'detect' }) } catch (e) { return { ok: false, error: e.message } } },
  }
}

const bridge = computed(() => {
  if (mode.value !== 'direct') return createIframeBridge()
  return createDirectBridge(props.router)
})

// iframe 连接状态监听
function onMessage(ev) {
  if (!ev.data || ev.data.protocol !== AGENT_PROTOCOL) return
  if (ev.data.type === 'ready') { statusMsg.value = 'iframe 已连接'; return }
  const resolve = pendingHandlers.get(ev.data.id)
  if (resolve) resolve(ev.data.result)
}
watch(mode, (m) => {
  statusMsg.value = m === 'direct' ? '直接模式：操作当前页面 DOM' : 'iframe 模式：等待连接...'
})

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <div :class="['universal-page-agent', className]">
    <div class="agent-header">
      <div class="agent-title">
        <span>🤖 AI Agent 控制台</span>
        <span class="agent-title-pulse" title="在线" />
      </div>
      <div class="agent-header-actions">
        <span :class="['agent-mode-badge', mode]">{{ mode === 'direct' ? '直接模式' : 'iframe 模式' }}</span>
        <button class="agent-mode-toggle" @click="toggleMode">切换模式</button>
      </div>
    </div>

    <div class="agent-stats-bar">
      <span class="agent-stat-chip total">执行 <strong>{{ stats.total }}</strong> 次</span>
      <span class="agent-stat-chip success">成功 <strong>{{ stats.successActions }}</strong></span>
      <span v-if="stats.failActions > 0" class="agent-stat-chip fail">失败 <strong>{{ stats.failActions }}</strong></span>
      <span v-if="stats.voiceCount > 0" class="agent-stat-chip voice">语音 <strong>{{ stats.voiceCount }}</strong></span>
      <span v-if="stats.successRate != null" class="agent-stat-chip" :style="{ background: stats.successRate >= 90 ? '#ecfdf5' : stats.successRate >= 60 ? '#fffbeb' : '#fef2f2' }">
        成功率 <strong>{{ stats.successRate }}%</strong>
      </span>
      <span class="agent-stat-spacer" />
      <button v-if="history.length > 0" class="agent-clear-btn" @click="handleClearHistory" title="清空历史">🗑 清空</button>
    </div>

    <div
      :class="['agent-status-msg', statusMsg.startsWith('✅') ? 'is-success' : statusMsg.startsWith('❌') ? 'is-error' : '']"
    >{{ statusMsg }}</div>

    <div v-if="mode === 'iframe'" class="agent-iframe-config">
      <input type="text" placeholder="嵌入页面地址（iframe 模式）" class="agent-iframe-input" />
      <span class="agent-iframe-hint">iframe 模式下需配置目标页面地址</span>
    </div>

    <div class="agent-history">
      <div v-if="history.length === 0" class="agent-empty-hint">
        <div class="agent-empty-icon">🪄</div>
        <div class="agent-empty-title">开始你的第一条指令</div>
        <div class="agent-empty-sub">
          试试「点击登录按钮」「跳转到首页」「向下滚动」<br />
          或「填写表单：姓名张三，邮箱a@b.com」「提交表单」<br />
          也可以点击下方的快捷指令，或点 🎤 语音输入
        </div>
      </div>
      <div
        v-for="item in history"
        :key="item.id || item.timestamp"
        :class="['agent-history-item', item.error ? 'has-error' : '', item.fromVoice ? 'is-voice' : '']"
      >
        <div class="agent-history-actions">
          <button class="agent-history-action-btn" title="复制指令" @click="handleCopy(item.task)">📋</button>
          <button class="agent-history-action-btn" title="重新执行" @click="handleRedo(item.task)">🔁</button>
        </div>
        <div class="agent-history-head">
          <span class="agent-history-task">📝 {{ item.task }}</span>
          <div class="agent-history-meta">
            <span :class="['agent-history-badge', historyBadge(item).cls]">{{ historyBadge(item).text }}</span>
            <span class="agent-history-time">{{ item.timestamp }}</span>
          </div>
        </div>
        <div v-if="item.error" class="agent-error-msg">⚠️ {{ item.error }}</div>
        <template v-else>
          <div class="agent-history-summary">{{ item.summary }}</div>
          <div class="agent-action-list">
            <template v-for="(a, i) in item.actions" :key="i">
              <span
                :class="['agent-action', item.results[i]?.result?.ok ? 'ok' : 'fail']"
                :title="item.results[i]?.result?.ok ? '成功' : item.results[i]?.result?.error || '失败'"
              >
                <span class="agent-action-dot" />
                <span class="agent-action-icon">{{ formatActionIcon(a.type) }}</span>
                <span class="agent-action-text">{{ formatActionText(a) }}</span>
                <span v-if="!item.results[i]?.result?.ok" class="agent-action-fail-reason">{{ item.results[i]?.result?.error || '失败' }}</span>
              </span>
              <span v-if="i < item.actions.length - 1" class="agent-action-arrow">→</span>
            </template>
          </div>
        </template>
      </div>
    </div>

    <div
      v-if="whisper.modelState.value === 'loading' || whisper.recording.value || whisper.recognizing.value"
      :class="['agent-voice-status', whisper.recording.value ? 'recording' : '', whisper.recognizing.value ? 'recognizing' : '']"
    >
      <template v-if="whisper.recording.value">
        <span class="agent-voice-bars"><span /><span /><span /><span /><span /></span>
        <span class="agent-voice-status-text">🎙️ 正在录音…说完点 ⏹ 停止</span>
      </template>
      <span v-else-if="whisper.recognizing.value" class="agent-voice-status-text">⏳ 正在本地识别语音（不出本机）</span>
      <template v-else-if="whisper.modelState.value === 'loading'">
        <span class="agent-voice-status-text">⏬ 首次加载语音模型（仅一次，约 40MB）</span>
        <span class="agent-voice-status-progress">
          <span class="agent-voice-status-progress-bar" :style="{ width: `${whisper.modelProgress.value ?? 0}%` }" />
        </span>
        <span style="font-size: 12px; font-variant-numeric: tabular-nums;">{{ whisper.modelProgress.value ?? 0 }}%</span>
      </template>
    </div>

    <div class="agent-input-row">
      <button
        :class="['agent-mic-btn', whisper.recording.value ? 'recording' : '', whisper.recognizing.value ? 'recognizing' : '']"
        :disabled="isLoading || !whisper.supported.value || whisper.recognizing.value"
        :title="!whisper.supported.value ? '当前浏览器不支持麦克风录音' : whisper.recording.value ? '停止录音并开始识别' : '🎤 语音控制页面：说指令自动执行（点击/跳转/滚动/输入）'"
        @click="whisper.recording.value ? whisper.stop() : whisper.start()"
      >
        {{ whisper.recognizing.value ? '⏳' : whisper.recording.value ? '⏹' : '🎤' }}
      </button>
      <textarea
        v-model="inputValue"
        :disabled="isLoading"
        rows="2"
        class="agent-input"
        placeholder="输入或粘贴指令…Enter 执行 · Shift+Enter 换行 · 也可点 🎤 语音"
        @keydown="handleKeyDown"
      />
      <button class="agent-exec-btn" :disabled="isLoading || !inputValue.trim()" @click="executeTask">
        <span v-if="isLoading"><span class="agent-exec-spinner" />执行中</span>
        <span v-else>▶ 执行</span>
      </button>
    </div>

    <div class="agent-shortcuts">
      <span class="agent-shortcut-label">⚡ 一键执行</span>
      <button
        v-for="s in [
          { label: '分析页面', emoji: '🔍', tag: 'info', cls: 'tag-info' },
          { label: '向下滚动', emoji: '📜', tag: '操作', cls: 'tag-action' },
          { label: '跳到首页', emoji: '🧭', tag: '导航', cls: 'tag-nav' },
          { label: '填写表单', emoji: '📝', tag: '表单', cls: 'tag-form' },
          { label: '提交表单', emoji: '📮', tag: '表单', cls: 'tag-form' },
          { label: '搜索人工智能', emoji: '🔎', tag: '操作', cls: 'tag-action' },
          { label: '刷新页面', emoji: '🔄', tag: '信息', cls: 'tag-info' },
          { label: '返回上一页', emoji: '⬅️', tag: '导航', cls: 'tag-nav' },
        ]"
        :key="s.label"
        class="agent-shortcut"
        :title="`直接执行「${s.label}」`"
        @click="runTask(s.label)"
      >
        <span class="agent-shortcut-emoji">{{ s.emoji }}</span>
        <span>{{ s.label }}</span>
        <span :class="['agent-shortcut-tag', s.cls]">{{ s.tag }}</span>
      </button>
    </div>
  </div>
</template>
