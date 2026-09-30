/* 快速诊断：/micro-vue 页面到底渲染成了什么 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE = 'http://localhost:5173'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9338
const SESSION_KEY = 'starfleet.session'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function createCdp(ws) {
  let id = 0
  const pending = new Map()
  const listeners = []
  ws.addEventListener('message', (ev) => {
    let msg
    try { msg = JSON.parse(ev.data) } catch { return }
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
        setTimeout(() => { if (pending.has(msgId)) { pending.delete(msgId); reject(new Error(`超时: ${method}`)) } }, 60000)
      })
    },
    on(fn) { listeners.push(fn) },
  }
}

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qk-diag2-'))
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
  `--user-data-dir=${userDataDir}`, `--remote-debugging-port=${DEBUG_PORT}`, '--remote-allow-origins=*', 'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] })
for (let i = 0; i < 60; i += 1) {
  try { const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`); if (r.ok) break } catch {}
  await sleep(300)
}
await sleep(800)
const tab = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json()
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }) })
const cdp = createCdp(ws)
const logs = []
cdp.on((msg) => {
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ')
    logs.push(`[${msg.params.type}] ${text.slice(0, 260)}`)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails || {}
    logs.push(`[EXC] ${(d.exception?.description || d.text || '').slice(0, 260)}`)
  }
})
await cdp.send('Runtime.enable')
await cdp.send('Page.enable')
const evaluate = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  return r?.result?.value
}
await evaluate(`localStorage.setItem(${JSON.stringify(SESSION_KEY)}, JSON.stringify({ name: 'diag', loginAt: Date.now() }))`)
await cdp.send('Page.navigate', { url: `${BASE}/micro-vue` })
await sleep(6000)
const info = await evaluate(`JSON.stringify({
  href: location.href,
  hasMain: !!document.querySelector('main[role="main"]'),
  bodyText: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 260),
  hasDataApp: !!document.querySelector('[data-app]'),
})`)
console.log('=== 页面状态 ===')
console.log(info)
console.log('=== console（全部）===')
for (const l of logs.slice(0, 25)) console.log(l)
ws.close()
chrome.kill('SIGKILL')
try { fs.rmSync(userDataDir, { recursive: true, force: true }) } catch {}
