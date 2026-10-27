import { useEffect, useRef, useState } from 'react'
import {
  I18nContext, DEFAULT_LANG, isSupportedLang, translate, MESSAGES,
  ensureLang, isLangLoaded,
} from './index.js'

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
 * ③ 同步 document.title 与 meta description（这两处不在 React 树里，只能手动刷）
 * ④ 非默认语种的语言包按需装载：先 ensureLang 再提交状态，未就绪期间 t() 自动
 *   回退简体中文（translate 的兜底链），装载完成无闪烁切换。
 */
export default function I18nProvider({ children }) {
  /* 初始语种：仅当语言包已同步就绪（目前只有 zh-CN eager 内置）才直接采用，
     其余先落默认语种渲染，包装载完成后再切——避免整屏渲染一堆键名 */
  const [lang, setLangState] = useState(() => {
    const initial = readInitialLang()
    return isLangLoaded(initial) ? initial : DEFAULT_LANG
  })
  /* 异步装载竞态守卫：连续切换语种时只有最后一次装载允许提交状态 */
  const seqRef = useRef(0)

  /* 首帧后补装载持久化/浏览器语种（若不是当前已就绪语种） */
  useEffect(() => {
    const target = readInitialLang()
    if (target === lang) return undefined
    const seq = ++seqRef.current
    ensureLang(target).then(() => {
      if (seqRef.current === seq) setLangState(target)
    })
    return undefined
  }, [lang])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(MESSAGES, lang, 'shell.docTitle')
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', translate(MESSAGES, lang, 'shell.metaDesc'))
  }, [lang])

  const setLang = (next) => {
    if (!isSupportedLang(next) || next === lang) return
    try { localStorage.setItem(LS_KEY, next) } catch { /* ignore */ }
    if (isLangLoaded(next)) {
      setLangState(next)
      return
    }
    const seq = ++seqRef.current
    ensureLang(next).then(() => {
      if (seqRef.current === seq) setLangState(next)
    })
  }

  return <I18nContext.Provider value={{ lang, setLang }}>{children}</I18nContext.Provider>
}
