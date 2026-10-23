import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Page } from '@components/PageShell/index.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

function NotFound() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <Page className="nf" aurora gap="lg">
      <div className="nf-card page-card">
        <div className="nf-code m-float" aria-hidden="true">
          404
        </div>
        <h1 className="nf-title">{t('notFound.title')}</h1>
        <p className="nf-desc">{t('notFound.desc')}</p>
        <Button type="primary" size="large" onClick={() => navigate('/')}>
          {t('notFound.back')}
        </Button>
      </div>
    </Page>
  )
}

export default NotFound
