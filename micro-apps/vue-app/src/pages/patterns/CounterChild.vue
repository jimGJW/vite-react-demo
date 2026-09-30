<!-- ============================================================
     CounterChild.vue · 自定义双向绑定子组件
     用 Vue 3.4+ defineModel（语法糖：props.modelValue + emit('update:modelValue')）
     ============================================================ -->
<template>
  <div class="counter">
    <el-button @click="modelValue--">-</el-button>
    <div class="val">{{ modelValue }}</div>
    <el-button type="primary" @click="modelValue++">+</el-button>
    <el-tag effect="plain" style="margin-left: 8px">defineModel v-model</el-tag>
  </div>
</template>

<script setup>
const modelValue = defineModel({
  type: Number,
  default: 0,
})
</script>

<style scoped>
.counter { display: inline-flex; align-items: center; }
.counter .val {
  min-width: 48px;
  text-align: center;
  padding: 0 8px;
  font-weight: 600;
  font-size: 15px;
}
</style>
