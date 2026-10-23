import { Alert, Button, Card, Space, Tag, Typography, Divider } from 'antd'
import { MICRO_APP_LIST } from '@/micros/config.js'
import { isInQiankun } from '@/micros/qiankunHost.js'
import { useSubAppLoader } from '@/micros/useSubAppLoader.js'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

/**
 * 微前端融合总览页（qiankun）
 *
 * 主 React 应用（5173）通过 qiankun 在运行时融合两个【独立工程】：
 * Vue 3（7101）与 Angular（7102）。每个子应用也有自己的独立宿主页
 * （/micro-vue、/micro-angular，进入即自动加载），本页提供并排对比视图与手动加载/卸载按钮。
 *
 * 注意：qiankun 生命周期桥是全局单例，两个子应用必须【串行】加载（await 完一个再下一个），
 * 并发加载会互相覆写 window.proxy 导致 bootstrap 超时（single-spa #31）。
 */
export default function MicroFrontendDemo() {
  const { t } = useI18n()
  const vue = useSubAppLoader('vue')
  const angular = useSubAppLoader('angular')
  const loaders = { vue, angular }

  /* 串行加载：等待 vue 完成后再加载 angular（避免全局生命周期桥竞态） */
  const loadAll = async () => {
    await vue.load()
    await angular.load()
  }

  return (
    <div className="micro-frontend-page">
      <div className="page-hero">
        <Title level={2}>{t('micro.title')}</Title>
        <Paragraph>
          {t('micro.intro1')}<Text code>5173</Text>{t('micro.intro2')}<Text strong>qiankun</Text>{t('micro.intro3')}<Text strong>{t('micro.indepProj')}</Text>{t('micro.intro4')}<Text code>7101</Text>{t('micro.intro5')}<Text code>7102</Text>{t('micro.intro6')}<strong>{t('micro.menuRegister')}</strong>{t('micro.intro7')}
          <Button type="link" size="small" style={{ padding: 0 }} href="/micro-vue">
            /micro-vue
          </Button>
          、
          <Button type="link" size="small" style={{ padding: 0 }} href="/micro-angular">
            /micro-angular
          </Button>
          {t('micro.intro8')}
        </Paragraph>
      </div>

      {isInQiankun() && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('micro.inQiankun')}
        />
      )}

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={t('micro.prereq')}
      />

      <Space wrap style={{ marginBottom: 24 }}>
        <Button type="primary" onClick={loadAll}>
          {t('micro.loadAll')}
        </Button>
        {MICRO_APP_LIST.map((a) => (
          <Button key={`load-${a.key}`} onClick={() => loaders[a.key].load()}>
            {t('micro.loadItem', { title: a.title })}
          </Button>
        ))}
        {MICRO_APP_LIST.map((a) => (
          <Button key={`unload-${a.key}`} onClick={() => loaders[a.key].unload()}>
            {t('micro.unloadItem', { title: a.title })}
          </Button>
        ))}
      </Space>

      <div className="micro-grid">
        {MICRO_APP_LIST.map((a) => {
          const s = loaders[a.key].status
          const color = s === 'loaded' ? 'green' : s === 'loading' ? 'blue' : s === 'error' ? 'red' : 'default'
          return (
            <Card
              key={a.key}
              title={
                <Space>
                  <span
                    style={{ width: 10, height: 10, borderRadius: '50%', background: a.color, display: 'inline-block' }}
                  />
                  {a.title}
                </Space>
              }
              extra={
                <Space>
                  <Tag color={color}>{t(`micro.status.${s}`)}</Tag>
                  <Button size="small" type="link" href={a.hostPath}>
                    {t('micro.standalone')}
                  </Button>
                </Space>
              }
            >
              <div
                className="micro-container"
                data-app={a.key}
                ref={(el) => {
                  loaders[a.key].containerRef.current = el
                }}
              />
            </Card>
          )
        })}
      </div>

      <Divider />
      <Paragraph type="secondary">
        {t('micro.footPre')}<Text code>src/micros/config.js</Text>{t('micro.footMid1')}<Text code>src/micros/qiankunHost.js</Text>{t('micro.footMid2')}<Text code>src/micros/useSubAppLoader.js</Text>{t('micro.footTail')}
      </Paragraph>
    </div>
  )
}
