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
import { Panel } from './ui.jsx'
import OniChart from './OniChart.jsx'
import AnomalyBars from './AnomalyBars.jsx'
import { zhOscillation } from '../../../lib/earth/glossary.js'

/** 一条振荡指数的概况条 */
function OscHead({ osc }) {
  const dict = zhOscillation(osc.key)
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
      <span className="o-osc-head__period">周期 {osc.period}</span>
      <span
        className="o-osc-head__val"
        style={{ color: positive ? '#ef4444' : '#3b82f6' }}
      >
        近 12 月 {positive ? '+' : ''}
        {osc.last12} · {positive ? '暖位相' : '冷位相'}
      </span>
    </div>
  )
}

export default function OniTab({ oni, oniData, oscillations, oscData, ssta, sstaData }) {
  const pdo = oscData?.pdo
  const amo = oscData?.amo
  return (
    <div className="o-tab-content">
      <Panel
        title="ONI 厄尔尼诺指数（近 5 年）"
        source="NOAA CPC（cpc.ncep.noaa.gov），Niño 3.4 区 3 月滑动海温距平，12 小时刷新"
        icon={<LineChartOutlined />}
        loading={oni.loading}
        error={oni.error}
      >
        {oniData ? (
          <OniChart history={oniData.history} latest={oniData.latest} state={oniData.state} />
        ) : (
          <Empty description="暂无 ONI 数据" />
        )}
      </Panel>

      <Panel
        title="全球海洋温度距平（1850 → 今）"
        source="NOAA NCEI Climate at a Glance，全球海洋年均温距平，基准 1901–2000 年"
        icon={<LineChartOutlined />}
        loading={ssta.loading}
        error={ssta.error}
      >
        {sstaData ? (
          <>
            <div className="o-ssta-kpi">
              <span>
                {sstaData.latest.year} 年{' '}
                <b style={{ color: '#ef4444' }}>+{sstaData.latest.anom.toFixed(2)} °C</b>
              </span>
              <span>
                最暖年份 <b>{sstaData.warmest.year}</b>（+{sstaData.warmest.anom.toFixed(2)} °C）
              </span>
              <Tooltip title="1981–2010 是现代气候学常用的参照期；近 10 年与它的差距就是「加速」的量">
                <span className="is-info">
                  近 10 年均值 <b>+{sstaData.last10.toFixed(2)}</b> vs 1981–2010 均值{' '}
                  <b>+{sstaData.ref1981?.toFixed(2)}</b>
                </span>
              </Tooltip>
            </div>
            <AnomalyBars
              series={sstaData.recent.map((r) => ({ key: r.year, value: r.anom }))}
              ariaLabel="全球海洋温度距平年际变化"
              height={190}
            />
            <div className="o-chart__caption">
              地球因温室气体滞留的多余热量，九成以上进了海洋。这条曲线是「地球能量失衡」最直接的体温计——
              比气温距平更少受年际噪声干扰，也因此更难被短期波动「洗白」。
            </div>
          </>
        ) : (
          <Empty description="暂无海洋温度距平数据" />
        )}
      </Panel>

      <Panel
        title="年代际振荡：PDO 与 AMO"
        source="NOAA PSL（psl.noaa.gov）月值序列，缺测占位（PDO −9.90 / AMO −99.99）已剔除"
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
                  ariaLabel={`${osc.zh}年际变化`}
                  height={170}
                  digits={3}
                  unit=""
                  posColor={osc.color}
                  negColor="#3b82f6"
                />
                <div className="o-chart__caption">
                  {osc.zh}年均值（近 60 年）· 最新有效月 {osc.latest.ym}（{osc.latest.value}）·
                  持续同号数年才有位相意义，单月跳动不必解读
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无振荡指数数据" />
        )}
      </Panel>

      <Panel
        title="为什么全球都盯着 Niño 3.4"
        source="科普说明（静态）"
        icon={<CompassOutlined />}
      >
        <div className="o-prose">
          <p>
            赤道中东太平洋一片巴掌大的海域（5°N–5°S, 170°W–120°W），被称为
            <b> Niño 3.4</b>。这里海温比常年偏高 0.5 °C 以上并持续数月，就是
            <b>厄尔尼诺</b>（El Niño，圣婴）；偏低则是<b>拉尼娜</b>（La Niña，圣女）。
          </p>
          <p>
            别看它只是海温差了零点几度——海洋是地球最大的热量库，这片海一「发烧」，
            全球大气环流都会被改写：我国容易出现<strong>暖冬与南涝北旱</strong>，
            澳大利亚与东南亚易发干旱，大西洋飓风反而被抑制。
            NOAA 每个季度更新的 ONI 指数，就是全球气候预测最重要的「体温计」。
          </p>
          <p>
            而 PDO 与 AMO 是更慢的<b>背景音量旋钮</b>：同样强度的厄尔尼诺，
            在 PDO 暖位相下对北美的影响会更强。所以判断一次事件的实际影响，
            要把它放在年代际背景上看，而不是只看 ONI 的绝对值。
          </p>
        </div>
      </Panel>
    </div>
  )
}
