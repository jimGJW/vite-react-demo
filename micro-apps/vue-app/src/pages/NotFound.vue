<template>
  <div class="nf">
    <div class="nf__code">404</div>
    <h1 class="nf__title">页面不存在</h1>
    <p class="nf__desc">
      子应用路由未匹配到 <code>{{ path }}</code>。
      这通常说明主应用侧边栏菜单的 path 与子应用 routes 不一致（典型：写成 <code>/micro-vue</code>
      而不是子应用内部的 <code>/kit</code>）。
    </p>

    <div class="nf__panel">
      <div class="nf__panel-title">已注册路由（{{ available.length }} 条）</div>
      <div class="nf__chips">
        <button
          v-for="r in available" :key="r.path" type="button"
          class="nf__chip" :class="{ 'is-active': r.path === path }"
          @click="go(r.path)"
        >{{ r.path }}</button>
      </div>
    </div>

    <div class="nf__actions">
      <el-button type="primary" @click="go('/')">回到首页（组件库展示）</el-button>
      <el-button @click="go(-1)">返回上一页</el-button>
    </div>

    <div class="nf__panel">
      <div class="nf__panel-title">最近路由跳转轨迹（守卫记录）</div>
      <ul class="nf__log">
        <li v-for="(l, i) in routeLog" :key="i">
          <span class="nf__log-path">{{ l.path }}</span>
          <span class="nf__log-at">{{ formatDate(l.at, 'HH:mm:ss') }}</span>
        </li>
        <li v-if="!routeLog.length" class="nf__log-empty">暂无记录</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { routes, routeLog } from '../router'
import { formatDate } from '../utils'

const route = useRoute()
const router = useRouter()

const path = computed(() => route.fullPath)
const available = computed(() => routes
  .filter((r) => !r.meta?.hidden)
  .map((r) => ({ path: r.path })))

const go = (target) => {
  if (typeof target === 'number') router.go(target)
  else router.push(target)
}
</script>

<style scoped>
.nf { padding: 40px 24px 60px; max-width: 720px; }
.nf__code {
  font-size: 72px; font-weight: 800; line-height: 1;
  background: linear-gradient(135deg, #409eff, #8e44ad);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.nf__title { margin: 6px 0 8px; font-size: 20px; color: #303133; }
.nf__desc { margin: 0 0 18px; font-size: 13px; color: #909399; line-height: 1.9; }
.nf__desc code {
  font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
  background: #f4f4f5; color: #409eff; padding: 1px 5px; border-radius: 3px;
}
.nf__panel {
  border: 1px solid #e4e7ed; border-radius: 10px; padding: 14px 16px;
  background: #fff; margin-bottom: 14px;
}
.nf__panel-title { font-size: 12.5px; font-weight: 600; color: #606266; margin-bottom: 10px; }
.nf__chips { display: flex; gap: 6px; flex-wrap: wrap; }
.nf__chip {
  border: 1px solid #dcdfe6; border-radius: 999px; background: #fff;
  padding: 3px 12px; font-size: 12px; color: #606266; cursor: pointer;
  font-family: 'SF Mono', Monaco, monospace;
}
.nf__chip:hover { border-color: #409eff; color: #409eff; }
.nf__chip.is-active { background: #ecf5ff; border-color: #409eff; color: #409eff; }
.nf__actions { display: flex; gap: 10px; margin-bottom: 18px; }
.nf__log { list-style: none; margin: 0; padding: 0; font-size: 12px; }
.nf__log li { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #f7f8fa; }
.nf__log-path { font-family: 'SF Mono', Monaco, monospace; color: #606266; }
.nf__log-at { color: #c0c4cc; }
.nf__log-empty { color: #c0c4cc; justify-content: center; }
</style>
