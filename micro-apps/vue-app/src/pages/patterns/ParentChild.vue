<!-- ============================================================
     Vue 3 · 父子组件传值演示 (TodoList 示例)
     · 根组件：父组件（保存 title + items 状态）
     · TodoList：子组件（defineProps + defineEmits）
     ============================================================ -->
<template>
  <div class="vue-pc">
    <TodoList
      :title="title"
      :items="items"
      @add="add"
      @remove="remove"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import TodoList from './TodoListChild.vue'

const title = ref('本季度 OKR')
const items = ref([
  '完成 React-Vue 双框架集成',
  '落地组件化重构',
])

function add(v) { items.value.push(v) }
function remove(i) { items.value.splice(i, 1) }
</script>

<style scoped>
.vue-pc { width: 100%; }
</style>
