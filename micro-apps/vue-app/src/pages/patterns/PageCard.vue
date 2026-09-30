<!-- ============================================================
     PageCard.vue · 命名插槽 + 作用域插槽（footer 带数据暴露）
     Slots：
       #header                      命名头（左右两栏）
       #default                     正文
       #footer="{ c, s, v }"        底部，把统计数据暴露给父
     ============================================================ -->
<template>
  <div class="spc">
    <div class="spc__head">
      <slot name="header" />
    </div>
    <div class="spc__body">
      <slot />
    </div>
    <div class="spc__foot">
      <slot
        name="footer"
        :commentCount="commentCount"
        :shareCount="shareCount"
        :viewCount="viewCount"
      >
        <!-- fallback 默认 footer -->
        <span style="color:#c0c4cc; font-size:12px">（footer 插槽未传，显示默认底部）</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  commentCount: { type: Number, default: 128 },
  shareCount:   { type: Number, default: 54 },
  viewCount:    { type: Number, default: 2300 },
})
</script>

<style scoped>
.spc {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.spc__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #f5f7fa, #fff);
  border-bottom: 1px solid #ebeef5;
}
.spc__body { padding: 14px 16px; }
.spc__foot {
  padding: 10px 16px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #606266;
  background: #fafbfc;
}
</style>
