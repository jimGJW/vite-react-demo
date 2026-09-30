<template>
  <div class="pg">
    <header class="pg-head">
      <h1>创意 Playground</h1>
      <p>
        {{ DEMOS.length }} 个算法型 demo —— 流场、元胞自动机、密度波、混沌、数值解、脉冲耦合、分形、
        优化…… 按主题分成 {{ DEMO_GROUPS.length }} 组，左栏是手风琴，一次只展开一组。
        实现在 <code>src/creative/</code>（纯 canvas、不含任何框架 API），
        与 React 主应用、Angular 子应用的 Playground 共用同一份代码 ——
        由 <code>scripts/sync-creative-demos.mjs</code> 从主应用同步过来，只维护一份真相。
      </p>
    </header>

    <div class="pg-body">
      <!-- 左：手风琴分组卡片（收起用 :hidden，DOM 里始终保留全部 demo 项） -->
      <aside class="pg-list">
        <div class="pg-list__head">
          <span>全部 demo</span>
          <em>{{ DEMOS.length }} 个 · {{ DEMO_GROUPS.length }} 组</em>
        </div>
        <section
          v-for="g in groups"
          :key="g.label"
          class="pg-acc"
          :class="{ 'is-open': g.gi === openGroup }"
        >
          <button
            type="button"
            class="pg-acc__head"
            data-pg="group"
            :data-group-label="g.label"
            :data-group-index="g.gi"
            :data-group-open="g.gi === openGroup ? '1' : '0'"
            :aria-expanded="g.gi === openGroup"
            @click="toggleGroup(g.gi)"
          >
            <span class="pg-acc__chev" aria-hidden="true">▶</span>
            <span class="pg-acc__label">{{ g.label }}</span>
            <em class="pg-acc__count">{{ g.count }}</em>
            <i class="pg-acc__hint">{{ g.hint }}</i>
          </button>
          <div class="pg-acc__items" :hidden="g.gi !== openGroup">
            <button
              v-for="it in g.items"
              :key="it.d.id"
              type="button"
              class="pg-item"
              :class="{ 'is-active': it.i === active }"
              data-pg="demo"
              :data-demo-id="it.d.id"
              @click="pick(it.i)"
            >
              <span class="pg-item__no">{{ pad2(it.i) }}</span>
              <span class="pg-item__body">
                <b>{{ it.d.title }}</b>
                <em>{{ it.d.tag }}</em>
              </span>
            </button>
          </div>
        </section>
      </aside>

      <!-- 右：舞台 + 控件 + 说明 -->
      <section class="pg-stage">
        <div class="pg-toolbar">
          <b class="pg-toolbar__title" data-pg="title">{{ demo.title }}</b>
          <span class="pg-tag">{{ demo.tag }}</span>
          <span class="pg-spacer" />
          <el-button size="small" :type="paused ? 'success' : 'default'" data-pg="pause" @click="togglePause">
            {{ paused ? '继续' : '暂停' }}
          </el-button>
          <el-button size="small" data-pg="restart" @click="restart">重开</el-button>
        </div>

        <div class="pg-canvas-wrap" :style="{ background: demo.bg }">
          <canvas
            ref="stage"
            class="pg-canvas"
            data-pg="canvas"
            @pointerdown="onPointer('down', $event)"
            @pointermove="onPointer('move', $event)"
            @pointerup="onPointer('up', $event)"
            @pointerleave="onPointer('leave', $event)"
          />
          <!-- HUD 走 template ref 直写 textContent：60fps 的数据不该惊动响应式系统 -->
          <div class="pg-hud">
            <span><i>FPS</i><b ref="fpsEl" data-pg="fps">—</b></span>
            <span><i>指针</i><b ref="ptrEl" data-pg="ptr">—</b></span>
          </div>
          <span v-if="paused" class="pg-paused">已暂停</span>
        </div>

        <div class="pg-controls">
          <span v-if="demo.params.length === 0" class="pg-controls__empty">
            此 demo 无可调参数，直接在画布上交互
          </span>
          <label
            v-for="p in demo.params"
            :key="p.key"
            class="pg-param"
            data-pg="param"
            :data-param-key="p.key"
          >
            <span class="pg-param__label">{{ p.label }}</span>
            <el-slider
              :model-value="values[p.key]"
              :min="p.min"
              :max="p.max"
              :step="p.step"
              :show-tooltip="false"
              style="width: 112px"
              @input="(v) => onParam(p.key, v)"
            />
            <b class="pg-param__val">{{ values[p.key] }}</b>
          </label>

          <span v-if="demo.actions.length > 0" class="pg-sep" />
          <el-button
            v-for="a in demo.actions"
            :key="a.key"
            size="small"
            type="primary"
            plain
            data-pg="act"
            :data-act-key="a.key"
            @click="onAction(a.key)"
          >
            {{ a.label }}
          </el-button>
        </div>

        <p class="pg-desc">{{ demo.desc }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * 创意 Playground（Vue 子应用版）
 *
 * 与 React 版（src/pages/Playground/index.jsx）结构一一对应，可直接对照两种写法：
 *  - React：实例挂 useRef，靠 useEffect 的依赖数组 [demo, nonce] 重建；HUD 用 data-live + querySelectorAll 直写
 *  - Vue  ：实例挂普通变量，靠 watch([active, nonce]) 重建；HUD 用 template ref 直写 textContent
 * 两者都刻意不走「把逐帧数据塞进框架状态」这条路 —— 那是 60fps 重渲染的经典写法。
 *
 * `data-pg="*"` 是**跨三端统一的探针选择器**（三份薄壳的 DOM 结构、类名、属性完全一致），
 * 让 `scripts/playground-probe.mjs` 一套选择器就能跑完三端。
 */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { DEMOS, DEMO_GROUPS } from '../creative/index.js'

const pad2 = (n) => String(n + 1).padStart(2, '0')

/** 取某个 demo 声明的参数默认值 */
function defaultsFor(index) {
  const out = {}
  for (const p of DEMOS[index]?.params ?? []) out[p.key] = p.value
  return out
}

/**
 * 分组表 → 手风琴所需的「组 + 组内条目」。分组是连续区间，所以按下标切片即可。
 * 用 computed 但没有任何响应式依赖 —— 等于模块级常量算一次，避免每次重渲染都 slice。
 */
const groups = computed(() => DEMO_GROUPS.map((g, gi) => ({
  gi,
  label: g.label,
  hint: g.hint,
  count: g.to - g.from + 1,
  items: DEMOS.slice(g.from, g.to + 1).map((d, k) => ({ d, i: g.from + k })),
})))

/** 下标 → 所属分组序号（用于「选中某 demo 时顺手展开它所在的组」） */
const GROUP_OF = DEMOS.map((_, i) => DEMO_GROUPS.findIndex((g) => i >= g.from && i <= g.to))

const active = ref(0)
/* nonce 只用来强制重建实例（「重开」按钮），值本身没有含义 */
const nonce = ref(0)
const paused = ref(false)
/* 展开的组序号；-1 = 全部收起（手风琴允许「只看目录」） */
const openGroup = ref(0)
/* values 只驱动控件显示；demo 内部状态由 setParam 命令式维护，不回流响应式 */
const values = reactive(defaultsFor(0))

const stage = ref(null)
const fpsEl = ref(null)
const ptrEl = ref(null)

const demo = computed(() => DEMOS[active.value])

/* 逐帧对象全部放在 setup 顶层的普通变量里 —— 不进响应式，也就没有 60fps 的依赖触发 */
let inst = null
let ctx2d = null
let rafId = 0
let last = 0
let frames = 0
let hudAt = 0
let ro = null

function fit() {
  const el = stage.value
  if (!el || !inst) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = el.clientWidth
  const h = el.clientHeight
  el.width = Math.max(1, Math.round(w * dpr))
  el.height = Math.max(1, Math.round(h * dpr))
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
  inst.resize(w, h)
}

/** 切 demo / 重开：销毁旧实例，建新的，并把声明里的默认值灌进去 */
function build() {
  inst?.destroy()
  inst = null
  const el = stage.value
  if (!el) return

  const d = DEMOS[active.value]
  ctx2d = el.getContext('2d')
  inst = d.create(ctx2d)

  /* values 是 reactive 对象，换 demo 时原地改写键（而不是整个替换）以保持引用稳定 */
  for (const k of Object.keys(values)) delete values[k]
  for (const p of d.params) values[p.key] = p.value

  fit()
  for (const p of d.params) inst.setParam(p.key, p.value)
  last = 0
  frames = 0
  hudAt = 0
  if (fpsEl.value) fpsEl.value.textContent = '—'
  if (ptrEl.value) ptrEl.value.textContent = '—'
}

/** 指针坐标换算成画布内 CSS px 再交给 demo */
function onPointer(kind, e) {
  if (!inst) return
  const r = stage.value.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top
  inst.pointer(kind, x, y)
  if (kind === 'move' && ptrEl.value) {
    ptrEl.value.textContent = `${Math.round(x)}, ${Math.round(y)}`
  }
}

function onParam(key, value) {
  values[key] = value
  inst?.setParam(key, value)
}

function onAction(key) {
  inst?.action(key)
}

function pick(index) {
  if (index === active.value) return
  active.value = index
  /* 选中的 demo 可能不在当前展开的那组里（探针会按 index 直接点），顺手把它的组打开 */
  openGroup.value = GROUP_OF[index]
  paused.value = false
}

/** 点已展开的组 → 收起（只留目录）；点别的组 → 换展开 */
function toggleGroup(gi) {
  openGroup.value = openGroup.value === gi ? -1 : gi
}

function togglePause() {
  paused.value = !paused.value
}

/** 「重开」：改 nonce 触发 watch，走和切 demo 同一条重建路径 */
function restart() {
  nonce.value += 1
}

function frame(ts) {
  rafId = requestAnimationFrame(frame)
  const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0
  last = ts
  if (!paused.value && inst) inst.frame(ts, dt)

  /* FPS 每 500ms 汇总一次，比瞬时间隔稳得多 */
  frames += 1
  if (!hudAt) hudAt = ts
  else if (ts - hudAt >= 500) {
    if (fpsEl.value) fpsEl.value.textContent = String(Math.round((frames * 1000) / (ts - hudAt)))
    frames = 0
    hudAt = ts
  }
}

watch([active, nonce], build)

onMounted(() => {
  build()
  rafId = requestAnimationFrame(frame)
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => fit())
    ro.observe(stage.value)
  } else {
    window.addEventListener('resize', fit)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  ro?.disconnect()
  window.removeEventListener('resize', fit)
  inst?.destroy()
  inst = null
})
</script>

<style scoped>
/* 颜色沿用子应用既有色板（见 OrbitLab.vue）；画布区是刻意的深色例外 */
.pg {
  padding: 18px 22px 44px;
}

.pg-head h1 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #1f2d3d;
}

.pg-head p {
  margin: 0 0 16px;
  max-width: 900px;
  font-size: 12.5px;
  color: #8a929f;
  line-height: 1.85;
}

.pg-head code {
  font-size: 11.5px;
  background: #f2f4f7;
  border-radius: 4px;
  padding: 1px 5px;
}

.pg-body {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

/* —————————————— 左栏：demo 列表 —————————————— */
.pg-list {
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
  max-height: 660px;
  overflow: auto;
}

.pg-list__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 4px 8px 8px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #8a929f;
  border-bottom: 1px solid #f0f2f5;
}

.pg-list__head em {
  font-style: normal;
  font-weight: 600;
  color: #42b883;
}

/* 手风琴分组卡片：82 个条目平铺会滚到天边，折起来左栏高度才稳。
   同一时刻只展开一张（openGroup 保证），收起走 :hidden 而不是 v-if ——
   [data-pg="demo"] 必须始终是全集，探针拿它当结构断言。 */
.pg-acc {
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  margin-bottom: 4px;
  background: #fff;
  overflow: hidden;
}

.pg-acc.is-open {
  border-color: #42b883;
  box-shadow: 0 0 0 1px rgba(66, 184, 131, 0.14);
}

/* 卡片头就是折叠开关：整条可点，键盘/读屏靠 aria-expanded 传达状态 */
.pg-acc__head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  padding: 8px 8px 7px;
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.pg-acc__head:hover {
  background: #f7f8fa;
}

.pg-acc__chev {
  flex: 0 0 auto;
  font-size: 9px;
  line-height: 1;
  color: #c0c4cc;
  transition: transform 0.18s ease, color 0.18s ease;
}

.pg-acc.is-open .pg-acc__chev {
  transform: rotate(90deg);
  color: #42b883;
}

.pg-acc__label {
  font-size: 12px;
  font-weight: 700;
  color: #1f2d3d;
  padding-left: 7px;
  border-left: 3px solid #e4e7ed;
  line-height: 1.1;
  transition: border-color 0.18s ease;
}

.pg-acc.is-open .pg-acc__label {
  border-left-color: #42b883;
}

.pg-acc__count {
  flex: 0 0 auto;
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  color: #8a929f;
  background: #f2f4f7;
  border-radius: 999px;
  padding: 0 6px;
  line-height: 16px;
  transition: background 0.18s ease, color 0.18s ease;
}

.pg-acc.is-open .pg-acc__count {
  color: #2e8b5f;
  background: #eefaf3;
}

.pg-acc__hint {
  flex: 1 1 auto;
  font-style: normal;
  font-size: 11px;
  color: #8a929f;
  text-align: right;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pg-acc__items {
  padding: 2px 6px 6px;
  animation: pgAccIn 0.18s ease both;
}

/* 显式写一条：UA 的 [hidden]{display:none} 优先级最低，别让别的规则把它顶掉 */
.pg-acc__items[hidden] {
  display: none;
}

@keyframes pgAccIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pg-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 7px 8px;
  margin-bottom: 2px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  font: inherit;
  transition: background 0.15s, border-color 0.15s;
}

.pg-item:hover {
  background: #f7f8fa;
}

/* 选中态：实色描边 + 主色序号，与全局导航条的「当前页」信号同一套语言 */
.pg-item.is-active {
  border-color: #42b883;
  background: rgba(66, 184, 131, 0.08);
}

.pg-item__no {
  flex: 0 0 20px;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #c0c4cc;
}

.pg-item.is-active .pg-item__no {
  color: #2e8b5f;
}

.pg-item__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.pg-item__body b {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
}

.pg-item__body em {
  font-style: normal;
  font-size: 11px;
  color: #8a929f;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* —————————————— 右栏：舞台 —————————————— */
.pg-stage {
  min-width: 0;
}

.pg-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 30px;
  margin-bottom: 10px;
}

.pg-toolbar__title {
  font-size: 15px;
  color: #1f2d3d;
}

.pg-tag {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #2e8b5f;
  background: #eefaf3;
}

.pg-spacer {
  flex: 1 1 auto;
}

.pg-canvas-wrap {
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  min-height: 300px;
}

.pg-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.pg-hud {
  position: absolute;
  top: 8px;
  right: 10px;
  display: flex;
  gap: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(6, 10, 20, 0.55);
  backdrop-filter: blur(3px);
}

.pg-hud span {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
}

.pg-hud i {
  font-style: normal;
  color: rgba(255, 255, 255, 0.42);
}

.pg-hud b {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #7dd3fc;
}

.pg-paused {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  color: #ffd666;
  background: rgba(6, 10, 20, 0.6);
}

/* —————————————— 控件条 —————————————— */
.pg-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding: 12px 14px;
  margin-top: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #fff;
}

.pg-controls__empty {
  font-size: 12px;
  color: #8a929f;
}

.pg-param {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.pg-param__label {
  white-space: nowrap;
}

.pg-param__val {
  min-width: 38px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #2e8b5f;
}

.pg-sep {
  width: 1px;
  height: 20px;
  background: #ebeef5;
}

.pg-desc {
  margin: 12px 0 0;
  padding: 12px 14px;
  border-left: 3px solid #42b883;
  border-radius: 0 8px 8px 0;
  font-size: 12.5px;
  line-height: 1.9;
  color: #8a929f;
  background: #f7f8fa;
}

@media (max-width: 980px) {
  .pg-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .pg-list {
    max-height: 260px;
  }

  /* 窄屏下卡片头只有一行宽，hint 会跟组名抢位置，优先保组名 */
  .pg-acc__hint {
    display: none;
  }
}
</style>
