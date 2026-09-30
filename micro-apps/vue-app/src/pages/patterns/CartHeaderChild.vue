<!-- ============================================================
     CartHeaderChild.vue · 购物车顶栏（消费共享状态）
     ============================================================ -->
<template>
  <el-card shadow="never" size="small">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px">
        <div>
          <el-badge :value="totalQty" :hidden="totalQty===0" class="item">
            <el-tag type="danger" effect="dark">
              🛒 购物车（共享状态）
            </el-tag>
          </el-badge>
        </div>
        <el-tag color="#faad14" effect="dark">💰 钱包：¥{{ cart.user.wallet }}</el-tag>
      </div>
    </template>
    <div class="row">
      <span>数量：<el-tag type="danger" effect="plain">{{ totalQty }}</el-tag></span>
      <span>金额：<el-tag type="warning" effect="plain">¥{{ totalAmt }}</el-tag></span>
      <el-button
        size="small" type="primary"
        :disabled="totalAmt === 0 || totalAmt > cart.user.wallet"
        @click="checkout"
      >立即结算</el-button>
    </div>
  </el-card>
</template>

<script setup>
import { inject } from 'vue'
const { cart, totalQty, totalAmt, checkout } = inject(Symbol.for('cart'))
</script>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
</style>
