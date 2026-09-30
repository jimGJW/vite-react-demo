<template>
  <div class="nc">
    <h3>子路由：概览</h3>
    <p class="nc-desc">
      这是 <code>/nested</code> 的子路由（path 为空），渲染在父组件 <code>&lt;router-view /&gt;</code> 里。
      父组件不卸载，所以父级的态（比如下面这份列表数据）在子路由间切换时会保留。
    </p>

    <ul class="nc-list">
      <li v-for="item in items" :key="item.id" class="nc-item">
        <span class="nc-item__id">#{{ item.id }}</span>
        <span class="nc-item__name">{{ item.name }}</span>
        <span class="nc-item__tone" :class="`is-${item.tone}`">{{ item.status }}</span>
        <router-link class="nc-item__go" :to="`/nested/detail/${item.id}`">查详情 →</router-link>
      </li>
    </ul>

    <div class="nc-row">
      <span class="m-chip m-chip--info">父组件挂载次数：{{ mountedCount }}</span>
      <button class="m-btn" type="button" @click="refresh">刷新父级数据（观察子路由不重挂）</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const mountedCount = ref(0)
const items = ref(makeItems())

function makeItems() {
  return [
    { id: 101, name: 'A 座 3F 机房', status: '正常', tone: 'ok' },
    { id: 102, name: 'B 座 12F 配电间', status: '告警', tone: 'warn' },
    { id: 103, name: 'C 座 1F 弱电井', status: '离线', tone: 'muted' },
  ]
}
const refresh = () => { items.value = makeItems() }

onMounted(() => { mountedCount.value += 1 })
</script>

<style scoped>
.nc h3 { margin: 0 0 6px; font-size: 14px; color: #303133; }
.nc-desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.8; }
.nc-list { list-style: none; margin: 0 0 12px; padding: 0; }
.nc-item {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 10px; border: 1px solid #f0f2f5; border-radius: 8px; margin-bottom: 6px;
}
.nc-item__id { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #909399; }
.nc-item__name { flex: 1; font-size: 13px; color: #303133; }
.nc-item__tone { font-size: 12px; padding: 1px 8px; border-radius: 999px; }
.nc-item__tone.is-ok { background: #f0f9eb; color: #529b2e; }
.nc-item__tone.is-warn { background: #fdf6ec; color: #b88230; }
.nc-item__tone.is-muted { background: #f4f4f5; color: #909399; }
.nc-item__go { font-size: 12.5px; color: #409eff; text-decoration: none; }
.nc-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
</style>
