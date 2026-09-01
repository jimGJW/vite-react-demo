import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth.js'
import { useStyleMode } from '../../contexts/StyleModeContext.jsx'
import './index.scss'

function Login() {
  const { login } = useAuth()
  const { mode, setMode } = useStyleMode()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ username: '', password: '', remember: true })
  // idle | loading(核验中) | warping(跃迁中)
  const [status, setStatus] = useState('idle')

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.username || !form.password || status !== 'idle') return
    setStatus('loading')
    // 1.1s 身份核验 → 写入会话并启动跃迁
    setTimeout(() => {
      login(form.username)
      setStatus('warping')
    }, 1100)
    // 跃迁动画收尾后进入目标页
    setTimeout(() => {
      navigate(from, { replace: true })
    }, 2200)
  }

  return (
    <div className={`login-page${status === 'warping' ? ' warping' : ''}`}>
      {/* 星空背景层 */}
      <div className="starfield" aria-hidden="true">
        <div className="nebula nebula-1" />
        <div className="nebula nebula-2" />
        <div className="nebula nebula-3" />
        <div className="planet">
          <div className="planet-orbit" />
        </div>
        <div className="stars stars-far" />
        <div className="stars stars-mid" />
        <div className="stars stars-near" />
        <div className="stars-twinkle" />
        <div className="stars-streak" />
        <div className="shooting-star ss-1" />
        <div className="shooting-star ss-2" />
        <div className="shooting-star ss-3" />
        <div className="shooting-star ss-4" />
        <div className="shooting-star ss-5" />
        <div className="sparkles" aria-hidden="true">
          <span className="sparkle" />
          <span className="sparkle" />
          <span className="sparkle" />
          <span className="sparkle" />
          <span className="sparkle" />
          <span className="sparkle" />
        </div>

        {/* 飞船：从地球跃迁到太阳系边界 */}
        <div className="journey" aria-hidden="true">
          <span className="journey-path" />
          <div className="earth" />
          <div className="boundary" />
          <div className="ship" />
        </div>
      </div>

      {/* 跃迁特效层 */}
      <div className="warp-layer" aria-hidden="true" />
      <div className="warp-flash" aria-hidden="true" />
      <div className="login-aura" aria-hidden="true" />

      <div className="login-vignette" aria-hidden="true" />

      <main className="login-card">
        <span className="login-card-glow" aria-hidden="true" />

        <div className="login-brand">
          <div className="login-logo">
            <span className="login-logo-emoji">🚀</span>
          </div>
          <h1>星际控制台</h1>
          <p>欢迎归来，舰长。请验证身份以进入主控系统。</p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-field">
            <span className="login-label">账号</span>
            <input
              type="text"
              placeholder="captain@starfleet.io"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              disabled={status !== 'idle'}
            />
          </label>

          <label className="login-field">
            <span className="login-label">访问密钥</span>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              disabled={status !== 'idle'}
            />
          </label>

          <div className="login-row">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                disabled={status !== 'idle'}
              />
              <span>保持登录</span>
            </label>
            <a className="login-link" href="#forgot">忘记密钥？</a>
          </div>

          {/* 样式模式选择器 */}
          <div className="login-mode-select">
            <span className="login-label">界面风格</span>
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-option ${mode === 'antd' ? 'active' : ''}`}
                onClick={() => setMode('antd')}
                disabled={status !== 'idle'}
              >
                <span className="mode-badge antd">A</span>
                Ant Design
              </button>
              <button
                type="button"
                className={`mode-option ${mode === 'vue' ? 'active' : ''}`}
                onClick={() => setMode('vue')}
                disabled={status !== 'idle'}
              >
                <span className="mode-badge vue">V</span>
                Vue 风格
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={status !== 'idle'}>
            {status === 'idle' ? (
              '进入星舰'
            ) : (
              <>
                <span className="login-spinner" />
                <span>{status === 'warping' ? '跃迁中…' : '身份核验中…'}</span>
              </>
            )}
          </button>
        </form>

        <footer className="login-foot">
          <span>新舰员？</span>
          <Link to="/" className="login-link">申请入驻</Link>
        </footer>
      </main>
    </div>
  )
}

export default Login
