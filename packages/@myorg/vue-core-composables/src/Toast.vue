<script setup>
import { computed } from 'vue'

/** 轻提示 Toast（由 showToast() 命令式挂载，一般无需直接使用） */
const props = defineProps({
  type: { type: String, default: 'info' },   // info | warn | error
  message: { type: String, default: '' },
})

const color = computed(() =>
  props.type === 'error' ? '#ef4444' : props.type === 'warn' ? '#f59e0b' : '#10b981')
</script>

<template>
  <div
    :style="{
      position: 'fixed',
      top: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(15,23,42,0.9)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '6px',
      fontSize: '14px',
      zIndex: 10000,
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    }"
  >
    {{ message }}
  </div>
</template>
