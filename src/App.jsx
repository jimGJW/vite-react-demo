import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/useAuth.js'
import Layout from './layouts/Layout.jsx'
import './App.scss'

/* —— 路由懒加载：每个页面独立 chunk，按需加载 —— */
const Home = lazy(() => import('./pages/Home/index.jsx'))
const About = lazy(() => import('./pages/About/index.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard/index.jsx'))
const ScanDemo = lazy(() => import('./pages/ScanDemo/index.jsx'))
const Embed = lazy(() => import('./pages/Embed/index.jsx'))
const Agent = lazy(() => import('./pages/Agent/index.jsx'))
const VoiceAssistant = lazy(() => import('./pages/VoiceAssistant/index.jsx'))
const FormBuilderDemo = lazy(() => import('./pages/FormBuilderDemo/index.jsx'))
const ThemeDemo = lazy(() => import('./pages/ThemeDemo/index.jsx'))
const ChartsDemo = lazy(() => import('./pages/ChartsDemo/index.jsx'))
const EChartsDemo = lazy(() => import('./pages/EChartsDemo/index.jsx'))
const AntdDemo = lazy(() => import('./pages/AntdDemo/index.jsx'))
const ChatBotDemo = lazy(() => import('./pages/ChatBotDemo/index.jsx'))
const ChatBotShare = lazy(() => import('./pages/ChatBotShare/index.jsx'))
const KitDemo = lazy(() => import('./pages/KitDemo/index.jsx'))
const StudioDemo = lazy(() => import('./pages/StudioDemo/index.jsx'))
const TemplatesDemo = lazy(() => import('./pages/TemplatesDemo/index.jsx'))
const UtilsDemo = lazy(() => import('./pages/UtilsDemo/index.jsx'))
/* Vue 3 SFC 页面：通过挂载桥加载真实的 .vue 文件
   注意：挂载桥必须在此处【动态】import，不能在模块顶层静态引入 ——
   挂载桥会连带引入 vue + element-plus（约 755KB），静态引入会让首屏强制下载整个 Vue 运行时。 */
const VueComponents = lazy(async () => {
  const [{ mountVueBridge }, mod] = await Promise.all([
    import('./utils/mountVueBridge.jsx'),
    import('./pages/VueComponents/VueComponents.vue'),
  ])
  return { default: mountVueBridge(mod.default) }
})
const StyleShowcase = lazy(async () => {
  const [{ mountVueBridge }, mod] = await Promise.all([
    import('./utils/mountVueBridge.jsx'),
    import('./pages/StyleShowcase/StyleShowcase.vue'),
  ])
  return { default: mountVueBridge(mod.default) }
})
/* Angular 22 standalone component 页面：通过挂载桥加载真实的 .ts 文件（同样按需加载） */
const AngularComponents = lazy(async () => {
  const [{ mountAngularBridge }, mod] = await Promise.all([
    import('./utils/mountAngularBridge.jsx'),
    import('./pages/AngularComponents/AngularComponents.ts'),
  ])
  return { default: mountAngularBridge(mod.default) }
})
const CommandPaletteDemo = lazy(() => import('./pages/CommandPaletteDemo/index.jsx'))
const NotifyDemo = lazy(() => import('./pages/NotifyDemo/index.jsx'))
const DataTableDemo = lazy(() => import('./pages/DataTableDemo/index.jsx'))
const TestCenterDemo = lazy(() => import('./pages/TestCenterDemo/index.jsx'))
const Login = lazy(() => import('./pages/Login/index.jsx'))
const NotFound = lazy(() => import('./pages/NotFound/index.jsx'))

/* —— 组件对比中心（6 个专题页）—— */
const CompareParentChild = lazy(() => import('./pages/Compare/ParentChild/index.jsx'))
const CompareTwoWay      = lazy(() => import('./pages/Compare/TwoWay/index.jsx'))
const CompareProvide     = lazy(() => import('./pages/Compare/Provide/index.jsx'))
const CompareState       = lazy(() => import('./pages/Compare/State/index.jsx'))
const CompareSlot        = lazy(() => import('./pages/Compare/Slot/index.jsx'))
const CompareRef         = lazy(() => import('./pages/Compare/Ref/index.jsx'))

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
          <Route path="chatbot" element={<ChatBotDemo />} />
          <Route path="share" element={<ChatBotShare />} />
          <Route path="kit" element={<KitDemo />} />
          <Route path="studio" element={<StudioDemo />} />
          <Route path="templates" element={<TemplatesDemo />} />
          <Route path="utils" element={<UtilsDemo />} />
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
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
