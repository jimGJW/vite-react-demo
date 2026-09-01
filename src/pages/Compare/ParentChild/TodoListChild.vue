<!-- ============================================================
     TodoListChild.vue · 子组件 —— defineProps + defineEmits
     ============================================================ -->
<template>
  <div>
    <h4 class="col-subtitle">
      Todo List（子组件）· 接收 props：
      <el-tag type="primary" effect="dark">title = {{ title }}</el-tag>
    </h4>

    <div style="display: flex; gap: 8px; margin-bottom: 10px">
      <el-input
        v-model="text"
        placeholder="添加一条待办…"
        clearable
        @keyup.enter="submit"
      />
      <el-button type="primary" @click="submit">添加</el-button>
    </div>

    <el-table :data="itemsWithIdx" border size="small" style="width: 100%">
      <el-table-column prop="idx" label="#" width="70" align="center" />
      <el-table-column prop="text" label="内容" />
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button link type="danger" @click="remove(row.idx - 1)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty
      v-if="!items.length"
      description="暂无待办 — 子组件通过 emit('add') 通知父组件"
      :image-size="60"
    />

    <el-divider style="margin: 14px 0" />
    <div class="state-tip">
      父组件 state：items.length =
      <el-tag type="primary" effect="plain">{{ items.length }}</el-tag>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  title: { type: String, default: '' },
  items: { type: Array,  default: () => [] },
})
const emit = defineEmits(['add', 'remove'])
const text = ref('')

const itemsWithIdx = computed(() =>
  props.items.map((t, idx) => ({ idx: idx + 1, text: t }))
)

function submit() {
  const v = text.value.trim()
  if (!v) { ElMessage.warning('不能为空'); return }
  emit('add', v)
  text.value = ''
}
function remove(i) { emit('remove', i) }
</script>

<style scoped>
.col-subtitle {
  margin: 4px 0 8px;
  font-size: 14px;
  font-weight: 600;
}
.state-tip {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
