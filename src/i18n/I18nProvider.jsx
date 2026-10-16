import { useEffect, useState } from 'react'
import { I18nContext, DEFAULT_LANG, isSupportedLang, translate, MESSAGES } from './index.js'

const LS_KEY = 'app.lang.v1'

/** 读取持久化语种：localStorage → 浏览器语言 → 默认简体中文 */
function readInitialLang() {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved && isSupportedLang(saved)) return saved
  } catch { /* 隐私模式等场景下忽略 */ }
  try {
    const nav = (navigator.languages?.[0] || navigator.language || '').toLowerCase()
    /* 浏览器语言就近映射：zh-hant-* → 繁体，en-* → 英语，其余落简体 */
    if (nav.startsWith('zh')) {
      return /hant|tw|hk|mo/.test(nav) ? 'zh-TW' : 'zh-CN'
    }
    const base = nav.split('-')[0]
    if (isSupportedLang(base)) return base
  } catch { /* ignore */ }
  return DEFAULT_LANG
}

/**
 * 语言 Provider：全App 最外层挂载（main.jsx）。
 * 职责：① 持有当前语种并持久化 ② 同步 <html lang>（无障碍 / 浏览器翻译提示）
 * ③ 同步 document.title 与 meta description（这两处不在 React 树里，只能手动刷）。
 */
export default function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(MESSAGES, lang, 'shell.docTitle')
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', translate(MESSAGES, lang, 'shell.metaDesc'))
  }, [lang])

  const setLang = (next) => {
    if (!isSupportedLang(next) || next === lang) return
    setLangState(next)
    try { localStorage.setItem(LS_KEY, next) } catch { /* ignore */ }
  }

  return <I18nContext.Provider value={{ lang, setLang }}>{children}</I18nContext.Provider>
}
