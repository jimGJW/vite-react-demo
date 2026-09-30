<!-- ============================================================
     VideoPlayerChild.vue · 命令式 API 组件（defineExpose 暴露 play/pause/...）
     ============================================================ -->
<template>
  <div class="vp">
    <div class="vp__screen">
      <div class="vp__title">{{ title }}</div>
      <el-progress
        type="circle"
        :percentage="pct"
        :width="120"
        :stroke-width="8"
        :format="() => `${time}s / ${duration}s`"
      >
        <template v-if="playing">
          <el-icon class="is-loading" :size="20"><Loading /></el-icon>
        </template>
      </el-progress>
    </div>
    <div class="vp__bar">
      <el-tag :type="playing ? 'success' : 'info'" effect="plain">
        {{ playing ? '▶ 播放中' : '⏸ 已暂停' }}
      </el-tag>
      <el-progress :percentage="pct" :show-text="false" style="flex: 1; margin-left: 12px" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, reactive, toRefs, computed, ref as _ref } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  title:    { type: String, default: '影片「React vs Vue」' },
  duration: { type: Number, default: 120 },
})

const state = reactive({
  playing: false,
  time:    0,
})
const { playing, time } = toRefs(state)
let timer = null

const stopTimer = () => {
  if (timer) { clearInterval(timer); timer = null }
}
const pct = computed(() => Math.round((state.time / props.duration) * 100))

defineExpose({
  play() {
    if (state.playing || state.time >= props.duration) return
    state.playing = true
    stopTimer()
    timer = setInterval(() => {
      if (state.time >= props.duration) {
        state.playing = false
        stopTimer()
        return
      }
      state.time = Math.min(props.duration, state.time + 1)
    }, 200)
  },
  pause() {
    state.playing = false
    stopTimer()
  },
  seek(sec) {
    state.time = Math.max(0, Math.min(props.duration, sec))
  },
  reset() {
    stopTimer()
    state.playing = false
    state.time = 0
  },
  getState() {
    return { playing: state.playing, time: state.time, duration: props.duration }
  },
})

onBeforeUnmount(() => stopTimer())
</script>

<style scoped>
.vp {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(180deg, #f5f7fa 0%, #fff 60%);
}
.vp__screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 0 10px;
  gap: 10px;
  background: radial-gradient(circle at 50% 0, #eaf3ff 0%, transparent 60%);
}
.vp__title { font-weight: 600; color: #303133; }
.vp__bar {
  display: flex;
  align-items: center;
  padding: 8px 14px 12px;
  background: #fafbfc;
  border-top: 1px solid #ebeef5;
}
</style>
