/* qiankun 融合 E2E：真实浏览器里验证「主应用点击加载 → 子应用真实挂载」。
   ── 它在补哪一层盲区 ──────────────────────────────────
   • build / 浏览器冒烟：只能证明 /micro-frontend 页面本身渲染不报错，
     证明不了 qiankun 真的把 vue-app / angular-app 拉起来并挂进容器。
   • 本脚本：起好三个服务后，点击「一键加载全部子应用」，轮询断言两个
     容器内出现子应用真实渲染的 DOM。

   前置：npm run dev:all（主应用 5173 + vue-app 7101 + angular-app 7102）
   跑法：npm run test:qiankun
*/
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const BASE = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = Number(process.env.CDP_PORT || 9334)
const SESSION_KEY = 'starfleet.session'
/** 子应用加载 + 挂载的最长等待：angular 冷启动 chunk 很大，给足 */
const LOAD_TIMEOUT = Number(process.env.QK_TIMEOUT || 45000)
const CDP_TIMEOUT = Number(process.env.CDP_TIMEOUT || 60000)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---------- 前置探活：三个服务都必须在线 ---------- */
async function probe(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

const services = [
  ['主应用', BASE],
  ['vue-app', 'http://localhost:7101/'],
  ['angular-app', 'http://localhost:7102/'],
]
for (const [name, url] of services) {
  if (!(await probe(url))) {
    console.error(`${name}（${url}）不可达。请先执行：npm run dev:all`)
    process.exit(1)
  }
}

if (!fs.existsSync(CHROME)) {
  console.error(`未找到 Chrome：${CHROME}`)
  process.exit(1)
}

/* ---------- 极简 CDP 客户端（与 browser-smoke 同款） ---------- */
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

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qk-smoke-'))
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
  let stderrLog = ''
  proc.stderr?.setEncoding('utf8')
  proc.stderr?.on('data', (chunk) => {
    stderrLog += chunk
    if (stderrLog.length > 4000) stderrLog = stderrLog.slice(-4000)
  })
  return { proc, userDataDir, getStderr: () => stderrLog.trim() }
}

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

/* ---------- 主流程 ---------- */
console.log(`目标：${BASE}/micro-frontend    三个服务均已探活\n`)
const { proc: chrome, userDataDir, getStderr } = launchChrome()
if (!(await waitForTargetReady())) {
  chrome.kill('SIGKILL')
  console.error('Chrome 调试端口未就绪')
  process.exit(1)
}
await sleep(800)

const tab = await (
  await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(`${BASE}/micro-frontend`)}`, {
    method: 'PUT',
  })
).json()
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
  setTimeout(() => reject(new Error('WebSocket 连接超时')), 10000)
})

const cdp = createCdp(ws)
const consoleErrors = []
const exceptions = []
cdp.on((msg) => {
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ')
    consoleErrors.push(text)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails || {}
    exceptions.push(d.exception?.description || d.text || '未知异常')
  }
})

await cdp.send('Runtime.enable')
await cdp.send('Page.enable')
const evaluate = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  return r?.result?.value
}

/* 登录态 + 等页面渲染 */
await cdp.send('Page.navigate', { url: `${BASE}/micro-frontend` })
await sleep(800)
await evaluate(
  `localStorage.setItem(${JSON.stringify(SESSION_KEY)}, JSON.stringify({ name: 'smoke', loginAt: Date.now() }))`,
)
await cdp.send('Page.navigate', { url: `${BASE}/micro-frontend` })

let pageReady = false
const started = Date.now()
while (Date.now() - started < 20000) {
  await sleep(400)
  const s = await evaluate(
    `(() => { const btns=[...document.querySelectorAll('button')];
      return JSON.stringify({ hasBtn: btns.some(b=>b.textContent.includes('一键加载')),
        path: location.pathname }) })()`,
  )
  if (s) {
    const st = JSON.parse(s)
    if (st.hasBtn) {
      pageReady = true
      break
    }
  }
}
if (!pageReady) {
  ws.close()
  chrome.kill('SIGKILL')
  fs.rmSync(userDataDir, { recursive: true, force: true })
  console.error('✗ /micro-frontend 页面未渲染出「一键加载」按钮（20s 超时）')
  process.exit(1)
}
console.log('✓ 演示页已渲染，点击「一键加载全部子应用」')

/* 点击加载 */
await evaluate(
  `[...document.querySelectorAll('button')].find(b=>b.textContent.includes('一键加载')).click()`,
)

/* 轮询断言：两个容器都出现子应用 DOM（qiankun 会把子应用 HTML 注入容器） */
const containerState = `(function(){
  var pick = function(key){
    var el = document.querySelector('[data-app="'+key+'"]');
    if (!el) return { found:false };
    return { found:true, children: el.children.length,
      text: (el.innerText||'').replace(/\\s+/g,' ').slice(0,60) };
  };
  return JSON.stringify({ vue: pick('vue'), angular: pick('angular') });
})()`

const t0 = Date.now()
let state = null
while (Date.now() - t0 < LOAD_TIMEOUT) {
  await sleep(1000)
  const raw = await evaluate(containerState)
  if (raw) state = JSON.parse(raw)
  if (state && state.vue.children > 0 && state.angular.children > 0) break
}

ws.close()
chrome.kill('SIGKILL')
try {
  fs.rmSync(userDataDir, { recursive: true, force: true })
} catch {
  /* 忽略清理失败 */
}

/* ---------- 报告 ---------- */
let failed = 0
for (const key of ['vue', 'angular']) {
  const s = state?.[key]
  if (s?.found && s.children > 0) {
    console.log(`✓ ${key} 容器已挂载（${s.children} 个子节点）：${s.text.slice(0, 50)}`)
  } else {
    failed += 1
    console.log(`✗ ${key} 容器未挂载：${JSON.stringify(s)}`)
  }
}
const envErrs = [...new Set([...exceptions, ...consoleErrors])].filter(
  (e) => !/favicon|Failed to load resource.*404/i.test(e),
)
if (envErrs.length) {
  console.log('\n浏览器侧报错（前 3 条）:')
  for (const e of envErrs.slice(0, 3)) console.log(`  ${e.split('\n')[0].slice(0, 200)}`)
}

if (failed === 0 && envErrs.length === 0) {
  console.log('\nqiankun 融合冒烟全部通过（vue-app + angular-app 均真实挂载，无报错）')
  process.exit(0)
}
console.log(`\nqiankun 融合冒烟存在失败（${failed} 项未挂载 / ${envErrs.length} 条报错）`)
process.exit(1)
