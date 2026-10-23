import { Page, Section } from '@components/PageShell/index.jsx'
import { resolveAccent } from '@components/PageShell/pageShellStyle.js'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const STACK = [
  { name: 'React 19', key: 'about.react19', accent: 'primary' },
  { name: 'React Router 7', key: 'about.router7', accent: 'cyan' },
  { name: 'Vite 8', key: 'about.vite8', accent: 'accent' },
  { name: 'ESLint', key: 'about.eslint', accent: 'warning' },
]

function About() {
  const { t } = useI18n()

  return (
    <Page
      className="about"
      eyebrow="About"
      title={t('about.title')}
      subtitle={t('about.desc')}
      accent="accent"
      shine
      gap="xl"
    >
      <div className="about-grid">
        <Section className="page-card about-panel" title={t('about.stackTitle')}>
          <ul className="about-stack m-stagger">
            {STACK.map((item, i) => (
              <li
                key={item.name}
                className="about-stack__item m-stagger-item"
                style={{ '--i': i, '--e-accent': resolveAccent(item.accent) }}
              >
                <span className="about-stack__dot" aria-hidden="true" />
                <strong className="about-stack__name">{item.name}</strong>
                <span className="about-stack__desc">{t(item.key)}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section className="page-card about-panel" title={t('about.structureTitle')}>
          <pre className="about-structure">{t('about.structure')}</pre>
        </Section>
      </div>
    </Page>
  )
}

export default About
