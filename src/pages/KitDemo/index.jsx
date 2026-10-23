import { Tabs, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import InteractionTab from './components/InteractionTab.jsx'
import DisplayTab from './components/DisplayTab.jsx'
import FormTab from './components/FormTab.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const { Paragraph, Text } = Typography

export default function KitDemo() {
  const { t } = useI18n()
  return (
    <div className="kit-demo">
      <div className="kit-demo__hero page-hero">
        <h2>
          <ThunderboltOutlined /> {t('kit.page.title')}
        </h2>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('kit.page.descLead')} <Text code>src/components/Kit/README.md</Text>{' '}
          {t('kit.page.descTail')}
        </Paragraph>
      </div>

      <Tabs
        defaultActiveKey="interaction"
        items={[
          { key: 'interaction', label: t('kit.page.tabInteraction', { count: 6 }), children: <InteractionTab /> },
          { key: 'display', label: t('kit.page.tabDisplay', { count: 9 }), children: <DisplayTab /> },
          { key: 'form', label: t('kit.page.tabForm', { count: 3 }), children: <FormTab /> },
        ]}
      />
    </div>
  )
}
