/**
 * 地球 / 海洋看板专项冒烟（CDP 驱动本机 headless Chrome）。
 *
 * 与 scripts/astro-smoke.mjs 同一套思路，但覆盖 /geo 与 /ocean 两页：
 * 断言「真实渲染出来的内容」而不只是「没有 console error」——
 * 这两页最典型的失败是接口挂了但页面静默显示空，只查 console error 抓不到。
 *
 * 前置：dev server 已在 BASE_URL（默认 http://localhost:5173）就绪。
 * 用法：npm run test:earth
 */

import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const PORT = Number(process.env.CDP_PORT || 9336)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'earth-cdp-'))
const chromeBin = fs.existsSync(CHROME) ? CHROME : undefined

function launchChrome() {
  return spawn(chromeBin, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank',
  ], { stdio: 'ignore' })
}

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const j = await res.json()
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl
    } catch {
      /* 重试 */
    }
    await sleep(250)
  }
  throw new Error(`CDP 未就绪（端口 ${PORT}）。若沙箱拦截子进程，请禁用沙箱后重跑。`)
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  const pending = new Map()
  const consoleErrors = []
  let id = 0
  let opened = false

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) rej(new Error(msg.error.message))
      else res(msg.result)
      return
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      consoleErrors.push(d.exception?.description || d.text || 'unknown exception')
    }
  }

  return {
    consoleErrors,
    ready(timeoutMs = 8000) {
      return new Promise((res, rej) => {
        if (opened) return res()
        const t = setTimeout(() => rej(new Error(`WebSocket 未在 ${timeoutMs}ms 内就绪`)), timeoutMs)
        ws.onopen = () => { opened = true; clearTimeout(t); res() }
      })
    },
    send(method, params = {}, sessionId, timeoutMs = 20000) {
      return new Promise((res, rej) => {
        const msgId = ++id
        const t = setTimeout(() => {
          pending.delete(msgId)
          rej(new Error(`CDP ${method} 超时`))
        }, timeoutMs)
        pending.set(msgId, {
          res: (v) => { clearTimeout(t); res(v) },
          rej: (e) => { clearTimeout(t); rej(e) },
        })
        ws.send(JSON.stringify({ id: msgId, method, params, sessionId }))
      })
    },
    close: () => ws.close(),
  }
}

async function evaluate(cdp, sessionId, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  }, sessionId)
  if (r.exceptionDetails) {
    throw new Error(`求值失败: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`)
  }
  return r.result.value
}

/** 点击某个页签（antd 只渲染激活面板，跨 tab 断言必须先切过去） */
async function clickTab(cdp, sessionId, label) {
  const r = await evaluate(cdp, sessionId, `(() => {
    const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(e => e.textContent.includes(${JSON.stringify(label)}))
    if (!tab) return 'no-tab'
    tab.click()
    return 'clicked'
  })()`)
  await sleep(900)
  return r
}

/* ================= 断言清单 ================= */

const GEO_ASSERTIONS = [
  ['页面标题', `document.querySelector('.geo-hero h1')?.textContent || ''`, /地球数据看板/],
  ['指标条 ≥10 项', `document.querySelectorAll('.geo-strip .geo-metric').length`, (v) => v >= 10],
  ['CO₂ 指标已回填', `[...document.querySelectorAll('.geo-strip .geo-metric')].some(e=>/CO₂/.test(e.textContent)&&/\\d/.test(e.textContent))`, (v) => v === true],
  ['CH₄ 指标已回填', `[...document.querySelectorAll('.geo-strip .geo-metric')].some(e=>/CH₄/.test(e.textContent)&&/\\d/.test(e.textContent))`, (v) => v === true],
  ['温度距平指标已回填', `[...document.querySelectorAll('.geo-strip .geo-metric')].some(e=>/温度距平/.test(e.textContent)&&/\\+/.test(e.textContent))`, (v) => v === true],
  ['地震地图 SVG 已渲染', `!!document.querySelector('svg.geo-quakemap, .geo-quakemap svg')`, (v) => v === true],
  ['火山指标已回填', `[...document.querySelectorAll('.geo-strip .geo-metric')].some(e=>/火山警报/.test(e.textContent)&&/\\d/.test(e.textContent))`, (v) => v === true],
  ['海啸指标已回填', `[...document.querySelectorAll('.geo-strip .geo-metric')].some(e=>/海啸公告/.test(e.textContent)&&/\\d/.test(e.textContent))`, (v) => v === true],
  ['无失败面板', `document.querySelectorAll('.geo-fail').length`, (v) => v === 0],
]

const GEO_INTERACTIONS = [
  ['切到「地表与气候」', () => null, 0],
  ['温室气体三张卡', `document.querySelectorAll('.geo-ghg-card').length`, (v) => v === 3, 800],
  ['温室气体有真实浓度', `[...document.querySelectorAll('.geo-ghg-card__val')].map(e=>e.textContent).join(' ')`,
    (v) => /\d{3}/.test(String(v)), 0],
  ['温室气体迷你折线已画', `document.querySelectorAll('.geo-ghg__spark path').length`, (v) => v >= 6, 0],
  ['温度距平柱图已渲染', `document.querySelectorAll('.geo-chart svg rect').length`, (v) => v >= 100, 0],
  ['南北极海冰并排两张', `document.querySelectorAll('.geo-ice-pair__item').length`, (v) => v === 2, 0],
  ['海冰图有数据柱', `document.querySelectorAll('.geo-ice-pair rect').length`, (v) => v >= 80, 0],
  ['城市表含紫外列', `[...document.querySelectorAll('.geo-env-table th')].some(e=>/紫外/.test(e.textContent))`, (v) => v === true, 0],
  ['切到「大地脉动」', () => null, 0],
  ['强震面板已渲染', `!!document.querySelector('.geo-strong')`, (v) => v === true, 1500],
  ['强震按日柱图有柱', `document.querySelectorAll('.geo-strong rect').length`, (v) => v >= 25, 0],
  ['强震统计有次数', `document.querySelector('.geo-strong__stats')?.textContent || ''`, (v) => /\d+\s*次/.test(String(v)), 0],
  ['切到「火山与海啸」', () => null, 0],
  ['火山统计行已渲染', `!!document.querySelector('.geo-alert-stat') || !!document.querySelector('.ant-empty')`, (v) => v === true, 3000],
  ['火山表有行或空态', `document.querySelectorAll('.geo-env-table tbody tr').length + document.querySelectorAll('.ant-empty').length`, (v) => v >= 1, 0],
  ['火山色码 Tag 已渲染', `[...document.querySelectorAll('.geo-env-table .ant-tag')].map(e=>e.textContent).join(' ')`,
    (v) => /绿|黄|橙|红/.test(String(v)), 0],
  ['海啸公告区已渲染', `!!document.querySelector('.geo-tsu-list') || !!document.querySelector('.ant-empty')`, (v) => v === true, 0],
  ['海啸等级 Tag 有级别', `[...document.querySelectorAll('.geo-tsu-item .ant-tag')].map(e=>e.textContent).join(' ')`,
    (v) => /信息声明|海啸注意|海啸建议|海啸警报/.test(String(v)), 0],
  ['等级图例 12 个色点', `document.querySelectorAll('.geo-alert-legend__dot').length`, (v) => v >= 12, 0],
  ['火山页无 undefined', `document.querySelector('main')?.innerText || ''`, (v) => !/undefined/.test(String(v)), 0],
  ['切到「名词解释」', () => null, 0],
  ['词典卡片 ≥28 张', `document.querySelectorAll('.dv-card').length`, (v) => v >= 28, 900],
  ['每张卡都含三段释义', `[...document.querySelectorAll('.dv-card')].every(c=>/是什么/.test(c.textContent)&&/怎么读/.test(c.textContent)&&/所以呢/.test(c.textContent))`, (v) => v === true, 0],
  ['词典含「有效波高」', `[...document.querySelectorAll('.dv-card__name')].some(e=>/有效波高/.test(e.textContent))`, (v) => v === true, 0],
  ['词典含「火山警报等级」', `[...document.querySelectorAll('.dv-card__name')].some(e=>/火山警报等级/.test(e.textContent))`, (v) => v === true, 0],
  ['火山等级速查已渲染', `[...document.querySelectorAll('.dv-band__title')].some(e=>/火山地面警报级/.test(e.textContent))`, (v) => v === true, 0],
  ['海啸等级速查已渲染', `[...document.querySelectorAll('.dv-band__title')].some(e=>/海啸公告等级/.test(e.textContent))`, (v) => v === true, 0],
  ['分档速查表 ≥6 张', `document.querySelectorAll('.dv-band').length`, (v) => v >= 6, 0],
  ['词典无 undefined', `document.querySelector('main')?.innerText || ''`, (v) => !/undefined/.test(String(v)), 0],
]

const OCEAN_ASSERTIONS = [
  ['页面标题', `document.querySelector('.o-hero h1')?.textContent || ''`, /海洋数据看板/],
  ['指标条 ≥9 项', `document.querySelectorAll('.o-strip .o-metric').length`, (v) => v >= 9],
  ['气旋指标已回填', `[...document.querySelectorAll('.o-strip .o-metric')].some(e=>/活跃热带气旋/.test(e.textContent)&&/\\d/.test(e.textContent))`, (v) => v === true],
  ['海洋距平指标已回填', `[...document.querySelectorAll('.o-strip .o-metric')].some(e=>/海洋温度距平/.test(e.textContent)&&/\\+/.test(e.textContent))`, (v) => v === true],
  ['浮标最大浪已回填', `[...document.querySelectorAll('.o-strip .o-metric')].some(e=>/浮标最大浪/.test(e.textContent)&&/\\d/.test(e.textContent))`, (v) => v === true],
  ['无失败面板', `document.querySelectorAll('.o-fail').length`, (v) => v === 0],
]

const OCEAN_INTERACTIONS = [
  ['切到「海浪与海温」', () => null, 0],
  ['海况表含涌浪列', `[...document.querySelectorAll('.o-wave-table th')].some(e=>/涌浪/.test(e.textContent))`, (v) => v === true, 1200],
  ['海况表含风浪列', `[...document.querySelectorAll('.o-wave-table th')].some(e=>/风浪/.test(e.textContent))`, (v) => v === true, 0],
  ['涌浪列有真实数值', `[...document.querySelectorAll('.o-wave-table td')].map(e=>e.textContent).join(' ')`, (v) => /\d\.\d\d m \/ \d+ s/.test(String(v)), 0],
  ['切到「潮汐」', () => null, 0],
  ['站点气温面板已渲染', `!!document.querySelector('.o-stnwx')`, (v) => v === true, 1500],
  ['站点气温有数值', `document.querySelector('.o-stnwx')?.textContent || ''`, (v) => /\d+\.\d\s*°C/.test(String(v)), 0],
  ['切到「气候振荡」', () => null, 0],
  ['海洋温度距平 KPI', `!!document.querySelector('.o-ssta-kpi')`, (v) => v === true, 1500],
  ['距平柱图有柱', `document.querySelectorAll('.o-chart svg rect').length`, (v) => v >= 50, 0],
  ['PDO/AMO 两张图', `document.querySelectorAll('.o-osc__item').length`, (v) => v === 2, 0],
  ['振荡概况条有位相', `[...document.querySelectorAll('.o-osc-head__val')].map(e=>e.textContent).join(' ')`,
    (v) => /暖位相|冷位相/.test(String(v)), 0],
  ['切到「热带气旋」', () => null, 0],
  ['气旋页签已渲染', `!!document.querySelector('.o-cyc-stats') || !!document.querySelector('.ant-empty')`, (v) => v === true, 1200],
  ['切到「浮标实况」', () => null, 0],
  ['浮标 KPI 行已渲染', `document.querySelector('.o-buoy-kpi')?.textContent || ''`, (v) => /在岗站点/.test(String(v)), 4000],
  ['浮标表格 ≥10 行', `document.querySelectorAll('.o-buoy-table tbody tr').length`, (v) => v >= 10, 0],
  ['浮标表格有真实浪高', `[...document.querySelectorAll('.o-buoy-table td')].map(e=>e.textContent).join(' ')`,
    (v) => /\d\.\d\d m/.test(String(v)), 0],
  ['水温刻度条有落点', `document.querySelectorAll('.o-buoy-scale__dot').length`, (v) => v >= 5, 0],
  ['缺测单元格已弱化', `document.querySelectorAll('.o-buoy-none').length`, (v) => v >= 1, 0],
  ['浮标页无 undefined', `document.querySelector('main')?.innerText || ''`, (v) => !/undefined/.test(String(v)), 0],
  ['切到「名词解释」', () => null, 0],
  ['词典卡片 ≥15 张', `document.querySelectorAll('.dv-card').length`, (v) => v >= 15, 900],
  ['浮标词条已收录', `[...document.querySelectorAll('.dv-card__name')].some(e=>/海洋浮标观测/.test(e.textContent))`, (v) => v === true, 0],
  ['飓风等级速查已渲染', `[...document.querySelectorAll('.dv-band__title')].some(e=>/萨菲尔/.test(e.textContent))`, (v) => v === true, 0],
  ['潮位基准速查已渲染', `[...document.querySelectorAll('.dv-band__title')].some(e=>/潮位基准面/.test(e.textContent))`, (v) => v === true, 0],
  ['词典无 undefined', `document.querySelector('main')?.innerText || ''`, (v) => !/undefined/.test(String(v)), 0],
]

/** 页签切换动作（label 为 null 的项由前一项负责，这里只做占位跳过） */
const TAB_SEQUENCE = {
  '/geo': ['地表与气候', '大地脉动', '火山与海啸', '名词解释'],
  '/ocean': ['海浪与海温', '潮汐', '气候振荡', '热带气旋', '浮标实况', '名词解释'],
}

async function runRoute(cdp, sessionId, route, assertions, interactions) {
  console.log(`\n[earth-smoke] ===== ${route} =====`)
  const origin = new URL(BASE_URL).origin
  await cdp.send('Page.navigate', { url: origin }, sessionId)
  await sleep(1200)
  await evaluate(cdp, sessionId, `localStorage.setItem(
    'starfleet.session', JSON.stringify({ name: '冒烟测试', loginAt: Date.now() })
  )`).catch(() => { /* 忽略 */ })

  await cdp.send('Page.navigate', { url: `${BASE_URL}${route}` }, sessionId)
  const shell = route === '/geo' ? '.geo-hero h1' : '.o-hero h1'
  let ready = false
  for (let i = 0; i < 70; i++) {
    await sleep(500)
    if (await evaluate(cdp, sessionId, `!!document.querySelector('${shell}')`).catch(() => false)) {
      ready = true
      break
    }
  }
  if (!ready) {
    // 打印真实页面状态，便于区分「路由没渲染 / 守卫重定向 / 模块报错」
    const st = await evaluate(cdp, sessionId, `JSON.stringify({
      href: location.href,
      main: !!document.querySelector('main[role="main"]'),
      session: localStorage.getItem('starfleet.session'),
      text: (document.body?.innerText || '').slice(0, 300),
    })`).catch((e) => `求值失败: ${e.message}`)
    throw new Error(`${route} 骨架 35s 内未出现。状态: ${st}`)
  }
  // 等首个数据源回填（指标条里的数字从 '—' 变成真实值）
  await sleep(6000)

  let failed = 0
  for (const [name, expr, check] of assertions) {
    const value = await evaluate(cdp, sessionId, expr).catch((e) => `err:${e.message}`)
    const pass = typeof check === 'function' ? check(value) : check.test(String(value))
    console.log(`  ${pass ? '✅' : '❌'} ${name.padEnd(20)} ${String(value).slice(0, 40)}`)
    if (!pass) failed++
  }

  console.log('  -- 交互阶段 --')
  let tabIdx = 0
  const tabs = TAB_SEQUENCE[route] || []
  for (const [name, expr, check, waitMs] of interactions) {
    // 名字以「切到」开头的项是页签切换动作，按下序取标签
    if (name.startsWith('切到')) {
      const label = tabs[tabIdx++]
      const r = await clickTab(cdp, sessionId, label)
      console.log(`  ${r === 'clicked' ? '✅' : '❌'} ${name.padEnd(20)} ${r}`)
      if (r !== 'clicked') failed++
      await sleep(waitMs || 1500)
      continue
    }
    const value = await evaluate(cdp, sessionId, expr).catch((e) => `err:${e.message}`)
    const pass = typeof check === 'function' ? check(value) : check.test(String(value))
    console.log(`  ${pass ? '✅' : '❌'} ${name.padEnd(20)} ${String(value).slice(0, 40)}`)
    if (!pass) failed++
  }
  return failed
}

/**
 * 预热服务端缓存。
 * 火山 / 海啸 / 浮标三个接口首次访问要真去拉 USGS、tsunami.gov 与 NDBC 的 100 KB 文本，
 * 冷启动常在 3–6 秒。若不预热，页面首次渲染时指标条还是「—」，断言就会偶发失败
 * （同一套代码连跑两次，一次红一次绿，最难排查的那种）。
 */
async function warmup() {
  const paths = ['/api/geo/volcanoes', '/api/geo/tsunami', '/api/ocean/buoys']
  for (const p of paths) {
    try {
      const res = await fetch(`${BASE_URL}${p}`, { cache: 'no-store' })
      const d = await res.json()
      console.log(`  ${d?.ok ? '✅' : '⚠️'} 预热 ${p.padEnd(22)} ${d?.ok ? 'ok' : d?.error || '失败'}`)
    } catch (e) {
      console.log(`  ⚠️ 预热 ${p} 异常：${e.message}`)
    }
  }
}

async function main() {
  console.log(`[earth-smoke] 目标 ${BASE_URL}（/geo + /ocean）`)
  await warmup()
  const chrome = launchChrome()
  let cdp
  let failed = 0
  try {
    cdp = connect(await getWsUrl())
    await cdp.ready()
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
    await cdp.send('Runtime.enable', {}, sessionId)
    await cdp.send('Page.enable', {}, sessionId)

    failed += await runRoute(cdp, sessionId, '/geo', GEO_ASSERTIONS, GEO_INTERACTIONS)
    failed += await runRoute(cdp, sessionId, '/ocean', OCEAN_ASSERTIONS, OCEAN_INTERACTIONS)

    console.log('')
    if (cdp.consoleErrors.length) {
      console.log(`  ❌ console 报错 ${cdp.consoleErrors.length} 条：`)
      for (const e of cdp.consoleErrors.slice(0, 8)) console.log(`     - ${e.slice(0, 170)}`)
      failed += cdp.consoleErrors.length
    } else {
      console.log('  ✅ 无 console error / 未捕获异常')
    }
  } finally {
    if (cdp?.consoleErrors?.length) {
      console.log(`\n[earth-smoke] console 报错 ${cdp.consoleErrors.length} 条：`)
      for (const e of cdp.consoleErrors.slice(0, 10)) console.log(`   - ${e.slice(0, 220)}`)
    }
    cdp?.close()
    chrome.kill()
    // Chrome 退出是异步的：立刻删临时 profile 会撞上 ENOTEMPTY（缓存目录还在写）。
    // 等一下再删，删不掉也不该让整套断言的通过结果变成崩溃。
    await sleep(800)
    try {
      fs.rmSync(profile, { recursive: true, force: true })
    } catch (e) {
      console.log(`[earth-smoke] 临时 profile 清理跳过：${e.code || e.message}`)
    }
  }

  console.log('')
  if (failed) {
    console.log(`[earth-smoke] ❌ 失败 ${failed} 项`)
    process.exit(1)
  }
  console.log('[earth-smoke] ✅ 全部通过')
}

main().catch((e) => {
  console.error(`[earth-smoke] 崩溃：${e.message}`)
  process.exit(1)
})
