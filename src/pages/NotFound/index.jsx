import { Link } from 'react-router-dom'
import { useI18n } from '@i18n/index.js'
import './index.scss'

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="page-card not-found-card">
      <h1 className="not-found-code">404</h1>
      <h2>{t('notFound.title')}</h2>
      <p>{t('notFound.desc')}</p>
      <Link to="/" className="btn">
        {t('notFound.back')}
      </Link>
    </div>
  )
}

export default NotFound
