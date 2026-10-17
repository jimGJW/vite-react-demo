import { useState } from 'react'
import {
  Card, Form, Input, InputNumber, Select, Switch,
  DatePicker, Button, Space, Tag, Statistic, Row, Col, Steps,
  Breadcrumb, Progress, Slider, Rate, message, Modal,
  Divider, Badge, Typography,
} from 'antd'
import {
  HomeOutlined, UserOutlined, BarChartOutlined,
  ShoppingOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import { useI18n } from '../../../i18n/index.js'

/* Typography 家族按解构取用：Paragraph / Text 是本页主力排版组件 */
const { Paragraph, Text } = Typography

export const tableData = [
  { key: '1', name: '胡彦祖', age: 32, address: '北京市海淀区中关村大街1号', status: 'active' },
  { key: '2', name: '李大嘴', age: 28, address: '上海市浦东新区张江路100号', status: 'inactive' },
  { key: '3', name: '王建国', age: 45, address: '深圳市南山区科技园南区8栋', status: 'active' },
  { key: '4', name: '赵小满', age: 22, address: '广州市天河区珠江新城花城广场', status: 'pending' },
]

export function getColumns(t) {
  return [
    { title: t('antd.table.colName'), dataIndex: 'name', key: 'name', render: (text) => <a>{text}</a> },
    { title: t('antd.table.colAge'), dataIndex: 'age', key: 'age', sorter: (a, b) => a.age - b.age },
    { title: t('antd.table.colAddress'), dataIndex: 'address', key: 'address' },
    {
      title: t('antd.table.colStatus'), dataIndex: 'status', key: 'status',
      render: (s) => {
        const map = {
          active: { color: 'green', text: t('antd.table.statusActive') },
          inactive: { color: 'red', text: t('antd.table.statusInactive') },
          pending: { color: 'orange', text: t('antd.table.statusPending') },
        }
        const m = map[s] || {}
        return <Tag color={m.color}>{m.text}</Tag>
      },
    },
    {
      title: t('antd.table.colAction'), key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link" size="small">{t('antd.table.edit')}</Button>
          <Button type="link" danger size="small">{t('antd.table.delete')}</Button>
        </Space>
      ),
    },
  ]
}

/* —— 统计卡片 —— */
export function StatCards() {
  const { t } = useI18n()
  return (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title={t('antd.stat.dailyUsers')} value={11_538} prefix={<UserOutlined />} valueStyle={{ color: '#1677ff' }} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title={t('antd.stat.totalOrders')} value={2_619} prefix={<ShoppingOutlined />} valueStyle={{ color: '#52c41a' }} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title={t('antd.stat.conversion')} value={18.6} suffix="%" prefix={<BarChartOutlined />} valueStyle={{ color: '#722ed1' }} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title={t('antd.stat.avgTime')} value={3.2} suffix="s" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
        </Card>
      </Col>
    </Row>
  )
}

/* —— 表单区 —— */
export function FormSection() {
  const { t } = useI18n()
  const [form] = Form.useForm()
  const [msgApi, contextHolder] = message.useMessage()
  const onSubmit = (vals) => {
    msgApi.success(t('antd.form.submitSuccess'))
    console.log('表单数据:', vals)
  }
  return (
    <Card title={t('antd.form.cardTitle')}>
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ platform: 'web', notify: true, rate: 4 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label={t('antd.form.labelName')} name="name" rules={[{ required: true, message: t('antd.form.nameRequired') }]}>
              <Input placeholder={t('antd.form.inputPlaceholder')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('antd.form.labelOwner')} name="owner">
              <Input placeholder={t('antd.form.ownerPlaceholder')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label={t('antd.form.labelPlatform')} name="platform">
              <Select options={[{ value: 'web', label: 'Web' }, { value: 'ios', label: 'iOS' }, { value: 'android', label: 'Android' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label={t('antd.form.labelBudget')} name="budget">
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label={t('antd.form.labelLaunch')} name="launchDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('antd.form.labelRate')} name="rate">
              <Rate />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('antd.form.labelProgress')} name="progress">
              <Slider min={0} max={100} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label={t('antd.form.labelDesc')} name="desc">
              <Input.TextArea rows={2} placeholder={t('antd.form.descPlaceholder')} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label={t('antd.form.labelNotify')} name="notify" valuePropName="checked">
              <Switch checkedChildren={t('antd.form.switchOn')} unCheckedChildren={t('antd.form.switchOff')} />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" htmlType="submit">{t('antd.form.submit')}</Button>
          <Button onClick={() => form.resetFields()}>{t('antd.form.reset')}</Button>
        </Space>
      </Form>
    </Card>
  )
}

/* —— 步骤 + 面包屑 —— */
export function StepsSection() {
  const { t } = useI18n()
  const [current, setCurrent] = useState(1)
  return (
    <Card title={t('antd.steps.cardTitle')}>
      <Breadcrumb
        items={[
          { title: <><HomeOutlined /> {t('antd.steps.crumbHome')}</> },
          { title: <><UserOutlined /> {t('antd.steps.crumbUser')}</> },
          { title: t('antd.steps.crumbDetail') },
        ]}
        style={{ marginBottom: 24 }}
      />
      <Steps
        current={current}
        onChange={setCurrent}
        items={[
          { title: t('antd.steps.step1'), description: t('antd.steps.step1Desc') },
          { title: t('antd.steps.step2'), description: t('antd.steps.step2Desc') },
          { title: t('antd.steps.step3'), description: t('antd.steps.step3Desc') },
          { title: t('antd.steps.step4'), description: t('antd.steps.step4Desc') },
        ]}
      />
      <Divider />
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <Text type="secondary">{t('antd.steps.completion')}</Text>
          <Progress type="circle" percent={Math.round((current + 1) / 4 * 100)} width={80} />
        </div>
        <div>
          <Text type="secondary">{t('antd.steps.satisfaction')}</Text>
          <Progress percent={88} status="active" strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }} style={{ width: 200 }} />
        </div>
      </div>
    </Card>
  )
}

/* —— 模态框 + 消息 —— */
export function FeedbackSection() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [api, contextHolder] = message.useMessage()
  return (
    <Card title={t('antd.feedback.cardTitle')}>
      {contextHolder}
      <Space wrap>
        <Button type="primary" onClick={() => api.success(t('antd.feedback.successMsg'))}>{t('antd.feedback.successBtn')}</Button>
        <Button onClick={() => api.warning(t('antd.feedback.warningMsg'))}>{t('antd.feedback.warningBtn')}</Button>
        <Button danger onClick={() => api.error(t('antd.feedback.errorMsg'))}>{t('antd.feedback.errorBtn')}</Button>
        <Button onClick={() => api.loading(t('antd.feedback.loadingMsg'), 1.5).then(() => api.success(t('antd.feedback.loadedMsg')))}>{t('antd.feedback.loadingBtn')}</Button>
        <Button type="dashed" onClick={() => setOpen(true)}>{t('antd.feedback.modalBtn')}</Button>
      </Space>
      <Modal
        title={t('antd.feedback.modalTitle')}
        open={open}
        onOk={() => { api.success(t('antd.feedback.confirmedMsg')); setOpen(false) }}
        onCancel={() => setOpen(false)}
      >
        <Paragraph>{t('antd.feedback.modalContent')}</Paragraph>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <Badge status="success" text={t('antd.feedback.badgeBackup')} />
          <Badge status="processing" text={t('antd.feedback.badgeChecking')} />
          <Badge status="warning" text={t('antd.feedback.badgeWarning')} />
        </div>
      </Modal>
    </Card>
  )
}

/* —— 主页面 —— */
