import { Tabs, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import InteractionTab from './components/InteractionTab.jsx'
import DisplayTab from './components/DisplayTab.jsx'
import FormTab from './components/FormTab.jsx'
import './index.scss'

const { Paragraph, Text } = Typography

export default function KitDemo() {
  return (
    <div className="kit-demo">
      <div className="kit-demo__hero">
        <h2>
          <ThunderboltOutlined /> 组件工具箱 Kit
        </h2>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          从本地两个存量项目（旧移动端 / 旧平板端）里挑选出的通用能力，去掉业务耦合后重写为 React 19 + antd 5 组件。
          完整调研清单（选了什么、为什么、跳过了什么）见{' '}
          <Text code>src/components/Kit/README.md</Text>。
        </Paragraph>
      </div>

      <Tabs
        defaultActiveKey="interaction"
        items={[
          { key: 'interaction', label: '移动交互（6）', children: <InteractionTab /> },
          { key: 'display', label: '数据展示（9）', children: <DisplayTab /> },
          { key: 'form', label: '表单控件（3）', children: <FormTab /> },
        ]}
      />
    </div>
  )
}
