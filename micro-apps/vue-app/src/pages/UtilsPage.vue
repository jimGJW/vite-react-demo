<template>
  <div class="utils-page">
    <header class="page-header-vue">
      <h1>工具函数 Utils</h1>
      <p>纯函数工具库 + 实时 playground，全部逻辑零依赖、可在 Node 里直接单测</p>
    </header>

    <!-- 防抖 debounce -->
    <section class="util-card">
      <h3>debounce 防抖</h3>
      <p class="util-desc">连续输入只会触发一次执行——搜索框、resize 的标准解法。</p>
      <el-input v-model="debounceInput" placeholder="快速输入试试" clearable @input="onDebounceInput" />
      <div class="util-metrics">
        <el-tag>原始 input 事件：{{ debounceRaw }}</el-tag>
        <el-tag type="success">防抖后执行：{{ debounceHit }}</el-tag>
      </div>
    </section>

    <!-- 节流 throttle -->
    <section class="util-card">
      <h3>throttle 节流</h3>
      <p class="util-desc">疯狂点击 1 秒内最多执行 3 次（300ms 间隔）——按钮防连点、滚动加载。</p>
      <el-button type="primary" @click="onThrottleClick">疯狂点我</el-button>
      <div class="util-metrics">
        <el-tag>点击次数：{{ throttleRaw }}</el-tag>
        <el-tag type="success">实际执行：{{ throttleHit }}</el-tag>
      </div>
    </section>

    <!-- 深拷贝 deepClone -->
    <section class="util-card">
      <h3>deepClone 深拷贝</h3>
      <p class="util-desc">structuredClone 实现，克隆后修改副本，原对象不受影响。</p>
      <el-input v-model="cloneJson" type="textarea" :rows="3" />
      <div class="util-metrics">
        <el-button size="small" @click="runClone">克隆并修改副本</el-button>
        <el-tag v-if="cloneResult" type="info">原对象未变：{{ cloneResult }}</el-tag>
      </div>
    </section>

    <!-- 字符串/格式化 -->
    <section class="util-card">
      <h3>字符串与格式化</h3>
      <p class="util-desc">camelize / slugify / formatBytes / formatDate 实时转换。</p>
      <el-input v-model="strInput" placeholder="输入 kebab-case 字符串，如 user-name-list" clearable />
      <div class="util-metrics">
        <el-tag>camelize → {{ camelizeOut }}</el-tag>
        <el-tag type="warning">slugify → {{ slugifyOut }}</el-tag>
      </div>
      <div class="util-metrics">
        <el-tag type="info">formatBytes({{ bytesInput }}) → {{ bytesOut }}</el-tag>
        <el-tag type="danger">现在时间 → {{ nowText }}</el-tag>
      </div>
    </section>

    <!-- clamp / randomId / uniqueBy -->
    <section class="util-card">
      <h3>clamp · randomId · uniqueBy</h3>
      <el-slider v-model="clampVal" :min="0" :max="100" :step="1" style="max-width: 320px" />
      <div class="util-metrics">
        <el-tag>clamp({{ clampVal }}, 20, 80) → {{ clampedOut }}</el-tag>
        <el-button size="small" @click="genId">生成 randomId</el-button>
        <el-tag v-if="lastId" type="success">{{ lastId }}</el-tag>
      </div>
      <div class="util-metrics">
        <el-tag>uniqueBy 去重：{{ rawList.length }} 条 → {{ uniqueOut.length }} 条</el-tag>
      </div>
    </section>

    <!-- 新增：函数组合 -->
    <section class="util-card">
      <h3>函数组合 <span class="badge">new</span></h3>
      <p class="util-desc">
        pipe 从左到右、compose 从右到左。下面把 pipe 串成一条"清洗 → 取千分位"的流水线。
      </p>
      <el-input v-model="pipeInput" placeholder="输入数字文本，如 12_345.6" clearable />
      <div class="util-metrics">
        <el-tag type="info">pipe(去空格 → toNumber → formatNumber) → {{ pipeOut }}</el-tag>
        <el-tag type="success">times(6, i => i * i) → {{ squares.join(', ') }}</el-tag>
      </div>
    </section>

    <!-- 新增：数组进阶 -->
    <section class="util-card">
      <h3>数组进阶 <span class="badge">new</span></h3>
      <p class="util-desc">partition / countBy / moveItem / toggleInArray —— 列表页与拖拽排序的高频需求。</p>
      <div class="util-metrics">
        <el-tag
          v-for="(row, i) in orderRows"
          :key="row"
          :type="i === 0 ? 'success' : 'info'"
        >{{ row }}</el-tag>
        <el-button size="small" @click="rotateOrder">moveItem(0 → 尾)</el-button>
      </div>
      <div class="util-metrics">
        <el-tag>partition 偶数/奇数：{{ partitionOut.even.join(',') }} | {{ partitionOut.odd.join(',') }}</el-tag>
        <el-tag type="warning">countBy 类型 → {{ JSON.stringify(countByOut) }}</el-tag>
      </div>
    </section>

    <!-- 新增：数值统计 -->
    <section class="util-card">
      <h3>数值统计 <span class="badge">new</span></h3>
      <p class="util-desc">均值 / 中位数 / 标准差 / 百分位 —— 报表页的四个常客；formatSigned 直接给涨跌号。</p>
      <div class="util-metrics">
        <el-tag>样本 {{ SAMPLE.length }} 个：{{ SAMPLE.join(', ') }}</el-tag>
      </div>
      <div class="util-metrics">
        <el-tag type="info">mean = {{ stats.mean }}</el-tag>
        <el-tag type="info">median = {{ stats.median }}</el-tag>
        <el-tag type="info">stdDev = {{ stats.stdDev }}</el-tag>
        <el-tag type="info">p90 = {{ stats.p90 }}</el-tag>
      </div>
      <div class="util-metrics">
        <el-tag :type="delta >= 0 ? 'danger' : 'success'">
          formatSigned({{ delta }}) → {{ signedOut }}
        </el-tag>
        <el-slider v-model="delta" :min="-9999" :max="9999" :step="137" style="max-width: 260px" />
      </div>
    </section>

    <!-- 新增：校验 -->
    <section class="util-card">
      <h3>校验器 <span class="badge">new</span></h3>
      <p class="util-desc">isEmail / isPhoneCN / isUrl / isIdCardCN（含 MOD 11-2 校验位）/ passwordStrength。</p>
      <el-input v-model="validInput" placeholder="输入邮箱 / 手机号 / 身份证 / 网址试试" clearable />
      <div class="util-metrics">
        <el-tag :type="checks.email ? 'success' : 'info'">邮箱 {{ checks.email ? '✓' : '✗' }}</el-tag>
        <el-tag :type="checks.phone ? 'success' : 'info'">手机号 {{ checks.phone ? '✓' : '✗' }}</el-tag>
        <el-tag :type="checks.idCard ? 'success' : 'info'">身份证 {{ checks.idCard ? '✓' : '✗' }}</el-tag>
        <el-tag :type="checks.url ? 'success' : 'info'">网址 {{ checks.url ? '✓' : '✗' }}</el-tag>
      </div>
      <div class="util-metrics">
        <el-tag :type="strength.score >= 3 ? 'success' : strength.score >= 2 ? 'warning' : 'danger'">
          口令强度：{{ strength.label }}（{{ strength.score }}/4）
        </el-tag>
      </div>
    </section>

    <!-- 新增：颜色 -->
    <section class="util-card">
      <h3>颜色工具 <span class="badge">new</span></h3>
      <p class="util-desc">hexToRgb / rgbToHex / lighten / darken / readableTextOn —— 主题色派生与自适应文字色。</p>
      <div class="color-row">
        <div v-for="c in colorScale" :key="c.hex" class="color-swatch" :style="{ background: c.hex, color: c.text }">
          <b>{{ c.label }}</b>
          <em>{{ c.hex }}</em>
        </div>
      </div>
      <div class="util-metrics">
        <el-tag type="info">hexToRgb('#42b883') → {{ rgbText }}</el-tag>
      </div>
    </section>

    <!-- 新增：数据结构 -->
    <section class="util-card">
      <h3>数据结构 <span class="badge">new</span></h3>
      <p class="util-desc">队列 / 栈 / 优先队列（二叉堆）/ 令牌桶限流 / 环形缓冲区，都是零依赖的实现。</p>
      <div class="util-metrics">
        <el-button size="small" type="primary" @click="pushQueue">入队</el-button>
        <el-button size="small" @click="popQueue">出队</el-button>
        <el-tag type="info">队列 size = {{ queueSize }}：{{ queueItems.join(' → ') || '（空）' }}</el-tag>
      </div>
      <div class="util-metrics">
        <el-button size="small" @click="pushHeap">push 随机数</el-button>
        <el-button size="small" @click="popHeap">pop 最小值</el-button>
        <el-tag type="success" v-if="heapOut">优先队列出队：{{ heapOut }}</el-tag>
      </div>
      <div class="util-metrics">
        <el-button size="small" @click="tryTake">tick 限流（3 次/秒）</el-button>
        <el-tag :type="limitOk ? 'success' : 'danger'">
          {{ limitOk ? '放行' : '被限流' }} · 剩余额度 {{ limitLeft }}
        </el-tag>
        <el-tag type="warning">环形缓冲（容量 5）：{{ ring.join(', ') }}</el-tag>
      </div>
    </section>

    <!-- 新增：时间与人话 -->
    <section class="util-card">
      <h3>时间与人话 <span class="badge">new</span></h3>
      <p class="util-desc">addDays / diffDays / startOfWeek / humanDuration / countdownParts / weekdayCN。</p>
      <div class="util-metrics">
        <el-tag>今天 {{ todayText }} {{ weekdayCN(today) }}</el-tag>
        <el-tag type="info">本周起始 {{ startOfWeekText }}</el-tag>
        <el-tag type="success">+30 天 {{ plus30Text }}（差 {{ diffDays(new Date(), today) }} 天）</el-tag>
      </div>
      <div class="util-metrics">
        <el-tag type="warning">humanDuration({{ durationMs }}) → {{ humanText }}</el-tag>
        <el-button size="small" @click="durationMs = Math.round(Math.random() * 90000000)">换一个</el-button>
        <el-tag>countdownParts → {{ countdownText }}</el-tag>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted } from 'vue'
import {
  addDays, camelize, clamp, countBy, createPriorityQueue, createQueue,
  createRateLimiter, createRingBuffer, debounce, deepClone, diffDays, formatBytes,
  formatDate, formatNumber, formatSigned, hexToRgb, humanDuration,
  isEmail, isIdCardCN, isPhoneCN, isUrl, lighten, darken, mean, median, moveItem,
  partition, passwordStrength, percentile, pipe, randomId, randomInt, readableTextOn,
  rgbToHex, slugify, startOfWeek, stdDev, throttle, times, toNumber, uniqueBy, weekdayCN,
} from '../utils'
import { useNow } from '../composables'

/* —— debounce —— */
const debounceInput = ref('')
const debounceRaw = ref(0)
const debounceHit = ref(0)
const debounced = debounce(() => { debounceHit.value += 1 }, 400)
const onDebounceInput = (v) => {
  debounceRaw.value += 1
  debounced(v)
}

/* —— throttle —— */
const throttleRaw = ref(0)
const throttleHit = ref(0)
const throttled = throttle(() => { throttleHit.value += 1 }, 300)
const onThrottleClick = () => {
  throttleRaw.value += 1
  throttled()
}

/* —— deepClone —— */
const cloneJson = ref('{ "name": "vue-app", "tags": ["a", "b"], "meta": { "ver": 1 } }')
const cloneResult = ref('')
const runClone = () => {
  try {
    const origin = JSON.parse(cloneJson.value)
    const copy = deepClone(origin)
    copy.meta.ver = 999
    copy.tags.push('new')
    cloneResult.value = JSON.stringify(origin)
  } catch (e) {
    cloneResult.value = `JSON 解析失败：${e.message}`
  }
}

/* —— 字符串与格式化 —— */
const strInput = ref('user-name-list')
const camelizeOut = computed(() => camelize(strInput.value))
const slugifyOut = computed(() => slugify(strInput.value))
const bytesInput = ref(1536000)
const bytesOut = computed(() => formatBytes(bytesInput.value))
const { now } = useNow(1000)
const nowText = computed(() => formatDate(now.value))
onUnmounted(() => debounced.cancel())

/* —— clamp / randomId / uniqueBy —— */
const clampVal = ref(50)
const clampedOut = computed(() => clamp(clampVal.value, 20, 80))
const lastId = ref('')
const genId = () => { lastId.value = randomId('v') }
const rawList = ref([{ id: 1, type: 'a' }, { id: 2, type: 'b' }, { id: 3, type: 'a' }])
const uniqueOut = computed(() => uniqueBy(rawList.value, 'type'))

/* —— 函数组合 —— */
const pipeInput = ref('12_345.6')
const pipeOut = computed(() => pipe(
  (s) => String(s).replace(/[,_\s]/g, ''),
  (s) => toNumber(s, 0),
  (n) => formatNumber(n, 1),
)(pipeInput.value))
const squares = times(6, (i) => i * i)

/* —— 数组进阶 —— */
const orderRows = ref(['设计', '开发', '测试', '发布'])
const rotateOrder = () => { orderRows.value = moveItem(orderRows.value, 0, orderRows.value.length - 1) }
const partitionOut = computed(() => {
  const [even, odd] = partition([1, 2, 3, 4, 5, 6, 7, 8], (n) => n % 2 === 0)
  return { even, odd }
})
const countByOut = computed(() => countBy(rawList.value, 'type'))

/* —— 数值统计 —— */
const SAMPLE = [88, 92, 79, 95, 61, 84, 90, 73, 99, 68]
const stats = computed(() => ({
  mean: formatNumber(mean(SAMPLE), 1),
  median: median(SAMPLE),
  stdDev: formatNumber(stdDev(SAMPLE), 2),
  p90: percentile(SAMPLE, 90),
}))
const delta = ref(1234)
const signedOut = computed(() => formatSigned(delta.value))

/* —— 校验 —— */
const validInput = ref('zhang.san@example.com')
const checks = computed(() => ({
  email: isEmail(validInput.value),
  phone: isPhoneCN(validInput.value),
  idCard: isIdCardCN(validInput.value),
  url: isUrl(validInput.value),
}))
const strength = computed(() => passwordStrength(validInput.value))

/* —— 颜色 —— */
const BASE_HEX = '#42b883'
const colorScale = computed(() => [
  { label: 'darken 24%', hex: darken(BASE_HEX, 0.24), text: readableTextOn(darken(BASE_HEX, 0.24)) },
  { label: '主色', hex: BASE_HEX, text: readableTextOn(BASE_HEX) },
  { label: 'lighten 30%', hex: lighten(BASE_HEX, 0.3), text: readableTextOn(lighten(BASE_HEX, 0.3)) },
  { label: 'lighten 66%', hex: lighten(BASE_HEX, 0.66), text: readableTextOn(lighten(BASE_HEX, 0.66)) },
].map((c) => ({ ...c, hex: c.hex.toUpperCase() })))
const rgbText = computed(() => {
  const c = hexToRgb(BASE_HEX)
  return `rgb(${c.r}, ${c.g}, ${c.b}) = ${rgbToHex(c)}`
})

/* —— 数据结构 —— */
const queue = createQueue()
const queueSize = ref(0)
const queueItems = ref([])
const syncQueue = () => { queueSize.value = queue.size; queueItems.value = queue.toArray() }
let seq = 0
const pushQueue = () => { queue.enqueue(`T${++seq}`); syncQueue() }
const popQueue = () => { queue.dequeue(); syncQueue() }

const heap = createPriorityQueue((a, b) => a - b)
const heapOut = ref(null)
const pushHeap = () => { heap.push(randomInt(1, 99)); heapOut.value = null }
const popHeap = () => { heapOut.value = heap.pop() ?? '（空）' }

const limiter = createRateLimiter({ limit: 3, interval: 1000 })
const limitOk = ref(false)
const limitLeft = ref(3)
const tryTake = () => {
  limitOk.value = limiter.tryTake()
  limitLeft.value = limiter.remaining
}

const ring = ref([])
const ringBuf = createRingBuffer(5)
const ringTimer = setInterval(() => {
  ringBuf.push(randomInt(10, 99))
  ring.value = ringBuf.toArray()
}, 1200)
onUnmounted(() => clearInterval(ringTimer))

/* —— 时间 —— */
const today = new Date()
const todayText = computed(() => formatDate(now.value, 'YYYY-MM-DD'))
const startOfWeekText = computed(() => formatDate(startOfWeek(now.value), 'YYYY-MM-DD'))
const plus30Text = computed(() => formatDate(addDays(now.value, 30), 'YYYY-MM-DD'))
const durationMs = ref(5430000)
const humanText = computed(() => humanDuration(durationMs.value))
const countdownText = computed(() => {
  const p = humanDuration(durationMs.value)
  const sec = Math.floor(durationMs.value / 1000)
  return `${Math.floor(sec / 86400)}天 ${Math.floor((sec % 86400) / 3600)}时 ${Math.floor((sec % 3600) / 60)}分 · ${p}`
})
</script>

<style scoped>
.utils-page { padding: 20px 24px 40px; }
.util-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px 18px;
  margin-bottom: 14px;
  background: #fff;
}
.util-card h3 { margin: 0 0 4px; font-size: 15px; color: #303133; }
.util-desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; }
.util-metrics { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.badge {
  margin-left: 6px;
  font-size: 10px;
  font-weight: 600;
  color: #42b883;
  background: #eefaf3;
  border-radius: 999px;
  padding: 1px 7px;
  vertical-align: 1px;
}
.color-row { display: flex; gap: 10px; flex-wrap: wrap; }
.color-swatch {
  flex: 1 1 120px;
  border-radius: 10px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.color-swatch b { font-size: 13px; }
.color-swatch em {
  font-style: normal;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, ui-monospace, monospace;
  opacity: 0.85;
}
</style>
