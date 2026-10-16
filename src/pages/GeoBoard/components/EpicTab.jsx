/**
 * 「地球影像」Tab：NASA EPIC 整圆盘地球照片（DSCOVR 卫星于日地 L1 点拍摄）。
 * 数据由 useGeoData 的 epic 轮询提供。
 */
import { PictureOutlined } from '@ant-design/icons'
import { Empty, Spin, Tag } from 'antd'
import { Panel } from './ui.jsx'
import { useI18n } from '../../../i18n/index.js'

export default function EpicTab({ epic, epicData }) {
  const { t } = useI18n()
  return (
    <div className="geo-tab-content">
      <Panel
        title={t('geo.epic.title')}
        source={t('geo.epic.source')}
        icon={<PictureOutlined />}
        loading={epic.loading}
        error={epic.error}
      >
        {epicData ? (
          <div className="geo-epic">
            <a
              className="geo-epic__img"
              href={epicData.frames[0].url}
              target="_blank"
              rel="noreferrer"
              title={t('geo.epic.viewOrig')}
            >
              <img src={epicData.frames[0].url} alt={epicData.frames[0].caption || t('geo.epic.alt')} loading="lazy" />
            </a>
            <div className="geo-epic__body">
              <h4>{epicData.date} · {t('geo.epic.naturalColor')}</h4>
              <div className="geo-epic__meta">
                <Tag color="green">{t('geo.epic.dscovrTag')}</Tag>
                <Tag>{epicData.frames[0].time?.slice(11, 16)} {t('geo.epic.utcShot')}</Tag>
              </div>
              <p className="geo-epic__caption">{epicData.frames[0].caption || '——'}</p>
              <p className="geo-epic__note">
                {t('geo.epic.note')}
              </p>
              {/* 当日其余帧：胶片条 */}
              {epicData.frames.length > 1 && (
                <div className="geo-epic__filmstrip">
                  {epicData.frames.slice(1).map((f) => (
                    <a key={f.identifier} href={f.url} target="_blank" rel="noreferrer" title={f.time}>
                      <img src={f.thumb} alt={f.time} loading="lazy" />
                      <span>{f.time.slice(11, 16)}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : epic.loading ? (
          <div className="geo-loading"><Spin /> {t('geo.epic.loading')}</div>
        ) : (
          <Empty description={t('geo.epic.empty')} />
        )}
      </Panel>
    </div>
  )
}
