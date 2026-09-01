/* =====================================================================
 * agentEngine.js · UniversalPageAgent 的框架无关内核
 *
 * 纯 JS（不依赖 React / Vue）：
 *   - 自然语言指令解析（NLP_RULES / parseNaturalLanguage）
 *   - 页面操作执行引擎（SimplePageAgent）
 *   - 直接模式 DOM 桥接（createDirectBridge）
 *
 * Vue / React 层只需负责：响应式状态、模板、语音 hook、iframe 通信。
 * ===================================================================== */

export const AGENT_PROTOCOL = 'universal-page-agent-v1'

// 提取目标文本并清理首尾引号
export const cleanTarget = (s) =>
  (s || '').trim().replace(/^[「『"'“”]+|[」』"'“”]+$/g, '')

// 语音识别文本归一化：繁体→简体 + whisper-tiny 常见误识别修正
const VOICE_TEXT_MAP = {
  電機: '点击', 電擊: '点击', 點擊: '点击', 按鈕: '按钮', 滾動: '滚动',
  首頁: '首页', 主頁: '首页', 跳轉: '跳转', 登錄: '登录', 註冊: '注册',
  發送: '发送', 填寫: '填写', 選擇: '选择', 勾選: '勾选', 下一頁: '下一页',
  上一頁: '上一页', 頁面: '页面', 網頁: '网页', 鏈接: '链接', 圖標: '图标',
  菜單: '菜单', 選項: '选项', 設置: '设置', 確認: '确认', 關閉: '关闭',
  開啟: '开启', 刪除: '删除', 編輯: '编辑', 下載: '下载', 上傳: '上传',
  圖片: '图片', 視頻: '视频', 郵箱: '邮箱', 賬號: '账号', 密碼: '密码',
  // whisper-tiny 对 TTS/短指令的高频音近误识别
  天使也表: '填写表', 表彈: '表单', 表弹: '表单', 表單: '表单',
  向下滾動: '向下滚动', 電機按鈕: '点击按钮',
  點: '点', 擊: '击', 鈕: '钮', 滾: '滚', 動: '动', 頁: '页',
  開: '开', 關: '关', 錄: '录', 寫: '写', 選: '选', 擇: '择',
  確: '确', 認: '认', 輸: '输', 檢: '检', 瀏: '浏', 覽: '览',
  網: '网', 標: '标', 籤: '签', 圖: '图', 單: '单', 項: '项',
  設: '设', 編: '编', 輯: '辑', 刪: '删', 視: '视', 欄: '栏',
  鏈: '链', 檔: '档', 資: '资', 訊: '讯', 畫: '画', 傳: '传',
  統: '统', 價: '价', 訂: '订', 會: '会', 員: '员', 帳: '账',
  號: '号', 驗: '验', 證: '证', 碼: '码', 尋: '寻', 結: '结',
  機: '机', 電: '电', 腦: '脑', 顯: '显', 務: '务', 總: '总',
  經: '经', 級: '级', 別: '别', 類: '类', 體: '体', 處: '处',
  組: '组', 織: '织', 團: '团', 隊: '队', 專: '专', 業: '业',
  區: '区', 塊: '块', 態: '态', 聲: '声', 話: '话', 語: '语',
  詞: '词', 彙: '汇', 報: '报', 準: '准', 規: '规', 範: '范',
  圍: '围', 內: '内', 數: '数', 據: '据', 庫: '库', 記: '记',
  器: '器',
}
export function normalizeVoiceText(text) {
  if (!text) return text
  let t = String(text)
  for (const [from, to] of Object.entries(VOICE_TEXT_MAP)) {
    if (from.length > 1) t = t.split(from).join(to)
  }
  let out = ''
  for (const ch of t) out += VOICE_TEXT_MAP[ch] || ch
  return out
}

// 解析点击目标：剥离末尾"2次"等次数标记与"按钮/链接"等元素后缀
export function parseClickTarget(raw) {
  let s = cleanTarget(raw)
  let count = 1
  const cm = s.match(/(\d+)\s*次?$/)
  if (cm) {
    count = parseInt(cm[1]) || 1
    s = s.slice(0, cm.index).trim()
  }
  const suf = /(?:按钮|按键|链接|图片|图标|标签|选项|菜单)$/.exec(s)
  if (suf && suf[0].length < s.length) s = s.slice(0, -suf[0].length).trim()
  return { target: s, count }
}

// 解析表单字段："姓名张三，电话138" / "姓名:张三,邮箱=a@b.com" → [{name,value} | {raw}]
export function parseFormFields(raw) {
  if (!raw) return []
  return String(raw)
    .split(/[，,；;、]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => {
      const kv = seg.match(/^(.+?)[=:：]\s*(.+)$/)
      if (kv) return { name: kv[1].trim(), value: kv[2].trim() }
      return { raw: seg }
    })
}

// 注意：规则顺序即匹配优先级，点击/输入/滚动等高频指令放在前面
export const NLP_RULES = [
  // —— 导航跳转（URL / 站内路由 / 页面内链接）——
  { pattern: /(?:跳转到|跳到|跳转至|前往|进入|打开|导航到|去|go to|navigate to|open)\s*[「「『"]?(.+?)[」」』"]?$/i, type: 'navigate', extract: (m) => cleanTarget(m[1]) },

  // —— 悬停（置于点击前，避免"按"字误抢）——
  { pattern: /(?:悬停|鼠标移到|hover)\s*(?:在|到|于)?\s*[「『"]?(.+)[」』"]?/i, type: 'hover', extract: (m) => cleanTarget(m[1]) },

  // —— 按键（回车 / 退出，置于点击前避免"按下"被点击规则抢走）——
  { pattern: /(?:按下|按一下|press)\s*(?:回车键|回车|Enter|确认|确定|OK|ok)/i, type: 'press', extract: () => ({ key: 'Enter' }) },
  { pattern: /(?:按下|按一下|press)\s*(?:Esc|Escape|退出键|退出)/i, type: 'press', extract: () => ({ key: 'Escape' }) },

  // —— 点击（先匹配"双击"，再匹配普通点击）——
  { pattern: /(?:双击|double click|dblclick)\s*[「『"]?(.+)[」』"]?(?:按钮|链接|图片|图标|标签|选项)?/i, type: 'click', extract: (m) => ({ ...parseClickTarget(m[1]), count: 2 }) },

  { pattern: /(?:点击|单击|按下|按一下|点一下|点选|按|press|click|tap)\s*[「『"]?(.+)[」』"]?(?:按钮|按键|链接|图片|图标|标签|选项|菜单)?(?:\s*(\d+)\s*次?)?/i, type: 'click', extract: (m) => parseClickTarget(m[1]) },

  // —— 表单（批量填写 / 提交 / 清空 / 检测，置于输入规则前避免"填写"被 type 抢走）——
  { pattern: /(?:填写|填一下|帮我填|自动填|填好|fill)\s*(?:一下|好)?\s*(?:这个|那个)?\s*(?:表单|表格|form)(?:\s*[:：]\s*(.+))?$/i, type: 'form-fill', extract: (m) => ({ fields: parseFormFields(m[1]) }) },

  { pattern: /(?:提交|递交|submit)\s*(?:一下)?\s*(?:这个)?\s*(?:表单|表格)?$/i, type: 'form-submit' },

  { pattern: /(?:清空|清除|重置|reset|clear)\s*(?:这个)?\s*(?:表单|表格)/i, type: 'form-clear' },

  { pattern: /(?:检测|看看|查看|检查)\s*(?:一下)?\s*(?:这个)?\s*(?:表单|表格)\s*(?:字段|有哪些)?/i, type: 'form-detect' },

  // —— 输入（两种语序）——
  { pattern: /(?:在|向|往|对)\s*[「『"]?(.+)[」』"]?\s*(?:里|中|内|框|输入框)?\s*(?:输入|填写|填入|键入|type|input)\s*[「『"]?(.+?)[」』"]?$/i, type: 'type', extract: (m) => ({ target: cleanTarget(m[1]), value: cleanTarget(m[2]) }) },
  { pattern: /(?:输入|填写|填入|键入|type|input)\s*[「『"]?(.+)[」』"]?\s*(?:到|至|在|于)\s*[「『"]?(.+?)[」』"]?$/i, type: 'type', extract: (m) => ({ value: cleanTarget(m[1]), target: cleanTarget(m[2]) }) },
  { pattern: /(?:输入|填写|填入|键入|type|input)\s*[「『"]?(.+)[」』"]?$/i, type: 'type', extract: (m) => ({ value: cleanTarget(m[1]), target: '' }) },

  // —— 搜索（自动定位搜索框并回车）——
  { pattern: /(?:搜索|查找|查询|搜一下|search)\s*[「『"]?(.+)[」』"]?\s*(?:并|然后)?\s*(?:点击|按|按下)?\s*(?:搜索|查询|search)?\s*(?:按钮)?/i, type: 'search', extract: (m) => ({ value: cleanTarget(m[1]) }) },

  // —— 后退 / 前进（置于滚动前，避免"上一页"被滚动规则抢走）——
  { pattern: /(?:返回|后退|back)\s*(?:上一页|上一步)?/i, type: 'back' },
  { pattern: /(?:前进|forward)/i, type: 'forward' },

  // —— 滚动（顶部/底部/向下/向上/翻页）——
  { pattern: /(?:滚动|滑动|滑|滚|scroll)\s*(?:到)?\s*(?:页面)?\s*(?:顶部|最上方|最上面|顶端|起点|top|beginning)/i, type: 'scroll', extract: () => ({ direction: 'top' }) },
  { pattern: /(?:滚动|滑动|滑|滚|scroll)\s*(?:到)?\s*(?:页面)?\s*(?:底部|最下方|最下面|底端|终点|bottom|end)/i, type: 'scroll', extract: () => ({ direction: 'bottom' }) },
  { pattern: /(?:向下|往下|下滚|往下滑|滚下去|下一页|往后|scroll down|page down)/i, type: 'scroll', extract: () => ({ direction: 'down' }) },
  { pattern: /(?:向上|往上|上滚|往上滑|滚上去|上一页|往前|scroll up|page up)/i, type: 'scroll', extract: () => ({ direction: 'up' }) },

  // —— 分析 / 查找 ——
  { pattern: /(?:分析|检查|解析|describe|analyze|inspect)\s*(?:页面|当前|一下)?/i, type: 'analyze' },
  { pattern: /(?:查找|找一下|搜索|find|search)\s*(?:页面上的|页面上|页面中)?\s*(.+)/i, type: 'find', extract: (m) => m[1].trim() },

  // —— 选择 / 勾选 ——
  { pattern: /(?:选择|选一下|select)\s*[「『"]?(.+)[」』"]?\s*(?:选项|option)?$/i, type: 'select', extract: (m) => cleanTarget(m[1]) },
  { pattern: /(?:勾选|选中|勾上|勾一下|check|toggle)\s*[「『"]?(.+)[」』"]?\s*(?:复选框|checkbox)?$/i, type: 'check', extract: (m) => cleanTarget(m[1]) },

  // —— 刷新 ——
  { pattern: /(?:刷新|重载|重新加载|reload|refresh)/i, type: 'reload' },

  // —— 等待 ——
  { pattern: /(?:等待|等|wait)\s*(\d+)\s*(?:毫秒|ms|秒|s)?/i, type: 'wait', extract: (m) => ({ ms: parseInt(m[1]) * (m[0].includes('秒') || m[0].includes('s') ? 1000 : 1) }) },
]

export function parseNaturalLanguage(text) {
  for (const rule of NLP_RULES) {
    const m = text.match(rule.pattern)
    if (m) {
      const action = { type: rule.type }
      if (rule.extract) {
        const extra = rule.extract(m)
        if (typeof extra === 'object') Object.assign(action, extra)
        else action.target = extra
      }
      return action
    }
  }
  return { type: 'unknown', raw: text }
}

export class SimplePageAgent {
  constructor(config) {
    this.config = config
  }

  parseToActions(task) {
    // 表单批量填写指令内部含逗号分隔字段，必须整体解析（不能按逗号拆成多段）
    if (/(?:填写|填一下|帮我填|自动填|填好|fill)\s*(?:一下|好)?\s*(?:这个|那个)?\s*(?:表单|表格|form)/i.test(task)) {
      return [parseNaturalLanguage(task)]
    }
    const parts = task.split(/[，,。；;\n]+/).map((s) => s.trim()).filter(Boolean)
    return parts.map(parseNaturalLanguage)
  }

  async execute(task, bridge) {
    const actions = this.parseToActions(task)
    const results = []

    for (const action of actions) {
      let result
      switch (action.type) {
        case 'navigate': result = await bridge.navigate(action.target); break
        case 'click': result = await bridge.findAndClick(action.target, action.count || 1); break
        case 'type': result = await bridge.findAndType(action.target, action.value); break
        case 'search': result = await bridge.search(action.value); break
        case 'scroll': result = await bridge.scroll(action.direction); break
        case 'analyze': result = await bridge.analyze(); break
        case 'find': result = await bridge.findElements(action.target); break
        case 'hover': result = await bridge.findAndHover(action.target); break
        case 'select': result = await bridge.select(action.target); break
        case 'check': result = await bridge.check(action.target); break
        case 'press': result = await bridge.press(action.key); break
        case 'form-fill': result = await bridge.fillForm(action.fields || []); break
        case 'form-submit': result = await bridge.submitForm(); break
        case 'form-clear': result = await bridge.clearForm(); break
        case 'form-detect': result = await bridge.detectForm(); break
        case 'wait': result = await bridge.wait(action.ms); break
        case 'reload': result = await bridge.reload(); break
        case 'back': result = await bridge.goBack(); break
        case 'forward': result = await bridge.goForward(); break
        case 'unknown': result = { ok: false, error: `无法理解指令「${action.raw || ''}」，试试「点击XX」「输入XX」「跳转到XX」` }; break
        default: result = { ok: false, error: `未知动作: ${action.type}` }
      }
      results.push({ action, result })
    }

    return { actions, results }
  }
}

/* ===================== 直接模式 DOM 桥接 ===================== */
export function createDirectBridge(router) {
  const nextId = { current: 1 }
  const elementMap = new Map()

  function isVisible(el) {
    if (!el) return false
    if (el.disabled) return false
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return false
    return true
  }

  function findFirstVisibleInput() {
    const selectors = ['input[type=search]', 'input[type=text]', 'input:not([type])', 'input[type=url]', 'input[type=email]', 'input[type=tel]', 'input[type=number]', 'textarea', 'input[type=password]']
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel)
      for (const el of els) {
        const type = (el.getAttribute('type') || 'text').toLowerCase()
        if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset' || type === 'file') continue
        if (isVisible(el)) return el
      }
    }
    return null
  }

  function findElementsByText(text, types) {
    const selectors = types || ['button', 'a', 'input', 'textarea', 'select', '[role=button]', '[role=link]', 'h1', 'h2', 'h3', 'h4', 'label']
    const results = []
    const seen = new Set()
    const keyword = (text || '').trim().toLowerCase()
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel)
      for (const el of els) {
        const textContent = (el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim()
        if (keyword === '') {
          if (!isVisible(el) || !['input', 'textarea', 'select'].includes(el.tagName.toLowerCase())) continue
        } else if (!textContent.toLowerCase().includes(keyword)) {
          continue
        }
        if (!seen.has(el)) {
          seen.add(el)
          const elId = 'agent-el-' + nextId.current++
          el.setAttribute('data-agent-id', elId)
          elementMap.set(elId, el)
          const rect = el.getBoundingClientRect()
          results.push({ elementId: elId, tag: el.tagName.toLowerCase(), text: textContent.substring(0, 80), type: el.type || '', top: rect.top, left: rect.left, width: rect.width, height: rect.height })
        }
      }
    }
    return results
  }

  function highlightElement(el) {
    if (!el) return
    const orig = { outline: el.style.outline, backgroundColor: el.style.backgroundColor, transition: el.style.transition }
    el.style.outline = '2px solid #667eea'
    el.style.backgroundColor = 'rgba(102,126,234,0.15)'
    setTimeout(() => {
      el.style.outline = orig.outline
      el.style.backgroundColor = orig.backgroundColor
    }, 800)
  }
  function fireClick(el) {
    el.focus()
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
    el.click()
  }
  function dispatchKey(el, key) {
    el.focus()
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    el.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true, cancelable: true }))
    el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }))
  }

  // ============ 表单填写辅助 ============
  function getFormInputs(scope) {
    const els = [...scope.querySelectorAll('input, textarea, select')].filter(isVisible)
    return els.filter((el) => {
      const t = (el.getAttribute('type') || 'text').toLowerCase()
      return !['hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(t)
    })
  }
  function fieldNames(el) {
    const names = new Set()
    if (el.id) {
      document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach((l) => {
        const t = (l.textContent || '').trim()
        if (t) names.add(t.replace(/[：:*]+$/, ''))
      })
    }
    const wrapLabel = el.closest('label')
    if (wrapLabel) {
      const t = (wrapLabel.textContent || '').trim()
      if (t) names.add(t.replace(/[：:*]+$/, ''))
    }
    if (el.placeholder) names.add(el.placeholder.trim())
    if (el.getAttribute('aria-label')) names.add(el.getAttribute('aria-label').trim())
    if (el.name) names.add(el.name)
    if (el.id) names.add(el.id)
    return [...names].filter(Boolean)
  }
  function matchFieldName(input, keyword) {
    if (!keyword) return false
    const norm = (s) => s.toLowerCase().replace(/[：:*\s]/g, '')
    const kw = norm(String(keyword))
    if (!kw) return false
    for (const n of fieldNames(input)) {
      const nn = norm(n)
      if (!nn) continue
      if (nn === kw || nn.includes(kw) || kw.includes(nn)) return true
    }
    return false
  }
  function setFieldValue(el, value) {
    if (el.tagName === 'SELECT') {
      const hit = [...el.options].find((o) => o.text.trim() === String(value).trim() || o.value === String(value).trim())
      if (!hit) throw new Error(`下拉框没有选项「${value}」`)
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set
      if (setter) setter.call(el, hit.value)
      else el.value = hit.value
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }
    if (el.type === 'checkbox' || el.type === 'radio') {
      const want = /^(true|1|是|勾选|选中|打勾|yes|on)$/i.test(String(value).trim())
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set
      if (setter) setter.call(el, want)
      else el.checked = want
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (nativeSetter) nativeSetter.call(el, String(value))
    else el.value = String(value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
  function pickBestForm() {
    const forms = [...document.querySelectorAll('form')]
    if (!forms.length) return document
    let best = null
    let bestScore = -1
    for (const f of forms) {
      const r = f.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      const score = getFormInputs(f).length
      if (score > bestScore) {
        bestScore = score
        best = f
      }
    }
    return bestScore > 0 ? best : document
  }
  function splitRawByFieldName(inputs, raw) {
    const s = String(raw).trim()
    if (!s) return null
    let best = null
    for (const el of inputs) {
      for (const n of fieldNames(el)) {
        const nn = n.replace(/[：:*\s]/g, '')
        if (!nn) continue
        if (s.startsWith(nn) && s.length > nn.length) {
          const rest = s.slice(nn.length).trim()
          if (!best || nn.length > best.name.length) best = { name: nn, value: rest, el }
        }
      }
    }
    return best
  }

  return {
    findAndClick: async (target, count = 1) => {
      const found = findElementsByText(target)
      if (!found.length) return { ok: false, error: `未找到「${target}」` }
      const el = elementMap.get(found[0].elementId)
      if (!el) return { ok: false, error: '元素已不在DOM中' }
      highlightElement(el)
      for (let i = 0; i < count; i++) {
        fireClick(el)
        if (i < count - 1) await new Promise((r) => setTimeout(r, 150))
      }
      return { ok: true, data: { clicked: el.tagName.toLowerCase(), count } }
    },
    findAndType: async (target, value) => {
      let found
      if (target) {
        found = findElementsByText(target, ['input', 'textarea', 'select'])
        if (!found.length) {
          const byPlaceholder = findElementsByText(target, ['input', 'textarea'])
          if (byPlaceholder.length) found = byPlaceholder
        }
      } else {
        const el = findFirstVisibleInput()
        if (el) {
          const elId = 'agent-el-' + nextId.current++
          el.setAttribute('data-agent-id', elId)
          elementMap.set(elId, el)
          found = [{ elementId: elId, tag: el.tagName.toLowerCase() }]
        }
      }
      if (!found?.length) return { ok: false, error: `未找到输入框${target ? `「${target}」` : ''}` }
      const el = elementMap.get(found[0].elementId)
      if (!el) return { ok: false, error: '元素已不在DOM中' }
      highlightElement(el)
      el.focus()
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      if (nativeSetter) nativeSetter.call(el, value)
      else el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return { ok: true, data: { typed: value, into: el.tagName.toLowerCase() } }
    },
    scroll: async (direction) => {
      if (direction === 'top' || direction === 'up') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (direction === 'bottom') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      } else {
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
      }
      return { ok: true, data: { scrolled: direction } }
    },
    analyze: async () => {
      const stats = { title: document.title, url: location.href, buttons: [], inputs: [], links: [], selects: [], forms: [], tables: [] }
      document.querySelectorAll('button, [role=button]').forEach((b) => {
        stats.buttons.push({ text: (b.textContent || '').trim().substring(0, 60), id: b.id, className: b.className })
      })
      document.querySelectorAll('input, textarea').forEach((i) => {
        stats.inputs.push({ type: i.type, placeholder: i.placeholder, name: i.name, id: i.id })
      })
      document.querySelectorAll('a, [role=link]').forEach((a) => {
        stats.links.push({ text: (a.textContent || '').trim().substring(0, 60), href: a.href })
      })
      document.querySelectorAll('select').forEach((s) => {
        stats.selects.push({ name: s.name, id: s.id, options: s.options.length })
      })
      document.querySelectorAll('form').forEach((f) => {
        stats.forms.push({ id: f.id, action: f.action, method: f.method })
      })
      document.querySelectorAll('table').forEach((t) => {
        stats.tables.push({ rows: t.rows.length, cols: t.rows[0]?.cells.length || 0 })
      })
      return { ok: true, data: stats }
    },
    findElements: async (keyword) => {
      const found = findElementsByText(keyword)
      return { ok: true, data: found }
    },
    findAndHover: async (target) => {
      const found = findElementsByText(target)
      if (!found.length) return { ok: false, error: `未找到「${target}」` }
      const el = elementMap.get(found[0].elementId)
      if (!el) return { ok: false, error: '元素已不在DOM中' }
      highlightElement(el)
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      return { ok: true, data: { hovered: true } }
    },
    reload: async () => {
      location.reload()
      return { ok: true }
    },
    goBack: async () => {
      history.back()
      return { ok: true }
    },
    goForward: async () => {
      history.forward()
      return { ok: true }
    },
    navigate: async (target) => {
      if (!target) return { ok: false, error: '跳转目标为空' }
      const t = target.trim()
      if (/^(https?:)?\/\//i.test(t)) {
        location.href = t.startsWith('//') ? location.protocol + t : t
        return { ok: true, data: { navigated: t } }
      }
      if (t.startsWith('/') || t.startsWith('#')) {
        if (router?.navigate) router.navigate(t)
        else location.href = t
        return { ok: true, data: { navigated: t } }
      }
      const found = findElementsByText(t, ['a', '[role=link]', 'button', '[role=button]'])
      if (found.length) {
        const el = elementMap.get(found[0].elementId)
        if (el && isVisible(el)) {
          highlightElement(el)
          fireClick(el)
          return { ok: true, data: { clicked: t } }
        }
      }
      if (router?.navigate) {
        router.navigate(t.startsWith('/') ? t : '/' + t)
        return { ok: true, data: { navigated: t } }
      }
      return { ok: false, error: `无法跳转「${t}」：不是有效地址，页面内也未找到对应链接` }
    },
    search: async (value) => {
      if (!value) return { ok: false, error: '搜索内容为空' }
      const searchEls = [...document.querySelectorAll('input[type=search], input[placeholder*="搜索" i], input[placeholder*="search" i], input[aria-label*="搜索" i], input[aria-label*="search" i]')].filter(isVisible)
      let el = searchEls[0]
      if (!el) el = findFirstVisibleInput()
      if (!el) return { ok: false, error: '页面中没有找到搜索框或输入框' }
      highlightElement(el)
      el.focus()
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      if (nativeSetter) nativeSetter.call(el, value)
      else el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }))
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }))
      const form = el.closest('form')
      if (form) {
        try { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) } catch { /* ignore */ }
      } else {
        const btn = el.closest('div, form')?.querySelector('button[type=submit], button')
        if (btn) fireClick(btn)
      }
      return { ok: true, data: { searched: value } }
    },
    press: async (key) => {
      const el = document.activeElement || document.body
      if (!el) return { ok: false, error: '没有可接收按键的元素' }
      highlightElement(el)
      dispatchKey(el, key)
      return { ok: true, data: { pressed: key } }
    },
    select: async (target) => {
      const found = findElementsByText(target, ['select'])
      if (!found.length) return { ok: false, error: `未找到下拉框「${target}」` }
      const el = elementMap.get(found[0].elementId)
      if (!el) return { ok: false, error: '元素已不在DOM中' }
      highlightElement(el)
      el.focus()
      el.dispatchEvent(new Event('mousedown', { bubbles: true }))
      el.dispatchEvent(new Event('mouseup', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return { ok: true, data: { selected: target } }
    },
    check: async (target) => {
      const found = findElementsByText(target, ['input[type=checkbox]', 'input[type=radio]', '[role=checkbox]'])
      if (!found.length) return { ok: false, error: `未找到复选框「${target}」` }
      const el = elementMap.get(found[0].elementId)
      if (!el) return { ok: false, error: '元素已不在DOM中' }
      highlightElement(el)
      const isChecked = el.checked || el.getAttribute('aria-checked') === 'true'
      if (el.tagName === 'INPUT') {
        const proto = window.HTMLInputElement.prototype
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'checked')?.set
        if (nativeSetter) nativeSetter.call(el, !isChecked)
        else el.checked = !isChecked
      } else {
        el.setAttribute('aria-checked', isChecked ? 'false' : 'true')
      }
      el.dispatchEvent(new Event('click', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return { ok: true, data: { checked: !isChecked } }
    },
    fillForm: async (fields) => {
      const scope = pickBestForm()
      const inputs = getFormInputs(scope)
      if (!inputs.length) return { ok: false, error: '页面中没有找到表单字段（input/select/textarea）' }
      if (!fields || !fields.length) {
        const list = inputs.map((el, i) => ({
          index: i,
          name: fieldNames(el)[0] || el.name || el.id || el.placeholder || `字段${i + 1}`,
          type: el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : el.type || 'text',
          required: !!el.required,
          current: el.value || '',
        }))
        return {
          ok: true,
          data: { fields: list, count: list.length, formCount: document.querySelectorAll('form').length },
          hint: '未提供填写内容，已列出表单字段；试试「填写表单：姓名张三，邮箱a@b.com」',
        }
      }
      const filled = []
      const errors = []
      const used = new Set()
      const markUsed = (el) => used.add(inputs.indexOf(el))
      for (const f of fields) {
        if (!f.name || f.value === undefined) continue
        const el = inputs.find((x, i) => !used.has(i) && matchFieldName(x, f.name))
        if (el) {
          markUsed(el)
          try {
            setFieldValue(el, f.value)
            highlightElement(el)
            filled.push(`${f.name}="${f.value}"`)
          } catch (e) {
            errors.push(`${f.name}: ${e.message}`)
          }
        } else {
          errors.push(`未找到字段「${f.name}」`)
        }
      }
      for (const f of fields) {
        if (!f.raw) continue
        const split = splitRawByFieldName(inputs.filter((x, i) => !used.has(i)), f.raw)
        if (split) {
          const el = split.el
          if (!used.has(inputs.indexOf(el))) {
            markUsed(el)
            try {
              setFieldValue(el, split.value)
              highlightElement(el)
              filled.push(`${split.name}="${split.value}"`)
            } catch (e) {
              errors.push(`${split.name}: ${e.message}`)
            }
            continue
          }
        }
        let cursor = 0
        while (used.has(cursor) && cursor < inputs.length) cursor++
        if (cursor >= inputs.length) {
          errors.push(`表单已填满，多余内容「${f.raw}」未处理`)
          break
        }
        const el = inputs[cursor]
        const nm = fieldNames(el)[0] || `字段${cursor + 1}`
        markUsed(el)
        try {
          setFieldValue(el, f.raw)
          highlightElement(el)
          filled.push(`${nm}="${f.raw}"`)
        } catch (e) {
          errors.push(`${nm}: ${e.message}`)
        }
      }
      if (!filled.length) {
        return { ok: false, error: errors[0] || '表单填写失败', data: { errors } }
      }
      return {
        ok: true,
        data: { filled, errors, total: inputs.length },
        hint: errors.length ? `部分字段未匹配：${errors.join('；')}` : `已填写 ${filled.length}/${inputs.length} 个字段`,
      }
    },
    submitForm: async () => {
      const scope = pickBestForm()
      if (scope === document) {
        const btns = [...document.querySelectorAll('button[type=submit], input[type=submit], [role=button]')].filter(isVisible)
        const hit = btns.find((b) => /提交|保存|确认|确定|登录|注册|submit|save|confirm/i.test(b.textContent || b.value || ''))
        if (!hit) return { ok: false, error: '页面中没有找到表单或提交按钮' }
        highlightElement(hit)
        fireClick(hit)
        return { ok: true, data: { submitted: (hit.textContent || hit.value || '').trim() || '提交按钮' } }
      }
      if (typeof scope.requestSubmit === 'function') {
        try {
          scope.requestSubmit()
          return { ok: true, data: { submitted: 'form.requestSubmit()' } }
        } catch { /* 校验失败等情况，回退到点击提交按钮 */ }
      }
      const btns = [...scope.querySelectorAll('button[type=submit], button, input[type=submit]')].filter(isVisible)
      if (btns.length) {
        const hit = btns[0]
        highlightElement(hit)
        fireClick(hit)
        return { ok: true, data: { submitted: (hit.textContent || hit.value || '').trim() || '提交按钮' } }
      }
      scope.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      return { ok: true, data: { submitted: 'submit 事件' } }
    },
    clearForm: async () => {
      const scope = pickBestForm()
      const inputs = getFormInputs(scope)
      if (!inputs.length) return { ok: false, error: '页面中没有找到表单字段' }
      let cleared = 0
      for (const el of inputs) {
        if (el.tagName === 'SELECT') {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set
          if (setter) setter.call(el, '')
          else el.value = ''
          el.dispatchEvent(new Event('change', { bubbles: true }))
        } else if (el.type === 'checkbox' || el.type === 'radio') {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set
          if (setter) setter.call(el, false)
          else el.checked = false
          el.dispatchEvent(new Event('change', { bubbles: true }))
        } else {
          const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
          const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
          if (nativeSetter) nativeSetter.call(el, '')
          else el.value = ''
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
        cleared++
      }
      return { ok: true, data: { cleared } }
    },
    detectForm: async () => {
      const scope = pickBestForm()
      const inputs = getFormInputs(scope)
      const fields = inputs.map((el, i) => ({
        index: i,
        name: fieldNames(el)[0] || el.name || el.id || el.placeholder || `字段${i + 1}`,
        names: fieldNames(el).slice(0, 3),
        type: el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : el.type || 'text',
        required: !!el.required,
        placeholder: el.placeholder || '',
        current: el.value || '',
      }))
      return { ok: true, data: { formCount: document.querySelectorAll('form').length, fieldCount: fields.length, fields } }
    },
    wait: async (ms) => {
      await new Promise((r) => setTimeout(r, ms || 1000))
      return { ok: true, data: { waited: ms || 1000 } }
    },
  }
}
