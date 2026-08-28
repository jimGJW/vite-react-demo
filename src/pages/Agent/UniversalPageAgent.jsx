import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import './index.scss';
import useWhisperRecorder from '../../hooks/useWhisperRecorder';

const AGENT_PROTOCOL = 'universal-page-agent-v1';

// 提取目标文本并清理首尾引号
const cleanTarget = (s) => (s || '').trim().replace(/^[「『"'“”]+|[」』"'“”]+$/g, '');

// 语音识别文本归一化：繁体→简体 + whisper-tiny 常见误识别修正
const VOICE_TEXT_MAP = {
    '電機': '点击', '電擊': '点击', '點擊': '点击', '按鈕': '按钮', '滾動': '滚动',
    '首頁': '首页', '主頁': '首页', '跳轉': '跳转', '登錄': '登录', '註冊': '注册',
    '發送': '发送', '填寫': '填写', '選擇': '选择', '勾選': '勾选', '下一頁': '下一页',
    '上一頁': '上一页', '頁面': '页面', '網頁': '网页', '鏈接': '链接', '圖標': '图标',
    '菜單': '菜单', '選項': '选项', '設置': '设置', '確認': '确认', '關閉': '关闭',
    '開啟': '开启', '刪除': '删除', '編輯': '编辑', '下載': '下载', '上傳': '上传',
    '圖片': '图片', '視頻': '视频', '郵箱': '邮箱', '賬號': '账号', '密碼': '密码',
    // whisper-tiny 对 TTS/短指令的高频音近误识别
    '天使也表': '填写表', '表彈': '表单', '表弹': '表单', '表單': '表单',
    '向下滾動': '向下滚动', '電機按鈕': '点击按钮',
    '點': '点', '擊': '击', '鈕': '钮', '滾': '滚', '動': '动', '頁': '页',
    '開': '开', '關': '关', '錄': '录', '寫': '写', '選': '选', '擇': '择',
    '確': '确', '認': '认', '輸': '输', '檢': '检', '瀏': '浏', '覽': '览',
    '網': '网', '標': '标', '籤': '签', '圖': '图', '單': '单', '項': '项',
    '設': '设', '編': '编', '輯': '辑', '刪': '删', '視': '视', '欄': '栏',
    '鏈': '链', '檔': '档', '資': '资', '訊': '讯', '畫': '画', '傳': '传',
    '統': '统', '價': '价', '訂': '订', '會': '会', '員': '员', '帳': '账',
    '號': '号', '驗': '验', '證': '证', '碼': '码', '尋': '寻', '結': '结',
    '機': '机', '電': '电', '腦': '脑', '顯': '显', '務': '务', '總': '总',
    '經': '经', '級': '级', '別': '别', '類': '类', '體': '体', '處': '处',
    '組': '组', '織': '织', '團': '团', '隊': '队', '專': '专', '業': '业',
    '區': '区', '塊': '块', '態': '态', '聲': '声', '話': '话', '語': '语',
    '詞': '词', '彙': '汇', '報': '报', '準': '准', '規': '规', '範': '范',
    '圍': '围', '內': '内', '數': '数', '據': '据', '庫': '库', '記': '记',
    '器': '器',
};
function normalizeVoiceText(text) {
    if (!text) return text;
    let t = String(text);
    for (const [from, to] of Object.entries(VOICE_TEXT_MAP)) {
        if (from.length > 1) t = t.split(from).join(to);
    }
    let out = '';
    for (const ch of t) out += VOICE_TEXT_MAP[ch] || ch;
    return out;
}

// 解析点击目标：剥离末尾"2次"等次数标记与"按钮/链接"等元素后缀
const parseClickTarget = (raw) => {
    let s = cleanTarget(raw);
    let count = 1;
    const cm = s.match(/(\d+)\s*次?$/);
    if (cm) { count = parseInt(cm[1]) || 1; s = s.slice(0, cm.index).trim(); }
    const suf = /(?:按钮|按键|链接|图片|图标|标签|选项|菜单)$/.exec(s);
    if (suf && suf[0].length < s.length) s = s.slice(0, -suf[0].length).trim();
    return { target: s, count };
};

// 解析表单字段："姓名张三，电话138" / "姓名:张三,邮箱=a@b.com" → [{name,value} | {raw}]
// 显式分隔（: =）直接拆 KV；无分隔的段保留 raw，由桥接层结合 DOM 字段名做前缀拆分
const parseFormFields = (raw) => {
    if (!raw) return [];
    return String(raw)
        .split(/[，,；;、]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((seg) => {
            const kv = seg.match(/^(.+?)[=:：]\s*(.+)$/);
            if (kv) return { name: kv[1].trim(), value: kv[2].trim() };
            return { raw: seg };
        });
};

// 注意：规则顺序即匹配优先级，点击/输入/滚动等高频指令放在前面
const NLP_RULES = [
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

    // —— 刷新 / 后退 / 前进 ——
    { pattern: /(?:刷新|重载|重新加载|reload|refresh)/i, type: 'reload' },

    // —— 等待 ——
    { pattern: /(?:等待|等|wait)\s*(\d+)\s*(?:毫秒|ms|秒|s)?/i, type: 'wait', extract: (m) => ({ ms: parseInt(m[1]) * ((m[0].includes('秒') || m[0].includes('s')) ? 1000 : 1) }) },
];

function parseNaturalLanguage(text) {
    for (const rule of NLP_RULES) {
        const m = text.match(rule.pattern);
        if (m) {
            const action = { type: rule.type };
            if (rule.extract) {
                const extra = rule.extract(m);
                if (typeof extra === 'object') Object.assign(action, extra);
                else action.target = extra;
            }
            return action;
        }
    }
    return { type: 'unknown', raw: text };
}

class SimplePageAgent {
    constructor(config) {
        this.config = config;
    }

    parseToActions(task) {
        // 表单批量填写指令内部含逗号分隔字段，必须整体解析（不能按逗号拆成多段）
        if (/(?:填写|填一下|帮我填|自动填|填好|fill)\s*(?:一下|好)?\s*(?:这个|那个)?\s*(?:表单|表格|form)/i.test(task)) {
            return [parseNaturalLanguage(task)];
        }
        const parts = task.split(/[，,。；;\n]+/).map((s) => s.trim()).filter(Boolean);
        return parts.map(parseNaturalLanguage);
    }

    async execute(task, bridge) {
        const actions = this.parseToActions(task);
        const results = [];

        for (const action of actions) {
            let result;
            switch (action.type) {
                case 'navigate':
                    result = await bridge.navigate(action.target);
                    break;
                case 'click':
                    result = await bridge.findAndClick(action.target, action.count || 1);
                    break;
                case 'type':
                    result = await bridge.findAndType(action.target, action.value);
                    break;
                case 'search':
                    result = await bridge.search(action.value);
                    break;
                case 'scroll':
                    result = await bridge.scroll(action.direction);
                    break;
                case 'analyze':
                    result = await bridge.analyze();
                    break;
                case 'find':
                    result = await bridge.findElements(action.target);
                    break;
                case 'hover':
                    result = await bridge.findAndHover(action.target);
                    break;
                case 'select':
                    result = await bridge.select(action.target);
                    break;
                case 'check':
                    result = await bridge.check(action.target);
                    break;
                case 'press':
                    result = await bridge.press(action.key);
                    break;
                case 'form-fill':
                    result = await bridge.fillForm(action.fields || []);
                    break;
                case 'form-submit':
                    result = await bridge.submitForm();
                    break;
                case 'form-clear':
                    result = await bridge.clearForm();
                    break;
                case 'form-detect':
                    result = await bridge.detectForm();
                    break;
                case 'wait':
                    result = await bridge.wait(action.ms);
                    break;
                case 'reload':
                    result = await bridge.reload();
                    break;
                case 'back':
                    result = await bridge.goBack();
                    break;
                case 'forward':
                    result = await bridge.goForward();
                    break;
                case 'unknown':
                    result = { ok: false, error: `无法理解指令「${action.raw || ''}」，试试「点击XX」「输入XX」「跳转到XX」` };
                    break;
                default:
                    result = { ok: false, error: `未知动作: ${action.type}` };
            }
            results.push({ action, result });
        }

        return { actions, results };
    }
}

function createDirectBridge(router) {
    const nextId = { current: 1 };
    const elementMap = new Map();

    /** 元素是否可见（未被隐藏 / 未禁用） */
    function isVisible(el) {
        if (!el) return false;
        if (el.disabled) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        return true;
    }

    /** 查找第一个可见的输入框（用于"输入XX"未指定目标时） */
    function findFirstVisibleInput() {
        const selectors = ['input[type=search]', 'input[type=text]', 'input:not([type])', 'input[type=url]', 'input[type=email]', 'input[type=tel]', 'input[type=number]', 'textarea', 'input[type=password]'];
        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                const type = (el.getAttribute('type') || 'text').toLowerCase();
                if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset' || type === 'file') continue;
                if (isVisible(el)) return el;
            }
        }
        return null;
    }

    /** 查找所有匹配文本的元素并记录到 elementMap */
    function findElementsByText(text, types) {
        const selectors = types || ['button', 'a', 'input', 'textarea', 'select', '[role=button]', '[role=link]', 'h1', 'h2', 'h3', 'h4', 'label'];
        const results = [];
        const seen = new Set();
        const keyword = (text || '').trim().toLowerCase();
        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                const textContent = (el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim();
                // 关键词为空时只返回可见输入类元素（用于"输入"未指定目标）
                if (keyword === '') {
                    if (!isVisible(el) || !['input', 'textarea', 'select'].includes(el.tagName.toLowerCase())) continue;
                } else if (!textContent.toLowerCase().includes(keyword)) {
                    continue;
                }
                if (!seen.has(el)) {
                    seen.add(el);
                    const elId = 'agent-el-' + (nextId.current++);
                    el.setAttribute('data-agent-id', elId);
                    elementMap.set(elId, el);
                    const rect = el.getBoundingClientRect();
                    results.push({ elementId: elId, tag: el.tagName.toLowerCase(), text: textContent.substring(0, 80), type: el.type || '', top: rect.top, left: rect.left, width: rect.width, height: rect.height });
                }
            }
        }
        return results;
    }

    function highlightElement(el) {
        if (!el) return;
        const orig = { outline: el.style.outline, backgroundColor: el.style.backgroundColor, transition: el.style.transition };
        el.style.outline = '2px solid #667eea';
        el.style.backgroundColor = 'rgba(102,126,234,0.15)';
        setTimeout(() => {
            el.style.outline = orig.outline;
            el.style.backgroundColor = orig.backgroundColor;
        }, 800);
    }
    function fireClick(el) {
        el.focus();
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        el.click();
    }

    function dispatchKey(el, key) {
        el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        el.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true, cancelable: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
    }

    // ============ 表单填写辅助 ============

    /** 收集范围内可填写的表单字段（排除 hidden/submit/button/reset/image/file） */
    function getFormInputs(scope) {
        const els = [...scope.querySelectorAll('input, textarea, select')].filter(isVisible);
        return els.filter((el) => {
            const t = (el.getAttribute('type') || 'text').toLowerCase();
            return !['hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(t);
        });
    }

    /** 获取一个字段的所有候选名称（label / placeholder / aria-label / name / id） */
    function fieldNames(el) {
        const names = new Set();
        if (el.id) {
            document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach((l) => {
                const t = (l.textContent || '').trim();
                if (t) names.add(t.replace(/[：:*]+$/, ''));
            });
        }
        const wrapLabel = el.closest('label');
        if (wrapLabel) {
            const t = (wrapLabel.textContent || '').trim();
            if (t) names.add(t.replace(/[：:*]+$/, ''));
        }
        if (el.placeholder) names.add(el.placeholder.trim());
        if (el.getAttribute('aria-label')) names.add(el.getAttribute('aria-label').trim());
        if (el.name) names.add(el.name);
        if (el.id) names.add(el.id);
        return [...names].filter(Boolean);
    }

    /** 关键词是否命中字段（label 优先，忽略冒号/星号/空白后做包含匹配） */
    function matchFieldName(input, keyword) {
        if (!keyword) return false;
        const norm = (s) => s.toLowerCase().replace(/[：:*\s]/g, '');
        const kw = norm(String(keyword));
        if (!kw) return false;
        for (const n of fieldNames(input)) {
            const nn = norm(n);
            if (!nn) continue;
            if (nn === kw || nn.includes(kw) || kw.includes(nn)) return true;
        }
        return false;
    }

    /** 设置单个字段的值（input/textarea/select/checkbox 分类型处理，兼容 React 受控组件） */
    function setFieldValue(el, value) {
        if (el.tagName === 'SELECT') {
            const hit = [...el.options].find((o) => o.text.trim() === String(value).trim() || o.value === String(value).trim());
            if (!hit) throw new Error(`下拉框没有选项「${value}」`);
            const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
            if (setter) setter.call(el, hit.value);
            else el.value = hit.value;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }
        if (el.type === 'checkbox' || el.type === 'radio') {
            const want = /^(true|1|是|勾选|选中|打勾|yes|on)$/i.test(String(value).trim());
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set;
            if (setter) setter.call(el, want);
            else el.checked = want;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }
        const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) nativeSetter.call(el, String(value));
        else el.value = String(value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /** 定位最佳表单：可见且字段最多的 <form>；页面无 form 时退化到整个文档 */
    function pickBestForm() {
        const forms = [...document.querySelectorAll('form')];
        if (!forms.length) return document;
        let best = null;
        let bestScore = -1;
        for (const f of forms) {
            const r = f.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            const score = getFormInputs(f).length;
            if (score > bestScore) {
                bestScore = score;
                best = f;
            }
        }
        return bestScore > 0 ? best : document;
    }

    /** 用 DOM 字段名对无分隔符的原始段做前缀拆分：如"电话138" → {name:'电话', value:'138'} */
    function splitRawByFieldName(inputs, raw) {
        const s = String(raw).trim();
        if (!s) return null;
        let best = null;
        for (const el of inputs) {
            for (const n of fieldNames(el)) {
                const nn = n.replace(/[：:*\s]/g, '');
                if (!nn) continue;
                if (s.startsWith(nn) && s.length > nn.length) {
                    const rest = s.slice(nn.length).trim();
                    if (!best || nn.length > best.name.length) best = { name: nn, value: rest, el };
                }
            }
        }
        return best;
    }

    return {
        findAndClick: async (target, count = 1) => {
            const found = findElementsByText(target);
            if (!found.length) return { ok: false, error: `未找到「${target}」` };
            const el = elementMap.get(found[0].elementId);
            if (!el) return { ok: false, error: '元素已不在DOM中' };
            highlightElement(el);
            for (let i = 0; i < count; i++) {
                fireClick(el);
                if (i < count - 1) await new Promise((r) => setTimeout(r, 150));
            }
            return { ok: true, data: { clicked: el.tagName.toLowerCase(), count } };
        },
        findAndType: async (target, value) => {
            // 未指定输入框时，自动定位第一个可见输入框
            let found;
            if (target) {
                found = findElementsByText(target, ['input', 'textarea', 'select']);
                if (!found.length) {
                    // 目标文本可能匹配 placeholder / label
                    const byPlaceholder = findElementsByText(target, ['input', 'textarea']);
                    if (byPlaceholder.length) found = byPlaceholder;
                }
            } else {
                const el = findFirstVisibleInput();
                if (el) {
                    const elId = 'agent-el-' + (nextId.current++);
                    el.setAttribute('data-agent-id', elId);
                    elementMap.set(elId, el);
                    found = [{ elementId: elId, tag: el.tagName.toLowerCase() }];
                }
            }
            if (!found?.length) return { ok: false, error: `未找到输入框${target ? `「${target}」` : ''}` };
            const el = elementMap.get(found[0].elementId);
            if (!el) return { ok: false, error: '元素已不在DOM中' };
            highlightElement(el);
            el.focus();
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (nativeSetter) {
                nativeSetter.call(el, value);
            } else {
                el.value = value;
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return { ok: true, data: { typed: value, into: el.tagName.toLowerCase() } };
        },
        scroll: async (direction) => {
            if (direction === 'top' || direction === 'up') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (direction === 'bottom') {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            } else {
                window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
            }
            return { ok: true, data: { scrolled: direction } };
        },
        analyze: async () => {
            const stats = {
                title: document.title,
                url: location.href,
                buttons: [],
                inputs: [],
                links: [],
                selects: [],
                forms: [],
                tables: [],
            };
            document.querySelectorAll('button, [role=button]').forEach((b) => {
                stats.buttons.push({ text: (b.textContent || '').trim().substring(0, 60), id: b.id, className: b.className });
            });
            document.querySelectorAll('input, textarea').forEach((i) => {
                stats.inputs.push({ type: i.type, placeholder: i.placeholder, name: i.name, id: i.id });
            });
            document.querySelectorAll('a, [role=link]').forEach((a) => {
                stats.links.push({ text: (a.textContent || '').trim().substring(0, 60), href: a.href });
            });
            document.querySelectorAll('select').forEach((s) => {
                stats.selects.push({ name: s.name, id: s.id, options: s.options.length });
            });
            document.querySelectorAll('form').forEach((f) => {
                stats.forms.push({ id: f.id, action: f.action, method: f.method });
            });
            document.querySelectorAll('table').forEach((t) => {
                stats.tables.push({ rows: t.rows.length, cols: t.rows[0]?.cells.length || 0 });
            });
            return { ok: true, data: stats };
        },
        findElements: async (keyword) => {
            const found = findElementsByText(keyword);
            return { ok: true, data: found };
        },
        findAndHover: async (target) => {
            const found = findElementsByText(target);
            if (!found.length) return { ok: false, error: `未找到「${target}」` };
            const el = elementMap.get(found[0].elementId);
            if (!el) return { ok: false, error: '元素已不在DOM中' };
            highlightElement(el);
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            return { ok: true, data: { hovered: true } };
        },
        reload: async () => {
            location.reload();
            return { ok: true };
        },
        goBack: async () => {
            history.back();
            return { ok: true };
        },
        goForward: async () => {
            history.forward();
            return { ok: true };
        },
        // —— 导航跳转（URL / 站内路由 / 页面内链接）——
        navigate: async (target) => {
            if (!target) return { ok: false, error: '跳转目标为空' };
            const t = target.trim();
            // 1. 绝对 URL
            if (/^(https?:)?\/\//i.test(t)) {
                location.href = t.startsWith('//') ? location.protocol + t : t;
                return { ok: true, data: { navigated: t } };
            }
            // 2. 站内路径或锚点 → 优先使用 React Router（如果提供了 router prop）
            if (t.startsWith('/') || t.startsWith('#')) {
                if (router?.navigate) {
                    router.navigate(t);
                } else {
                    location.href = t;
                }
                return { ok: true, data: { navigated: t } };
            }
            // 3. 中文关键词 → 页面内查找对应链接/按钮并点击
            const found = findElementsByText(t, ['a', '[role=link]', 'button', '[role=button]']);
            if (found.length) {
                const el = elementMap.get(found[0].elementId);
                if (el && isVisible(el)) {
                    highlightElement(el);
                    fireClick(el);
                    return { ok: true, data: { clicked: t } };
                }
            }
            // 4. 最后尝试作为站内路由路径
            if (router?.navigate) {
                router.navigate(t.startsWith('/') ? t : '/' + t);
                return { ok: true, data: { navigated: t } };
            }
            return { ok: false, error: `无法跳转「${t}」：不是有效地址，页面内也未找到对应链接` };
        },
        // —— 搜索（定位搜索框输入并回车）——
        search: async (value) => {
            if (!value) return { ok: false, error: '搜索内容为空' };
            // 优先找搜索框
            const searchEls = [...document.querySelectorAll('input[type=search], input[placeholder*="搜索" i], input[placeholder*="search" i], input[aria-label*="搜索" i], input[aria-label*="search" i]')].filter(isVisible);
            let el = searchEls[0];
            if (!el) {
                // 退化：第一个可见输入框
                el = findFirstVisibleInput();
            }
            if (!el) return { ok: false, error: '页面中没有找到搜索框或输入框' };
            highlightElement(el);
            el.focus();
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            // 用对应原型（HTMLInputElement vs HTMLTextAreaElement）的 value setter，否则 call() 会抛 Illegal invocation
            const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (nativeSetter) nativeSetter.call(el, value);
            else el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            // 回车提交搜索
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
            // 部分页面用 form submit / 按钮触发，尝试提交
            const form = el.closest('form');
            if (form) {
                try { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } catch { /* ignore */ }
            } else {
                const btn = el.closest('div, form')?.querySelector('button[type=submit], button');
                if (btn) fireClick(btn);
            }
            return { ok: true, data: { searched: value } };
        },
        // —— 按键 ——
        press: async (key) => {
            const el = document.activeElement || document.body;
            if (!el) return { ok: false, error: '没有可接收按键的元素' };
            highlightElement(el);
            dispatchKey(el, key);
            return { ok: true, data: { pressed: key } };
        },
        // —— 下拉选择 ——
        select: async (target) => {
            const found = findElementsByText(target, ['select']);
            if (!found.length) return { ok: false, error: `未找到下拉框「${target}」` };
            const el = elementMap.get(found[0].elementId);
            if (!el) return { ok: false, error: '元素已不在DOM中' };
            highlightElement(el);
            el.focus();
            el.dispatchEvent(new Event('mousedown', { bubbles: true }));
            el.dispatchEvent(new Event('mouseup', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return { ok: true, data: { selected: target } };
        },
        // —— 勾选复选框 ——
        check: async (target) => {
            const found = findElementsByText(target, ['input[type=checkbox]', 'input[type=radio]', '[role=checkbox]']);
            if (!found.length) return { ok: false, error: `未找到复选框「${target}」` };
            const el = elementMap.get(found[0].elementId);
            if (!el) return { ok: false, error: '元素已不在DOM中' };
            highlightElement(el);
            const isChecked = el.checked || el.getAttribute('aria-checked') === 'true';
            if (el.tagName === 'INPUT') {
                const proto = window.HTMLInputElement.prototype;
                const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'checked')?.set;
                if (nativeSetter) nativeSetter.call(el, !isChecked);
                else el.checked = !isChecked;
            } else {
                el.setAttribute('aria-checked', isChecked ? 'false' : 'true');
            }
            el.dispatchEvent(new Event('click', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return { ok: true, data: { checked: !isChecked } };
        },
        // —— 表单填写 ——
        fillForm: async (fields) => {
            const scope = pickBestForm();
            const inputs = getFormInputs(scope);
            if (!inputs.length) return { ok: false, error: '页面中没有找到表单字段（input/select/textarea）' };
            // 未提供内容 → 检测并列出字段（引导用户如何填）
            if (!fields || !fields.length) {
                const list = inputs.map((el, i) => ({
                    index: i,
                    name: fieldNames(el)[0] || el.name || el.id || el.placeholder || `字段${i + 1}`,
                    type: el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : el.type || 'text',
                    required: !!el.required,
                    current: el.value || '',
                }));
                return {
                    ok: true,
                    data: { fields: list, count: list.length, formCount: document.querySelectorAll('form').length },
                    hint: '未提供填写内容，已列出表单字段；试试「填写表单：姓名张三，邮箱a@b.com」',
                };
            }
            const filled = [];
            const errors = [];
            const used = new Set();
            const markUsed = (el) => used.add(inputs.indexOf(el));
            // 1) 显式 KV（name/value）→ 按字段名匹配
            for (const f of fields) {
                if (!f.name || f.value === undefined) continue;
                const el = inputs.find((x, i) => !used.has(i) && matchFieldName(x, f.name));
                if (el) {
                    markUsed(el);
                    try {
                        setFieldValue(el, f.value);
                        highlightElement(el);
                        filled.push(`${f.name}="${f.value}"`);
                    } catch (e) {
                        errors.push(`${f.name}: ${e.message}`);
                    }
                } else {
                    errors.push(`未找到字段「${f.name}」`);
                }
            }
            // 2) raw 段 → 先用 DOM 字段名前缀拆分，拆不动则顺序补位
            for (const f of fields) {
                if (!f.raw) continue;
                const split = splitRawByFieldName(inputs.filter((x, i) => !used.has(i)), f.raw);
                if (split) {
                    const el = split.el;
                    if (!used.has(inputs.indexOf(el))) {
                        markUsed(el);
                        try {
                            setFieldValue(el, split.value);
                            highlightElement(el);
                            filled.push(`${split.name}="${split.value}"`);
                        } catch (e) {
                            errors.push(`${split.name}: ${e.message}`);
                        }
                        continue;
                    }
                }
                // 顺序补位：填下一个未用字段
                let cursor = 0;
                while (used.has(cursor) && cursor < inputs.length) cursor++;
                if (cursor >= inputs.length) {
                    errors.push(`表单已填满，多余内容「${f.raw}」未处理`);
                    break;
                }
                const el = inputs[cursor];
                const nm = fieldNames(el)[0] || `字段${cursor + 1}`;
                markUsed(el);
                try {
                    setFieldValue(el, f.raw);
                    highlightElement(el);
                    filled.push(`${nm}="${f.raw}"`);
                } catch (e) {
                    errors.push(`${nm}: ${e.message}`);
                }
            }
            if (!filled.length) {
                return { ok: false, error: errors[0] || '表单填写失败', data: { errors } };
            }
            return {
                ok: true,
                data: { filled, errors, total: inputs.length },
                hint: errors.length ? `部分字段未匹配：${errors.join('；')}` : `已填写 ${filled.length}/${inputs.length} 个字段`,
            };
        },
        submitForm: async () => {
            const scope = pickBestForm();
            if (scope === document) {
                // 页面无 form：找提交类按钮
                const btns = [...document.querySelectorAll('button[type=submit], input[type=submit], [role=button]')].filter(isVisible);
                const hit = btns.find((b) => /提交|保存|确认|确定|登录|注册|submit|save|confirm/i.test(b.textContent || b.value || ''));
                if (!hit) return { ok: false, error: '页面中没有找到表单或提交按钮' };
                highlightElement(hit);
                fireClick(hit);
                return { ok: true, data: { submitted: (hit.textContent || hit.value || '').trim() || '提交按钮' } };
            }
            // 有 form：优先 requestSubmit（触发原生校验与 submit 事件）
            if (typeof scope.requestSubmit === 'function') {
                try {
                    scope.requestSubmit();
                    return { ok: true, data: { submitted: 'form.requestSubmit()' } };
                } catch {
                    // 校验失败等情况，回退到点击提交按钮
                }
            }
            const btns = [...scope.querySelectorAll('button[type=submit], button, input[type=submit]')].filter(isVisible);
            if (btns.length) {
                const hit = btns[0];
                highlightElement(hit);
                fireClick(hit);
                return { ok: true, data: { submitted: (hit.textContent || hit.value || '').trim() || '提交按钮' } };
            }
            scope.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            return { ok: true, data: { submitted: 'submit 事件' } };
        },
        clearForm: async () => {
            const scope = pickBestForm();
            const inputs = getFormInputs(scope);
            if (!inputs.length) return { ok: false, error: '页面中没有找到表单字段' };
            let cleared = 0;
            for (const el of inputs) {
                if (el.tagName === 'SELECT') {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
                    if (setter) setter.call(el, '');
                    else el.value = '';
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (el.type === 'checkbox' || el.type === 'radio') {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set;
                    if (setter) setter.call(el, false);
                    else el.checked = false;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
                    if (nativeSetter) nativeSetter.call(el, '');
                    else el.value = '';
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
                cleared++;
            }
            return { ok: true, data: { cleared } };
        },
        detectForm: async () => {
            const scope = pickBestForm();
            const inputs = getFormInputs(scope);
            const fields = inputs.map((el, i) => ({
                index: i,
                name: fieldNames(el)[0] || el.name || el.id || el.placeholder || `字段${i + 1}`,
                names: fieldNames(el).slice(0, 3),
                type: el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : el.type || 'text',
                required: !!el.required,
                placeholder: el.placeholder || '',
                current: el.value || '',
            }));
            return { ok: true, data: { formCount: document.querySelectorAll('form').length, fieldCount: fields.length, fields } };
        },
        // —— 等待 ——
        wait: async (ms) => {
            await new Promise((r) => setTimeout(r, ms || 1000));
            return { ok: true, data: { waited: ms || 1000 } };
        },
    };
}

const UniversalPageAgent = ({
    onExecute,
    onAgentExecute,
    systemPrompt = '你是一个智能助手，可以帮用户操作页面。支持：点击、输入、滚动、分析、查找元素等。',
    className = '',
    iframeRef: externalIframeRef,
    mode: externalMode,
    router,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [mode, setMode] = useState(externalMode || 'direct');
    const [statusMsg, setStatusMsg] = useState('');
    const internalIframeRef = useRef(null);
    const agentIdRef = useRef(0);
    const pendingHandlersRef = useRef(new Map());

    const activeIframeRef = externalIframeRef || internalIframeRef;

    const sendBridgeMessage = useCallback((command, payload = {}) => {
        if (!activeIframeRef?.current?.contentWindow) {
            return Promise.reject(new Error('iframe 未就绪'));
        }
        const id = ++agentIdRef.current;
        const msg = { protocol: AGENT_PROTOCOL, id, command, payload };
        activeIframeRef.current.contentWindow.postMessage(msg, '*');
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                pendingHandlersRef.current.delete(id);
                resolve({ ok: false, error: '超时（5s）' });
            }, 5000);
            pendingHandlersRef.current.set(id, (result) => {
                clearTimeout(timer);
                pendingHandlersRef.current.delete(id);
                resolve(result);
            });
        });
    }, [activeIframeRef]);

    useEffect(() => {
        if (mode === 'direct') {
            setStatusMsg('直接模式：操作当前页面 DOM');
        } else {
            setStatusMsg('iframe 模式：等待连接...');
        }
    }, [mode]);

    useEffect(() => {
        const handler = (ev) => {
            if (!ev.data || ev.data.protocol !== AGENT_PROTOCOL) return;
            if (ev.data.type === 'ready') {
                setStatusMsg('iframe 已连接');
                return;
            }
            const resolve = pendingHandlersRef.current.get(ev.data.id);
            if (resolve) resolve(ev.data.result);
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const bridge = useMemo(() => {
        if (mode !== 'direct') {
            return {
            findAndClick: async (target) => {
                try {
                    const res = await sendBridgeMessage('find', { text: target });
                    if (!res.ok || !res.data?.length) return { ok: false, error: `未找到「${target}」` };
                    return sendBridgeMessage('act', { action: 'click', elementId: res.data[0].elementId });
                } catch (e) { return { ok: false, error: e.message }; }
            },
            findAndType: async (target, value) => {
                try {
                    const res = await sendBridgeMessage('find', { text: target, types: ['input', 'textarea', 'select'] });
                    if (!res.ok || !res.data?.length) return { ok: false, error: `未找到输入框「${target}」` };
                    return sendBridgeMessage('act', { action: 'type', elementId: res.data[0].elementId, value });
                } catch (e) { return { ok: false, error: e.message }; }
            },
            scroll: async (direction) => {
                try { return await sendBridgeMessage('scroll', { direction }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            analyze: async () => {
                try { return await sendBridgeMessage('analyze'); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            findElements: async (keyword) => {
                try { return await sendBridgeMessage('find', { text: keyword }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            findAndHover: async (target) => {
                try {
                    const res = await sendBridgeMessage('find', { text: target });
                    if (!res.ok || !res.data?.length) return { ok: false, error: `未找到「${target}」` };
                    return sendBridgeMessage('act', { action: 'hover', elementId: res.data[0].elementId });
                } catch (e) { return { ok: false, error: e.message }; }
            },
            reload: async () => {
                try { return await sendBridgeMessage('reload'); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            goBack: async () => {
                try { return await sendBridgeMessage('navigate', { direction: 'back' }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            goForward: async () => {
                try { return await sendBridgeMessage('navigate', { direction: 'forward' }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            navigate: async (target) => {
                try { return await sendBridgeMessage('navigate', { target }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            search: async (value) => {
                try { return await sendBridgeMessage('search', { value }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            press: async (key) => {
                try { return await sendBridgeMessage('act', { action: 'press', key }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            select: async (target) => {
                try { return await sendBridgeMessage('act', { action: 'select', target }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            check: async (target) => {
                try { return await sendBridgeMessage('act', { action: 'check', target }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            wait: async (ms) => {
                try { return await sendBridgeMessage('wait', { ms }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            fillForm: async (fields) => {
                try { return await sendBridgeMessage('form', { action: 'fill', fields }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            submitForm: async () => {
                try { return await sendBridgeMessage('form', { action: 'submit' }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            clearForm: async () => {
                try { return await sendBridgeMessage('form', { action: 'clear' }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
            detectForm: async () => {
                try { return await sendBridgeMessage('form', { action: 'detect' }); }
                catch (e) { return { ok: false, error: e.message }; }
            },
        };
        }
        return createDirectBridge(router);
    }, [mode, router, sendBridgeMessage]);

    /** 核心执行逻辑：解析并执行一段指令文本 */
    const runTask = useCallback(async (taskText, source = 'input') => {
        const task = (taskText || '').trim();
        if (!task) return;
        setIsLoading(true);
        setInputValue('');
        setStatusMsg(`🔄 正在解析「${task.length > 20 ? task.slice(0, 20) + '…' : task}」...`);

        try {
            const agent = new SimplePageAgent({
                systemPrompt,
                mode,
            });

            const { actions, results } = await agent.execute(task, bridge);
            const successCount = results.filter((r) => r.result.ok).length;
            const failCount = results.length - successCount;

            const summary =
                failCount === 0 && actions.length > 0
                    ? `✓ 全部成功 · ${actions.length} 个动作`
                    : failCount > 0 && successCount === 0
                      ? `✗ 全部失败 · ${actions.length} 个动作`
                      : `部分成功 · ${successCount}/${actions.length}`;

            setHistory((prev) => [
                {
                    task,
                    actions,
                    results,
                    summary,
                    timestamp: new Date().toLocaleTimeString(),
                    fromVoice: source === 'voice',
                    id: Date.now() + Math.random(),
                },
                ...prev,
            ]);

            onExecute?.(task, { actions, results, successCount, failCount });
            onAgentExecute?.(task, { actions, results, successCount, failCount });
            setStatusMsg(
                failCount === 0 && successCount > 0
                    ? `✅ 完成：${summary}`
                    : successCount === 0 && failCount > 0
                      ? `❌ 失败：${summary}`
                      : `⚠️ 完成：${summary}`,
            );
        } catch (error) {
            console.error('执行错误:', error);
            setHistory((prev) => [
                { task, error: error.message, timestamp: new Date().toLocaleTimeString(), fromVoice: source === 'voice', id: Date.now() + Math.random() },
                ...prev,
            ]);
            setStatusMsg(`❌ 错误：${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [onExecute, onAgentExecute, systemPrompt, bridge, mode]);

    const executeTask = useCallback(async () => {
        if (!inputValue.trim()) return;
        await runTask(inputValue);
    }, [inputValue, runTask]);

    /** 语音识别：结果填入输入框并自动执行 */
    const whisper = useWhisperRecorder({
        onResult: (text) => {
            const normalized = normalizeVoiceText(text);
            setInputValue(normalized);
            setStatusMsg(`🎙️ 识别：${normalized}${normalized !== text ? `（已修正：${text}）` : ''}`);
            // 识别完成后自动执行（标记来源为 voice）
            setTimeout(() => runTask(normalized, 'voice'), 120);
        },
        onError: (e) => {
            setStatusMsg(`❌ 语音识别失败：${e?.message || e}`);
        },
    });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeTask();
        }
    };

    const toggleMode = () => {
        setMode((m) => (m === 'direct' ? 'iframe' : 'direct'));
        setHistory([]);
    };

    // —— 统计（成功率、语音次数等）—— //
    const stats = useMemo(() => {
        let totalActions = 0;
        let successActions = 0;
        let failActions = 0;
        let voiceCount = 0;
        for (const item of history) {
            if (item.fromVoice) voiceCount += 1;
            if (item.results) {
                for (const r of item.results) {
                    totalActions += 1;
                    if (r.result?.ok) successActions += 1;
                    else failActions += 1;
                }
            }
        }
        const successRate = totalActions > 0 ? Math.round((successActions / totalActions) * 100) : null;
        return { total: history.length, totalActions, successActions, failActions, voiceCount, successRate };
    }, [history]);

    const handleClearHistory = () => setHistory([]);
    const handleCopy = (task) => {
        navigator.clipboard?.writeText(task).then(
            () => setStatusMsg(`📋 已复制「${task}」`),
            () => setStatusMsg('❌ 复制失败'),
        );
    };
    const handleRedo = (task) => runTask(task, 'redo');

    const formatActionIcon = (type) => {
        const map = { navigate: '🧭', click: '👆', type: '⌨️', search: '🔎', scroll: '📜', analyze: '🔍', find: '🔎', hover: '🖱️', select: '📋', check: '✅', press: '🔘', wait: '⏳', reload: '🔄', back: '⬅️', forward: '➡️', 'form-fill': '📝', 'form-submit': '📮', 'form-clear': '🧹', 'form-detect': '🧾', unknown: '❓' };
        return map[type] || '⚡';
    };

    const formatActionText = (action) => {
        switch (action.type) {
            case 'navigate': return `跳转到「${action.target}」`;
            case 'click': return `点击「${action.target}」`;
            case 'type': return `在「${action.target || '输入框'}」输入「${action.value}」`;
            case 'search': return `搜索「${action.value}」`;
            case 'scroll': return `滚动到${{ top: '顶部', bottom: '底部', up: '向上', down: '向下' }[action.direction] || action.direction}`;
            case 'analyze': return '分析页面';
            case 'find': return `查找「${action.target}」`;
            case 'hover': return `悬停在「${action.target}」`;
            case 'select': return `选择「${action.target}」`;
            case 'check': return `勾选「${action.target}」`;
            case 'press': return `按下 ${action.key}`;
            case 'form-fill': {
                const f = action.fields || [];
                if (!f.length) return '填写表单（自动检测字段）';
                const names = f.map((x) => x.name || x.raw).filter(Boolean).slice(0, 3).join('、');
                return `填写表单 ${f.length} 个字段${names ? `（${names}…）` : ''}`;
            }
            case 'form-submit': return '提交表单';
            case 'form-clear': return '清空表单';
            case 'form-detect': return '检测表单';
            case 'wait': return `等待 ${action.ms || 1000}ms`;
            case 'reload': return '刷新页面';
            case 'back': return '后退';
            case 'forward': return '前进';
            default: return action.raw || '未知操作';
        }
    };

    return (
        <div className={`universal-page-agent ${className}`}>
            <div className="agent-header">
                <div className="agent-title">
                    <span>🤖 AI Agent 控制台</span>
                    <span className="agent-title-pulse" title="在线" />
                </div>
                <div className="agent-header-actions">
                    <span className={`agent-mode-badge ${mode}`}>{mode === 'direct' ? '直接模式' : 'iframe 模式'}</span>
                    <button className="agent-mode-toggle" onClick={toggleMode}>切换模式</button>
                </div>
            </div>

            <div className="agent-stats-bar">
                <span className="agent-stat-chip total">执行 <strong>{stats.total}</strong> 次</span>
                <span className="agent-stat-chip success">成功 <strong>{stats.successActions}</strong></span>
                {stats.failActions > 0 && <span className="agent-stat-chip fail">失败 <strong>{stats.failActions}</strong></span>}
                {stats.voiceCount > 0 && <span className="agent-stat-chip voice">语音 <strong>{stats.voiceCount}</strong></span>}
                {stats.successRate != null && (
                    <span className="agent-stat-chip" style={{ background: stats.successRate >= 90 ? '#ecfdf5' : stats.successRate >= 60 ? '#fffbeb' : '#fef2f2' }}>
                        成功率 <strong>{stats.successRate}%</strong>
                    </span>
                )}
                <span className="agent-stat-spacer" />
                {history.length > 0 && (
                    <button className="agent-clear-btn" onClick={handleClearHistory} title="清空历史">🗑 清空</button>
                )}
            </div>

            <div className={`agent-status-msg ${statusMsg.startsWith('✅') ? 'is-success' : statusMsg.startsWith('❌') ? 'is-error' : ''}`}>{statusMsg}</div>

            {mode === 'iframe' && (
                <div className="agent-iframe-config">
                    <input type="text" placeholder="嵌入页面地址（iframe 模式）" className="agent-iframe-input" />
                    <span className="agent-iframe-hint">iframe 模式下需配置目标页面地址</span>
                </div>
            )}

            <div className="agent-history">
                {history.length === 0 && (
                    <div className="agent-empty-hint">
                        <div className="agent-empty-icon">🪄</div>
                        <div className="agent-empty-title">开始你的第一条指令</div>
                        <div className="agent-empty-sub">
                            试试「点击登录按钮」「跳转到首页」「向下滚动」<br />
                            或「填写表单：姓名张三，邮箱a@b.com」「提交表单」<br />
                            也可以点击下方的快捷指令，或点 🎤 语音输入
                        </div>
                    </div>
                )}
                {history.map((item) => {
                    const successCount = item.results?.filter((r) => r.result?.ok).length || 0;
                    const failCount = (item.results?.length || 0) - successCount;
                    const badgeCls = item.error ? 'all-fail' : failCount === 0 && successCount > 0 ? 'all-ok' : 'partial';
                    const badgeText = item.error ? '失败' : failCount === 0 && successCount > 0 ? `✓ ${successCount}` : `${successCount}/${successCount + failCount}`;
                    return (
                        <div key={item.id || item.timestamp} className={`agent-history-item ${item.error ? 'has-error' : ''} ${item.fromVoice ? 'is-voice' : ''}`}>
                            <div className="agent-history-actions">
                                <button className="agent-history-action-btn" title="复制指令" onClick={() => handleCopy(item.task)}>📋</button>
                                <button className="agent-history-action-btn" title="重新执行" onClick={() => handleRedo(item.task)}>🔁</button>
                            </div>
                            <div className="agent-history-head">
                                <span className="agent-history-task">📝 {item.task}</span>
                                <div className="agent-history-meta">
                                    <span className={`agent-history-badge ${badgeCls}`}>{badgeText}</span>
                                    <span className="agent-history-time">{item.timestamp}</span>
                                </div>
                            </div>
                            {item.error ? (
                                <div className="agent-error-msg">⚠️ {item.error}</div>
                            ) : (
                                <>
                                    <div className="agent-history-summary">{item.summary}</div>
                                    <div className="agent-action-list">
                                        {item.actions?.map((a, i) => (
                                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <span className={`agent-action ${item.results[i]?.result?.ok ? 'ok' : 'fail'}`} title={item.results[i]?.result?.ok ? '成功' : item.results[i]?.result?.error || '失败'}>
                                                    <span className="agent-action-dot" />
                                                    <span className="agent-action-icon">{formatActionIcon(a.type)}</span>
                                                    <span className="agent-action-text">{formatActionText(a)}</span>
                                                    {!item.results[i]?.result?.ok && <span className="agent-action-fail-reason">{item.results[i]?.result?.error || '失败'}</span>}
                                                </span>
                                                {i < item.actions.length - 1 && <span className="agent-action-arrow">→</span>}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {(whisper.modelState === 'loading' || whisper.recording || whisper.recognizing) && (
                <div className={`agent-voice-status ${whisper.recording ? 'recording' : ''} ${whisper.recognizing ? 'recognizing' : ''}`}>
                    {whisper.recording && (
                        <>
                            <span className="agent-voice-bars"><span /><span /><span /><span /><span /></span>
                            <span className="agent-voice-status-text">🎙️ 正在录音…说完点 ⏹ 停止</span>
                        </>
                    )}
                    {whisper.recognizing && <span className="agent-voice-status-text">⏳ 正在本地识别语音（不出本机）</span>}
                    {whisper.modelState === 'loading' && (
                        <>
                            <span className="agent-voice-status-text">⏬ 首次加载语音模型（仅一次，约 40MB）</span>
                            <span className="agent-voice-status-progress">
                                <span className="agent-voice-status-progress-bar" style={{ width: `${whisper.modelProgress ?? 0}%` }} />
                            </span>
                            <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{whisper.modelProgress ?? 0}%</span>
                        </>
                    )}
                </div>
            )}

            <div className="agent-input-row">
                <button
                    className={`agent-mic-btn ${whisper.recording ? 'recording' : ''} ${whisper.recognizing ? 'recognizing' : ''}`}
                    onClick={whisper.recording ? whisper.stop : whisper.start}
                    disabled={isLoading || !whisper.supported || whisper.recognizing}
                    title={!whisper.supported ? '当前浏览器不支持麦克风录音' : whisper.recording ? '停止录音并开始识别' : '🎤 语音控制页面：说指令自动执行（点击/跳转/滚动/输入）'}
                >
                    {whisper.recognizing ? '⏳' : whisper.recording ? '⏹' : '🎤'}
                </button>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入或粘贴指令…Enter 执行 · Shift+Enter 换行 · 也可点 🎤 语音"
                    disabled={isLoading}
                    rows={2}
                    className="agent-input"
                />
                <button
                    onClick={executeTask}
                    disabled={isLoading || !inputValue.trim()}
                    className="agent-exec-btn"
                >
                    {isLoading ? <><span className="agent-exec-spinner" />执行中</> : <>▶ 执行</>}
                </button>
            </div>

            <div className="agent-shortcuts">
                <span className="agent-shortcut-label">⚡ 一键执行</span>
                {[
                    { label: '分析页面', emoji: '🔍', tag: 'info', cls: 'tag-info' },
                    { label: '向下滚动', emoji: '📜', tag: '操作', cls: 'tag-action' },
                    { label: '跳到首页', emoji: '🧭', tag: '导航', cls: 'tag-nav' },
                    { label: '填写表单', emoji: '📝', tag: '表单', cls: 'tag-form' },
                    { label: '提交表单', emoji: '📮', tag: '表单', cls: 'tag-form' },
                    { label: '搜索人工智能', emoji: '🔎', tag: '操作', cls: 'tag-action' },
                    { label: '刷新页面', emoji: '🔄', tag: '信息', cls: 'tag-info' },
                    { label: '返回上一页', emoji: '⬅️', tag: '导航', cls: 'tag-nav' },
                ].map((s) => (
                    <button key={s.label} className="agent-shortcut" onClick={() => runTask(s.label)} title={`直接执行「${s.label}」`}>
                        <span className="agent-shortcut-emoji">{s.emoji}</span>
                        <span>{s.label}</span>
                        <span className={`agent-shortcut-tag ${s.cls}`}>{s.tag}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default UniversalPageAgent;