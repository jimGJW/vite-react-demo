<!-- ============================================================
     Vue 3 · provide / inject 演示（3 层穿透：GrandPa → Father → Child）
     ============================================================ -->
<template>
  <div class="grandpa" :class="theme.cur">
    <el-card size="small" shadow="never" :body-style="{ padding: '12px 16px' }">
      <template #header>
        <div style="display: flex; align-items: center; gap: 10px">
          <el-tag type="primary" effect="dark">第 1 层 · GrandPa（provide）</el-tag>
          <el-button size="small" type="primary" @click="setTheme">切换主题</el-button>
          <span style="font-size: 12px; color: #909399">
            provide('theme', readonly(reactive)) · provide('setTheme', callback)
          </span>
        </div>
      </template>
      <Father />
    </el-card>
  </div>
</template>

<script setup>
import { provide, reactive, readonly } from 'vue'
import Father from './FatherChild.vue'

const theme = reactive({
  cur: 'light',
  user: { name: 'Alice', role: 'admin' },
})
const setTheme = () => {
  theme.cur = theme.cur === 'light' ? 'dark' : 'light'
}

provide('theme', readonly(theme))
provide('setTheme', setTheme)
</script>

<style scoped>
.grandpa { padding: 4px; border-radius: 8px; }
.grandpa.dark { background: #1f1f1f; }
.grandpa.dark :deep(.el-card) { background: #1f1f1f; color: #eee; border-color: #333; }
.grandpa.dark :deep(.el-card__header) { border-bottom-color: #333; color: #eee; }
</style>
