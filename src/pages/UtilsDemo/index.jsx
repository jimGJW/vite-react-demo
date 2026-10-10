import { useMemo, useState } from 'react'
import { Menu, Typography, Segmented } from 'antd'
import {
  FieldTimeOutlined, FontSizeOutlined, AppstoreOutlined,
  ApartmentOutlined, DatabaseOutlined, HighlightOutlined,
  ControlOutlined, DownloadOutlined, FunctionOutlined,
  CalculatorOutlined, ClockCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons'
import {
  DemoCard, FreqDemos, FormatDemos, ArrayDemos, TreeDemos,
  StorageDemos, InteractDemos, StateDemos, ExportDemos,
  TextKitDemos, CalcKitDemos, NewHookDemos,
} from './components/Demos.jsx'
import './index.scss'

const { Title, Paragraph, Text } = Typography

/* ============ 分类配置 ============ */
const CATEGORIES = [
  { key: 'freq', label: '频率控制', icon: <FieldTimeOutlined />, render: () => <FreqDemos /> },
  { key: 'format', label: '格式化 · 脱敏', icon: <FontSizeOutlined />, render: () => <FormatDemos /> },
  { key: 'array', label: '数组 · 对象', icon: <AppstoreOutlined />, render: () => <ArrayDemos /> },
  { key: 'tree', label: '树结构', icon: <ApartmentOutlined />, render: () => <TreeDemos /> },
  { key: 'storage', label: '存储 · 环境', icon: <DatabaseOutlined />, render: () => <StorageDemos /> },
  { key: 'interact', label: '交互 · DOM', icon: <HighlightOutlined />, render: () => <InteractDemos /> },
  { key: 'state', label: '状态小工具', icon: <ControlOutlined />, render: () => <StateDemos /> },
  { key: 'export', label: '导出 · 下载', icon: <DownloadOutlined />, render: () => <ExportDemos /> },
  { key: 'textkit', label: '字符串 · 校验', icon: <FunctionOutlined />, render: () => <TextKitDemos /> },
  { key: 'calckit', label: '数值 · 集合 · 日期', icon: <CalculatorOutlined />, render: () => <CalcKitDemos /> },
  { key: 'newhooks', label: '新增 Hook', icon: <ClockCircleOutlined />, render: () => <NewHookDemos /> },
]

export default function UtilsDemo() {
  const [cat, setCat] = useState('freq')
  const current = CATEGORIES.find((c) => c.key === cat)

  const menuItems = useMemo(
    () => CATEGORIES.map((c) => ({ key: c.key, icon: c.icon, label: c.label })),
    [],
  )

  return (
    <div className="utils-demo">
      <div className="utils-demo__header">
        <Title level={3} style={{ marginBottom: 4 }}>
          <ThunderboltOutlined /> 小功能集 Utils
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          从存量项目里挑出的高频小工具：90+ 个纯函数与 25 个 Hook，全部零依赖、去业务化。
          纯函数部分已纳入 <Text code>npm test</Text>（零依赖 node 断言，无需 vitest）。
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
            options={CATEGORIES.map((c) => ({ label: c.label, value: c.key }))}
            value={cat}
            onChange={setCat}
          />
          <div className="utils-demo__grid">{current.render()}</div>
        </div>
      </div>
    </div>
  )
}
