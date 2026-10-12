import { useState } from 'react'
import { Button, Empty, Select, Tooltip } from 'antd'
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons'
import AstroBoard from '../../AstroBoard/index.jsx'
import GeoBoard from '../../GeoBoard/index.jsx'
import OceanBoard from '../../OceanBoard/index.jsx'
import './ModuleView.scss'

/* 可选模块：按看板分组，value 用 `${看板}:${tabKey}` 作为唯一标识 */
const BOARD_MODULES = {
  astro: {
    title: '深空',
    icon: '🛰️',
    tabs: [
      { key: 'earth', label: '🌍 地球附近' },
      { key: 'solar', label: '🪐 太阳系' },
      { key: 'sun', label: '☀️ 太阳活动' },
      { key: 'sky', label: '✨ 今晚星空' },
      { key: 'apod', label: '🖼 天文一图' },
      { key: 'deep', label: '🌌 深空' },
      { key: 'launch', label: '🚀 航天发射' },
      { key: 'cases', label: '📚 案例' },
    ],
  },
  geo: {
    title: '地球',
    icon: '🌍',
    tabs: [
      { key: 'quake', label: '🪨 大地脉动' },
      { key: 'epic', label: '🖼 地球影像' },
      { key: 'eonet', label: '🛰 自然事件' },
      { key: 'volcano', label: '🌋 火山与海啸' },
      { key: 'climate', label: '🌏 地表与气候' },
      { key: 'cases', label: '📚 案例' },
    ],
  },
  ocean: {
    title: '海洋',
    icon: '🌊',
    tabs: [
      { key: 'waves', label: '🌊 海浪与海温' },
      { key: 'tide', label: '🌗 潮汐' },
      { key: 'oni', label: '🌡 气候振荡' },
      { key: 'cyclone', label: '🌀 热带气旋' },
      { key: 'buoy', label: '🛟 浮标实况' },
      { key: 'cases', label: '📚 案例' },
    ],
  },
}

const SELECT_OPTIONS = Object.entries(BOARD_MODULES).map(([bkey, b]) => ({
  label: `${b.icon} ${b.title}`,
  options: b.tabs.map((t) => ({ label: t.label, value: `${bkey}:${t.key}` })),
}))

const BOARD_COMPONENT = { astro: AstroBoard, geo: GeoBoard, ocean: OceanBoard }

/**
 * 模块视图：在「时空档案」内新增的 tab。用户通过多选下拉勾选若干个
 * 深空 / 地球 / 海洋的具体 tab，下方网格并排渲染这些模块的内容，方便横向对比浏览。
 * 每个模块直接复用对应看板的整页组件，并通过 lockedTab 锁定到所选 tab、用 CSS 隐藏
 * 看板自身的头部 / 指标条 / 页脚 / 三方监控条 / 切换栏，只露出内容本体。
 */
export default function ModuleView() {
  const [picks, setPicks] = useState([])

  const removePick = (v) => setPicks(picks.filter((x) => x !== v))
  const clearAll = () => setPicks([])

  return (
    <div className="mv">
      <div className="mv__bar">
        <Select
          mode="multiple"
          allowClear
          className="mv__select"
          placeholder="勾选要查看的模块（深空 / 地球 / 海洋各 tab 任选）"
          options={SELECT_OPTIONS}
          value={picks}
          onChange={setPicks}
          maxTagCount="responsive"
        />
        {picks.length > 0 && (
          <Button icon={<DeleteOutlined />} onClick={clearAll}>
            清空（{picks.length}）
          </Button>
        )}
      </div>

      {picks.length === 0 ? (
        <Empty
          className="mv__empty"
          description="从上方下拉勾选若干个模块，即可在同一视图里并排查看它们的实时内容"
        />
      ) : (
        <div className="mv__grid">
          {picks.map((p) => {
            const [b, t] = p.split(':')
            const bMeta = BOARD_MODULES[b]
            const tMeta = bMeta.tabs.find((x) => x.key === t)
            const BoardComp = BOARD_COMPONENT[b]
            return (
              <div className="mv-card" key={p}>
                <div className="mv-card__head">
                  <span className="mv-card__title">
                    {bMeta.icon} {bMeta.title} · {tMeta.label}
                  </span>
                  <Tooltip title="移除该模块">
                    <Button
                      size="small"
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => removePick(p)}
                    />
                  </Tooltip>
                </div>
                <div className="mv-embed" data-board={b}>
                  <BoardComp lockedTab={t} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
