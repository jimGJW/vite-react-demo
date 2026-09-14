import { useMemo } from 'react'
import { Button, TimePicker, Tooltip } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { minutesToTime, splitDuration, uid, validateTimeRanges } from '../utils.js'

/**
 * TimeRangeInput · 时段录入（工时/排班/营业时间）
 * =====================================================================
 * 移植自 旧移动端项目 `components/WorkHoursInput.js`（439 行）。原实现一半是
 * react-weui 表单壳、一半是校验逻辑，这里只保留**校验与求和**这部分真正的价值：
 *   - 结束时间必须晚于开始时间
 *   - 单段不得超过 maxHours
 *   - 任意两段时间不得重叠
 *   - 实时合计
 * 并补了两处原实现没做的：
 *   - 起止未填完整时给出明确提示（原实现会静默算出 NaN）
 *   - 校验结果用列表展示，而不是只弹一条 message
 *
 * 原实现直接改 `e.target.value` 的命令式写法，这里改为标准 value/onChange。
 *
 * 用法：
 *   const [ranges, setRanges] = useState([{ id: 'a', start: '09:00', end: '12:00' }])
 *   <TimeRangeInput value={ranges} onChange={setRanges} maxHours={12} />
 */

const FORMAT = 'HH:mm'

/** 'HH:mm' → dayjs（不依赖 dayjs 的 customParseFormat 插件） */
function toDayjs(value) {
  if (!value) return null
  const [hour, minute] = String(value).split(':')
  const parsed = dayjs().hour(Number(hour)).minute(Number(minute)).second(0)
  return parsed.isValid() ? parsed : null
}

export default function TimeRangeInput({
  value = [],
  onChange,
  maxHours = 24,
  disabled = false,
  showSummary = true,
  addText = '添加时段',
  summaryText = '合计工时',
  className = '',
}) {
  const { errors, totalMinutes } = useMemo(
    () => validateTimeRanges(value, { maxHours }),
    [value, maxHours],
  )

  const update = (index, patch) => {
    onChange?.(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const addRange = () => {
    onChange?.([...value, { id: uid('range'), start: '', end: '' }])
  }

  const removeRange = (index) => {
    onChange?.(value.filter((_, i) => i !== index))
  }

  const { hours, minutes } = splitDuration(totalMinutes * 60000)

  return (
    <div className={`kit-timerange ${className}`}>
      {value.map((range, index) => (
        <div className="kit-timerange__row" key={range.id ?? index}>
          <span className="kit-timerange__index">{index + 1}</span>

          <TimePicker
            value={toDayjs(range.start)}
            format={FORMAT}
            minuteStep={1}
            disabled={disabled}
            placeholder="开始"
            onChange={(time) => update(index, { start: time ? time.format(FORMAT) : '' })}
          />
          <span className="kit-timerange__dash">~</span>
          <TimePicker
            value={toDayjs(range.end)}
            format={FORMAT}
            minuteStep={1}
            disabled={disabled}
            placeholder="结束"
            onChange={(time) => update(index, { end: time ? time.format(FORMAT) : '' })}
          />

          <Tooltip title="删除该时段">
            <Button
              type="text"
              size="small"
              danger
              disabled={disabled}
              icon={<DeleteOutlined />}
              aria-label="删除该时段"
              onClick={() => removeRange(index)}
            />
          </Tooltip>
        </div>
      ))}

      <div>
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          disabled={disabled}
          onClick={addRange}
        >
          {addText}
        </Button>
      </div>

      {showSummary && (
        <div className="kit-timerange__summary">
          <span>{summaryText}</span>
          <span className="kit-timerange__total">
            {hours} 小时 {minutes} 分
            {totalMinutes > 0 && <span className="kit-hint">（{minutesToTime(totalMinutes)}）</span>}
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="kit-timerange__errors">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
