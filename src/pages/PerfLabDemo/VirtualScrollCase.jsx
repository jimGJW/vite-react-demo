import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, Segmented, Tag, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { VirtualList } from '@components/PerfLab/index.js'
import { useI18n, pickLang } from '@i18n/index.js'
import './index.scss'

const { Text } = Typography

const ROW_H = 36
const VIEW_H = 320
/** 全量渲染的安全上限：再往上浏览器会明显卡死，没必要硬撑 */
const FULL_CAP = 5000

const GROUPS = [
  { 'zh-CN': '计算集群', en: 'Compute' },
  { 'zh-CN': '存储集群', en: 'Storage' },
  { 'zh-CN': '网络集群', en: 'Network' },
  { 'zh-CN': '边缘节点', en: 'Edge' },
  { 'zh-CN': '安全域', en: 'Security' },
]

/* 造数据：10 万行也能在百毫秒内生成完 */
function buildRows(n, lang) {
  const rows = new Array(n)
  for (let i = 0; i < n; i += 1) {
    rows[i] = {
      id: `r-${i}`,
      name: `${pickLang(GROUPS[i % GROUPS.length], lang)} · ${i + 1}`,
      value: (i * 7919) % 1000,
    }
  }
  return rows
}

/* 提到模块级：不随父组件重建，避免无谓的 props 变化 */
function renderRow(row, i) {
  return (
    <div key={row.id} className="perf-lab__vrow">
      <i>#{i}</i>
      <em>{row.name}</em>
      <span>{row.value}</span>
    </div>
  )
}

/**
 * 虚拟滚动 vs 全量渲染 对照实验。
 * 左右两个列表喂同一份数据，用「实测 DOM 行数」说话，而不是靠体感。
 */
export default function VirtualScrollCase() {
  const { t, lang } = useI18n()
  const SIZE_OPTIONS = [
    { label: t('perf.vscroll.k1'), value: 1000 },
    { label: t('perf.vscroll.k10'), value: 10000 },
    { label: t('perf.vscroll.k100'), value: 100000 },
  ]

  const [size, setSize] = useState(1000)
  const [live, setLive] = useState({ rendered: 0, total: 0 })

  const rows = useMemo(() => buildRows(size, lang), [size, lang])
  const plainRows = useMemo(() => rows.slice(0, Math.min(size, FULL_CAP)), [rows, size])

  const vWrapRef = useRef(null)
  const fWrapRef = useRef(null)
  const vNodeRef = useRef(null)
  const fNodeRef = useRef(null)

  /* 实测 DOM 里的行数：只在数据量变化时统计，滚动时不必反复扫节点 */
  useEffect(() => {
    const v = vWrapRef.current ? vWrapRef.current.querySelectorAll('.perf-lab__vrow').length : 0
    const f = fWrapRef.current ? fWrapRef.current.querySelectorAll('.perf-lab__vrow').length : 0
    if (vNodeRef.current) vNodeRef.current.textContent = String(v)
    if (fNodeRef.current) fNodeRef.current.textContent = String(f)
  }, [size])

  const onStatsChange = useCallback((s) => setLive(s), [])

  return (
    <Card
      size="small"
      className="perf-lab__card"
      title={(
        <span><ThunderboltOutlined /> {t('perf.vscroll.title')}</span>
      )}
      extra={<Segmented size="small" value={size} onChange={setSize} options={SIZE_OPTIONS} />}
    >
      <div className="perf-lab__stage">
        <Text type="secondary" className="perf-lab__hint">
          {t('perf.vscroll.hint1')}{rows.length.toLocaleString()}{t('perf.vscroll.hint2')}{ROW_H}{t('perf.vscroll.hint3')}
        </Text>

        <div className="perf-lab__cols">
          <section ref={vWrapRef}>
            <div className="perf-lab__row" style={{ marginBottom: 6 }}>
              <Tag color="blue">{t('perf.vscroll.virtualTag')}</Tag>
              <Text type="secondary" style={{ fontSize: '0.78rem' }}>
                {t('perf.vscroll.liveRender')} <b ref={vNodeRef}>0</b> / {rows.length.toLocaleString()}{t('perf.vscroll.rowUnit')}
              </Text>
            </div>
            <VirtualList
              items={rows}
              itemHeight={ROW_H}
              height={VIEW_H}
              renderItem={renderRow}
              onStatsChange={onStatsChange}
              empty={<div style={{ padding: 16 }}>{t('perf.vscroll.noData')}</div>}
            />
          </section>

          <section ref={fWrapRef}>
            <div className="perf-lab__row" style={{ marginBottom: 6 }}>
              <Tag color="red">{t('perf.vscroll.fullTag')}</Tag>
              <Text type="secondary" style={{ fontSize: '0.78rem' }}>
                {t('perf.vscroll.fullRender')} <b ref={fNodeRef}>0</b>{t('perf.vscroll.rowUnit')}
                {size > FULL_CAP ? `${t('perf.vscroll.truncatedPre')}${FULL_CAP.toLocaleString()}${t('perf.vscroll.truncatedPost')}` : ''}
              </Text>
            </div>
            <div className="perf-plain-list">
              {plainRows.map((row, i) => renderRow(row, i))}
            </div>
          </section>
        </div>

        <dl className="perf-lab__stats">
          <div className="perf-lab__stat">
            <dt>{t('perf.vscroll.total')}</dt>
            <dd>{rows.length.toLocaleString()}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>{t('perf.vscroll.vRendered')}</dt>
            <dd>{live.rendered || '—'}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>{t('perf.vscroll.fRendered')}</dt>
            <dd>{plainRows.length.toLocaleString()}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>{t('perf.vscroll.ratio')}</dt>
            <dd>
              {plainRows.length > 0 && live.rendered > 0
                ? `${Math.round(plainRows.length / live.rendered)}×`
                : '—'}
            </dd>
          </div>
        </dl>

        <pre className="perf-lab__code">{`import { VirtualList } from '@/components/PerfLab'

<VirtualList
  items={rows}          // 10 万行也照喂
  itemHeight={36}       // 定高是前提
  height={320}
  overscan={4}          // 上下各多渲染 4 行，防快速滚动露白
  renderItem={(row, i) => (
    <div key={row.id} className="row">{row.name}</div>  // key 用业务 id
  )}
/>`}</pre>

        <Text type="secondary" className="perf-lab__hint">
          {t('perf.vscroll.pitfall1')}<code>renderItem</code>{t('perf.vscroll.pitfall2')}<code>key</code>{t('perf.vscroll.pitfall3')}
        </Text>
      </div>
    </Card>
  )
}
