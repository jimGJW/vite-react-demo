import { useState, lazy } from 'react'
import { Input, Button, List, Tag, Divider, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { mountVueBridge } from '../../../utils/mountVueBridge.jsx'

const ParentChildVue = lazy(() => import('./demo-parent-child.vue').then((m) => ({ default: mountVueBridge(m.default || m) })))

/* =====================================================================
   React / Ant Design · 父子组件传值演示
   · 父 → 子：props
   · 子 → 父：回调 onXxx
   ===================================================================== */
function ReactTodoList({ title, items, onAdd, onRemove }) {
  const [text, setText] = useState('')
  return (
    <div>
      <h4 style={{ margin: '4px 0 8px' }}>
        Todo List（子组件）· 接收 props：<Tag color="blue">title = {title}</Tag>
      </h4>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="添加一条待办…"
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
            if (!text.trim()) { message.warning('不能为空'); return }
            onAdd(text.trim()); setText('')
          }}
        >添加</Button>
      </div>
      <List
        size="small"
        bordered
        dataSource={items}
        locale={{ emptyText: '暂无待办 — 子组件通过 onAdd 回调通知父组件' }}
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
  const [title] = useState('本季度 OKR')
  const [items, setItems] = useState([
    '完成 React-Vue 双框架集成',
    '落地组件化重构',
  ])
  const add = (v) => setItems(prev => [...prev, v])
  const remove = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div>
      <ReactTodoList title={title} items={items} onAdd={add} onRemove={remove} />
      <Divider style={{ margin: '14px 0' }} />
      <div style={{ fontSize: 12, color: '#666' }}>
        父组件 state：items.length = <Tag color="blue">{items.length}</Tag>
      </div>
    </div>
  )
}

/* ========== 页面 ========== */
export default function CompareParentChild() {
  return (
    <CompareLayout
      title="父子组件传值"
      subtitle="父→子：props（React）vs defineProps（Vue）；子→父：回调 vs 自定义 emit 事件。"
      tags={[
        { label: 'Props 单向数据流' },
        { label: 'onChange / emit' },
        { label: '状态提升' },
      ]}
      reactDemo={<ReactDemo />}
      vueDemo={<ParentChildVue />}
      diffRows={[
        { title: '父 → 子', antd: 'function Child(props) {/* props.title */}', vue: '<script setup>const props = defineProps([\'title\'])</script>' },
        { title: '子 → 父', antd: '<Child onAdd={(v)=>setList(l=>[...l,v])} />', vue: '<script setup>const emit = defineEmits([\'add\'])\nemit(\'add\', v)</script>' },
        { title: '默认值', antd: 'function Child({ title = \'默认\' }) {}', vue: 'withDefaults(defineProps({ title: { type: String, default: \'默认\' } }), {})' },
        { title: 'props 修改', antd: '直接不可变；通过回调让父改 state', vue: '直接不可变；v-model:xxx 是 emit(\'update:xxx\') 的语法糖' },
        { title: '事件命名', antd: 'props 回调 onXxx 驼峰', vue: 'emit(\'add\') kebab-case 模板 @add' },
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
