<template>
  <div class="patterns-index">
    <header class="page-header-vue">
      <h1>组件通信模式索引</h1>
      <p>6 种 Vue 组件通信模式的独立实现页，与主应用 React 侧的 Compare 系列一一对应</p>
    </header>
    <div class="pattern-grid">
      <router-link v-for="p in patterns" :key="p.path" :to="p.path" class="pattern-card">
        <span class="pattern-card__icon">{{ p.icon }}</span>
        <span class="pattern-card__title">{{ p.title }}</span>
        <span class="pattern-card__desc">{{ p.desc }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
const patterns = [
  { path: '/pattern/parent-child', icon: '↔', title: '父子传值', desc: 'props / emit' },
  { path: '/pattern/two-way', icon: '⇄', title: '双向绑定', desc: 'v-model' },
  { path: '/pattern/provide', icon: '🌐', title: '跨层传值', desc: 'provide / inject' },
  { path: '/pattern/state', icon: '🏬', title: '全局状态', desc: 'provide + reactive' },
  { path: '/pattern/slot', icon: '📦', title: '插槽分发', desc: 'slot / slots' },
  { path: '/pattern/ref', icon: '🎯', title: 'Ref 引用', desc: 'ref / defineExpose' },
]
</script>

<style scoped>
.patterns-index { padding: 20px 24px 40px; }
.pattern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.pattern-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 14px 16px;
  background: #fff;
  text-decoration: none;
  transition: all 0.15s;
}
.pattern-card:hover {
  border-color: #42b883;
  box-shadow: 0 4px 14px rgba(66, 184, 131, 0.18);
  transform: translateY(-2px);
}
.pattern-card__icon { font-size: 20px; }
.pattern-card__title { font-weight: 700; color: #303133; font-size: 14px; }
.pattern-card__desc { color: #909399; font-size: 12.5px; }
</style>
