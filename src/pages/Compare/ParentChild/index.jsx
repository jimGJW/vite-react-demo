import { useState } from 'react'
import { Input, Button, List, Tag, Divider, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import CompareLayout from '@/utils/CompareLayout.jsx'
import { useI18n } from '@i18n/index.js'


/* =====================================================================
   React / Ant Design · 父子组件传值演示
   · 父 → 子：props
   · 子 → 父：回调 onXxx
   ===================================================================== */
function ReactTodoList({ title, items, onAdd, onRemove }) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  return (
    <div>
      <h4 style={{ margin: '4px 0 8px' }}>
        {t('compare.parentChild.receiveProps')}<Tag color="blue">title = {title}</Tag>
      </h4>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('compare.parentChild.inputPlaceholder')}
          onPressEnter={() => {
            if (!text.trim()) return
            onAdd(text.trim())
            setText('')
          }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            if (!text.trim()) { message.warning(t('compare.parentChild.emptyWarn')); return }
            onAdd(text.trim()); setText('')
          }}
        >{t('compare.parentChild.addButton')}</Button>
      </div>
      <List
        size="small"
        bordered
        dataSource={items}
        locale={{ emptyText: t('compare.parentChild.emptyText') }}
        renderItem={(it, idx) => (
          <List.Item
            actions={[
              <Button
                size="small"
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => onRemove(idx)}
                key="d"
              />
            ]}
          >
            <span>#{idx + 1}&nbsp;&nbsp;{it}</span>
          </List.Item>
        )}
      />
    </div>
  )
}

function ReactDemo() {
  const { t } = useI18n()
  const [title] = useState(t('compare.parentChild.demoTitle'))
  const [items, setItems] = useState(() => [
    t('compare.parentChild.item1'),
    t('compare.parentChild.item2'),
  ])
  const add = (v) => setItems(prev => [...prev, v])
  const remove = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div>
      <ReactTodoList title={title} items={items} onAdd={add} onRemove={remove} />
      <Divider style={{ margin: '14px 0' }} />
      <div style={{ fontSize: 12, color: '#666' }}>
        {t('compare.parentChild.parentState')} <Tag color="blue">{items.length}</Tag>
      </div>
    </div>
  )
}

/* ========== 页面 ========== */
export default function CompareParentChild() {
  const { t } = useI18n()
  return (
    <CompareLayout
      title={t('compare.parentChild.title')}
      subtitle={t('compare.parentChild.subtitle')}
      tags={[
        { label: t('compare.parentChild.tagProps') },
        { label: t('compare.parentChild.tagEmit') },
        { label: t('compare.parentChild.tagLift') },
      ]}
      reactDemo={<ReactDemo />}
      vueAppPath="/pattern/parent-child"
      diffRows={[
        { title: t('compare.parentChild.diff.fatherToChild.title'), antd: t('compare.parentChild.diff.fatherToChild.antd'), vue: t('compare.parentChild.diff.fatherToChild.vue') },
        { title: t('compare.parentChild.diff.childToFather.title'), antd: t('compare.parentChild.diff.childToFather.antd'), vue: t('compare.parentChild.diff.childToFather.vue') },
        { title: t('compare.parentChild.diff.defaultValue.title'), antd: t('compare.parentChild.diff.defaultValue.antd'), vue: t('compare.parentChild.diff.defaultValue.vue') },
        { title: t('compare.parentChild.diff.propsModify.title'), antd: t('compare.parentChild.diff.propsModify.antd'), vue: t('compare.parentChild.diff.propsModify.vue') },
        { title: t('compare.parentChild.diff.eventNaming.title'), antd: t('compare.parentChild.diff.eventNaming.antd'), vue: t('compare.parentChild.diff.eventNaming.vue') },
      ]}
      code={{
        antdCode:
`// 父
const [items, setItems] = useState([])
const add = v => setItems(p => [...p, v])

<TodoList title={title} items={items}
          onAdd={add} onRemove={remove} />

// 子
function TodoList({ title, items, onAdd, onRemove }) {
  const [t, setT] = useState('')
  return (
    <Input value={t} onChange={e=>setT(e.target.value)} />
    <Button onClick={()=>onAdd(t)}>添加</Button>
    <List dataSource={items} renderItem={(it,i)=>(
      <List.Item actions={[
        <Button onClick={()=>onRemove(i)} />
      ]}>{it}</List.Item>
    )}/>
  )
}`,
        vueCode:
`<!-- 父 -->
<TodoList :title="title" :items="items"
          @add="add" @remove="remove" />

<!-- 子 TodoList.vue -->
<script setup>
  const props = defineProps(['title', 'items'])
  const emit  = defineEmits(['add', 'remove'])
  const text  = ref('')
  const submit = () => { emit('add', text.value); text.value='' }
</script>
<template>
  <el-input v-model="text" @keyup.enter="submit" />
  <el-button type="primary" @click="submit">添加</el-button>
  <el-table :data="items">
    <el-table-column prop="idx" label="#" width="60" />
    <el-table-column prop="text" label="内容" />
    <el-table-column label="操作" width="80">
      <template #default="{ $index }">
        <el-button link type="danger" @click="emit('remove', $index)">删</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>`,
      }}
    />
  )
}
