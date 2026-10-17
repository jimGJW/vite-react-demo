/**
 * 「关联数据」共享模块 —— 三块看板（深空 / 地球 / 海洋）各页签共用。
 *
 * 回答两个问题：
 *   1. 三方监控：深空 / 地球 / 海洋各自在监控什么，当前这块板的数据活不活。
 *   2. 关联对读：这个页签的数据还能跟谁对读，为什么相关（why），
 *      以及看到之后该怎么理解（detail 资料解释 + 名词释义）。
 *
 * 用法（在 Tabs 下方渲染，随当前激活页签变化）：
 *   <RelatedData board="geo" tab={activeTab} theme={theme} health={{ ok, total }} />
 *
 * 三方监控条刻意做得很轻：一条细行 + 三个 chip，监控范围与健康度都收进 hover 提示，
 * 默认落在关联列表下方（monAt="top" 可移到上方），不抢主内容的视线。
 *
 * 主题约定（与 DictView 同）：三块看板的 CSS 变量前缀各不相同（a / g / o 三套），
 * 共用组件不去猜父级变量，一律由 props 传 theme，自己带 .light 修饰类。
 */

import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBoardMeta, getBoardScope, getRelated, getTerm } from '../../lib/boards/relations.js'
import { useI18n } from '../../i18n/index.js'
import './index.scss'

export default function RelatedData({
  board,
  tab,
  theme = 'dark',
  health = null,
  monAt = 'bottom',
}) {
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const [open, setOpen] = useState({})

  /** 看板元信息（含跳转路径）按语种解析：title 已是 {lang} 字段，必须走 getBoardMeta */
  const metaMap = useMemo(() => getBoardMeta(lang), [lang])

  /** 关联项 + 名词释义（切换看板 / 页签 / 语种时重算） */
  const items = useMemo(
    () =>
      getRelated(board, tab, lang).map((it) => ({
        ...it,
        terms: it.terms.map(({ b, k }) => getTerm(b, k, lang)).filter(Boolean),
      })),
    [board, tab, lang],
  )

  const toggle = useCallback((key) => {
    setOpen((m) => ({ ...m, [key]: !m[key] }))
  }, [])

  const goBoard = useCallback((b) => navigate(metaMap[b].path), [navigate, metaMap])

  const goTab = useCallback(
    (b, t) => navigate(`${metaMap[b].path}?tab=${t}`),
    [navigate, metaMap],
  )

  // 名词解释、案例这类辅助页签没有关联数据 → 整块不渲染，不留空标题
  if (!items.length) return null

  const isDark = theme !== 'light'
  const boards = Object.values(metaMap)

  /** 三方监控：底部一行细条，三块各占一小格，常态平铺「在盯什么」 */
  const monitor = (
    <footer className="rd__mon">
      <span className="rd__mon-h">
        <i className="rd__pulse" aria-hidden />
        {t('boards.related.monitor')}
      </span>
      <div className="rd__mon-list">
        {boards.map((m) => {
          const scope = getBoardScope(m.key, lang)
          if (!scope) return null
          const self = m.key === board
          const tip = [m.title, scope.scope, t('boards.related.watching', { list: scope.watch.join(' · ') })]
          if (self && health) {
            tip.push(t('boards.related.selfHealth', { ok: health.ok, total: health.total }))
          }
          return (
            <button
              key={m.key}
              type="button"
              className={`rd__mon-chip${self ? ' is-self' : ''}`}
              style={{ '--rd-accent': m.color }}
              onClick={() => goBoard(m.key)}
              title={tip.join('\n')}
              aria-label={t('boards.related.goBoard', { name: m.title })}
            >
              <span className="rd__mon-top">
                <i className="rd__mon-dot" aria-hidden />
                <span className="rd__mon-name">{m.title}</span>
                {self && health ? (
                  <span className="rd__mon-live">{health.ok}/{health.total}</span>
                ) : (
                  <span className="rd__mon-arrow" aria-hidden>→</span>
                )}
              </span>
              <span className="rd__mon-scope">{scope.watch.join(' · ')}</span>
            </button>
          )
        })}
      </div>
    </footer>
  )

  return (
    <section className={`rd${isDark ? '' : ' light'}`}>
      {monAt === 'top' ? monitor : null}

      {/* ① 关联数据：为什么相关 + 展开后的资料解释与名词 */}
      <h4 className="rd__h">
        <span className="rd__hicon">🔗</span>
        {t('boards.related.title')}
        <span className="rd__hsub">{t('boards.related.subtitle')}</span>
      </h4>
      <div className="rd__list">
        {items.map((it) => {
          const isOpen = !!open[it.to]
          return (
            <div key={it.to} className={`rd__card${isOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="rd__top"
                style={{ '--rd-accent': it.color }}
                onClick={() => goTab(it.board, it.tab)}
                title={t('boards.related.goTab', { board: it.title, tab: it.label })}
              >
                <span className="rd__icon" aria-hidden>{it.icon}</span>
                <span className="rd__board">{it.title}</span>
                <span className="rd__sep">·</span>
                <span className="rd__tab">{it.label}</span>
                <span className="rd__go" aria-hidden>→</span>
              </button>
              <p className="rd__why">{it.why}</p>

              <button
                type="button"
                className="rd__toggle"
                onClick={() => toggle(it.to)}
                aria-expanded={isOpen}
              >
                {isOpen ? t('boards.related.detailClose') : t('boards.related.detail')}
                <span className="rd__chev" aria-hidden>{isOpen ? '▲' : '▼'}</span>
                {!isOpen && it.terms.length ? (
                  <span className="rd__tn">{t('boards.related.termCount', { n: it.terms.length })}</span>
                ) : null}
              </button>

              {isOpen ? (
                <div className="rd__detail">
                  <p className="rd__dtext">{it.detail}</p>

                  {it.terms.length ? (
                    <div className="rd__terms">
                      <span className="rd__terms-h">{t('boards.related.termsHead')}</span>
                      {/* 形参必须避开 t：i18n 的 t 在本组件作用域内已被占用，
                          写成 map((t) => …) 会静默遮蔽，编译/单测都绿、只有运行才炸 */}
                      {it.terms.map((term) => (
                        <button
                          key={term.key}
                          type="button"
                          className="rd__term"
                          onClick={() => navigate('/timeline')}
                          title={t('boards.related.dictTip')}
                        >
                          <span className="rd__term-hd">
                            <span className="rd__term-zh">{term.zh}</span>
                            {term.unit ? <span className="rd__term-unit">{term.unit}</span> : null}
                            <span className="rd__term-go" aria-hidden>{t('boards.related.dictGo')}</span>
                          </span>
                          {term.what ? <span className="rd__term-what">{term.what}</span> : null}
                          {term.scale ? (
                            <span className="rd__term-scale">
                              <b>{t('boards.related.scale')}</b>
                              {term.scale}
                            </span>
                          ) : null}
                          {term.soWhat ? (
                            <span className="rd__term-so">
                              <b>{t('boards.related.how')}</b>
                              {term.soWhat}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {monAt === 'top' ? null : monitor}
    </section>
  )
}
