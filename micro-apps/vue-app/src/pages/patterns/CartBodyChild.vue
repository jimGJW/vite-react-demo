<!-- ============================================================
     CartBodyChild.vue · 商品列表（消费共享状态）
     ============================================================ -->
<template>
  <el-card shadow="never" size="small">
    <template #header>
      <el-tag type="info" effect="dark">商品列表（独立消费组件）</el-tag>
    </template>

    <div class="add-row">
      <el-input
        v-model="name"
        placeholder="商品名"
        @keyup.enter="submit"
        style="flex: 1; min-width: 0"
      />
      <el-input-number
        v-model="price"
        :min="1" :precision="2" :step="1"
        placeholder="价格"
        style="width: 140px"
      />
      <el-button type="primary" @click="submit">加入</el-button>
    </div>

    <el-empty
      v-if="!cart.items.length"
      description="购物车为空"
      :image-size="70"
    />

    <div v-else class="items">
      <div v-for="it in cart.items" :key="it.id" class="item">
        <div class="info">
          <strong>{{ it.name }}</strong>
          &nbsp;<el-tag type="warning" size="small">¥{{ it.price }}</el-tag>
          <span class="sub">小计：¥{{ it.price * it.qty }}</span>
        </div>
        <div class="actions">
          <el-button size="small" circle @click="dec(it.id)">-</el-button>
          <el-tag type="success" effect="plain">× {{ it.qty }}</el-tag>
          <el-button size="small" type="primary" circle @click="inc(it.id)">+</el-button>
          <el-button size="small" link type="danger" @click="remove(it)">删除</el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { inject, ref } from 'vue'
const { cart, inc, dec, addItem } = inject(Symbol.for('cart'))

const name  = ref('')
const price = ref(20)

const submit = () => {
  if (!name.value.trim() || !price.value) return
  addItem(name.value.trim(), Number(price.value))
  name.value = ''
  price.value = 20
}
const remove = (it) => {
  // 一直减到 qty 为 0，会自动 splice
  let k = it.qty
  while (k-- > 0) dec(it.id)
}
</script>

<style scoped>
.add-row { display: flex; gap: 8px; margin-bottom: 10px; }
.items   { display: flex; flex-direction: column; gap: 8px; }
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
  gap: 12px;
  flex-wrap: wrap;
}
.info { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.info .sub { margin-left: 10px; font-size: 12px; color: #909399; }
.actions { display: flex; align-items: center; gap: 8px; }
</style>
