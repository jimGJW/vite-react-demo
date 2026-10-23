import { useState } from 'react'
import { Input, Switch, Slider, Space, Tag, Divider, Typography } from 'antd'
import CompareLayout from '@/utils/CompareLayout.jsx'
import { useI18n } from '@i18n/index.js'


const { Text } = Typography

/* =====================================================================
   React · 双向绑定演示：受控组件 = value + onChange
   - 输入框
   - 开关
   - 滑块
   - 自定义组件：实现类似 v-model 的 value/onChange 约定
   ===================================================================== */
function CustomCounter({ value, onChange, label }) {
  const { t } = useI18n()
  const dec = () => onChange?.(value - 1)
  const inc = () => onChange?.(value + 1)
  return (
    <Space.Compact>
      <button className="btn-mini" onClick={dec}>-</button>
      <div className="input-mini">{value}</div>
      <button className="btn-mini" onClick={inc}>+</button>
      <Tag style={{ marginLeft: 8 }}>{label || t('compare.twoWay.customCounterLabel')}</Tag>
    </Space.Compact>
  )
}

function ReactDemo() {
  const { t } = useI18n()
  const [name, setName] = useState(t('compare.twoWay.demoName'))
  const [enabled, setEnabled] = useState(true)
  const [volume, setVolume] = useState(60)
  const [count, setCount] = useState(3)

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Text strong>{t('compare.twoWay.nameLabel')}</Text>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          allowClear
          placeholder={t('compare.twoWay.namePlaceholder')}
          style={{ width: 200, marginLeft: 8 }}
        />
        <Tag color="blue" style={{ marginLeft: 8 }}>Hello, {name}!</Tag>
      </div>
      <div>
        <Text strong>{t('compare.twoWay.enableLabel')}</Text>
        <Switch
          checked={enabled}
          onChange={v => setEnabled(v)}
          style={{ marginLeft: 8 }}
        />
        <Tag color={enabled ? 'green' : 'default'} style={{ marginLeft: 8 }}>
          {t('compare.twoWay.currentLabel')}{enabled ? t('compare.twoWay.enabledText') : t('compare.twoWay.disabledText')}
        </Tag>
      </div>
      <div>
        <Text strong>{t('compare.twoWay.volumeLabel')}</Text>
        <Slider
          value={volume}
          onChange={v => setVolume(v)}
          style={{ width: 240, display: 'inline-block', marginLeft: 8 }}
        />
        <Tag color="geekblue">{volume}%</Tag>
      </div>

      <Divider style={{ margin: '6px 0' }} />

      <div>
        <Text strong>{t('compare.twoWay.customLabel')}</Text>
      </div>
      <CustomCounter value={count} onChange={setCount} label={t('compare.twoWay.parentStateLabel')} />
      <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>
        {t('compare.twoWay.parentCount')} <Tag color="purple">{count}</Tag>
        &nbsp;{t('compare.twoWay.controlledNote')}
      </div>
    </Space>
  )
}

/* ========== 页面 ========== */
export default function CompareTwoWay() {
  const { t } = useI18n()
  return (
    <CompareLayout
      title={t('compare.twoWay.title')}
      subtitle={t('compare.twoWay.subtitle')}
      tags={[
        { label: t('compare.twoWay.tagSugar'), color: 'magenta' },
        { label: t('compare.twoWay.tagMulti') },
        { label: t('compare.twoWay.tagState') },
      ]}
      reactDemo={<ReactDemo />}
      vueAppPath="/pattern/two-way"
      diffRows={[
        { title: t('compare.twoWay.diff.input.title'), antd: t('compare.twoWay.diff.input.antd'), vue: t('compare.twoWay.diff.input.vue') },
        { title: t('compare.twoWay.diff.switch.title'), antd: t('compare.twoWay.diff.switch.antd'), vue: t('compare.twoWay.diff.switch.vue') },
        { title: t('compare.twoWay.diff.custom.title'), antd: t('compare.twoWay.diff.custom.antd'), vue: t('compare.twoWay.diff.custom.vue') },
        { title: t('compare.twoWay.diff.multiField.title'), antd: t('compare.twoWay.diff.multiField.antd'), vue: t('compare.twoWay.diff.multiField.vue') },
        { title: t('compare.twoWay.diff.modifier.title'), antd: t('compare.twoWay.diff.modifier.antd'), vue: t('compare.twoWay.diff.modifier.vue') },
        { title: t('compare.twoWay.diff.essence.title'), antd: t('compare.twoWay.diff.essence.antd'), vue: t('compare.twoWay.diff.essence.vue') },
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
