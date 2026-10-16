import { createContext, useContext, useState } from 'react'
import { Button, Space, Card, Typography, Tag } from 'antd'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { useI18n } from '../../../i18n/index.js'


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
  const { t } = useI18n()
  const { theme, user, toggleTheme } = useThemeCtx()
  return (
    <Card
      size="small"
      type="inner"
      title={<><Tag color="purple">{t('compare.provide.childLayer')}</Tag> {t('compare.provide.childDirect')}</>}
    >
      <Paragraph style={{ margin: 0 }}>
        {t('compare.provide.themeLabel')}<Tag color={theme === 'dark' ? 'default' : 'gold'}>{theme}</Tag>
        &nbsp;&nbsp;{t('compare.provide.userLabel')}<Tag color="blue">{user?.name ?? t('compare.provide.notLoggedIn')}</Tag>
      </Paragraph>
      <Button size="small" onClick={toggleTheme} style={{ marginTop: 8 }}>
        {t('compare.provide.grandchildToggle')}
      </Button>
    </Card>
  )
}
/* —— 第 2 层：完全不关心 props —— */
function Father() {
  const { t } = useI18n()
  return (
    <Card size="small" title={<Tag color="cyan">{t('compare.provide.fatherLayer')}</Tag>}
      style={{ marginTop: 10 }}>
      <Child />
    </Card>
  )
}

function ReactDemo() {
  const { t } = useI18n()
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
          title={<><Tag color="blue">{t('compare.provide.grandpaLayer')}</Tag>
            <Button size="small" type="primary" ghost onClick={value.toggleTheme}>{t('compare.provide.toggleTheme')}</Button></>}
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
  const { t } = useI18n()
  return (
    <CompareLayout
      title={t('compare.provide.title')}
      subtitle={t('compare.provide.subtitle')}
      tags={[
        { label: t('compare.provide.tagDrilling') },
        { label: t('compare.provide.tagContext') },
        { label: t('compare.provide.tagDi'), color: 'purple' },
      ]}
      reactDemo={<ReactDemo />}
      vueAppPath="/pattern/provide"
      diffRows={[
        { title: t('compare.provide.diff.injectPoint.title'), antd: t('compare.provide.diff.injectPoint.antd'), vue: t('compare.provide.diff.injectPoint.vue') },
        { title: t('compare.provide.diff.provide.title'), antd: t('compare.provide.diff.provide.antd'), vue: t('compare.provide.diff.provide.vue') },
        { title: t('compare.provide.diff.consume.title'), antd: t('compare.provide.diff.consume.antd'), vue: t('compare.provide.diff.consume.vue') },
        { title: t('compare.provide.diff.default.title'), antd: t('compare.provide.diff.default.antd'), vue: t('compare.provide.diff.default.vue') },
        { title: t('compare.provide.diff.reactive.title'), antd: t('compare.provide.diff.reactive.antd'), vue: t('compare.provide.diff.reactive.vue') },
        { title: t('compare.provide.diff.safe.title'), antd: t('compare.provide.diff.safe.antd'), vue: t('compare.provide.diff.safe.vue') },
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
