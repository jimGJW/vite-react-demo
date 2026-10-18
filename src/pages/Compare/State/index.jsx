import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { Button, Input, List, Tag, Card, Space, Divider, Badge, Typography } from 'antd'
import {
  PlusOutlined, MinusOutlined, DeleteOutlined,
  ShoppingCartOutlined, WalletOutlined,
} from '@ant-design/icons'
import CompareLayout from '@/utils/CompareLayout.jsx'
import { useI18n } from '@i18n/index.js'

const { Text } = Typography

/* =====================================================================
   React · 全局状态共享（createContext + Provider，简易购物车 Store）
   ===================================================================== */
const CartCtx = createContext(null)
const useCart = () => useContext(CartCtx)

function CartProvider({ children }) {
  const { t } = useI18n()
  const [items, setItems] = useState([
    { id: 1, name: t('compare.state.book1'), price: 68, qty: 1 },
    { id: 2, name: t('compare.state.book2'), price: 89, qty: 2 },
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
  // 整行删除：与 dec 不同，无论 qty 是多少都直接移除（删除按钮专用）
  const remove = useCallback(id =>
    setItems(p => p.filter(i => i.id !== id)), [])
  const addItem = useCallback((name, price) =>
    setItems(p => {
      const exist = p.find(i => i.name === name)
      if (exist) return p.map(i => i === exist ? { ...i, qty: i.qty + 1 } : i)
      return [...p, { id: Date.now(), name, price, qty: 1 }]
    }), [])
  const checkout = useCallback(() =>
    setUser(u => ({ ...u, wallet: Math.max(0, u.wallet - totalAmt) }))
  , [totalAmt])

  const value = { items, totalQty, totalAmt, user, setUser, inc, dec, remove, addItem, checkout }
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

/* 两个独立消费组件：Header 与 Body 互不嵌套，但共享状态 */
function CartHeader() {
  const { t } = useI18n()
  const { totalQty, totalAmt, user, checkout } = useCart()
  return (
    <Card size="small"
      title={
        <Badge count={totalQty} offset={[6, -2]}>
          <Tag color="magenta" style={{ marginRight: 0 }}>
            <ShoppingCartOutlined /> {t('compare.state.cartTitle')}
          </Tag>
        </Badge>
      }
      extra={<Tag color="gold"><WalletOutlined /> {t('compare.state.wallet')}{user.wallet}</Tag>}
    >
      <Space wrap split={<Divider type="vertical" />}>
        <span><Text type="secondary">{t('compare.state.qtyLabel')}</Text><Tag color="magenta">{totalQty}</Tag></span>
        <span><Text type="secondary">{t('compare.state.amtLabel')}</Text><Tag color="volcano">¥{totalAmt}</Tag></span>
        <Button size="small" type="primary"
          onClick={checkout}
          disabled={totalAmt === 0 || totalAmt > user.wallet}
        >{t('compare.state.checkout')}</Button>
      </Space>
    </Card>
  )
}
function CartBody() {
  const { t } = useI18n()
  const { items, inc, dec, remove, addItem } = useCart()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  return (
    <Card size="small" title={<Tag color="cyan">{t('compare.state.productList')}</Tag>} style={{ marginTop: 10 }}>
      <Space.Compact style={{ width: '100%', marginBottom: 10 }}>
        <Input placeholder={t('compare.state.namePlaceholder')} value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder={t('compare.state.pricePlaceholder')} type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ width: 100 }} />
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => {
            if (!name.trim() || !price) return
            addItem(name.trim(), Number(price))
            setName(''); setPrice('')
          }}
        >{t('compare.state.addButton')}</Button>
      </Space.Compact>

      <List
        size="small"
        bordered
        dataSource={items}
        locale={{ emptyText: t('compare.state.emptyCart') }}
        renderItem={it => (
          <List.Item
            actions={[
              <Button size="small" icon={<MinusOutlined />} key="-" onClick={() => dec(it.id)} />,
              <Tag color="purple" key="q">× {it.qty}</Tag>,
              <Button size="small" type="primary" icon={<PlusOutlined />} key="+" onClick={() => inc(it.id)} />,
              <Button size="small" danger type="text" icon={<DeleteOutlined />} key="d" onClick={() => remove(it.id)} />,
            ]}
          >
            <div>
              <Text strong>{it.name}</Text>
              &nbsp;&nbsp;<Tag color="orange">¥{it.price}</Tag>
              &nbsp;<Text type="secondary" style={{ fontSize: 12 }}>{t('compare.state.subtotal')}{it.price * it.qty}</Text>
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
  const { t } = useI18n()
  return (
    <CompareLayout
      title={t('compare.state.title')}
      subtitle={t('compare.state.subtitle')}
      tags={[
        { label: t('compare.state.tagContext') },
        { label: t('compare.state.tagCart'), color: 'magenta' },
        { label: t('compare.state.tagShare') },
      ]}
      reactDemo={<ReactDemo />}
      vueAppPath="/pattern/state"
      diffRows={[
        { title: t('compare.state.diff.native.title'), antd: t('compare.state.diff.native.antd'), vue: t('compare.state.diff.native.vue') },
        { title: t('compare.state.diff.reference.title'), antd: t('compare.state.diff.reference.antd'), vue: t('compare.state.diff.reference.vue') },
        { title: t('compare.state.diff.perf.title'), antd: t('compare.state.diff.perf.antd'), vue: t('compare.state.diff.perf.vue') },
        { title: t('compare.state.diff.async.title'), antd: t('compare.state.diff.async.antd'), vue: t('compare.state.diff.async.vue') },
        { title: t('compare.state.diff.devtools.title'), antd: t('compare.state.diff.devtools.antd'), vue: t('compare.state.diff.devtools.vue') },
        { title: t('compare.state.diff.prod.title'), antd: t('compare.state.diff.prod.antd'), vue: t('compare.state.diff.prod.vue') },
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
