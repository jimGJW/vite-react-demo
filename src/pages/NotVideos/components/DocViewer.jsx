import { memo, useCallback, useState } from 'react'
import { useI18n } from '@i18n/index.js'
import { fmtSize } from './notVideoUtils.js'

/**
 * 文档查看区：txt/md/json/csv 等文本经 /api/read-text 内联查看；
 * pdf 用 iframe 直接预览字节流；doc/docx/xls/ppt 等二进制浏览器渲染不了，给下载/新窗口入口。
 *
 * 「能不能拿到」的判断落在文本通道：fetch 失败（文件被删、目录失效、超限）会在这里红字报出，
 * 而不是留一块空白让用户猜。
 */
function DocViewerImpl({ docs, dir }) {
  const { t } = useI18n()
  const [activeRel, setActiveRel] = useState(null)
  const [view, setView] = useState(null) // { kind:'text'|'frame'|'download', name, text?, url? }
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const open = useCallback(
    async (doc) => {
      setActiveRel(doc.rel)
      setErr('')
      setView(null)
      const fileUrl = `${doc.url}?dir=${encodeURIComponent(dir)}`
      if (doc.text) {
        setLoading(true)
        try {
          const res = await fetch(`/api/read-text?dir=${encodeURIComponent(dir)}&file=${encodeURIComponent(doc.rel)}`, {
            cache: 'no-store',
          })
          const data = await res.json()
          if (!data.ok) throw new Error(data.error || t('notvideos.errRead'))
          setView({ kind: 'text', name: doc.rel, text: data.text })
        } catch (e) {
          setErr(String((e && e.message) || e))
        } finally {
          setLoading(false)
        }
      } else if (/\.pdf$/i.test(doc.rel)) {
        setView({ kind: 'frame', name: doc.rel, url: fileUrl })
      } else {
        setView({ kind: 'download', name: doc.rel, url: fileUrl })
      }
    },
    [dir, t],
  )

  if (!docs.length) return null

  return (
    <section className="notvideos__section">
      <div className="notvideos__secHead">
        <h3>📄 {t('notvideos.catDocs')}</h3>
        <span className="notvideos__secCount">{docs.length}</span>
      </div>
      <div className="notvideos__docBody">
        <div className="notvideos__docList">
          {docs.map((d) => (
            <button
              type="button"
              key={d.rel}
              className={`notvideos__item${d.rel === activeRel ? ' is-current' : ''}`}
              onClick={() => open(d)}
              title={d.rel}
            >
              <span className="notvideos__itemName">{d.rel}</span>
              <span className="notvideos__itemSub">{fmtSize(d.size)}</span>
            </button>
          ))}
        </div>
        <div className="notvideos__docView">
          {loading ? <div className="notvideos__hint">{t('notvideos.reading')}</div> : null}
          {err ? <div className="notvideos__err">{err}</div> : null}
          {!loading && !err && !view ? <div className="notvideos__hint">{t('notvideos.docPickHint')}</div> : null}
          {view && view.kind === 'text' ? <pre className="notvideos__docText">{view.text}</pre> : null}
          {view && view.kind === 'frame' ? (
            <>
              <iframe className="notvideos__docFrame" src={view.url} title={view.name} />
              <div className="notvideos__docBar">
                  <a href={view.url} target="_blank" rel="noreferrer">
                    {t('notvideos.openNew')}
                  </a>
              </div>
            </>
          ) : null}
          {view && view.kind === 'download' ? (
            <div className="notvideos__hint">
              <p>{t('notvideos.cannotPreview', { name: view.name })}</p>
              <a className="notvideos__btn" href={view.url} target="_blank" rel="noreferrer" download>
                {t('notvideos.downloadOpen')}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* memo：轮询 304 时 docs 引用不变 → 已打开文档的阅读位置、选中项都不被打断 */
const DocViewer = memo(DocViewerImpl)
export default DocViewer
