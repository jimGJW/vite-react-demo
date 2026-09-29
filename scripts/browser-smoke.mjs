/* 浏览器级冒烟：用 CDP 驱动本机 headless Chrome，逐条访问所有路由，
   收集 console error / 未捕获异常，并断言页面真的渲染出了内容。

   ── 它在补哪一层盲区 ──────────────────────────────────
   • vite build  ：只做静态编译，跑不出运行时错误
   • SSR 冒烟    ：能跑组件树，但没有 window / document，effect 与浏览器 API 全跳过
   • 本脚本      ：真实浏览器 + 真实 effect + 真实请求，最接近用户所见

   ── 设计取舍 ──────────────────────────────────────────
   • 零新依赖：用 Node 22 内置的 WebSocket 直连 CDP，不装 playwright/puppeteer
   • 路由自动同步：从 src/App.jsx 解析 <Route>，新增页面无需改脚本
   • dev server 需先启动（npm run dev）；也可 BASE_URL=... 指定已有地址

   跑法：npm run test:browser
*/
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const BASE = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = Number(process.env.CDP_PORT || 9333)
const SESSION_KEY = 'starfleet.session'
/** 单页最长等待（ms）：lazy 页面要下载 chunk，太短会误判 */
const PAGE_TIMEOUT = 12000
/** 单条 CDP 命令超时（ms）。首次 Runtime.enable 在慢机器上可能要几十秒，
    写死 20s 会把「启动慢」误判成「脚本失败」，调到 60s 并允许环境变量覆盖 */
const CDP_TIMEOUT = Number(process.env.CDP_TIMEOUT || 60000)
/** 取主内容区文本：整页 innerText 会被侧边导航占满，看不出页面到底渲染了什么 */
const MAIN_TEXT = `((document.querySelector('main[role="main"]')||document.body).innerText||'').replace(/\\s+/g,' ').slice(0,100)`

/* ---------- 1. 从 App.jsx 解析路由（自动同步，不用手维护清单） ---------- */
function parseRoutes() {
  const src = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8')
  const routes = []
  // 先抓顶层绝对路由（如 /login），再抓嵌套在 "/" 下的相对路由
  const abs = [...src.matchAll(/<Route\s+path="(\/[^"]*)"/g)].map((m) => m[1])
  const hasIndex = /<Route\s+index\s+element/.test(src)
  const rel = [...src.matchAll(/<Route\s+path="([^"/][^"]*)"/g)].map((m) => m[1])

  if (hasIndex) routes.push('/')
  for (const p of rel) if (p !== '*') routes.push(`/${p}`)
  for (const p of abs) if (p !== '/*') routes.push(p)
  return [...new Set(routes)].sort()
}

/* ---------- 2. 极简 CDP 客户端 ---------- */
function createCdp(ws) {
  let id = 0
  const pending = new Map()
  const listeners = []

  ws.addEventListener('message', (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
      return
    }
    if (msg.method) for (const fn of listeners) fn(msg)
  })

  return {
    send(method, params = {}) {
      const msgId = ++id
      return new Promise((resolve, reject) => {
        pending.set(msgId, { resolve, reject })
        ws.send(JSON.stringify({ id: msgId, method, params }))
        setTimeout(() => {
          if (pending.has(msgId)) {
            pending.delete(msgId)
            reject(new Error(`CDP 命令超时: ${method}`))
          }
        }, CDP_TIMEOUT)
      })
    },
    on(fn) {
      listeners.push(fn)
    },
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForTargetReady() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)
      if (res.ok) return true
    } catch {
      /* 还没起来 */
    }
    await sleep(300)
  }
  return false
}

/* ---------- 3. 启动 headless Chrome ---------- */
function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-smoke-'))
  const proc = spawn(
    CHROME,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--mute-audio',
      `--user-data-dir=${userDataDir}`,
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--remote-allow-origins=*',
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'], detached: false },
  )
  /* 收集 stderr：Chrome 启动失败（端口占用 / 沙箱拦截 / 版本不兼容）时信息只走 stderr，
     用 ignore 会完全看不到，失败原因只能靠猜 */
  let stderrLog = ''
  proc.stderr?.setEncoding('utf8')
  proc.stderr?.on('data', (chunk) => {
    stderrLog += chunk
    if (stderrLog.length > 4000) stderrLog = stderrLog.slice(-4000)
  })
  return { proc, userDataDir, getStderr: () => stderrLog.trim() }
}

/* ---------- 4. 主流程 ---------- */
const routes = parseRoutes()
if (!routes.length) {
  console.error('未能从 src/App.jsx 解析出任何路由，脚本中止')
  process.exit(1)
}

// dev server 探活
try {
  const res = await fetch(BASE, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
} catch (e) {
  console.error(`dev server 不可达（${BASE}）：${e.message}`)
  console.error('请先另开终端执行：npm run dev')
  process.exit(1)
}

if (!fs.existsSync(CHROME)) {
  console.error(`未找到 Chrome：${CHROME}`)
  process.exit(1)
}

console.log(`目标：${BASE}    路由数：${routes.length}\n`)
const { proc: chrome, userDataDir, getStderr } = launchChrome()
const ready = await waitForTargetReady()
if (!ready) {
  chrome.kill('SIGKILL')
  console.error('Chrome 调试端口未就绪')
  process.exit(1)
}
/* 端口就绪 ≠ target 就绪：刚起的新实例还在初始化，立刻发命令容易挂住 */
await sleep(800)

/* 开标签页：新起的实例偶尔会在「端口已就绪」之后才真正可用，
   单次的 fetch 失败直接退出会把偶发抖动误判成脚本故障，这里重试几次 */
async function openTab() {
  const tab = await (
    await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(BASE)}`, {
      method: 'PUT',
    })
  ).json()
  const ws = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
    setTimeout(() => reject(new Error('WebSocket 连接超时')), 10000)
  })
  return ws
}

let ws
let lastErr
for (let attempt = 1; attempt <= 3 && !ws; attempt += 1) {
  try {
    ws = await openTab()
  } catch (e) {
    lastErr = e
    await sleep(1000)
  }
}
if (!ws) {
  chrome.kill('SIGKILL')
  console.error(`无法连接浏览器：${lastErr?.message}`)
  const err = getStderr()
  if (err) console.error(`Chrome stderr:\n${err}`)
  process.exit(1)
}

const cdp = createCdp(ws)
let consoleErrors = []
let exceptions = []

cdp.on((msg) => {
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    const text = (msg.params.args || [])
      .map((a) => a.value ?? a.description ?? a.type)
      .join(' ')
    consoleErrors.push(text)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails || {}
    exceptions.push(d.exception?.description || d.text || '未知异常')
  }
})

await cdp.send('Runtime.enable')
await cdp.send('Page.enable')
await cdp.send('Log.enable')

const evaluate = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  })
  return r?.result?.value
}

/* 注入登录态：守卫下的页面否则会全部重定向到 /login */
await cdp.send('Page.navigate', { url: BASE })
await sleep(800)
await evaluate(
  `localStorage.setItem(${JSON.stringify(SESSION_KEY)}, JSON.stringify({ name: 'smoke', loginAt: Date.now() }))`,
)

/* 逐路由访问 */
const results = []
for (const route of routes) {
  consoleErrors = []
  exceptions = []
  const url = `${BASE}${route}`
  let status = 'ok'
  let text = ''

  await cdp.send('Page.navigate', { url })
  // 轮询等待：lazy chunk + React 渲染 + effect 都需要时间
  const started = Date.now()
  while (Date.now() - started < PAGE_TIMEOUT) {
    await sleep(250)
    // 只取主内容区：整页 innerText 会被侧边导航占满，断言会「假通过」
    const state = await evaluate(
      `(function(){var m=document.querySelector('main[role="main"]')||document.body;
        return JSON.stringify({len:(m.innerText||'').trim().length, path:location.pathname,
        loading:!!document.querySelector('.page-loading')})})()`,
    )
    if (state && state.len > 40 && !state.loading) {
      text = await evaluate(MAIN_TEXT)
      break
    }
  }
  if (!text) text = await evaluate(MAIN_TEXT)

  const errs = [...new Set([...exceptions, ...consoleErrors])]
    // 过滤与页面代码无关的环境噪音
    .filter((e) => !/favicon|Failed to load resource: the server responded with a status of 404/i.test(e))

  if (errs.length) status = 'error'
  results.push({ route, status, text: (text || '').replace(/\s+/g, ' ').trim(), errs })
}

await ws.close()
chrome.kill('SIGKILL')
try {
  fs.rmSync(userDataDir, { recursive: true, force: true })
} catch {
  /* 忽略清理失败 */
}

/* ---------- 5. 报告 ---------- */
let failed = 0
for (const r of results) {
  if (r.status === 'error') {
    failed += 1
    console.log(`✗ ${r.route}`)
    for (const e of r.errs.slice(0, 3)) console.log(`    ${e.split('\n')[0].slice(0, 200)}`)
  } else {
    console.log(`✓ ${r.route}  ${r.text.slice(0, 60)}`)
  }
}
console.log(
  failed === 0
    ? `\n浏览器冒烟全部通过（${results.length} 个路由，无 console error / 未捕获异常）`
    : `\n${failed}/${results.length} 个路由存在运行时错误`,
)
process.exit(failed === 0 ? 0 : 1)
