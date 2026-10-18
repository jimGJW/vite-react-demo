import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth.js'
import { useStyleMode } from '@/contexts/StyleModeContext.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

function Login() {
  const { login } = useAuth()
  const { mode, setMode } = useStyleMode()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ username: '', password: '', remember: true })
  // idle | loading(核验中) | warping(跃迁中)
  const [status, setStatus] = useState('idle')

  const timersRef = useRef([])
  // 用 ref 做同步判重：status 是异步 state，同一 tick 内连点两次会各自排一对定时器
  const submittingRef = useRef(false)

  // 卸载时清理未完成的定时器：否则核验/跃迁途中离开页面，仍会在 1.1s/2.2s 后
  // 对已卸载组件 setStatus 并强制 navigate 走，把用户从当前页面拽回目标页
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.username || !form.password || submittingRef.current) return
    submittingRef.current = true
    setStatus('loading')
    // 1.1s 身份核验 → 写入会话并启动跃迁
    timersRef.current.push(setTimeout(() => {
      login(form.username)
      setStatus('warping')
    }, 1100))
    // 跃迁动画收尾后进入目标页
    timersRef.current.push(setTimeout(() => {
      navigate(from, { replace: true })
    }, 2200))
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
          <h1>{t('login.title')}</h1>
          <p>{t('login.welcome')}</p>
          {/* 守卫跳转来源提示：未登录直接访问受保护页（如 /not-videos）会被带到这里，
              不说明的话用户会以为页面坏了——「什么反应都没有」就是这么来的 */}
          {from && from !== '/' ? (
            <p className="login-back">
              {t('login.backHint', { path: from })}
            </p>
          ) : null}
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-field">
            <span className="login-label">{t('login.username')}</span>
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
            <span className="login-label">{t('login.password')}</span>
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
              <span>{t('login.remember')}</span>
            </label>
            <a className="login-link" href="#forgot">{t('login.forgot')}</a>
          </div>

          {/* 样式模式选择器 */}
          <div className="login-mode-select">
            <span className="login-label">{t('login.modeLabel')}</span>
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-option ${mode === 'antd' ? 'active' : ''}`}
                onClick={() => setMode('antd')}
                disabled={status !== 'idle'}
              >
                <span className="mode-badge antd">A</span>
                {t('login.modeAntd')}
              </button>
              <button
                type="button"
                className={`mode-option ${mode === 'vue' ? 'active' : ''}`}
                onClick={() => setMode('vue')}
                disabled={status !== 'idle'}
              >
                <span className="mode-badge vue">V</span>
                {t('login.modeVue')}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={status !== 'idle'}>
            {status === 'idle' ? (
              t('login.submit')
            ) : (
              <>
                <span className="login-spinner" />
                <span>{status === 'warping' ? t('login.warping') : t('login.verifying')}</span>
              </>
            )}
          </button>
        </form>

        <footer className="login-foot">
          <span>{t('login.newCrew')}</span>
          <Link to="/" className="login-link">{t('login.apply')}</Link>
        </footer>
      </main>
    </div>
  )
}

export default Login
