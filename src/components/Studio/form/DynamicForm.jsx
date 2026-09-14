import { useMemo } from 'react'
import { Form, Input, InputNumber, Select, Switch, DatePicker, Radio, Space } from 'antd'

/**
 * DynamicForm · schema 驱动动态表单
 * =====================================================================
 * 移植自存量低代码/配置中心项目里的「表单设计器产物渲染器」。原实现的价值在于
 * **「一份字段 schema 描述即一份 UI」**——后端配置好字段数组，前端据此自动
 * 生成表单，新增字段无需改代码。这里去掉所有业务字段，只保留通用字段类型与
 * 必填校验，可作为任意「配置表单 / 问卷 / 台账录入」的渲染底座。
 *
 * schema 形态：
 *   [{ name, label, type:'input'|'textarea'|'number'|'select'|'switch'|'date'|'radio',
 *      required?, placeholder?, options?:[{value,label}] }]
 *
 * 用法：
 *   <DynamicForm schema={fields} initialValues={data} onChange={setValues} />
 */

function renderField(field) {
  switch (field.type) {
    case 'textarea':
      return <Input.TextArea rows={3} placeholder={field.placeholder} />
    case 'number':
      return <InputNumber style={{ width: '100%' }} placeholder={field.placeholder} />
    case 'select':
      return <Select allowClear placeholder={field.placeholder} options={field.options} />
    case 'switch':
      return <Switch />
    case 'date':
      return <DatePicker style={{ width: '100%' }} />
    case 'radio':
      return <Radio.Group options={field.options} />
    case 'input':
    default:
      return <Input placeholder={field.placeholder} />
  }
}

function buildRules(field) {
  if (!field.required) return []
  return [{ required: true, message: `请填写${field.label || field.name}` }]
}

export default function DynamicForm({
  schema = [],
  initialValues,
  onChange,
  disabled = false,
  layout = 'vertical',
}) {
  const [form] = Form.useForm()

  const items = useMemo(
    () =>
      schema.map((field) => ({
        name: field.name,
        label: field.label || field.name,
        rules: buildRules(field),
        valuePropName: field.type === 'switch' ? 'checked' : 'value',
        children: renderField(field),
        key: field.name,
      })),
    [schema],
  )

  return (
    <Form
      form={form}
      layout={layout}
      disabled={disabled}
      initialValues={initialValues}
      onValuesChange={(_, all) => onChange?.(all)}
      className="st-dynform"
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        {items.map((it) => (
          <Form.Item key={it.key} name={it.name} label={it.label} rules={it.rules} valuePropName={it.valuePropName}>
            {it.children}
          </Form.Item>
        ))}
        {schema.length === 0 && <div className="st-dynform__empty">schema 为空</div>}
      </Space>
    </Form>
  )
}
