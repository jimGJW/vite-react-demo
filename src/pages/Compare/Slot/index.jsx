import { useState, lazy } from 'react'
import { Button, Space, Tag, Typography, Rate, Avatar } from 'antd'
import {
  UserOutlined, SettingOutlined, HeartOutlined,
} from '@ant-design/icons'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { mountVueBridge } from '../../../utils/mountVueBridge.jsx'

const SlotVue = lazy(() => import('./demo-slot.vue').then((m) => ({ default: mountVueBridge(m.default || m) })))
const { Text } = Typography

/* =====================================================================
   React · 插槽 = children / 命名（多 props：ReactNode） / 作用域（render-prop）
   三种形态同时演示：
   1. 默认插槽 — CardContainer（children 默认分发）
   2. 命名插槽 — PageCard(title, extra, footer 都作为 props.ReactNode)
   3. 作用域插槽 — DataList：数据渲染交给父组件（renderItem render-prop）
   ===================================================================== */

// 1. 默认插槽
function CardContainer({ title, children, style }) {
  return (
    <div className="slot-card" style={style}>
      {title && <div className="slot-card__title">{title}</div>}
      <div className="slot-card__body">{children}</div>
    </div>
  )
}

// 2. 命名插槽（用多个 prop 代替 named slot）
function PageCard({ title, subtitle, extra, children, footer, avatar }) {
  return (
    <div className="slot-pagecard">
      <div className="spc-head">
        <div className="spc-head__left">
          {avatar}
          <div>
            <div className="spc-title">{title}</div>
            {subtitle && <div className="spc-sub">{subtitle}</div>}
          </div>
        </div>
        {extra && <div className="spc-head__right">{extra}</div>}
      </div>
      <div className="spc-body">{children}</div>
      {footer && <div className="spc-foot">{footer}</div>}
    </div>
  )
}

// 3. 作用域插槽（render-item / render prop）
function DataList({ dataSource, renderItem, empty = '暂无数据' }) {
  if (!dataSource?.length) return <div className="slot-empty">{empty}</div>
  return (
    <ul className="slot-list">
      {dataSource.map((row, idx) => (
        <li key={idx} className="slot-list__item">
          {renderItem(row, idx)}
        </li>
      ))}
    </ul>
  )
}

function ReactDemo() {
  const [liked, setLiked] = useState(false)
  const [rate, setRate] = useState(4)
  const products = [
    { id: 'A1', name: '键盘', price: 199, rating: 5 },
    { id: 'B2', name: '鼠标', price: 129, rating: 4 },
    { id: 'C3', name: '显示器', price: 1499, rating: 5 },
    { id: 'D4', name: 'USB Hub', price: 89, rating: 3 },
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">

      <div>
        <Tag color="blue">① 默认插槽：children</Tag>
        <CardContainer title="🎯 欢迎来到你的工作台" style={{ marginTop: 6 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>今天是美好的一天。子组件通过 props.children 直接渲染这整段。</Text>
            <Space>
              <Button>开始工作</Button>
              <Button type="primary">查看通知 3</Button>
            </Space>
          </Space>
        </CardContainer>
      </div>

      <div>
        <Tag color="magenta">② 命名插槽：多 ReactNode props（title / extra / footer / children）</Tag>
        <div style={{ marginTop: 6 }}>
          <PageCard
            avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />}
            title="Alice Chen"
            subtitle="前端工程师 · 5 年经验"
            extra={
              <Space>
                <Button size="small" icon={<SettingOutlined />}>设置</Button>
                <Button size="small" type="primary" danger ghost
                  onClick={() => setLiked(v => !v)}
                  icon={liked ? <HeartOutlined style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                >
                  {liked ? '已关注' : '关注'}
                </Button>
              </Space>
            }
            footer={
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
                <span>💬 评论：128</span>
                <span>🔁 转发：54</span>
                <span>👀 浏览：2.3k</span>
                <Rate value={rate} onChange={setRate} style={{ fontSize: 14 }} count={5} />
              </div>
            }
          >
            <p style={{ margin: 0, lineHeight: 1.8 }}>
              正在写一个 <Tag>React</Tag> + <Tag>Vite</Tag> + <Tag color="blue">Vue SFC</Tag> 混合项目，
              使用 <Text code>children / extra / footer</Text> 命名插槽分发内容，
              与 Vue 的 <Text code>&lt;slot name="..."&gt;</Text> 对应。
            </p>
          </PageCard>
        </div>
      </div>

      <div>
        <Tag color="purple">③ 作用域插槽：renderItem（render-prop）</Tag>
        <div style={{ marginTop: 6 }}>
          <DataList
            dataSource={products}
            empty="商品已售罄"
            renderItem={(it, idx) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Tag color="geekblue">#{idx + 1} {it.id}</Tag>
                  <Text strong style={{ marginLeft: 6 }}>{it.name}</Text>
                  &nbsp;<Rate value={it.rating} disabled style={{ fontSize: 12 }} count={5} />
                </div>
                <Tag color="volcano">¥{it.price}</Tag>
              </div>
            )}
          />
        </div>
      </div>
    </Space>
  )
}

/* ========== 页面 ========== */
export default function CompareSlot() {
  return (
    <CompareLayout
      title="插槽 / Children 分发"
      subtitle="React：children / 多 ReactNode props（named）/ renderItem render-prop（scoped）；Vue：默认 slot / named slot / scoped slot 带数据暴露。"
      tags={[
        { label: 'children · named · scoped' },
        { label: 'renderItem = scoped slot', color: 'volcano' },
        { label: '内容分发' },
      ]}
      reactDemo={<ReactDemo />}
      vueDemo={<SlotVue />}
      diffRows={[
        { title: '默认插槽', antd: 'props.children', vue: '<slot />' },
        { title: '命名插槽', antd: '多 props：title / header / footer 都是 ReactNode', vue: '<slot name="header" />\n<template #header>...</template>' },
        { title: '作用域插槽（列表渲染）', antd: 'renderItem={(row, idx) => <Item />} 或 itemRender 属性', vue: '<template #default="{ row, $index }">\n  直接使用 row / $index\n</template>' },
        { title: '回退内容（fallback）', antd: '在容器组件里写：children || 默认节点', vue: '<slot>默认内容</slot>' },
        { title: '多 slot + 数据', antd: '各 slot prop 接收 (scope) => ReactNode（函数式 slot）', vue: '<slot name="foot" :total="total" :count="count" />\n<template #foot="{ total, count }">' },
        { title: '应用场景', antd: '通用 Card / Modal / Table column / List itemRender', vue: '同左 + v-slot 指令全家桶' },
      ]}
      code={{
        antdCode:
`// ① 默认
function Card({ title, children }) {
  return <div>
    <h3>{title}</h3>
    <div className="body">{children}</div>
  </div>
}

// ② 命名
function Page({ title, extra, footer, children }) {
  return <Card
    title={<><Avatar/> {title}</>}
    extra={extra}
  >
    {children}
    {footer && <Foot>{footer}</Foot>}
  </Card>
}

// ③ 作用域
function DataList({ data, renderItem }) {
  return <ul>{data.map((row, i) => (
    <li key={i}>{renderItem(row, i)}</li>
  ))}</ul>
}
<DataList data={arr} renderItem={(row, i) => <Tag>{row.name}</Tag>}/>`,
        vueCode:
`<!-- ① 默认 -->
<template>
  <h3>{{ title }}</h3>
  <div class="body"><slot /></div>
</template>

<!-- ② 命名 -->
<template>
  <div class="page">
    <div class="head"><slot name="header" /></div>
    <div class="body"><slot /></div>
    <div class="foot"><slot name="footer" /></div>
  </div>
</template>
<PageCard>
  <template #header>
    <el-avatar /> <span>Alice</span>
  </template>
  <p>正文内容……默认 slot</p>
  <template #footer>底部操作</template>
</PageCard>

<!-- ③ 作用域：暴露 row / index 给父 -->
<!-- DataList.vue -->
<slot v-for="(row, i) in data"
      :key="i"
      :row="row" :index="i" />
<!-- 使用 -->
<DataList :data="products">
  <template #default="{ row, index }">
    <el-tag>#{{ index + 1 }} {{ row.name }} ¥{{ row.price }}</el-tag>
  </template>
</DataList>`,
      }}
    />
  )
}
