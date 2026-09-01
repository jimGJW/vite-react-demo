<!-- ============================================================
     FatherChild.vue · 中间层（不声明 props，完全透传）
     ============================================================ -->
<template>
  <el-card size="small" style="margin-top: 10px" shadow="never">
    <template #header>
      <el-tag type="info">第 2 层 · Father（无 props，透传）</el-tag>
    </template>
    <ThemeChild />
  </el-card>
</template>

<script setup>
import ThemeChild from './ThemeChild.vue'
</script>
