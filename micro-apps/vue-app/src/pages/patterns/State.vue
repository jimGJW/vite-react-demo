<!-- ============================================================
     Vue 3 · 全局状态共享（reactive + provide/inject，简易购物车）
     ============================================================ -->
<template>
  <div class="state-demo">
    <CartHeader />
    <CartBody />
  </div>
</template>

<script setup>
import { provide, reactive, computed } from 'vue'
import CartHeader from './CartHeaderChild.vue'
import CartBody from './CartBodyChild.vue'

const cart = reactive({
  items: [
    { id: 1, name: 'Vue 3 实战', price: 68, qty: 1 },
    { id: 2, name: 'React 设计模式', price: 89, qty: 2 },
  ],
  user: { name: 'Alice', wallet: 500 },
})

const totalQty = computed(() => cart.items.reduce((s, i) => s + i.qty, 0))
const totalAmt = computed(() => cart.items.reduce((s, i) => s + i.qty * i.price, 0))

const inc = (id) => {
  const it = cart.items.find(i => i.id === id)
  it && it.qty++
}
const dec = (id) => {
  const idx = cart.items.findIndex(i => i.id === id)
  if (idx < 0) return
  if (cart.items[idx].qty > 1) cart.items[idx].qty--
  else cart.items.splice(idx, 1)
}
const addItem = (name, price) => {
  const exist = cart.items.find(i => i.name === name)
  if (exist) exist.qty++
  else cart.items.push({ id: Date.now(), name, price, qty: 1 })
}
const checkout = () => {
  const amt = totalAmt.value
  if (amt === 0 || amt > cart.user.wallet) return
  cart.user.wallet = Math.max(0, cart.user.wallet - amt)
  cart.items.splice(0, cart.items.length)
}

const CART_KEY = Symbol.for('cart')
provide(CART_KEY, { cart, totalQty, totalAmt, inc, dec, addItem, checkout })
</script>

<style scoped>
.state-demo { display: flex; flex-direction: column; gap: 10px; width: 100%; }
</style>
