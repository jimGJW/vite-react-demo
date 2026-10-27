import { Checkbox } from 'antd'
import { memo } from 'react'
import { useI18n } from '@i18n/index.js'

/**
 * 前端技能勾选条：默认全选（由父组件初始 value 决定），
 * 勾住 = 展示该技能面板；取消 = 从演示中整块移除（卸载即停内部定时器）。
 * 纯受控组件：选项与状态都由调用方持有，本组件不感知演示细节。
 */
function SkillPicker({ options, value, onChange }) {
  const { t } = useI18n()
  const checkedAll = value.length === options.length
  const indeterminate = value.length > 0 && value.length < options.length

  const onAll = (e) => onChange(e.target.checked ? options.map((o) => o.value) : [])
  const onGroup = (vals) => onChange(vals)

  return (
    <div className="agent-lab__pick">
      <span className="agent-lab__pick-label">{t('agent.labPickLabel')}</span>
      <Checkbox checked={checkedAll} indeterminate={indeterminate} onChange={onAll}>
        {t('agent.labPickAll')}
      </Checkbox>
      <Checkbox.Group options={options} value={value} onChange={onGroup} />
    </div>
  )
}

export default memo(SkillPicker)
