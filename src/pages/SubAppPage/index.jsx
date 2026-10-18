import { useEffect } from 'react'
import { Alert, Button, Card, Space, Tag, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { MICRO_APPS } from '@/micros/config.js'
import { useSubAppLoader } from '@/micros/useSubAppLoader.js'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

/**
 * 子应用独立宿主页（每个 qiankun 子应用一个，如 /micro-vue、/micro-angular）
 *
 * 进入页面即自动加载对应子应用并挂载到唯一容器；
 * 子应用自身的功能菜单会在 mount 时注册到左侧边栏对应分组。
 */
export default function SubAppPage({ appKey }) {
  const { t } = useI18n()
  const cfg = MICRO_APPS[appKey]
  const { containerRef, status, load, unload } = useSubAppLoader(appKey)

  /* 进入页面即自动加载（含 pendingPath 定位：从其他页面「在子应用中打开」跳转过来） */
  useEffect(() => {
    load()
  }, [load])

  if (!cfg) {
    return <Alert type="error" showIcon message={t('micro.unknownApp', { appKey: String(appKey) })} />
  }

  const tagColor =
    status === 'loaded' ? 'green' : status === 'loading' ? 'blue' : status === 'error' ? 'red' : 'default'

  return (
    <div className="subapp-page">
      <Title level={2} className="subapp-page__title">
        <span className="subapp-dot" style={{ background: cfg.color }} />
        {cfg.title}
        <Tag color={tagColor} style={{ marginLeft: 12 }}>
          {t(`micro.status.${status}`)}
        </Tag>
      </Title>
      <Paragraph type="secondary">
        {t('micro.subIntro1')}<Text code>{cfg.name}</Text>{t('micro.subIntro2')}<Text code>{cfg.port}</Text>{t('micro.subIntro3')}
        {cfg.title}{t('micro.subIntro4')}
      </Paragraph>

      {status === 'error' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('micro.loadFailed')}
          description={
            <Space direction="vertical">
              <span>{t('micro.errDesc', { script: appKey === 'vue' ? 'vue' : 'angular' })}</span>
              <Button size="small" icon={<ReloadOutlined />} onClick={unload}>
                {t('micro.retryBtn')}
              </Button>
            </Space>
          }
        />
      )}

      <Card
        title={
          <span>
            <span className="subapp-dot" style={{ background: cfg.color }} />
            {cfg.title} · {cfg.name}
          </span>
        }
        extra={
          <Button size="small" onClick={status === 'loaded' ? unload : load}>
            {status === 'loaded' ? t('micro.unload') : t('micro.reload')}
          </Button>
        }
      >
        <div
          className="micro-container"
          data-app={cfg.key}
          ref={(el) => {
            containerRef.current = el
          }}
        />
        {status !== 'loaded' && (
          <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
            {status === 'loading' ? t('micro.loadingTip') : t('micro.emptyTip')}
          </Paragraph>
        )}
      </Card>
    </div>
  )
}
