import { Animate, useCountUp } from '@/motion/index.jsx'
import { shellStyle, stagger, isCountable } from './pageShellStyle.js'
import './PageShell.scss'

/**
 * 全站统一页面外壳。
 *
 * 用法（页面只负责喂内容，视觉节奏由外壳保证）：
 *   <Page title={t('x.title')} subtitle={t('x.sub')} accent="cyan"
 *         actions={<Button onClick={refresh} />}>
 *     <Section title={t('x.kpi')}>
 *       <div className="pg-kpis m-stagger">
 *         {stats.map((s, i) => <Kpi key={s.key} {...s} index={i} />)}
 *       </div>
 *     </Section>
 *   </Page>
 *
 * 依赖 `@/motion`（Animate 与 m-* 工具类）以及 src/index.scss 的间距 / 圆角 / 阴影 token。
 * 卡片请继续用 `.page-card` 或 antd Card，本外壳不另造第二套卡片。
 */
export function Page({
  eyebrow,
  title,
  subtitle,
  actions,
  accent,
  gap,
  shine = false,
  aurora = true,
  className = '',
  style,
  children,
  ...rest
}) {
  const hasHero = Boolean(eyebrow || title || subtitle || actions)
  const merged = { ...shellStyle({ accent, gap }), ...style }
  const titleCls = `pg-hero__title${shine ? ' pg-hero__title--shine' : ''}`

  return (
    <section className={`pg ${className}`.trim()} style={merged} {...rest}>
      {aurora && <div className="pg-aurora m-aurora" aria-hidden="true" />}
      {hasHero && (
        <Animate name="fadeInDown" as="header" className="pg-hero">
          <div className="pg-hero__main">
            {eyebrow && <div className="pg-hero__eyebrow">{eyebrow}</div>}
            {title && <h1 className={titleCls}>{title}</h1>}
            {subtitle && <p className="pg-hero__sub">{subtitle}</p>}
          </div>
          {actions && <div className="pg-hero__tools">{actions}</div>}
        </Animate>
      )}
      <div className="pg-body">{children}</div>
    </section>
  )
}

/** 分节：标题（左强调条）+ 描述 + 右侧操作区 */
export function Section({ title, desc, extra, children, className = '', ...rest }) {
  return (
    <section className={`pg-section ${className}`.trim()} {...rest}>
      {(title || desc || extra) && (
        <header className="pg-section__head">
          {title && <h2 className="pg-section__title">{title}</h2>}
          {desc && <p className="pg-section__desc">{desc}</p>}
          {extra && <div className="pg-section__extra">{extra}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

/**
 * KPI 指标卡：value 为有限数时自动跑数字滚动，字符串（'1.2k'、'—'）原样显示。
 * 配合父级 `.pg-kpis.m-stagger` 即得错峰入场。
 */
export function Kpi({ title, value, prefix, unit, hint, decimals = 0, index = 0, style, ...rest }) {
  const countable = isCountable(value)
  const counted = useCountUp(countable ? value : 0, { decimals })
  const shown = countable
    ? counted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : value

  return (
    <div className="pg-kpi m-stagger-item" style={{ ...stagger(index), ...style }} {...rest}>
      {title && <span className="pg-kpi__label">{title}</span>}
      <span className="pg-kpi__value">
        {prefix && <span className="pg-kpi__unit">{prefix}</span>}
        {shown}
        {unit && <span className="pg-kpi__unit">{unit}</span>}
      </span>
      {hint && <span className="pg-kpi__hint">{hint}</span>}
    </div>
  )
}
