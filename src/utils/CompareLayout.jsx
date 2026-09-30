import { Button, Divider, Typography, Tag, Row, Col } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSubApps } from '../contexts/SubAppContext.jsx'
import './CompareLayout.scss'

const { Title, Paragraph, Text } = Typography

/**
 * 双栏对比页容器
 * - 左栏：React + Ant Design 组件演示（live）
 * - 右栏：Vue 3 + Element Plus 演示 —— Vue 实现已迁移到 qiankun 子应用
 *   （micro-apps/vue-app，独立工程、官方 Vue3 + vue-router + Element Plus），
 *   此处展示「去子应用体验」入口卡；底部保留原理对比表与代码片段
 *
 * @param {object} props
 * @param {string} props.title 案例名（如「父子组件传值」）
 * @param {string} props.subtitle 一句话描述
 * @param {React.ReactNode} props.reactDemo 左栏 React 组件
 * @param {string} props.vueAppPath Vue 子应用内对应页面的路由（如 /pattern/state），
 *   点击入口卡 → 跳转 /micro-vue（vue-app 独立宿主页）→ 自动加载 vue-app → microApp.update 定位到该页
 * @param {Array<{antd:string, vue:string}>} [props.diffRows] 对比点说明
 * @param {{antdCode?: string, vueCode?: string}} [props.code] 示例代码
 */
export default function CompareLayout({
  title,
  subtitle,
  tags,
  reactDemo,
  vueAppPath,
  diffRows,
  code,
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { subApps, requestSubApp } = useSubApps()
  const loaded = Boolean(subApps.vue?.microApp)

  const openInVueApp = () => {
    if (loaded && pathname === '/micro-vue') {
      try { subApps.vue.microApp.update({ path: vueAppPath }) } catch { /* 子应用可能正在卸载 */ }
    } else {
      /* 记录定位意图并跳到 vue-app 独立宿主页，进入后自动加载并定位 */
      requestSubApp('vue', vueAppPath)
      navigate('/micro-vue')
    }
  }

  return (
    <div className="compare-layout-page">
      {/* 页头 */}
      <div className="compare-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>{title}</Title>
          <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 12 }}>
            {subtitle}
          </Paragraph>
          {tags && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tags.map((t, i) => <Tag key={i} color={t.color || 'blue'}>{t.label}</Tag>)}
            </div>
          )}
        </div>
      </div>

      {/* 双栏演示区 */}
      <Row gutter={[16, 16]} className="compare-row">
        <Col xs={24} lg={12}>
          <div className="compare-column">
            <div className="compare-column__header antd">
              <span className="badge antd">A</span>
              <span className="col-title">React · Ant Design</span>
            </div>
            <div className="compare-column__body">{reactDemo}</div>
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="compare-column">
            <div className="compare-column__header vue">
              <span className="badge vue">V</span>
              <span className="col-title">Vue 3 · Element Plus（子应用）</span>
            </div>
            <div className="compare-column__body">
              {/* Vue 实现已迁入 qiankun 子应用：此处提供运行入口，替代原先的挂载桥内嵌 */}
              <div className="vue-subapp-card">
                <div className="vue-subapp-card__head">
                  <span className="vue-subapp-card__logo">V</span>
                  <div>
                    <div className="vue-subapp-card__title">vue-app 子应用（端口 7101）</div>
                    <div className="vue-subapp-card__desc">
                      本案例的 Vue 实现（Element Plus 官方用法）已迁移为独立工程，由 qiankun 运行时融合。
                    </div>
                  </div>
                </div>
                <Button type="primary" onClick={openInVueApp}>
                  {loaded ? '在 Vue 子应用中打开此案例' : '加载 Vue 子应用并打开此案例'}
                </Button>
                <Paragraph type="secondary" style={{ marginTop: 10, marginBottom: 0, fontSize: 12 }}>
                  目标页面：<Text code>{vueAppPath}</Text>
                  。加载后该子应用的功能菜单会出现在左侧边栏，可直接切换其他案例。
                </Paragraph>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 对比说明 */}
      {diffRows && diffRows.length > 0 && (
        <>
          <Divider orientation="left">原理对比</Divider>
          <div className="compare-diff-table">
            <div className="diff-row diff-row--head">
              <div className="diff-cell">对比点</div>
              <div className="diff-cell antd">React · Ant Design</div>
              <div className="diff-cell vue">Vue 3 · Element Plus</div>
            </div>
            {diffRows.map((r, i) => (
              <div key={i} className="diff-row">
                <div className="diff-cell diff-cell--title">{r.title}</div>
                <div className="diff-cell antd"><Text code>{r.antd}</Text></div>
                <div className="diff-cell vue"><Text code>{r.vue}</Text></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 代码对比 */}
      {code && (
        <>
          <Divider orientation="left">核心代码片段</Divider>
          <Row gutter={[16, 16]}>
            {code.antdCode && (
              <Col xs={24} lg={12}>
                <div className="code-block-title">Ant Design / React</div>
                <pre className="code-block"><code>{code.antdCode}</code></pre>
              </Col>
            )}
            {code.vueCode && (
              <Col xs={24} lg={12}>
                <div className="code-block-title vue">Vue 3 / Element Plus</div>
                <pre className="code-block vue"><code>{code.vueCode}</code></pre>
              </Col>
            )}
          </Row>
        </>
      )}
    </div>
  )
}
