<!-- ============================================================
     Vue 3 · 双向绑定演示
     · 输入框 / 开关 / 滑块 / 自定义 Counter (defineModel)
     ============================================================ -->
<template>
  <div class="two-way">
    <div class="row">
      <strong>姓名：</strong>
      <el-input
        v-model.trim="name"
        placeholder="请输入姓名"
        clearable
        style="width: 200px; margin-left: 8px"
      />
      <el-tag type="primary" style="margin-left: 8px">Hello, {{ name }}!</el-tag>
    </div>

    <div class="row">
      <strong>启用功能：</strong>
      <el-switch
        v-model="enabled"
        style="margin-left: 8px"
        inline-prompt
        active-text="启用"
        inactive-text="禁用"
      />
      <el-tag :type="enabled ? 'success' : 'info'" style="margin-left: 8px">
        当前：{{ enabled ? '已启用' : '已禁用' }}
      </el-tag>
    </div>

    <div class="row">
      <strong style="flex-shrink: 0">音量：</strong>
      <el-slider
        v-model.number="volume"
        style="width: 240px; margin-left: 8px"
      />
      <el-tag type="warning" style="margin-left: 8px">{{ volume }}%</el-tag>
    </div>

    <el-divider style="margin: 6px 0" />

    <div class="row"><strong>自定义组件双向绑定（defineModel）：</strong></div>
    <div class="row">
      <Counter v-model.number="count" />
    </div>
    <div class="hint">
      父组件 count = <el-tag type="success" effect="plain">{{ count }}</el-tag>
      &nbsp;（子组件内部没有自己的状态，完全受控）
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Counter from './CounterChild.vue'

const name    = ref('张三')
const enabled = ref(true)
const volume  = ref(60)
const count   = ref(3)
</script>

<style scoped>
.two-way { display: flex; flex-direction: column; gap: 14px; width: 100%; }
.two-way .row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.hint {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
