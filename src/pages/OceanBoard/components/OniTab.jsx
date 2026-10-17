/**
 * 「气候振荡」Tab：ONI（年际）+ 全球海洋温度距平 + PDO / AMO（年代际）。
 *
 * 三条曲线放在一页是有意为之：它们都是海温距平的气候模态，差别只在**时间尺度**——
 * ENSO 是 2–7 年，PDO 是 20–30 年，AMO 是 60–80 年。
 * 分开看容易把「年代际背景」误当成「今年的异常」，一起看才能判断
 * 一次厄尔尼诺到底是「暖背景上叠加强信号」还是「冷背景上的孤立事件」。
 */
import { CompassOutlined, LineChartOutlined } from '@ant-design/icons'
import { Empty, Tooltip } from 'antd'
import { useI18n } from '../../../i18n/index.js'
import { Panel } from './ui.jsx'
import OniChart from './OniChart.jsx'
import AnomalyBars from './AnomalyBars.jsx'
import { zhOscillation } from '../../../lib/earth/glossary.js'

/** 一条振荡指数的概况条 */
function OscHead({ osc }) {
  const { t, lang } = useI18n()
  const dict = zhOscillation(osc.key, lang)
  const positive = osc.last12 > 0
  return (
    <div className="o-osc-head">
      <span className="o-osc-head__name" style={{ color: osc.color }}>
        {osc.zh}
      </span>
      <Tooltip title={dict?.desc || osc.en}>
        <span className="o-osc-head__en is-info">{osc.en}</span>
      </Tooltip>
      <span className="o-osc-head__region">{osc.region}</span>
      <span className="o-osc-head__period">{t('ocean.oni.oscPeriod', { period: osc.period })}</span>
      <span
        className="o-osc-head__val"
        style={{ color: positive ? '#ef4444' : '#3b82f6' }}
      >
        {t('ocean.oni.oscLast12')} {positive ? '+' : ''}
        {osc.last12} · {positive ? t('ocean.oni.oscWarm') : t('ocean.oni.oscCold')}
      </span>
    </div>
  )
}

export default function OniTab({ oni, oniData, oscillations, oscData, ssta, sstaData }) {
  const { t } = useI18n()
  const pdo = oscData?.pdo
  const amo = oscData?.amo
  return (
    <div className="o-tab-content">
      <Panel
        title={t('ocean.oni.panelOni')}
        source={t('ocean.oni.srcOni')}
        icon={<LineChartOutlined />}
        loading={oni.loading}
        error={oni.error}
      >
        {oniData ? (
          <OniChart history={oniData.history} latest={oniData.latest} state={oniData.state} />
        ) : (
          <Empty description={t('ocean.oni.emptyOni')} />
        )}
      </Panel>

      <Panel
        title={t('ocean.oni.panelSsta')}
        source={t('ocean.oni.srcSsta')}
        icon={<LineChartOutlined />}
        loading={ssta.loading}
        error={ssta.error}
      >
        {sstaData ? (
          <>
            <div className="o-ssta-kpi">
              <span>
                {t('ocean.oni.sstaYear', { year: sstaData.latest.year })}{' '}
                <b style={{ color: '#ef4444' }}>+{sstaData.latest.anom.toFixed(2)} °C</b>
              </span>
              <span>
                {t('ocean.oni.sstaWarmest')} <b>{sstaData.warmest.year}</b>（+{sstaData.warmest.anom.toFixed(2)} °C）
              </span>
              <Tooltip title={t('ocean.oni.sstaTip')}>
                <span className="is-info">
                  {t('ocean.oni.sstaLast10')} <b>+{sstaData.last10.toFixed(2)}</b> {t('ocean.oni.sstaVs')}{' '}
                  <b>+{sstaData.ref1981?.toFixed(2)}</b>
                </span>
              </Tooltip>
            </div>
            <AnomalyBars
              series={sstaData.recent.map((r) => ({ key: r.year, value: r.anom }))}
              ariaLabel={t('ocean.oni.sstaAria')}
              height={190}
            />
            <div className="o-chart__caption">
              {t('ocean.oni.captionSsta')}
            </div>
          </>
        ) : (
          <Empty description={t('ocean.oni.emptySsta')} />
        )}
      </Panel>

      <Panel
        title={t('ocean.oni.panelOsc')}
        source={t('ocean.oni.srcOsc')}
        icon={<LineChartOutlined />}
        loading={oscillations.loading}
        error={oscillations.error}
      >
        {pdo && amo ? (
          <div className="o-osc">
            {[pdo, amo].map((osc) => (
              <div key={osc.key} className="o-osc__item">
                <OscHead osc={osc} />
                <AnomalyBars
                  series={osc.annual.map((r) => ({ key: r.year, value: r.value }))}
                  ariaLabel={t('ocean.oni.oscAria', { name: osc.zh })}
                  height={170}
                  digits={3}
                  unit=""
                  posColor={osc.color}
                  negColor="#3b82f6"
                />
                <div className="o-chart__caption">
                  {t('ocean.oni.oscCaption', { name: osc.zh, ym: osc.latest.ym, value: osc.latest.value })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description={t('ocean.oni.emptyOsc')} />
        )}
      </Panel>

      <Panel
        title={t('ocean.oni.panelWhy')}
        source={t('ocean.srcIntro')}
        icon={<CompassOutlined />}
      >
        <div className="o-prose">
          <p>
            {t('ocean.oni.prose1')}
          </p>
          <p>
            {t('ocean.oni.prose2')}
          </p>
          <p>
            {t('ocean.oni.prose3')}
          </p>
        </div>
      </Panel>
    </div>
  )
}
