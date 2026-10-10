/* =====================================================================
 * 指令解析层（纯逻辑，无 DOM、无 React）
 * ---------------------------------------------------------------------
 * 把「点击登录按钮」「填写表单：姓名张三」这类自然语言指令
 * 解析成结构化的 action 列表，交给桥接层执行。
 *
 * 从 UniversalPageAgent.jsx 拆出：原文件 1300 行里混着
 * 语音归一化 / 正则规则 / DOM 操作 / React 组件四类职责，
 * 这里只留第一类。
 * ===================================================================== */

/** iframe 通信协议版本号（改动协议时必须同步 bump） */
export const AGENT_PROTOCOL = 'universal-page-agent-v1'

// 提取目标文本并清理首尾引号
export const cleanTarget = (s) => (s || '').trim().replace(/^[「『"'“”]+|[」』"'“”]+$/g, '')

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
}

/**
 * 先按长词（>1 字）整体替换，再逐字替换单字。
 * 顺序不能反：否则「電機」会被逐字替换成「电机」，长词规则永远命中不到。
 */
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
export const parseClickTarget = (raw) => {
    let s = cleanTarget(raw)
    let count = 1
    const cm = s.match(/(\d+)\s*次?$/)
    if (cm) { count = parseInt(cm[1], 10) || 1; s = s.slice(0, cm.index).trim() }
    const suf = /(?:按钮|按键|链接|图片|图标|标签|选项|菜单)$/.exec(s)
    if (suf && suf[0].length < s.length) s = s.slice(0, -suf[0].length).trim()
    return { target: s, count }
}

// 解析表单字段："姓名张三，电话138" / "姓名:张三,邮箱=a@b.com" → [{name,value} | {raw}]
// 显式分隔（: =）直接拆 KV；无分隔的段保留 raw，由桥接层结合 DOM 字段名做前缀拆分
export const parseFormFields = (raw) => {
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
    // 语序 A：在XX输入YY / 在XX里输入YY / 向XX填写YY
    { pattern: /(?:在|向|往|对)\s*[「『"]?(.+)[」』"]?\s*(?:里|中|内|框|输入框)?\s*(?:输入|填写|填入|键入|type|input)\s*[「『"]?(.+?)[」』"]?$/i, type: 'type', extract: (m) => ({ target: cleanTarget(m[1]), value: cleanTarget(m[2]) }) },
    // 语序 B1：输入YY到XX（带目标）
    { pattern: /(?:输入|填写|填入|键入|type|input)\s*[「『"]?(.+)[」』"]?\s*(?:到|至|在|于)\s*[「『"]?(.+?)[」』"]?$/i, type: 'type', extract: (m) => ({ value: cleanTarget(m[1]), target: cleanTarget(m[2]) }) },
    // 语序 B2：输入YY（无目标，自动定位第一个输入框）
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
    { pattern: /(?:等待|等|wait)\s*(\d+)\s*(毫秒|ms|秒|s)?/i, type: 'wait', extract: (m) => {
        // 单位必须显式捕获：用 m[0].includes('s') 判断会把 'ms' 也算成「秒」，
        // 而「毫秒」又包含「秒」，两种情况都会把等待时长错误放大 1000 倍。
        const unit = (m[2] || '').toLowerCase()
        return { ms: parseInt(m[1], 10) * (unit === '秒' || unit === 's' ? 1000 : 1) }
    } },
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

/** 表单批量填写指令整体解析的判据（内部逗号是字段分隔符，不能拆成多段指令） */
const FORM_FILL_WHOLE = /(?:填写|填一下|帮我填|自动填|填好|fill)\s*(?:一下|好)?\s*(?:这个|那个)?\s*(?:表单|表格|form)/i

/** 指令串 → action 列表 */
export function parseToActions(task) {
    // 表单批量填写指令内部含逗号分隔字段，必须整体解析（不能按逗号拆成多段）
    if (FORM_FILL_WHOLE.test(task)) return [parseNaturalLanguage(task)]
    return task
        .split(/[，,。；;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(parseNaturalLanguage)
}

/**
 * 把 action 派发给桥接层执行。
 *
 * 抽成独立函数而非 class 方法：bridge 是一个纯对象的映射表，
 * 这里只做 type → bridge.xxx 的分派，不需要实例化状态。
 */
export async function executeActions(actions, bridge) {
    const results = []

    for (const action of actions) {
        let result
        switch (action.type) {
            case 'navigate':
                result = await bridge.navigate(action.target)
                break
            case 'click':
                result = await bridge.findAndClick(action.target, action.count || 1)
                break
            case 'type':
                result = await bridge.findAndType(action.target, action.value)
                break
            case 'search':
                result = await bridge.search(action.value)
                break
            case 'scroll':
                result = await bridge.scroll(action.direction)
                break
            case 'analyze':
                result = await bridge.analyze()
                break
            case 'find':
                result = await bridge.findElements(action.target)
                break
            case 'hover':
                result = await bridge.findAndHover(action.target)
                break
            case 'select':
                result = await bridge.select(action.target)
                break
            case 'check':
                result = await bridge.check(action.target)
                break
            case 'press':
                result = await bridge.press(action.key)
                break
            case 'form-fill':
                result = await bridge.fillForm(action.fields || [])
                break
            case 'form-submit':
                result = await bridge.submitForm()
                break
            case 'form-clear':
                result = await bridge.clearForm()
                break
            case 'form-detect':
                result = await bridge.detectForm()
                break
            case 'wait':
                result = await bridge.wait(action.ms)
                break
            case 'reload':
                result = await bridge.reload()
                break
            case 'back':
                result = await bridge.goBack()
                break
            case 'forward':
                result = await bridge.goForward()
                break
            case 'unknown':
                result = { ok: false, error: `无法理解指令「${action.raw || ''}」，试试「点击XX」「输入XX」「跳转到XX」` }
                break
            default:
                result = { ok: false, error: `未知动作: ${action.type}` }
        }
        results.push({ action, result })
    }

    return { actions, results }
}
