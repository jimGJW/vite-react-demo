import { Alert, Button, Space } from 'antd'
import { useAsyncError } from '@components/ErrorBoundary/useAsyncError.js'
import { useI18n } from '@i18n/index.js'


export function Bomb({ armed, label }) {
  const { t } = useI18n()
  if (armed) throw new Error(`${label}${t('errorBoundary.parts.renderErrorSuffix')}`)
  return <Alert type="success" showIcon message={t('errorBoundary.parts.renderOk')} />
}

/* —— 事件 / 异步抛错：必须借助 useAsyncError 抛回渲染期 —— */
export function AsyncThrower() {
  const { t } = useI18n()
  const throwError = useAsyncError()
  return (
    <Space wrap>
      <Button danger onClick={() => throwError(new Error(t('errorBoundary.parts.eventErr')))}>
        {t('errorBoundary.parts.eventThrow')}
      </Button>
      <Button danger onClick={() => {
        setTimeout(() => throwError(new Error(t('errorBoundary.parts.timerErr'))), 200)
      }}>
        {t('errorBoundary.parts.timerThrow')}
      </Button>
      <Button danger onClick={() => {
        Promise.reject(new Error(t('errorBoundary.parts.promiseErr'))).catch(throwError)
      }}>
        {t('errorBoundary.parts.promiseThrow')}
      </Button>
    </Space>
  )
}

/* —— 对照组：不用 useAsyncError，直接在事件里 throw —— */
export function NaiveThrower() {
  const { t } = useI18n()
  return (
    <Button onClick={() => {
      throw new Error(t('errorBoundary.parts.naiveErr'))
    }}>
      {t('errorBoundary.parts.naiveBtn')}
    </Button>
  )
}
