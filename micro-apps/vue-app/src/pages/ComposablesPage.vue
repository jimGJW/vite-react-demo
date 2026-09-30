<template>
  <div class="composables-page">
    <header class="page-header-vue">
      <h1>组合式函数 Composables</h1>
      <p>Vue 官方逻辑复用方案：ref + computed + 生命周期自动清理（对比 React Hooks 的另一种思路）</p>
    </header>

    <!-- useCounter -->
    <section class="util-card">
      <h3>useCounter</h3>
      <p class="util-desc">带 min/max 边界与步进的计数器，边界时按钮自动禁用（computed 派生）。</p>
      <el-button :disabled="atMin" @click="dec">-</el-button>
      <el-tag size="large" style="margin: 0 10px">{{ count }}</el-tag>
      <el-button :disabled="atMax" type="primary" @click="inc">+</el-button>
      <el-button text @click="reset">重置</el-button>
    </section>

    <!-- useToggle -->
    <section class="util-card">
      <h3>useToggle</h3>
      <p class="util-desc">布尔开关，可直接设值也可翻转。</p>
      <el-switch v-model="on" active-text="开" inactive-text="关" />
      <el-button size="small" style="margin-left: 12px" @click="toggle(!on)">强制{{ on ? '关闭' : '开启' }}</el-button>
    </section>

    <!-- useLocalStorage -->
    <section class="util-card">
      <h3>useLocalStorage</h3>
      <p class="util-desc">watch 深度监听自动持久化，刷新页面（或重启子应用）后仍在。</p>
      <el-input v-model="state" placeholder="写入即持久化" clearable style="max-width: 320px" />
      <el-button size="small" style="margin-left: 12px" @click="remove">清除</el-button>
      <div class="util-metrics"><el-tag type="info">localStorage['vue-demo-note'] = {{ JSON.stringify(state) }}</el-tag></div>
    </section>

    <!-- useMouse -->
    <section class="util-card">
      <h3>useMouse</h3>
      <p class="util-desc">全局 mousemove 追踪，onUnmounted 自动移除监听（对比 React useEffect cleanup）。</p>
      <div class="mouse-pad">
        <el-tag effect="dark" type="success">x: {{ x }}, y: {{ y }}</el-tag>
      </div>
    </section>

    <!-- useNow -->
    <section class="util-card">
      <h3>useNow</h3>
      <p class="util-desc">每秒 tick 的响应式时钟，卸载自动 clearInterval。</p>
      <div class="clock">{{ nowText }}</div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCounter, useLocalStorage, useMouse, useNow, useToggle } from '../composables'
import { formatDate } from '../utils'

const { count, inc, dec, reset, atMax, atMin } = useCounter(10, { min: 0, max: 20 })
const { on, toggle } = useToggle(true)
const { state, remove } = useLocalStorage('vue-demo-note', '我在 localStorage 里')
const { x, y } = useMouse()
const { now } = useNow(1000)
const nowText = computed(() => formatDate(now.value, 'HH:mm:ss'))
</script>

<style scoped>
.composables-page { padding: 20px 24px 40px; }
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
.mouse-pad {
  height: 90px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
.clock {
  font-variant-numeric: tabular-nums;
  font-size: 30px;
  font-weight: 700;
  color: #42b883;
  letter-spacing: 2px;
}
</style>
