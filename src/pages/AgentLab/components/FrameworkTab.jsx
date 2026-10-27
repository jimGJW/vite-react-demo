import { Card, Table, Typography } from 'antd'
import { memo, useMemo } from 'react'
import { useI18n, pickText } from '@i18n/index.js'
import { FRAMEWORKS } from '../agentData.js'

const { Text } = Typography

/** 框架对比页签：纯展示表，数据来自 agentData（双语取词） */
function FrameworkTab() {
  const { lang, t } = useI18n()

  const columns = useMemo(() => [
    { title: t('agent.colName'), dataIndex: 'name', key: 'name', width: 190, render: (v) => <Text strong>{v}</Text> },
    { title: t('agent.colKind'), dataIndex: 'kind', key: 'kind', width: 150, render: (v) => pickText(v, lang) },
    { title: t('agent.colLang'), dataIndex: 'lang', key: 'lang', width: 110, render: (v) => <Text code>{v}</Text> },
    { title: t('agent.colHighlight'), dataIndex: 'highlight', key: 'highlight', render: (v) => pickText(v, lang) },
    { title: t('agent.colScene'), dataIndex: 'scene', key: 'scene', width: 170, render: (v) => pickText(v, lang) },
  ], [t, lang])

  return (
    <Card size="small" className="agent-lab__fw">
      <Table
        size="small"
        pagination={false}
        dataSource={FRAMEWORKS}
        rowKey="id"
        columns={columns}
        scroll={{ x: 640 }}
      />
    </Card>
  )
}

export default memo(FrameworkTab)
