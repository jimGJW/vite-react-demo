<template>
  <div class="nested">
    <header class="page-header-vue">
      <h1>嵌套路由 / Nested Routes</h1>
      <p>
        父路由 <code>/nested</code> 自带一个 <code>&lt;router-view /&gt;</code>，
        子路由渲染在父组件内部 —— 这正是 qiankun 里「主应用套子应用」的微观版。
      </p>
    </header>

    <section class="nested-card">
      <div class="nested-bar">
        <span class="nested-bar__crumb">
          /nested<template v-if="route.path !== '/nested'">{{ route.path.replace('/nested', '') }}</template>
        </span>
        <router-link to="/nested" class="nested-tab" active-class="is-active" exact-active-class="is-active">
          概览
        </router-link>
        <router-link to="/nested/detail/101" class="nested-tab" active-class="is-active">详情 #101</router-link>
        <router-link to="/nested/detail/102" class="nested-tab" active-class="is-active">详情 #102</router-link>
      </div>

      <!-- 子路由出口：父组件持有，子页面在这里渲染 -->
      <div class="nested-outlet">
        <router-view />
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.nested { padding: 20px 24px 44px; }
.nested-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 14px 16px; background: #fff;
}
.nested-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding-bottom: 10px; margin-bottom: 12px; border-bottom: 1px dashed #ebeef5;
}
.nested-bar__crumb {
  font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
  color: #409eff; background: #f2f8ff; padding: 3px 8px; border-radius: 4px;
}
.nested-tab {
  font-size: 12.5px; color: #606266; text-decoration: none;
  padding: 4px 10px; border-radius: 6px; border: 1px solid #e4e7ed;
}
.nested-tab.is-active { color: #fff; background: #409eff; border-color: #409eff; }
.nested-outlet { min-height: 120px; }
</style>
