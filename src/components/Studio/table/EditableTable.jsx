import { useState } from 'react'
import { Input, Select, Button, Space } from 'antd'

/**
 * 行内编辑表格：点击「编辑」整行切换为输入框 / 下拉，保存即写回。
 * 来自某存量后台项目的行内编辑思路，去 redux / antd3 重写。
 */
export default function EditableTable({ columns = [], data = [], rowKey = 'id' }) {
  const [rows, setRows] = useState(() => data.map((r) => ({ ...r })))

  const setCell = (key, col, val) =>
    setRows((rs) => rs.map((r) => (r[rowKey] === key ? { ...r, [col]: val } : r)))

  const start = (key) =>
    setRows((rs) => rs.map((r) => (r[rowKey] === key ? { ...r, __editing: true, __backup: { ...r } } : r)))

  const save = (key) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r[rowKey] !== key) return r
        const next = { ...r }
        delete next.__editing
        delete next.__backup
        return next
      }),
    )

  const cancel = (key) =>
    setRows((rs) => rs.map((r) => (r[rowKey] === key ? { ...r.__backup } : r)))

  return (
    <table className="st-edittable">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key}>{c.title}</th>
          ))}
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[rowKey]} className={r.__editing ? 'is-editing' : ''}>
            {columns.map((c) => (
              <td key={c.key}>
                {r.__editing && c.editable ? (
                  c.editable === 'select' ? (
                    <Select
                      size="small"
                      style={{ width: '100%' }}
                      value={r[c.key]}
                      options={c.options}
                      onChange={(v) => setCell(r[rowKey], c.key, v)}
                    />
                  ) : (
                    <Input
                      size="small"
                      value={r[c.key]}
                      onChange={(e) => setCell(r[rowKey], c.key, e.target.value)}
                    />
                  )
                ) : c.render ? (
                  c.render(r[c.key], r)
                ) : (
                  r[c.key]
                )}
              </td>
            ))}
            <td>
              {r.__editing ? (
                <Space size={4}>
                  <Button size="small" type="link" onClick={() => save(r[rowKey])}>保存</Button>
                  <Button size="small" type="link" onClick={() => cancel(r[rowKey])}>取消</Button>
                </Space>
              ) : (
                <Button size="small" type="link" onClick={() => start(r[rowKey])}>编辑</Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
