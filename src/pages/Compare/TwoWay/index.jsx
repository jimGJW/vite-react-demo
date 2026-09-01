import { useState, lazy } from 'react'
import { Input, Switch, Slider, Space, Tag, Divider, Typography } from 'antd'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { mountVueBridge } from '../../../utils/mountVueBridge.jsx'

const TwoWayVue = lazy(() => import('./demo-two-way.vue').then((m) => ({ default: mountVueBridge(m.default || m) })))

const { Text } = Typography

/* =====================================================================
   React · 双向绑定演示：受控组件 = value + onChange
   - 输入框
   - 开关
   - 滑块
   - 自定义组件：实现类似 v-model 的 value/onChange 约定
   ===================================================================== */
function CustomCounter({ value, onChange, label = '自定义计数器' }) {
  const dec = () => onChange?.(value - 1)
  const inc = () => onChange?.(value + 1)
  return (
    <Space.Compact>
      <button className="btn-mini" onClick={dec}>-</button>
      <div className="input-mini">{value}</div>
      <button className="btn-mini" onClick={inc}>+</button>
      <Tag style={{ marginLeft: 8 }}>{label}</Tag>
    </Space.Compact>
  )
}

function ReactDemo() {
  const [name, setName] = useState('张三')
  const [enabled, setEnabled] = useState(true)
  const [volume, setVolume] = useState(60)
  const [count, setCount] = useState(3)

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Text strong>姓名：</Text>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          allowClear
          placeholder="请输入姓名"
          style={{ width: 200, marginLeft: 8 }}
        />
        <Tag color="blue" style={{ marginLeft: 8 }}>Hello, {name}!</Tag>
      </div>
      <div>
        <Text strong>启用功能：</Text>
        <Switch
          checked={enabled}
          onChange={v => setEnabled(v)}
          style={{ marginLeft: 8 }}
        />
        <Tag color={enabled ? 'green' : 'default'} style={{ marginLeft: 8 }}>
          当前：{enabled ? '已启用' : '已禁用'}
        </Tag>
      </div>
      <div>
        <Text strong>音量：</Text>
        <Slider
          value={volume}
          onChange={v => setVolume(v)}
          style={{ width: 240, display: 'inline-block', marginLeft: 8 }}
        />
        <Tag color="geekblue">{volume}%</Tag>
      </div>

      <Divider style={{ margin: '6px 0' }} />

      <div>
        <Text strong>自定义组件双向绑定（value + onChange）：</Text>
      </div>
      <CustomCounter value={count} onChange={setCount} label="父组件 state" />
      <div style={{ fontSize: 12, color: '#666' }}>
        父组件 count = <Tag color="purple">{count}</Tag>
        &nbsp;（子组件内部没有自己的状态，完全受控）
      </div>
    </Space>
  )
}

/* ========== 页面 ========== */
export default function CompareTwoWay() {
  return (
    <CompareLayout
      title="双向绑定"
      subtitle="React：受控组件（value + onChange）显式绑定；Vue：v-model 语法糖（:modelValue + @update:modelValue）。"
      tags={[
        { label: '受控 vs 语法糖', color: 'magenta' },
        { label: 'v-model:xxx 多字段' },
        { label: 'useState / ref' },
      ]}
      reactDemo={<ReactDemo />}
      vueDemo={<TwoWayVue />}
      diffRows={[
        { title: '输入框', antd: 'value={x} onChange={e=>setX(e.target.value)}', vue: 'v-model="x"' },
        { title: '开关', antd: 'checked={x} onChange={setX}', vue: 'v-model="x" (组件内部约定 checked)' },
        { title: '自定义组件 (单值)', antd: 'value={n} onChange={setN}', vue: '<Counter v-model="n" />  → props.modelValue + emit(\'update:modelValue\')' },
        { title: '多字段双向绑定', antd: '逐字段 value/a/b/c + onChangeXxx', vue: 'v-model:title / v-model:visible / v-model:count' },
        { title: '修改修饰符', antd: 'onChange 里 trim/lowercase 自己写', vue: '.trim .number .lazy，defineModel({ trim: true })' },
        { title: '本质', antd: '单向数据流；手动 onChange 驱动', vue: '单向数据流（props只读 + emit）；v-model 是语法糖' },
      ]}
      code={{
        antdCode:
`// 受控组件：value + onChange
const [name, setName] = useState('')
<Input value={name}
       onChange={e => setName(e.target.value)} />

// 自定义组件：value + onChange 约定
function Counter({ value, onChange }) {
  return <>
    <button onClick={() => onChange(value - 1)}>-</button>
    <span>{value}</span>
    <button onClick={() => onChange(value + 1)}>+</button>
  </>
}
<Counter value={n} onChange={setN} />`,
        vueCode:
`<!-- 单值 -->
<el-input v-model.trim="name" />
<el-switch v-model="enabled" />
<el-slider v-model.number="volume" />

<!-- 自定义组件：v-model = :modelValue + @update:modelValue -->
<Counter v-model="n" />
<!-- Counter.vue -->
<script setup>
  const n = defineModel() // 3.4+ defineModel
  // 或显式：
  // const props = defineProps(['modelValue'])
  // const emit  = defineEmits(['update:modelValue'])
</script>
<template>
  <button @click="n--">-</button>
  <span>{{ n }}</span>
  <button @click="n++">+</button>
</template>`,
      }}
    />
  )
}
