import { useState } from 'react'
import { Button, Space } from 'antd'
import {
  formatDate, sum, avg, median, inRange, roundTo, percentOf, formatDuration,
  chunk, range, shuffle, sample, difference, intersection, union, compact,
  countBy, sumBy, move,
  get, set, has, invert, mapValues,
  startOfDay, endOfDay, addDays, isSameDay, weekdayOf, daysInMonth, isLeapYear,
} from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { SAMPLE_ROWS, NUMS, BASE_DATE } from './sampleData.js'

/** 数值统计 / 集合运算 / 对象路径 / 日期增强 */
export default function CalcKitDemos() {
  const [dice, setDice] = useState([1, 2, 3, 4, 5])

  return (
    <>
      <DemoCard
        title="数值统计"
        desc="求和、均值、中位数、占比、区间判断、小数位、毫秒转中文时长。中位数会自动忽略非数字。"
        usage="sum(arr) · avg(arr) · median(arr) · percentOf(part, total) · inRange(n, min, max) · roundTo(n, d) · formatDuration(ms)"
      >
        <div className="utils-demo__out">
          数组 [{NUMS.join(', ')}]<br />
          sum → {sum(NUMS)} · avg → {roundTo(avg(NUMS), 2)} · median → {median(NUMS)}<br />
          percentOf(5, 20) → {percentOf(5, 20)}%<br />
          inRange(5, 1, 10) → {String(inRange(5, 1, 10))} · roundTo(3.14159, 3) → {roundTo(3.14159, 3)}<br />
          formatDuration(90061000) → {formatDuration(90061000)}
        </div>
      </DemoCard>

      <DemoCard
        title="集合运算（均返回新数组，不改原数组）"
        desc="分块、序列、洗牌、抽样、差/交/并集、去 falsy、移动元素、按字段计数与求和。"
        usage="chunk · range · shuffle · sample · difference · intersection · union · compact · move · countBy · sumBy"
      >
        <Space wrap>
          <Button size="small" onClick={() => setDice(shuffle(dice))}>洗牌</Button>
          <Button size="small" onClick={() => setDice(sample([1, 2, 3, 4, 5], 3))}>随机抽 3 个</Button>
          <Button size="small" onClick={() => setDice(move(dice, 0, dice.length - 1))}>首位移到末尾</Button>
          <Button size="small" onClick={() => setDice([1, 2, 3, 4, 5])}>重置</Button>
        </Space>
        <div className="utils-demo__out">
          当前 → [{dice.join(', ')}]<br />
          chunk(2) → {JSON.stringify(chunk(dice, 2))}<br />
          range(1, 5) → {JSON.stringify(range(1, 5))} · range(5, 0, -2) → {JSON.stringify(range(5, 0, -2))}<br />
          difference([1,2,3],[2]) → {JSON.stringify(difference([1, 2, 3], [2]))}<br />
          intersection([1,2,3],[2,3,4]) → {JSON.stringify(intersection([1, 2, 3], [2, 3, 4]))}<br />
          union([1,2],[2,3]) → {JSON.stringify(union([1, 2], [2, 3]))}<br />
          compact([1,0,'',null,2]) → {JSON.stringify(compact([1, 0, '', null, 2]))}<br />
          countBy(status) → {JSON.stringify(countBy(SAMPLE_ROWS, 'status'))}<br />
          sumBy(value) → {sumBy(SAMPLE_ROWS, 'value')}
        </div>
      </DemoCard>

      <DemoCard
        title="对象路径存取"
        desc="支持 'a.b[0].c' 写法。get 取不到返回兜底值不抛错；set 是不可变写入，返回新对象。"
        usage="get(obj, path, fallback) · set(obj, path, value) · has(obj, path) · invert(obj) · mapValues(obj, fn)"
      >
        <div className="utils-demo__out">
          get(示例, &apos;list[1].n&apos;) → {get({ list: [{ n: 1 }, { n: 2 }] }, 'list[1].n')}<br />
          get(空对象, &apos;a.b&apos;, &apos;兜底&apos;) → {get({}, 'a.b', '兜底')}<br />
          set({`{a:1}`}, &apos;b.c&apos;, 2) → {JSON.stringify(set({ a: 1 }, 'b.c', 2))}<br />
          has({`{a:{b:1}}`}, &apos;a.b&apos;) → {String(has({ a: { b: 1 } }, 'a.b'))} · has(&apos;a.c&apos;) → {String(has({ a: { b: 1 } }, 'a.c'))}<br />
          invert({`{a:'1',b:'2'}`}) → {JSON.stringify(invert({ a: '1', b: '2' }))}<br />
          mapValues ×2 → {JSON.stringify(mapValues({ a: 1, b: 2 }, (v) => v * 2))}
        </div>
      </DemoCard>

      <DemoCard
        title="日期增强"
        desc="起止时刻、加减天数、同日判断、中文星期、某月天数、闰年判断。"
        usage="startOfDay · endOfDay · addDays · isSameDay · weekdayOf · daysInMonth(year, month) · isLeapYear(year)"
      >
        <div className="utils-demo__out">
          基准 {formatDate(BASE_DATE, 'YYYY-MM-DD HH:mm')}（{weekdayOf(BASE_DATE)}）<br />
          startOfDay → {formatDate(startOfDay(BASE_DATE), 'YYYY-MM-DD HH:mm:ss')}<br />
          endOfDay → {formatDate(endOfDay(BASE_DATE), 'YYYY-MM-DD HH:mm:ss')}<br />
          addDays(+30) → {formatDate(addDays(BASE_DATE, 30), 'YYYY-MM-DD')} · addDays(-30) → {formatDate(addDays(BASE_DATE, -30), 'YYYY-MM-DD')}<br />
          isSameDay(基准, 基准+30) → {String(isSameDay(BASE_DATE, addDays(BASE_DATE, 30)))}<br />
          daysInMonth(2024, 2) → {daysInMonth(2024, 2)} · daysInMonth(2023, 2) → {daysInMonth(2023, 2)}<br />
          isLeapYear(2024) → {String(isLeapYear(2024))} · isLeapYear(1900) → {String(isLeapYear(1900))}
        </div>
      </DemoCard>
    </>
  )
}
