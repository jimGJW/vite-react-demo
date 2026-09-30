import { useEffect } from 'react'
import { Alert, Button, Card, Space, Tag, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { MICRO_APPS } from '../../micros/config.js'
import { useSubAppLoader } from '../../micros/useSubAppLoader.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

const STATUS_TEXT = { idle: '未加载', loading: '加载中', loaded: '已挂载', error: '加载失败' }

/**
 * 子应用独立宿主页（每个 qiankun 子应用一个，如 /micro-vue、/micro-angular）
 *
 * 进入页面即自动加载对应子应用并挂载到唯一容器；
 * 子应用自身的功能菜单会在 mount 时注册到左侧边栏对应分组。
 */
export default function SubAppPage({ appKey }) {
  const cfg = MICRO_APPS[appKey]
  const { containerRef, status, load, unload } = useSubAppLoader(appKey)

  /* 进入页面即自动加载（含 pendingPath 定位：从其他页面「在子应用中打开」跳转过来） */
  useEffect(() => {
    load()
  }, [load])

  if (!cfg) {
    return <Alert type="error" showIcon message={`未知子应用：${String(appKey)}`} />
  }

  const tagColor =
    status === 'loaded' ? 'green' : status === 'loading' ? 'blue' : status === 'error' ? 'red' : 'default'

  return (
    <div className="subapp-page">
      <Title level={2} className="subapp-page__title">
        <span className="subapp-dot" style={{ background: cfg.color }} />
        {cfg.title}
        <Tag color={tagColor} style={{ marginLeft: 12 }}>
          {STATUS_TEXT[status]}
        </Tag>
      </Title>
      <Paragraph type="secondary">
        独立工程 <Text code>{cfg.name}</Text>（dev 端口 <Text code>{cfg.port}</Text>），由 qiankun
        在运行时融合进主应用，与主 React 应用隔离运行。其功能菜单已注册到左侧边栏「
        {cfg.title}」分组，点击即可切换子应用内部页面。
      </Paragraph>

      {status === 'error' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="子应用加载失败"
          description={
            <Space direction="vertical">
              <span>请确认已执行 npm run dev:all（或 npm run dev:{appKey === 'vue' ? 'vue' : 'angular'}）启动了子应用服务。</span>
              <Button size="small" icon={<ReloadOutlined />} onClick={unload}>
                重置后重试（重试请再点上方刷新）
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
            {status === 'loaded' ? '卸载' : '重新加载'}
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
            {status === 'loading' ? '子应用加载中，首次访问需等待其依赖预构建…' : '容器为空：等待加载。'}
          </Paragraph>
        )}
      </Card>
    </div>
  )
}
