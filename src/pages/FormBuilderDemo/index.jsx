import { useState } from 'react'
import { Form, Button, message, Tabs, Switch, Select, Input, Checkbox, Empty } from 'antd'
import FormBuilder from 'antd-form-builder'
import { useI18n } from '@i18n/index.js'
import './index.scss'

import { WIDGET_OPTIONS, PRESETS, stringifyMeta } from './components/formPresets.js'

const PRESET_LABEL_KEYS = {
  login: 'formbuilder.presetLogin',
  register: 'formbuilder.presetRegister',
  profile: 'formbuilder.presetProfile',
  survey: 'formbuilder.presetSurvey',
}

function FormBuilderDemo() {
  const { t } = useI18n()
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
      setJsonError(t('formbuilder.jsonParseError', { msg: e.message }))
      return
    }
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.fields)) {
      setJsonError(t('formbuilder.configStructError'))
      return
    }
    setActivePreset('') // 手动编辑后脱离预设高亮
    applyMeta(obj)
    message.success(t('formbuilder.configApplied'))
  }

  const formatJson = () => {
    try {
      setJsonText(stringifyMeta(JSON.parse(jsonText)))
      setJsonError('')
    } catch (e) {
      setJsonError(t('formbuilder.jsonParseError', { msg: e.message }))
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
      setDraftError(t('formbuilder.keyRule'))
      return
    }
    if (meta.fields.some((f) => (f.key || f.name) === key)) {
      setDraftError(t('formbuilder.fieldExists', { key }))
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
    message.success(t('formbuilder.fieldAdded', { key }))
  }

  const onFinish = (values) => {
    setResult(values)
    message.success(t('formbuilder.submitSuccess'))
  }

  const presetChips = Object.entries(PRESETS).map(([key]) => (
    <button
      key={key}
      type="button"
      className={`fb-preset-chip ${activePreset === key ? 'active' : ''}`}
      onClick={() => switchPreset(key)}
    >
      {t(PRESET_LABEL_KEYS[key])}
    </button>
  ))

  const widgetTable = WIDGET_OPTIONS.map((w) => (
    <span key={w.value} className="fb-widget-tag">
      {t(w.labelKey)}
    </span>
  ))

  return (
    <div className="fb-page">
      <header className="fb-header">
        <div className="fb-title">
          <span className="fb-title-icon">🧩</span>
          <h1>{t('formbuilder.title')}</h1>
        </div>
        <p className="fb-subtitle">
          {t('formbuilder.subtitle')}
        </p>
        <div className="fb-presets">
          <span className="fb-presets-label">{t('formbuilder.presetsLabel')}</span>
          {presetChips}
        </div>
      </header>

      <div className="fb-body">
        <section className="fb-panel fb-config">
          <h2 className="fb-panel-title">{t('formbuilder.panelConfig')}</h2>
          <Tabs
            defaultActiveKey="json"
            items={[
              {
                key: 'json',
                label: t('formbuilder.tabJson'),
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
                        {t('formbuilder.applyConfig')}
                      </Button>
                      <Button size="small" onClick={formatJson}>
                        {t('formbuilder.format')}
                      </Button>
                      <span className="fb-json-hint">{t('formbuilder.jsonHint')}</span>
                    </div>
                  </div>
                ),
              },
              {
                key: 'visual',
                label: t('formbuilder.tabVisual'),
                children: (
                  <div className="fb-visual">
                    <div className="fb-field-list">
                      {meta.fields.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('formbuilder.emptyFields')} />
                      ) : (
                        meta.fields.map((f, i) => (
                          <div key={(f.key || f.name || '') + i} className="fb-field-row">
                            <span className="fb-field-index">{i + 1}</span>
                            <span className="fb-field-key">{f.key || (Array.isArray(f.name) ? f.name.join('.') : f.name)}</span>
                            <span className="fb-field-label">{f.label || '—'}</span>
                            <span className="fb-field-widget">{f.widget || 'input'}</span>
                            {f.required ? <span className="fb-field-required">{t('formbuilder.required')}</span> : null}
                            <span className="fb-field-ops">
                              <button type="button" title={t('formbuilder.moveUp')} onClick={() => moveField(i, -1)} disabled={i === 0}>
                                ↑
                              </button>
                              <button
                                type="button"
                                title={t('formbuilder.moveDown')}
                                onClick={() => moveField(i, 1)}
                                disabled={i === meta.fields.length - 1}
                              >
                                ↓
                              </button>
                              <button type="button" title={t('formbuilder.remove')} className="del" onClick={() => removeField(i)}>
                                ✕
                              </button>
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="fb-add-field">
                      <h3 className="fb-add-title">{t('formbuilder.addFieldTitle')}</h3>
                      <div className="fb-add-grid">
                        <Input
                          size="small"
                          placeholder={t('formbuilder.phKey')}
                          value={draft.key}
                          onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                        />
                        <Input
                          size="small"
                          placeholder={t('formbuilder.phLabel')}
                          value={draft.label}
                          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                        />
                        <Select
                          size="small"
                          value={draft.widget}
                          options={WIDGET_OPTIONS.map((w) => ({ ...w, label: t(w.labelKey) }))}
                          onChange={(v) => setDraft({ ...draft, widget: v })}
                        />
                        <Input
                          size="small"
                          placeholder={t('formbuilder.phPlaceholder')}
                          value={draft.placeholder}
                          onChange={(e) => setDraft({ ...draft, placeholder: e.target.value })}
                        />
                        {['select', 'radio-group', 'checkbox-group'].includes(draft.widget) ? (
                          <Input
                            size="small"
                            className="fb-add-options"
                            placeholder={t('formbuilder.phOptions')}
                            value={draft.options}
                            onChange={(e) => setDraft({ ...draft, options: e.target.value })}
                          />
                        ) : null}
                        <label className="fb-add-required">
                          <Checkbox checked={draft.required} onChange={(e) => setDraft({ ...draft, required: e.target.checked })} />
                          {t('formbuilder.required')}
                        </label>
                      </div>
                      {draftError ? <div className="fb-json-error">{draftError}</div> : null}
                      <Button type="primary" size="small" block onClick={addField}>
                        {t('formbuilder.addToForm')}
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
            <h2 className="fb-panel-title">{t('formbuilder.panelPreview')}</h2>
            <div className="fb-preview-switches">
              <label>
                <span>{t('formbuilder.readOnly')}</span>
                <Switch size="small" checked={viewMode} onChange={setViewMode} />
              </label>
              <label>
                <span>{t('formbuilder.disableAll')}</span>
                <Switch size="small" checked={disabled} onChange={setDisabled} />
              </label>
            </div>
          </div>

          <Form form={form} onFinish={onFinish} disabled={disabled} className="fb-form">
            <FormBuilder meta={{ ...meta, viewMode, disabled }} form={form} viewMode={viewMode} />
            {!viewMode ? (
              <div className="fb-actions">
                <Button type="primary" htmlType="submit">
                  {t('formbuilder.submit')}
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields()
                    if (meta.initialValues) form.setFieldsValue(meta.initialValues)
                    setResult(null)
                  }}
                >
                  {t('formbuilder.reset')}
                </Button>
              </div>
            ) : null}
          </Form>

          <div className="fb-result">
            <h3 className="fb-result-title">{t('formbuilder.resultTitle')}</h3>
            {result ? (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            ) : (
              <p className="fb-result-empty">{t('formbuilder.resultEmpty')}</p>
            )}
          </div>
        </section>
      </div>

      <section className="fb-panel fb-widgets">
          <h2 className="fb-panel-title">{t('formbuilder.panelWidgets')}</h2>
          <div className="fb-widget-tags">{widgetTable}</div>
          <p className="fb-widgets-note">
            {t('formbuilder.widgetsNote')}
          </p>
      </section>
    </div>
  )
}

export default FormBuilderDemo
