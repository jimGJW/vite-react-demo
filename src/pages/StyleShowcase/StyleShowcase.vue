<template>
  <div class="style-showcase-page">
    <!-- ========== 页头 + 模式切换 ========== -->
    <div class="showcase-header">
      <div>
        <h2 class="title">样式模块对比 · Ant Design vs Vue (Element Plus)</h2>
        <p class="subtitle">
          同一套数据，两套组件库，对比展示按钮 / 表单 / 表格 / 统计 / 步骤 / 消息等核心组件。
          当前模式：
          <strong :style="{ color: mode === 'antd' ? '#1677ff' : '#409eff' }">
            {{ mode === 'antd' ? 'Ant Design' : 'Vue (Element Plus)' }}
          </strong>
        </p>
      </div>

      <div class="mode-switcher">
        <button
          class="mode-btn antd-btn"
          :class="{ active: mode === 'antd' }"
          @click="setMode('antd')"
        >
          <span class="mode-badge antd">A</span>
          Ant Design
        </button>
        <button
          class="mode-btn vue-btn"
          :class="{ active: mode === 'vue' }"
          @click="setMode('vue')"
        >
          <span class="mode-badge vue">V</span>
          Vue (Element Plus)
        </button>
      </div>
    </div>

    <!-- ========== Ant Design 模式展示区 ========== -->
    <div v-if="mode === 'antd'" class="showcase-section antd-section">
      <el-alert type="info" :closable="false" show-icon class="tip-alert">
        <template #title>
          模式说明：当前为「Ant Design」对比区（使用 React antd 组件库，主色 #1677ff）。
          此页由 Vue SFC 渲染，左侧的 antd 对比可通过切换到 React 实现。
        </template>
      </el-alert>

      <div class="showcase-block">
        <h3>按钮 Button（模拟 Ant Design 风格）</h3>
        <div class="btn-row">
          <el-button style="--el-button-bg-color:#1677ff; --el-button-hover-bg-color:#4096ff; --el-button-active-bg-color:#0958d9" type="primary">主要按钮</el-button>
          <el-button>默认按钮</el-button>
          <el-button>虚线按钮</el-button>
          <el-button text type="primary">文本按钮</el-button>
          <el-button type="danger">危险按钮</el-button>
          <el-button link type="primary">链接按钮</el-button>
        </div>
      </div>

      <div class="showcase-block">
        <h3>标签 Tag（Ant 色板）</h3>
        <div class="tag-row">
          <el-tag color="#1677ff">蓝色</el-tag>
          <el-tag color="#52c41a">绿色</el-tag>
          <el-tag color="#fa8c16">橙色</el-tag>
          <el-tag color="#ff4d4f">红色</el-tag>
          <el-tag color="#722ed1">紫色</el-tag>
        </div>
      </div>

      <div class="showcase-block">
        <h3>表单组件</h3>
        <el-form :model="antdForm" label-width="80px" style="max-width: 520px" label-position="top">
          <el-form-item label="用户名">
            <el-input v-model="antdForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="antdForm.dept" placeholder="请选择部门" style="width: 100%">
              <el-option label="研发部" value="dev" />
              <el-option label="产品部" value="pd" />
              <el-option label="设计部" value="design" />
            </el-select>
          </el-form-item>
          <el-form-item label="年龄">
            <el-input-number v-model="antdForm.age" :min="0" :max="120" style="width: 100%" />
          </el-form-item>
          <el-form-item label="通知开关">
            <el-switch v-model="antdSwitch" />
          </el-form-item>
          <el-form-item label="角色">
            <el-radio-group v-model="antdRadio">
              <el-radio value="a">管理员</el-radio>
              <el-radio value="b">编辑</el-radio>
              <el-radio value="c">访客</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <div class="showcase-block">
        <h3>统计 Statistic</h3>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="hover">
              <el-statistic title="日活" :value="11538" value-style="color:#1677ff" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <el-statistic title="订单" :value="2619" value-style="color:#52c41a" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <el-statistic title="转化率" :value="18.6" :precision="1" suffix="%" value-style="color:#722ed1" />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="showcase-block">
        <h3>进度 &amp; 评分</h3>
        <el-progress :percentage="antdProgress" :stroke-width="10" style="max-width: 480px; margin-bottom: 12px" />
        <el-slider v-model="antdProgress" style="max-width: 480px; margin-bottom: 16px" />
        <el-rate v-model="antdRate" />
      </div>

      <div class="showcase-block">
        <h3>步骤条 Steps</h3>
        <el-steps :active="1" finish-status="success">
          <el-step title="需求" description="需求评审完成" />
          <el-step title="开发" description="前后端联调中" />
          <el-step title="测试" description="QA 回归" />
          <el-step title="上线" description="生产部署" />
        </el-steps>
      </div>

      <div class="showcase-block">
        <h3>数据表格 Table</h3>
        <el-table :data="tableData" stripe border style="width: 100%">
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="age" label="年龄" width="100" sortable />
          <el-table-column prop="dept" label="部门" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :color="statusAntColor(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default>
              <el-button type="primary" link size="small">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="showcase-block">
        <h3>消息提示</h3>
        <div class="btn-row">
          <el-button type="primary" @click="message('success')">Success</el-button>
          <el-button type="warning" @click="message('warning')">Warning</el-button>
          <el-button type="danger" @click="message('error')">Error</el-button>
        </div>
      </div>

      <!-- 对比专题导航 -->
      <div class="showcase-block">
        <h3>专题对比案例（6 大常见特性）</h3>
        <p class="desc">
          点击卡片跳转对应专题页：左栏 Ant Design（React），右栏 Element Plus（Vue 3 SFC），
          附带原理对比表 + 核心代码。
        </p>
        <div class="compare-grid">
          <a
            v-for="c in compareCases"
            :key="c.path"
            class="compare-card"
            @click.prevent="go(c.path)"
          >
            <div class="cc-top">
              <div class="cc-idx">{{ c.idx }}</div>
              <div class="cc-tags">
                <span class="tag antd">A</span>
                <span class="tag vs">vs</span>
                <span class="tag vue">V</span>
              </div>
            </div>
            <div class="cc-title">{{ c.title }}</div>
            <div class="cc-desc">{{ c.desc }}</div>
            <div class="cc-foot">前往查看 →</div>
          </a>
        </div>
      </div>
    </div>

    <!-- ========== Vue (Element Plus) 模式展示区 ========== -->
    <div v-else class="showcase-section vue-section">
      <el-alert type="success" :closable="false" show-icon class="tip-alert">
        <template #title>
          模式说明：当前为「Vue (Element Plus)」对比区（真实 Vue 3 SFC + Element Plus，主色 #409eff）。
        </template>
      </el-alert>

      <div class="showcase-block">
        <h3>按钮 Button</h3>
        <div class="btn-row">
          <el-button type="primary">主要按钮</el-button>
          <el-button>默认按钮</el-button>
          <el-button plain>朴素按钮</el-button>
          <el-button text type="primary">文本按钮</el-button>
          <el-button type="success">成功按钮</el-button>
          <el-button type="warning">警告按钮</el-button>
          <el-button type="danger">危险按钮</el-button>
          <el-button link type="primary">链接按钮</el-button>
        </div>
      </div>

      <div class="showcase-block">
        <h3>标签 Tag</h3>
        <div class="tag-row">
          <el-tag type="primary">蓝色</el-tag>
          <el-tag type="success">绿色</el-tag>
          <el-tag type="warning">橙色</el-tag>
          <el-tag type="danger">红色</el-tag>
          <el-tag type="info">灰色</el-tag>
        </div>
      </div>

      <div class="showcase-block">
        <h3>表单组件</h3>
        <el-form :model="vueForm" label-width="80px" style="max-width: 520px" label-position="top">
          <el-form-item label="用户名">
            <el-input v-model="vueForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="vueForm.dept" placeholder="请选择部门" style="width: 100%">
              <el-option label="研发部" value="dev" />
              <el-option label="产品部" value="pd" />
              <el-option label="设计部" value="design" />
            </el-select>
          </el-form-item>
          <el-form-item label="项目描述">
            <el-input v-model="vueForm.desc" type="textarea" :rows="3" placeholder="请输入描述" />
          </el-form-item>
          <el-form-item label="通知开关">
            <el-switch v-model="vueSwitch" />
          </el-form-item>
          <el-form-item label="角色">
            <el-radio-group v-model="vueRadio">
              <el-radio value="a">管理员</el-radio>
              <el-radio value="b">编辑</el-radio>
              <el-radio value="c">访客</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <div class="showcase-block">
        <h3>统计 Statistic</h3>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="hover">
              <el-statistic title="日活" :value="11538" value-style="color:#409eff" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <el-statistic title="订单" :value="2619" value-style="color:#67c23a" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <el-statistic title="转化率" :value="18.6" :precision="1" suffix="%" value-style="color:#e6a23c" />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="showcase-block">
        <h3>进度条 Progress</h3>
        <el-progress :percentage="vueProgress" :stroke-width="14" style="max-width: 480px; margin-bottom: 12px" />
        <el-slider v-model="vueProgress" style="max-width: 480px" />
      </div>

      <div class="showcase-block">
        <h3>步骤条 Steps</h3>
        <el-steps :active="1" finish-status="success">
          <el-step title="需求" description="需求评审完成" />
          <el-step title="开发" description="前后端联调中" />
          <el-step title="测试" description="QA 回归" />
          <el-step title="上线" description="生产部署" />
        </el-steps>
      </div>

      <div class="showcase-block">
        <h3>数据表格 Table</h3>
        <el-table :data="tableData" stripe border style="width: 100%">
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="age" label="年龄" width="100" sortable />
          <el-table-column prop="dept" label="部门" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default>
              <el-button type="primary" link size="small">编辑</el-button>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="showcase-block">
        <h3>消息提示</h3>
        <div class="btn-row">
          <el-button type="success" @click="message('success')">Success</el-button>
          <el-button type="warning" @click="message('warning')">Warning</el-button>
          <el-button type="danger" @click="message('error')">Error</el-button>
        </div>
      </div>

      <!-- 对比专题导航 -->
      <div class="showcase-block">
        <h3>专题对比案例（6 大常见特性）</h3>
        <p class="desc">
          点击卡片跳转对应专题页：左栏 Ant Design（React），右栏 Element Plus（Vue 3 SFC），
          附带原理对比表 + 核心代码。
        </p>
        <div class="compare-grid">
          <a
            v-for="c in compareCases"
            :key="c.path"
            class="compare-card"
            @click.prevent="go(c.path)"
          >
            <div class="cc-top">
              <div class="cc-idx">{{ c.idx }}</div>
              <div class="cc-tags">
                <span class="tag antd">A</span>
                <span class="tag vs">vs</span>
                <span class="tag vue">V</span>
              </div>
            </div>
            <div class="cc-title">{{ c.title }}</div>
            <div class="cc-desc">{{ c.desc }}</div>
            <div class="cc-foot">前往查看 →</div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

/* ========== 与 React 宿主 StyleMode 同步（通过自定义事件） ========== */
const LS_KEY = 'app.style-mode'
const readMode = () => {
  try { return localStorage.getItem(LS_KEY) || 'antd' } catch { return 'antd' }
}
const writeMode = (m) => {
  try { localStorage.setItem(LS_KEY, m) } catch { /* ignore */ }
}

const mode = ref(readMode())

const syncRootAttr = (m) => {
  const root = document.documentElement
  if (m === 'vue') root.setAttribute('data-ui-mode', 'vue')
  else root.removeAttribute('data-ui-mode')
}

const setMode = (m) => {
  mode.value = m
  writeMode(m)
  syncRootAttr(m)
  // 通知 React 宿主切换模式
  try {
    window.dispatchEvent(new CustomEvent('style-mode-changed', { detail: { mode: m } }))
  } catch { /* ignore */ }
}

// 初始同步
syncRootAttr(mode.value)

// 监听 React 宿主的模式变化（登录页切换）
const onHostMode = (e) => {
  if (e.detail?.mode) {
    mode.value = e.detail.mode
    syncRootAttr(e.detail.mode)
  }
}
onMounted(() => window.addEventListener('style-mode-changed', onHostMode))
onBeforeUnmount(() => window.removeEventListener('style-mode-changed', onHostMode))

/* ========== 共享数据 ========== */
const tableData = [
  { key: '1', name: '胡彦祖', age: 32, dept: '研发部', status: 'active' },
  { key: '2', name: '李大嘴', age: 28, dept: '产品部', status: 'inactive' },
  { key: '3', name: '王建国', age: 45, dept: '设计部', status: 'active' },
  { key: '4', name: '赵小满', age: 22, dept: '市场部', status: 'pending' },
]

const statusTagType = (s) => ({ active: 'success', inactive: 'danger', pending: 'warning' }[s] || 'info')
const statusAntColor = (s) => ({ active: '#52c41a', inactive: '#ff4d4f', pending: '#fa8c16' }[s] || '#909399')
const statusText = (s) => ({ active: '活跃', inactive: '停用', pending: '待审' }[s] || s)

/* ========== Antd 模式状态 ========== */
const antdForm = reactive({ username: '', dept: '', age: undefined })
const antdSwitch = ref(true)
const antdRadio = ref('a')
const antdProgress = ref(68)
const antdRate = ref(4)

/* ========== Vue 模式状态 ========== */
const vueForm = reactive({ username: '', dept: '', desc: '' })
const vueSwitch = ref(true)
const vueRadio = ref('a')
const vueProgress = ref(68)

/* ========== 通用消息 ========== */
const message = (type) => ElMessage[type]({
  success: '操作成功！',
  warning: '请注意风险！',
  error: '操作失败，请稍后重试。',
  info: '这是一条提示信息。',
}[type])

/* ========== 对比专题导航 ========== */
const compareCases = [
  { idx: '01', path: '/compare-parent-child',
    title: '父子组件传值',
    desc: 'props + onChange 回调 vs defineProps + defineEmits' },
  { idx: '02', path: '/compare-two-way',
    title: '双向绑定',
    desc: 'value + onChange 受控组件 vs v-model / defineModel' },
  { idx: '03', path: '/compare-provide',
    title: '跨层传值 Provide/Inject',
    desc: 'createContext + Provider + useContext vs provide + inject' },
  { idx: '04', path: '/compare-state',
    title: '全局状态共享',
    desc: 'Context store（购物车实战） vs reactive + provide store' },
  { idx: '05', path: '/compare-slot',
    title: '插槽 / Children 分发',
    desc: 'children / 命名 props / renderItem vs default / named / scoped slot' },
  { idx: '06', path: '/compare-ref',
    title: 'Ref / DOM 操作',
    desc: 'useRef + forwardRef/useImperativeHandle vs ref + defineExpose' },
]
const go = (path) => {
  // 通过 React Router 跳转（宿主是 React），优先使用 window.history state 变更触发 react-router
  // 直接 location.href 不触发 react-router 同步；这里自定义事件让 Layout 监听更稳
  try {
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { path } }))
  } catch {}
  // fallback：直接修改
  setTimeout(() => { window.location.hash = `#${path}` }, 0)
}
</script>

<style scoped>
.style-showcase-page {
  padding: 0 4px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== 页头 ========== */
.showcase-header {
  padding: 24px;
  background: linear-gradient(135deg, #1677ff 0%, #722ed1 50%, #13c2c2 100%);
  color: #fff;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.2);

  .title {
    margin: 0 0 8px;
    font-size: clamp(18px, 2vw, 22px);
    font-weight: 600;
  }
  .subtitle {
    margin: 0;
    opacity: 0.94;
    font-size: 14px;
  }
}

/* ========== 模式切换按钮 ========== */
.mode-switcher {
  display: flex;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}
.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}
.mode-btn:hover { background: rgba(255, 255, 255, 0.18); }
.mode-btn.active { background: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
.antd-btn.active { color: #1677ff; }
.vue-btn.active { color: #409eff; }

.mode-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
.mode-badge.antd { background: #1677ff; }
.mode-btn.active .mode-badge.antd { background: #1677ff; color: #fff; }
.mode-badge.vue { background: #409eff; }
.mode-btn.active .mode-badge.vue { background: #409eff; color: #fff; }

/* ========== 展示区块 ========== */
.showcase-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tip-alert {
  border-radius: 8px;
}

.showcase-block {
  padding: 20px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  h3 {
    margin: 0 0 16px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #f0f0f0;
    font-size: 16px;
    color: #1f1f1f;
    font-weight: 600;
  }
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

/* 对比卡片导航 */
.desc {
  margin: 4px 0 14px !important;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
}
.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}
.compare-card {
  position: relative;
  display: block;
  padding: 14px 14px 12px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  overflow: hidden;
  &:hover {
    transform: translateY(-2px);
    border-color: #409eff;
    box-shadow: 0 8px 22px rgba(64,158,255,0.18);
  }
}
.cc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.cc-idx {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #1677ff, #722ed1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.cc-tags { display: flex; align-items: center; gap: 3px; }
.cc-tags .tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px; height: 22px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}
.cc-tags .tag.antd { background: #1677ff; }
.cc-tags .tag.vue  { background: #409eff; }
.cc-tags .tag.vs {
  background: #f0f0f0;
  color: #888;
  font-size: 9px;
  width: 20px; height: 18px;
  border-radius: 4px;
}
.cc-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 4px;
}
.cc-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
  min-height: 36px;
  margin-bottom: 8px;
}
.cc-foot {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
}
</style>
