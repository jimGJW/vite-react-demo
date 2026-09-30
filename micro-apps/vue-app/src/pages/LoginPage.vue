<template>
  <div class="login">
    <header class="page-header-vue">
      <h1>登录 / Login</h1>
      <p>被 <code>meta.requiresAuth</code> 守卫拦截后会带 <code>?redirect=</code> 跳到这里，登录成功再跳回原页面。</p>
    </header>

    <section class="login-card">
      <div class="login-field">
        <span class="login-label">用户名</span>
        <el-input v-model="name" placeholder="随便填，演示用" style="max-width: 260px" />
      </div>

      <div class="login-field">
        <span class="login-label">目标地址</span>
        <code class="login-code">{{ redirect || '（无，登录后回首页）' }}</code>
      </div>

      <div class="login-row">
        <el-button type="primary" :disabled="!name.trim()" @click="doLogin">登录并跳回</el-button>
        <el-button @click="fillDemo">填入示例账号</el-button>
      </div>

      <el-alert
        v-if="tips"
        :title="tips"
        :type="okTone ? 'success' : 'warning'"
        show-icon
        :closable="false"
        style="margin-top: 12px"
      />
    </section>

    <section class="login-card">
      <h3 class="login-h3">守卫工作原理</h3>
      <ol class="login-notes">
        <li>路由表里给 <code>/admin</code> 打上 <code>meta.requiresAuth: true</code>。</li>
        <li>全局 <code>router.beforeEach</code> 读 <code>to.meta.requiresAuth</code> 与 auth store 的 token。</li>
        <li>未登录 → <code>return { path: '/login', query: { redirect: to.fullPath } }</code>，导航被改道。</li>
        <li>登录写入 token（localStorage 持久化）→ 再 <code>push(redirect)</code> 放行。</li>
      </ol>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const tips = ref('')
const okTone = ref(true)

const redirect = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' ? r : ''
})

const fillDemo = () => { name.value = 'demo-user' }

const doLogin = async () => {
  auth.login(name.value.trim())
  tips.value = `已登录为「${auth.state.name}」，token=${auth.state.token}`
  okTone.value = true
  ElMessage.success('登录成功')
  // 回跳到被拦截的页面；没有 redirect 就回首页
  await router.replace(redirect.value || '/')
}
</script>

<style scoped>
.login { padding: 20px 24px 44px; }
.login-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.login-field { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.login-label { font-size: 12.5px; color: #909399; width: 72px; }
.login-code {
  font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
  color: #409eff; background: #f2f8ff; padding: 3px 8px; border-radius: 4px;
}
.login-row { display: flex; gap: 10px; flex-wrap: wrap; }
.login-h3 { margin: 0 0 8px; font-size: 15px; color: #303133; }
.login-notes { margin: 0; padding-left: 18px; font-size: 12.5px; color: #606266; line-height: 1.9; }
.login-notes code {
  font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
  color: #409eff; background: #f2f8ff; padding: 1px 5px; border-radius: 3px;
}
</style>
