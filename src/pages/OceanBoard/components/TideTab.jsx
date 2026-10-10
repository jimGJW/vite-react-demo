/**
 * 「潮汐」Tab：旧金山站过去 24h 实测潮位曲线 + 未来 48h 高低潮预报表。
 * 数据由 useOceanData 的 tides / tidePred 轮询提供。
 */
import { CloudOutlined, DotChartOutlined, LineChartOutlined } from '@ant-design/icons'
import { Empty, Table, Tag, Tooltip } from 'antd'
import { Panel, fmtSiteDay } from './ui.jsx'
import TideCurve from './TideCurve.jsx'
import { zhTideDatum } from '../../../lib/earth/glossary.js'

/** 站点气温概况条（与潮位同站，给「海陆温差」一个上下文） */
function StationWeather({ wx }) {
  if (!wx) return null
  return (
    <div className="o-stnwx">
      <span>
        站点气温{' '}
        <b>
          {wx.latest.v.toFixed(1)} °C
        </b>
        <span className="o-stnwx__sub">（{wx.latest.t.slice(11, 16)} 站点时间）</span>
      </span>
      <span>
        24h 区间 <b>{wx.min.toFixed(1)}</b> ~ <b>{wx.max.toFixed(1)}</b> °C
      </span>
      <Tooltip title="海陆温差驱动海陆风：白天陆地升温快，风从海上吹向陆地；夜间相反。旧金山的夏季浓雾就源自这个温差">
        <span className="is-info">海陆温差 → 海陆风与雾</span>
      </Tooltip>
    </div>
  )
}

export default function TideTab({ tides, tideData, tidePred, predData, stationWeather, wxData }) {
  return (
    <div className="o-tab-content">
      <Panel
        title="实测潮位（过去 24 小时）"
        source="NOAA CO-OPS 潮位站 9414290（旧金山），6 分钟采样，6 分钟刷新"
        icon={<LineChartOutlined />}
        loading={tides.loading}
        error={tides.error}
      >
        {tideData ? (
          <TideCurve series={tideData.series} latest={tideData.latest} station={tideData.station} />
        ) : (
          <Empty description="暂无潮位数据" />
        )}
      </Panel>

      <Panel
        title="高低潮预报（未来 48 小时）"
        source="NOAA CO-OPS 调和预报（interval=hilo），1 小时刷新；时间为站点当地时间"
        icon={<DotChartOutlined />}
        loading={tidePred.loading}
        error={tidePred.error}
      >
        {predData ? (
          <Table
            className="o-tide-table"
            size="small"
            rowKey={(r) => r.t}
            dataSource={predData.events}
            pagination={{ pageSize: 8, size: 'small', showTotal: (t) => `共 ${t} 个潮候` }}
            columns={[
              {
                title: '时刻（站点）',
                dataIndex: 't',
                width: 140,
                render: (t) => fmtSiteDay(t),
              },
              {
                title: '类型',
                dataIndex: 'type',
                width: 100,
                render: (t) =>
                  t === 'H' ? <Tag color="blue">高潮</Tag> : <Tag color="cyan">低潮</Tag>,
              },
              {
                title: '预报潮高',
                dataIndex: 'v',
                align: 'right',
                render: (v) => `${v.toFixed(2)} m（MLLW）`,
              },
            ]}
          />
        ) : (
          <Empty description="暂无潮汐预报" />
        )}
      </Panel>

      <Panel
        title="站点气温实况（与潮位同站）"
        source="NOAA CO-OPS 气象传感器，旧金山站 9414290，30 分钟刷新"
        icon={<CloudOutlined />}
        loading={stationWeather.loading}
        error={stationWeather.error}
      >
        {wxData ? <StationWeather wx={wxData} /> : <Empty description="暂无站点气象数据" />}
      </Panel>

      <Panel
        title="潮位基准面是什么意思"
        source="科普说明（静态）"
        icon={<LineChartOutlined />}
      >
        <div className="o-prose">
          <p>
            潮位表的零点不是海平面，而是一个约定的<b>基准面</b>。本站用的是{' '}
            <Tooltip title={zhTideDatum('MLLW')?.desc}>
              <b className="is-info">MLLW（平均较低低潮面）</b>
            </Tooltip>
            ——取每日两次低潮中<b>较低</b>的那一个做长期平均。美国海图与潮位表通用它，
            好处是绝大多数实测水位都为正，不会出现负潮位带来的换算混乱。
          </p>
          <p>
            注意它和「平均海平面 MSL」不是一回事：MSL 才是海平面上升研究用的基准。
            同一个验潮站的 MLLW 与 MSL 之间可以差出半米以上，
            <strong>跨基准引用潮位必须做换算</strong>，否则会凭空多出或吃掉几十厘米。
          </p>
        </div>
      </Panel>
    </div>
  )
}
