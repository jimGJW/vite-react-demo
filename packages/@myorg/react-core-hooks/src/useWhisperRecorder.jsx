import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 本地离线语音识别 hook —— 基于 transformers.js + Whisper 模型
 *
 * 语音完全在浏览器本地处理，不依赖任何外部识别服务，
 * 国内网络环境也可正常使用（模型走 hf-mirror 镜像下载）。
 *
 * 流程：MediaRecorder 录音 → 解码 → 重采样 16kHz → Whisper 推理 → 文本
 *
 * 首次使用需要下载模型（约 40MB），之后浏览器会缓存。
 */

// 模型选择：whisper-tiny 体积小(约40MB)速度最快；如需更好中文效果可换 whisper-base(约145MB)
// 模型文件已本地托管在 public/models/ 目录（同源加载，无外网依赖、无 CORS 问题）
const MODEL_NAME = 'Xenova/whisper-tiny'
const LOCAL_MODEL_PATH = '/models/'
const TARGET_SAMPLE_RATE = 16000

let pipelinePromise = null

/** 懒加载 ASR pipeline（全局单例，避免重复加载模型） */
const loadPipeline = (onProgress) => {
  if (!pipelinePromise) {
    pipelinePromise = import('@huggingface/transformers').then(async ({ pipeline, env }) => {
      // 使用本地托管模型（public/models/），浏览器端需显式开启本地模型
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
const resample = (input, inputRate, outputRate) => {
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

export default function useWhisperRecorder({ onResult, onError }) {
  const [recording, setRecording] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [modelState, setModelState] = useState('idle') // idle | loading | ready | error
  const [modelProgress, setModelProgress] = useState(null) // 0-100
  const [error, setError] = useState(null)

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    typeof AudioContext !== 'undefined'

  /** 录音完成后：解码 → 重采样 → Whisper 推理 */
  const runRecognition = useCallback(async (blob) => {
    setRecognizing(true)
    try {
      const arrayBuffer = await blob.arrayBuffer()

      // 解码音频（webm/ogg → PCM）
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      const channel = audioBuffer.getChannelData(0)
      const pcm = resample(channel, audioBuffer.sampleRate, TARGET_SAMPLE_RATE)

      // 加载模型（首次会下载，显示进度）
      setModelState((s) => (s === 'ready' ? s : 'loading'))
      setModelProgress(0)
      const asr = await loadPipeline((p) => {
        if (p.status === 'progress') {
          setModelProgress(Math.round(p.progress))
        } else if (p.status === 'done') {
          setModelProgress(100)
        }
      })
      setModelState('ready')
      setModelProgress(null)

      // 本地推理
      const output = await asr(pcm, {
        language: 'chinese',
        task: 'transcribe',
        sampling_rate: TARGET_SAMPLE_RATE,
      })
      const text = (output?.text || '').trim()
      if (text) onResultRef.current?.(text)
    } catch (e) {
      setModelState('error')
      setError(`本地识别失败：${e?.message || e}`)
      onErrorRef.current?.(e)
    } finally {
      setRecognizing(false)
    }
  }, [])

  /** 开始录音 */
  const start = useCallback(async () => {
    if (!supported || recording || recognizing) return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        runRecognition(blob)
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch (e) {
      setError(
        e.name === 'NotAllowedError'
          ? '未获得麦克风权限，请在浏览器地址栏允许本页面使用麦克风后重试'
          : `无法访问麦克风：${e.message}`,
      )
    }
  }, [supported, recording, recognizing, runRecognition])

  /** 停止录音并触发本地识别 */
  const stop = useCallback(() => {
    setRecording(false)
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
    } catch {
      /* ignore */
    }
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop()
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return {
    supported,
    recording,
    recognizing,
    modelState,
    modelProgress,
    error,
    start,
    stop,
  }
}
