import { useState } from 'react'
import { Input, Space, Tag } from 'antd'
import {
  truncate, wordCount, toHalfWidth, escapeRegExp, slugify, initials, trimAll,
  colorFromString, contrastColor,
  isEmail, isPhone, isIdCard, isUrl, isNumeric, isChinese,
} from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { COLOR_SEEDS, CONTRAST_HEX } from './sampleData.js'

/** 字符串增强 / 常用校验 / 稳定配色 */
export default function TextKitDemos() {
  const [text, setText] = useState('  Hello   World！ＡＢＣ123  ')
  const [check, setCheck] = useState('13800138000')
  const [seed, setSeed] = useState('星际控制台')

  return (
    <>
      <DemoCard
        title="字符串增强"
        desc="截断、中英混排字数、全角转半角、正则转义、URL 友好化、头像首字母 —— 改输入框即时看结果。"
        usage="truncate(s, max) · wordCount(s) · toHalfWidth(s) · escapeRegExp(s) · slugify(s) · initials(name) · trimAll(s)"
      >
        <Input size="small" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="utils-demo__out">
          truncate(12) → {truncate(text.trim(), 12)}<br />
          wordCount → {wordCount(text)}<br />
          toHalfWidth → {toHalfWidth(text)}<br />
          trimAll → {trimAll(text)}<br />
          slugify → {slugify(text) || '—'}<br />
          initials → {initials(text.trim()) || '—'}<br />
          escapeRegExp(&apos;a.b&apos;) → {escapeRegExp('a.b')}
        </div>
      </DemoCard>

      <DemoCard
        title="常用校验"
        desc="邮箱、中国大陆手机号、身份证（含校验位）、URL、数字、纯中文。改输入框即时判定。"
        usage="isEmail(s) · isPhone(s) · isIdCard(s) · isUrl(s) · isNumeric(s) · isChinese(s)"
      >
        <Input size="small" value={check} onChange={(e) => setCheck(e.target.value)} placeholder="输入待校验内容" />
        <Space wrap size={4}>
          <Tag color={isEmail(check) ? 'green' : 'default'}>邮箱</Tag>
          <Tag color={isPhone(check) ? 'green' : 'default'}>手机号</Tag>
          <Tag color={isIdCard(check) ? 'green' : 'default'}>身份证</Tag>
          <Tag color={isUrl(check) ? 'green' : 'default'}>URL</Tag>
          <Tag color={isNumeric(check) ? 'green' : 'default'}>数字</Tag>
          <Tag color={isChinese(check) ? 'green' : 'default'}>纯中文</Tag>
        </Space>
        <div className="utils-demo__out">
          试这几个：13800138000 · a@b.com · 11010519491231002X · 你好
        </div>
      </DemoCard>

      <DemoCard
        title="稳定配色"
        desc="同一字符串永远得到同一颜色，给用户/标签自动配色时省掉一张映射表；contrastColor 按亮度返回黑或白前景色，避免浅底白字。"
        usage="colorFromString(s) · contrastColor(hex)"
      >
        <Input size="small" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="输入任意字符串" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COLOR_SEEDS.concat(seed).map((s) => (
            <span
              key={s}
              style={{
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: '0.75rem',
                background: colorFromString(s),
                color: '#fff',
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CONTRAST_HEX.map((hex) => (
            <span
              key={hex}
              style={{
                padding: '2px 10px',
                borderRadius: 4,
                fontSize: '0.75rem',
                background: hex,
                color: contrastColor(hex),
                border: '1px solid var(--c-border-soft, #f0f0f0)',
              }}
            >
              {hex}
            </span>
          ))}
        </div>
      </DemoCard>
    </>
  )
}
