import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Layout from './layouts/Layout.jsx'
import Home from './pages/Home/index.jsx'
import About from './pages/About/index.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import ScanDemo from './pages/ScanDemo/index.jsx'
import Embed from './pages/Embed/index.jsx'
import Agent from './pages/Agent/index.jsx'
import VoiceAssistant from './pages/VoiceAssistant/index.jsx'
import FormBuilderDemo from './pages/FormBuilderDemo/index.jsx'
import ThemeDemo from './pages/ThemeDemo/index.jsx'
import ChartsDemo from './pages/ChartsDemo/index.jsx'
import CommandPaletteDemo from './pages/CommandPaletteDemo/index.jsx'
import NotifyDemo from './pages/NotifyDemo/index.jsx'
import DataTableDemo from './pages/DataTableDemo/index.jsx'
import TestCenterDemo from './pages/TestCenterDemo/index.jsx'
import Login from './pages/Login/index.jsx'
import NotFound from './pages/NotFound/index.jsx'
import './App.scss'

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
        <Route path="command-palette" element={<CommandPaletteDemo />} />
        <Route path="notify" element={<NotifyDemo />} />
        <Route path="data-table" element={<DataTableDemo />} />
        <Route path="test-center" element={<TestCenterDemo />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}

export default App
