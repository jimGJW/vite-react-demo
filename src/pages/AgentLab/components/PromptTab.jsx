import { Button, Card, Typography, message } from 'antd'
import { memo, useCallback, useMemo } from 'react'
import { CopyOutlined } from '@ant-design/icons'
import { useI18n, pickText } from '@i18n/index.js'
import { PROMPTS } from '../agentData.js'

const { Paragraph } = Typography

/** 提示词模板页签：一键复制（message 用法与全站一致，走 antd 静态方法） */
function PromptTab() {
  const { lang, t } = useI18n()

  const copyText = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(t('agent.copied'))
    } catch {
      message.error(t('agent.copyFail'))
    }
  }, [t])

  const items = useMemo(() => PROMPTS.map((p) => (
    <Card
      key={p.id}
      size="small"
      title={pickText(p.name, lang)}
      extra={(
        <Button
          size="small"
          type="text"
          icon={<CopyOutlined />}
          onClick={() => copyText(pickText(p.text, lang))}
        >
          {t('agent.copy')}
        </Button>
      )}
    >
      <Paragraph type="secondary" style={{ marginBottom: 8 }}>{pickText(p.scene, lang)}</Paragraph>
      <pre className="agent-lab__prompt-text">{pickText(p.text, lang)}</pre>
    </Card>
  )), [lang, t, copyText])

  return (
    <div className="agent-lab__prompts">{items}</div>
  )
}

export default memo(PromptTab)
