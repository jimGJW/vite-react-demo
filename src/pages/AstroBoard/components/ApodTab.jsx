/**
 * ApodTab —— 「🖼 天文一图」标签页（自 AstroBoard 主壳拆出，原 index.jsx L1663-1710）。
 * NASA APOD 每日天文一图。纯展示组件：数据经 props 传入。
 */
import { Button, Empty, Spin, Tag } from 'antd'
import { BookOutlined, ReloadOutlined } from '@ant-design/icons'
import { Panel } from './ui.jsx'

export default function ApodTab({ apod, apodData }) {
  return (
    <>
              <div className="astro-tab-content">
                {/* NASA 每日天文一图 */}
      <Panel
        title="NASA 每日天文一图（APOD）"
        source="NASA APOD（apod.nasa.gov），每天一张，由美国航天局编选；服务端缓存 3 小时转发"
        icon={<BookOutlined />}
        loading={apod.loading}
        error={apod.error}
      >
        {apodData ? (
          <div className="astro-apod">
            <a
              className="astro-apod__img"
              href={apodData.hdurl || apodData.url}
              target="_blank"
              rel="noreferrer"
              title="点击查看高清原图"
            >
              <img src={apodData.url} alt={apodData.title} loading="lazy" />
            </a>
            <div className="astro-apod__body">
              <h4>{apodData.title}</h4>
              <div className="astro-apod__meta">
                <Tag color="blue">{apodData.date}</Tag>
                {apodData.copyright && <Tag>© {apodData.copyright.trim()}</Tag>}
                {apodData.mediaType === 'video' && <Tag color="orange">视频条目（图为缩略）</Tag>}
              </div>
              <p>{apodData.explanation}</p>
              {apodData.hdurl && (
                <a className="astro-apod__hd" href={apodData.hdurl} target="_blank" rel="noreferrer">
                  查看高清原图 →
                </a>
              )}
            </div>
          </div>
        ) : apod.loading ? (
          <div className="astro-sky-loading"><Spin /> 正在加载今日天文图…</div>
        ) : (
          <Empty description="APOD 暂时不可用（NASA DEMO_KEY 限流或网络异常）">
            <Button icon={<ReloadOutlined />} onClick={apod.reload} loading={apod.loading}>
              重新加载
            </Button>
          </Empty>
        )}
      </Panel>
              </div>
    </>
  )
}
