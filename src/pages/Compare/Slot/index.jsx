import { useState } from 'react'
import { Button, Space, Tag, Typography, Rate, Avatar } from 'antd'
import {
  UserOutlined, SettingOutlined, HeartOutlined,
} from '@ant-design/icons'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { useI18n } from '../../../i18n/index.js'

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
function DataList({ dataSource, renderItem, empty }) {
  const { t } = useI18n()
  if (!dataSource?.length) return <div className="slot-empty">{empty ?? t('compare.slot.noData')}</div>
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
  const { t } = useI18n()
  const [liked, setLiked] = useState(false)
  const [rate, setRate] = useState(4)
  const products = [
    { id: 'A1', name: t('compare.slot.productKeyboard'), price: 199, rating: 5 },
    { id: 'B2', name: t('compare.slot.productMouse'), price: 129, rating: 4 },
    { id: 'C3', name: t('compare.slot.productMonitor'), price: 1499, rating: 5 },
    { id: 'D4', name: 'USB Hub', price: 89, rating: 3 },
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">

      <div>
        <Tag color="blue">{t('compare.slot.defaultSlot')}</Tag>
        <CardContainer title={t('compare.slot.welcome')} style={{ marginTop: 6 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>{t('compare.slot.todayText')}</Text>
            <Space>
              <Button>{t('compare.slot.startWork')}</Button>
              <Button type="primary">{t('compare.slot.viewNotify')}</Button>
            </Space>
          </Space>
        </CardContainer>
      </div>

      <div>
        <Tag color="magenta">{t('compare.slot.namedSlot')}</Tag>
        <div style={{ marginTop: 6 }}>
          <PageCard
            avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />}
            title="Alice Chen"
            subtitle={t('compare.slot.subtitle2')}
            extra={
              <Space>
                <Button size="small" icon={<SettingOutlined />}>{t('compare.slot.setting')}</Button>
                <Button size="small" type="primary" danger ghost
                  onClick={() => setLiked(v => !v)}
                  icon={liked ? <HeartOutlined style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                >
                  {liked ? t('compare.slot.followed') : t('compare.slot.follow')}
                </Button>
              </Space>
            }
            footer={
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
                <span>{t('compare.slot.comment')}</span>
                <span>{t('compare.slot.repost')}</span>
                <span>{t('compare.slot.view')}</span>
                <Rate value={rate} onChange={setRate} style={{ fontSize: 14 }} count={5} />
              </div>
            }
          >
            <p style={{ margin: 0, lineHeight: 1.8 }}>
              {t('compare.slot.bodyPre')} <Tag>React</Tag> + <Tag>Vite</Tag> + <Tag color="blue">Vue SFC</Tag> {t('compare.slot.bodyMid1')}
              {t('compare.slot.bodyUse')} <Text code>children / extra / footer</Text> {t('compare.slot.bodyMid2')}
              {t('compare.slot.bodyVue')} <Text code>&lt;slot name="..."&gt;</Text> {t('compare.slot.bodyEnd')}
            </p>
          </PageCard>
        </div>
      </div>

      <div>
        <Tag color="purple">{t('compare.slot.scopedSlot')}</Tag>
        <div style={{ marginTop: 6 }}>
          <DataList
            dataSource={products}
            empty={t('compare.slot.soldOut')}
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
  const { t } = useI18n()
  return (
    <CompareLayout
      title={t('compare.slot.title')}
      subtitle={t('compare.slot.subtitle')}
      tags={[
        { label: t('compare.slot.tagChildren') },
        { label: t('compare.slot.tagRender'), color: 'volcano' },
        { label: t('compare.slot.tagDistribute') },
      ]}
      reactDemo={<ReactDemo />}
      vueAppPath="/pattern/slot"
      diffRows={[
        { title: t('compare.slot.diff.default.title'), antd: t('compare.slot.diff.default.antd'), vue: t('compare.slot.diff.default.vue') },
        { title: t('compare.slot.diff.named.title'), antd: t('compare.slot.diff.named.antd'), vue: t('compare.slot.diff.named.vue') },
        { title: t('compare.slot.diff.scoped.title'), antd: t('compare.slot.diff.scoped.antd'), vue: t('compare.slot.diff.scoped.vue') },
        { title: t('compare.slot.diff.fallback.title'), antd: t('compare.slot.diff.fallback.antd'), vue: t('compare.slot.diff.fallback.vue') },
        { title: t('compare.slot.diff.multiSlot.title'), antd: t('compare.slot.diff.multiSlot.antd'), vue: t('compare.slot.diff.multiSlot.vue') },
        { title: t('compare.slot.diff.scenario.title'), antd: t('compare.slot.diff.scenario.antd'), vue: t('compare.slot.diff.scenario.vue') },
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
