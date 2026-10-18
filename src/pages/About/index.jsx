import { useI18n } from '@i18n/index.js'
import './index.scss'

function About() {
  const { t } = useI18n()
  return (
    <div className="page-card">
      <h1>{t('about.title')}</h1>
      <p>{t('about.desc')}</p>

      <h2>{t('about.stackTitle')}</h2>
      <ul>
        <li><strong>React 19</strong> - {t('about.react19')}</li>
        <li><strong>React Router 7</strong> - {t('about.router7')}</li>
        <li><strong>Vite 8</strong> - {t('about.vite8')}</li>
        <li><strong>ESLint</strong> - {t('about.eslint')}</li>
      </ul>

      <h2>{t('about.structureTitle')}</h2>
      <pre className="about-structure">
{t('about.structure')}
      </pre>
    </div>
  )
}

export default About
