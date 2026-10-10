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

export default function FormTab() {
  const [tags, setTags] = useState(INITIAL_TAGS)
  const [device, setDevice] = useState()
  const [ranges, setRanges] = useState(DEFAULT_RANGES)

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card size="small" title="标签输入 TagInput" extra={<Tag color="cyan">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            空格 / 回车 / 中英文逗号都能提交；输入框为空时退格删除上一个；
            粘贴「甲, 乙 丙」会一次拆成三个标签。最多 6 个。
          </Paragraph>
          <TagInput value={tags} onChange={setTags} max={6} />
          <div className="kit-demo__status">当前标签：{tags.join(' / ') || '（空）'}</div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title="异步选择器 AsyncSelect" extra={<Tag color="cyan">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            首次展开或输入关键字时才请求（惰性加载）+ 300ms 防抖 + 请求竞态保护。
            支持按 <Text code>fields</Text> 映射字段、自定义选项渲染。
          </Paragraph>
          <Space direction="vertical" style={{ width: '100%' }}>
            <AsyncSelect
              load={loadDevices}
              value={device}
              onChange={setDevice}
              fields={{ value: 'id', label: 'name' }}
              placeholder="搜索资产名称 / 拼音 / 分组"
              style={{ width: '100%' }}
              renderOption={(item) => (
                <div className="kit-async-option">
                  <span>{item.name}</span>
                  <span className="kit-async-option__desc">{item.dept}</span>
                </div>
              )}
            />
            <AsyncSelect
              multiple
              autoLoad
              load={loadDevices}
              placeholder="多选 + 挂载即加载"
              style={{ width: '100%' }}
              fields={{ value: 'id', label: 'name' }}
            />
          </Space>
          <div className="kit-demo__status">
            已选：{device ? `${device.value} · ${device.label}` : '（未选择）'}
          </div>
        </Card>
      </Col>

      <Col span={24}>
        <Card
          size="small"
          title="时段录入 TimeRangeInput"
          extra={
            <Space size={8}>
              <Tag color="cyan">mobile</Tag>
              <Button size="small" onClick={() => setRanges(OVERLAP_RANGES)}>
                填入重叠时段
              </Button>
              <Button size="small" onClick={() => setRanges(DEFAULT_RANGES)}>
                恢复
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            保留原实现的三条校验（结束晚于开始 / 单段不超上限 / 两段不重叠）并补了
            「起止未填完整」的提示；合计工时实时计算。
          </Paragraph>
          <TimeRangeInput value={ranges} onChange={setRanges} maxHours={12} />
        </Card>
      </Col>
    </Row>
  )
}

/* =====================================================================
 * 页面
 * ===================================================================== */

