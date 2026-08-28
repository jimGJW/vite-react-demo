/* 临时验证脚本：Node 端测试 transformers.js + Whisper 本地识别链路 */
import { pipeline, env } from '@huggingface/transformers'

env.remoteHost = 'https://hf-mirror.com'

const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny')

// 合成 1 秒 16kHz 正弦波（无语音内容，仅验证链路可跑通）
const sr = 16000
const audio = new Float32Array(sr)
for (let i = 0; i < sr; i++) audio[i] = Math.sin((2 * Math.PI * 440 * i) / sr) * 0.05

console.time('infer')
const out = await asr(audio, { language: 'chinese', task: 'transcribe', sampling_rate: sr })
console.timeEnd('infer')
console.log('识别输出:', JSON.stringify(out))
