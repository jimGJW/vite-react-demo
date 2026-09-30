<template>
  <!-- 倒计时：剩余时间分片展示 + 进度环，可开始/暂停/重置 -->
  <div class="m-countdown">
    <ProgressRing :percent="percent" :size="86" :stroke="8" :tone="ringTone">
      <template #default>
        <span class="m-countdown__text">{{ mm }}</span>
        <span class="m-countdown__sep">:</span>
        <span class="m-countdown__text">{{ ss }}</span>
      </template>
    </ProgressRing>

    <div class="m-countdown__body">
      <div class="m-row">
        <button class="m-btn m-btn--primary" type="button" @click="running ? stop() : start()">
          {{ running ? '暂停' : (remain === 0 ? '已完成' : '开始') }}
        </button>
        <button class="m-btn" type="button" @click="reset(total)">重置</button>
        <button class="m-btn" type="button" :disabled="total <= 10" @click="bump(-10)">-10s</button>
        <button class="m-btn" type="button" @click="bump(10)">+10s</button>
      </div>
      <ul class="m-row m-countdown__chips">
        <li class="m-chip" :class="{ 'm-chip--ok': running }">{{ running ? '运行中' : '已暂停' }}</li>
        <li class="m-chip m-chip--info">总时长 {{ total }}s</li>
        <li class="m-chip m-chip--warn">剩余 {{ remain }}s</li>
        <li v-if="finished" class="m-chip m-chip--danger">已完成</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ProgressRing from './ProgressRing.vue'
import { useCountdown } from '../composables'

const props = defineProps({
  seconds: { type: Number, default: 60 },
})
const emit = defineEmits(['finish'])

const { remain, running, start, stop, reset } = useCountdown(props.seconds, {
  onEnd: () => emit('finish'),
})

const total = computed(() => Math.max(props.seconds, remain.value))
const percent = computed(() => (total.value ? Math.round((remain.value / total.value) * 100) : 0))
/** 剩余 <20% 转红，提示紧迫 */
const ringTone = computed(() => (percent.value <= 20 ? 'danger' : percent.value <= 50 ? 'warn' : 'primary'))
const mm = computed(() => String(Math.floor(remain.value / 60)).padStart(2, '0'))
const ss = computed(() => String(remain.value % 60).padStart(2, '0'))
const finished = computed(() => remain.value === 0)

const bump = (delta) => reset(Math.max(10, remain.value + delta))
</script>

<style scoped>
.m-countdown { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.m-countdown__body { flex: 1; min-width: 220px; }
.m-countdown__text { font-size: 20px; font-weight: 700; fill: #303133; }
.m-countdown__sep { font-size: 16px; fill: #c0c4cc; }
.m-countdown__chips { list-style: none; padding: 0; margin: 10px 0 0; }
</style>
