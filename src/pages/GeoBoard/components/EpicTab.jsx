/**
 * 「地球影像」Tab：NASA EPIC 整圆盘地球照片（DSCOVR 卫星于日地 L1 点拍摄）。
 * 数据由 useGeoData 的 epic 轮询提供。
 */
import { PictureOutlined } from '@ant-design/icons'
import { Empty, Spin, Tag } from 'antd'
import { Panel } from './ui.jsx'

export default function EpicTab({ epic, epicData }) {
  return (
    <div className="geo-tab-content">
      <Panel
        title="DSCOVR/EPIC 整圆盘地球"
        source="NASA EPIC（epic.gsfc.nasa.gov），日地拉格朗日 L1 点拍摄，约每 2 小时一帧"
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
              title="点击查看原图"
            >
              <img src={epicData.frames[0].url} alt={epicData.frames[0].caption || '地球'} loading="lazy" />
            </a>
            <div className="geo-epic__body">
              <h4>{epicData.date} · 自然色</h4>
              <div className="geo-epic__meta">
                <Tag color="green">DSCOVR 卫星 · 距地球约 150 万 km</Tag>
                <Tag>{epicData.frames[0].time?.slice(11, 16)} UTC 拍摄</Tag>
              </div>
              <p className="geo-epic__caption">{epicData.frames[0].caption || '——'}</p>
              <p className="geo-epic__note">
                EPIC 相机从日地 L1 点持续凝视地球向阳面，10 个窄波段合成自然色——
                这是「天上视角看地下」最经典的一张脸。
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
          <div className="geo-loading"><Spin /> 正在加载今日地球…</div>
        ) : (
          <Empty description="EPIC 暂时不可用" />
        )}
      </Panel>
    </div>
  )
}
