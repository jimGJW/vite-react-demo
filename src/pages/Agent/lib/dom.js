/* =====================================================================
 * DOM 操作层（纯浏览器 API，无 React、无指令解析）
 * ---------------------------------------------------------------------
 * 页面自动化要绕过 React 的受控组件：直接改 el.value 不会触发 onChange，
 * 必须拿到原型上的原生 setter 再 call；且不同标签的 setter 在不同原型上
 * （HTMLInputElement / HTMLTextAreaElement / HTMLSelectElement），
 * 拿错原型会抛 Illegal invocation——这就是下面若干分支存在的原因。
 * ===================================================================== */

/** 不可填写的输入类型（hidden / 各类按钮 / 文件选择都不应被自动化填写） */
const NON_FILLABLE_TYPES = ['hidden', 'submit', 'button', 'reset', 'image', 'file']

/** 「第一个可见输入框」的排除集合：与表单字段集合一致，但不排除 image（它是图片提交按钮，本就不会被排到首位） */
const SKIP_INPUT_TYPES = ['hidden', 'submit', 'button', 'reset', 'file']

/** 元素是否可见（未被隐藏 / 未禁用 / 有实际尺寸） */
export function isVisible(el) {
    if (!el) return false
    if (el.disabled) return false
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return false
    return true
}

/**
 * 写入值并派发 input/change 事件。
 *
 * 关键点：必须按标签取对应原型上的原生 value setter，
 * 否则 React 受控组件收不到变更（直接赋值会被 React 的 value 跟踪器忽略）。
 */
export function setNativeValue(el, value) {
    const proto =
        el.tagName === 'SELECT'
            ? window.HTMLSelectElement.prototype
            : el.tagName === 'TEXTAREA'
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (nativeSetter) nativeSetter.call(el, value)
    else el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
}

/** 派发一次完整的鼠标点击序列（mousedown → mouseup → click） */
export function fireClick(el) {
    el.focus()
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
    el.click()
}

/** 派发一次完整的按键序列（keydown → keypress → keyup） */
export function dispatchKey(el, key) {
    el.focus()
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    el.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true, cancelable: true }))
    el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }))
}

/** 短暂高亮目标元素，让用户看清自动化操作了哪里 */
export function highlightElement(el) {
    if (!el) return
    const orig = { outline: el.style.outline, backgroundColor: el.style.backgroundColor, transition: el.style.transition }
    el.style.outline = '2px solid #667eea'
    el.style.backgroundColor = 'rgba(102,126,234,0.15)'
    setTimeout(() => {
        el.style.outline = orig.outline
        el.style.backgroundColor = orig.backgroundColor
    }, 800)
}

/** 查找第一个可见的输入框（用于"输入XX"未指定目标时） */
export function findFirstVisibleInput() {
    const selectors = [
        'input[type=search]', 'input[type=text]', 'input:not([type])', 'input[type=url]',
        'input[type=email]', 'input[type=tel]', 'input[type=number]', 'textarea', 'input[type=password]',
    ]
    for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
            const type = (el.getAttribute('type') || 'text').toLowerCase()
            if (SKIP_INPUT_TYPES.includes(type)) continue
            if (isVisible(el)) return el
        }
    }
    return null
}

/** 收集范围内可填写的表单字段 */
export function getFormInputs(scope) {
    const root = scope || document
    return [...root.querySelectorAll('input, textarea, select')].filter((el) => {
        if (!isVisible(el)) return false
        const t = (el.getAttribute('type') || 'text').toLowerCase()
        return !NON_FILLABLE_TYPES.includes(t)
    })
}

/** 获取一个字段的所有候选名称（label / placeholder / aria-label / name / id） */
export function fieldNames(el) {
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

/** 关键词是否命中字段（忽略冒号/星号/空白后做双向包含匹配） */
export function matchFieldName(input, keyword) {
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

/** 设置单个字段的值（select / checkbox / 文本三类分别处理） */
export function setFieldValue(el, value) {
    if (el.tagName === 'SELECT') {
        const hit = [...el.options].find(
            (o) => o.text.trim() === String(value).trim() || o.value === String(value).trim(),
        )
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
    const proto =
        el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (nativeSetter) nativeSetter.call(el, String(value))
    else el.value = String(value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
}

/** 定位最佳表单：可见且字段最多的 <form>；页面无 form 或表单无字段时退化到整个文档 */
export function pickBestForm() {
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

/** 用 DOM 字段名对无分隔符的原始段做前缀拆分：如"电话138" → {name:'电话', value:'138', el} */
export function splitRawByFieldName(inputs, raw) {
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

const DEFAULT_TEXT_SELECTORS = [
    'button', 'a', 'input', 'textarea', 'select',
    '[role=button]', '[role=link]', 'h1', 'h2', 'h3', 'h4', 'label',
]

/**
 * 元素登记表：给定位到的元素分配稳定 id 并缓存引用。
 *
 * 之所以要登记：postMessage 只能传字符串，iframe 桥接与直接模式
 * 都靠 elementId 回查真实 DOM 节点，不能直接传节点引用。
 */
export function createElementRegistry() {
    const nextId = { current: 1 }
    const elementMap = new Map()

    function register(el) {
        const elId = `agent-el-${nextId.current++}`
        el.setAttribute('data-agent-id', elId)
        elementMap.set(elId, el)
        return elId
    }

    /**
     * 按文本查找元素并登记。
     * 关键词为空时只返回可见的输入类元素（用于"输入"未指定目标的场景）。
     */
    function findElementsByText(text, types) {
        const selectors = types || DEFAULT_TEXT_SELECTORS
        const results = []
        const seen = new Set()
        const keyword = (text || '').trim().toLowerCase()
        for (const sel of selectors) {
            for (const el of document.querySelectorAll(sel)) {
                const textContent = (
                    el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || ''
                ).trim()
                if (keyword === '') {
                    if (!isVisible(el) || !['input', 'textarea', 'select'].includes(el.tagName.toLowerCase())) continue
                } else if (!textContent.toLowerCase().includes(keyword)) {
                    continue
                }
                if (seen.has(el)) continue
                seen.add(el)
                const elId = register(el)
                const rect = el.getBoundingClientRect()
                results.push({
                    elementId: elId,
                    tag: el.tagName.toLowerCase(),
                    text: textContent.substring(0, 80),
                    type: el.type || '',
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                })
            }
        }
        return results
    }

    return { nextId, elementMap, register, findElementsByText }
}
