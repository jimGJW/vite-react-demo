/**
 * 国际化（i18n）核心 —— 全项目文案唯一真源
 *
 * 目录约定（分门别类，一种语言一个文件夹、一个分类一个 JSON）：
 *   src/i18n/locales/zh-CN/nav.json    简体中文 · 导航
 *   src/i18n/locales/zh-TW/nav.json    繁體中文 · 导航
 *   src/i18n/locales/en/nav.json       English · Navigation
 *   src/i18n/locales/ja/  ko/  de/  fr/  th/  mn/  bo/  同名文件同键
 *   发现逻辑见 locales/index.js（import.meta.glob，新增文件无需改 import）。
 *
 * 用法：
 *   const { t } = useI18n()
 *   t('nav.home')                          // 按键路径取当前语言文案
 *   t('shell.footer', { year })            // {year} 占位符插值
 *   t('creative.demo.x.title', {}, '兜底')  // 第三参兜底：键缺失时返回它而非键名
 *
 * 取值规则：当前语言 → 缺失时回退简体中文 → 仍缺失返回兜底值 / 键本身（开发期即可发现漏译）。
 */
import { createContext, useCallback, useContext } from 'react'
import { MESSAGES, ensureLang, isLangLoaded } from './locales/index.js'
import { DEFAULT_LANG, translate, pickLang, pickText, localize } from './translate.mjs'

export { DEFAULT_LANG, translate, pickLang, pickText, localize }

/** 语言包按需装载：切换非默认语种前先 ensureLang（I18nProvider 已封装，组件层无需关心） */
export { ensureLang, isLangLoaded }

/** 语种元数据：code 与 locales/ 下的文件夹一一对应 */
export const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文', short: '中', mark: 'CN', flag: '🇨🇳', color: '#e4002b' },
  { code: 'zh-TW', label: '繁體中文', short: '繁', mark: 'TW', flag: '🇹🇼', color: '#0b5cab' },
  { code: 'en', label: 'English', short: 'EN', mark: 'EN', flag: '🇬🇧', color: '#1d4ed8' },
  { code: 'ja', label: '日本語', short: '日', mark: 'JA', flag: '🇯🇵', color: '#bc002d' },
  { code: 'ko', label: '한국어', short: '한', mark: 'KO', flag: '🇰🇷', color: '#0b3f8f' },
  { code: 'de', label: 'Deutsch', short: 'DE', mark: 'DE', flag: '🇩🇪', color: '#111827' },
  { code: 'fr', label: 'Français', short: 'FR', mark: 'FR', flag: '🇫🇷', color: '#0055a4' },
  { code: 'th', label: 'ไทย', short: 'ไทย', mark: 'TH', flag: '🇹🇭', color: '#7c3aed' },
  { code: 'mn', label: 'Монгол', short: '蒙', mark: 'MN', flag: '🇲🇳', color: '#c4272d' },
  { code: 'bo', label: 'བོད་སྐད།', short: 'ཏིབ', mark: 'TIB', flag: '', color: '#f59e0b' },
]

/** 语言包注册表：zh-CN 同步内置（源语言/兜底），其余语种经 ensureLang 按需装载后写入 */
export { MESSAGES }

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code)

export function isSupportedLang(code) {
  return LANGUAGE_CODES.includes(code)
}

export const I18nContext = createContext(null)

const NOOP = () => {}

/** 语言状态 Hook：任意组件内 const { t, lang, setLang } = useI18n() */
export function useI18n() {
  const ctx = useContext(I18nContext)
  /* Provider 缺失时退化为默认语言，保证组件在隔离渲染（SSR / 单测）下也不炸 */
  const lang = ctx ? ctx.lang : DEFAULT_LANG
  const setLang = ctx ? ctx.setLang : NOOP
  const t = useCallback((key, vars, fallback) => translate(MESSAGES, lang, key, vars, fallback), [lang])
  return { lang, setLang, t }
}
