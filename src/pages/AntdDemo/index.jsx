import {
  Card, Table, Tabs,
  Button,
  Typography,
} from 'antd'
import {
  
  
} from '@ant-design/icons'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const { Title, Paragraph } = Typography

/* —— 表格数据 —— */

import { tableData, getColumns, StatCards, FormSection, StepsSection, FeedbackSection } from './components/antdSections.jsx'

export default function AntdDemo() {
  const { t } = useI18n()
  return (
    <div className="antd-demo-page">
      <Typography className="page-hero">
        <Title level={2}>{t('antd.demo.title')}</Title>
        <Paragraph type="secondary">
          {t('antd.demo.lead')}
        </Paragraph>
      </Typography>

      <div style={{ marginBottom: 16 }}>
        <StatCards />
      </div>

      <Tabs
        defaultActiveKey="table"
        items={[
          { key: 'table', label: t('antd.demo.tabTable'), children: (
            <Card title={t('antd.demo.userListCard')} extra={<Button type="primary" size="small">{t('antd.demo.addBtn')}</Button>}>
              <Table dataSource={tableData} columns={getColumns(t)} pagination={{ pageSize: 5 }} size="middle" />
            </Card>
          )},
          { key: 'form', label: t('antd.demo.tabForm'), children: <FormSection /> },
          { key: 'steps', label: t('antd.demo.tabSteps'), children: <StepsSection /> },
          { key: 'feedback', label: t('antd.demo.tabFeedback'), children: <FeedbackSection /> },
        ]}
      />
    </div>
  )
}
