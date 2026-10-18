import { useMemo, useRef, useState } from 'react'
import { Button, Card, Input, Space, Table, Tag, Typography } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { useCopy } from '@components/Utils/index.js'
import {
  useFullscreen, useWakeLock, useGeolocation,
  useNotification, useShare, useNetworkInfo, useVibrate,
} from '@components/WebApi/hooks.js'
import {
  detectCapabilities, networkTier, formatCoords, describePermission,
} from '@components/WebApi/device.js'
import './index.scss'
import { useI18n } from '@i18n/index.js'

const { Title, Paragraph, Text } = Typography


import { makeCapabilityColumns, readEnv } from './components/webApiUtils.jsx'

export default function WebApiDemo() {
  const { t } = useI18n()
  const capabilities = useMemo(() => detectCapabilities(readEnv()), [])
  const stageRef = useRef(null)
  const [copyTextValue, setCopyTextValue] = useState(t('webApi.copyDemo'))
  const capColumns = useMemo(() => makeCapabilityColumns(t), [t])

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
          <ApiOutlined /> {t('webApi.title')}
        </Title>
        <Paragraph type="secondary" className="wad__lead">
          {t('webApi.lead1')}<code>supported</code>{t('webApi.lead2')}<code>device.js</code>{t('webApi.lead3')}
        </Paragraph>
      </header>

      <div className="wad__grid">
        {/* ===== 能力探测 ===== */}
        <Card size="small" className="wad__card" title={t('webApi.capTitle')}>
          <div className="wad__stage">
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              columns={capColumns}
              dataSource={capabilities}
            />
            <Text type="secondary" className="wad__hint">
              {t('webApi.capHint')}
            </Text>
          </div>
        </Card>

        {/* ===== 全屏 ===== */}
        <Card size="small" className="wad__card" title={t('webApi.fsTitle')}>
          <div className="wad__stage">
            <div ref={stageRef} className="wad__screen">
              <b>{isFullscreen ? t('webApi.fsEntered') : t('webApi.fsStage')}</b>
              <span>{isFullscreen ? t('webApi.fsExitHint') : t('webApi.fsEnterHint')}</span>
            </div>
            <Space>
              <Button type="primary" disabled={!fsSupported} onClick={toggleFullscreen}>
                {isFullscreen ? t('webApi.fsExit') : t('webApi.fsEnter')}
              </Button>
              {!fsSupported && <Tag color="default">{t('webApi.unsupported')}</Tag>}
            </Space>
            <pre className="wad__code">{`const stageRef = useRef(null)
const { isFullscreen, toggle, supported } = useFullscreen(stageRef)`}</pre>
          </div>
        </Card>

        {/* ===== 屏幕常亮 ===== */}
        <Card size="small" className="wad__card" title={t('webApi.wakeTitle')}>
          <div className="wad__stage">
            <Text type="secondary" className="wad__hint">
              {t('webApi.wakeHint')}
            </Text>
            <Space>
              <Button type="primary" disabled={!wake.supported || wake.active} onClick={wake.request}>
                {t('webApi.wakeRequest')}
              </Button>
              <Button disabled={!wake.active} onClick={wake.release}>{t('webApi.wakeRelease')}</Button>
              <Tag color={wake.active ? 'green' : 'default'}>{wake.active ? t('webApi.wakeActive') : t('webApi.wakeInactive')}</Tag>
            </Space>
            {wake.error && <Text type="danger" style={{ fontSize: '0.78rem' }}>{wake.error}</Text>}
          </div>
        </Card>

        {/* ===== 定位 ===== */}
        <Card size="small" className="wad__card" title={t('webApi.geoTitle')}>
          <div className="wad__stage">
            <Space>
              <Button disabled={!geo.supported} loading={geo.loading} onClick={geo.locate}>
                {t('webApi.geoLocate')}
              </Button>
              {!geo.supported && <Tag color="default">{t('webApi.unsupported')}</Tag>}
            </Space>
            <div className="wad__zone">
              <Text style={{ fontSize: '0.85rem' }}>{formatCoords(geo.coords)}</Text>
            </div>
            {geo.error && <Text type="warning" style={{ fontSize: '0.78rem' }}>{geo.error}</Text>}
            <Text type="secondary" className="wad__hint">
              {t('webApi.geoHint')}
            </Text>
          </div>
        </Card>

        {/* ===== 通知 ===== */}
        <Card size="small" className="wad__card" title={t('webApi.notifyTitle')}>
          <div className="wad__stage">
            <Space>
              <Button
                disabled={!notify.supported || notify.permission === 'granted'}
                onClick={notify.request}
              >
                {t('webApi.notifyRequest')}
              </Button>
              <Button
                type="primary"
                disabled={notify.permission !== 'granted'}
                onClick={() => notify.notify(t('webApi.notifyTitle2'), { body: t('webApi.notifyBody') })}
              >
                {t('webApi.notifySend')}
              </Button>
              <Tag color={notify.permission === 'granted' ? 'green' : 'default'}>
                {describePermission(notify.permission)}
              </Tag>
            </Space>
            <Text type="secondary" className="wad__hint">
              {t('webApi.notifyHint')}
            </Text>
          </div>
        </Card>

        {/* ===== 分享 / 震动 / 剪贴板 ===== */}
        <Card size="small" className="wad__card" title={t('webApi.shareTitle')}>
          <div className="wad__stage">
            <Space wrap>
              <Button
                disabled={!share.supported}
                onClick={() => share.share({ title: t('webApi.shareTitle2'), text: t('webApi.shareText'), url: location.href })}
              >
                {t('webApi.shareInvoke')}
              </Button>
              <Button disabled={!vibrate.supported} onClick={() => vibrate.vibrate([80, 40, 80])}>
                {t('webApi.vibrateOnce')}
              </Button>
            </Space>

            <Space.Compact style={{ width: '100%' }}>
              <Input value={copyTextValue} onChange={(e) => setCopyTextValue(e.target.value)} />
              <Button type="primary" onClick={() => copy(copyTextValue)}>
                {copied ? t('webApi.copied') : t('webApi.copy')}
              </Button>
            </Space.Compact>

            <Text type="secondary" className="wad__hint">
              {t('webApi.shareVibHint1')}<code>supported</code>{t('webApi.shareVibHint2')}
            </Text>
          </div>
        </Card>

        {/* ===== 网络信息 ===== */}
        <Card size="small" className="wad__card" title={t('webApi.netTitle')}>
          <div className="wad__stage">
            {net ? (
              <dl className="wad__kv">
                <div className="wad__row">
                  <dt>{t('webApi.netTier')}</dt>
                  <dd>{net.effectiveType || t('webApi.netUnknown')}（{networkTier(net.effectiveType)}）</dd>
                </div>
                <div className="wad__row">
                  <dt>{t('webApi.netDownlink')}</dt>
                  <dd>{net.downlink} Mb/s</dd>
                </div>
                <div className="wad__row">
                  <dt>{t('webApi.netRtt')}</dt>
                  <dd>{net.rtt} ms</dd>
                </div>
                <div className="wad__row">
                  <dt>{t('webApi.netSaveData')}</dt>
                  <dd>{net.saveData ? t('webApi.netOn') : t('webApi.netOff')}</dd>
                </div>
              </dl>
            ) : (
              <Text type="secondary" className="wad__hint">
                {t('webApi.netUnsupportedHint')}
              </Text>
            )}
            <Text type="secondary" className="wad__hint">
              {t('webApi.netScenario')}
            </Text>
            <pre className="wad__code">{`const net = useNetworkInfo()
if (net && net.saveData) loadLiteAssets()`}</pre>
          </div>
        </Card>
      </div>
    </div>
  )
}
