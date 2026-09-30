<template>
  <div class="admin">
    <header class="page-header-vue">
      <h1>受保护页面 / Admin</h1>
      <p>
        本路由带 <code>meta.requiresAuth: true</code>。未登录时全局守卫会把导航改道到
        <code>/login?redirect=/admin</code>；登录后自动放行。
      </p>
    </header>

    <section class="admin-card">
      <h3>当前会话</h3>
      <dl class="admin-kv">
        <div><dt>用户</dt><dd>{{ auth.state.name || '—' }}</dd></div>
        <div><dt>token</dt><dd>{{ auth.state.token || '—' }}</dd></div>
        <div><dt>meta.requiresAuth</dt><dd>{{ String(route.meta.requiresAuth) }}</dd></div>
      </dl>
      <div class="admin-row">
        <el-button type="danger" plain @click="doLogout">退出登录（再进来会被拦截）</el-button>
        <router-link class="m-btn" to="/admin">重新进入本页</router-link>
      </div>
    </section>

    <section class="admin-card">
      <h3>守卫日志（最近 12 条）</h3>
      <ul class="admin-logs">
        <li v-for="(l, i) in guardLog" :key="i" class="admin-logs__item">
          <span class="admin-logs__at">{{ l.at }}</span>
          <span class="admin-logs__txt" :class="`is-${l.tone}`">{{ l.text }}</span>
        </li>
        <li v-if="!guardLog.length" class="admin-logs__empty">暂无记录</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store'
import { routeLog } from '../router'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

/** 从全局守卫写入的 routeLog 里摘出受保护路由的记录（证明守卫真的跑了） */
const guardLog = ref(
  routeLog
    .filter((l) => l.guard)
    .slice(0, 12)
    .map((l) => ({
      at: l.at.toLocaleTimeString('zh-CN', { hour12: false }),
      text: `${l.path} — ${l.guard}`,
      tone: l.guard === '放行' ? 'ok' : 'warn',
    })),
)

const doLogout = async () => {
  auth.logout()
  ElMessage.warning('已退出登录，守卫会在下次进入 /admin 时拦截')
  await router.push('/admin')
}
</script>

<style scoped>
.admin { padding: 20px 24px 44px; }
.admin-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.admin-card h3 { margin: 0 0 10px; font-size: 15px; color: #303133; }
.admin-kv { margin: 0 0 12px; padding: 0; }
.admin-kv > div { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px dashed #f3f4f6; }
.admin-kv dt { width: 130px; font-size: 12.5px; color: #909399; }
.admin-kv dd {
  margin: 0; font-size: 12.5px; color: #303133;
  font-family: 'SF Mono', Monaco, monospace; word-break: break-all;
}
.admin-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.admin-logs { list-style: none; margin: 0; padding: 0; }
.admin-logs__item {
  display: flex; gap: 10px; padding: 5px 0;
  border-bottom: 1px dashed #f3f4f6; font-size: 12.5px;
}
.admin-logs__at { color: #909399; font-family: 'SF Mono', Monaco, monospace; }
.admin-logs__txt.is-ok { color: #529b2e; }
.admin-logs__txt.is-warn { color: #b88230; }
.admin-logs__empty { font-size: 12.5px; color: #c0c4cc; padding: 4px 0; }
</style>
