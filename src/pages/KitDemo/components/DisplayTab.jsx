import { useMemo, useState } from 'react'
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd'
const { Paragraph, Text } = Typography
import {
  Countdown, Ellipsis,
  MiniArea, MiniBar, MiniProgress, NoticePanel,
  StatCard, TimelineChart, WaterWave,
} from '@components/Kit/index.js'
import { STAT_AREA, STAT_BAR, TIMELINE, NOTICE_TABS, COUNTDOWN_TARGET } from './KitData.js'
import { ReloadOutlined } from '@ant-design/icons'
import { useI18n, pickLang } from '@i18n/index.js'

export default function DisplayTab() {
  const { t, lang } = useI18n()
  const [range, setRange] = useState('week')
  const [noticeCount, setNoticeCount] = useState(undefined)
  const deadline = COUNTDOWN_TARGET

  /* STAT_AREA / STAT_BAR 的 x 是 { '<lang>': text } 形态，喂给 ECharts 前按当前语种挑出字符串 */
  const chartData = useMemo(
    () => {
      const base =
        range === 'week'
          ? STAT_AREA
          : STAT_AREA.slice(0, 4).map((item, i) => ({ ...item, y: item.y + i * 4 }))
      return base.map((item) => ({ ...item, x: pickLang(item.x, lang) }))
    },
    [range, lang],
  )

  const statBarData = useMemo(
    () => STAT_BAR.map((item) => ({ ...item, x: pickLang(item.x, lang) })),
    [lang],
  )

  /* NOTICE_TABS 的 title/desc/time 是 { '<lang>': text } 形态，按当前语种挑出字符串
   * 再交给 NoticePanel（它是通用组件，只认字符串） */
  const noticeTabs = useMemo(
    () =>
      NOTICE_TABS.map((tab) => ({
        ...tab,
        title: pickLang(tab.title, lang),
        items: tab.items.map((item) => ({
          ...item,
          title: pickLang(item.title, lang),
          desc: pickLang(item.desc, lang),
          time: pickLang(item.time, lang),
        })),
      })),
    [lang],
  )

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card
          size="small"
          title={t('kit.display.ellipsisTitle')}
          extra={
            <Space size={8}>
              <Tag color="purple">pad</Tag>
              <Button size="small" onClick={() => setRange((v) => (v === 'week' ? 'day' : 'week'))}>
                {t('kit.display.switchData')}
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.display.ellipsisDesc')}
          </Paragraph>
          <div className="kit-demo__stack">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('kit.display.singleTooltip')}</Text>
              <Ellipsis lines={1}>{t('kit.data.longText')}</Ellipsis>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('kit.display.twoLines')}</Text>
              <Ellipsis lines={2}>{t('kit.data.longText')}</Ellipsis>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('kit.display.twoLinesExpand')}</Text>
              <Ellipsis lines={2} expandable>{t('kit.data.longText')}</Ellipsis>
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card size="small" title={t('kit.display.countdownTitle')} extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.display.countdownDesc')}
          </Paragraph>
          <div className="kit-demo__stack">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('kit.display.countdownCardLabel')}</Text>
              <div style={{ marginTop: 6 }}>
                <Countdown target={deadline} />
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('kit.display.countdownPlainLabel')}</Text>
              <div style={{ marginTop: 6 }}>
                <Countdown target={deadline} variant="plain" pattern="DD 天 HH:mm:ss" />
              </div>
            </div>
          </div>
        </Card>
      </Col>

      <Col span={24}>
        <Card size="small" title={t('kit.display.statTitle')} extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.display.statDesc')}
          </Paragraph>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title={t('kit.stat.completionTitle')}
                value={92.6}
                precision={1}
                suffix="%"
                status="up"
                trend={4.8}
                footer={t('kit.stat.completionFooter')}
                chart={<MiniProgress percent={92.6} target={95} label={t('kit.miniProgress.target')} />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title={t('kit.stat.inspectTitle')}
                value={54}
                suffix="次"
                status="down"
                trend={-3.2}
                subTitle={t('kit.stat.inspectSub')}
                chart={<MiniArea data={chartData} height={56} />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title={t('kit.stat.assetTitle')}
                value={196}
                suffix="台"
                footer={t('kit.stat.assetFooter')}
                chart={<MiniBar data={statBarData} height={78} showLabel />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title={t('kit.stat.onlineTitle')}
                value={87.4}
                precision={1}
                suffix="%"
                status="up"
                trend={1.6}
                chart={<WaterWave percent={87.4} size={110} title={t('kit.stat.onlineWave')} />}
              />
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24} lg={14}>
        <Card size="small" title={t('kit.display.timelineTitle')} extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.display.timelineDesc')}
          </Paragraph>
          <TimelineChart
            data={TIMELINE}
            height={260}
            seriesNames={[t('kit.demo.inbound'), t('kit.demo.outbound')]}
          />
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card
          size="small"
          title={t('kit.display.noticeTitle')}
          extra={
            <Space size={8}>
              <Tag color="purple">pad</Tag>
              <Button size="small" icon={<ReloadOutlined />} onClick={() => setNoticeCount(0)}>
                {t('kit.display.markAllRead')}
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.display.noticeDesc')}
          </Paragraph>
          <div className="kit-demo__center">
            <NoticePanel
              count={noticeCount}
              tabs={noticeTabs}
              onItemClick={(item) => console.log('点击通知', item)}
              onClear={(key) => console.log('清空分组', key)}
            />
            <Text type="secondary" style={{ marginLeft: 16, fontSize: 12 }}>{t('kit.display.noticeHint')}</Text>
          </div>
        </Card>
      </Col>
    </Row>
  )
}
