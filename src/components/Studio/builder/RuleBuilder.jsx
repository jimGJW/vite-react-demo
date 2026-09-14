import { useCallback, useMemo, useState } from 'react'
import { Button, Select, Input, InputNumber, Space, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, FolderAddOutlined } from '@ant-design/icons'

/**
 * RuleBuilder · 可视化条件编排
 * =====================================================================
 * 移植自存量规则引擎项目里的可视化条件编辑器。原实现最有价值的是这套
 * **「AND/OR 嵌套组 + 叶子条件」递归数据模型**，以及「按字段类型自动切换
 * 可用操作符」的联动逻辑——常用来让非开发同学拼出复杂的筛选 / 路由规则，
 * 而不必手写表达式。
 *
 * 这里做零依赖重写，并把「业务字段枚举」全部外置为 `fields` prop，组件本身
 * 不认识任何具体业务，只负责把一棵树渲染、编辑、回传成结构化 JSON。
 *
 * 数据形态（受控）：
 *   { op: 'AND'|'OR', conditions: [
 *       { field, op, value }  |            // 叶子
 *       { op:'AND'|'OR', conditions:[...] } // 嵌套组
 *   ] }
 *
 * 用法：
 *   <RuleBuilder fields={[{ name:'age', label:'年龄', type:'number' }]} value={tree} onChange={setTree} />
 */

const OPERATORS = {
  number: [
    { value: '>', label: '大于' },
    { value: '>=', label: '不小于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '不大于' },
    { value: '=', label: '等于' },
    { value: 'between', label: '区间' },
  ],
  string: [
    { value: '=', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: 'contains', label: '包含' },
    { value: 'starts', label: '开头是' },
  ],
  enum: [
    { value: '=', label: '等于' },
    { value: 'in', label: '属于' },
  ],
  boolean: [{ value: '=', label: '等于' }],
}

const newLeaf = (field) => ({ field: field?.name ?? '', op: '=', value: '' })
const emptyGroup = { op: 'AND', conditions: [newLeaf()] }

const opsFor = (type) => OPERATORS[type] || OPERATORS.string

/* —— 不可变更新：按 path(下标数组) 找到目标节点并替换 —— */
function updateAt(node, path, updater) {
  if (path.length === 0) return updater(node)
  const [head, ...rest] = path
  const conditions = node.conditions.map((c, i) =>
    i === head ? updateAt(c, rest, updater) : c,
  )
  return { ...node, conditions }
}
function removeAt(node, path) {
  if (path.length === 1) {
    return { ...node, conditions: node.conditions.filter((_, i) => i !== path[0]) }
  }
  const [head, ...rest] = path
  return { ...node, conditions: node.conditions.map((c, i) => (i === head ? removeAt(c, rest) : c)) }
}

/* —— 值编辑器：按字段类型渲染不同输入控件 —— */
function ValueEditor({ def, value, op, onChange }) {
  if (!def) return <Input size="small" className="st-rule__value" disabled placeholder="先选字段" />
  const set = (v) => onChange({ ...value, value: v })

  if (def.type === 'boolean') {
    return (
      <Select
        size="small"
        className="st-rule__value"
        value={value.value}
        options={[{ value: true, label: '是' }, { value: false, label: '否' }]}
        onChange={set}
      />
    )
  }
  if (def.type === 'enum') {
    const opts = (def.options || []).map((o) => ({ value: o, label: o }))
    if (op === 'in') {
      return (
        <Select
          mode="multiple"
          size="small"
          className="st-rule__value"
          value={Array.isArray(value.value) ? value.value : []}
          options={opts}
          onChange={set}
        />
      )
    }
    return (
      <Select size="small" className="st-rule__value" value={value.value} options={opts} onChange={set} />
    )
  }
  if (def.type === 'number') {
    if (op === 'between') {
      const arr = Array.isArray(value.value) ? value.value : ['', '']
      return (
        <Space.Compact className="st-rule__value">
          <InputNumber size="small" value={arr[0]} onChange={(v) => set([v, arr[1]])} />
          <InputNumber size="small" value={arr[1]} onChange={(v) => set([arr[0], v])} />
        </Space.Compact>
      )
    }
    return (
      <InputNumber
        size="small"
        className="st-rule__value"
        value={value.value === '' ? null : value.value}
        onChange={set}
      />
    )
  }
  return (
    <Input
      size="small"
      className="st-rule__value"
      value={value.value}
      placeholder="值"
      onChange={(e) => set(e.target.value)}
    />
  )
}

/* —— 一条叶子条件：字段 + 操作符 + 值 —— */
function ConditionRow({ fields, def, value, onChange, onRemove }) {
  const ops = opsFor(def?.type)
  const op = ops.find((o) => o.value === value.op) ? value.op : ops[0].value

  const handleField = (name) => {
    const next = fields.find((f) => f.name === name)
    onChange({
      field: name,
      op: opsFor(next?.type).map((o) => o.value)[0] || '=',
      value: '',
    })
  }

  return (
    <div className="st-rule__row">
      <Select
        size="small"
        className="st-rule__field"
        value={value.field || undefined}
        placeholder="字段"
        options={fields.map((f) => ({ value: f.name, label: f.label || f.name }))}
        onChange={handleField}
      />
      <Select
        size="small"
        className="st-rule__op"
        value={op}
        options={ops}
        onChange={(o) => onChange({ ...value, op: o })}
      />
      <ValueEditor def={def} value={value} op={op} onChange={onChange} />
      <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </div>
  )
}

/* —— 一个 AND/OR 分组（递归）—— */
function GroupNode({ node, path, fields, onChangeRoot, onRemove, depth = 0 }) {
  const updateSelf = useCallback(
    (updater) => onChangeRoot((root) => updateAt(root, path, updater)),
    [onChangeRoot, path],
  )

  const addLeaf = () =>
    updateSelf((n) => ({ ...n, conditions: [...n.conditions, newLeaf(fields[0])] }))
  const addGroup = () =>
    updateSelf((n) => ({ ...n, conditions: [...n.conditions, { op: 'AND', conditions: [newLeaf(fields[0])] }] }))
  const changeOp = (op) => updateSelf((n) => ({ ...n, op }))

  return (
    <div className={`st-rule__group depth-${Math.min(depth, 3)}`}>
      <div className="st-rule__group-head">
        <Select
          size="small"
          value={node.op}
          onChange={changeOp}
          options={[{ value: 'AND', label: '且 AND' }, { value: 'OR', label: '或 OR' }]}
          className="st-rule__op-select"
        />
        <Space size={4}>
          <Button size="small" icon={<PlusOutlined />} onClick={addLeaf}>条件</Button>
          <Button size="small" icon={<FolderAddOutlined />} onClick={addGroup}>分组</Button>
          {onRemove && (
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
          )}
        </Space>
      </div>

      <div className="st-rule__group-body">
        {node.conditions.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无条件" />
        )}
        {node.conditions.map((cond, i) => {
          const childPath = [...path, i]
          if (Array.isArray(cond.conditions)) {
            return (
              <GroupNode
                key={i}
                node={cond}
                path={childPath}
                fields={fields}
                depth={depth + 1}
                onChangeRoot={onChangeRoot}
                onRemove={() => onChangeRoot((root) => removeAt(root, childPath))}
              />
            )
          }
          const def = fields.find((f) => f.name === cond.field)
          return (
            <ConditionRow
              key={i}
              fields={fields}
              def={def}
              value={cond}
              onChange={(v) => onChangeRoot((root) => updateAt(root, childPath, () => v))}
              onRemove={() => onChangeRoot((root) => removeAt(root, childPath))}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function RuleBuilder({ fields = [], value, onChange, className = '' }) {
  const fieldOptions = useMemo(
    () => fields.map((f) => ({ value: f.name, label: f.label || f.name })),
    [fields],
  )
  const [inner, setInner] = useState(value || emptyGroup)
  const current = value ?? inner

  const emit = useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      if (value === undefined) setInner(next)
      onChange?.(next)
    },
    [current, value, onChange],
  )

  return (
    <div className={`st-rule ${className}`}>
      <GroupNode node={current} path={[]} fields={fields} onChangeRoot={emit} />
      {fieldOptions.length === 0 && (
        <div className="st-dynform__empty">未传入 fields，无法选择字段</div>
      )}
    </div>
  )
}
