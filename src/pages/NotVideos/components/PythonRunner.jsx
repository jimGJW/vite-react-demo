import { memo, useCallback, useEffect, useState } from 'react'
import { fmtSize, splitArgs } from './notVideoUtils.js'

const TIMEOUT_OPTIONS = [
  { v: 60, label: '60 秒' },
  { v: 180, label: '3 分钟' },
  { v: 300, label: '5 分钟' },
  { v: 600, label: '10 分钟' },
  { v: 900, label: '15 分钟' },
]
const POLL_MS = 800

/**
 * Python 效果区：列出目录下所有 .py（含子目录，如 fx/galaxy.py），点「运行」由后端执行，
 * 实时回显 stdout/stderr、退出码与耗时，并把本次**新生成**的图片/视频作为效果产物展示出来。
 *
 * 为大型特效工程（49 个效果在 fx/ 子包、产物落 output/）做的关键设计：
 * 1. **解释器可选**：本机 PATH 里的 python3 可能没装 numpy（效果工程硬依赖），
 *    后端 /api/python-info 会列出所有候选并标出谁带 numpy，默认选能跑的那个；
 *    也优先用工程自己的 .venv。
 * 2. **模块方式自动识别**：脚本在含 __init__.py 的包里时，后端自动按 `python -m fx.galaxy` 起
 *    （直接跑文件会 ModuleNotFoundError），结果里会显示实际执行的命令行。
 * 3. **异步任务 + 轮询**：渲染动辄数分钟，POST 只负责起任务立即返回，前端每 800ms 拉一次状态，
 *    能看到 core.Progress 的实时进度，也能随时「停止」——不会傻等一个超时。
 * 4. **附加参数**：效果脚本普遍支持 --frames 之类，填 `--frames 30` 先快速试跑，再跑全量。
 */
function PythonRunnerImpl({ pythons, dir, onRefresh }) {
  /* 解释器探测结果带上 dir 归属：渲染时发现不属于当前目录就当空处理，
     不必在 effect 里同步 setState 清一场（那会引发连环渲染） */
  const [probe, setProbe] = useState({ dir: '', interpreters: [], defaultBin: '' })
  const interpreters = probe.dir === dir ? probe.interpreters : []
  const pyDefault = probe.dir === dir ? probe.defaultBin : ''
  const [pyChoice, setPyChoice] = useState('') // 用户显式选过解释器就不再跟随默认
  const py = pyChoice || pyDefault
  const [argsText, setArgsText] = useState('')
  const [timeoutSec, setTimeoutSec] = useState(300)
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState(null)
  const [err, setErr] = useState('')

  /* ---------- 解释器探测：换目录重探；默认落在「带 numpy」的那个上 ---------- */
  useEffect(() => {
    let stopped = false
    fetch(`/api/python-info?dir=${encodeURIComponent(dir)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (stopped) return
        if (!d.ok) {
          setErr(d.error || '解释器探测失败')
          return
        }
        setProbe({ dir, interpreters: d.interpreters || [], defaultBin: d.defaultBin || '' })
      })
      .catch((e) => {
        if (!stopped) setErr(`解释器探测失败：${(e && e.message) || e}`)
      })
    return () => {
      stopped = true
    }
  }, [dir])

  /* ---------- 运行：POST 起任务，拿 jobId 后转入轮询 ---------- */
  const run = useCallback(
    async (rel) => {
      setErr('')
      setStatus(null)
      setJobId('')
      try {
        const res = await fetch('/api/run-python', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dir,
            file: rel,
            args: splitArgs(argsText),
            timeout: Number(timeoutSec),
            py,
          }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setJobId(data.jobId)
      } catch (e) {
        setErr(String((e && e.message) || e))
      }
    },
    [dir, argsText, timeoutSec, py],
  )

  /* ---------- 轮询任务状态：实时输出 / 退出码 / 产物 ---------- */
  useEffect(() => {
    if (!jobId) return undefined
    let stopped = false
    let timer = 0
    const tick = async () => {
      try {
        const res = await fetch(`/api/run-python/status?jobId=${encodeURIComponent(jobId)}`, { cache: 'no-store' })
        const d = await res.json()
        if (stopped) return
        if (!d.ok) throw new Error(d.error || '状态读取失败')
        setStatus(d)
        if (d.running) {
          timer = window.setTimeout(tick, POLL_MS)
          return
        }
        setJobId('')
        // 产物已落盘：让父级重扫一次，图片 / 视频区立刻能看到新文件
        if (onRefresh) onRefresh()
      } catch (e) {
        if (stopped) return
        setErr(String((e && e.message) || e))
        setJobId('')
      }
    }
    timer = window.setTimeout(tick, 300)
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [jobId, onRefresh])

  const cancel = useCallback(async () => {
    if (!jobId) return
    try {
      await fetch(`/api/run-python/cancel?jobId=${encodeURIComponent(jobId)}`, { method: 'POST' })
    } catch {
      /* 停不掉也罢，下一轮轮询会反映真实状态 */
    }
  }, [jobId])

  if (!pythons.length) return null

  const fileUrl = (rel) => `/local-file/${rel.split('/').map(encodeURIComponent).join('/')}?dir=${encodeURIComponent(dir)}`
  const running = !!jobId
  // 行高亮：正在跑的那个 > 列表第一个（与视频区「当前项高亮、其余压暗」同一语义）
  const activeRel = (status && status.file) || (pythons[0] && pythons[0].rel) || ''
  const noNumpy = interpreters.length > 0 && !interpreters.some((p) => p.hasNumpy)

  return (
    <section className="notvideos__section">
      <div className="notvideos__secHead">
        <h3>🐍 Python 效果</h3>
        <span className="notvideos__secCount">{pythons.length}</span>
      </div>

      {/* ---------- 运行参数：解释器 + 附加参数 + 超时，对每次运行都生效 ---------- */}
      <div className="notvideos__pyForm">
        <label className="notvideos__pyField">
          <span>解释器</span>
          <select className="notvideos__select" value={py} onChange={(e) => setPyChoice(e.target.value)} disabled={!interpreters.length}>
            {interpreters.map((p) => (
              <option key={p.bin} value={p.bin}>
                {p.bin} · {p.version} · {p.hasNumpy ? '✓ numpy' : '✗ 缺 numpy'}（{p.source}）
              </option>
            ))}
            {!interpreters.length ? <option value="">探测中…</option> : null}
          </select>
        </label>
        <label className="notvideos__pyField notvideos__pyField--args">
          <span>附加参数</span>
          <input
            className="notvideos__input"
            value={argsText}
            placeholder="如 --frames 30（先少帧试跑）；留空用脚本默认值"
            onChange={(e) => setArgsText(e.target.value)}
          />
        </label>
        <label className="notvideos__pyField">
          <span>超时</span>
          <select className="notvideos__select" value={timeoutSec} onChange={(e) => setTimeoutSec(Number(e.target.value))}>
            {TIMEOUT_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {noNumpy ? (
        <div className="notvideos__err">
          这些解释器都没装 numpy / Pillow，跑不了这类效果工程。请先执行
          <code> pip install -r requirements.txt </code>
          （或在工程目录建 .venv 后重试）
        </div>
      ) : null}
      {pyDefault && py && py !== pyDefault ? (
        <div className="notvideos__tip">当前解释器非默认推荐（{pyDefault}），若报缺模块请切回推荐项。</div>
      ) : null}

      <div className="notvideos__pyList">
        {pythons.map((p) => (
          <div key={p.rel} className={`notvideos__pyRow${p.rel === activeRel ? ' is-current' : ''}`}>
            <span className="notvideos__itemName" title={p.rel}>
              {p.rel}
            </span>
            <span className="notvideos__itemSub">{fmtSize(p.size)}</span>
            <button type="button" className="notvideos__btn" disabled={running} onClick={() => run(p.rel)}>
              {running && status && status.file === p.rel ? '运行中…' : '▶ 运行'}
            </button>
          </div>
        ))}
      </div>

      {err ? <div className="notvideos__err">{err}</div> : null}

      {status ? (
        <div className="notvideos__pyOut">
          <div className="notvideos__pyMeta">
            <span className="notvideos__pyCmd" title={status.cmd}>
              $ {status.cmd}
            </span>
            {status.module ? <span className="notvideos__tag">模块方式 -m</span> : null}
          </div>
          <div className="notvideos__pyMeta">
            <span>
              状态 <b>{status.running ? `运行中 ${Math.round(status.durationMs / 1000)}s` : `已结束 ${Math.round(status.durationMs / 1000)}s`}</b>
            </span>
            <span>
              退出码 <b>{status.exitCode ?? '—'}</b>
            </span>
            <span>
              解释器 <b>{status.python}</b>
            </span>
            {status.killed ? <span className="notvideos__err">已超时终止</span> : null}
            {status.running ? (
              <button type="button" className="notvideos__btn notvideos__btn--stop" onClick={cancel}>
                ■ 停止
              </button>
            ) : null}
          </div>
          {status.output ? <pre className="notvideos__pyStd">{status.output}</pre> : null}
          {status.error ? <pre className="notvideos__pyErr">{status.error}</pre> : null}
          {status.artifacts && status.artifacts.length ? (
            <div className="notvideos__artifacts">
              <div className="notvideos__pyMeta">本次新生成 {status.artifacts.length} 个效果产物：</div>
              <div className="notvideos__artifactGrid">
                {status.artifacts.map((a) =>
                  a.kind === 'image' ? (
                    <a key={a.rel} href={fileUrl(a.rel)} target="_blank" rel="noreferrer" title={a.rel}>
                      <img src={fileUrl(a.rel)} alt={a.rel} loading="lazy" />
                    </a>
                  ) : (
                    <video key={a.rel} src={fileUrl(a.rel)} controls preload="metadata" title={a.rel} />
                  ),
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

/* memo：任务运行中（status 每 800ms 刷新）父级轮询 304 不重入，内部轮询不受影响 */
const PythonRunner = memo(PythonRunnerImpl)
export default PythonRunner
