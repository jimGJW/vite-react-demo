import { useCallback, useMemo, useState } from 'react'
import './TestCenter.scss'

/**
 * @typedef {Object} TestCase
 * @property {string} id      用例唯一 id
 * @property {string} name     用例名
 * @property {string} group    分组名
 * @property {() => Promise<{pass: boolean, detail?: string}>} run 执行函数，返回是否通过与详情
 */

/**
 * 测试中心 · 通用测试运行器组件
 *
 * - 接收一组测试用例，点击「运行全部」逐个异步执行，实时显示状态与结果
 * - 同时展示配套的 Python 脚本（可复制 / 下载）与终端运行命令
 * - 零外部依赖，仅 React；样式消费项目 CSS 变量保持 Indigo 玻璃态统一
 *
 * @param {Object} props
 * @param {TestCase[]} props.cases      测试用例数组
 * @param {string}    [props.pythonScript]  配套 Python 脚本原文（展示/复制/下载）
 * @param {string}    [props.runCommand]    终端运行命令
 * @param {string}    [props.className]     额外类名
 */
function TestCenter({ cases = [], pythonScript = '', runCommand = '', className = '' }) {
  // results: { [id]: { status: 'idle'|'running'|'pass'|'fail', detail?: string } }
  const [results, setResults] = useState(() =>
    Object.fromEntries(cases.map((c) => [c.id, { status: 'idle' }])),
  )
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState('')

  const update = (id, patch) =>
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const runOne = useCallback(async (tc) => {
    update(tc.id, { status: 'running', detail: undefined })
    try {
      const r = await tc.run()
      update(tc.id, {
        status: r.pass ? 'pass' : 'fail',
        detail: r.detail ?? (r.pass ? '通过' : '失败'),
      })
      return !!r.pass
    } catch (e) {
      update(tc.id, { status: 'fail', detail: String(e?.message || e) })
      return false
    }
  }, [])

  const runAll = useCallback(async () => {
    setRunning(true)
    // 串行执行，避免用例间状态互相干扰
    for (const tc of cases) {
      await runOne(tc)
    }
    setRunning(false)
  }, [cases, runOne])

  const stats = useMemo(() => {
    let pass = 0
    let fail = 0
    let done = 0
    for (const c of cases) {
      const s = results[c.id]?.status
      if (s === 'pass') { pass++; done++ }
      else if (s === 'fail') { fail++; done++ }
    }
    return { pass, fail, done, total: cases.length }
  }, [cases, results])

  const groups = useMemo(() => {
    const m = new Map()
    for (const c of cases) {
      if (!m.has(c.group)) m.set(c.group, [])
      m.get(c.group).push(c)
    }
    return [...m.entries()]
  }, [cases])

  const copyText = async (text, tag) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(tag)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      // 忽略剪贴板权限失败
    }
  }

  const downloadScript = () => {
    if (!pythonScript) return
    const blob = new Blob([pythonScript], { type: 'text/x-python' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'test_pages.py'
    a.click()
    URL.revokeObjectURL(url)
  }

  const progress = stats.total ? (stats.done / stats.total) * 100 : 0

  return (
    <div className={`tc ${className}`}>
      {/* 控制条 + 统计 */}
      <div className="tc-toolbar">
        <button
          type="button"
          className="btn tc-run-all"
          onClick={runAll}
          disabled={running}
        >
          {running ? `运行中 ${stats.done}/${stats.total}` : '运行全部测试'}
        </button>
        <div className="tc-stats">
          <span className="tc-stat tc-stat-pass">通过 {stats.pass}</span>
          <span className="tc-stat tc-stat-fail">失败 {stats.fail}</span>
          <span className="tc-stat tc-stat-total">合计 {stats.total}</span>
        </div>
        <div className="tc-progress" aria-hidden="true">
          <div className="tc-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 用例列表 */}
      <div className="tc-groups">
        {groups.map(([group, list]) => (
          <section className="tc-group" key={group}>
            <h3 className="tc-group-title">{group}</h3>
            <ul className="tc-list">
              {list.map((tc) => {
                const st = results[tc.id]?.status || 'idle'
                return (
                  <li className={`tc-item tc-${st}`} key={tc.id}>
                    <span className="tc-mark" aria-hidden="true">
                      {st === 'pass' ? '✓' : st === 'fail' ? '✗' : st === 'running' ? '⟳' : '•'}
                    </span>
                    <span className="tc-name">{tc.name}</span>
                    {(results[tc.id]?.detail) && (
                      <span className="tc-detail">{results[tc.id].detail}</span>
                    )}
                    <button
                      type="button"
                      className="tc-run-one"
                      onClick={() => runOne(tc)}
                      disabled={running}
                    >
                      运行
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Python 脚本区 */}
      {pythonScript && (
        <section className="tc-script">
          <div className="tc-script-head">
            <h3 className="tc-script-title">Python E2E 测试脚本</h3>
            <div className="tc-script-actions">
              <button type="button" className="tc-action" onClick={() => copyText(pythonScript, 'script')}>
                {copied === 'script' ? '已复制' : '复制脚本'}
              </button>
              <button type="button" className="tc-action" onClick={downloadScript}>
                下载 .py
              </button>
            </div>
          </div>
          {runCommand && (
            <div className="tc-cmd">
              <code>{runCommand}</code>
              <button type="button" className="tc-action" onClick={() => copyText(runCommand, 'cmd')}>
                {copied === 'cmd' ? '已复制' : '复制'}
              </button>
            </div>
          )}
          <pre className="tc-code"><code>{pythonScript}</code></pre>
          <p className="tc-tip">
            浏览器无法直接执行 Python。上述前端测试即时验证逻辑层；Python 脚本在终端运行，
            用 Playwright 自动启动 dev server、登录并逐页验证渲染与交互。
          </p>
        </section>
      )}
    </div>
  )
}

export default TestCenter
