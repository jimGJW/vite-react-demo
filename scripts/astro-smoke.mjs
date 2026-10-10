/**
 * AstroBoard 页面专项冒烟（CDP 驱动本机 headless Chrome）。
 *
 * 与 scripts/browser-smoke.mjs 的区别：那个遍历全部路由、只看有没有 console error；
 * 这个只测 /astro 一页，但断言更严——必须抓到真实渲染出来的关键数值。
 * 理由：这个页面数据来自五个外部源，最典型的失败是「接口挂了但页面静默显示空」，
 * 只查 console error 抓不到这种情况，必须断言正文里确实有数字。
 *
 * 前置：dev server 已在 BASE_URL（默认 http://localhost:5173）就绪。
 */

import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const ROUTE = '/astro'
const PORT = Number(process.env.CDP_PORT || 9334)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-cdp-'))

function launchChrome() {
  const child = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank',
  ], { stdio: 'ignore' })
  return child
}

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const j = await res.json()
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl
    } catch (e) {
      if (i === 0 || i % 10 === 0) {
        console.log(`[astro-smoke] 等待 CDP（${i}）: ${e.message}`)
      }
    }
    await sleep(250)
  }
  throw new Error(
    `CDP 未就绪。Chrome 路径 ${CHROME}，端口 ${PORT}。`
    + '若沙箱拦截了子进程，请用 dangerouslyDisableSandbox 重跑，'
    + '或先手动起 Chrome 再设 CDP_PORT 环境变量指向已有实例。',
  )
}

/**
 * 建立 CDP WebSocket 连接。
 *
 * 写法要点：不用「Promise 包住 WebSocket 构造」这种抽象，
 * 而是直接赋 onopen/onmessage 再返回句柄——调试时能立刻看出卡在哪一步
 * （构造失败、open 不触发、还是 onmessage 没回来）。
 */
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
    // 收集页面错误：console.error / 未捕获异常
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      consoleErrors.push(d.exception?.description || d.text || 'unknown exception')
    }
  }
  ws.onerror = (e) => {
    console.log(`[astro-smoke] WebSocket 错误: ${e.message || e.type || 'unknown'}`)
  }

  const api = {
    consoleErrors,
    /** 等连接就绪（内部 8s 超时，避免 onopen 不触发时永久挂起） */
    ready(timeoutMs = 8000) {
      return new Promise((res, rej) => {
        if (opened) return res()
        const t = setTimeout(
          () => rej(new Error(`WebSocket 未在 ${timeoutMs}ms 内就绪（readyState=${ws.readyState}）`)),
          timeoutMs,
        )
        ws.onopen = () => {
          opened = true
          clearTimeout(t)
          res()
        }
      })
    },
    send(method, params = {}, sessionId, timeoutMs = 20000) {
      return new Promise((res, rej) => {
        const msgId = ++id
        const t = setTimeout(() => {
          pending.delete(msgId)
          rej(new Error(`CDP ${method} 超时 ${timeoutMs}ms（sessionId=${sessionId ?? '无'}）`))
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
  return api
}

async function evaluate(cdp, sessionId, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, sessionId)
  if (r.exceptionDetails) {
    throw new Error(`求值失败: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`)
  }
  return r.result.value
}

/**
 * 断言清单：每条都要求「正文里出现真实内容」，而不只是 DOM 结构存在。
 * [名称, 检查表达式, 说明]
 */
const ASSERTIONS = [
  ['页面标题', `document.querySelector('.astro-hero h1')?.textContent || ''`, /深空数据看板/],
  ['指标条已渲染', `document.querySelectorAll('.astro-strip .astro-metric').length`, (v) => v >= 6],
  ['空间站面板', `[...document.querySelectorAll('.astro-panel__title h3')].some(e=>/空间站/.test(e.textContent))`, (v) => v === true],
  ['地图 SVG 已渲染', `!!document.querySelector('svg.astro-map')`, (v) => v === true],
  ['底图陆地已绘制', `document.querySelector('path.astro-land')?.getAttribute('d')?.length || 0`, (v) => v > 500],
  ['晨昏线已绘制', `document.querySelector('path.astro-terminator')?.getAttribute('d')?.length || 0`, (v) => v > 100],
  ['轨迹已绘制', `document.querySelectorAll('path.astro-track').length`, (v) => v >= 1],
  ['在轨目标列表', `document.querySelectorAll('.astro-target').length`, (v) => v >= 4],
  ['中国空间站在列', `[...document.querySelectorAll('.astro-target__name')].some(e=>/天和|问天|梦天/.test(e.textContent))`, (v) => v === true],
  ['经纬度是真实数值', `(() => {
      const t = document.querySelector('.astro-target__pos')?.textContent || ''
      return /\\d+\\.\\d+°[NS]/.test(t)
    })()`, (v) => v === true],
  ['轨道详情网格', `document.querySelectorAll('.astro-detail__grid .astro-metric').length`, (v) => v >= 8],
  ['无失败面板', `document.querySelectorAll('.astro-fail').length`, (v) => v === 0],

  /* ---------- 双主题 ---------- */
  ['根节点带主题属性', `document.querySelector('.astro-board')?.dataset.astroTheme || ''`,
    (v) => v === 'dark' || v === 'light'],
  ['主题切换按钮存在', `[...document.querySelectorAll('.astro-theme-btn')].map(e=>e.textContent.trim()).join('')`,
    (v) => /深空|白昼/.test(String(v))],
  // 关键：CSS 变量必须真的解析出颜色，而不是「变量未定义」导致透明
  ['深色主题背景已生效', `(() => {
      const b = getComputedStyle(document.querySelector('.astro-board'))
      return b.getPropertyValue('--a-bg').trim() + ' | ' + b.backgroundColor
    })()`, (v) => /^#0[0-9a-f]{5}/i.test(String(v).split('|')[0].trim())],
  ['面板使用变量而非硬编码', `(() => {
      const p = document.querySelector('.astro-panel')
      return p ? getComputedStyle(p).borderTopColor : ''
    })()`, (v) => /^rgb/.test(String(v))],
  ['地图海洋色随主题变量', `(() => {
      const r = document.querySelector('.astro-map rect')
      return r ? getComputedStyle(r).fill : ''
    })()`, (v) => /^rgb/.test(String(v))],

  /* ---------- KPI 释义 ---------- */
  ['KPI 问号入口已挂载', `document.querySelectorAll('.astro-kpi-hint').length`, (v) => v >= 5],
  ['问号按钮有 aria 标签', `[...document.querySelectorAll('.astro-kpi-hint')].every(e=>!!e.getAttribute('aria-label'))`,
    (v) => v === true],
  ['G 级对照表已渲染', `document.querySelectorAll('.astro-gscale-cell').length`, (v) => v === 7],
  ['G0 释义含「平静」', `[...document.querySelectorAll('.astro-gscale-cell')].some(e=>/G0/.test(e.textContent)&&/平静/.test(e.textContent))`,
    (v) => v === true],
  ['当前 G 级已高亮', `document.querySelectorAll('.astro-gscale-cell.is-active').length`, (v) => v === 1],

  /* ---------- 中文化 ---------- */
  ['发现方法已中文化', `(() => {
      const t = document.querySelector('.astro-exo-method__name')?.textContent || ''
      return t.includes('凌日法') || t.includes('视向速度法')
    })()`, (v) => v === true],
  ['发现方法保留英文原文', `(() => {
      const t = document.querySelector('.astro-exo-method__en')?.textContent || ''
      return /Transit|Radial|Microlensing|Imaging/.test(t)
    })()`, (v) => v === true],
  ['银河系类型已中文化', `(() => {
      const t = document.querySelector('.astro-galaxy__title')?.textContent || ''
      return t.includes('棒旋星系')
    })()`, (v) => v === true],
  ['名词解释 Tab 存在', `[...document.querySelectorAll('.ant-tabs-tab')].some(e=>/名词解释/.test(e.textContent))`,
    (v) => v === true],
]

/**
 * 交互序列：必须在 ASSERTIONS 之后跑。
 * 这些动作会改变页面状态（切 Tab / 切主题），所以独立成一个阶段，
 * 免得污染前面的静态断言。
 */
const INTERACTIONS = [
  ['切到「名词解释」Tab', `(() => {
      const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(e => /名词解释/.test(e.textContent))
      if (!tab) return 'no-tab'
      tab.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 1200],
  ['词典卡片已渲染', `document.querySelectorAll('.astro-dict-card').length`, (v) => v >= 15, 0],
  ['词典含「所以呢」四段结构', `document.querySelectorAll('.astro-dict-card dt').length >= 0 &&
      [...document.querySelectorAll('.astro-dict-card')].every(c =>
        /是什么/.test(c.textContent) && /怎么读/.test(c.textContent) && /所以呢/.test(c.textContent))`,
    (v) => v === true, 0],
  ['词典含 Bz 分量条目', `[...document.querySelectorAll('.astro-dict-card__name')].some(e=>/Bz/.test(e.textContent))`,
    (v) => v === true, 0],
  ['切到「太阳活动」Tab 看 G 级', `(() => {
      const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(e => /太阳活动/.test(e.textContent))
      if (!tab) return 'no-tab'
      tab.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 1200],
  ['切回「地球附近」Tab', `(() => {
      const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(e => /地球附近/.test(e.textContent))
      if (!tab) return 'no-tab'
      tab.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 1000],

  /* ---------- 太阳系（元素在「太阳系」tab，首屏断言查不到） ---------- */
  ['切到「太阳系」Tab', `(() => {
      const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(e => /太阳系/.test(e.textContent))
      if (!tab) return 'no-tab'
      tab.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 2000],
  ['太阳系视图', `!!document.querySelector('svg.astro-solar')`, (v) => v === true, 0],
  ['行星轨道已绘制', `document.querySelectorAll('path.astro-orbit').length`, (v) => v >= 7, 0],
  ['行星表格有 8 行', `document.querySelectorAll('.astro-pt-row').length`, (v) => v === 8, 0],
  ['行星表格填了地心距离', `[...document.querySelectorAll('.astro-pt-row')].map(r=>r.textContent).join(' ')`,
    (v) => /AU/.test(String(v)), 0],
  ['银河系示意图', `!!document.querySelector('svg.astro-galaxy')`, (v) => v === true, 0],
  // AU→光年 的换算曾被写反（63241 是「光年→AU」而非「AU→光年」），
  // 页面上出现过「1 AU ≈ 63,241 光年」。这里钉住不再复发。
  ['页面无「1 AU ≈ 63241 光年」这类错值', `document.querySelector('main')?.innerText || ''`,
    (v) => !/1\s*AU[^\n]{0,24}6\s*[,，]?\s*324\s*1/.test(String(v)), 0],

  /* ---------- 全天星图（地平投影） ---------- */
  ['切到「今晚星空」Tab', `(() => {
      const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(e => /今晚星空/.test(e.textContent))
      if (!tab) return 'no-tab'
      tab.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 3000],
  ['星图 SVG 已渲染', `!!document.querySelector('.astro-sky__svg')`, (v) => v === true, 0],
  // 默认 magLimit=4.5，只画 4.5 等以上（更暗的星在地平线下或密度过高没有观感），
  // 此刻北京白天且看不到天狼，全天可见的 4.5 等星约 400 余颗，所以阈值取 300。
  ['星图画出了足够亮星（>300 颗）', `document.querySelectorAll('.astro-sky__stars circle').length`,
    (v) => v > 300, 0],
  ['星座连线已渲染', `document.querySelectorAll('.astro-sky__lines path').length`, (v) => v > 20, 0],
  ['地平线与高度圈已渲染', `(() => {
      return document.querySelectorAll('.astro-sky__horizon').length > 0 &&
             document.querySelectorAll('.astro-sky__altcircle').length > 0
    })()`, (v) => v === true, 0],
  ['方位刻度含东南西北', `[...document.querySelectorAll('.astro-sky__azlabel')].map(e=>e.textContent).join('')`,
    (v) => ['北', '东', '南', '西'].every((d) => String(v).includes(d)), 0],
  // 不锁定具体星名：某颗亮星此刻是否在地平线上取决于观测时刻与城市，
  // 断言「带标签的亮星够多」更稳，也更能证明取名链路通了。
  ['亮星带中文名标签（>10 个）', `document.querySelectorAll('.astro-sky__starname').length`,
    (v) => v > 10, 0],
  ['太阳/月亮/行星标记已绘制', `document.querySelectorAll('.astro-sky__marker').length`,
    (v) => v >= 1, 0],
  ['星等滑杆可调', `(() => {
      const r = document.querySelector('.astro-sky-ctrl input[type=range]')
      if (!r) return 'no-slider'
      return Number(r.min) < Number(r.max)
    })()`, (v) => v === true, 0],
  ['梅西耶天体表已渲染', `document.querySelectorAll('.astro-messier__item').length`,
    (v) => v > 50, 0],
  ['梅西耶列表含中文名（不含裸英文）', `[...document.querySelectorAll('.astro-messier__name')]
      .map(e=>e.textContent).join(' ')`,
    (v) => !/\bGalaxy\b|\bNebula\b/.test(String(v)), 0],
  ['星图侧栏显示观测地', `!!document.querySelector('.astro-sky-side .astro-sky-info')`, (v) => v === true, 0],
  // 梅西耶列表只显示「当前地平线以上」的天体（页面设计如此），
  // 所以白天的北京看不到 M31。这里改成断言列表里最亮的那批（星等排序前几名）
  // 类型标注正确——它们一定是星系/星团/星云，不该出现「恒星」这种误标。
  ['梅西耶列表无「恒星」误标', `(() => {
      const names = [...document.querySelectorAll('.astro-messier__name')].map(e => e.textContent)
      if (names.length < 10) return 'too-few'
      // 名称里带「星系/星团/星云」的是具体天体名，后面可能跟类型 Tag；
      // 若类型 Tag 恰为「恒星」就说明踩到了上游误标
      return names.some(n => /恒星/.test(n)) ? 'has-star' : 'clean'
    })()`, (v) => v === 'clean', 0],
  ['按亮度排序可用', `(() => {
      const seg = [...document.querySelectorAll('.ant-segmented-item')]
        .find(e => /亮度/.test(e.textContent))
      if (!seg) return 'no-seg'
      seg.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 1200],
  ['按亮度排序后列表非空', `document.querySelectorAll('.astro-messier__item').length`,
    (v) => v > 5, 0],
  ['星图浅色主题下仍可读', `(() => {
      document.querySelector('.astro-theme-btn')?.click()
      return true
    })()`, (v) => v === true, 1500],
  ['浅色下星点仍有颜色（非纯黑）', `(() => {
      const c = document.querySelector('.astro-sky__stars circle')
      if (!c) return 'no-star'
      const f = c.getAttribute('fill') || ''
      return f && f !== 'black' && f !== '#000'
    })()`, (v) => v === true, 0],
  ['切回深色主题', `(() => {
      document.querySelector('.astro-theme-btn')?.click()
      return true
    })()`, (v) => v === true, 1200],

  /* ---------- 太阳活动增强面板 ---------- */
  ['切到「太阳活动」Tab', `(() => {
      const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(e => /太阳活动/.test(e.textContent))
      if (!tab) return 'no-tab'
      tab.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 2500],
  ['耀斑 KPI 卡片已渲染', `document.querySelectorAll('.astro-flare-kpi').length`, (v) => v >= 3, 0],
  ['耀斑等级带中文标签', `[...document.querySelectorAll('.astro-flare-kpi strong, .astro-flare-item__cls')]
      .map(e=>e.textContent).join(' ')`,
    (v) => /[ABCXMC]/.test(String(v)), 0],
  ['太阳周期图已渲染', `!!document.querySelector('.astro-cycle-chart')`, (v) => v === true, 0],
  ['极光面板已渲染', `!!document.querySelector('.astro-aurora-scale')`, (v) => v === true, 0],
  ['空间天气警报列表容器存在', `document.querySelectorAll('.astro-alert-list').length`,
    (v) => v >= 0, 0],
  ['切回「地球附近」Tab（收尾）', `(() => {
      const tab = [...document.querySelectorAll('.ant-tabs-tab')].find(e => /地球附近/.test(e.textContent))
      if (!tab) return 'no-tab'
      tab.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 800],

  /* ---------- 主题真实切换（点按钮，不是改属性） ---------- */
  ['点击切换到浅色', `(() => {
      const b = document.querySelector('.astro-theme-btn')
      if (!b) return 'no-btn'
      b.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 700],
  ['根节点已切到 light', `document.querySelector('.astro-board')?.dataset.astroTheme`, (v) => v === 'light', 0],
  ['浅色背景变量已换值', `getComputedStyle(document.querySelector('.astro-board')).getPropertyValue('--a-bg').trim()`,
    (v) => /^#e/i.test(String(v)), 0],
  ['浅色下文字与背景对比合理', `(() => {
      // 别用 .astro-panel 取背景：它自己是透明的（背景由 --a-bg 变量在容器上提供），
      // 早期版本就因为拿它当背景色而误报。改成测根容器背景 + 实际有色的文字元素。
      const board = document.querySelector('.astro-board')
      const m = document.querySelector('.astro-metric__val')
      if (!board || !m) return 'missing'
      // --a-bg 是 hex 变量，color 是 rgb()，两者都要能解析
      const bg = getComputedStyle(board).getPropertyValue('--a-bg').trim()
      const fg = getComputedStyle(m).color
      return bg + ' vs ' + fg
    })()`, (v) => {
      const s = String(v)
      if (/missing/.test(s)) return false
      const [bgRaw, fgRaw] = s.split(' vs ')
      /** 任意格式的颜色 → 相对亮度（0–255） */
      const lum = (raw) => {
        let c
        if (raw.startsWith('#')) {
          const h = raw.slice(1)
          const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
          c = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
        } else {
          c = (raw.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
        }
        if (c.length < 3 || c.some(Number.isNaN)) return null
        return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
      }
      const bgL = lum(bgRaw)
      const fgL = lum(fgRaw)
      if (bgL == null || fgL == null) return false
      // 浅色主题：背景亮（>180）、文字深（<120）
      return bgL > 180 && fgL < 120
    }, 0],
  ['浅色已写入 localStorage', `localStorage.getItem('astroboard.theme')`, (v) => v === 'light', 0],
  ['地图在浅色下也重绘为浅色', `(() => {
      const r = document.querySelector('.astro-map rect')
      return r ? getComputedStyle(r).fill : ''
    })()`, (v) => {
      const m = String(v).match(/\d+/g)
      if (!m) return false
      // 浅色地图的 RGB 三通道应当比较接近（浅蓝），而不是深色（接近 0）
      const [r1, g1, b1] = m.map(Number)
      return (r1 + g1 + b1) / 3 > 140
    }, 0],
  ['切回深色', `(() => {
      document.querySelector('.astro-theme-btn')?.click()
      return 'clicked'
    })()`, (v) => v === 'clicked', 700],
  ['根节点已切回 dark', `document.querySelector('.astro-board')?.dataset.astroTheme`, (v) => v === 'dark', 0],
]

async function main() {
  console.log(`[astro-smoke] 目标 ${BASE_URL}${ROUTE}`)
  const chrome = launchChrome()
  let cdp
  let failed = 0

  try {
    cdp = connect(await getWsUrl())
    await cdp.ready()
    console.log(`[astro-smoke] CDP 已连接`)
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
    console.log(`[astro-smoke] 会话已附加`)

    await cdp.send('Runtime.enable', {}, sessionId)
    await cdp.send('Page.enable', {}, sessionId)

    /**
     * 注入登录态。
     *
     * 项目有 RequireAuth 守卫（src/App.jsx），未登录会把 /astro 重定向到 /login，
     * 于是断言全部落空——看起来像「页面挂了」，其实是守卫在工作。
     *
     * 顺序很关键：必须先导航到目标站点再写 localStorage。
     * about:blank 与 localhost:5173 是不同 origin，localStorage 不共享，
     * 在 about:blank 上写完再跳过去，守卫读到的仍是空。
     * 键名来自 src/contexts/AuthContext.js 的 STORAGE_KEY。
     */
    const origin = new URL(BASE_URL).origin
    await cdp.send('Page.navigate', { url: origin }, sessionId)
    await sleep(1500)
    await evaluate(cdp, sessionId, `localStorage.setItem(
      'starfleet.session',
      JSON.stringify({ name: '冒烟测试', loginAt: Date.now() })
    )`).catch((e) => console.log(`[astro-smoke] 注入登录态失败: ${e.message}`))
    console.log(`[astro-smoke] 已在 ${origin} 注入登录态`)

    console.log(`[astro-smoke] 打开页面…`)
    await cdp.send('Page.navigate', { url: `${BASE_URL}${ROUTE}` }, sessionId)

    // 等页面骨架出现（首次冷启动要拉整棵依赖模块树，给足 45s）
    let ready = false
    for (let i = 0; i < 90; i++) {
      await sleep(500)
      const ok = await evaluate(cdp, sessionId,
        `!!document.querySelector('.astro-hero h1')`).catch(() => false)
      if (ok) { ready = true; break }
      // 中途打印实际状态，便于区分「路由没渲染」和「模块还在编译」
      if (i === 3 || i === 10) {
        const st = await evaluate(cdp, sessionId, `JSON.stringify({
          url: location.href,
          main: !!document.querySelector('main[role="main"]'),
          text: document.body.innerText.slice(0, 120),
        })`).catch(() => '求值失败')
        console.log(`[astro-smoke] ${i * 0.5}s 状态: ${st}`)
      }
    }
    if (!ready) {
      const st = await evaluate(cdp, sessionId, `JSON.stringify({
        url: location.href,
        title: document.title,
        main: !!document.querySelector('main[role="main"]'),
        text: document.body.innerText.slice(0, 300),
      })`).catch((e) => `求值失败: ${e.message}`)
      throw new Error(`页面骨架未出现（45s 内）。当前状态: ${st}`)
    }
    console.log(`[astro-smoke] 骨架已出现，等待外部数据源回填…`)

    /**
     * 等数据回填前必须先切到数据所在的 tab。
     *
     * antd 的 Tabs 默认只渲染激活面板的内容（destroyInactiveTabPane 行为类似），
     * 所以停留在默认的「地球附近」tab 时，`.astro-kp__val`（在 solar tab）和
     * `.astro-exo-big__num`（在 deep tab）根本不在 DOM 里——
     * 之前的等待循环一直读到 undefined，还误以为是接口挂了。
     */
    const clickTab = async (labelRe) => {
      const r = await evaluate(cdp, sessionId, `(() => {
        const tab = [...document.querySelectorAll('.ant-tabs-tab')]
          .find(e => ${labelRe}.test(e.textContent))
        if (!tab) return 'no-tab'
        tab.click()
        return 'clicked'
      })()`).catch((e) => `err:${e.message}`)
      const active = await evaluate(cdp, sessionId,
        `document.querySelector('.ant-tabs-tab-active')?.textContent?.trim() || ''`).catch(() => '')
      console.log(`[astro-smoke] 切 tab ${labelRe} → ${r}，当前激活「${active}」`)
      await sleep(900)
    }

    // 再等数据回填（五个外部源，最慢的 TAP 查询可能要 20s+）
    // Kp 指数在「太阳活动」tab，系外行星在「深空」tab，两者都需先激活对应面板
    await clickTab('/太阳活动/')
    let kpVal = null
    for (let i = 0; i < 30; i++) {
      await sleep(1000)
      kpVal = await evaluate(cdp, sessionId,
        `document.querySelector('.astro-kp__val')?.textContent?.trim() || ''`).catch(() => null)
      if (kpVal && kpVal !== '—') break
      process.stdout.write(`\r[astro-smoke] 等待 Kp 指数… kp=${kpVal ?? '-'}   `)
    }
    console.log('')
    if (!kpVal || kpVal === '—') throw new Error('Kp 指数在 30s 内未回填（太阳活动 tab）')

    await clickTab('/深空/')
    let exoVal = null
    for (let i = 0; i < 45; i++) {
      await sleep(1000)
      exoVal = await evaluate(cdp, sessionId,
        `document.querySelector('.astro-exo-big__num')?.textContent?.trim() || ''`).catch(() => null)
      if (exoVal && exoVal !== '—') break
      process.stdout.write(`\r[astro-smoke] 等待系外行星… exo=${exoVal ?? '-'}   `)
    }
    console.log('')
    if (!exoVal || exoVal === '—') throw new Error('系外行星总数在 45s 内未回填（deep tab）')

    const dataReady = { kp: kpVal, exo: exoVal }
    console.log(`[astro-smoke] 数据已回填（kp=${dataReady.kp} / exo=${dataReady.exo}），开始断言…`)

    console.log('')
    for (const [name, expr, check] of ASSERTIONS) {
      const value = await evaluate(cdp, sessionId, expr)
      const pass = typeof check === 'function' ? check(value) : check.test(String(value))
      const shown = typeof value === 'number' ? value : String(value).slice(0, 46)
      console.log(`  ${pass ? '✅' : '❌'} ${name.padEnd(18)} ${shown}`)
      if (!pass) failed++
    }

    /* ---------- 交互阶段：切 Tab / 点主题按钮 ---------- */
    console.log('')
    console.log('[astro-smoke] 交互阶段（切 Tab、真实点击主题按钮）…')
    for (const [name, expr, check, waitMs] of INTERACTIONS) {
      const value = await evaluate(cdp, sessionId, expr)
      if (waitMs) await sleep(waitMs)
      const pass = typeof check === 'function' ? check(value) : check.test(String(value))
      const shown = typeof value === 'number' ? value : String(value).slice(0, 46)
      console.log(`  ${pass ? '✅' : '❌'} ${name.padEnd(22)} ${shown}`)
      if (!pass) failed++
    }

    // console error 检查
    console.log('')
    if (cdp.consoleErrors.length) {
      console.log(`  ❌ console 报错 ${cdp.consoleErrors.length} 条：`)
      for (const e of cdp.consoleErrors.slice(0, 6)) console.log(`     - ${e.slice(0, 170)}`)
      failed += cdp.consoleErrors.length
    } else {
      console.log(`  ✅ 无 console error / 未捕获异常`)
    }

    console.log('')
    const total = ASSERTIONS.length + INTERACTIONS.length + 1
    if (failed) {
      console.log(`[astro-smoke] 失败 ${failed} 项 / 共 ${total} 项`)
      process.exitCode = 1
    } else {
      console.log(`[astro-smoke] 全部通过（${total} 项：静态 ${ASSERTIONS.length} + 交互 ${INTERACTIONS.length} + console）`)
    }
  } finally {
    try { cdp?.close() } catch { /* ignore */ }
    chrome.kill('SIGKILL')
    // Chrome 被 SIGKILL 后仍可能在异步写缓存目录，立刻 rm 会撞 ENOTEMPTY。
    // 等它彻底退出再删，且删不掉也无所谓（临时目录交给系统回收）。
    await sleep(300)
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch { /* ignore */ }
  }
}

main().catch((e) => {
  console.error(`[astro-smoke] 运行失败: ${e.message}`)
  process.exitCode = 1
})
