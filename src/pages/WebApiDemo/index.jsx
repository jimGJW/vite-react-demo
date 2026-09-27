import { useMemo, useRef, useState } from 'react'
import { Button, Card, Input, Space, Table, Tag, Typography } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { useCopy } from '../../components/Utils/index.js'
import {
  useFullscreen, useWakeLock, useGeolocation,
  useNotification, useShare, useNetworkInfo, useVibrate,
} from '../../components/WebApi/hooks.js'
import {
  detectCapabilities, networkTier, formatCoords, describePermission,
} from '../../components/WebApi/device.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

const CAPABILITY_COLUMNS = [
  { title: '能力', dataIndex: 'name', key: 'name', width: 150 },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
  {
    title: '支持',
    dataIndex: 'supported',
    key: 'supported',
    width: 78,
    render: (v) => (v ? <Tag color="green">支持</Tag> : <Tag color="default">不支持</Tag>),
  },
]

/* 环境快照：一次性读取，不随渲染变化 */
function readEnv() {
  const hasNav = typeof navigator !== 'undefined'
  const hasDoc = typeof document !== 'undefined'
  return {
    fullscreenEnabled: hasDoc && typeof document.documentElement.requestFullscreen === 'function',
    wakeLock: hasNav && 'wakeLock' in navigator,
    geolocation: hasNav && 'geolocation' in navigator,
    Notification: typeof Notification !== 'undefined',
    share: hasNav && typeof navigator.share === 'function',
    connection: hasNav && Boolean(navigator.connection),
    clipboard: hasNav && Boolean(navigator.clipboard),
    vibrate: hasNav && typeof navigator.vibrate === 'function',
  }
}

/**
 * 浏览器原生能力实验室。
 * 每个能力都给出 supported 状态 —— 不支持时明确告知，而不是点了没反应。
 */
export default function WebApiDemo() {
  const capabilities = useMemo(() => detectCapabilities(readEnv()), [])
  const stageRef = useRef(null)
  const [copyTextValue, setCopyTextValue] = useState('复制我试试')

  const { isFullscreen, toggle: toggleFullscreen, supported: fsSupported } = useFullscreen(stageRef)
  const wake = useWakeLock()
  const geo = useGeolocation()
  const notify = useNotification()
  const share = useShare()
  const net = useNetworkInfo()
  const vibrate = useVibrate()
  const { copied, copy } = useCopy()

  return (
    <div className="wad">
      <header className="wad__header">
        <Title level={4} className="wad__title">
          <ApiOutlined /> 浏览器原生能力实验室
        </Title>
        <Paragraph type="secondary" className="wad__lead">
          很多需求根本不用装库：全屏、屏幕常亮、定位、通知、分享、网络探测都是浏览器自带的。
          这里把它们收敛成 Hooks，统一带 <code>supported</code> 字段 —— 不支持时给出明确说明，
          而不是点了没反应。能力探测逻辑在 <code>device.js</code> 里是纯函数，有单测覆盖。
        </Paragraph>
      </header>

      <div className="wad__grid">
        {/* ===== 能力探测 ===== */}
        <Card size="small" className="wad__card" title="当前浏览器的能力探测">
          <div className="wad__stage">
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              columns={CAPABILITY_COLUMNS}
              dataSource={capabilities}
            />
            <Text type="secondary" className="wad__hint">
              结果随浏览器而异：Safari 的 Wake Lock 支持较晚，Network Information 主要是 Chromium 系，
              定位与剪贴板要求安全上下文（HTTPS 或 localhost）。
            </Text>
          </div>
        </Card>

        {/* ===== 全屏 ===== */}
        <Card size="small" className="wad__card" title="① 全屏：把任意元素切到全屏">
          <div className="wad__stage">
            <div ref={stageRef} className="wad__screen">
              <b>{isFullscreen ? '已进入全屏' : '演示舞台'}</b>
              <span>{isFullscreen ? '按 Esc 或再点一次按钮退出' : '点下方按钮把这个区域全屏'}</span>
            </div>
            <Space>
              <Button type="primary" disabled={!fsSupported} onClick={toggleFullscreen}>
                {isFullscreen ? '退出全屏' : '进入全屏'}
              </Button>
              {!fsSupported && <Tag color="default">当前环境不支持</Tag>}
            </Space>
            <pre className="wad__code">{`const stageRef = useRef(null)
const { isFullscreen, toggle, supported } = useFullscreen(stageRef)`}</pre>
          </div>
        </Card>

        {/* ===== 屏幕常亮 ===== */}
        <Card size="small" className="wad__card" title="② 屏幕常亮：Wake Lock">
          <div className="wad__stage">
            <Text type="secondary" className="wad__hint">
              适用于演示大屏、监控看板、录制过程。切到别的标签页时浏览器会自动释放锁，
              回到前台需要重新申请。
            </Text>
            <Space>
              <Button type="primary" disabled={!wake.supported || wake.active} onClick={wake.request}>
                申请常亮
              </Button>
              <Button disabled={!wake.active} onClick={wake.release}>释放</Button>
              <Tag color={wake.active ? 'green' : 'default'}>{wake.active ? '常亮中' : '未启用'}</Tag>
            </Space>
            {wake.error && <Text type="danger" style={{ fontSize: '0.78rem' }}>{wake.error}</Text>}
          </div>
        </Card>

        {/* ===== 定位 ===== */}
        <Card size="small" className="wad__card" title="③ 地理定位">
          <div className="wad__stage">
            <Space>
              <Button disabled={!geo.supported} loading={geo.loading} onClick={geo.locate}>
                获取当前位置
              </Button>
              {!geo.supported && <Tag color="default">当前环境不支持</Tag>}
            </Space>
            <div className="wad__zone">
              <Text style={{ fontSize: '0.85rem' }}>{formatCoords(geo.coords)}</Text>
            </div>
            {geo.error && <Text type="warning" style={{ fontSize: '0.78rem' }}>{geo.error}</Text>}
            <Text type="secondary" className="wad__hint">
              浏览器会弹授权框；拒绝或在非 HTTPS 环境下都会失败。失败信息直接回传，不做静默吞掉。
            </Text>
          </div>
        </Card>

        {/* ===== 通知 ===== */}
        <Card size="small" className="wad__card" title="④ 系统通知">
          <div className="wad__stage">
            <Space>
              <Button
                disabled={!notify.supported || notify.permission === 'granted'}
                onClick={notify.request}
              >
                申请授权
              </Button>
              <Button
                type="primary"
                disabled={notify.permission !== 'granted'}
                onClick={() => notify.notify('来自性能实验室', { body: '这是一条浏览器原生通知' })}
              >
                发一条通知
              </Button>
              <Tag color={notify.permission === 'granted' ? 'green' : 'default'}>
                {describePermission(notify.permission)}
              </Tag>
            </Space>
            <Text type="secondary" className="wad__hint">
              授权状态分三档：已授权 / 已拒绝 / 待询问。被拒绝后只能引导用户在浏览器设置里改，
              代码层面无法再弹窗。
            </Text>
          </div>
        </Card>

        {/* ===== 分享 / 震动 / 剪贴板 ===== */}
        <Card size="small" className="wad__card" title="⑤ 分享 · 震动 · 剪贴板">
          <div className="wad__stage">
            <Space wrap>
              <Button
                disabled={!share.supported}
                onClick={() => share.share({ title: '星际控制台', text: '浏览器原生分享', url: location.href })}
              >
                调起系统分享
              </Button>
              <Button disabled={!vibrate.supported} onClick={() => vibrate.vibrate([80, 40, 80])}>
                震动一下
              </Button>
            </Space>

            <Space.Compact style={{ width: '100%' }}>
              <Input value={copyTextValue} onChange={(e) => setCopyTextValue(e.target.value)} />
              <Button type="primary" onClick={() => copy(copyTextValue)}>
                {copied ? '已复制' : '复制'}
              </Button>
            </Space.Compact>

            <Text type="secondary" className="wad__hint">
              分享与震动在桌面端大多不可用（<code>supported</code> 会是 false），移动端效果最好。
            </Text>
          </div>
        </Card>

        {/* ===== 网络信息 ===== */}
        <Card size="small" className="wad__card" title="⑥ 网络信息：按网速降级加载">
          <div className="wad__stage">
            {net ? (
              <dl className="wad__kv">
                <div className="wad__row">
                  <dt>网络档位</dt>
                  <dd>{net.effectiveType || '未知'}（{networkTier(net.effectiveType)}）</dd>
                </div>
                <div className="wad__row">
                  <dt>下行带宽</dt>
                  <dd>{net.downlink} Mb/s</dd>
                </div>
                <div className="wad__row">
                  <dt>往返时延</dt>
                  <dd>{net.rtt} ms</dd>
                </div>
                <div className="wad__row">
                  <dt>省流量模式</dt>
                  <dd>{net.saveData ? '已开启' : '未开启'}</dd>
                </div>
              </dl>
            ) : (
              <Text type="secondary" className="wad__hint">
                当前浏览器不支持 Network Information API（主要是 Chromium 系可用）。
              </Text>
            )}
            <Text type="secondary" className="wad__hint">
              实用场景：弱网（2g / saveData）时自动降级为低清图、关闭自动播放、延后非关键请求。
            </Text>
            <pre className="wad__code">{`const net = useNetworkInfo()
if (net && net.saveData) loadLiteAssets()`}</pre>
          </div>
        </Card>
      </div>
    </div>
  )
}
