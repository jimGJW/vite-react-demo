/**
 * 「厄尔尼诺」Tab：ONI 指数历史柱状 + Niño 3.4 科普说明。
 * 数据由 useOceanData 的 oni 轮询提供（NOAA CPC，12 小时刷新）。
 */
import { CompassOutlined, LineChartOutlined } from '@ant-design/icons'
import { Empty } from 'antd'
import { Panel } from './ui.jsx'
import OniChart from './OniChart.jsx'

export default function OniTab({ oni, oniData }) {
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
        </div>
      </Panel>
    </div>
  )
}
