<!-- ============================================================
     CardContainer.vue · 默认插槽
     ============================================================ -->
<template>
  <div class="s-card">
    <div v-if="title" class="s-card__title">{{ title }}</div>
    <div class="s-card__body">
      <slot>
        <el-empty description="（默认占位：未提供 slot 内容）" :image-size="50" />
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({ title: { type: String, default: '' } })
</script>

<style scoped>
.s-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.s-card__title {
  padding: 10px 16px;
  font-weight: 600;
  background: linear-gradient(90deg, #ecf5ff, #fff);
  border-bottom: 1px solid #ebeef5;
}
.s-card__body { padding: 14px 16px; }
</style>
