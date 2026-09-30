/* 子应用「全视图」诊断：逐视图访问，收集文本 + console error / 异常
   目的：Angular JIT 是「首次访问该组件才编译模板」，只访问首页会漏掉其它视图的模板错误
   两种模式：
     A) 宿主内嵌：/micro-vue、/micro-angular（只验证子应用能被 qiankun 起来并渲染首页）
     B) 独立直开：7101 / 7102（子应用自带导航可见 → 逐个 tab 点开，覆盖全部视图）

   每点一个 tab 断言两件事：
     1) 无 console error / 未捕获异常（原有用途：抓 JIT 模板错误）
     2) 该 tab 真的拿到了 `is-active`（页内导航选中态回归；两个子应用统一用这个类名）
   打印的视图文本会**剔除页内导航条**，否则 22 条导航文案会把真正的页面内容挤出可视长度，
   看起来"每条都通过"其实什么都没验证到。 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE = 'http://localhost:5173'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = Number(process.env.DIAG_PORT || 9338)
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

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sub-diag-'))
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
const errors = []
cdp.on((msg) => {
  if (msg.method === 'Runtime.consoleAPICalled') {
    const type = msg.params.type
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ')
    if (type === 'error') { errors.push(`[console.error] ${text.slice(0, 300)}`); logs.push(text.slice(0, 160)) }
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails || {}
    const desc = (d.exception?.description || d.text || '').slice(0, 400)
    errors.push(`[EXC] ${desc}`)
  }
})
await cdp.send('Runtime.enable')
await cdp.send('Page.enable')
const evaluate = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  return r?.result?.value
}

await cdp.send('Page.navigate', { url: `${BASE}/` })
await sleep(2500)
await evaluate(`localStorage.setItem(${JSON.stringify(SESSION_KEY)}, JSON.stringify({ name: 'diag', loginAt: Date.now() }))`)

const HOSTS = [
  { name: '/micro-vue (宿主内嵌)', url: `${BASE}/micro-vue`, sel: '[data-app="vue"]', navSel: null, stripSel: null },
  { name: '/micro-angular (宿主内嵌)', url: `${BASE}/micro-angular`, sel: '[data-app="angular"]', navSel: null, stripSel: null },
  { name: 'vue-app 独立 7101', url: 'http://localhost:7101/', sel: '.app-view', navSel: '.app-nav__link', stripSel: '.app-nav' },
  { name: 'angular-app 独立 7102', url: 'http://localhost:7102/', sel: 'app-root', navSel: '.ng-tab', stripSel: '.ng-tabs' },
]

/** 读文本：剔除页内导航条后再取，保证打印出来的是「页面内容」而不是导航菜单 */
const readText = (sel, stripSel, n) => `(function(){
  var e = document.querySelector(${JSON.stringify(sel)});
  if (!e) return 'NOT FOUND';
  var clone = e.cloneNode(true);
  var strip = ${stripSel ? `clone.querySelector(${JSON.stringify(stripSel)})` : 'null'};
  if (strip && strip.parentNode) strip.parentNode.removeChild(strip);
  return (clone.innerText || '').replace(/\\s+/g, ' ').slice(0, ${n});
})()`

let totalFail = 0
for (const host of HOSTS) {
  console.log(`\n########## ${host.name} ##########`)
  errors.length = 0
  await cdp.send('Page.navigate', { url: host.url })
  await sleep(host.navSel ? 5000 : 14000)

  const text0 = await evaluate(readText(host.sel, host.stripSel, 130))
  console.log(`  初始视图: ${text0}`)
  if (errors.length) { totalFail += errors.length; console.log('  ❌ 初始视图报错:'); for (const e of errors) console.log('    ' + e) }

  if (!host.navSel) continue

  const labels = await evaluate(`(function(){
    var nodes = Array.from(document.querySelectorAll(${JSON.stringify(host.navSel)}));
    return nodes.map(function(n){return (n.innerText||'').trim();}).filter(Boolean);
  })()`) || []

  for (const label of labels) {
    errors.length = 0
    const clicked = await evaluate(`(function(){
      var nodes = Array.from(document.querySelectorAll(${JSON.stringify(host.navSel)}));
      var target = nodes.find(function(n){ return (n.innerText||'').trim() === ${JSON.stringify(label)}; });
      if (!target) return false;
      target.click();
      return true;
    })()`)
    if (!clicked) continue
    await sleep(1800)
    const txt = await evaluate(readText(host.sel, host.stripSel, 110))
    /* 选中态判定：被点的那条拿到 is-active → 通过。
       拿不到时不直接判失败，先分辨两种「合理解释」：
         a) 点了不在菜单里的兜底页（如「404 演示」）→ 当前页本就不在导航里，无人高亮是正常的
         b) 被路由守卫改道（如未登录点「受保护页面」→ /login?redirect=…）→ 高亮应该落在改道后的那条
       只有「既没高亮自己、又没有唯一的高亮替身、也不是兜底页」才算真回归。 */
    const hit = await evaluate(`(function(){
      var nodes = Array.from(document.querySelectorAll(${JSON.stringify(host.navSel)}));
      var target = nodes.find(function(n){ return (n.innerText||'').trim() === ${JSON.stringify(label)}; });
      var act = nodes.filter(function(n){ return n.classList.contains('is-active'); });
      return {
        self: !!target && target.classList.contains('is-active'),
        active: act.map(function(n){ return (n.innerText||'').trim(); }),
      };
    })()`)
    const isFallbackPage = /404/.test(txt) || /页面不存在|未匹配到/.test(txt)
    let verdict = ''
    if (hit.self) verdict = ''
    else if (isFallbackPage) verdict = ' ⚠️ 兜底页（不在菜单里，无人高亮属正常）'
    else if (hit.active.length === 1) verdict = ` ⚠️ 被守卫改道 → 高亮已落在「${hit.active[0]}」`
    else verdict = ` ❐ 未拿到 is-active（实际高亮=${JSON.stringify(hit.active)}）`

    const bad = errors.length > 0 || (verdict.startsWith(' ❐'))
    if (bad) totalFail += errors.length + (verdict.startsWith(' ❐') ? 1 : 0)
    console.log(`  ${bad ? '❌' : hit.self ? '✅' : '⚠️'} ${label.padEnd(18, ' ')} → ${txt}${verdict}`)
    if (errors.length) for (const e of errors) console.log('      ' + e)
  }
}

console.log(`\n===== 结论：${totalFail === 0 ? '全部视图无 console error / 异常' : `发现 ${totalFail} 条报错`} =====`)
ws.close()
chrome.kill('SIGKILL')
try { fs.rmSync(userDataDir, { recursive: true, force: true }) } catch {}
process.exitCode = totalFail === 0 ? 0 : 1
