<template>
  <!-- Canvas 签名板：指针事件绘制 + 撤销 / 清空 / 导出 PNG -->
  <div class="m-sign">
    <canvas
      ref="canvasEl"
      class="m-sign__canvas"
      :width="width"
      :height="height"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointerleave="onUp"
    />
    <div class="m-row">
      <button class="m-btn m-btn--primary" type="button" @click="download">导出 PNG</button>
      <button class="m-btn" type="button" :disabled="!strokes.length" @click="undo">撤销一笔</button>
      <button class="m-btn" type="button" @click="clear">清空</button>
      <span class="m-chip m-chip--info">笔画 {{ strokes.length }}</span>
      <span class="m-chip">笔宽 {{ strokeWidth }}px</span>
      <input v-model.number="strokeWidth" type="range" min="1" max="8" class="m-sign__range" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  width: { type: Number, default: 460 },
  height: { type: Number, default: 170 },
  fileName: { type: String, default: 'signature.png' },
})

const canvasEl = ref(null)
const strokes = ref([]) // [{ points: [{x,y}], width, color }]
const strokeWidth = ref(2.5)
let drawing = false
let ctx = null

/** 重绘全部笔画（撤销靠「删一笔 + 全量重绘」，比逐像素回滚简单可靠） */
const redraw = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, props.width, props.height)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, props.width, props.height)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const s of strokes.value) {
    ctx.strokeStyle = s.color
    ctx.lineWidth = s.width
    ctx.beginPath()
    s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.stroke()
  }
}

const pos = (e) => {
  const rect = canvasEl.value.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * props.width,
    y: ((e.clientY - rect.top) / rect.height) * props.height,
  }
}

const onDown = (e) => {
  drawing = true
  canvasEl.value.setPointerCapture?.(e.pointerId)
  strokes.value = [...strokes.value, { points: [pos(e)], width: strokeWidth.value, color: '#1f2d3d' }]
  redraw()
}
const onMove = (e) => {
  if (!drawing) return
  const cur = strokes.value[strokes.value.length - 1]
  cur.points.push(pos(e))
  redraw()
}
const onUp = () => { drawing = false }

const undo = () => { strokes.value = strokes.value.slice(0, -1); redraw() }
const clear = () => { strokes.value = []; redraw() }
const download = () => {
  const a = document.createElement('a')
  a.href = canvasEl.value.toDataURL('image/png')
  a.download = props.fileName
  a.click()
}

onMounted(() => {
  ctx = canvasEl.value.getContext('2d')
  redraw()
})
watch(strokeWidth, () => { /* 笔宽只影响后续笔画，无需重绘 */ })
</script>

<style scoped>
.m-sign__canvas {
  width: 100%; max-width: 100%; display: block;
  border: 1px dashed #c0c4cc; border-radius: 8px;
  background: #fff; touch-action: none; cursor: crosshair;
}
.m-sign__range { width: 120px; }
</style>
