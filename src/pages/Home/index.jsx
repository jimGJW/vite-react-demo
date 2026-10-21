import { useState } from 'react'
import { Link } from 'react-router-dom'
import StarArray from '@components/StarArray/StarArray.jsx'
import { useI18n } from '@i18n/index.js'
import { Animate } from '@/motion/index.jsx'
import './index.scss'

const TECH = ['React 19', 'React Router 7', 'Vite 8']

function Home() {
  const [count, setCount] = useState(0)
  const { t } = useI18n()

  return (
    <div className="page-card">
      <Animate name="fadeInDown" as="h1">{t('home.title')}</Animate>
      <Animate name="fadeInUp" delay={0.12} as="p">{t('home.desc')}</Animate>

      <Animate name="zoomIn" delay={0.22}>
        <div className="home-counter">
          <button
            type="button"
            className="btn"
            onClick={() => setCount((c) => c + 1)}
          >
            {t('home.counter', { count })}
          </button>
        </div>
      </Animate>

      <Animate name="fadeIn" delay={0.32} as="p">
        {t('home.navHintPre')} <Link to="/about">{t('nav.about')}</Link> {t('home.navHintOr')}{' '}
        <Link to="/dashboard">{t('nav.dashboard')}</Link> {t('home.navHintPost')}
      </Animate>

      <ul className="m-stagger">
        {TECH.map((tech, i) => (
          <li key={tech} className="m-stagger-item" style={{ '--i': i }}>
            {tech}
          </li>
        ))}
      </ul>

      {/* 周天星辰大阵：365 颗真实恒星 */}
      <Animate name="zoomIn" delay={0.4}>
        <StarArray />
      </Animate>
    </div>
  )
}

export default Home
