import { Link } from 'react-router-dom'
import StarArray from '@components/StarArray/StarArray.jsx'
import { Page, Section } from '@components/PageShell/index.jsx'
import BackButton from '@components/BackButton/index.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

/* 天文内容本体（星名 / 星座 / 注）是数据而非文案，随 StarArray 一起保持中文；
   页面标题复用侧边栏 nav.stars，避免为同一件事再造一套十语种翻译 */
function Stars() {
  const { t } = useI18n()

  return (
    <Page
      className="stars-page"
      eyebrow="365 REAL STARS"
      title={t('nav.stars')}
      subtitle="五重防御环、环组反向互锁、环内角向流动、星辰跨环径向脉动 —— 365 颗有真实星名、星等与距离的恒星。"
      accent="accent"
      shine
      gap="xl"
      actions={<BackButton />}
    >
      <div className="page-card stars-page__board">
        <StarArray />
      </div>

      <Section
        className="page-card stars-page__note"
        title="这一页是「天文」，不是「阵法」"
        desc="本站另有一页洪荒三阵，那一页的 365 星按汉制宿度布算、每颗星配一兽；本页只讲现代天文学意义上真实的恒星。"
      >
        <ul className="stars-page__facts">
          <li>星名取自行星命名传统（天狼、参宿七、毕宿五……），视星等与距离为公开星表数值。</li>
          <li>标注 <em>approx</em> 的星是星座代表估值，仅供示意，不是实测。</li>
          <li>五环的星数（33/53/73/93/113）是编排出来的层数，与任何星表无关。</li>
        </ul>
        <p className="stars-page__cta">
          想看中国式的「周天星斗」与十二祖巫？
          <Link to="/honghuang">前往洪荒三阵</Link>
        </p>
      </Section>
    </Page>
  )
}

export default Stars
