import { Alert, Button, Card, Space, Tag, Typography, Divider } from 'antd'
import { MICRO_APP_LIST } from '../../micros/config.js'
import { isInQiankun } from '../../micros/qiankunHost.js'
import { useSubAppLoader } from '../../micros/useSubAppLoader.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

const STATUS_TEXT = { idle: '未加载', loading: '加载中', loaded: '已挂载', error: '加载失败' }

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
      <Title level={2}>微前端融合（qiankun）</Title>
      <Paragraph>
        本页演示主 React 应用（端口 <Text code>5173</Text>）通过 <Text strong>qiankun</Text> 把两个
        <Text strong>独立工程</Text> —— Vue 3 子应用（<Text code>7101</Text>）与 Angular 子应用（
        <Text code>7102</Text>）—— 融合进来。三者各自独立开发、独立构建、独立部署，由 qiankun 统一调度。
        加载后子应用的<strong>功能菜单会注册到左侧边栏</strong>；也可直接访问各自独立宿主页：
        <Button type="link" size="small" style={{ padding: 0 }} href="/micro-vue">
          /micro-vue
        </Button>
        、
        <Button type="link" size="small" style={{ padding: 0 }} href="/micro-angular">
          /micro-angular
        </Button>
        （进入即自动加载）。
      </Paragraph>

      {isInQiankun() && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="当前主应用本身正运行在另一个 qiankun 主应用内"
        />
      )}

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="演示前提：请先执行根目录 npm run dev:all 启动三个服务（主应用 + vue-app + angular-app）。仅启动主应用时子应用容器为空属正常。"
      />

      <Space wrap style={{ marginBottom: 24 }}>
        <Button type="primary" onClick={loadAll}>
          一键加载全部子应用（串行）
        </Button>
        {MICRO_APP_LIST.map((a) => (
          <Button key={`load-${a.key}`} onClick={() => loaders[a.key].load()}>
            加载 {a.title}
          </Button>
        ))}
        {MICRO_APP_LIST.map((a) => (
          <Button key={`unload-${a.key}`} onClick={() => loaders[a.key].unload()}>
            卸载 {a.title}
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
                  <Tag color={color}>{STATUS_TEXT[s]}</Tag>
                  <Button size="small" type="link" href={a.hostPath}>
                    独立页
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
        预留地址结构：子应用注册表见 <Text code>src/micros/config.js</Text>，宿主逻辑见
        <Text code>src/micros/qiankunHost.js</Text>，加载器 Hook 见
        <Text code>src/micros/useSubAppLoader.js</Text>。新增子应用只需在 config 中加一项、放置对应工程并注册
        hostPath 路由即可。从 Compare 系列页面的「在 Vue 子应用中打开」也会直达独立宿主页并定位到对应模式。
      </Paragraph>
    </div>
  )
}
