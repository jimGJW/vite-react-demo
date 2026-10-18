/**
 * 三位一体轨道动画（天 · 地 · 海）
 *
 * 深空（astro）· 地球（geo）· 海洋（ocean）三块看板，各以一颗行星沿椭圆轨道
 * 绕中心「数据中枢」旋转，形成「三位一体」的视觉锚点：
 *   - 行星大小折射该看板实时健康度（ok / total 比例）
 *   - 行星描边颜色：全绿（全部正常）/ 青（多数正常）/ 橙（部分故障）/ 红（全故障）
 *   - 中心核心脉动，显示三看板总 ok / total
 *   - 悬停高亮 + 点击进入对应看板
 *
 * 实现：SVG + SMIL `<animateTransform type="rotate">` 绕画布中心旋转，
 *       行星内层反向自转保持文字正立；hover 改 `r`（CSS 几何属性）放大而非 transform，
 *       避免与 SMIL transform 冲突。
 */

import { useNavigate } from 'react-router-dom'
import { useI18n } from '@i18n/index.js'

const C = 240 // 画布中心（viewBox 480）
const R = 28 // 行星半径

const ORBIT = {
  astro: { rx: 198, ry: 72, tilt: -20, dur: 30 },
  geo: { rx: 166, ry: 60, tilt: 15, dur: 24 },
  ocean: { rx: 136, ry: 48, tilt: 35, dur: 18 },
}

/** 健康度 → 描边色（绿 / 青 / 橙 / 红） */
function healthTone(ok, total) {
  if (total === 0) return '#ff4d4f'
  const r = ok / total
  if (r >= 0.999) return '#52c41a'
  if (r >= 0.5) return '#13c2c2'
  if (r > 0) return '#fa8c16'
  return '#ff4d4f'
}

export default function TrinityOrbit({ boards, totalOk, totalSrc, theme = 'dark' }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const CHAR = { astro: t('timeline.orbitCharAstro'), geo: t('timeline.orbitCharGeo'), ocean: t('timeline.orbitCharOcean') }

  const isDark = theme !== 'light'
  const coreFill = isDark ? '#0e1830' : '#eef3fb'
  const pathStroke = isDark ? 'rgba(160,180,220,0.18)' : 'rgba(40,60,100,0.22)'
  const linkStroke = isDark ? 'rgba(140,170,255,0.30)' : 'rgba(60,90,180,0.28)'

  return (
    <svg
      className={`tl-trinity${isDark ? '' : ' light'}`}
      viewBox="0 0 480 480"
      role="img"
      aria-label={t('timeline.orbitAria')}
    >
      <defs>
        {boards.map((b) => (
          <radialGradient id={`tl-grad-${b.key}`} key={b.key} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={b.color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={b.color} stopOpacity="0.55" />
          </radialGradient>
        ))}
      </defs>

      {/* 中心核心：数据中枢（脉动） */}
      <circle className="tl-core" cx={C} cy={C} r="40" fill={coreFill} stroke="rgba(255,255,255,0.12)" />
      <circle className="tl-core-ring" cx={C} cy={C} r="40" fill="none" stroke="#722ed1" strokeWidth="1.5" opacity="0.6">
        <animate attributeName="r" values="40;46;40" dur="3.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.15;0.6" dur="3.6s" repeatCount="indefinite" />
      </circle>
      <text x={C} y={C - 6} textAnchor="middle" className="tl-core-num">{totalOk}/{totalSrc}</text>
      <text x={C} y={C + 16} textAnchor="middle" className="tl-core-label">{t('timeline.orbitCoreLabel')}</text>

      {/* 三条轨道 + 三颗行星 */}
      {boards.map((b) => {
        const cfg = ORBIT[b.key] || { rx: 160, ry: 60, tilt: 0, dur: 24 }
        const tone = healthTone(b.ok, b.total)
        const rad = R - 2 + Math.round((b.ok / Math.max(1, b.total)) * 4) // 健康度略影响半径
        return (
          <g key={b.key} transform={`rotate(${cfg.tilt} ${C} ${C})`}>
            <ellipse
              className="tl-path"
              cx={C}
              cy={C}
              rx={cfg.rx}
              ry={cfg.ry}
              fill="none"
              stroke={pathStroke}
            />
            <g>
              {/* 旋转：绕中心 */}
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${C} ${C}`}
                to={`360 ${C} ${C}`}
                dur={`${cfg.dur}s`}
                repeatCount="indefinite"
              />
              {/* 中枢 → 行星 纽带 */}
              <line x1={C} y1={C} x2={C + cfg.rx} y2={C} stroke={linkStroke} strokeWidth="1" />
              <g
                className="tl-planet-wrap"
                transform={`translate(${C + cfg.rx} ${C})`}
                onClick={() => navigate(`/${b.key}`)}
              >
                <title>{t('timeline.orbitTip', { title: b.title, ok: b.ok, total: b.total, bad: b.bad, wait: b.wait })}</title>
                <g className="tl-planet">
                  {/* 反向自转保持文字正立 */}
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to="-360 0 0"
                    dur={`${cfg.dur}s`}
                    repeatCount="indefinite"
                  />
                  <circle
                    className="tl-planet-body"
                    r={rad}
                    fill={`url(#tl-grad-${b.key})`}
                    stroke={tone}
                    strokeWidth="2.5"
                    data-key={b.key}
                  />
                  <text x="0" y="-1" textAnchor="middle" className="tl-planet-char">{CHAR[b.key]}</text>
                  <text x="0" y="13" textAnchor="middle" className="tl-planet-count">{`${b.ok}/${b.total}`}</text>
                </g>
              </g>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
