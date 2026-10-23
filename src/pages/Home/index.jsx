import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  AudioOutlined,
  CompassOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HistoryOutlined,
  LayoutOutlined,
  MessageOutlined,
  RobotOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  RadarChartOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Page, Section } from '@components/PageShell/index.jsx'
import { resolveAccent } from '@components/PageShell/pageShellStyle.js'
import { useTilt } from '@/motion/index.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const TECH = ['React 19', 'React Router 7', 'Vite 8', 'Ant Design 5']

/* 三组入口：标题直接用侧边栏已有的 nav.* 文案，避免为首页再造一套翻译 */
const GROUPS = [
  {
    section: 'nav.groupDataboards',
    accent: 'primary',
    items: [
      { to: '/astro', key: 'nav.astro', icon: <RocketOutlined />, accent: 'accent' },
      { to: '/geo', key: 'nav.geo', icon: <GlobalOutlined />, accent: 'success' },
      { to: '/ocean', key: 'nav.ocean', icon: <CompassOutlined />, accent: 'cyan' },
      { to: '/timeline', key: 'nav.timeline', icon: <HistoryOutlined />, accent: 'warning' },
    ],
  },
  {
    section: 'nav.groupAi',
    accent: 'accent',
    items: [
      { to: '/chatbot', key: 'nav.chatbot', icon: <MessageOutlined />, accent: 'primary' },
      { to: '/voice', key: 'nav.voice', icon: <AudioOutlined />, accent: 'cyan' },
      { to: '/agent', key: 'nav.agent', icon: <RobotOutlined />, accent: 'accent' },
    ],
  },
  {
    section: 'nav.groupToolbox',
    accent: 'cyan',
    items: [
      { to: '/kit', key: 'nav.kit', icon: <AppstoreOutlined />, accent: 'info' },
      { to: '/studio', key: 'nav.studio', icon: <LayoutOutlined />, accent: 'accent' },
      { to: '/templates', key: 'nav.templates', icon: <FileTextOutlined />, accent: 'success' },
      { to: '/utils', key: 'nav.utils', icon: <ToolOutlined />, accent: 'warning' },
    ],
  },
]

function EntryCard({ to, label, icon, accent, index }) {
  const tiltRef = useTilt({ max: 7, scale: 1.02 })
  return (
    <Link
      ref={tiltRef}
      to={to}
      className="home-entry page-card m-stagger-item m-grad-border m-tilt"
      style={{ '--i': index, '--e-accent': resolveAccent(accent) }}
    >
      <span className="home-entry__icon">{icon}</span>
      <span className="home-entry__title">{label}</span>
      <ArrowRightOutlined className="home-entry__arrow" />
    </Link>
  )
}

function Home() {
  const [count, setCount] = useState(0)
  const { t } = useI18n()

  return (
    <Page
      className="home"
      eyebrow="Vite 8 · React 19"
      title={t('home.title')}
      subtitle={t('home.desc')}
      shine
      gap="xl"
      actions={
        <>
          <Button type="primary" size="large" href="#entries">
            {t('nav.dashboard')}
          </Button>
          <Button size="large" href="#arrays">
            {t('nav.honghuang')}
          </Button>
        </>
      }
    >
      {/* 交互 + 技术栈：唯一一处可玩的计数器，点击数字弹一下 */}
      <div className="home-stage m-stagger">
        <div className="page-card home-counter m-stagger-item" style={{ '--i': 0 }}>
          <Button type="primary" size="large" onClick={() => setCount((c) => c + 1)}>
            <span key={count} className="m-pop home-counter__num">
              {t('home.counter', { count })}
            </span>
          </Button>
          <ul className="home-chips m-stagger">
            {TECH.map((tech, i) => (
              <li key={tech} className="home-chip m-stagger-item" style={{ '--i': i }}>
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div id="entries" className="home-entries">
        {GROUPS.map((group, gi) => (
          <Section key={group.section} title={t(group.section)}>
            <div className="pg-grid home-grid m-stagger">
              {group.items.map((item, i) => (
                <EntryCard
                  key={item.to}
                  to={item.to}
                  label={t(item.key)}
                  icon={item.icon}
                  accent={item.accent}
                  index={i + gi}
                />
              ))}
            </div>
          </Section>
        ))}
      </div>

      {/* 洪荒三阵 / 周天星辰：一虚一实两个入口（原嵌在首页的星阵已独立成页）*/}
      <section id="arrays" className="home-arrays page-card">
        <div className="home-arrays__head">
          <h2>两套星空</h2>
          <p>洪荒小说里的周天星斗大阵、十二都天神煞大阵与九宫八卦阵，和现代星表里真实存在的 365 颗恒星 —— 同一套考据规矩，两种来历，页内各自标清。</p>
        </div>
        <div className="pg-grid home-grid m-stagger">
          <EntryCard
            to="/honghuang"
            label={t('nav.honghuang')}
            icon={<ThunderboltOutlined />}
            accent="accent"
            index={0}
          />
          <EntryCard
            to="/stars"
            label={t('nav.stars')}
            icon={<RadarChartOutlined />}
            accent="cyan"
            index={1}
          />
        </div>
      </section>

      <footer className="pg-foot home-hint">
        {t('home.navHintPre')} <Link to="/about">{t('nav.about')}</Link> {t('home.navHintOr')}{' '}
        <Link to="/dashboard">{t('nav.dashboard')}</Link> {t('home.navHintPost')}
      </footer>
    </Page>
  )
}

export default Home
