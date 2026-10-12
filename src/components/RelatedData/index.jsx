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
import { BOARD_META, BOARD_SCOPE, getRelated, getTerm } from '../../lib/boards/relations.js'
import './index.scss'

export default function RelatedData({
  board,
  tab,
  theme = 'dark',
  health = null,
  monAt = 'bottom',
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState({})

  /** 关联项 + 名词释义（只在切换看板/页签时重算） */
  const items = useMemo(
    () =>
      getRelated(board, tab).map((it) => ({
        ...it,
        terms: it.terms.map(({ b, k }) => getTerm(b, k)).filter(Boolean),
      })),
    [board, tab],
  )

  const toggle = useCallback((key) => {
    setOpen((m) => ({ ...m, [key]: !m[key] }))
  }, [])

  const goBoard = useCallback((b) => navigate(BOARD_META[b].path), [navigate])

  const goTab = useCallback((b, t) => navigate(`${BOARD_META[b].path}?tab=${t}`), [navigate])

  // 名词解释、案例这类辅助页签没有关联数据 → 整块不渲染，不留空标题
  if (!items.length) return null

  const isDark = theme !== 'light'
  const boards = Object.values(BOARD_META)

  /** 三方监控：底部一行细条，三块各占一小格，常态平铺「在盯什么」 */
  const monitor = (
    <footer className="rd__mon">
      <span className="rd__mon-h">
        <i className="rd__pulse" aria-hidden />
        三方监控
      </span>
      <div className="rd__mon-list">
        {boards.map((m) => {
          const scope = BOARD_SCOPE[m.key]
          const self = m.key === board
          const tip = [m.title, scope.scope, `在盯：${scope.watch.join(' · ')}`]
          if (self && health) tip.push(`本板数据源 ${health.ok}/${health.total} 正常`)
          return (
            <button
              key={m.key}
              type="button"
              className={`rd__mon-chip${self ? ' is-self' : ''}`}
              style={{ '--rd-accent': m.color }}
              onClick={() => goBoard(m.key)}
              title={tip.join('\n')}
              aria-label={`前往${m.title}看板`}
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
        关联数据
        <span className="rd__hsub">这些模块的数据可以对照着看，点开有资料解释</span>
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
                title={`前往${it.title}看板 · ${it.label}`}
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
                {isOpen ? '收起资料解释' : '资料解释'}
                <span className="rd__chev" aria-hidden>{isOpen ? '▲' : '▼'}</span>
                {!isOpen && it.terms.length ? (
                  <span className="rd__tn">{it.terms.length} 个名词</span>
                ) : null}
              </button>

              {isOpen ? (
                <div className="rd__detail">
                  <p className="rd__dtext">{it.detail}</p>

                  {it.terms.length ? (
                    <div className="rd__terms">
                      <span className="rd__terms-h">相关名词</span>
                      {it.terms.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          className="rd__term"
                          onClick={() => navigate('/timeline')}
                          title="在数据词典中查看完整释义与检索"
                        >
                          <span className="rd__term-hd">
                            <span className="rd__term-zh">{t.zh}</span>
                            {t.unit ? <span className="rd__term-unit">{t.unit}</span> : null}
                            <span className="rd__term-go" aria-hidden>词典 →</span>
                          </span>
                          {t.what ? <span className="rd__term-what">{t.what}</span> : null}
                          {t.scale ? (
                            <span className="rd__term-scale">
                              <b>量级</b>
                              {t.scale}
                            </span>
                          ) : null}
                          {t.soWhat ? (
                            <span className="rd__term-so">
                              <b>怎么读</b>
                              {t.soWhat}
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
