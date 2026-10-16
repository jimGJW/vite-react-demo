import { useMemo } from 'react'
import { Dropdown, Tooltip } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useI18n, LANGUAGES } from '../../i18n/index.js'

/** 国旗 emoji（有）或带 accent 的字母徽标（无国旗 emoji 的语种，如藏文） */
function LangGlyph({ lang, size = 'sm' }) {
  if (lang.flag) {
    return <span className={`lang-flag lang-flag--${size}`}>{lang.flag}</span>
  }
  return (
    <span className={`lang-badge lang-badge--${size}`} style={{ background: lang.color }}>
      {lang.mark}
    </span>
  )
}

/**
 * 语言切换下拉：顶部导航右侧。
 * 彩色描边药丸按钮 + 国旗/字母徽标，切换时国旗做一次 pop 弹入动画，
 * 让「换语言」这件事有明确反馈（不再是灰扑扑一行字）。
 */
export default function LanguageSwitch() {
  const { t, lang, setLang } = useI18n()

  const items = useMemo(
    () =>
      LANGUAGES.map((l) => ({
        key: l.code,
        label: (
          <span
            className={`lang-option${l.code === lang ? ' is-active' : ''}`}
            style={{ '--lang-color': l.color }}
          >
            <LangGlyph lang={l} size="md" />
            <span className="lang-option__name">{l.label}</span>
            {l.code === lang ? <CheckOutlined className="lang-option__check" /> : null}
          </span>
        ),
      })),
    [lang],
  )

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  return (
    <Dropdown
      menu={{ items, onClick: ({ key }) => setLang(key) }}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName="lang-switch-overlay"
    >
      <Tooltip title={t('lang.title')} placement="bottom">
        <button
          type="button"
          className="lang-switch-btn"
          aria-label={t('lang.title')}
          style={{ '--lang-color': current.color }}
        >
          <span className="lang-switch-btn__flag" key={lang}>
            <LangGlyph lang={current} size="sm" />
          </span>
          <span className="lang-switch-btn__label">{current.short}</span>
        </button>
      </Tooltip>
    </Dropdown>
  )
}
