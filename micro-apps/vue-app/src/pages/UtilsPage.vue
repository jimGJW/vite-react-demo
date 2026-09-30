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
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import {
  camelize, clamp, debounce, deepClone, formatBytes,
  formatDate, randomId, slugify, throttle, uniqueBy,
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
</style>
