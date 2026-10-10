import { useState } from 'react'
import {
  Card, Table, Tabs, Form, Input, InputNumber, Select, Switch,
  DatePicker, Button, Space, Tag, Statistic, Row, Col, Steps,
  Breadcrumb, Progress, Slider, Rate, message, Modal,
  Typography, Divider, Badge,
} from 'antd'
import {
  HomeOutlined, UserOutlined, BarChartOutlined,
  ShoppingOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import './index.scss'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

/* —— 表格数据 —— */

import { tableData, columns, StatCards, FormSection, StepsSection, FeedbackSection } from './components/antdSections.jsx'

export default function AntdDemo() {
  return (
    <div className="antd-demo-page">
      <Typography style={{ marginBottom: 16 }}>
        <Title level={2}>Ant Design 组件演示</Title>
        <Paragraph type="secondary">
          展示 Ant Design 5 核心组件：表格、表单、统计、步骤、反馈等。
        </Paragraph>
      </Typography>

      <div style={{ marginBottom: 16 }}>
        <StatCards />
      </div>

      <Tabs
        defaultActiveKey="table"
        items={[
          { key: 'table', label: '数据表格', children: (
            <Card title="用户列表" extra={<Button type="primary" size="small">新增</Button>}>
              <Table dataSource={tableData} columns={columns} pagination={{ pageSize: 5 }} size="middle" />
            </Card>
          )},
          { key: 'form', label: '表单组件', children: <FormSection /> },
          { key: 'steps', label: '步骤 & 导航', children: <StepsSection /> },
          { key: 'feedback', label: '反馈交互', children: <FeedbackSection /> },
        ]}
      />
    </div>
  )
}
