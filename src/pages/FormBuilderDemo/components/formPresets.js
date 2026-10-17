import { Slider, Rate, TimePicker } from 'antd'
import FormBuilder from 'antd-form-builder'

// 注册扩展 widget（antd-form-builder 只内置 12 种，这里扩展 3 种常见控件）
// defineWidget 重复注册会抛错，try-catch 兼容 HMR 热重载场景
try {
  FormBuilder.defineWidget('slider', Slider)
  FormBuilder.defineWidget('rate', Rate)
  FormBuilder.defineWidget('time-picker', TimePicker)
} catch {
  /* 模块重载时已注册，忽略 */
}

export const WIDGET_OPTIONS = [
  { value: 'input', labelKey: 'formbuilder.widgetInput' },
  { value: 'password', labelKey: 'formbuilder.widgetPassword' },
  { value: 'textarea', labelKey: 'formbuilder.widgetTextarea' },
  { value: 'number', labelKey: 'formbuilder.widgetNumber' },
  { value: 'select', labelKey: 'formbuilder.widgetSelect' },
  { value: 'radio-group', labelKey: 'formbuilder.widgetRadioGroup' },
  { value: 'checkbox-group', labelKey: 'formbuilder.widgetCheckboxGroup' },
  { value: 'switch', labelKey: 'formbuilder.widgetSwitch' },
  { value: 'checkbox', labelKey: 'formbuilder.widgetCheckbox' },
  { value: 'radio', labelKey: 'formbuilder.widgetRadio' },
  { value: 'date-picker', labelKey: 'formbuilder.widgetDatePicker' },
  { value: 'time-picker', labelKey: 'formbuilder.widgetTimePicker' },
  { value: 'slider', labelKey: 'formbuilder.widgetSlider' },
  { value: 'rate', labelKey: 'formbuilder.widgetRate' },
]

export const PRESETS = {
  login: {
    label: '经典登录',
    meta: {
      columns: 1,
      formItemLayout: [6, 16],
      fields: [
        { key: 'username', label: '用户名', required: true, placeholder: '请输入用户名' },
        { key: 'password', label: '密码', widget: 'password', required: true, placeholder: '请输入密码' },
        { key: 'remember', label: '记住我', widget: 'checkbox' },
      ],
      initialValues: { remember: true },
    },
  },
  register: {
    label: '用户注册',
    meta: {
      columns: 2,
      formItemLayout: null,
      gutter: 16,
      fields: [
        { key: 'name', label: '姓名', required: true },
        { key: 'gender', label: '性别', widget: 'radio-group', options: ['男', '女'] },
        {
          key: 'phone',
          label: '手机号',
          rules: [{ pattern: /^1\d{10}$/, message: '手机号格式不正确' }],
        },
        { key: 'email', label: '邮箱', rules: [{ type: 'email', message: '邮箱格式不正确' }] },
        {
          key: 'city',
          label: '城市',
          widget: 'select',
          placeholder: '请选择城市',
          options: [
            ['bj', '北京'],
            ['sh', '上海'],
            ['gz', '广州'],
            ['sz', '深圳'],
          ],
        },
        { key: 'birthday', label: '出生日期', widget: 'date-picker' },
        {
          key: 'intro',
          label: '自我介绍',
          widget: 'textarea',
          colSpan: 2,
          widgetProps: { rows: 3, showCount: true, maxLength: 200 },
        },
        { key: 'agree', label: '同意服务协议', widget: 'checkbox', required: true, message: '请勾选同意协议' },
      ],
      initialValues: { gender: '男' },
    },
  },
  profile: {
    label: '信息登记',
    meta: {
      columns: 2,
      formItemLayout: null,
      gutter: 16,
      fields: [
        { key: 'name', label: '姓名', required: true },
        { key: 'age', label: '年龄', widget: 'number', widgetProps: { min: 1, max: 120 } },
        { key: 'gender', label: '性别', widget: 'radio-group', options: ['男', '女'] },
        {
          key: 'city',
          label: '城市',
          widget: 'select',
          options: [
            ['bj', '北京'],
            ['sh', '上海'],
            ['gz', '广州'],
          ],
        },
        { key: 'salary', label: '期望薪资(k)', widget: 'slider', colSpan: 2, widgetProps: { min: 5, max: 100, marks: { 5: '5k', 50: '50k', 100: '100k' } } },
        { key: 'level', label: '职级评分', widget: 'rate' },
        { key: 'workTime', label: '到岗时间', widget: 'time-picker' },
        { key: 'remote', label: '接受远程', widget: 'switch' },
        { key: 'skills', label: '技能标签', widget: 'checkbox-group', options: ['React', 'Vue', 'Node', 'Python'] },
        {
          key: 'remark',
          label: '备注',
          widget: 'textarea',
          colSpan: 2,
          widgetProps: { rows: 2 },
        },
      ],
      initialValues: { age: 25, salary: 30, level: 4, remote: true, skills: ['React'] },
    },
  },
  survey: {
    label: '反馈问卷',
    meta: {
      columns: 1,
      formItemLayout: [6, 16],
      fields: [
        {
          key: 'channel',
          label: '了解渠道',
          widget: 'select',
          options: ['搜索引擎', '朋友推荐', '社交媒体', '其他'],
          required: true,
        },
        { key: 'score', label: '整体评分', widget: 'rate', required: true },
        { key: 'features', label: '常用功能', widget: 'checkbox-group', options: ['表单配置', '数据统计', '权限管理', '消息通知'] },
        { key: 'useTime', label: '常用时段', widget: 'time-picker' },
        { key: 'notify', label: '接受更新通知', widget: 'switch' },
        { key: 'suggest', label: '改进建议', widget: 'textarea', widgetProps: { rows: 4, placeholder: '说说你的想法…' } },
      ],
      initialValues: { score: 5, notify: true },
    },
  },
}

export const stringifyMeta = (meta) => JSON.stringify(meta, null, 2)

