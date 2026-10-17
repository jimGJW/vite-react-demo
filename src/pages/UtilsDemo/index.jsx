import { useMemo, useState } from 'react'
import { Menu, Typography, Segmented } from 'antd'
import {
  FieldTimeOutlined, FontSizeOutlined, AppstoreOutlined,
  ApartmentOutlined, DatabaseOutlined, HighlightOutlined,
  ControlOutlined, DownloadOutlined, FunctionOutlined,
  CalculatorOutlined, ClockCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons'
import FreqDemos from './components/FreqDemos.jsx'
import FormatDemos from './components/FormatDemos.jsx'
import ArrayDemos from './components/ArrayDemos.jsx'
import TreeDemos from './components/TreeDemos.jsx'
import StorageDemos from './components/StorageDemos.jsx'
import InteractDemos from './components/InteractDemos.jsx'
import StateDemos from './components/StateDemos.jsx'
import ExportDemos from './components/ExportDemos.jsx'
import TextKitDemos from './components/TextKitDemos.jsx'
import CalcKitDemos from './components/CalcKitDemos.jsx'
import NewHookDemos from './components/NewHookDemos.jsx'
import { useI18n } from '../../i18n/index.js'
import './index.scss'

const { Title, Paragraph } = Typography

/* ============ 分类配置 ============ */
const CATEGORIES = [
  { key: 'freq', labelKey: 'utilsdemo.catFreq', icon: <FieldTimeOutlined />, render: () => <FreqDemos /> },
  { key: 'format', labelKey: 'utilsdemo.catFormat', icon: <FontSizeOutlined />, render: () => <FormatDemos /> },
  { key: 'array', labelKey: 'utilsdemo.catArray', icon: <AppstoreOutlined />, render: () => <ArrayDemos /> },
  { key: 'tree', labelKey: 'utilsdemo.catTree', icon: <ApartmentOutlined />, render: () => <TreeDemos /> },
  { key: 'storage', labelKey: 'utilsdemo.catStorage', icon: <DatabaseOutlined />, render: () => <StorageDemos /> },
  { key: 'interact', labelKey: 'utilsdemo.catInteract', icon: <HighlightOutlined />, render: () => <InteractDemos /> },
  { key: 'state', labelKey: 'utilsdemo.catState', icon: <ControlOutlined />, render: () => <StateDemos /> },
  { key: 'export', labelKey: 'utilsdemo.catExport', icon: <DownloadOutlined />, render: () => <ExportDemos /> },
  { key: 'textkit', labelKey: 'utilsdemo.catTextkit', icon: <FunctionOutlined />, render: () => <TextKitDemos /> },
  { key: 'calckit', labelKey: 'utilsdemo.catCalckit', icon: <CalculatorOutlined />, render: () => <CalcKitDemos /> },
  { key: 'newhooks', labelKey: 'utilsdemo.catNewhooks', icon: <ClockCircleOutlined />, render: () => <NewHookDemos /> },
]

export default function UtilsDemo() {
  const { t } = useI18n()
  const [cat, setCat] = useState('freq')
  const current = CATEGORIES.find((c) => c.key === cat)

  const menuItems = useMemo(
    () => CATEGORIES.map((c) => ({ key: c.key, icon: c.icon, label: t(c.labelKey) })),
    [t],
  )

  return (
    <div className="utils-demo">
      <div className="utils-demo__header">
        <Title level={3} style={{ marginBottom: 4 }}>
          <ThunderboltOutlined /> {t('utilsdemo.pageTitle')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('utilsdemo.pageDesc')}
        </Paragraph>
      </div>

      <div className="utils-demo__layout">
        <Menu
          mode="inline"
          className="utils-demo__menu"
          selectedKeys={[cat]}
          items={menuItems}
          onClick={({ key }) => setCat(key)}
        />
        <div className="utils-demo__content">
          <Segmented
            className="utils-demo__seg"
            options={CATEGORIES.map((c) => ({ label: t(c.labelKey), value: c.key }))}
            value={cat}
            onChange={setCat}
          />
          <div className="utils-demo__grid">{current.render()}</div>
        </div>
      </div>
    </div>
  )
}
