import { useState } from 'react'
import { Form, Button, message, Tabs, Switch, Select, Input, Checkbox, Empty } from 'antd'
import { Slider, Rate, TimePicker } from 'antd'
import FormBuilder from 'antd-form-builder'
import './index.scss'

// 注册扩展 widget（antd-form-builder 只内置 12 种，这里扩展 3 种常见控件）
// defineWidget 重复注册会抛错，try-catch 兼容 HMR 热重载场景
try {
  FormBuilder.defineWidget('slider', Slider)
  FormBuilder.defineWidget('rate', Rate)
  FormBuilder.defineWidget('time-picker', TimePicker)
} catch {
  /* 模块重载时已注册，忽略 */
}

const WIDGET_OPTIONS = [
  { value: 'input', label: 'input 输入框' },
  { value: 'password', label: 'password 密码框' },
  { value: 'textarea', label: 'textarea 多行文本' },
  { value: 'number', label: 'number 数字输入' },
  { value: 'select', label: 'select 下拉选择' },
  { value: 'radio-group', label: 'radio-group 单选组' },
  { value: 'checkbox-group', label: 'checkbox-group 多选组' },
  { value: 'switch', label: 'switch 开关' },
  { value: 'checkbox', label: 'checkbox 勾选' },
  { value: 'radio', label: 'radio 单选' },
  { value: 'date-picker', label: 'date-picker 日期' },
  { value: 'time-picker', label: 'time-picker 时间 ★' },
  { value: 'slider', label: 'slider 滑块 ★' },
  { value: 'rate', label: 'rate 评分 ★' },
]

const PRESETS = {
  login: {
    label: '经典登录',
    meta: {
      columns: 1,
      formItemLayout: [6, 16],
      fields: [
        { key: 'username', label: '用户名', required: true, placeholder: '请输入用户名' },
        { key: 'password', label: '密码', widget: 'password', required: true, placeholder: '请输入密码' },
        { key: 'remember', label: '记住我', widget: 'checkbox' },
      ],
      initialValues: { remember: true },
    },
  },
  register: {
    label: '用户注册',
    meta: {
      columns: 2,
      formItemLayout: null,
      gutter: 16,
      fields: [
        { key: 'name', label: '姓名', required: true },
        { key: 'gender', label: '性别', widget: 'radio-group', options: ['男', '女'] },
        {
          key: 'phone',
          label: '手机号',
          rules: [{ pattern: /^1\d{10}$/, message: '手机号格式不正确' }],
        },
        { key: 'email', label: '邮箱', rules: [{ type: 'email', message: '邮箱格式不正确' }] },
        {
          key: 'city',
          label: '城市',
          widget: 'select',
          placeholder: '请选择城市',
          options: [
            ['bj', '北京'],
            ['sh', '上海'],
            ['gz', '广州'],
            ['sz', '深圳'],
          ],
        },
        { key: 'birthday', label: '出生日期', widget: 'date-picker' },
        {
          key: 'intro',
          label: '自我介绍',
          widget: 'textarea',
          colSpan: 2,
          widgetProps: { rows: 3, showCount: true, maxLength: 200 },
        },
        { key: 'agree', label: '同意服务协议', widget: 'checkbox', required: true, message: '请勾选同意协议' },
      ],
      initialValues: { gender: '男' },
    },
  },
  profile: {
    label: '信息登记',
    meta: {
      columns: 2,
      formItemLayout: null,
      gutter: 16,
      fields: [
        { key: 'name', label: '姓名', required: true },
        { key: 'age', label: '年龄', widget: 'number', widgetProps: { min: 1, max: 120 } },
        { key: 'gender', label: '性别', widget: 'radio-group', options: ['男', '女'] },
        {
          key: 'city',
          label: '城市',
          widget: 'select',
          options: [
            ['bj', '北京'],
            ['sh', '上海'],
            ['gz', '广州'],
          ],
        },
        { key: 'salary', label: '期望薪资(k)', widget: 'slider', colSpan: 2, widgetProps: { min: 5, max: 100, marks: { 5: '5k', 50: '50k', 100: '100k' } } },
        { key: 'level', label: '职级评分', widget: 'rate' },
        { key: 'workTime', label: '到岗时间', widget: 'time-picker' },
        { key: 'remote', label: '接受远程', widget: 'switch' },
        { key: 'skills', label: '技能标签', widget: 'checkbox-group', options: ['React', 'Vue', 'Node', 'Python'] },
        {
          key: 'remark',
          label: '备注',
          widget: 'textarea',
          colSpan: 2,
          widgetProps: { rows: 2 },
        },
      ],
      initialValues: { age: 25, salary: 30, level: 4, remote: true, skills: ['React'] },
    },
  },
  survey: {
    label: '反馈问卷',
    meta: {
      columns: 1,
      formItemLayout: [6, 16],
      fields: [
        {
          key: 'channel',
          label: '了解渠道',
          widget: 'select',
          options: ['搜索引擎', '朋友推荐', '社交媒体', '其他'],
          required: true,
        },
        { key: 'score', label: '整体评分', widget: 'rate', required: true },
        { key: 'features', label: '常用功能', widget: 'checkbox-group', options: ['表单配置', '数据统计', '权限管理', '消息通知'] },
        { key: 'useTime', label: '常用时段', widget: 'time-picker' },
        { key: 'notify', label: '接受更新通知', widget: 'switch' },
        { key: 'suggest', label: '改进建议', widget: 'textarea', widgetProps: { rows: 4, placeholder: '说说你的想法…' } },
      ],
      initialValues: { score: 5, notify: true },
    },
  },
}

const stringifyMeta = (meta) => JSON.stringify(meta, null, 2)

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
