import { useState } from 'react'
import { Input, Space, Tag } from 'antd'
import {
  formatDate, formatRelativeTime, diffDays, formatFileSize, formatThousands, formatPercent, mask,
} from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'

/** 格式化与脱敏：日期 / 相对时间 / 体积 / 千分位 / 百分比 / 打码 */
export default function FormatDemos() {
  const [phone, setPhone] = useState('13800138000')
  const now = new Date(2024, 0, 10, 12, 0, 0).getTime()

  return (
    <>
      <DemoCard
        title="formatDate · 日期格式化"
        desc="支持 YYYY/YY/MM/M/DD/D/HH/H/mm/m/ss/s 占位符。"
        usage="formatDate(date, 'YYYY-MM-DD HH:mm:ss')"
      >
        <div className="utils-demo__out">{formatDate(new Date(2024, 0, 2, 3, 4, 5))}</div>
        <div className="utils-demo__out">{formatDate(new Date(2024, 0, 2), 'YYYY/MM/DD')}</div>
      </DemoCard>

      <DemoCard
        title="formatRelativeTime · 相对时间"
        desc="刚刚 / x 分钟前 / x 小时前 / x 天前，超过 30 天回落日期。"
        usage="formatRelativeTime(time, now)"
      >
        <div className="utils-demo__out">30 秒前 → {formatRelativeTime(now - 30_000, now)}</div>
        <div className="utils-demo__out">5 分钟前 → {formatRelativeTime(now - 5 * 60_000, now)}</div>
        <div className="utils-demo__out">3 天前 → {formatRelativeTime(now - 3 * 86_400_000, now)}</div>
      </DemoCard>

      <DemoCard
        title="diffDays · 相差天数"
        desc="两个日期相差整天数，非法输入返回 0。"
        usage="diffDays(start, end)"
      >
        <div className="utils-demo__out">
          {formatDate(new Date(2024, 0, 1), 'YYYY-MM-DD')} ~ {formatDate(new Date(2024, 0, 15), 'YYYY-MM-DD')}
          {' → '}{diffDays(new Date(2024, 0, 1), new Date(2024, 0, 15))} 天
        </div>
      </DemoCard>

      <DemoCard
        title="formatFileSize / formatThousands / formatPercent"
        desc="文件体积、千分位、百分比三组常用格式化。"
        usage="formatFileSize(1536) // '1.50 KB'"
      >
        <Space wrap size={[8, 4]}>
          <Tag>{formatFileSize(1536)}</Tag>
          <Tag>{formatFileSize(5 * 1024 * 1024)}</Tag>
          <Tag>{formatThousands(1234567)}</Tag>
          <Tag>{formatPercent(0.8734)}</Tag>
        </Space>
      </DemoCard>

      <DemoCard
        title="mask · 字符串脱敏"
        desc="保留首尾、中间打码，常用于手机号 / 证件号展示。"
        usage="mask('13800138000') // '138****8000'"
      >
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ maxWidth: 220 }} />
        <div className="utils-demo__out">脱敏后：{mask(phone)}</div>
      </DemoCard>
    </>
  )
}
