<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { STARS, TOTAL_DEGREES } from './stars-data.js'
import './StarArray.scss'

const TOTAL = TOTAL_DEGREES // 365

// 多层防御环：半径比例 / 星数 / 转向 / 转速 / 环内流动速度 / 流动方向 / 径向脉动周期
// - dir/speed：环整体旋转（一层）
// - flowDur/flowDir：环内星辰角向流动（二层），方向与环整体相反，形成互锁复合运动
// - radialDur：径向跨环脉动（三层），星辰半径在最内↔最外间循环，相位错开 → 从内到外/从外到内
//   注：径向脉动使星辰不再绑定出生环，不同时刻处于不同环层级
const RINGS = [
  { frac: 0.26, count: 33, dir: 1, speed: 80, flowDur: 50, flowDir: -1, radialDur: 80 },
  { frac: 0.42, count: 53, dir: -1, speed: 110, flowDur: 65, flowDir: 1, radialDur: 95 },
  { frac: 0.58, count: 73, dir: 1, speed: 140, flowDur: 80, flowDir: -1, radialDur: 110 },
  { frac: 0.74, count: 93, dir: -1, speed: 170, flowDur: 95, flowDir: 1, radialDur: 85 },
  { frac: 0.9, count: 113, dir: 1, speed: 120, flowDur: 70, flowDir: -1, radialDur: 100 },
]

// 把 365 颗星分配到各环，生成带全局索引的扁平列表
const LAYOUT = (() => {
  const layout = [] // { ring, idxInRing, angle }
  RINGS.forEach((r, ri) => {
    for (let i = 0; i < r.count; i += 1) {
      layout.push({ ring: ri, idxInRing: i, angle: i * (360 / r.count) })
    }
  })
  return layout
})()

// 按环分组（结构固定，模块级一次算好）
const RING_STARS = RINGS.map((_, ri) =>
  LAYOUT.map((s, gi) => ({ ...s, gi })).filter((s) => s.ring === ri),
)

const cursor = ref(0) // 规律游标：按序遍历全盘每颗星
const selected = ref(null)
const paused = ref(false)

// 规律运转：每 2.5s 推进一颗，依次遍历所有环上的星
let timer = null
watch(
  [cursor, paused],
  () => {
    clearTimeout(timer)
    if (paused.value) return
    timer = setTimeout(() => {
      cursor.value = (cursor.value + 1) % TOTAL
    }, 2500)
  },
  { immediate: true },
)
onUnmounted(() => clearTimeout(timer))

const active = computed(() => selected.value ?? cursor.value)
const current = computed(() => STARS[active.value])

defineExpose({ selected, cursor, paused })
</script>

<template>
  <section class="sa">
    <div class="sa-head">
      <h2>周天星辰大阵</h2>
      <p>
        365 颗真实恒星流转于五重防御环间：环组反向互锁、环内角向流动、星辰跨环径向脉动，从内到外、从外到内。点击任意星查看详情。
      </p>
    </div>

    <div class="sa-stage">
      <div class="sa-nebula sa-nebula-1" />
      <div class="sa-nebula sa-nebula-2" />

      <div class="sa-array">
        <!-- 旋转扫描光带（防御扫描）-->
        <div class="sa-sweep" />

        <div
          v-for="(r, ri) in RINGS"
          :key="ri"
          class="sa-ring-group"
          :class="r.dir > 0 ? 'sa-rot-cw' : 'sa-rot-ccw'"
          :style="{
            '--ring-r': `calc(var(--sa-r-max) * ${r.frac})`,
            animationDuration: `${r.speed}s`,
          }"
        >
          <span class="sa-track" />
          <span
            v-for="s in RING_STARS[ri]"
            :key="s.gi"
            class="sa-star-cell"
            :class="{ 'sa-flow-rev': r.flowDir < 0 }"
            :style="{
              '--idx': s.gi,
              '--flow-dur': `${r.flowDur}s`,
              '--radial-dur': `${r.radialDur}s`,
            }"
          >
            <span
              class="sa-star"
              :class="{
                cardinal: s.gi % 91 === 0,
                active: s.gi === active,
                selected: selected === s.gi,
              }"
              :style="{ '--angle': `${s.angle}deg` }"
              role="button"
              tabindex="0"
              :title="`${STARS[s.gi].name} · ${STARS[s.gi].tag}`"
              :aria-label="`${STARS[s.gi].name}，${STARS[s.gi].tag}`"
              @click="selected = s.gi"
              @keydown.enter.prevent="selected = s.gi"
              @keydown.space.prevent="selected = s.gi"
            />
          </span>
        </div>

        <span class="sa-core" />
      </div>
    </div>

    <!-- 当前星 HUD -->
    <div class="sa-hud">
      <div class="sa-current">
        <span class="sa-dot" :style="{ background: current.color }" />
        <b>{{ current.name }}</b>
        <span class="sa-en">{{ current.en }}</span>
        <span class="sa-meta">
          {{ current.constellation }} · {{ current.tag }} · 视星等 {{ current.mag }} ·
          {{ current.distance }}
        </span>
      </div>
      <div class="sa-ctrl">
        <span>周天 {{ active + 1 }}/{{ TOTAL }} 度 · 起始第 {{ LAYOUT[active].ring + 1 }} 环</span>
        <button
          type="button"
          :title="paused ? '继续运转' : '暂停运转'"
          @click="paused = !paused"
        >
          {{ paused ? '▶' : '⏸' }}
        </button>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="selected !== null"
      class="sa-modal"
      role="dialog"
      aria-modal="true"
      @click="selected = null"
    >
      <div class="sa-card" @click.stop>
        <button type="button" class="sa-close" aria-label="关闭" @click="selected = null">×</button>
        <div class="sa-card-head">
          <span class="sa-big-dot" :style="{ background: STARS[selected].color }" />
          <div>
            <h3>{{ STARS[selected].name }}</h3>
            <span class="sa-en">{{ STARS[selected].en }}</span>
          </div>
          <span class="sa-badge">{{ STARS[selected].tag }}</span>
        </div>
        <dl class="sa-grid">
          <div>
            <dt>所属星座</dt>
            <dd>{{ STARS[selected].constellation }}</dd>
          </div>
          <div>
            <dt>视星等</dt>
            <dd>{{ STARS[selected].mag }}</dd>
          </div>
          <div>
            <dt>距离</dt>
            <dd>{{ STARS[selected].distance }}</dd>
          </div>
          <div>
            <dt>能否肉眼可见</dt>
            <dd>{{ STARS[selected].mag < 3.5 ? '可以' : '需望远镜' }}</dd>
          </div>
        </dl>
        <p class="sa-note">{{ STARS[selected].note }}</p>
        <p v-if="STARS[selected].approx" class="sa-approx">
          * 该星数据为基于星座代表的估值，仅供示意。
        </p>
      </div>
    </div>
  </section>
</template>
