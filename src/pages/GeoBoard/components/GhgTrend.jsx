/**
 * 温室气体三兄弟：CO₂ / CH₄ / N₂O 各一张迷你趋势卡。
 *
 * 为什么不画在一张图上：三者量纲完全不同（427 ppm / 1942 ppb / 340 ppb），
 * 共用 y 轴会让两条曲线贴底成一条直线。归一化动画又会把「真实浓度」这个最有用的数抹掉。
 * 所以按气体分卡，各自缩放，共享同一套视觉语言。
 */
import { Tooltip } from 'antd'
import { GREENHOUSE_GASES } from '../../../lib/earth/glossary.js'
import { useI18n, localize } from '../../../i18n/index.js'

/** 单气体的迷你折线（纯 SVG，无依赖） */
function Spark({ history, color }) {
  const { t } = useI18n()
  if (!history?.length) return null
  const W = 300
  const H = 74
  const vals = history.map((h) => h.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const x = (i) => (i / (history.length - 1)) * W
  const y = (v) => H - 4 - ((v - min) / span) * (H - 12)
  const line = history.map((h, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(h.value).toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="geo-ghg__spark" role="img" aria-label={t('geo.ghg.aria')}>
      <path d={area} fill={color} opacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" />
      <circle cx={W} cy={y(vals[vals.length - 1])} r="2.6" fill={color} />
    </svg>
  )
}

function GasCard({ gas }) {
  const { t, lang } = useI18n()
  const dict = localize(GREENHOUSE_GASES[gas.key], lang)
  return (
    <div className="geo-ghg-card">
      <div className="geo-ghg-card__head">
        <span className="geo-ghg-card__name" style={{ color: gas.color }}>
          {dict?.formula ?? gas.formula}
        </span>
        <Tooltip title={dict?.desc ?? gas.note}>
          <span className="geo-ghg-card__zh is-info">{dict?.zh ?? gas.zh}</span>
        </Tooltip>
      </div>

      <div className="geo-ghg-card__val" style={{ color: gas.color }}>
        {gas.latest.value.toFixed(gas.digits)}
        <span className="geo-ghg-card__unit">{gas.unit}</span>
      </div>
      <div className="geo-ghg-card__ym">{gas.latest.ym} · {t('geo.ghg.monthly')}</div>

      <Spark history={gas.history} color={gas.color} />

      <dl className="geo-ghg-card__stats">
        <dt>{t('geo.ghg.colGrowth')}</dt>
        <dd>
          <span style={{ color: gas.color }}>
            {gas.growthPerYear != null ? `+${gas.growthPerYear}` : '—'}
          </span>
          <span className="geo-ghg-card__dim"> {gas.unit}{t('geo.ghg.perYear')}</span>
        </dd>
        <dt>{t('geo.ghg.colPre')}</dt>
        <dd>
          <b>{gas.vsPreIndustrial}×</b>
          <span className="geo-ghg-card__dim"> {t('geo.ghg.preIndustrial', { pre: gas.preIndustrial, unit: gas.unit })}</span>
        </dd>
        <dt>{t('geo.ghg.colGwp')}</dt>
        <dd>
          <b>{dict?.gwp100 ?? '—'}×</b>
          <span className="geo-ghg-card__dim"> {t('geo.ghg.gwpRef')}</span>
        </dd>
      </dl>

      <p className="geo-ghg-card__note">{dict?.desc ?? gas.note}</p>
    </div>
  )
}

export default function GhgTrend({ gases, order }) {
  if (!gases || !order?.length) return null
  return (
    <div className="geo-ghg">
      {order.map((k) => (
        <GasCard key={k} gas={gases[k]} />
      ))}
    </div>
  )
}
