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
const tableData = [
  { key: '1', name: '胡彦祖', age: 32, address: '北京市海淀区中关村大街1号', status: 'active' },
  { key: '2', name: '李大嘴', age: 28, address: '上海市浦东新区张江路100号', status: 'inactive' },
  { key: '3', name: '王建国', age: 45, address: '深圳市南山区科技园南区8栋', status: 'active' },
  { key: '4', name: '赵小满', age: 22, address: '广州市天河区珠江新城花城广场', status: 'pending' },
]

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', render: (t) => <a>{t}</a> },
  { title: '年龄', dataIndex: 'age', key: 'age', sorter: (a, b) => a.age - b.age },
  { title: '地址', dataIndex: 'address', key: 'address' },
  {
    title: '状态', dataIndex: 'status', key: 'status',
    render: (s) => {
      const map = { active: { color: 'green', text: '活跃' }, inactive: { color: 'red', text: '停用' }, pending: { color: 'orange', text: '待审' } }
      const m = map[s] || {}
      return <Tag color={m.color}>{m.text}</Tag>
    },
  },
  {
    title: '操作', key: 'action',
    render: () => (
      <Space size="middle">
        <Button type="link" size="small">编辑</Button>
        <Button type="link" danger size="small">删除</Button>
      </Space>
    ),
  },
]

/* —— 统计卡片 —— */
function StatCards() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="日活用户" value={11_538} prefix={<UserOutlined />} valueStyle={{ color: '#1677ff' }} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="订单总数" value={2_619} prefix={<ShoppingOutlined />} valueStyle={{ color: '#52c41a' }} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="转化率" value={18.6} suffix="%" prefix={<BarChartOutlined />} valueStyle={{ color: '#722ed1' }} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="平均耗时" value={3.2} suffix="s" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
        </Card>
      </Col>
    </Row>
  )
}

/* —— 表单区 —— */
function FormSection() {
  const [form] = Form.useForm()
  const [msgApi, contextHolder] = message.useMessage()
  const onSubmit = (vals) => {
    msgApi.success('表单提交成功')
    console.log('表单数据:', vals)
  }
  return (
    <Card title="表单组件演示">
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ platform: 'web', notify: true, rate: 4 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="负责人" name="owner">
              <Input placeholder="请输入负责人" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="平台" name="platform">
              <Select options={[{ value: 'web', label: 'Web' }, { value: 'ios', label: 'iOS' }, { value: 'android', label: 'Android' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="预算 (万元)" name="budget">
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="上线日期" name="launchDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="满意度评分" name="rate">
              <Rate />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="进度" name="progress">
              <Slider min={0} max={100} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="项目描述" name="desc">
              <TextArea rows={2} placeholder="请输入项目描述" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="开启通知" name="notify" valuePropName="checked">
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" htmlType="submit">提交</Button>
          <Button onClick={() => form.resetFields()}>重置</Button>
        </Space>
      </Form>
    </Card>
  )
}

/* —— 步骤 + 面包屑 —— */
function StepsSection() {
  const [current, setCurrent] = useState(1)
  return (
    <Card title="步骤条 & 面包屑导航">
      <Breadcrumb
        items={[{ title: <><HomeOutlined /> 首页</> }, { title: <><UserOutlined /> 用户中心</> }, { title: '详情' }]}
        style={{ marginBottom: 24 }}
      />
      <Steps
        current={current}
        onChange={setCurrent}
        items={[
          { title: '需求评审', description: '完成需求文档' },
          { title: '开发联调', description: '前后端对接' },
          { title: '测试验收', description: 'QA 回归' },
          { title: '上线发布', description: '生产部署' },
        ]}
      />
      <Divider />
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <Text type="secondary">完成度</Text>
          <Progress type="circle" percent={Math.round((current + 1) / 4 * 100)} width={80} />
        </div>
        <div>
          <Text type="secondary">满意度</Text>
          <Progress percent={88} status="active" strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }} style={{ width: 200 }} />
        </div>
      </div>
    </Card>
  )
}

/* —— 模态框 + 消息 —— */
function FeedbackSection() {
  const [open, setOpen] = useState(false)
  const [api, contextHolder] = message.useMessage()
  return (
    <Card title="反馈交互">
      {contextHolder}
      <Space wrap>
        <Button type="primary" onClick={() => api.success('操作成功！')}>Success 消息</Button>
        <Button onClick={() => api.warning('请注意风险')}>Warning 消息</Button>
        <Button danger onClick={() => api.error('操作失败，请重试')}>Error 消息</Button>
        <Button onClick={() => api.loading('正在加载...', 1.5).then(() => api.success('加载完成'))}>Loading 消息</Button>
        <Button type="dashed" onClick={() => setOpen(true)}>打开弹窗</Button>
      </Space>
      <Modal
        title="确认操作"
        open={open}
        onOk={() => { api.success('已确认'); setOpen(false) }}
        onCancel={() => setOpen(false)}
      >
        <Paragraph>你确定要执行此操作吗？此操作不可撤销。</Paragraph>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <Badge status="success" text="数据已备份" />
          <Badge status="processing" text="正在校验" />
          <Badge status="warning" text="有 2 条警告" />
        </div>
      </Modal>
    </Card>
  )
}

/* —— 主页面 —— */
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
