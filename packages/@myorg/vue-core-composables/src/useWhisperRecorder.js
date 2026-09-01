import { ref, shallowRef, onUnmounted } from 'vue'

/* =====================================================================
 * 本地离线语音识别 composable —— 基于 transformers.js + Whisper 模型
 * （@myorg/react-core-hooks 中 useWhisperRecorder 的 Vue 3 对应实现）
 *
 * 语音完全在浏览器本地处理，不依赖任何外部识别服务，
 * 国内网络环境也可正常使用（模型走本地托管 / hf-mirror 镜像）。
 *
 * 流程：MediaRecorder 录音 → 解码 → 重采样 16kHz → Whisper 推理 → 文本
 * 首次使用需要下载模型（约 40MB），之后浏览器会缓存。
 * ===================================================================== */

// 模型选择：whisper-tiny 体积小(约40MB)速度最快；如需更好中文效果可换 whisper-base(约145MB)
// 模型文件已本地托管在 public/models/ 目录（同源加载，无外网依赖、无 CORS 问题）
const MODEL_NAME = 'Xenova/whisper-tiny'
const LOCAL_MODEL_PATH = '/models/'
const TARGET_SAMPLE_RATE = 16000

let pipelinePromise = null

/** 懒加载 ASR pipeline（全局单例，避免重复加载模型） */
function loadPipeline(onProgress) {
  if (!pipelinePromise) {
    pipelinePromise = import('@huggingface/transformers').then(async ({ pipeline, env }) => {
      // 使用本地托管模型（public/models/）
      env.localModelPath = LOCAL_MODEL_PATH
      env.allowLocalModels = true
      env.allowRemoteModels = false
      // 本地化 onnxruntime wasm（public/ort/），避免依赖 jsdelivr CDN
      // 注意：transformers.js v3 的配置路径是 env.backends.onnx.wasm.wasmPaths（v4 才改为 env.wasmPaths）
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.wasmPaths = {
          mjs: '/ort/ort-wasm-simd-threaded.jsep.mjs',
          wasm: '/ort/ort-wasm-simd-threaded.jsep.wasm',
        }
      }
      return pipeline('automatic-speech-recognition', MODEL_NAME, {
        progress_callback: onProgress,
      })
    })
  }
  return pipelinePromise
}

/** 线性插值重采样到目标采样率 */
function resample(input, inputRate, outputRate) {
  if (inputRate === outputRate) return input
  const ratio = inputRate / outputRate
  const length = Math.round(input.length / ratio)
  const output = new Float32Array(length)
  let offset = 0
  for (let i = 0; i < length; i++) {
    const next = Math.round((i + 1) * ratio)
    let sum = 0
    let count = 0
    for (; offset < next && offset < input.length; offset++) {
      sum += input[offset]
      count += 1
    }
    output[i] = count > 0 ? sum / count : 0
  }
  return output
}

/**
 * 本地离线语音识别。
 * @param {{ onResult?: (text: string) => void, onError?: (e: unknown) => void }} [options]
 */
export function useWhisperRecorder(options = {}) {
  const recording = ref(false)
  const recognizing = ref(false)
  const modelState = ref('idle')      // idle | loading | ready | error
  const modelProgress = ref(null)     // 0-100
  const error = ref(null)

  const recorderRef = shallowRef(null)
  const chunksRef = []
  const streamRef = shallowRef(null)
  // 回调存于普通变量：Vue 无需像 React 那样用 ref 规避闭包过期，模板/调用点始终拿到最新
  let onResultCb = options.onResult
  let onErrorCb = options.onError

  // 与 recording / recognizing 等保持一致的 ref，便于调用方统一解构后在模板中自动解包
  const supported = ref(
    typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined' &&
      typeof AudioContext !== 'undefined',
  )

  /** 录音完成后：解码 → 重采样 → Whisper 推理 */
  async function runRecognition(blob) {
    recognizing.value = true
    try {
      const arrayBuffer = await blob.arrayBuffer()

      // 解码音频（webm/ogg → PCM）
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      const channel = audioBuffer.getChannelData(0)
      const pcm = resample(channel, audioBuffer.sampleRate, TARGET_SAMPLE_RATE)

      // 加载模型（首次会下载，显示进度）
      if (modelState.value !== 'ready') modelState.value = 'loading'
      modelProgress.value = 0
      const asr = await loadPipeline((p) => {
        if (p.status === 'progress') {
          modelProgress.value = Math.round(p.progress)
        } else if (p.status === 'done') {
          modelProgress.value = 100
        }
      })
      modelState.value = 'ready'
      modelProgress.value = null

      // 本地推理
      const output = await asr(pcm, {
        language: 'chinese',
        task: 'transcribe',
        sampling_rate: TARGET_SAMPLE_RATE,
      })
      const text = (output?.text || '').trim()
      if (text) onResultCb?.(text)
    } catch (e) {
      modelState.value = 'error'
      error.value = `本地识别失败：${e?.message || e}`
      onErrorCb?.(e)
    } finally {
      recognizing.value = false
    }
  }

  /** 开始录音 */
  async function start() {
    if (!supported.value || recording.value || recognizing.value) return
    error.value = null
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.value = stream
      chunksRef.length = 0

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.value = null
        const blob = new Blob(chunksRef, { type: recorder.mimeType || 'audio/webm' })
        runRecognition(blob)
      }
      recorderRef.value = recorder
      recorder.start()
      recording.value = true
    } catch (e) {
      error.value =
        e.name === 'NotAllowedError'
          ? '未获得麦克风权限，请在浏览器地址栏允许本页面使用麦克风后重试'
          : `无法访问麦克风：${e.message}`
    }
  }

  /** 停止录音并触发本地识别 */
  function stop() {
    recording.value = false
    try {
      if (recorderRef.value && recorderRef.value.state !== 'inactive') {
        recorderRef.value.stop()
      }
    } catch {
      /* ignore */
    }
  }

  /** 更新回调（父组件传入新函数时同步） */
  function setCallbacks({ onResult, onError } = {}) {
    if (onResult !== undefined) onResultCb = onResult
    if (onError !== undefined) onErrorCb = onError
  }

  onUnmounted(() => {
    try {
      recorderRef.value?.stop()
    } catch {
      /* ignore */
    }
    streamRef.value?.getTracks().forEach((t) => t.stop())
  })

  return {
    supported,
    recording,
    recognizing,
    modelState,
    modelProgress,
    error,
    start,
    stop,
    setCallbacks,
  }
}

export default useWhisperRecorder
