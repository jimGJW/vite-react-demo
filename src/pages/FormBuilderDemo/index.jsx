import { useState } from 'react'
import { Form, Button, message, Tabs, Switch, Select, Input, Checkbox, Empty } from 'antd'
import { Slider, Rate, TimePicker } from 'antd'
import FormBuilder from 'antd-form-builder'
import './index.scss'

import { WIDGET_OPTIONS, PRESETS, stringifyMeta } from './components/formPresets.js'

function FormBuilderDemo() {
  const [form] = Form.useForm()
  const [activePreset, setActivePreset] = useState('login')
  const [meta, setMeta] = useState(PRESETS.login.meta)
  const [jsonText, setJsonText] = useState(() => stringifyMeta(PRESETS.login.meta))
  const [jsonError, setJsonError] = useState('')
  const [viewMode, setViewMode] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [result, setResult] = useState(null)

  // 可视化添加字段的受控状态
  const [draft, setDraft] = useState({ key: '', label: '', widget: 'input', required: false, placeholder: '', options: '' })
  const [draftError, setDraftError] = useState('')

  const applyMeta = (next) => {
    setMeta(next)
    setJsonText(stringifyMeta(next))
    setJsonError('')
    setResult(null)
    form.resetFields()
    if (next.initialValues) form.setFieldsValue(next.initialValues)
  }

  const switchPreset = (key) => {
    setActivePreset(key)
    applyMeta(PRESETS[key].meta)
  }

  const applyJson = () => {
    let obj
    try {
      obj = JSON.parse(jsonText)
    } catch (e) {
      setJsonError(`JSON 解析失败：${e.message}`)
      return
    }
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.fields)) {
      setJsonError('配置结构错误：必须是对象且包含 fields 数组')
      return
    }
    setActivePreset('') // 手动编辑后脱离预设高亮
    applyMeta(obj)
    message.success('配置已应用')
  }

  const formatJson = () => {
    try {
      setJsonText(stringifyMeta(JSON.parse(jsonText)))
      setJsonError('')
    } catch (e) {
      setJsonError(`JSON 解析失败：${e.message}`)
    }
  }

  // ---- 可视化编辑：直接操作 meta.fields ----
  const updateFields = (fields) => applyMeta({ ...meta, fields })

  const moveField = (index, dir) => {
    const fields = [...meta.fields]
    const target = index + dir
    if (target < 0 || target >= fields.length) return
    ;[fields[index], fields[target]] = [fields[target], fields[index]]
    updateFields(fields)
  }

  const removeField = (index) => {
    updateFields(meta.fields.filter((_, i) => i !== index))
  }

  const addField = () => {
    const key = draft.key.trim()
    if (!/^[a-zA-Z][\w.-]*$/.test(key)) {
      setDraftError('key 必填，字母开头，可含数字/下划线/点号')
      return
    }
    if (meta.fields.some((f) => (f.key || f.name) === key)) {
      setDraftError(`字段 "${key}" 已存在`)
      return
    }
    const field = { key }
    if (draft.label.trim()) field.label = draft.label.trim()
    if (draft.widget !== 'input') field.widget = draft.widget
    if (draft.required) field.required = true
    if (draft.placeholder.trim()) field.placeholder = draft.placeholder.trim()
    if (['select', 'radio-group', 'checkbox-group'].includes(draft.widget)) {
      const opts = draft.options
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean)
      if (opts.length) field.options = opts
    }
    updateFields([...meta.fields, field])
    setDraft({ key: '', label: '', widget: 'input', required: false, placeholder: '', options: '' })
    setDraftError('')
    message.success(`已添加字段 "${key}"`)
  }

  const onFinish = (values) => {
    setResult(values)
    message.success('表单提交成功，结果已展示在下方')
  }

  const presetChips = Object.entries(PRESETS).map(([key, p]) => (
    <button
      key={key}
      type="button"
      className={`fb-preset-chip ${activePreset === key ? 'active' : ''}`}
      onClick={() => switchPreset(key)}
    >
      {p.label}
    </button>
  ))

  const widgetTable = WIDGET_OPTIONS.map((w) => (
    <span key={w.value} className="fb-widget-tag">
      {w.label}
    </span>
  ))

  return (
    <div className="fb-page">
      <header className="fb-header">
        <div className="fb-title">
          <span className="fb-title-icon">🧩</span>
          <h1>可配置化表单</h1>
        </div>
        <p className="fb-subtitle">
          基于 <code>antd-form-builder</code> 的配置驱动表单：左侧编辑 JSON 或可视化调整字段，右侧实时预览渲染效果
        </p>
        <div className="fb-presets">
          <span className="fb-presets-label">预设模板</span>
          {presetChips}
        </div>
      </header>

      <div className="fb-body">
        <section className="fb-panel fb-config">
          <h2 className="fb-panel-title">⚙️ 表单配置</h2>
          <Tabs
            defaultActiveKey="json"
            items={[
              {
                key: 'json',
                label: 'JSON 配置',
                children: (
                  <div className="fb-json">
                    <textarea
                      className="fb-json-textarea"
                      value={jsonText}
                      spellCheck={false}
                      onChange={(e) => {
                        setJsonText(e.target.value)
                        setJsonError('')
                      }}
                    />
                    {jsonError ? <div className="fb-json-error">⚠️ {jsonError}</div> : null}
                    <div className="fb-json-actions">
                      <Button type="primary" size="small" onClick={applyJson}>
                        应用配置
                      </Button>
                      <Button size="small" onClick={formatJson}>
                        格式化
                      </Button>
                      <span className="fb-json-hint">columns 控制列数；formItemLayout: [6,16] 控制标签占比（多列时设为 null）</span>
                    </div>
                  </div>
                ),
              },
              {
                key: 'visual',
                label: '可视化编辑',
                children: (
                  <div className="fb-visual">
                    <div className="fb-field-list">
                      {meta.fields.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无字段，请在下方添加" />
                      ) : (
                        meta.fields.map((f, i) => (
                          <div key={(f.key || f.name || '') + i} className="fb-field-row">
                            <span className="fb-field-index">{i + 1}</span>
                            <span className="fb-field-key">{f.key || (Array.isArray(f.name) ? f.name.join('.') : f.name)}</span>
                            <span className="fb-field-label">{f.label || '—'}</span>
                            <span className="fb-field-widget">{f.widget || 'input'}</span>
                            {f.required ? <span className="fb-field-required">必填</span> : null}
                            <span className="fb-field-ops">
                              <button type="button" title="上移" onClick={() => moveField(i, -1)} disabled={i === 0}>
                                ↑
                              </button>
                              <button
                                type="button"
                                title="下移"
                                onClick={() => moveField(i, 1)}
                                disabled={i === meta.fields.length - 1}
                              >
                                ↓
                              </button>
                              <button type="button" title="删除" className="del" onClick={() => removeField(i)}>
                                ✕
                              </button>
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="fb-add-field">
                      <h3 className="fb-add-title">＋ 添加字段</h3>
                      <div className="fb-add-grid">
                        <Input
                          size="small"
                          placeholder="key（如 phone）"
                          value={draft.key}
                          onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                        />
                        <Input
                          size="small"
                          placeholder="label（如 手机号）"
                          value={draft.label}
                          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                        />
                        <Select
                          size="small"
                          value={draft.widget}
                          options={WIDGET_OPTIONS}
                          onChange={(v) => setDraft({ ...draft, widget: v })}
                        />
                        <Input
                          size="small"
                          placeholder="placeholder（可选）"
                          value={draft.placeholder}
                          onChange={(e) => setDraft({ ...draft, placeholder: e.target.value })}
                        />
                        {['select', 'radio-group', 'checkbox-group'].includes(draft.widget) ? (
                          <Input
                            size="small"
                            className="fb-add-options"
                            placeholder="选项，用逗号分隔（如 男,女）"
                            value={draft.options}
                            onChange={(e) => setDraft({ ...draft, options: e.target.value })}
                          />
                        ) : null}
                        <label className="fb-add-required">
                          <Checkbox checked={draft.required} onChange={(e) => setDraft({ ...draft, required: e.target.checked })} />
                          必填
                        </label>
                      </div>
                      {draftError ? <div className="fb-json-error">{draftError}</div> : null}
                      <Button type="primary" size="small" block onClick={addField}>
                        添加到表单
                      </Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </section>

        <section className="fb-panel fb-preview">
          <div className="fb-preview-bar">
            <h2 className="fb-panel-title">👁️ 实时预览</h2>
            <div className="fb-preview-switches">
              <label>
                <span>只读模式</span>
                <Switch size="small" checked={viewMode} onChange={setViewMode} />
              </label>
              <label>
                <span>整体禁用</span>
                <Switch size="small" checked={disabled} onChange={setDisabled} />
              </label>
            </div>
          </div>

          <Form form={form} onFinish={onFinish} disabled={disabled} className="fb-form">
            <FormBuilder meta={{ ...meta, viewMode, disabled }} form={form} viewMode={viewMode} />
            {!viewMode ? (
              <div className="fb-actions">
                <Button type="primary" htmlType="submit">
                  提交表单
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields()
                    if (meta.initialValues) form.setFieldsValue(meta.initialValues)
                    setResult(null)
                  }}
                >
                  重置
                </Button>
              </div>
            ) : null}
          </Form>

          <div className="fb-result">
            <h3 className="fb-result-title">📋 提交结果</h3>
            {result ? (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            ) : (
              <p className="fb-result-empty">提交表单后，这里将展示收集到的字段值（JSON）</p>
            )}
          </div>
        </section>
      </div>

      <section className="fb-panel fb-widgets">
        <h2 className="fb-panel-title">🧰 支持的 widget 类型</h2>
        <div className="fb-widget-tags">{widgetTable}</div>
        <p className="fb-widgets-note">
          ★ 号为通过 <code>FormBuilder.defineWidget()</code> 扩展注册的自定义 widget，其余为内置类型；此外任何 antd
          组件都可直接作为 <code>widget</code> 传入。
        </p>
      </section>
    </div>
  )
}

export default FormBuilderDemo
