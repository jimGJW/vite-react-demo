<template>
  <div class="nd">
    <h3>子路由：详情 <code>#{{ id }}</code></h3>
    <p class="nd-desc">
      用动态段 <code>/nested/detail/:id</code> 匹配；<code>route.params</code> 是响应式的，
      所以在两条 detail 之间切换时本组件不会重挂，只有参数变化。
    </p>

    <dl class="nd-kv">
      <div><dt>路由参数 id</dt><dd>{{ id }}</dd></div>
      <div><dt>完整路径</dt><dd>{{ route.fullPath }}</dd></div>
      <div><dt>query</dt><dd>{{ JSON.stringify(route.query) }}</dd></div>
      <div><dt>matched 链</dt><dd>{{ route.matched.map((m) => m.path).join('  →  ') }}</dd></div>
    </dl>

    <div class="nd-row">
      <button class="m-btn" type="button" @click="next">下一条 (#{{ Number(id) + 1 }})</button>
      <button class="m-btn" type="button" @click="withQuery">带 query 打开</button>
      <router-link class="m-btn m-btn--primary" to="/nested">← 回概览</router-link>
    </div>

    <p class="nd-hook">本条 watch(route.params) 触发次数：<b>{{ watchCount }}</b></p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const watchCount = ref(0)
const next = () => router.push(`/nested/detail/${Number(id.value) + 1}`)
const withQuery = () => router.push({ path: `/nested/detail/${id.value}`, query: { from: 'query-demo' } })

watch(() => route.params.id, () => { watchCount.value += 1 })
</script>

<style scoped>
.nd h3 { margin: 0 0 6px; font-size: 14px; color: #303133; }
.nd-desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.8; }
.nd-kv { margin: 0 0 12px; padding: 0; }
.nd-kv > div { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px dashed #f3f4f6; }
.nd-kv dt { width: 96px; font-size: 12.5px; color: #909399; }
.nd-kv dd { margin: 0; font-size: 12.5px; color: #303133; font-family: 'SF Mono', Monaco, monospace; word-break: break-all; }
.nd-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.nd-hook { margin: 12px 0 0; font-size: 12.5px; color: #606266; }
</style>
