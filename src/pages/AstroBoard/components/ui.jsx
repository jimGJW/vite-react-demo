import { useEffect, useState } from 'react'
import { Button, Popover, Spin, Tag, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { KPI_DEFS } from '../../../lib/astro/glossary'
import { useI18n } from '../../../i18n/index.js'

/* ---------- 小工具 ---------- */

const pad = (n) => String(n).padStart(2, '0')

/** 主题的 localStorage 键。刻意带作用域前缀，避免和项目其他设置串味。 */
const THEME_KEY = 'astroboard.theme'

function fmtUTC(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '--:--:--'
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/** 北京时间 HH:mm（观测城市均在国内，直接按 UTC+8 展示） */
function fmtLocal(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '—'
  const t = new Date(d.getTime() + 8 * 3600_000)
  return `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`
}

function fmtLatLon(lat, lon) {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}°${ns}  ${Math.abs(lon).toFixed(2)}°${ew}`
}

/** 卡片外壳：统一处理标题 / 来源 / 加载 / 失败 */
function Panel({ title, source, icon, loading, error, children, extra }) {
  const { t } = useI18n()
  return (
    <section className="astro-panel">
      <header className="astro-panel__head">
        <div className="astro-panel__title">
          {icon}
          <h3>{title}</h3>
        </div>
        <div className="astro-panel__meta">
          {extra}
          {source && (
            <Tooltip title={t('astro.ui.sourceTip', { source })}>
              <Tag className="astro-src-tag" bordered={false}>{t('astro.ui.sourceTag')}</Tag>
            </Tooltip>
          )}
        </div>
      </header>
      <div className="astro-panel__body">
        {error ? (
          <div className="astro-fail">
            <span className="astro-fail__dot" />
            {t('astro.ui.fail', { error })}
          </div>
        ) : loading ? (
          <div className="astro-loading"><Spin size="small" /> {t('astro.ui.loading')}</div>
        ) : children}
      </div>
    </section>
  )
}

/** 一个数值 + 单位的小块。带 info 时挂一个问号气泡，解释这个指标是什么 */
function Metric({ label, value, unit, tone, info }) {
  return (
    <div className="astro-metric">
      <div className="astro-metric__val" style={tone ? { color: tone } : undefined}>
        {value}
        {unit && <span className="astro-metric__unit">{unit}</span>}
      </div>
      <div className="astro-metric__label">
        {label}
        {info && <KpiHint kpiKey={info} />}
      </div>
    </div>
  )
}

/**
 * KPI 释义气泡。
 *
 * 为什么单独抽组件：`info` 这个 prop 会在几十个 Metric 上重复出现，
 * 每处都写一遍 Tooltip 结构既啰嗦又容易漏 aria 属性。
 */
function KpiHint({ kpiKey }) {
  const def = KPI_DEFS[kpiKey]
  if (!def) return null
  return (
    <Popover
      placement="top"
      mouseEnterDelay={0.12}
      content={<KpiCard kpiKey={kpiKey} />}
    >
      <Button
        type="text"
        shape="circle"
        size="small"
        icon={<QuestionCircleOutlined />}
        className="astro-kpi-hint"
        aria-label={`解释「${def.zh}」`}
      />
    </Popover>
  )
}

/** 释义气泡内容：是什么 / 量纲 / 怎么读 / 所以呢 */
function KpiCard({ kpiKey }) {
  const def = KPI_DEFS[kpiKey]
  if (!def) return null
  return (
    <div className="astro-kpi-card">
      <div className="astro-kpi-card__title">{def.zh}</div>
      <dl className="astro-kpi-card__rows">
        <dt>单位</dt>
        <dd>{def.unit}</dd>
        <dt>是什么</dt>
        <dd>{def.what}</dd>
        <dt>怎么读</dt>
        <dd>{def.scale}</dd>
        <dt>所以呢</dt>
        <dd>{def.soWhat}</dd>
      </dl>
    </div>
  )
}

/**
 * 术语提示气泡：中文为主 + 英文原文 + 一句话释义。
 *
 * 为什么不用纯中文：这些枚举来自上游 API，专业读者可能需要按英文原文检索
 * （比如去查 NASA 的 discoverymethod 字段文档）。原文放 Tooltip 里是信息完整性的需要。
 * 为什么不用 antd Tag：Tag 的默认圆角配色在两套主题下都要覆盖，
 * 反而不如直接给 Tooltip 挂一个自定义 class 干净。
 */
function TermTip({ zh, en, desc, children }) {
  if (!zh) return children ?? null
  return (
    <Tooltip
      title={
        <div className="astro-term-tip">
          <b>{zh}</b>
          {en && en !== zh && <i>{en}</i>}
          {desc && <p>{desc}</p>}
        </div>
      }
    >
      {children}
    </Tooltip>
  )
}

/**
 * 月相 SVG —— 用两段弧（外圆弧 + 终止线椭圆弧）精确画出当前月相。
 *
 * 月相的几何：从地球看月球，日光照亮的部分是一条直线（终止线）的一侧。
 * 终止线在月球盘面上的投影是半椭圆，rx 随月相变化：新月/满月 rx=R（完全暗/亮），
 * 上下弦 rx=0（直线）。蛾眉/盈凸则介于之间。
 */
function MoonSVG({ phaseFraction, size = 130 }) {
  const R = (size - 10) / 2
  const cx = size / 2
  const cy = size / 2
  const top = cy - R
  const bottom = cy + R

  const cosPhase = Math.cos(phaseFraction * 2 * Math.PI)
  const rx = Math.max(0.1, R * Math.abs(cosPhase))
  const isWaxing = phaseFraction < 0.5
  const illumination = (1 - cosPhase) / 2

  // 右半圆（上→下顺时针）或左半圆（上→下逆时针）
  const litSemiSweep = isWaxing ? 1 : 0
  // 终止线弧方向：蛾眉月终止线在亮侧（减少亮区），盈凸月在暗侧（扩大亮区）
  const termSweep = (cosPhase > 0) ? litSemiSweep : (1 - litSemiSweep)

  const litPath = `M ${cx},${top} A ${R},${R} 0 0 ${litSemiSweep} ${cx},${bottom} A ${rx},${R} 0 0 ${termSweep} ${cx},${top}`

  return (
    <svg className="astro-moon" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="月相图">
      <defs>
        <radialGradient id="moon-lit-grad" cx="40%" cy="38%">
          <stop offset="0%" stopColor="#fffaed" />
          <stop offset="55%" stopColor="#e8d5a0" />
          <stop offset="100%" stopColor="#b89968" />
        </radialGradient>
        <radialGradient id="moon-dark-grad" cx="60%" cy="62%">
          <stop offset="0%" stopColor="#1e2a4a" />
          <stop offset="100%" stopColor="#0a1024" />
        </radialGradient>
      </defs>
      {/* 暗面 */}
      <circle cx={cx} cy={cy} r={R} fill="url(#moon-dark-grad)" stroke="#2a3556" strokeWidth="1" />
      {/* 亮面 */}
      {illumination > 0.003 && illumination < 0.997 && (
        <path d={litPath} fill="url(#moon-lit-grad)" />
      )}
      {illumination >= 0.997 && (
        <circle cx={cx} cy={cy} r={R} fill="url(#moon-lit-grad)" />
      )}
      {/* 月面纹理（几个陨石坑暗示） */}
      {illumination > 0.05 && (
        <g opacity="0.18" fill="#5a4a2a">
          <circle cx={cx + R * 0.22} cy={cy - R * 0.12} r={R * 0.09} />
          <circle cx={cx - R * 0.15} cy={cy + R * 0.25} r={R * 0.07} />
          <circle cx={cx + R * 0.08} cy={cy + R * 0.32} r={R * 0.05} />
          <circle cx={cx - R * 0.28} cy={cy - R * 0.28} r={R * 0.04} />
        </g>
      )}
    </svg>
  )
}

/**
 * 每隔 stepMs 返回一个「当前时间」。
 *
 * 为什么不直接渲染期 new Date()：那样虽然值会变，但 React 不会重渲染，
 * 轨道标记就会停在原地不动——轨道是时间的函数，必须让时间真的驱动渲染。
 * 用 setInterval 而非 requestAnimationFrame：这是数据看板（每秒一帧足够），
 * 不是动画，rAF 在后台标签页会停摆且空转耗电。
 */
function useNow(stepMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), stepMs)
    return () => clearInterval(t)
  }, [stepMs])
  return now
}

/**
 * 主题切换（深空黑 / 白昼）。
 *
 * 实现要点：
 *   · 主题挂在根节点 data-astro-theme 上，所有颜色由 CSS 变量在 SCSS 里分流，
 *     JSX 完全不需要感知主题——这是「变量驱动」相比「条件 class」的好处。
 *   · 选择结果落 localStorage，刷新后保持。
 *   · 首屏读取放在 useState 惰性初始化里，避免「先用深色闪一帧再切浅色」。
 */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
    } catch {
      return 'light'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* 隐私模式下写不了，主题仍然生效，只是不持久 */
    }
  }, [theme])
  return [theme, setTheme]
}

/* ---------- 主组件 ---------- */

/** 目标颜色的约定：中国目标暖色红，国际目标冷色蓝 */
const MARK_COLOR = (country) => (country === '中国' ? 'var(--a-cn)' : 'var(--a-accent)')

/**
 * 耀斑等级配色（A→X 由绿到红），与代理层 FLARE_TONE 保持一致。
 *
 * 前端也要一份：Sparkline 的曲线颜色、以及把「流量」反查成「等级」时都要用。
 * 两处定义不同文件，所以在这里显式注明「与 vite-astro-proxy.mjs 的 FLARE_TONE 对齐」。
 */
const FLARE_TONE = {
  A: '#52c41a',
  B: '#a0d911',
  C: '#faad14',
  M: '#fa8c16',
  X: '#ff4d4f',
}

/** GOES 分级阈值（与代理层 FLARE_THRESHOLDS 对齐），用于把流量反查成等级字母 */
const FLARE_LEVELS = [
  ['A', 1.0e-8],
  ['B', 1.0e-7],
  ['C', 1.0e-6],
  ['M', 1.0e-5],
  ['X', 1.0e-4],
]

/** 流量 → GOES 等级字母 */
function flareLevelOf(flux) {
  let idx = 0
  for (let i = 0; i < FLARE_LEVELS.length; i++) if (flux >= FLARE_LEVELS[i][1]) idx = i
  return FLARE_LEVELS[idx][0]
}

/**
 * G 级对照表数据。
 *
 * 为什么不在 JSX 里 inline：这张表要同时给「色块」「文字」两处用，
 * 抽出常量后当前等级的高亮判断也能复用同一份数据，不会两处漂移。
 * range 写的是 Kp 上界（不含），与 kpLevel() 的判定口径一致。
 */const G_SCALE_ROWS = [
  { level: 'G0', label: '平静', range: '< 4', color: '#52c41a', desc: 'Kp < 4。地磁活动平静，无空间天气影响，卫星无需任何防护动作。' },
  { level: 'G1', label: '轻微', range: '4–5', color: '#a0d911', desc: 'Kp 4。弱磁扰动，高纬地区可能出现极光，对绝大多数卫星无影响。' },
  { level: 'G2', label: '轻中', range: '5–6', color: '#faad14', desc: 'Kp 5。极光南扩，卫星可能需要姿态修正，电网变压器偶有感应加热。' },
  { level: 'G3', label: '中等', range: '6–7', color: '#fa8c16', desc: 'Kp 6。低轨卫星表面充电加剧，姿态扰动可能超限，需主动干预。' },
  { level: 'G4', label: '强', range: '7–8', color: '#ff7a45', desc: 'Kp 7。卫星跟踪困难，部分低轨卫星可能丢失，电网与通信出现异常。' },
  { level: 'G5', label: '极强', range: '8–9', color: '#ff4d4f', desc: 'Kp 8。GPS 精度显著下降甚至无服务，航天员需进入舱避险。' },
  { level: 'G6+', label: '极端', range: '≥ 9', color: '#a8071a', desc: 'Kp 9。历史上罕见，可能长时间失去 GPS，电网与通信面临威胁。' },
]


export { THEME_KEY, Panel, Metric, KpiHint, KpiCard, TermTip, MoonSVG, useNow, useTheme, pad, fmtUTC, fmtLocal, fmtLatLon, MARK_COLOR, FLARE_TONE, FLARE_LEVELS, flareLevelOf, G_SCALE_ROWS }
