<template>
  <div class="vue-components-page">
    <!-- ========== 页头 ========== -->
    <div class="page-header-vue">
      <h1>Vue 组件展示 · Element Plus 风格</h1>
      <p>基于 Vue 3 SFC + Element Plus 实现，主色 #409eff，圆角 4px</p>
      <div class="vue-tags-row">
        <el-tag type="primary">Button</el-tag>
        <el-tag type="success">Input</el-tag>
        <el-tag type="warning">Table</el-tag>
        <el-tag type="danger">Form</el-tag>
        <el-tag type="info">Tag</el-tag>
        <el-tag type="primary">Switch</el-tag>
        <el-tag type="success">Statistic</el-tag>
        <el-tag type="warning">Progress</el-tag>
        <el-tag type="danger">Steps</el-tag>
        <el-tag type="info">Tabs</el-tag>
      </div>
    </div>

    <!-- ========== 按钮 ========== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Promotion /></el-icon>
          <span>按钮 Button</span>
        </div>
      </template>
      <div class="btn-row">
        <el-button type="primary">主要按钮</el-button>
        <el-button>默认按钮</el-button>
        <el-button type="success">成功按钮</el-button>
        <el-button type="warning">警告按钮</el-button>
        <el-button type="danger">危险按钮</el-button>
        <el-button type="info">信息按钮</el-button>
      </div>
      <div class="btn-row" style="margin-top: 12px">
        <el-button type="primary" size="small">小型</el-button>
        <el-button type="primary">默认</el-button>
        <el-button type="primary" size="large">大型</el-button>
        <el-button type="primary" disabled>禁用</el-button>
        <el-button plain>朴素按钮</el-button>
        <el-button round type="primary">圆角</el-button>
        <el-button circle type="primary" :icon="Search" />
      </div>
      <div class="btn-row" style="margin-top: 12px">
        <el-button type="primary" :icon="Edit">编辑</el-button>
        <el-button type="success" :icon="Check">提交</el-button>
        <el-button type="danger" :icon="Delete">删除</el-button>
        <el-button :icon="Search">搜索</el-button>
        <el-button :icon="Upload">上传</el-button>
        <el-button :icon="Download">下载</el-button>
      </div>
    </el-card>

    <!-- ========== 标签 Tag ========== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><PriceTag /></el-icon>
          <span>标签 Tag</span>
        </div>
      </template>
      <div class="tag-row">
        <el-tag>标签一</el-tag>
        <el-tag type="success">标签二</el-tag>
        <el-tag type="info">标签三</el-tag>
        <el-tag type="warning">标签四</el-tag>
        <el-tag type="danger">标签五</el-tag>
      </div>
      <div class="tag-row" style="margin-top: 12px">
        <el-tag effect="dark">Dark</el-tag>
        <el-tag type="success" effect="dark">Dark</el-tag>
        <el-tag type="info" effect="dark">Dark</el-tag>
        <el-tag type="warning" effect="dark">Dark</el-tag>
        <el-tag type="danger" effect="dark">Dark</el-tag>
      </div>
      <div class="tag-row" style="margin-top: 12px">
        <el-tag effect="plain">Plain</el-tag>
        <el-tag type="success" effect="plain">Plain</el-tag>
        <el-tag type="info" effect="plain">Plain</el-tag>
        <el-tag type="warning" effect="plain">Plain</el-tag>
        <el-tag type="danger" effect="plain">Plain</el-tag>
        <el-tag closable @close="onTagClose">可关闭</el-tag>
      </div>
    </el-card>

    <!-- ========== 标签页 Tabs ========== -->
    <el-card class="section-card" shadow="hover">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 表格 -->
        <el-tab-pane label="数据表格" name="table">
          <el-table :data="tableData" stripe border style="width: 100%">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="age" label="年龄" width="100" sortable />
            <el-table-column prop="dept" label="部门" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" effect="light">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140">
              <template #default>
                <el-button type="primary" link size="small">编辑</el-button>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 表单 -->
        <el-tab-pane label="表单组件" name="form">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
            style="max-width: 560px"
          >
            <el-form-item label="用户名" prop="name">
              <el-input v-model="form.name" placeholder="请输入用户名" clearable />
            </el-form-item>
            <el-form-item label="部门" prop="dept">
              <el-select v-model="form.dept" placeholder="请选择部门" style="width: 100%" clearable>
                <el-option label="研发部" value="dev" />
                <el-option label="产品部" value="pd" />
                <el-option label="设计部" value="design" />
              </el-select>
            </el-form-item>
            <el-form-item label="项目描述" prop="desc">
              <el-input v-model="form.desc" type="textarea" :rows="3" placeholder="请输入项目描述" />
            </el-form-item>
            <el-form-item label="开启通知">
              <el-switch v-model="switchVal" />
            </el-form-item>
            <el-form-item label="角色">
              <el-radio-group v-model="radioVal">
                <el-radio value="a">管理员</el-radio>
                <el-radio value="b">编辑</el-radio>
                <el-radio value="c">访客</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="日期">
              <el-date-picker
                v-model="dateVal"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitForm">提交</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 统计 & 进度 -->
        <el-tab-pane label="统计 & 进度" name="statistic">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover">
                <el-statistic title="日活用户" :value="11538" :precision="0">
                  <template #prefix><el-icon><User /></el-icon></template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover">
                <el-statistic title="订单总数" :value="2619" :precision="0" value-style="color:#67c23a">
                  <template #prefix><el-icon><Goods /></el-icon></template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover">
                <el-statistic title="转化率" :value="18.6" :precision="1" suffix="%" value-style="color:#e6a23c">
                  <template #prefix><el-icon><TrendCharts /></el-icon></template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover">
                <el-statistic title="平均耗时" :value="3.2" :precision="1" suffix="s" value-style="color:#f56c6c">
                  <template #prefix><el-icon><Timer /></el-icon></template>
                </el-statistic>
              </el-card>
            </el-col>
          </el-row>

          <el-divider content-position="left">进度控制</el-divider>
          <div style="max-width: 640px; display: flex; flex-direction: column; gap: 8px">
            <div class="progress-label">项目进度：{{ progress }}%</div>
            <el-progress :percentage="progress" :stroke-width="20" />
            <el-slider v-model="progress" :min="0" :max="100" />
          </div>

          <el-divider content-position="left">环形进度</el-divider>
          <div style="display: flex; gap: 32px; flex-wrap: wrap">
            <el-progress type="circle" :percentage="progress" :width="120" />
            <el-progress type="circle" :percentage="75" status="success" :width="120" />
            <el-progress type="circle" :percentage="40" status="warning" :width="120" />
            <el-progress type="dashboard" :percentage="progress" :width="120" />
          </div>
        </el-tab-pane>

        <!-- 步骤 & 消息 -->
        <el-tab-pane label="步骤 & 消息" name="steps">
          <el-steps :active="currentStep" finish-status="success" align-center>
            <el-step title="需求评审" description="完成需求文档" />
            <el-step title="开发联调" description="前后端对接" />
            <el-step title="测试验收" description="QA 回归" />
            <el-step title="上线发布" description="生产部署" />
          </el-steps>
          <div style="margin-top: 24px; display: flex; justify-content: center; gap: 12px">
            <el-button @click="currentStep = Math.max(0, currentStep - 1)">上一步</el-button>
            <el-button type="primary" @click="currentStep = Math.min(3, currentStep + 1)">下一步</el-button>
          </div>

          <el-divider content-position="left">消息提示 ElMessage</el-divider>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <el-button type="success" @click="msg('success')">Success</el-button>
            <el-button type="warning" @click="msg('warning')">Warning</el-button>
            <el-button type="danger" @click="msg('error')">Error</el-button>
            <el-button type="info" @click="msg('info')">Info</el-button>
          </div>

          <el-divider content-position="left">通知 ElNotification</el-divider>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <el-button @click="notify('success')">Success 通知</el-button>
            <el-button type="warning" @click="notify('warning')">Warning 通知</el-button>
            <el-button type="danger" @click="notify('error')">Error 通知</el-button>
            <el-button type="info" @click="notify('info')">Info 通知</el-button>
          </div>

          <el-divider content-position="left">消息框 ElMessageBox</el-divider>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <el-button type="primary" @click="confirmBox">确认框</el-button>
            <el-button type="warning" @click="promptBox">输入框</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import {
  ElMessage, ElNotification, ElMessageBox,
} from 'element-plus'
import {
  Promotion, PriceTag, Search, Edit, Check, Delete, Upload, Download,
  User, Goods, TrendCharts, Timer,
} from '@element-plus/icons-vue'

/* ========== 表格数据 ========== */
const tableData = [
  { key: '1', name: '胡彦祖', age: 32, dept: '研发部', status: 'active' },
  { key: '2', name: '李大嘴', age: 28, dept: '产品部', status: 'inactive' },
  { key: '3', name: '王建国', age: 45, dept: '设计部', status: 'active' },
  { key: '4', name: '赵小满', age: 22, dept: '市场部', status: 'pending' },
]

const statusTagType = (s) => ({ active: 'success', inactive: 'danger', pending: 'warning' }[s] || 'info')
const statusText = (s) => ({ active: '活跃', inactive: '停用', pending: '待审' }[s] || s)

/* ========== 表单 ========== */
const formRef = ref(null)
const form = reactive({
  name: '',
  dept: '',
  desc: '',
})
const rules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  dept: [{ required: true, message: '请选择部门', trigger: 'change' }],
  desc: [{ required: false }],
}
const switchVal = ref(true)
const radioVal = ref('a')
const dateVal = ref('')

const submitForm = async () => {
  try {
    await formRef.value.validate()
    ElMessage.success('提交成功')
  } catch {
    ElMessage.warning('表单校验失败')
  }
}
const resetForm = () => {
  formRef.value.resetFields()
  switchVal.value = true
  radioVal.value = 'a'
  dateVal.value = ''
  ElMessage.info('已重置')
}

/* ========== Tabs / Steps / Progress ========== */
const activeTab = ref('table')
const progress = ref(68)
const currentStep = ref(1)

/* ========== 消息 / 通知 / 消息框 ========== */
const msg = (type) => ElMessage[type]({
  success: '操作成功！数据已保存。',
  warning: '请注意：当前操作存在风险。',
  error: '操作失败，请稍后重试。',
  info: '这是一条提示信息。',
}[type] || '')

const notify = (type) => ElNotification[type]({
  title: ({ success: '成功', warning: '注意', error: '错误', info: '提示' }[type]),
  message: `这是一条 ${type} 级别的通知消息，展示 Element Plus Notification 效果。`,
  duration: 3000,
})

const confirmBox = async () => {
  try {
    await ElMessageBox.confirm('此操作将永久删除该文件，是否继续？', '温馨提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('删除成功')
  } catch {
    ElMessage.info('已取消')
  }
}

const promptBox = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入项目名称', '新建项目', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '项目名称不能为空',
    })
    ElMessage.success(`已创建：${value}`)
  } catch {
    ElMessage.info('已取消')
  }
}

/* ========== Tag 关闭 ========== */
const onTagClose = () => ElMessage.info('标签已关闭')
</script>

<style scoped>
.vue-components-page {
  padding: 0 4px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header-vue {
  padding: 20px 24px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.25);

  h1 {
    margin: 0 0 6px;
    font-size: clamp(18px, 2vw, 22px);
    font-weight: 600;
  }
  p {
    margin: 0 0 12px;
    opacity: 0.92;
    font-size: 14px;
  }
}

.vue-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.section-card {
  border-radius: 8px;
}

.card-header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}
</style>
