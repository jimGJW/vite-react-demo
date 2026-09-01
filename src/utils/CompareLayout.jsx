import { Divider, Typography, Tag, Row, Col } from 'antd'
import './CompareLayout.scss'

const { Title, Paragraph, Text } = Typography

/**
 * 双栏对比页容器
 * - 左栏：React + Ant Design 组件演示
 * - 右栏：Vue 3 SFC + Element Plus 组件演示（通过挂载桥加载）
 * - 底部：原理对比表格 / 关键代码片段
 *
 * @param {object} props
 * @param {string} props.title 案例名（如「父子组件传值」）
 * @param {string} props.subtitle 一句话描述
 * @param {React.ReactNode} props.reactDemo 左栏 React 组件
 * @param {string} props.vueImportPath .vue 文件路径（相对 src/ 下路径，需用 .vue 后缀），支持传入 loader 函数
 * @param {Array<{antd:string, vue:string}>} [props.diffRows] 对比点说明
 * @param {{antdCode?: string, vueCode?: string}} [props.code] 示例代码
 */
export default function CompareLayout({
  title,
  subtitle,
  tags,
  reactDemo,
  vueDemo,
  diffRows,
  code,
}) {
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
              <span className="col-title">Vue 3 · Element Plus (.vue SFC)</span>
            </div>
            <div className="compare-column__body">
              <SuspenseVueWrap>
                {vueDemo}
              </SuspenseVueWrap>
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

/* —— Vue SFC 懒加载期间的占位（避免 React.lazy 被 Suspense 吞没 — App.jsx 已有全局 Suspense，这里再提供一个更友好的占位） —— */
import { Suspense } from 'react'
function SuspenseVueWrap({ children }) {
  return (
    <Suspense fallback={<div className="compare-loading">
      <div className="spinner" />
      <span>加载 Vue 组件中…</span>
    </div>}>
      {children}
    </Suspense>
  )
}
