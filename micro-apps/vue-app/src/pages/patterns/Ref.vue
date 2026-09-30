<!-- ============================================================
     Vue 3 · Ref / DOM + defineExpose 演示
     · 直接 DOM：input ref、scroll 容器
     · 自定义组件命令式 API：VideoPlayer + defineExpose
     ============================================================ -->
<template>
  <div class="v-ref-demo">
    <!-- ① DOM ref -->
    <el-card shadow="never" size="small">
      <template #header>
        <el-tag type="primary" effect="dark">① DOM ref：操作原生 input / div</el-tag>
      </template>

      <div style="display: flex; gap: 8px; margin-bottom: 10px">
        <el-input
          ref="inputRef"
          v-model="inputVal"
          placeholder="点击「聚焦 + 选中」"
          style="flex: 1"
        />
        <el-button type="primary" @click="focusInput">聚焦 + 选中</el-button>
        <el-button @click="reverseText">倒转文字</el-button>
      </div>

      <div ref="scrollBox" class="v-scroll">
        <div v-if="!logs.length" class="empty">
          下方日志区：点击右侧按钮，自动滚动到底部
        </div>
        <div v-for="(l, i) in logs" :key="i" class="v-scroll__item">
          <el-tag size="small" type="primary" effect="plain">#{{ logs.length - i }}</el-tag>
          &nbsp;{{ l }}
        </div>
        <div style="height: 60px" />
      </div>
      <div style="display: flex; gap: 8px; margin-top: 8px">
        <el-button size="small" @click="appendLog">追加（滚到底）</el-button>
        <el-button size="small" @click="logs = []">清空</el-button>
      </div>
    </el-card>

    <!-- ② defineExpose：命令式 API -->
    <el-card shadow="never" size="small" style="margin-top: 12px">
      <template #header>
        <el-tag type="danger" effect="dark">
          ② defineExpose：命令式组件 API
        </el-tag>
      </template>

      <VideoPlayer ref="player" />
      <el-divider style="margin: 12px 0" />
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <el-button type="primary" @click="player?.play()">▶ play()</el-button>
        <el-button @click="player?.pause()">⏸ pause()</el-button>
        <el-button @click="player?.seek(30)">⏭ seek(30s)</el-button>
        <el-button @click="player?.seek(120)">⏩ 跳到结尾</el-button>
        <el-button type="danger" plain @click="player?.reset()">⟲ reset()</el-button>
        <el-button @click="appendLog('getState(): ' + JSON.stringify(player?.getState() ?? {}))">
          getState() → 打印
        </el-button>
      </div>
      <div class="hint">
        父组件无法直接读取子组件内部 setup 返回值；必须通过
        <code> defineExpose </code>显式暴露方法。
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import VideoPlayer from './VideoPlayerChild.vue'

// ① DOM ref
const inputRef  = ref(null)
const scrollBox = ref(null)
const inputVal  = ref('Hello Vue Refs!')
const logs      = ref([])

const focusInput = () => {
  inputRef.value?.focus?.()
  nextTick(() => {
    const el = inputRef.value?.$el?.querySelector?.('input') || inputRef.value?.input || inputRef.value
    el?.select?.()
  })
}
const reverseText = () => {
  inputVal.value = inputVal.value.split('').reverse().join('')
  appendLog(`反转输入框文字 → ${inputVal.value}`)
}
const appendLog = (custom) => {
  const v = custom || `追加日志：${Date.now()}`
  logs.value = [v, ...logs.value].slice(0, 8)
  nextTick(() => {
    scrollBox.value?.scrollTo?.({ top: scrollBox.value?.scrollHeight ?? 0, behavior: 'smooth' })
  })
}

// ② 组件命令式 ref
const player = ref(null)   // 与 <VideoPlayer ref="player" /> 同名即绑定
</script>

<style scoped>
.v-ref-demo { width: 100%; }
.v-scroll {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  height: 160px;
  overflow-y: auto;
  padding: 10px 12px;
  background: #fafbfc;
}
.v-scroll .empty { font-size: 12px; color: #909399; }
.v-scroll__item {
  padding: 4px 0;
  font-size: 13px;
  border-bottom: 1px dashed #ecf0f3;
  &:last-child { border-bottom: none; }
}
.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  line-height: 1.7;
}
.hint code {
  background: #f4f7fb;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
