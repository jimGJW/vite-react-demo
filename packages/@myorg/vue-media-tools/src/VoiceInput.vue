<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useWhisperRecorder } from '@myorg/vue-core-composables'
import './index.scss'

/** 获取浏览器 SpeechRecognition 构造器（Chrome / Edge / Safari 等） */
function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const props = defineProps({
  /** 受控值（v-model） */
  modelValue: { type: String, default: undefined },
  /** 引擎：auto（优先在线，6s 无结果提示离线）/ web / local */
  engine: { type: String, default: 'auto' },
  /** 在线识别语言 */
  lang: { type: String, default: 'zh-CN' },
  /** 文本框行数 */
  rows: { type: Number, default: 5 },
  /** 占位文案 */
  placeholder: {
    type: String,
    default: '点击麦克风开始语音输入，识别结果会自动填入此处，可直接编辑修改…',
  },
  /** 禁用 */
  disabled: { type: Boolean, default: false },
  /** 附加类名 */
  className: { type: String, default: '' },
})

const emit = defineEmits([
  /** 值变化（v-model） */
  'update:modelValue',
  /** 每句识别完成：(chunk) => void */
  'commit',
  /** 状态变化：listening | recording | recognizing | idle */
  'status-change',
])

const webSupported = !!getSpeechRecognition()

const innerValue = ref(props.modelValue ?? '')
const isControlled = computed(() => props.modelValue !== undefined)
const value = computed(() => (isControlled.value ? props.modelValue : innerValue.value))

const activeEngine = ref(
  props.engine === 'local' || !webSupported
    ? 'local'
    : props.engine === 'web'
      ? 'web'
      : 'web',
)
const listening = ref(false)
const interim = ref('')
const error = ref(null)
const copied = ref(false)
const webUnavailable = ref(false)

const recognitionRef = ref(null)
const keepGoingRef = ref(false)
const langRef = ref(props.lang)
const valueRef = ref(value.value)
const hasAnyResultRef = ref(false)
const firstStartRef = ref(null)

watch(
  () => props.lang,
  (v) => {
    langRef.value = v
  },
)
watch(value, (v) => {
  valueRef.value = v
})

function updateValue(next) {
  if (isControlled.value) emit('update:modelValue', next)
  else innerValue.value = next
}

// ============ 在线识别（Web Speech API） ============

function startWebListening() {
  if (!webSupported || props.disabled || keepGoingRef.value) return

  const SpeechRecognition = getSpeechRecognition()
  const rec = new SpeechRecognition()
  recognitionRef.value = rec
  keepGoingRef.value = true
  hasAnyResultRef.value = false
  firstStartRef.current = Date.now()
  webUnavailable.value = false

  rec.lang = langRef.value
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1

  rec.onstart = () => {
    listening.value = true
    error.value = null
    emit('status-change', 'listening')
  }

  rec.onresult = (event) => {
    hasAnyResultRef.value = true
    let finalText = ''
    let interimText = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) finalText += result[0].transcript
      else interimText += result[0].transcript
    }
    if (finalText) {
      const current = valueRef.value
      const needsSep = current.length > 0 && !/[，。！？；：,.!?;:\s]$/.test(current)
      const next = current + (needsSep ? '，' : '') + finalText
      updateValue(next)
      emit('commit', finalText)
    }
    interim.value = interimText
  }

  rec.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      error.value = '未获得麦克风权限，请在浏览器地址栏允许本页面使用麦克风后重试'
    } else if (event.error === 'no-speech') {
      error.value = '没有检测到声音，请靠近麦克风再试'
    } else if (event.error === 'network') {
      error.value = '在线语音服务连接失败（可能是网络原因），建议切换到「离线识别」'
      webUnavailable.value = true
    } else if (event.error !== 'aborted') {
      error.value = `识别出错（${event.error}），请重试`
    }
  }

  rec.onend = () => {
    listening.value = false
    interim.value = ''
    if (keepGoingRef.value) {
      window.setTimeout(() => {
        if (keepGoingRef.value && recognitionRef.value === rec) {
          try {
            rec.start()
          } catch {
            /* ignore */
          }
        }
      }, 200)
    } else {
      emit('status-change', 'idle')
    }
  }

  try {
    rec.start()
  } catch {
    error.value = '无法启动在线语音识别，请刷新页面后重试'
    keepGoingRef.value = false
  }
}

function stopWebListening() {
  keepGoingRef.value = false
  listening.value = false
  interim.value = ''
  emit('status-change', 'idle')
  try {
    recognitionRef.value?.stop()
  } catch {
    /* ignore */
  }
}

onBeforeUnmount(() => {
  keepGoingRef.value = false
  try {
    recognitionRef.value?.stop()
  } catch {
    /* ignore */
  }
})

// 自动检测在线识别疑似不可用：启动 6 秒后仍无任何结果 → 提示切换离线识别
let detectTimer = null
watch(listening, (isListening) => {
  if (detectTimer) {
    window.clearTimeout(detectTimer)
    detectTimer = null
  }
  if (!isListening) return
  detectTimer = window.setTimeout(() => {
    if (listening.value && !hasAnyResultRef.value && Date.now() - (firstStartRef.value || 0) > 5000) {
      webUnavailable.value = true
      error.value = '在线识别长时间无响应（通常是网络无法连接识别服务），建议切换到「离线识别」'
    }
  }, 6000)
})

onBeforeUnmount(() => {
  if (detectTimer) {
    window.clearTimeout(detectTimer)
    detectTimer = null
  }
})

// ============ 离线识别（本地 Whisper） ============

const local = useWhisperRecorder({
  onResult: (chunk) => {
    const current = valueRef.value
    const needsSep = current.length > 0 && !/[，。！？；：,.!?;:\s]$/.test(current)
    updateValue(current + (needsSep ? '，' : '') + chunk)
    emit('commit', chunk)
    error.value = null
  },
  onError: () => {
    /* 错误已在 composable 内部通过 error 状态暴露 */
  },
})

watch(
  () => local.recognizing.value,
  (r) => {
    if (r) emit('status-change', 'recognizing')
  },
)

function switchEngine(next) {
  if (activeEngine.value === 'web') stopWebListening()
  if (activeEngine.value === 'local') local.stop()
  activeEngine.value = next
  error.value = null
  webUnavailable.value = false
  interim.value = ''
  emit('status-change', 'idle')
}

const activeError = computed(() =>
  activeEngine.value === 'web' ? error.value : local.error.value || error.value,
)

async function handleCopy() {
  if (!value.value) return
  try {
    await navigator.clipboard.writeText(value.value)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* 剪贴板不可用（非 HTTPS 环境）时静默忽略 */
  }
}

const isLocal = computed(() => activeEngine.value === 'local')
</script>

<template>
  <div :class="['voice-input', className]">
    <!-- 引擎选择 -->
    <div class="voice-input-engines">
      <button
        type="button"
        :class="['voice-input-engine', { active: !isLocal }]"
        :disabled="!webSupported || disabled"
        title="使用浏览器原生语音识别，实时连续转写"
        @click="switchEngine('web')"
      >
        <span aria-hidden="true">🎤</span> 在线识别
        <span v-if="!webSupported" class="voice-input-engine-flag">不支持</span>
      </button>
      <button
        type="button"
        :class="['voice-input-engine', { active: isLocal }]"
        :disabled="!local.supported.value || disabled"
        title="本地运行 Whisper 模型，语音不出本机，离线可用"
        @click="switchEngine('local')"
      >
        <span aria-hidden="true">🎙️</span> 离线识别
        <span v-if="local.modelState.value === 'loading'" class="voice-input-engine-flag">加载中</span>
        <span v-if="local.modelState.value === 'ready'" class="voice-input-engine-flag ok">就绪</span>
      </button>
    </div>

    <!-- 自动降级提示 -->
    <div v-if="webUnavailable && !isLocal" class="voice-input-fallback">
      <span>在线识别疑似不可用（国内网络常无法连接 Chrome 识别服务），可一键切换：</span>
      <button type="button" class="voice-input-btn mic small" @click="switchEngine('local')">
        <span aria-hidden="true">🎙️</span> 切换到离线识别
      </button>
    </div>

    <div v-if="!isLocal && !webSupported" class="voice-input-unsupported">
      当前浏览器不支持在线语音识别（需 Chrome / Edge / Safari）。
      <button type="button" class="voice-input-link-btn" @click="switchEngine('local')">
        点此切换到离线识别
      </button>
    </div>

    <div v-if="isLocal && !local.supported.value" class="voice-input-unsupported">
      当前浏览器不支持录音（需要支持 MediaRecorder 的现代浏览器）。
    </div>

    <!-- 本地模型加载进度 -->
    <div v-if="isLocal && local.modelState.value === 'loading'" class="voice-input-model">
      <div class="voice-input-model-info">
        正在加载本地识别模型…
        <strong v-if="local.modelProgress.value != null">{{ local.modelProgress.value }}%</strong>
      </div>
      <div class="voice-input-model-bar">
        <div
          class="voice-input-model-fill"
          :style="{ width: `${local.modelProgress.value ?? 0}%` }"
        />
      </div>
    </div>

    <div class="voice-input-box">
      <textarea
        class="voice-input-textarea"
        :value="value"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="updateValue($event.target.value)"
      />
      <div v-if="interim && !isLocal" class="voice-input-interim">正在识别：{{ interim }}</div>
    </div>

    <div v-if="activeError" class="voice-input-error">{{ activeError }}</div>

    <div class="voice-input-toolbar">
      <template v-if="isLocal">
        <button
          v-if="local.recognizing.value"
          type="button"
          class="voice-input-btn stop"
          disabled
        >
          <span aria-hidden="true">⏹</span> 正在本地识别…
        </button>
        <button
          v-else-if="local.recording.value"
          type="button"
          class="voice-input-btn stop"
          :disabled="disabled"
          @click="local.stop()"
        >
          <span aria-hidden="true">⏹</span> 停止并识别
        </button>
        <button
          v-else
          type="button"
          class="voice-input-btn mic"
          :disabled="!local.supported.value || disabled"
          @click="local.start()"
        >
          <span aria-hidden="true">🎤</span> 开始录音
        </button>
      </template>
      <template v-else>
        <button
          v-if="listening"
          type="button"
          class="voice-input-btn stop"
          :disabled="disabled"
          @click="stopWebListening"
        >
          <span aria-hidden="true">⏹</span> 停止识别
        </button>
        <button
          v-else
          type="button"
          class="voice-input-btn mic"
          :disabled="!webSupported || disabled"
          @click="startWebListening"
        >
          <span aria-hidden="true">🎤</span> 开始语音输入
        </button>
      </template>

      <span v-if="isLocal && local.recording.value" class="voice-input-status">
        正在录音… 点击「停止并识别」结束
      </span>
      <span v-if="isLocal && local.recognizing.value" class="voice-input-status recognizing">
        正在本地转写文字，请稍候…
      </span>
      <span v-if="!isLocal && listening" class="voice-input-status">正在聆听… 请开始说话</span>

      <button
        type="button"
        class="voice-input-btn ghost"
        :disabled="!value || disabled"
        @click="updateValue('')"
      >
        清空
      </button>
      <button
        type="button"
        class="voice-input-btn ghost"
        :disabled="!value || disabled"
        @click="handleCopy"
      >
        {{ copied ? '已复制 ✓' : '复制全文' }}
      </button>
    </div>
  </div>
</template>
