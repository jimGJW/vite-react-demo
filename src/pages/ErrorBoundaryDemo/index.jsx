import { useState } from 'react'
import {  Button, Card, Space, Tag, Typography } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import ErrorBoundary from '../../components/ErrorBoundary/index.jsx'
import { useI18n } from '../../i18n/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

/* —— 渲染期抛错：ErrorBoundary 天生能抓的类型 —— */

import { Bomb, AsyncThrower, NaiveThrower } from './components/errorBoundaryParts.jsx'

export default function ErrorBoundaryDemo() {
  const { t } = useI18n()
  const [armed, setArmed] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [armedKeyed, setArmedKeyed] = useState(false)
  const [caught, setCaught] = useState([])

  const record = (err) => {
    setCaught((list) => [{ msg: err.message, at: new Date().toLocaleTimeString() }, ...list].slice(0, 5))
  }

  return (
    <div className="ebd">
      <header className="ebd__header">
        <Title level={4} className="ebd__title">
          <SafetyCertificateOutlined /> {t('errorBoundary.title')}
        </Title>
        <Paragraph type="secondary" className="ebd__lead">
          {t('errorBoundary.lead1')}<code>ErrorBoundary</code>{t('errorBoundary.lead2')}
          <code> useAsyncError()</code>{t('errorBoundary.lead3')}
        </Paragraph>
      </header>

      <div className="ebd__grid">
        {/* ===== 案例 1：渲染期错误 ===== */}
        <Card size="small" className="ebd__card" title={t('errorBoundary.case1Title')}>
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              {t('errorBoundary.case1Hint')}
            </Text>
            <ErrorBoundary
              onError={(err) => record(err)}
              onReset={() => setArmed(false)}
              fallback={({ error, reset }) => (
                <div className="ebd__fallback">
                  <Text strong type="danger">{t('errorBoundary.case1Crashed')}</Text>
                  <Paragraph style={{ margin: '6px 0 8px', fontSize: '0.78rem' }}>
                    {error.message}
                  </Paragraph>
                  <Button size="small" onClick={reset}>{t('errorBoundary.retryReset')}</Button>
                </div>
              )}
            >
              <Bomb armed={armed} label="案例①" />
            </ErrorBoundary>
            <Space>
              <Button danger onClick={() => setArmed(true)}>{t('errorBoundary.triggerRender')}</Button>
              <Button onClick={() => setArmed(false)}>{t('errorBoundary.resetBtn')}</Button>
            </Space>
          </div>
        </Card>

        {/* ===== 案例 2：事件 / 异步错误 ===== */}
        <Card size="small" className="ebd__card" title={t('errorBoundary.case2Title')}>
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              {t('errorBoundary.case2Hint1')}<code>useAsyncError</code>{t('errorBoundary.case2Hint2')}
            </Text>
            <ErrorBoundary
              onError={(err) => record(err)}
              fallback={({ error, reset }) => (
                <div className="ebd__fallback">
                  <Text strong type="danger">{t('errorBoundary.case2Caught')}</Text>
                  <Paragraph style={{ margin: '6px 0 8px', fontSize: '0.78rem' }}>
                    {error.message}
                  </Paragraph>
                  <Button size="small" onClick={reset}>{t('errorBoundary.retry')}</Button>
                </div>
              )}
            >
              <AsyncThrower />
            </ErrorBoundary>
            <pre className="ebd__code">{`const throwError = useAsyncError()

fetchData().catch(throwError)     // Promise
setTimeout(() => throwError(e), 0) // 定时器
onClick={() => throwError(e)}      // 事件`}</pre>
          </div>
        </Card>

        {/* ===== 案例 3：对照组 ===== */}
        <Card size="small" className="ebd__card" title={t('errorBoundary.case3Title')}>
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              {t('errorBoundary.case3Hint1')}<b>{t('errorBoundary.case3HintBold')}</b>{t('errorBoundary.case3Hint2')}
            </Text>
            <ErrorBoundary
              fallback={() => (
                <div className="ebd__fallback">{t('errorBoundary.case3Fallback')}</div>
              )}
            >
              <NaiveThrower />
            </ErrorBoundary>
            <Text type="secondary" className="ebd__hint">
              {t('errorBoundary.case3Reason')}
            </Text>
          </div>
        </Card>

        {/* ===== 案例 4：resetKeys ===== */}
        <Card size="small" className="ebd__card" title={t('errorBoundary.case4Title')}>
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              {t('errorBoundary.case4Hint1')}<code>resetKeys</code>{t('errorBoundary.case4Hint2')}
            </Text>
            <ErrorBoundary
              resetKeys={[resetKey]}
              onError={(err) => record(err)}
              fallback={({ error }) => (
                <div className="ebd__fallback">
                  <Text strong type="danger">{t('errorBoundary.case4Crashed', { resetKey })}</Text>
                  <Paragraph style={{ margin: '6px 0', fontSize: '0.78rem' }}>{error.message}</Paragraph>
                  <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                    {t('errorBoundary.case4AutoReset')}
                  </Text>
                </div>
              )}
            >
              <Bomb armed={armedKeyed} label="案例④" />
            </ErrorBoundary>
            <Space wrap>
              <Button danger onClick={() => setArmedKeyed(true)}>{t('errorBoundary.triggerError')}</Button>
              <Button type="primary" onClick={() => setResetKey((k) => k + 1)}>
                {t('errorBoundary.changeResetKey', { resetKey })}
              </Button>
            </Space>
          </div>
        </Card>

        {/* ===== 捕获记录 ===== */}
        <Card size="small" className="ebd__card" title={t('errorBoundary.logTitle')}>
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              {t('errorBoundary.logHint1')}<code>onError</code>{t('errorBoundary.logHint2')}
            </Text>
            <div className="ebd__zone">
              {caught.length === 0 ? (
                <Text type="secondary" style={{ fontSize: '0.8rem' }}>{t('errorBoundary.logEmpty')}</Text>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                  {caught.map((c, i) => (
                    <li key={`${c.at}-${i}`} style={{ fontSize: '0.78rem' }}>
                      <Tag color="red">{c.at}</Tag>{c.msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <pre className="ebd__code">{`<ErrorBoundary
  fallback={({ error, reset }) => (
    <Result status="error" subTitle={error.message}
            extra={<Button onClick={reset}>重试</Button>} />
  )}
  onError={(err, info) => report(err, info.componentStack)}
  resetKeys={[userId]}
>
  <RiskyWidget />
</ErrorBoundary>`}</pre>
          </div>
        </Card>
      </div>
    </div>
  )
}
