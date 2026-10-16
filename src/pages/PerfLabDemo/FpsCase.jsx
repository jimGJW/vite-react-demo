import { useEffect, useMemo, useState } from 'react'
import { Card, Segmented, Switch, Tag, Typography } from 'antd'
import { DashboardOutlined } from '@ant-design/icons'
import { useFps, summarizeFrames, toPolylinePoints } from '../../components/PerfLab/index.js'
import { fib } from '../../components/PerfLab/workerClient.js'
import { useI18n } from '../../i18n/index.js'
import './index.scss'

const { Text } = Typography

const BOX = { width: 240, height: 48 }

/**
 * 实时帧率监测。
 * 开「压力测试」后每帧塞一个斐波那契计算进去，主线程被占满，
 * 曲线会当场塌下去 —— 掉帧这件事不用靠猜。
 */
export default function FpsCase() {
  const { t } = useI18n()
  const [running, setRunning] = useState(true)
  const [stress, setStress] = useState(false)
  const { fps, history } = useFps({ running, sampleMs: 500, keep: 60 })

  /* 压力源：每帧算一次斐波那契，吃掉一帧的时间预算 */
  useEffect(() => {
    if (!stress) return undefined
    let raf = 0
    let stopped = false
    const tick = () => {
      if (stopped) return
      fib(24)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [stress])

  const stats = useMemo(
    () => summarizeFrames(history.map((f) => (f > 0 ? 1000 / f : 0))),
    [history],
  )
  const points = useMemo(() => toPolylinePoints(history, BOX, 60), [history])

  const level = fps >= 55 ? 'good' : (fps >= 30 ? 'warn' : 'bad')
  const levelText = {
    good: t('perf.fps.levelGood'),
    warn: t('perf.fps.levelWarn'),
    bad: t('perf.fps.levelBad'),
  }

  return (
    <Card
      size="small"
      className="perf-lab__card"
      title={<span><DashboardOutlined /> {t('perf.fps.title')}</span>}
      extra={<Segmented size="small" value={stress ? 'on' : 'off'} onChange={(v) => setStress(v === 'on')} options={[{ label: t('perf.fps.idle'), value: 'off' }, { label: t('perf.fps.stress'), value: 'on' }]} />}
    >
      <div className="perf-lab__stage">
        <div className="perf-lab__row">
          <div className={`perf-lab__fps perf-lab__fps--${level}`}>
            <b>{running ? (fps || '—') : '—'}</b>
            <span>FPS</span>
          </div>
          <Tag color={level === 'good' ? 'green' : (level === 'warn' ? 'orange' : 'red')}>
            {running ? levelText[level] : t('perf.fps.stopped')}
          </Tag>
          <Switch
            checked={running}
            onChange={setRunning}
            checkedChildren={t('perf.fps.sampling')}
            unCheckedChildren={t('perf.fps.pausedSwitch')}
          />
        </div>

        <svg className="perf-lab__spark" viewBox={`0 0 ${BOX.width} ${BOX.height}`} preserveAspectRatio="none" role="img" aria-label={t('perf.fps.trendAria')}>
          {/* 参考线：60fps 顶格 / 30fps 腰线 */}
          <line x1="0" y1="0" x2={BOX.width} y2="0" stroke="var(--c-border-soft, #f0f0f0)" strokeWidth="1" />
          <line x1="0" y1={BOX.height / 2} x2={BOX.width} y2={BOX.height / 2} stroke="var(--c-border, #d9d9d9)" strokeWidth="1" strokeDasharray="4 4" />
          {points && (
            <polyline
              points={points}
              fill="none"
              stroke={level === 'good' ? '#52c41a' : (level === 'warn' ? '#faad14' : '#ff4d4f')}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          )}
        </svg>

        <dl className="perf-lab__stats">
          <div className="perf-lab__stat">
            <dt>{t('perf.fps.avgFps')}</dt>
            <dd>{stats.avgFps || '—'}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>{t('perf.fps.minFps')}</dt>
            <dd>{stats.minFps || '—'}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>{t('perf.fps.p95Fps')}</dt>
            <dd>{stats.p95Fps || '—'}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>{t('perf.fps.jank')}</dt>
            <dd>{stats.jank || 0}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>{t('perf.fps.worstFrame')}</dt>
            <dd>{stats.worstFrame ? `${stats.worstFrame}ms` : '—'}</dd>
          </div>
        </dl>

        <Text type="secondary" className="perf-lab__hint">
          {t('perf.fps.hint1')}
        </Text>

        <pre className="perf-lab__code">{`import { useFps, summarizeFrames } from '@/components/PerfLab'

const { fps, history } = useFps({ running: true, sampleMs: 500, keep: 60 })

// history 是最近 60 个采样点，换算回帧间隔即可汇总
const stats = summarizeFrames(history.map((f) => 1000 / f))
// → { avgFps, minFps, p95Fps, jank, jankRatio, worstFrame }`}</pre>

        <Text type="secondary" className="perf-lab__hint">
          {t('perf.fps.hint2')}
        </Text>
      </div>
    </Card>
  )
}
