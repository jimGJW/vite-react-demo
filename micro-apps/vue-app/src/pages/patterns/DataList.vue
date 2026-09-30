<!-- ============================================================
     DataList.vue · 作用域插槽（把 row/index 暴露给父）
     ============================================================ -->
<template>
  <div class="dl">
    <div v-if="!data?.length" class="dl-empty">{{ empty }}</div>
    <ul v-else class="dl-list">
      <li v-for="(row, index) in data" :key="String(row.id || index)" class="dl-item">
        <slot :row="row" :index="index">
          <!-- fallback：默认渲染方式 -->
          <div style="font-size: 13px">#{{ index + 1 }} {{ JSON.stringify(row) }}</div>
        </slot>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  data:  { type: Array,  default: () => [] },
  empty: { type: String, default: '暂无数据' },
})
</script>

<style scoped>
.dl {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.dl-empty { padding: 20px; text-align: center; color: #909399; font-size: 12px; }
.dl-list { list-style: none; padding: 0; margin: 0; }
.dl-item {
  padding: 8px 14px;
  border-bottom: 1px solid #f0f2f5;
  &:last-child { border-bottom: none; }
}
</style>
