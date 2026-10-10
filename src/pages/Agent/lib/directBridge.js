/* =====================================================================
 * 直接模式桥接层：在当前页面 DOM 上执行动作
 * ---------------------------------------------------------------------
 * 桥接层是一张「动作名 → async 函数」的表，由指令解析层分派调用。
 * 每个动作统一返回 { ok, data } 或 { ok: false, error }，
 * 便于 UI 逐个动作打勾/打叉。
 * ===================================================================== */

import {
    createElementRegistry,
    dispatchKey,
    fieldNames,
    findFirstVisibleInput,
    fireClick,
    getFormInputs,
    highlightElement,
    isVisible,
    matchFieldName,
    pickBestForm,
    setFieldValue,
    setNativeValue,
    splitRawByFieldName,
} from './dom.js'

/** 表单字段列表的通用序列化（fillForm 与 detectForm 共用） */
function describeFields(inputs) {
    return inputs.map((el, i) => ({
        index: i,
        name: fieldNames(el)[0] || el.name || el.id || el.placeholder || `字段${i + 1}`,
        names: fieldNames(el).slice(0, 3),
        type:
            el.tagName === 'SELECT'
                ? 'select'
                : el.tagName === 'TEXTAREA'
                  ? 'textarea'
                  : el.type || 'text',
        required: !!el.required,
        placeholder: el.placeholder || '',
        current: el.value || '',
    }))
}

export function createDirectBridge(router) {
    const { elementMap, register, findElementsByText } = createElementRegistry()

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
            // 未指定输入框时，自动定位第一个可见输入框
            let found
            if (target) {
                found = findElementsByText(target, ['input', 'textarea', 'select'])
                if (!found.length) {
                    // 目标文本可能匹配 placeholder / label
                    const byPlaceholder = findElementsByText(target, ['input', 'textarea'])
                    if (byPlaceholder.length) found = byPlaceholder
                }
            } else {
                const el = findFirstVisibleInput()
                if (el) {
                    found = [{ elementId: register(el), tag: el.tagName.toLowerCase() }]
                }
            }
            if (!found?.length) return { ok: false, error: `未找到输入框${target ? `「${target}」` : ''}` }
            const el = elementMap.get(found[0].elementId)
            if (!el) return { ok: false, error: '元素已不在DOM中' }
            highlightElement(el)
            el.focus()
            el.scrollIntoView({ block: 'center', behavior: 'smooth' })
            setNativeValue(el, value)
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
            const stats = {
                title: document.title,
                url: location.href,
                buttons: [],
                inputs: [],
                links: [],
                selects: [],
                forms: [],
                tables: [],
            }
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

        findElements: async (keyword) => ({ ok: true, data: findElementsByText(keyword) }),

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

        // —— 导航跳转（URL / 站内路由 / 页面内链接）——
        navigate: async (target) => {
            if (!target) return { ok: false, error: '跳转目标为空' }
            const t = target.trim()
            // 1. 绝对 URL
            if (/^(https?:)?\/\//i.test(t)) {
                location.href = t.startsWith('//') ? location.protocol + t : t
                return { ok: true, data: { navigated: t } }
            }
            // 2. 站内路径或锚点 → 优先使用 React Router（如果提供了 router prop）
            if (t.startsWith('/') || t.startsWith('#')) {
                if (router?.navigate) router.navigate(t)
                else location.href = t
                return { ok: true, data: { navigated: t } }
            }
            // 3. 中文关键词 → 页面内查找对应链接/按钮并点击
            const found = findElementsByText(t, ['a', '[role=link]', 'button', '[role=button]'])
            if (found.length) {
                const el = elementMap.get(found[0].elementId)
                if (el && isVisible(el)) {
                    highlightElement(el)
                    fireClick(el)
                    return { ok: true, data: { clicked: t } }
                }
            }
            // 4. 最后尝试作为站内路由路径
            if (router?.navigate) {
                router.navigate(t.startsWith('/') ? t : `/${t}`)
                return { ok: true, data: { navigated: t } }
            }
            return { ok: false, error: `无法跳转「${t}」：不是有效地址，页面内也未找到对应链接` }
        },

        // —— 搜索（定位搜索框输入并回车）——
        search: async (value) => {
            if (!value) return { ok: false, error: '搜索内容为空' }
            // 优先找搜索框
            const searchEls = [
                ...document.querySelectorAll(
                    'input[type=search], input[placeholder*="搜索" i], input[placeholder*="search" i], input[aria-label*="搜索" i], input[aria-label*="search" i]',
                ),
            ].filter(isVisible)
            let el = searchEls[0]
            if (!el) el = findFirstVisibleInput() // 退化：第一个可见输入框
            if (!el) return { ok: false, error: '页面中没有找到搜索框或输入框' }
            highlightElement(el)
            el.focus()
            el.scrollIntoView({ block: 'center', behavior: 'smooth' })
            setNativeValue(el, value)
            // 回车提交搜索
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }))
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }))
            // 部分页面用 form submit / 按钮触发，尝试提交
            const form = el.closest('form')
            if (form) {
                try {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
                } catch {
                    /* ignore */
                }
            } else {
                const btn = el.closest('div, form')?.querySelector('button[type=submit], button')
                if (btn) fireClick(btn)
            }
            return { ok: true, data: { searched: value } }
        },

        // —— 按键 ——
        press: async (key) => {
            const el = document.activeElement || document.body
            if (!el) return { ok: false, error: '没有可接收按键的元素' }
            highlightElement(el)
            dispatchKey(el, key)
            return { ok: true, data: { pressed: key } }
        },

        // —— 下拉选择 ——
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

        // —— 勾选复选框 ——
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

        // —— 表单填写 ——
        fillForm: async (fields) => {
            const scope = pickBestForm()
            const inputs = getFormInputs(scope)
            if (!inputs.length) return { ok: false, error: '页面中没有找到表单字段（input/select/textarea）' }
            // 未提供内容 → 检测并列出字段（引导用户如何填）
            if (!fields || !fields.length) {
                const list = describeFields(inputs)
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

            // 1) 显式 KV（name/value）→ 按字段名匹配
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

            // 2) raw 段 → 先用 DOM 字段名前缀拆分，拆不动则顺序补位
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
                // 顺序补位：填下一个未用字段
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

            if (!filled.length) return { ok: false, error: errors[0] || '表单填写失败', data: { errors } }
            return {
                ok: true,
                data: { filled, errors, total: inputs.length },
                hint: errors.length ? `部分字段未匹配：${errors.join('；')}` : `已填写 ${filled.length}/${inputs.length} 个字段`,
            }
        },

        submitForm: async () => {
            const scope = pickBestForm()
            if (scope === document) {
                // 页面无 form：找提交类按钮
                const btns = [...document.querySelectorAll('button[type=submit], input[type=submit], [role=button]')].filter(isVisible)
                const hit = btns.find((b) => /提交|保存|确认|确定|登录|注册|submit|save|confirm/i.test(b.textContent || b.value || ''))
                if (!hit) return { ok: false, error: '页面中没有找到表单或提交按钮' }
                highlightElement(hit)
                fireClick(hit)
                return { ok: true, data: { submitted: (hit.textContent || hit.value || '').trim() || '提交按钮' } }
            }
            // 有 form：优先 requestSubmit（触发原生校验与 submit 事件）
            if (typeof scope.requestSubmit === 'function') {
                try {
                    scope.requestSubmit()
                    return { ok: true, data: { submitted: 'form.requestSubmit()' } }
                } catch {
                    // 校验失败等情况，回退到点击提交按钮
                }
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
            const fields = describeFields(inputs)
            return { ok: true, data: { formCount: document.querySelectorAll('form').length, fieldCount: fields.length, fields } }
        },

        // —— 等待 ——
        wait: async (ms) => {
            await new Promise((r) => setTimeout(r, ms || 1000))
            return { ok: true, data: { waited: ms || 1000 } }
        },
    }
}
