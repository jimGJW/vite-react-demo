#!/usr/bin/env node
/**
 * 创意 Playground 专项探针（三端真浏览器验证）
 *
 * DEMOS.length 个 demo × 3 端，每次断言：
 *   1) 列表项点得动，且点完标题真的换成了那个 demo（不是「点了没反应」）
 *   2) canvas 真的画出了东西 —— 采样画布像素统计不同颜色数（只判断 canvas 存在是不够的）
 *   3) 参数控件数量与 `src/creative/index.js` 里声明的完全一致（证明三端用的是同一份数据）
 *   4) 动作按钮点得动、暂停/继续/重开都不报错
 *   5) FPS 是正数（说明 rAF 循环真的在跑）
 *   6) 左栏手风琴：分组标题齐全且插在正确的下标上、默认只展开一组、
 *      点卡片头能收起**且收起后组内容真的不占高度**（不然「手风琴」只是换了个皮的平铺列表）
 *   7) 全程零 console error / 零未捕获异常
 *
 * 依赖三端薄壳上那组**跨框架统一的 `data-pg="*"` 选择器**，所以一份选择器跑三端。
 *
 * 用法：
 *   npm run dev:all                       # 另开一个终端
 *   node scripts/playground-probe.mjs     # 可选参数：react | vue | angular
 *
 * 注意：本机若开了代理，fetch 探活 127.0.0.1 会被拦 —— 脚本内部已对 CDP 请求绕过代理。
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMOS, DEMO_GROUPS } from '../src/creative/index.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9353
const SHOT_DIR = '/tmp/shots-playground'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
fs.mkdirSync(SHOT_DIR, { recursive: true })

const only = (process.argv[2] || '').toLowerCase()

/** 下标 → 所属分组序号。手风琴里「收起的那组点不到」，所以点某项前要知道它在哪一组 */
const GROUP_OF = DEMOS.map((_, i) => DEMO_GROUPS.findIndex((g) => i >= g.from && i <= g.to))

/* ==================== CDP 客户端 ==================== */

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
        setTimeout(() => {
          if (pending.has(msgId)) { pending.delete(msgId); reject(new Error(`超时: ${method}`)) }
        }, 60000)
      })
    },
    on(fn) { listeners.push(fn) },
  }
}

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playground-probe-'))
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
  '--window-size=1440,1000',
  `--user-data-dir=${userDataDir}`, `--remote-debugging-port=${DEBUG_PORT}`, '--remote-allow-origins=*',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] })

for (let i = 0; i < 60; i += 1) {
  try { const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`); if (r.ok) break } catch { /* 还没起来 */ }
  await sleep(300)
}
await sleep(800)

const tab = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json()
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true })
  ws.addEventListener('error', rej, { once: true })
})
const cdp = createCdp(ws)

let errors = []
cdp.on((msg) => {
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    errors.push(`[console.error] ${(msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 220)}`)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails || {}
    errors.push(`[EXC] ${(d.exception?.description || d.text || '').slice(0, 260)}`)
  }
})
await cdp.send('Runtime.enable')
await cdp.send('Page.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })

const ev = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  return r?.result?.value
}
const text = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent || ''`)

const clickAt = async (x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', {
      type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1,
    })
  }
}

/**
 * 点某个元素（先取它的中心坐标，发真实鼠标事件；比 el.click() 更接近真人）
 *
 * 必须先 `scrollIntoView` 再量坐标。列表涨到几十项后，滚动左栏会把右栏的工具栏顶出视口，
 * 此时 `getBoundingClientRect()` 给出的是负 y，`dispatchMouseEvent` 打到视口外 ——
 * 表现为「暂停按钮点了没反应」这种极难查的假失败。
 *
 * `behavior: 'instant'` 是必须的：站点全局开了 `scroll-behavior: smooth`，
 * 默认调用会起一段动画，`scrollIntoView` 返回时元素根本还没滚到位，
 * 立刻量坐标量到的是旧位置，点下去就打空（手风琴切换分组时跨度和最大，最容易被命中）。
 */
const clickSel = async (sel) => {
  const box = await ev(`(function(){
    var el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null;
    el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`)
  if (!box || !Number.isFinite(box.x) || !Number.isFinite(box.y)) return false
  await clickAt(box.x, box.y)
  return true
}

/** 量第 i 项的中心视口坐标（顺便把它滚进视口） */
const measureItem = (i) => ev(`(function(){
  var all = document.querySelectorAll(${JSON.stringify(SEL.item)});
  var el = all[${i}];
  if (!el) return null;
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  var r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`)

/** 视口某点命中的 demo id —— 用来确认「这一下真的落在我想要的那个条目上」 */
const hitAt = (x, y) => ev(`(function(){
  var el = document.elementFromPoint(${x}, ${y});
  var it = el && el.closest ? el.closest(${JSON.stringify(SEL.item)}) : null;
  return it ? (it.getAttribute('data-demo-id') || '') : '';
})()`)

/**
 * 点第 i 个 demo 项 —— **先展开它所在的分组，再滚进可视区，最后确认落点**。
 *
 * 左栏是手风琴，收起的分组用 `hidden`（display:none）而不是不渲染 ——
 * 好处是 `[data-pg="demo"]` 始终是全集、顺序也始终等于 DEMOS 下标（结构断言才有意义），
 * 代价是「不可见的那 70 多项」`getBoundingClientRect()` 全给 0，直接点会静默打空。
 *
 * 展开一张卡片会同时做三件事：左栏高度突变、滚动位置被浏览器 clamp、
 * 组内容播 0.18s 的 `pgAccIn` 动画。三者叠加，展开后立刻量到的坐标**可能是上一项的位置**，
 * 表现就是「点第 53 项，标题却变成第 52 项」这种极难查的假失败。
 * 所以这里量完不止点、还要用 `elementFromPoint` 复核落点，不符就等一帧重新量（最多三次）。
 *
 * 另外不能用 `[data-pg="demo"]:nth-of-type(n)` 定位：分组结构里混着 section / button，
 * `nth-of-type` 数出来的下标跟 DEMOS 下标不是一回事，直接按下标取才稳。
 */
const clickItem = async (i) => {
  const want = DEMOS[i].id
  const gi = GROUP_OF[i]
  if (gi >= 0) {
    /* 用 el.click() 而不是 CDP 坐标点击：卡片头可能被滚出视口，
       而展开这个动作本身与坐标无关，没必要先 scrollIntoView 再量半天 */
    const changed = await ev(`(function(){
      var heads = document.querySelectorAll(${JSON.stringify(SEL.group)});
      var h = heads[${gi}];
      if (!h) return 0;
      if (h.getAttribute('data-group-open') !== '1') { h.click(); return 1 }
      return 0;
    })()`)
    await sleep(changed ? 340 : 60)
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const box = await measureItem(i)
    if (!box || !Number.isFinite(box.x) || !Number.isFinite(box.y)) return false
    if (await hitAt(box.x, box.y) !== want) {
      /* 落点不是目标 —— 多半是动画/滚动还没停，等一帧重量 */
      await sleep(200)
      continue
    }
    await clickAt(box.x, box.y)
    return true
  }
  return false
}

/** 采样画布像素：统计量化后的不同颜色数（全底色 = 1） */
const canvasStats = (sel) => `(function(){
  var c = document.querySelector(${JSON.stringify(sel)});
  if (!c || !c.width || !c.height) return null;
  var ctx = c.getContext('2d'); if (!ctx) return null;
  var w = c.width, h = c.height;
  var d;
  try { d = ctx.getImageData(0, 0, w, h).data } catch (e) { return { error: String(e) } }
  var colors = new Set(); var lit = 0; var n = 0;
  /*
   * 采样密度取 200×140。原来按「每 80 列 / 56 行取一个点」大约只有 4700 个样本，
   * 对「细线 + 长曲线」的 demo（洛伦兹吸引子那种 1.15px 描边）会成片漏掉，
   * 出现 colors=1 的假失败。getImageData 的代价与采样点数无关，加密十倍几乎不花时间。
   */
  var sx = Math.max(1, Math.floor(w / 200)), sy = Math.max(1, Math.floor(h / 140));
  /*
   * ⚠️ 逐行错开采样点，不能采样成「笛卡尔积」。
   *
   * 康威生命游戏那种按固定边长画格子的 demo（CELL=7）会和采样步长**拍频**：
   * 某端画布刚好让步长等于格子边长，采样点就永远落在格子之间那 1px 缝里，
   * 于是「满屏格子」被读成「colors=1 纯底色」，报成假失败。
   * 每行把起点平移四分之一圈，采样集就不再与任何固定网格对齐。
   */
  var row = 0;
  for (var y = 0; y < h; y += sy, row += 1) {
    var off = Math.floor((row % 4) * (sx / 4));
    for (var x = off; x < w; x += sx) {
      var i = (y * w + x) * 4;
      colors.add((d[i] >> 3) + ',' + (d[i+1] >> 3) + ',' + (d[i+2] >> 3));
      if (d[i] + d[i+1] + d[i+2] > 40) lit += 1;
      n += 1;
    }
  }
  return { colors: colors.size, lit: lit, n: n, w: w, h: h };
})()`

const shoot = async (name) => {
  try {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(SHOT_DIR, `${name}.png`), Buffer.from(r.data, 'base64'))
  } catch { /* 截图失败不影响断言 */ }
}

/* ==================== 断言框架 ==================== */

let pass = 0
let fail = 0
const check = (label, ok, detail = '') => {
  if (ok) { pass += 1; console.log(`  ✅ ${label}${detail ? ` —— ${detail}` : ''}`) }
  else { fail += 1; console.log(`  ❌ ${label}${detail ? ` —— ${detail}` : ''}`) }
}

/* ==================== 三端 ==================== */

const APPS = [
  { key: 'react', name: 'React 主应用 5173 /playground', home: 'http://localhost:5173/', url: 'http://localhost:5173/playground', needAuth: true },
  { key: 'vue', name: 'Vue 子应用 7101 /playground', url: 'http://localhost:7101/playground' },
  { key: 'angular', name: 'Angular 子应用 7102 /#/playground', url: 'http://localhost:7102/#/playground' },
]

const SEL = {
  item: '[data-pg="demo"]',
  group: '[data-pg="group"]',
  groupOpen: '[data-pg="group"][data-group-open="1"]',
  title: '[data-pg="title"]',
  canvas: '[data-pg="canvas"]',
  fps: '[data-pg="fps"]',
  ptr: '[data-pg="ptr"]',
  pause: '[data-pg="pause"]',
  restart: '[data-pg="restart"]',
  param: '[data-pg="param"]',
  act: '[data-pg="act"]',
  paused: '.pg-paused',
  /* 手风琴组内容容器。三端类名一致（Vue 的 scoped / Angular 的 emulated 都不改类名） */
  groupItems: '.pg-acc__items',
}

const itemMeta = `Array.from(document.querySelectorAll('${SEL.item}')).map(function(el){
  return { id: el.getAttribute('data-demo-id') || '', title: (el.querySelector('b')||{}).textContent || '' };
})`

for (const app of APPS) {
  if (only && !app.name.toLowerCase().includes(only)) continue

  console.log(`\n########## ${app.name} ##########`)
  errors = []

  if (app.needAuth) {
    await cdp.send('Page.navigate', { url: app.home })
    await sleep(1600)
    await ev(`localStorage.setItem('starfleet.session', JSON.stringify({ name:'probe', loginAt: Date.now() }))`)
  }
  await cdp.send('Page.navigate', { url: app.url })
  await sleep(6500)

  /* ---------- 列表渲染 ---------- */
  const items = await ev(itemMeta)
  const nItems = items?.length ?? 0
  check('demo 列表渲染完整（数量 == demos.js 的 DEMOS.length）', nItems === DEMOS.length,
    `${nItems} 项 / 期望 ${DEMOS.length} 项`)
  if (nItems < DEMOS.length) {
    console.log(`  ⚠️ 列表不完整，跳过逐项断言。当前 console error：${errors.length ? errors[0] : '无'}`)
    continue
  }

  const idsOk = items.every((it, i) => it.id === DEMOS[i].id)
  check('列表项顺序与 data-demo-id 和 demos.js 完全一致', idsOk,
    idsOk ? items.map((i) => i.id).join(' ') : `页面 ${items.map((i) => i.id).join(',')}`)

  /* ---------- 左栏手风琴（三端同一套结构） ---------- */
  {
    const wantLabels = DEMO_GROUPS.map((g) => g.label)
    const groups = await ev(`Array.from(document.querySelectorAll('${SEL.group}')).map(function(el){
      return el.getAttribute('data-group-label') || '';
    })`)
    check('左栏渲染了全部分组标题且顺序一致',
      Array.isArray(groups) && groups.join('|') === wantLabels.join('|'),
      (groups || []).join(' / '))

    /*
     * 分组标题必须紧跟在该组第一项之前 —— 分组表是按下标写的，错一位就整组贴错。
     * 注意要按**文档顺序**遍历这两种节点，不能只看 `.pg-list` 的直接子元素：
     * 手风琴结构是 section.pg-acc > (button[group] + div > button[demo]…)，
     * `[data-pg]` 已经不是同级兄弟了。
     */
    const segOk = await ev(`(function(){
      var list = document.querySelector('.pg-list');
      if (!list) return 'no .pg-list';
      var nodes = list.querySelectorAll('[data-pg="group"],[data-pg="demo"]');
      var want = ${JSON.stringify(DEMO_GROUPS.map((g) => ({ label: g.label, at: g.from })))};
      var seen = [];
      var demoIdx = -1;
      for (var i = 0; i < nodes.length; i += 1) {
        var el = nodes[i];
        if (el.getAttribute('data-pg') === 'demo') demoIdx += 1;
        else seen.push({ label: el.getAttribute('data-group-label'), at: demoIdx + 1 });
      }
      return JSON.stringify(seen) === JSON.stringify(want) ? '' : JSON.stringify(seen) + ' vs ' + JSON.stringify(want);
    })()`)
    check('分组标题插在了正确的下标上', segOk === '', segOk || '')

    /* 默认只展开一组 —— 这条要是破了，左栏就退回成「一条无限下滑的长列表」 */
    const openNow = await ev(`document.querySelectorAll('${SEL.groupOpen}').length`)
    check('手风琴默认只展开一个分组', openNow === 1, `展开 ${openNow} 个 / 共 ${DEMO_GROUPS.length} 组`)

    /*
     * 点卡片头收起，并且**收起后组内容真的不占高度**。
     * 只断言 data-group-open 变了是不够的 —— 那只证明「状态改了」，
     * 证明不了高度收掉了（比如 CSS 忘了写 [hidden]{display:none} 就会这样）。
     */
    await clickSel(SEL.groupOpen)
    await sleep(240)
    const collapsed = await ev(`(function(){
      var open = document.querySelectorAll('${SEL.groupOpen}').length;
      var first = document.querySelector('${SEL.item}');
      var h = first ? Math.round(first.getBoundingClientRect().height) : -1;
      var boxes = document.querySelectorAll('${SEL.groupItems}');
      var bh = 0;
      for (var i = 0; i < boxes.length; i += 1) bh = Math.max(bh, Math.round(boxes[i].getBoundingClientRect().height));
      return { open: open, itemH: h, boxH: bh };
    })()`)
    check('点卡片头可收起，且收起后组内容不占高度',
      !!collapsed && collapsed.open === 0 && collapsed.itemH === 0 && collapsed.boxH === 0,
      collapsed ? `展开 ${collapsed.open} 个 · 组内首项高 ${collapsed.itemH}px · 内容盒最高 ${collapsed.boxH}px` : '取不到状态')

    /* 再点一次要能重新展开（不然用户点开一次就再也点不出来了） */
    await clickSel(SEL.group)
    await sleep(240)
    const reopened = await ev(`(function(){
      var open = document.querySelectorAll('${SEL.groupOpen}').length;
      var first = document.querySelector('${SEL.item}');
      return { open: open, itemH: first ? Math.round(first.getBoundingClientRect().height) : -1 };
    })()`)
    check('再点一次重新展开且内容恢复可见',
      !!reopened && reopened.open === 1 && reopened.itemH > 0,
      reopened ? `展开 ${reopened.open} 个 · 组内首项高 ${reopened.itemH}px` : '取不到状态')
  }

  /* ---------- 逐个 demo 点开 ---------- */
  let titleOk = 0
  let canvasOk = 0
  let paramOk = 0
  const titleBad = []
  const canvasBad = []
  const paramBad = []

  for (let i = 0; i < DEMOS.length; i += 1) {
    const demo = DEMOS[i]
    const clicked = await clickItem(i)
    if (!clicked) {
      titleBad.push(`${demo.id}:列表项点不到`)
      continue
    }
    await sleep(220)

    const shown = (await text(SEL.title)).trim()
    if (shown === demo.title) titleOk += 1
    else titleBad.push(`${demo.id}→「${shown}」`)

    /* 在画布上点一下：水波、生命游戏、万花筒、布料都靠指针才有内容 */
    const box = await ev(`(function(){
      var c = document.querySelector('${SEL.canvas}');
      if (!c) return null;
      var r = c.getBoundingClientRect();
      return { x: r.left + r.width * 0.45, y: r.top + r.height * 0.5 };
    })()`)
    if (box) await clickAt(box.x, box.y)
    await sleep(1500)

    /*
     * 判据是「画布不止一种颜色」而不是「颜色数 ≥ 3」。
     * 底色永远只有一种，所以 colors === 1 ⟺ 这一帧什么都没画出来；
     * 而 ≥ 3 会误伤「细线 + 稀疏采样」的 demo —— L 系统按生长速度逐帧只画新增段，
     * 1.5s 时可能才画了不到十分之一，采样点很容易一个都没落到线上（colors 会是 2）。
     */
    const stats = await ev(canvasStats(SEL.canvas))
    if (stats && !stats.error && stats.colors >= 2 && stats.lit > 0) canvasOk += 1
    else canvasBad.push(`${demo.id}:${stats ? (stats.error || `colors=${stats.colors} lit=${stats.lit}`) : 'no-canvas'}`)

    /* 参数控件数量必须与 demos.js 声明一致 —— 三端用的是同一份数据，数量对不上就是没接上 */
    const paramCount = await ev(`document.querySelectorAll('${SEL.param}').length`)
    if (paramCount === demo.params.length) paramOk += 1
    else paramBad.push(`${demo.id}:期望 ${demo.params.length} 实际 ${paramCount}`)
  }

  check(`${DEMOS.length} 个 demo 点开都切到了对应标题`, titleOk === DEMOS.length, `${titleOk}/${DEMOS.length}${titleBad.length ? ` · ${titleBad.join(' | ')}` : ''}`)
  check(`${DEMOS.length} 个 demo 的画布都真的画出了东西`, canvasOk === DEMOS.length, canvasBad.length ? `缺像素：${canvasBad.join(' | ')}` : '全部不止一种颜色')
  check(`${DEMOS.length} 个 demo 的参数控件数量都与 demos.js 一致`, paramOk === DEMOS.length, `${paramOk}/${DEMOS.length}${paramBad.length ? ` · ${paramBad.join(' | ')}` : ''}`)

  /* ---------- FPS 真的在数 ---------- */
  const fpsText = (await text(SEL.fps)).trim()
  check('FPS 是正数（rAF 循环在跑）', Number(fpsText) > 0, `FPS=${fpsText}`)

  /* ---------- 暂停 / 继续 / 重开 ---------- */
  await clickSel(SEL.pause)
  await sleep(260)
  check('点「暂停」出现已暂停徽标', await ev(`!!document.querySelector('${SEL.paused}')`))
  await clickSel(SEL.pause)
  await sleep(260)
  check('点「继续」徽标消失', !(await ev(`!!document.querySelector('${SEL.paused}')`)))

  await clickSel(SEL.restart)
  await sleep(700)
  const afterRestart = await ev(canvasStats(SEL.canvas))
  check('点「重开」后画布仍有输出', !!afterRestart && !afterRestart.error && afterRestart.colors >= 1, `colors=${afterRestart?.colors}`)

  /* ---------- 动作按钮：断言「点了之后没有新增异常」，而不是恒真 ---------- */
  const actCount = await ev(`document.querySelectorAll('${SEL.act}').length`)
  const actLabels = DEMOS[DEMOS.length - 1].actions.map((a) => a.label).join('/')
  if (actCount > 0) {
    const before = errors.length
    await clickSel(SEL.act)
    await sleep(500)
    check('动作按钮点得动且不抛错', errors.length === before,
      `${actCount} 个（${actLabels}）${errors.length > before ? ` · ${errors.slice(before).join(' ; ')}` : ''}`)
  } else {
    check('动作按钮点得动且不抛错', true, '该 demo 未声明动作按钮')
  }

  /* ---------- 拖拽：布料/水波这类需要 pointer capture 的场景 ---------- */
  const dragBox = await ev(`(function(){
    var c = document.querySelector('${SEL.canvas}');
    if (!c) return null;
    var r = c.getBoundingClientRect();
    return { x1: r.left + r.width * 0.3, y1: r.top + r.height * 0.5, x2: r.left + r.width * 0.7, y2: r.top + r.height * 0.62 };
  })()`)
  if (dragBox) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(dragBox.x1), y: Math.round(dragBox.y1), button: 'left', clickCount: 1 })
    for (let s = 1; s <= 6; s += 1) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: Math.round(dragBox.x1 + (dragBox.x2 - dragBox.x1) * (s / 6)),
        y: Math.round(dragBox.y1 + (dragBox.y2 - dragBox.y1) * (s / 6)),
        button: 'left',
      })
      await sleep(40)
    }
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(dragBox.x2), y: Math.round(dragBox.y2), button: 'left', clickCount: 1 })
    await sleep(400)
    const ptr = (await text(SEL.ptr)).trim()
    check('画布上拖拽后指针坐标回显', /\d/.test(ptr), `指针=${ptr}`)
  }

  await shoot(`${app.key}-playground`)

  /* ---------- 零 console error ---------- */
  check('全程零 console error / 零未捕获异常', errors.length === 0,
    errors.length ? errors.slice(0, 3).join(' ;; ') : '')

  /* 收尾：把开发期噪音（HMR 之类）单独列出，不影响判定 */
  if (errors.length) console.log(`  ℹ️ 全部错误（${errors.length}）：\n    ${errors.join('\n    ')}`)
}

console.log(`\n================ 结果：${pass} 通过 / ${fail} 失败 ================`)
console.log(`截图目录：${SHOT_DIR}`)

chrome.kill('SIGKILL')
try { fs.rmSync(userDataDir, { recursive: true, force: true }) } catch { /* 忽略 */ }
process.exit(fail ? 1 : 0)
