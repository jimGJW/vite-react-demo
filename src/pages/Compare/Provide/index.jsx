import { createContext, useContext, useState, lazy } from 'react'
import { Button, Space, Card, Typography, Tag } from 'antd'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { mountVueBridge } from '../../../utils/mountVueBridge.jsx'

const ProvideVue = lazy(() => import('./demo-provide.vue').then((m) => ({ default: mountVueBridge(m.default || m) })))

const { Text, Paragraph } = Typography

/* =====================================================================
   React · Provide/Inject 等价能力 = createContext + Provider + useContext
   3 层嵌套：GrandPa → Father → Child（孙组件直接读取 Context）
   ===================================================================== */
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  user: null,
})
const useThemeCtx = () => useContext(ThemeContext)

/* —— 子组件（第 3 层）：直接用 useContext，不用逐层 props —— */
function Child() {
  const { theme, user, toggleTheme } = useThemeCtx()
  return (
    <Card
      size="small"
      type="inner"
      title={<><Tag color="purple">第 3 层 · Child</Tag> 直接 useContext()</>}
    >
      <Paragraph style={{ margin: 0 }}>
        theme：<Tag color={theme === 'dark' ? 'default' : 'gold'}>{theme}</Tag>
        &nbsp;&nbsp;用户：<Tag color="blue">{user?.name ?? '未登录'}</Tag>
      </Paragraph>
      <Button size="small" onClick={toggleTheme} style={{ marginTop: 8 }}>
        孙组件触发「切换主题」
      </Button>
    </Card>
  )
}
/* —— 第 2 层：完全不关心 props —— */
function Father() {
  return (
    <Card size="small" title={<Tag color="cyan">第 2 层 · Father（无 props，透传）</Tag>}
      style={{ marginTop: 10 }}>
      <Child />
    </Card>
  )
}

function ReactDemo() {
  const [theme, setTheme] = useState('light')
  const user = { name: 'Alice', role: 'admin' }
  const value = {
    theme,
    user,
    toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
  }
  const panelBg = theme === 'dark' ? '#1f1f1f' : '#f5f7fa'
  const panelColor = theme === 'dark' ? '#eee' : '#222'

  return (
    <ThemeContext.Provider value={value}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card
          size="small"
          title={<><Tag color="blue">第 1 层 · GrandPa（Provider）</Tag>
            <Button size="small" type="primary" ghost onClick={value.toggleTheme}>切换主题</Button></>}
          style={{ background: panelBg, color: panelColor }}
        >
          <Text style={{ color: panelColor }}>
            createContext = &#123; theme, user, toggleTheme &#125;
          </Text>
          <Father />
        </Card>
      </Space>
    </ThemeContext.Provider>
  )
}

/* ========== 页面 ========== */
export default function CompareProvide() {
  return (
    <CompareLayout
      title="跨层传值 (Provide / Inject)"
      subtitle="避免层层 props 钻穿：React 用 createContext + Provider + useContext；Vue 用 provide / inject + readonly 防篡改。"
      tags={[
        { label: 'Props drilling' },
        { label: 'Context / provide/inject' },
        { label: '依赖注入', color: 'purple' },
      ]}
      reactDemo={<ReactDemo />}
      vueDemo={<ProvideVue />}
      diffRows={[
        { title: '声明「注入点」', antd: 'const Ctx = createContext(defaultValue)', vue: 'setup() 顶层：provide(\'key\', value)，或在根 app.provide()' },
        { title: '提供值', antd: '<Ctx.Provider value={...}>\n  {children}\n</Ctx.Provider>', vue: 'provide(\'theme\', { cur, setCur, user })' },
        { title: '消费值', antd: 'const { theme } = useContext(Ctx)', vue: 'const theme = inject(\'theme\', defaultVal)' },
        { title: '默认值机制', antd: 'createContext(default)；未被 Provider 包裹时返回 default', vue: 'inject(key, default)，第二个参数即默认值' },
        { title: '响应式', antd: 'Provider value 引用变化（setState）→ 所有 consumer re-render', vue: 'provide 传入 ref/reactive → inject 自动响应' },
        { title: '修改安全', antd: 'Context 值可以是任何结构；自行约定只通过回调改', vue: 'provide(key, readonly(state)) 禁止子组件直接修改' },
      ]}
      code={{
        antdCode:
`// 1. 定义
const ThemeCtx = createContext(default)
const useThemeCtx = () => useContext(ThemeCtx)

// 2. 顶层 Provider
function App() {
  const [t, setT] = useState('light')
  return (
    <ThemeCtx.Provider value={{ t, setT }}>
      <GrandPa />
    </ThemeCtx.Provider>
  )
}

// 3. 任意深层消费（中间层 Father 无需关心）
function Child() {
  const { t, setT } = useThemeCtx()
  return <Tag>{t}</Tag>
}`,
        vueCode:
`<!-- 顶层 / 任意祖先 -->
<script setup>
  const theme = reactive({ cur: 'light', user: {...} })
  provide('theme', readonly(theme))   // 子组件只读
  provide('setTheme', (v)=>theme.cur=v)
</script>

<!-- 任意后代：Father 完全不用管 -->
<script setup>
  const theme = inject('theme')
  const setTheme = inject('setTheme')
</script>
<template>
  <el-tag>{{ theme.cur }}</el-tag>
  <el-button @click="setTheme('dark')">切换</el-button>
</template>`,
      }}
    />
  )
}
