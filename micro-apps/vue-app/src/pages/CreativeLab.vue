<template>
  <div class="lab">
    <header class="lab-head">
      <h1>创意实验室</h1>
      <p>六个「好看且有用」的交互 demo —— 零第三方依赖，只用 Vue 官方 API 与原生能力</p>
    </header>

    <!-- ① 命令面板：⌘/Ctrl + K 唤起 -->
    <section class="lab-card">
      <h3>① 命令面板 <span class="hint">⌘ / Ctrl + K</span></h3>
      <p class="desc">
        键盘优先的跳转入口：模糊过滤 + ↑↓ 选择 + Enter 执行。大应用里比"点侧边栏三层菜单"快得多。
      </p>
      <el-button type="primary" @click="paletteOpen = true">打开命令面板</el-button>
      <span class="metrics">上次执行：{{ lastCommand || '（还没执行过）' }}</span>
    </section>

    <!-- ② 粒子星轨 -->
    <section class="lab-card">
      <h3>② 粒子星轨 <span class="hint">canvas + rAF</span></h3>
      <p class="desc">
        鼠标移动即产生引力，粒子被拽向光标又互相弹开。纯 2D canvas，60fps 下 ~120 个粒子。
      </p>
      <canvas ref="particleCanvas" class="lab-canvas" height="220" @pointermove="onParticleMove" />
    </section>

    <!-- ③ 打字机 -->
    <section class="lab-card">
      <h3>③ 打字机 <span class="hint">定时器 + 光标闪烁</span></h3>
      <p class="desc">逐字上屏、到末尾停顿再回删重来。常用于落地页主标题。</p>
      <p class="typewriter">
        <span class="typewriter__text">{{ typed }}</span><span class="typewriter__caret" />
      </p>
      <el-button size="small" @click="typewriterPaused = !typewriterPaused">
        {{ typewriterPaused ? '继续' : '暂停' }}
      </el-button>
    </section>

    <!-- ④ 聚光卡片 -->
    <section class="lab-card">
      <h3>④ 聚光卡片 <span class="hint">CSS 变量 + pointermove</span></h3>
      <p class="desc">
        光斑位置交给 CSS 变量，JS 只负责写两个数 —— 这样动画留在合成层，不触发重排。
      </p>
      <div class="spotlight-row">
        <div
          v-for="c in spotlightCards"
          :key="c.title"
          class="spotlight"
          @pointermove="onSpotlight($event, c)"
          @pointerleave="c.x = -200; c.y = -200"
        >
          <span class="spotlight__glow" :style="{ left: `${c.x}px`, top: `${c.y}px` }" />
          <b>{{ c.title }}</b>
          <em>{{ c.desc }}</em>
        </div>
      </div>
    </section>

    <!-- ⑤ 3D 翻转卡片 -->
    <section class="lab-card">
      <h3>⑤ 3D 翻转卡片 <span class="hint">transform-style: preserve-3d</span></h3>
      <p class="desc">hover 或点击翻面。用 backface-visibility 让背面不参与绘制，比切 DOM 更省。</p>
      <div class="flip-row">
        <div
          v-for="f in flipCards"
          :key="f.front"
          class="flip"
          :class="{ 'is-flipped': f.flipped }"
          @click="f.flipped = !f.flipped"
        >
          <div class="flip__inner">
            <div class="flip__face flip__face--front">{{ f.front }}</div>
            <div class="flip__face flip__face--back">{{ f.back }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ⑥ 涟漪按钮 -->
    <section class="lab-card">
      <h3>⑥ 涟漪按钮 <span class="hint">点击点扩散</span></h3>
      <p class="desc">按点击坐标生成一个扩散圆，动画结束自动移除节点 —— 不会堆积 DOM。</p>
      <div class="ripple-row">
        <button
          v-for="r in 3"
          :key="r"
          class="ripple-btn"
          :class="`ripple-btn--${r}`"
          @click="spawnRipple"
        >
          点我看涟漪 {{ r }}
        </button>
      </div>
    </section>

    <!-- —— 命令面板浮层 —— -->
    <Teleport to="body">
      <div v-if="paletteOpen" class="palette-mask" @click.self="closePalette">
        <div class="palette" role="dialog" aria-label="命令面板">
          <div class="palette__head">
            <span class="palette__icon">⌘</span>
            <input
              ref="paletteInput"
              v-model="paletteQuery"
              class="palette__input"
              placeholder="输入命令：跳转页面 / 复制 / 切换…"
              @keydown.down.prevent="moveCursor(1)"
              @keydown.up.prevent="moveCursor(-1)"
              @keydown.enter.prevent="runCommand(paletteHits[cursor])"
              @keydown.esc="closePalette"
            />
            <span class="palette__count">{{ paletteHits.length }} 项</span>
          </div>
          <ul class="palette__list">
            <li
              v-for="(cmd, i) in paletteHits"
              :key="cmd.id"
              class="palette__item"
              :class="{ 'is-cursor': i === cursor }"
              @mouseenter="cursor = i"
              @click="runCommand(cmd)"
            >
              <span class="palette__kind">{{ cmd.kind }}</span>
              <span class="palette__label">{{ cmd.label }}</span>
              <span class="palette__path">{{ cmd.hint }}</span>
            </li>
            <li v-if="!paletteHits.length" class="palette__empty">没有匹配的命令</li>
          </ul>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { copyText, randomInt } from '../utils'
import { MENU_ITEMS } from '../router.js'

const router = useRouter()

/* ============================ ① 命令面板 ============================ */

const paletteOpen = ref(false)
const paletteQuery = ref('')
const paletteInput = ref(null)
const cursor = ref(0)
const lastCommand = ref('')

/** 命令集：页面跳转（由路由表派生）+ 几条动作命令 */
const commands = [
  ...MENU_ITEMS.map((i) => ({
    id: `go:${i.path}`,
    kind: '跳转',
    label: i.label,
    hint: i.path,
    keyword: `${i.label} ${i.path} ${i.group}`,
    run: () => router.push(i.path),
  })),
  {
    id: 'act:copy-url',
    kind: '动作',
    label: '复制当前页面路径',
    hint: 'clipboard',
    keyword: '复制 copy 路径 url',
    run: async () => copyText(router.currentRoute.value.path),
  },
  {
    id: 'act:random',
    kind: '动作',
    label: '随机跳到一个页面',
    hint: 'fun',
    keyword: '随机 random 随便',
    run: () => router.push(MENU_ITEMS[randomInt(0, MENU_ITEMS.length - 1)].path),
  },
]

/** 极简模糊匹配：先整体包含，再退化为「子序列」匹配（输入 lbr 能命中"实验室"拼音不了，但能命中英文） */
const fuzzyHit = (text, q) => {
  const t = text.toLowerCase()
  if (t.includes(q)) return true
  let i = 0
  for (const ch of t) {
    if (ch === q[i]) i += 1
    if (i >= q.length) return true
  }
  return q.length === 0
}

const paletteHits = computed(() => {
  const q = paletteQuery.value.trim().toLowerCase()
  if (!q) return commands
  return commands.filter((c) => fuzzyHit(c.keyword, q) || fuzzyHit(c.label, q))
})

watch(paletteHits, () => { cursor.value = 0 })

const moveCursor = (step) => {
  const n = paletteHits.value.length
  if (!n) return
  cursor.value = (cursor.value + step + n) % n
}

const runCommand = async (cmd) => {
  if (!cmd) return
  lastCommand.value = `${cmd.kind} · ${cmd.label}`
  closePalette()
  await cmd.run()
}

const closePalette = () => {
  paletteOpen.value = false
  paletteQuery.value = ''
}

/** ⌘K / Ctrl+K 全局唤起；打开后自动聚焦输入框 */
const onGlobalKey = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
    if (paletteOpen.value) {
      paletteQuery.value = ''
      nextTick(() => paletteInput.value?.focus())
    }
  } else if (e.key === 'Escape' && paletteOpen.value) {
    closePalette()
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKey))

/* ============================ ② 粒子星轨 ============================ */

const particleCanvas = ref(null)
let particles = []
let rafId = 0
const pointer = { x: -999, y: -999 }

const resizeCanvas = () => {
  const el = particleCanvas.value
  if (!el) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = el.clientWidth
  const h = el.clientHeight
  el.width = w * dpr
  el.height = h * dpr
  const ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (!particles.length) {
    particles = Array.from({ length: 110 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1 + Math.random() * 2,
    }))
  }
}

const onParticleMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  pointer.x = e.clientX - rect.left
  pointer.y = e.clientY - rect.top
}

const tickParticles = () => {
  const el = particleCanvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  const w = el.clientWidth
  const h = el.clientHeight
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, w, h)

  for (const p of particles) {
    // 光标引力（平方反比，截断避免过强）
    const dx = pointer.x - p.x
    const dy = pointer.y - p.y
    const d2 = Math.max(dx * dx + dy * dy, 400)
    const force = Math.min(3600 / d2, 0.9)
    p.vx += (dx / Math.sqrt(d2)) * force * 0.06
    p.vy += (dy / Math.sqrt(d2)) * force * 0.06
    p.vx *= 0.985
    p.vy *= 0.985
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0) p.x += w
    if (p.x > w) p.x -= w
    if (p.y < 0) p.y += h
    if (p.y > h) p.y -= h
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(66, 184, 131, 0.9)'
    ctx.fill()
  }
  // 光标位置画一个柔光点
  const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 60)
  g.addColorStop(0, 'rgba(66, 184, 131, 0.30)')
  g.addColorStop(1, 'rgba(66, 184, 131, 0)')
  ctx.fillStyle = g
  ctx.fillRect(pointer.x - 60, pointer.y - 60, 120, 120)
  rafId = requestAnimationFrame(tickParticles)
}

/* ============================ ③ 打字机 ============================ */

const typewriterLines = [
  '零依赖的 Vue 3 子应用',
  '58+ utils · 21 composables · 14 组件',
  '一个宿主页只加载一个子应用',
]
const typed = ref('')
const typewriterPaused = ref(false)
let typeTimer = 0
let lineIndex = 0
let charIndex = 0
let deleting = false

const tickTypewriter = () => {
  if (typewriterPaused.value) return
  const line = typewriterLines[lineIndex]
  if (!deleting) {
    charIndex += 1
    typed.value = line.slice(0, charIndex)
    if (charIndex >= line.length) {
      deleting = true
      typeTimer = setTimeout(tickTypewriter, 1400) // 写完停一下
      return
    }
  } else {
    charIndex -= 1
    typed.value = line.slice(0, charIndex)
    if (charIndex <= 0) {
      deleting = false
      lineIndex = (lineIndex + 1) % typewriterLines.length
    }
  }
  typeTimer = setTimeout(tickTypewriter, deleting ? 45 : 90)
}

/* ============================ ④ 聚光卡片 ============================ */

const spotlightCards = reactive([
  { title: '指针事件', desc: 'pointermove 同时覆盖鼠标与触控', x: -200, y: -200 },
  { title: 'CSS 变量', desc: 'JS 只写两个数，渲染交给合成层', x: -200, y: -200 },
  { title: '零重排', desc: '光斑用 radial-gradient，不改布局', x: -200, y: -200 },
])

const onSpotlight = (e, card) => {
  const rect = e.currentTarget.getBoundingClientRect()
  card.x = e.clientX - rect.left
  card.y = e.clientY - rect.top
}

/* ============================ ⑤ 3D 翻转 ============================ */

const flipCards = reactive([
  { front: '正面 · API', back: '背面 · <script setup>', flipped: false },
  { front: '正面 · 指令', back: '背面 · v-copy / v-lazy', flipped: false },
  { front: '正面 · 路由', back: '背面 · 双 history 模式', flipped: false },
])

/* ============================ ⑥ 涟漪 ============================ */

const spawnRipple = (e) => {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const span = document.createElement('span')
  const size = Math.max(rect.width, rect.height) * 2
  span.className = 'ripple-wave'
  span.style.width = `${size}px`
  span.style.height = `${size}px`
  span.style.left = `${e.clientX - rect.left - size / 2}px`
  span.style.top = `${e.clientY - rect.top - size / 2}px`
  btn.appendChild(span)
  // 动画结束即移除节点，避免 DOM 越点越多
  span.addEventListener('animationend', () => span.remove())
}

/* ============================ 生命周期 ============================ */

let ro = null
onMounted(() => {
  resizeCanvas()
  tickParticles()
  tickTypewriter()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(resizeCanvas)
    if (particleCanvas.value) ro.observe(particleCanvas.value)
  } else {
    window.addEventListener('resize', resizeCanvas)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearTimeout(typeTimer)
  ro?.disconnect()
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.lab { padding: 18px 22px 44px; }
.lab-head h1 { margin: 0 0 4px; font-size: 20px; color: #303133; }
.lab-head p { margin: 0 0 16px; font-size: 12.5px; color: #909399; }

.lab-card {
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 14px;
  background: #fff;
}
.lab-card h3 { margin: 0 0 6px; font-size: 15px; color: #303133; }
.lab-card .hint {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #42b883;
  background: #eefaf3;
  border-radius: 999px;
  padding: 1px 8px;
}
.desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.7; }
.metrics { margin-left: 10px; font-size: 12.5px; color: #606266; }

/* ② 粒子画布 */
.lab-canvas {
  display: block;
  width: 100%;
  height: 220px;
  border-radius: 10px;
  background: #0f172a;
  cursor: crosshair;
  touch-action: none;
}

/* ③ 打字机 */
.typewriter {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: #2e8b5f;
  min-height: 28px;
  font-family: 'SF Mono', Monaco, ui-monospace, monospace;
}
.typewriter__caret {
  display: inline-block;
  width: 2px;
  height: 18px;
  margin-left: 2px;
  background: #42b883;
  vertical-align: -3px;
  animation: caretBlink 0.9s steps(1) infinite;
}
@keyframes caretBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

/* ④ 聚光卡片 */
.spotlight-row { display: flex; gap: 12px; flex-wrap: wrap; }
.spotlight {
  position: relative;
  overflow: hidden;
  flex: 1 1 180px;
  min-height: 92px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  background: #fafcfb;
  padding: 14px 16px;
  cursor: crosshair;
}
.spotlight__glow {
  position: absolute;
  width: 260px;
  height: 260px;
  margin: -130px 0 0 -130px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(66, 184, 131, 0.32), rgba(66, 184, 131, 0) 68%);
  pointer-events: none;
  transition: left 0.08s linear, top 0.08s linear;
}
.spotlight b { position: relative; display: block; font-size: 13.5px; color: #303133; }
.spotlight em {
  position: relative;
  display: block;
  margin-top: 4px;
  font-style: normal;
  font-size: 12px;
  color: #909399;
}

/* ⑤ 3D 翻转 */
.flip-row { display: flex; gap: 12px; flex-wrap: wrap; perspective: 900px; }
.flip { flex: 1 1 170px; height: 92px; cursor: pointer; }
.flip__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.flip.is-flipped .flip__inner { transform: rotateY(180deg); }
.flip__face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  backface-visibility: hidden;
}
.flip__face--front { background: linear-gradient(135deg, #42b883, #2e9e6d); color: #fff; }
.flip__face--back {
  transform: rotateY(180deg);
  background: #f3f7f5;
  color: #2e8b5f;
  border: 1px solid #b7e6cd;
}

/* ⑥ 涟漪 */
.ripple-row { display: flex; gap: 12px; flex-wrap: wrap; }
.ripple-btn {
  position: relative;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: #42b883;
  transition: transform 0.14s;
}
.ripple-btn--2 { background: #409eff; }
.ripple-btn--3 { background: #e6a23c; }
.ripple-btn:active { transform: scale(0.97); }
/* 涟漪节点是 JS 生成后 append 的，不带 scoped 的 data-v 属性，
   因此必须用 :deep() 才能命中 */
.ripple-btn :deep(.ripple-wave) {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  pointer-events: none;
  animation: rippleSpread 0.62s ease-out forwards;
}
@keyframes rippleSpread {
  from { transform: scale(0); opacity: 0.75; }
  to { transform: scale(1); opacity: 0; }
}

/* —— 命令面板 —— */
.palette-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(15, 23, 42, 0.42);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  backdrop-filter: blur(2px);
}
.palette {
  width: min(620px, 92vw);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.32);
  overflow: hidden;
  animation: paletteIn 0.18s ease-out;
}
@keyframes paletteIn {
  from { opacity: 0; transform: translateY(-10px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
.palette__head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 14px;
  border-bottom: 1px solid #eef0f3;
}
.palette__icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #eefaf3;
  color: #2e8b5f;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.palette__input {
  flex: 1;
  border: 0;
  outline: 0;
  font-size: 14px;
  background: transparent;
  color: #303133;
}
.palette__count { font-size: 11px; color: #b7c2bc; white-space: nowrap; }
.palette__list { list-style: none; margin: 0; padding: 6px; max-height: 46vh; overflow-y: auto; }
.palette__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
.palette__item.is-cursor { background: #eefaf3; }
.palette__kind {
  flex: 0 0 auto;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 999px;
  background: #f0f2f5;
  color: #909399;
}
.palette__item.is-cursor .palette__kind { background: #42b883; color: #fff; }
.palette__label { flex: 1; color: #303133; }
.palette__path {
  font-size: 11px;
  color: #b7c2bc;
  font-family: 'SF Mono', Monaco, ui-monospace, monospace;
}
.palette__empty { padding: 18px; text-align: center; font-size: 12.5px; color: #b7c2bc; }
</style>
