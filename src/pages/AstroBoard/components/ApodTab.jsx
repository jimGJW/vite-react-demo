/**
 * ApodTab —— 「🖼 天文一图」标签页（自 AstroBoard 主壳拆出，原 index.jsx L1663-1710）。
 * NASA APOD 每日天文一图。纯展示组件：数据经 props 传入。
 */
import { Button, Empty, Spin, Tag } from 'antd'
import { BookOutlined, ReloadOutlined } from '@ant-design/icons'
import { Panel } from './ui.jsx'
import { useI18n } from '@i18n/index.js'

export default function ApodTab({ apod, apodData }) {
  const { t } = useI18n()
  return (
    <>
              <div className="astro-tab-content">
                {/* NASA 每日天文一图 */}
      <Panel
        title={t('astro.apodTitle')}
        source={t('astro.apodSource')}
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
              title={t('astro.apodImgTitle')}
            >
              <img src={apodData.url} alt={apodData.title} loading="lazy" />
            </a>
            <div className="astro-apod__body">
              <h4>{apodData.title}</h4>
              <div className="astro-apod__meta">
                <Tag color="blue">{apodData.date}</Tag>
                {apodData.copyright && <Tag>© {apodData.copyright.trim()}</Tag>}
                {apodData.mediaType === 'video' && <Tag color="orange">{t('astro.apodVideoTag')}</Tag>}
              </div>
              <p>{apodData.explanation}</p>
              {apodData.hdurl && (
                <a className="astro-apod__hd" href={apodData.hdurl} target="_blank" rel="noreferrer">
                  {t('astro.apodHdLink')}
                </a>
              )}
            </div>
          </div>
        ) : apod.loading ? (
          <div className="astro-sky-loading"><Spin /> {t('astro.apodLoading')}</div>
        ) : (
          <Empty description={t('astro.apodEmpty')}>
            <Button icon={<ReloadOutlined />} onClick={apod.reload} loading={apod.loading}>
              {t('astro.apodReload')}
            </Button>
          </Empty>
        )}
      </Panel>
              </div>
    </>
  )
}
