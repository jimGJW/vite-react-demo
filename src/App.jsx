import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/useAuth.js'
import { AssistantProvider } from './components/Assistants/index.jsx'
import Layout from './layouts/Layout.jsx'
import { mountVueBridge } from './utils/mountVueBridge.jsx'
import { mountAngularBridge } from './utils/mountAngularBridge.jsx'
import './App.scss'

/* —— 路由懒加载：每个页面独立 chunk，按需加载 ——
   每个页面同时导出 loader 函数，便于空闲时预热（prefetch），消除跳转时的加载延迟 */
const loadHome = () => import('./pages/Home/index.jsx')
const loadAbout = () => import('./pages/About/index.jsx')
const loadDashboard = () => import('./pages/Dashboard/index.jsx')
const loadScanDemo = () => import('./pages/ScanDemo/index.jsx')
const loadEmbed = () => import('./pages/Embed/index.jsx')
const loadAgent = () => import('./pages/Agent/index.jsx')
const loadVoiceAssistant = () => import('./pages/VoiceAssistant/index.jsx')
const loadFormBuilderDemo = () => import('./pages/FormBuilderDemo/index.jsx')
const loadThemeDemo = () => import('./pages/ThemeDemo/index.jsx')
const loadChartsDemo = () => import('./pages/ChartsDemo/index.jsx')
const loadEChartsDemo = () => import('./pages/EChartsDemo/index.jsx')
const loadAntdDemo = () => import('./pages/AntdDemo/index.jsx')
const loadCommandPaletteDemo = () => import('./pages/CommandPaletteDemo/index.jsx')
const loadNotifyDemo = () => import('./pages/NotifyDemo/index.jsx')
const loadDataTableDemo = () => import('./pages/DataTableDemo/index.jsx')
const loadTestCenterDemo = () => import('./pages/TestCenterDemo/index.jsx')
const loadAssistantDemo = () => import('./pages/AssistantDemo/index.jsx')
const loadLogin = () => import('./pages/Login/index.jsx')
const loadNotFound = () => import('./pages/NotFound/index.jsx')
const loadCompareParentChild = () => import('./pages/Compare/ParentChild/index.jsx')
const loadCompareTwoWay = () => import('./pages/Compare/TwoWay/index.jsx')
const loadCompareProvide = () => import('./pages/Compare/Provide/index.jsx')
const loadCompareState = () => import('./pages/Compare/State/index.jsx')
const loadCompareSlot = () => import('./pages/Compare/Slot/index.jsx')
const loadCompareRef = () => import('./pages/Compare/Ref/index.jsx')

const Home = lazy(loadHome)
const About = lazy(loadAbout)
const Dashboard = lazy(loadDashboard)
const ScanDemo = lazy(loadScanDemo)
const Embed = lazy(loadEmbed)
const Agent = lazy(loadAgent)
const VoiceAssistant = lazy(loadVoiceAssistant)
const FormBuilderDemo = lazy(loadFormBuilderDemo)
const ThemeDemo = lazy(loadThemeDemo)
const ChartsDemo = lazy(loadChartsDemo)
const EChartsDemo = lazy(loadEChartsDemo)
const AntdDemo = lazy(loadAntdDemo)
/* Vue 3 SFC 页面：通过挂载桥加载真实的 .vue 文件 */
const loadVueComponents = () =>
  import('./pages/VueComponents/VueComponents.vue').then((mod) => ({
    default: mountVueBridge(mod.default),
  }))
const VueComponents = lazy(loadVueComponents)
const loadStyleShowcase = () =>
  import('./pages/StyleShowcase/StyleShowcase.vue').then((mod) => ({
    default: mountVueBridge(mod.default),
  }))
const StyleShowcase = lazy(loadStyleShowcase)
/* Angular 22 standalone component 页面：通过挂载桥加载真实的 .ts 文件 */
const loadAngularComponents = () =>
  import('./pages/AngularComponents/AngularComponents.ts').then((mod) => ({
    default: mountAngularBridge(mod.default),
  }))
const AngularComponents = lazy(loadAngularComponents)
const CommandPaletteDemo = lazy(loadCommandPaletteDemo)
const NotifyDemo = lazy(loadNotifyDemo)
const DataTableDemo = lazy(loadDataTableDemo)
const TestCenterDemo = lazy(loadTestCenterDemo)
const AssistantDemo = lazy(loadAssistantDemo)
const Login = lazy(loadLogin)
const NotFound = lazy(loadNotFound)
const CompareParentChild = lazy(loadCompareParentChild)
const CompareTwoWay = lazy(loadCompareTwoWay)
const CompareProvide = lazy(loadCompareProvide)
const CompareState = lazy(loadCompareState)
const CompareSlot = lazy(loadCompareSlot)
const CompareRef = lazy(loadCompareRef)

/* 空闲时预热所有路由 chunk，跳转时无需等待网络加载（消除“跳转延迟严重”） */
const allLoaders = [
  loadHome, loadAbout, loadDashboard, loadScanDemo, loadEmbed, loadAgent,
  loadVoiceAssistant, loadFormBuilderDemo, loadThemeDemo, loadChartsDemo,
  loadEChartsDemo, loadAntdDemo, loadCommandPaletteDemo, loadNotifyDemo,
  loadDataTableDemo, loadTestCenterDemo, loadAssistantDemo, loadLogin,
  loadNotFound, loadCompareParentChild, loadCompareTwoWay, loadCompareProvide,
  loadCompareState, loadCompareSlot, loadCompareRef,
  loadVueComponents, loadStyleShowcase, loadAngularComponents,
]
if (typeof window !== 'undefined') {
  const idle = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 300))
  idle(() => {
    allLoaders.forEach((fn) => { try { fn() } catch { /* 预热失败可忽略 */ } })
  })
}

/* —— 加载态 —— */
function PageLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--c-border-soft, #f0f0f0)', borderTopColor: 'var(--c-primary, #1677ff)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/**
 * 路由守卫：未登录跳转 /login，并记住来源路径，登录后原路返回。
 * 会话尚未从 localStorage 恢复完成时，先空白，避免闪烁。
 */
function RequireAuth({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return null
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

function App() {
  const handleAgentExecute = (task, result) => {
    console.log('Agent 执行完成:', task, result)
  }
  return (
    /* 助手中心 Provider 提到路由外层，任意页面都可用 useAssistants() 唤起弹窗 */
    <AssistantProvider>
      <Suspense fallback={<PageLoading />}>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scan" element={<ScanDemo />} />
          <Route path="embed" element={<Embed />} />
          <Route path="agent" element={<Agent onAgentExecute={handleAgentExecute} />} />
          <Route path="voice" element={<VoiceAssistant />} />
          <Route path="form-builder" element={<FormBuilderDemo />} />
          <Route path="theme" element={<ThemeDemo />} />
          <Route path="charts" element={<ChartsDemo />} />
          <Route path="echarts" element={<EChartsDemo />} />
          <Route path="antd" element={<AntdDemo />} />
          <Route path="vue-components" element={<VueComponents />} />
          <Route path="style-showcase" element={<StyleShowcase />} />
          <Route path="angular-components" element={<AngularComponents />} />
          {/* 组件对比中心：6 个专题 */}
          <Route path="compare-parent-child" element={<CompareParentChild />} />
          <Route path="compare-two-way"      element={<CompareTwoWay />} />
          <Route path="compare-provide"      element={<CompareProvide />} />
          <Route path="compare-state"        element={<CompareState />} />
          <Route path="compare-slot"         element={<CompareSlot />} />
          <Route path="compare-ref"          element={<CompareRef />} />
          <Route path="command-palette" element={<CommandPaletteDemo />} />
          <Route path="notify" element={<NotifyDemo />} />
          <Route path="data-table" element={<DataTableDemo />} />
          <Route path="test-center" element={<TestCenterDemo />} />
          <Route path="assistant-demo" element={<AssistantDemo />} />
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
        </Routes>
      </Suspense>
    </AssistantProvider>
  )
}

export default App
