import { useState } from 'react'
import { Link } from 'react-router-dom'
import StarArray from '@components/StarArray/StarArray.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

function Home() {
  const [count, setCount] = useState(0)
  const { t } = useI18n()

  return (
    <div className="page-card">
      <h1>{t('home.title')}</h1>
      <p>{t('home.desc')}</p>

      <div className="home-counter">
        <button
          type="button"
          className="btn"
          onClick={() => setCount((c) => c + 1)}
        >
          {t('home.counter', { count })}
        </button>
      </div>

      <p>
        {t('home.navHintPre')} <Link to="/about">{t('nav.about')}</Link> {t('home.navHintOr')}{' '}
        <Link to="/dashboard">{t('nav.dashboard')}</Link> {t('home.navHintPost')}
      </p>

      <ul>
        <li>React 19</li>
        <li>React Router 7</li>
        <li>Vite 8</li>
      </ul>

      {/* 周天星辰大阵：365 颗真实恒星 */}
      <StarArray />
    </div>
  )
}

export default Home
