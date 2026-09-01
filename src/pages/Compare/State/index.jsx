import { createContext, useContext, useState, useMemo, useCallback, lazy } from 'react'
import { Button, Input, List, Tag, Card, Space, Divider, Badge, Typography } from 'antd'
import {
  PlusOutlined, MinusOutlined, DeleteOutlined,
  ShoppingCartOutlined, WalletOutlined,
} from '@ant-design/icons'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { mountVueBridge } from '../../../utils/mountVueBridge.jsx'

const StateVue = lazy(() => import('./demo-state.vue').then((m) => ({ default: mountVueBridge(m.default || m) })))
const { Text } = Typography

/* =====================================================================
   React · 全局状态共享（createContext + Provider，简易购物车 Store）
   ===================================================================== */
const CartCtx = createContext(null)
const useCart = () => useContext(CartCtx)

function CartProvider({ children }) {
  const [items, setItems] = useState([
    { id: 1, name: 'Vue 3 实战', price: 68, qty: 1 },
    { id: 2, name: 'React 设计模式', price: 89, qty: 2 },
  ])
  const [user, setUser] = useState({ name: 'Alice', wallet: 500 })

  const totalQty  = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])
  const totalAmt  = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items])

  const inc = useCallback(id =>
    setItems(p => p.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)), [])
  const dec = useCallback(id =>
    setItems(p => p.flatMap(i => i.id !== id ? [i]
      : i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []))
  , [])
  const addItem = useCallback((name, price) =>
    setItems(p => {
      const exist = p.find(i => i.name === name)
      if (exist) return p.map(i => i === exist ? { ...i, qty: i.qty + 1 } : i)
      return [...p, { id: Date.now(), name, price, qty: 1 }]
    }), [])
  const checkout = useCallback(() =>
    setUser(u => ({ ...u, wallet: Math.max(0, u.wallet - totalAmt) }))
  , [totalAmt])

  const value = { items, totalQty, totalAmt, user, setUser, inc, dec, addItem, checkout }
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

/* 两个独立消费组件：Header 与 Body 互不嵌套，但共享状态 */
function CartHeader() {
  const { totalQty, totalAmt, user, checkout } = useCart()
  return (
    <Card size="small"
      title={
        <Badge count={totalQty} offset={[6, -2]}>
          <Tag color="magenta" style={{ marginRight: 0 }}>
            <ShoppingCartOutlined /> 购物车（共享状态）
          </Tag>
        </Badge>
      }
      extra={<Tag color="gold"><WalletOutlined /> 钱包：¥{user.wallet}</Tag>}
    >
      <Space wrap split={<Divider type="vertical" />}>
        <span><Text type="secondary">数量：</Text><Tag color="magenta">{totalQty}</Tag></span>
        <span><Text type="secondary">金额：</Text><Tag color="volcano">¥{totalAmt}</Tag></span>
        <Button size="small" type="primary"
          onClick={checkout}
          disabled={totalAmt === 0 || totalAmt > user.wallet}
        >立即结算</Button>
      </Space>
    </Card>
  )
}
function CartBody() {
  const { items, inc, dec, addItem } = useCart()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  return (
    <Card size="small" title={<Tag color="cyan">商品列表（独立消费组件）</Tag>} style={{ marginTop: 10 }}>
      <Space.Compact style={{ width: '100%', marginBottom: 10 }}>
        <Input placeholder="商品名" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="价格" type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ width: 100 }} />
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => {
            if (!name.trim() || !price) return
            addItem(name.trim(), Number(price))
            setName(''); setPrice('')
          }}
        >加入</Button>
      </Space.Compact>

      <List
        size="small"
        bordered
        dataSource={items}
        locale={{ emptyText: '购物车为空' }}
        renderItem={it => (
          <List.Item
            actions={[
              <Button size="small" icon={<MinusOutlined />} key="-" onClick={() => dec(it.id)} />,
              <Tag color="purple" key="q">× {it.qty}</Tag>,
              <Button size="small" type="primary" icon={<PlusOutlined />} key="+" onClick={() => inc(it.id)} />,
              <Button size="small" danger type="text" icon={<DeleteOutlined />} key="d" onClick={() => dec(it.id)} />,
            ]}
          >
            <div>
              <Text strong>{it.name}</Text>
              &nbsp;&nbsp;<Tag color="orange">¥{it.price}</Tag>
              &nbsp;<Text type="secondary" style={{ fontSize: 12 }}>小计：¥{it.price * it.qty}</Text>
            </div>
          </List.Item>
        )}
      />
    </Card>
  )
}

function ReactDemo() {
  return (
    <CartProvider>
      <Space direction="vertical" style={{ width: '100%' }}>
        <CartHeader />
        <CartBody />
      </Space>
    </CartProvider>
  )
}

/* ========== 页面 ========== */
export default function CompareState() {
  return (
    <CompareLayout
      title="全局状态共享"
      subtitle="React：createContext + useReducer 或 useMemo 封装 store；Vue：reactive + provide/inject 或 Pinia。本页均采用「框架原生方案」对比，不引入 Redux/Zustand/Pinia。"
      tags={[
        { label: 'Context vs provide+reactive' },
        { label: '购物车实战', color: 'magenta' },
        { label: '多组件共享状态' },
      ]}
      reactDemo={<ReactDemo />}
      vueDemo={<StateVue />}
      diffRows={[
        { title: '方案（原生）', antd: 'createContext + Provider + useContext；state 放 Provider 内', vue: 'reactive 或 ref 对象 + provide(key, store)；或 Pinia（官方 store）' },
        { title: '状态引用', antd: 'Provider 的 value 每次 setState 都是新对象，引用变化触发全量 consumer 重渲染', vue: 'reactive 对象引用不变；修改属性会精准触发依赖该属性的订阅者' },
        { title: '性能优化', antd: '拆多个 Context / memo + useCallback / useMemo / 选择器库', vue: 'computed 派生态自动缓存；组件粒度精确' },
        { title: '异步修改', antd: '在 Provider 组件内写 useCallback(async ()=> {...setState})', vue: 'action 即普通 async 函数直接修改 reactive 属性' },
        { title: 'Devtools', antd: 'React DevTools Components 看 Context；Redux/Zustand 有独立面板', vue: 'Vue DevTools → Pinia 面板或 Setup 状态树' },
        { title: '生产常用封装', antd: 'Zustand / Redux Toolkit / Jotai', vue: 'Pinia（替换 Vuex）' },
      ]}
      code={{
        antdCode:
`// 1. createContext
const CartCtx = createContext(null)
const useCart = () => useContext(CartCtx)

// 2. Provider 内用 useState 聚合
function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const inc = useCallback(id => setItems(p =>
    p.map(i => i.id===id ? {...i, qty: i.qty+1} : i)), [])
  const value = { items, inc, dec, addItem, ... }
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

// 3. 任意组件
const { items, inc } = useCart()`,
        vueCode:
`// composables/useCart.js —— reactive + provide/inject
import { reactive, provide, inject } from 'vue'
const KEY = Symbol('cart')

export function provideCart() {
  const cart = reactive({
    items: [{ id:1, name:'...', price:68, qty:1 }],
    user: { name: 'Alice', wallet: 500 },
  })
  const inc = id => {
    const it = cart.items.find(i=>i.id===id)
    it && it.qty++
  }
  const addItem = (name,price) => cart.items.push(...)
  const checkout = () => cart.user.wallet -= totalAmt.value
  provide(KEY, { cart, inc, addItem, checkout, totalQty, totalAmt })
}
export function useCart() { return inject(KEY) }`,
      }}
    />
  )
}
