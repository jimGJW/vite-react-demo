<template>
  <div class="store-page">
    <header class="page-header-vue">
      <h1>状态管理 · Store</h1>
      <p>不引 Pinia 的原理版实现（src/store/index.js）：reactive + readonly 出口 + localStorage 持久化 + 变更日志 + 撤销重做</p>
    </header>

    <!-- 原理说明 -->
    <section class="store-card">
      <h3>实现要点</h3>
      <ol class="store-notes">
        <li><b>状态提升到模块作用域</b>：<code>reactive(initialState)</code> 只在模块加载时创建一次，天然跨组件共享。</li>
        <li><b>只读出口</b>：对外暴露 <code>readonly(raw)</code>，组件无法绕过 action 直接改状态。</li>
        <li><b>持久化</b>：<code>watch(raw, …, { deep: true })</code> 写入 localStorage，刷新后 <code>restore()</code> 覆盖初始值。</li>
        <li><b>变更日志</b>：每次 <code>$patch</code> 记一条（最多 20 条），页面即"时间机器"。</li>
      </ol>
    </section>

    <!-- 主题 store -->
    <section class="store-card">
      <h3>useThemeStore（持久化）</h3>
      <p class="store-desc">主色 / 圆角 / 紧凑模式，刷新页面后保持——刷新试试。</p>
      <div class="store-row">
        <span class="store-label">主色</span>
        <el-color-picker :model-value="theme.state.primary" @change="theme.setPrimary" />
        <span class="store-label">圆角</span>
        <el-slider
          :model-value="theme.state.radius" :min="0" :max="20" style="width: 160px"
          @update:model-value="(v) => theme.$patch({ radius: v })"
        />
        <el-switch :model-value="theme.state.compact" active-text="紧凑模式" @change="theme.toggleCompact" />
        <el-button size="small" @click="theme.$reset()">恢复默认</el-button>
        <el-button size="small" type="danger" plain @click="clearTheme">清空本地缓存</el-button>
      </div>
      <div class="store-preview" :style="{ borderColor: theme.state.primary, borderRadius: `${theme.state.radius}px` }">
        <span :style="{ color: theme.state.primary }">预览卡片</span>
        <span class="store-preview__hint">border-radius: {{ theme.state.radius }}px · 主色 {{ theme.state.primary }}</span>
      </div>
    </section>

    <!-- 购物车 store：多组件共享 -->
    <section class="store-card">
      <h3>useCartStore（跨组件共享派生值）</h3>
      <p class="store-desc">
        商品列表、钱包、结算按钮分属不同"组件"逻辑，却读写同一份状态：
        合计 <b>{{ cartTotal }}</b> / 件数 <b>{{ cartCount }}</b> / 钱包 <b>¥{{ cart.state.wallet }}</b>
      </p>
      <div class="store-grid2">
        <div class="store-panel">
          <div class="store-panel__title">商品列表</div>
          <div v-for="item in cart.state.items" :key="item.id" class="store-prod">
            <span class="store-prod__name">{{ item.name }}</span>
            <span class="store-prod__price">¥{{ item.price }}</span>
            <el-input-number
              :model-value="item.count" :min="0" :max="9" size="small"
              @update:model-value="(v) => setCount(item.id, v)"
            />
            <el-button link type="danger" size="small" @click="cart.remove(item.id)">删除</el-button>
          </div>
        </div>
        <div class="store-panel">
          <div class="store-panel__title">结算面板（独立消费者）</div>
          <div class="store-row">
            <span class="m-chip m-chip--info">应付款 ¥{{ cartTotal }}</span>
            <span class="m-chip m-chip--ok">钱包余额 ¥{{ cart.state.wallet }}</span>
            <span class="m-chip" :class="cartTotal > cart.state.wallet ? 'm-chip--danger' : ''">
              {{ cartTotal > cart.state.wallet ? '余额不足' : '可以支付' }}
            </span>
          </div>
          <div class="store-row" style="margin-top: 10px">
            <el-button type="primary" :disabled="!cartTotal" @click="checkout">立即结算</el-button>
            <el-button @click="topUpWallet">充值 ¥200</el-button>
            <el-button @click="cart.$reset()">重置购物车</el-button>
          </div>
          <el-alert
            v-if="checkoutMsg" :title="checkoutMsg" :type="checkoutOk ? 'success' : 'error'"
            show-icon :closable="false" style="margin-top: 10px"
          />
        </div>
      </div>
    </section>

    <!-- 撤销重做 -->
    <section class="store-card">
      <h3>撤销 / 重做（useUndoRedo）</h3>
      <p class="store-desc">每次操作把上一次快照压栈，undo/redo 切换；最多保留 30 步历史。</p>
      <div class="store-row">
        <el-button type="primary" @click="addCard">新增卡片</el-button>
        <el-button @click="moveCard">移动首张卡片（待办 → 进行中）</el-button>
        <el-button @click="deleteCard">删除最后一张</el-button>
        <el-button :disabled="!undo.canUndo.value" @click="doUndo">撤销（{{ undo.history.value }} 步可退）</el-button>
        <el-button :disabled="!undo.canRedo.value" @click="doRedo">重做</el-button>
      </div>
      <div class="store-board">
        <div v-for="col in board.state.columns" :key="col.id" class="store-col">
          <div class="store-col__head" :class="`store-col__head--${col.tone}`">
            {{ col.title }} · {{ cardsByCol(col.id).length }}
          </div>
          <div v-for="card in cardsByCol(col.id)" :key="card.id" class="store-carditem">
            {{ card.text }}
          </div>
          <div v-if="!cardsByCol(col.id).length" class="store-col__empty">暂无卡片</div>
        </div>
      </div>
    </section>

    <!-- 变更日志 -->
    <section class="store-card">
      <h3>变更日志（时间机器）</h3>
      <div class="store-row">
        <el-button size="small" @click="board.$clearLogs()">清空日志</el-button>
        <span class="m-chip m-chip--info">共 {{ board.logs.length }} 条（最多 20）</span>
      </div>
      <ul class="store-logs">
        <li v-for="log in board.logs" :key="log.id">
          <span class="store-logs__type" :class="`store-logs__type--${log.type === 'reset' ? 'danger' : 'info'}`">{{ log.type }}</span>
          <code class="store-logs__payload">{{ JSON.stringify(log.payload) }}</code>
          <span class="store-logs__at">{{ formatDate(log.at, 'HH:mm:ss') }}</span>
        </li>
        <li v-if="!board.logs.length" class="store-logs__empty">暂无变更记录，点上面的按钮试试</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  useThemeStore, useCartStore, useBoardStore, cartTotal, cartCount,
} from '../store'
import { useUndoRedo } from '../composables'
import { formatDate } from '../utils'

/* —— 主题 —— */
const theme = useThemeStore()
const clearTheme = () => {
  theme.$persistClear()
  theme.$reset()
  ElMessage.success('已清空本地缓存并恢复默认')
}

/* —— 购物车 —— */
const cart = useCartStore()
const setCount = (id, count) => {
  cart.$patch({ items: cart.raw.items.map((i) => (i.id === id ? { ...i, count } : i)) })
}
const checkoutMsg = ref('')
const checkoutOk = ref(true)
const checkout = () => {
  const res = cart.checkout()
  checkoutMsg.value = res.msg
  checkoutOk.value = res.ok
  ElMessage({ type: res.ok ? 'success' : 'error', message: res.msg })
}
const topUpWallet = () => {
  cart.$patch({ wallet: cart.raw.wallet + 200 })
  ElMessage.success('充值成功 +¥200')
}

/* —— 看板 + 撤销重做 —— */
const board = useBoardStore()
const boardState = computed(() => ({
  columns: board.state.columns,
  cards: board.state.cards,
}))
const undo = useUndoRedo(boardState.value)

const cardsByCol = (colId) => board.state.cards.filter((c) => c.col === colId)

/** 所有写操作统一走 commit：先记录快照，再改 store */
const commitCards = (nextCards, label) => {
  undo.commit({ ...boardState.value, cards: nextCards })
  board.$patch({ cards: nextCards })
  ElMessage.success(label)
}

let seq = 0
const addCard = () => {
  seq += 1
  commitCards(
    [...board.state.cards, { id: `n${Date.now()}${seq}`, col: 'todo', text: `新任务 #${seq}` }],
    '已新增卡片',
  )
}
const moveCard = () => {
  const first = board.state.cards.find((c) => c.col === 'todo')
  if (!first) {
    ElMessage.warning('待办列没有卡片可移动')
    return
  }
  commitCards(
    board.state.cards.map((c) => (c.id === first.id ? { ...c, col: 'doing' } : c)),
    `已把「${first.text}」移到进行中`,
  )
}
const deleteCard = () => {
  if (!board.state.cards.length) {
    ElMessage.warning('没有可删除的卡片')
    return
  }
  const last = board.state.cards[board.state.cards.length - 1]
  commitCards(board.state.cards.slice(0, -1), `已删除「${last.text}」`)
}

const doUndo = () => {
  if (undo.undo()) {
    board.$patch({ cards: undo.state.value.cards })
    ElMessage.info('已撤销')
  }
}
const doRedo = () => {
  if (undo.redo()) {
    board.$patch({ cards: undo.state.value.cards })
    ElMessage.info('已重做')
  }
}
</script>

<style scoped>
.store-page { padding: 20px 24px 44px; }
.store-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.store-card h3 { margin: 0 0 8px; font-size: 15px; color: #303133; }
.store-desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.8; }
.store-notes { margin: 0; padding-left: 18px; font-size: 12.5px; color: #606266; line-height: 1.9; }
.store-notes code {
  font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
  color: #409eff; background: #f2f8ff; padding: 1px 5px; border-radius: 3px;
}
.store-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.store-label { font-size: 12.5px; color: #909399; }
.store-preview {
  margin-top: 12px; padding: 16px; border: 2px solid; background: #fff;
  display: flex; flex-direction: column; gap: 4px; transition: all 0.2s;
}
.store-preview span:first-child { font-size: 15px; font-weight: 700; }
.store-preview__hint { font-size: 12px; color: #909399; }

.store-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
.store-panel { border: 1px solid #f0f2f5; border-radius: 8px; padding: 12px 14px; background: #fcfdff; }
.store-panel__title { font-size: 12.5px; font-weight: 600; color: #606266; margin-bottom: 10px; }
.store-prod {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 0; border-bottom: 1px dashed #f0f2f5; font-size: 12.5px; color: #606266;
}
.store-prod__name { flex: 1; }
.store-prod__price { color: #f56c6c; font-variant-numeric: tabular-nums; }

.store-board { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-top: 12px; }
.store-col { border: 1px solid #f0f2f5; border-radius: 8px; padding: 10px; background: #fcfdff; min-height: 110px; }
.store-col__head { font-size: 12.5px; font-weight: 600; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #409eff; }
.store-col__head--primary { border-color: #409eff; color: #409eff; }
.store-col__head--warn { border-color: #e6a23c; color: #b88230; }
.store-col__head--ok { border-color: #67c23a; color: #529b2e; }
.store-carditem {
  padding: 7px 9px; border-radius: 6px; background: #fff;
  border: 1px solid #e4e7ed; font-size: 12.5px; color: #606266; margin-bottom: 6px;
}
.store-col__empty { font-size: 12px; color: #c0c4cc; text-align: center; padding: 14px 0; }

.store-logs { list-style: none; margin: 10px 0 0; padding: 0; font-size: 12px; max-height: 220px; overflow-y: auto; }
.store-logs li { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px dashed #f7f8fa; }
.store-logs__type { padding: 1px 7px; border-radius: 3px; font-size: 11px; }
.store-logs__type--info { background: #ecf5ff; color: #409eff; }
.store-logs__type--danger { background: #fef0f0; color: #f56c6c; }
.store-logs__payload {
  flex: 1; font-family: 'SF Mono', Monaco, monospace; font-size: 11.5px; color: #606266;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.store-logs__at { color: #c0c4cc; font-variant-numeric: tabular-nums; }
.store-logs__empty { color: #c0c4cc; justify-content: center; }
</style>
