<template>
  <div class="kit-page">
    <header class="page-header-vue">
      <h1>自有组件库 · Kit</h1>
      <p>
        {{ COMPONENT_REGISTRY.length }} 个零依赖组件（m- 前缀）——与 Element Plus 互补，
        补 EP 不便自定义的部分：图表 / 签名板 / 虚拟滚动 / 下拉刷新 / 拖拽排序等
      </p>
    </header>

    <!-- 组件目录 -->
    <section class="kit-card">
      <h3>组件目录</h3>
      <div class="kit-registry">
        <div v-for="c in COMPONENT_REGISTRY" :key="c.name" class="kit-registry__item">
          <code class="kit-registry__name">&lt;{{ c.name }} /&gt;</code>
          <span class="kit-registry__label">{{ c.label }}</span>
          <span class="kit-registry__desc">{{ c.desc }}</span>
        </div>
      </div>
    </section>

    <!-- 指标卡 -->
    <section class="kit-card">
      <h3>MStatCard 指标卡</h3>
      <p class="kit-desc">主数值 + 单位 + 环比趋势（涨红跌绿）+ 迷你走势，dashboard 头图必备。</p>
      <div class="kit-grid3">
        <MStatCard
          title="今日活跃用户" :value="12840" unit="人" badge="实时" :trend="8.6" tone="primary"
          :spark="sparkA"
        />
        <MStatCard
          title="接口平均耗时" :value="186" unit="ms" :trend="-12.4" tone="ok"
          :spark="sparkB"
        />
        <MStatCard
          title="待处理告警" :value="7" unit="条" badge="P1" :trend="3.1" tone="danger"
          :spark="sparkC" :digits="0"
        />
      </div>
    </section>

    <!-- 图表 -->
    <section class="kit-card">
      <h3>MChart 纯 SVG 图表</h3>
      <p class="kit-desc">折线 / 面积 / 柱状 / 环形 / 迷你走势，全部零依赖、可主题化。</p>
      <div class="kit-grid2">
        <div class="kit-panel">
          <div class="kit-panel__title">面积图 · 7 日请求量</div>
          <MChart type="area" :data="week" :labels="weekLabels" :height="130" color="#409eff" />
        </div>
        <div class="kit-panel">
          <div class="kit-panel__title">柱状图 · 各框架占比</div>
          <MChart type="bar" :data="[38, 32, 18, 12]" :labels="['Vue', 'React', 'Angular', '其它']" :height="130" color="#67c23a" />
        </div>
        <div class="kit-panel">
          <div class="kit-panel__title">环形图 · 流量来源</div>
          <MChart
            type="donut"
            :data="[
              { label: '自然搜索', value: 46, color: '#409eff' },
              { label: '直接访问', value: 28, color: '#67c23a' },
              { label: '外部链接', value: 18, color: '#e6a23c' },
              { label: '其它', value: 8, color: '#909399' },
            ]"
            center-text="46%"
            center-sub="自然搜索"
          />
        </div>
        <div class="kit-panel">
          <div class="kit-panel__title">实时流（每 1.5s 推一点）</div>
          <MChart type="line" :data="streamPoints" :height="130" color="#f56c6c" :show-grid="false" />
          <div class="kit-row">
            <button class="m-btn m-btn--primary" type="button" @click="toggleStream">
              {{ streamRunning ? '停止' : '开始' }}
            </button>
            <span class="m-chip m-chip--info">样本 {{ streamPoints.length }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 进度环 + 倒计时 -->
    <section class="kit-card">
      <h3>ProgressRing + Countdown</h3>
      <p class="kit-desc">环形进度 + 倒计时联动，剩余不足 20% 自动转红。</p>
      <div class="kit-grid2">
        <div class="kit-panel">
          <div class="kit-panel__title">静态进度环</div>
          <div class="kit-row">
            <ProgressRing :percent="72" :size="88" tone="primary" />
            <ProgressRing :percent="45" :size="88" tone="warn" />
            <ProgressRing :percent="93" :size="88" tone="ok" />
            <ProgressRing :percent="18" :size="88" tone="danger" />
          </div>
        </div>
        <div class="kit-panel">
          <div class="kit-panel__title">倒计时（点击开始）</div>
          <Countdown :seconds="45" @finish="toast.success('倒计时结束！')" />
        </div>
      </div>
    </section>

    <!-- 跑马灯 + 省略 + 时间轴 -->
    <section class="kit-card">
      <h3>Marquee / Ellipsis / Timeline</h3>
      <div class="kit-grid2">
        <div class="kit-panel">
          <div class="kit-panel__title">跑马灯（hover 暂停）</div>
          <Marquee :items="noticeList" :speed="26" />
          <div class="kit-panel__title" style="margin-top: 12px">竖向跑马灯</div>
          <Marquee :items="noticeList" :speed="16" vertical />
        </div>
        <div class="kit-panel">
          <div class="kit-panel__title">多行省略（默认 2 行）</div>
          <Ellipsis :text="longText" :lines="2" />
          <div class="kit-panel__title" style="margin-top: 12px">时间轴</div>
          <Timeline :nodes="tlNodes" />
        </div>
      </div>
    </section>

    <!-- 标签输入 + 异步选择器 -->
    <section class="kit-card">
      <h3>TagInput / AsyncSelect</h3>
      <div class="kit-grid2">
        <div class="kit-panel">
          <div class="kit-panel__title">标签输入（回车 / 逗号 / 退格）</div>
          <TagInput v-model="tags" :max="6" />
        </div>
        <div class="kit-panel">
          <div class="kit-panel__title">异步选择器（防抖 400ms + 键盘上下选择）</div>
          <AsyncSelect v-model="picked" :fetcher="fetchFrameworks" placeholder="搜索前端框架" />
          <div class="kit-row">
            <span class="m-chip m-chip--ok">选中：{{ picked || '（未选）' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 虚拟滚动 + 触底加载 -->
    <section class="kit-card">
      <h3>VirtualList / InfiniteScroll</h3>
      <div class="kit-grid2">
        <div class="kit-panel">
          <div class="kit-panel__title">虚拟滚动（10000 行）</div>
          <VirtualList :items="bigList" :height="240" />
        </div>
        <div class="kit-panel">
          <div class="kit-panel__title">触底加载（每页 20 条，共 100 条）</div>
          <InfiniteScroll :height="240" :load-more="loadPage" />
        </div>
      </div>
    </section>

    <!-- 下拉刷新 + 拖拽排序 + 签名板 -->
    <section class="kit-card">
      <h3>PullRefresh / DraggableList / SignaturePad</h3>
      <div class="kit-grid2">
        <div class="kit-panel">
          <div class="kit-panel__title">下拉刷新（鼠标按住内容往下拖）</div>
          <PullRefresh @refresh="onRefresh">
            <div class="kit-row">
              <span class="m-chip m-chip--info">刷新次数 {{ refreshCount }}</span>
              <span class="m-chip">最后刷新 {{ lastRefresh }}</span>
            </div>
            <p class="kit-desc" style="margin-top: 8px">按住下面的卡片向下拖动超过 56px，松手即触发刷新回调。</p>
          </PullRefresh>
        </div>
        <div class="kit-panel">
          <div class="kit-panel__title">拖拽排序（拖动整行）</div>
          <DraggableList v-model="ordered" />
          <div class="kit-row">
            <span class="m-chip m-chip--ok">当前顺序：{{ ordered.map((o) => o.text).join(' → ') }}</span>
          </div>
        </div>
      </div>
      <div class="kit-panel" style="margin-top: 12px">
        <div class="kit-panel__title">签名板（Canvas + 导出 PNG）</div>
        <SignaturePad file-name="vue-app-signature.png" />
      </div>
    </section>

    <!-- 轻量 toast -->
    <section class="kit-card">
      <h3>useToast 轻量提示</h3>
      <p class="kit-desc">不依赖 Element Plus 的队列式提示，子应用可整体搬走。</p>
      <div class="kit-row">
        <button class="m-btn" type="button" @click="toast.info('这是一条普通提示')">info</button>
        <button class="m-btn" type="button" @click="toast.success('操作成功')">success</button>
        <button class="m-btn" type="button" @click="toast.warn('请注意检查输入')">warn</button>
        <button class="m-btn" type="button" @click="toast.error('请求失败，请重试')">error</button>
      </div>
      <ul class="kit-toasts">
        <li v-for="t in toast.items.value" :key="t.id" class="m-chip" :class="`m-chip--${toastTone(t.type)}`">
          {{ t.text }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import {
  MStatCard, MChart, ProgressRing, Countdown, Marquee, Ellipsis,
  Timeline, TagInput, AsyncSelect, VirtualList, InfiniteScroll,
  PullRefresh, DraggableList, SignaturePad, COMPONENT_REGISTRY,
} from '../components'
import { useStream, useToast } from '../composables'
import { formatDate, range } from '../utils'

/* —— 指标卡迷你走势 —— */
const sparkA = [12, 18, 15, 22, 26, 24, 31, 36]
const sparkB = [42, 39, 36, 33, 30, 28, 24, 22]
const sparkC = [2, 3, 3, 4, 5, 6, 6, 7]

/* —— 图表数据 —— */
const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const week = [320, 452, 380, 510, 610, 720, 688]

/* —— 实时流 —— */
const { points: streamPoints, push: pushPoint, start: startStream, stop: stopStream } = useStream(24)
const streamRunning = ref(false)
const toggleStream = () => {
  if (streamRunning.value) {
    stopStream()
    streamRunning.value = false
  } else {
    pushPoint(50)
    startStream(() => 30 + Math.round(Math.random() * 50), 1500)
    streamRunning.value = true
  }
}
onUnmounted(() => stopStream())

/* —— toast —— */
const toast = useToast(2600)
const toastTone = (type) => ({ info: 'info', success: 'ok', warn: 'warn', error: 'danger' }[type] || '')

/* —— 跑马灯 / 省略 / 时间轴 —— */
const noticeList = [
  'Vue 3.5 已支持 defineModel 正式版',
  'Element Plus 样式变量统一走 --el-* token',
  'qiankun 子应用必须导出 bootstrap/mount/unmount',
  '虚拟滚动是万级列表的唯一正解',
]
const longText = '这是一段用来演示多行省略的长文本。组件会真实测量截断高度与完整高度，只有确实被省略时才会渲染「展开」按钮——避免出现「文字本来就不长却显示展开」的假交互，这也是很多列表组件容易忽略的细节。'
const tlNodes = [
  { title: '提交申请', time: '09-28 10:12', desc: '由 gujiawei 发起', tone: 'ok' },
  { title: '部门审批', time: '09-29 14:03', desc: '审批通过，进入风控复核', tone: 'ok' },
  { title: '风控复核', time: '09-30 09:41', desc: '发现 1 项资料缺失，已退回补充', tone: 'warn' },
  { title: '待处理', time: '', desc: '等待申请人重新提交', tone: 'danger' },
]

/* —— 标签 / 异步选择 —— */
const tags = ref(['前端', '微前端'])
const picked = ref('')
const FRAMEWORKS = [
  { value: 'vue', label: 'Vue 3', desc: 'SFC + Composition API' },
  { value: 'react', label: 'React 19', desc: 'Hooks + Compiler' },
  { value: 'angular', label: 'Angular 22', desc: 'Standalone + Signals' },
  { value: 'svelte', label: 'Svelte 5', desc: 'Runes' },
  { value: 'solid', label: 'SolidJS', desc: '细粒度响应式' },
  { value: 'qwik', label: 'Qwik', desc: '可恢复性' },
]
const fetchFrameworks = async (kw) => {
  await new Promise((r) => setTimeout(r, 300))
  const lower = String(kw || '').trim().toLowerCase()
  if (!lower || lower === 'js' || lower === '前端') return FRAMEWORKS
  return FRAMEWORKS.filter((f) => f.label.toLowerCase().includes(lower) || f.desc.includes(kw))
}

/* —— 虚拟滚动 —— */
const bigList = range(10000).map((i) => ({ text: `虚拟行数据 #${i + 1} · ${['高优先级', '普通', '低优先级'][i % 3]}` }))

/* —— 触底加载 —— */
const loadPage = async (page) => {
  await new Promise((r) => setTimeout(r, 420))
  const total = 100
  const size = 20
  const start = (page - 1) * size
  if (start >= total) return { items: [], finished: true }
  const items = range(Math.min(size, total - start)).map((i) => ({
    text: `第 ${start + i + 1} 条数据 · 批次 ${page}`,
  }))
  return { items, finished: start + items.length >= total }
}

/* —— 下拉刷新 —— */
const refreshCount = ref(0)
const lastRefresh = ref('—')
const onRefresh = (done) => {
  setTimeout(() => {
    refreshCount.value += 1
    lastRefresh.value = formatDate(new Date(), 'HH:mm:ss')
    toast.success('刷新完成')
    done()
  }, 800)
}

/* —— 拖拽排序 —— */
const ordered = ref([
  { id: 'a', text: '工作台' },
  { id: 'b', text: '监控大盘' },
  { id: 'c', text: '配置中心' },
  { id: 'd', text: '报表中心' },
])

const kitCount = computed(() => COMPONENT_REGISTRY.length)
</script>

<style scoped>
.kit-page { padding: 20px 24px 44px; }
.kit-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.kit-card h3 { margin: 0 0 4px; font-size: 15px; color: #303133; }
.kit-desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.7; }
.kit-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
.kit-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
.kit-panel { border: 1px solid #f0f2f5; border-radius: 8px; padding: 12px; background: #fcfdff; }
.kit-panel__title { font-size: 12.5px; font-weight: 600; color: #606266; margin-bottom: 8px; }
.kit-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

.kit-registry { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px; }
.kit-registry__item {
  display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
  border: 1px solid #f0f2f5; border-radius: 7px; padding: 7px 10px; background: #fcfdff;
}
.kit-registry__name { font-size: 12px; color: #409eff; font-family: 'SF Mono', Monaco, monospace; }
.kit-registry__label { font-size: 12.5px; color: #303133; font-weight: 600; }
.kit-registry__desc { font-size: 11.5px; color: #909399; flex-basis: 100%; }

.kit-toasts { list-style: none; margin: 10px 0 0; padding: 0; display: flex; gap: 6px; flex-wrap: wrap; }
</style>
