<!-- ============================================================
     ThemeChild.vue · 孙组件（直接 inject 消费祖先 provide 的值）
     ============================================================ -->
<template>
  <el-card size="small" shadow="never" type="inner">
    <template #header>
      <div style="display: flex; align-items: center; gap: 8px">
        <el-tag type="success" effect="dark">第 3 层 · Child（inject）</el-tag>
        <span style="font-size: 12px; color: #909399">直接 inject('theme') / inject('setTheme')</span>
      </div>
    </template>

    <div class="row">
      theme：
      <el-tag :type="theme.cur === 'dark' ? 'info' : 'warning'" effect="plain">
        {{ theme.cur }}
      </el-tag>
      &nbsp;&nbsp;用户：
      <el-tag type="primary" effect="plain">{{ theme.user?.name ?? '未登录' }}</el-tag>
      <el-tag size="small" style="margin-left: 4px">role：{{ theme.user?.role }}</el-tag>
    </div>
    <el-button size="small" @click="setTheme" style="margin-top: 10px">
      孙组件触发「切换主题」
    </el-button>
  </el-card>
</template>

<script setup>
import { inject } from 'vue'

const theme    = inject('theme')
const setTheme = inject('setTheme')
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;
  line-height: 1.9;
  gap: 2px;
}
</style>
