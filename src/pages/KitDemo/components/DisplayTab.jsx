import { useMemo, useState } from 'react'
import { Button, Card, Col, Row, Space, Switch, Tag, Typography } from 'antd'
const { Paragraph, Text } = Typography
import {
  AsyncSelect, AutoScrollText, Countdown, Ellipsis, FloatingBall, InfiniteScroll,
  MiniArea, MiniBar, MiniProgress, NoticePanel, PullToRefresh, SignaturePad,
  SortableList, StatCard, TagInput, TimeRangeInput, TimelineChart, WaterWave,
} from '../../../components/Kit/index.js'
import { LONG_TEXT, DEVICES, STAT_AREA, STAT_BAR, TIMELINE, NOTICE_TABS, DEFAULT_RANGES, OVERLAP_RANGES, INITIAL_CARDS, INITIAL_TAGS, COUNTDOWN_TARGET, makeRows, loadDevices } from './KitData.js'
import { ArrowUpOutlined, ReloadOutlined } from '@ant-design/icons'

export default function DisplayTab() {
  const [range, setRange] = useState('week')
  const [noticeCount, setNoticeCount] = useState(undefined)
  const deadline = COUNTDOWN_TARGET

  const chartData = useMemo(
    () => (range === 'week' ? STAT_AREA : STAT_AREA.slice(0, 4).map((item, i) => ({ ...item, y: item.y + i * 4 }))),
    [range],
  )

  const noticeTabs = NOTICE_TABS

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card
          size="small"
          title="文本省略 Ellipsis"
          extra={
            <Space size={8}>
              <Tag color="purple">pad</Tag>
              <Button size="small" onClick={() => setRange((v) => (v === 'week' ? 'day' : 'week'))}>
                切换数据
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            单行为 <Text code>nowrap + ellipsis</Text>，多行走 <Text code>-webkit-line-clamp</Text>。
            原实现的「二分法逐字测量」在支持 line-clamp 的浏览器上已无必要，整段删除。
          </Paragraph>
          <div className="kit-demo__stack">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>单行 + Tooltip</Text>
              <Ellipsis lines={1}>{LONG_TEXT}</Ellipsis>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>两行省略</Text>
              <Ellipsis lines={2}>{LONG_TEXT}</Ellipsis>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>两行 + 可展开</Text>
              <Ellipsis lines={2} expandable>{LONG_TEXT}</Ellipsis>
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card size="small" title="倒计时 Countdown" extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            原实现每秒自减，后台标签页被节流后会累积漂移；这里每 tick 用
            <Text code> Date.now() </Text>重算，回到前台立即校正。
          </Paragraph>
          <div className="kit-demo__stack">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>卡片样式（目标：2 小时 45 分钟后）</Text>
              <div style={{ marginTop: 6 }}>
                <Countdown target={deadline} />
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>纯文本样式 DD 天 HH:mm:ss</Text>
              <div style={{ marginTop: 6 }}>
                <Countdown target={deadline} variant="plain" pattern="DD 天 HH:mm:ss" />
              </div>
            </div>
          </div>
        </Card>
      </Col>

      <Col span={24}>
        <Card size="small" title="指标卡 StatCard（涨红跌绿）" extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            合并了原项目的 NumberInfo + Trend。颜色遵循国内习惯——
            <Text strong> 上涨红色、下跌绿色</Text>，需要欧美配色时传 <Text code>colorMode=&quot;us&quot;</Text>。
          </Paragraph>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="本月工单完成率"
                value={92.6}
                precision={1}
                suffix="%"
                status="up"
                trend={4.8}
                footer="较上月 +4.8 个百分点"
                chart={<MiniProgress percent={92.6} target={95} label="目标 95%" />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="日均巡检量"
                value={54}
                suffix="次"
                status="down"
                trend={-3.2}
                subTitle="近 7 日均值"
                chart={<MiniArea data={chartData} height={56} />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="各组资产数"
                value={196}
                suffix="台"
                footer="机房占比最高"
                chart={<MiniBar data={STAT_BAR} height={78} showLabel />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="设备在线率"
                value={87.4}
                precision={1}
                suffix="%"
                status="up"
                trend={1.6}
                chart={<WaterWave percent={87.4} size={110} title="在线" />}
              />
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24} lg={14}>
        <Card size="small" title="时间趋势 TimelineChart" extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            原实现依赖 G2 + g2-plugin-slider（且 domId 用 <Text code>Math.random()</Text> 生成，
            React 19 严格模式下双调用会不一致）；ECharts 的 <Text code>dataZoom</Text> 是内置能力，
            底部缩放条 + 滚轮缩放一次配好。
          </Paragraph>
          <TimelineChart
            data={TIMELINE}
            height={260}
            seriesNames={['入库', '出库']}
          />
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card
          size="small"
          title="通知面板 NoticePanel"
          extra={
            <Space size={8}>
              <Tag color="purple">pad</Tag>
              <Button size="small" icon={<ReloadOutlined />} onClick={() => setNoticeCount(0)}>
                全部已读
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            合并了原项目的 NoticeIcon 与 Cart（两者 90% 重复）。清空按钮支持二次确认
            —— 把 <Text code>onClear</Text> 写成返回 Promise 即可。
          </Paragraph>
          <div className="kit-demo__center">
            <NoticePanel
              count={noticeCount}
              tabs={noticeTabs}
              onItemClick={(item) => console.log('点击通知', item)}
              onClear={(key) => console.log('清空分组', key)}
            />
            <Text type="secondary" style={{ marginLeft: 16, fontSize: 12 }}>点铃铛展开</Text>
          </div>
        </Card>
      </Col>
    </Row>
  )
}

