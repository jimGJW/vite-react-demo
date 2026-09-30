<template>
  <!-- 时间轴：状态色圆点 + 连接线 + 可插槽自定义内容 -->
  <ol class="m-timeline">
    <li
      v-for="(node, i) in nodes"
      :key="node.title + i"
      class="m-timeline__item"
      :class="`m-timeline__item--${node.tone || 'primary'}`"
    >
      <span class="m-timeline__dot">
        <i v-if="node.tone === 'danger'">!</i>
        <i v-else-if="node.tone === 'ok'">✓</i>
      </span>
      <div class="m-timeline__body">
        <div class="m-timeline__head">
          <strong class="m-timeline__title">{{ node.title }}</strong>
          <time v-if="node.time" class="m-timeline__time">{{ node.time }}</time>
        </div>
        <p v-if="node.desc" class="m-timeline__desc">{{ node.desc }}</p>
        <slot :node="node" :index="i" />
      </div>
    </li>
  </ol>
</template>

<script setup>
defineProps({
  /** nodes: [{ title, desc?, time?, tone?: primary|ok|warn|danger }] */
  nodes: { type: Array, default: () => [] },
})
</script>

<style scoped>
.m-timeline { list-style: none; margin: 0; padding: 4px 0; }
.m-timeline__item { position: relative; padding: 0 0 16px 22px; }
.m-timeline__item::before {
  content: '';
  position: absolute; left: 5px; top: 14px; bottom: -2px; width: 1px;
  background: #e4e7ed;
}
.m-timeline__item:last-child::before { display: none; }
.m-timeline__dot {
  position: absolute; left: 0; top: 4px;
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--tl, #409eff);
  box-shadow: 0 0 0 3px var(--tl-soft, #ecf5ff);
  display: flex; align-items: center; justify-content: center;
}
.m-timeline__dot i { font-style: normal; font-size: 8px; color: #fff; }
.m-timeline__item--primary { --tl: #409eff; --tl-soft: #ecf5ff; }
.m-timeline__item--ok { --tl: #67c23a; --tl-soft: #f0f9eb; }
.m-timeline__item--warn { --tl: #e6a23c; --tl-soft: #fdf6ec; }
.m-timeline__item--danger { --tl: #f56c6c; --tl-soft: #fef0f0; }

.m-timeline__head { display: flex; align-items: baseline; gap: 8px; }
.m-timeline__title { font-size: 13.5px; color: #303133; }
.m-timeline__time { font-size: 11.5px; color: #c0c4cc; margin-left: auto; }
.m-timeline__desc { margin: 3px 0 0; font-size: 12.5px; color: #909399; line-height: 1.6; }
</style>
