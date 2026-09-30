<template>
  <div class="fb-page">
    <header class="page-header-vue">
      <h1>反馈与加载 · Feedback</h1>
      <p>Element Plus 全套反馈能力：Message / Notification / MessageBox / Loading / Progress / Skeleton / Empty / Result / Alert</p>
    </header>

    <!-- Message -->
    <section class="fb-card">
      <h3>ElMessage · 轻提示</h3>
      <p class="fb-desc">自动消失的顶部提示，适合「操作结果」这类一次性反馈。</p>
      <div class="fb-row">
        <el-button type="success" @click="msg('success')">成功</el-button>
        <el-button type="warning" @click="msg('warning')">警告</el-button>
        <el-button type="danger" @click="msg('error')">错误</el-button>
        <el-button type="info" @click="msg('info')">信息</el-button>
        <el-button @click="batchMsgs">连发 3 条（验证分组）</el-button>
        <el-button :loading="hanging" @click="hang">长耗时提示（可关闭）</el-button>
      </div>
    </section>

    <!-- Notification -->
    <section class="fb-card">
      <h3>ElNotification · 通知</h3>
      <p class="fb-desc">右上角卡片通知，支持标题 / 内容 / 时长 / 点击回调。</p>
      <div class="fb-row">
        <el-button @click="notify('info')">普通通知</el-button>
        <el-button @click="notify('success')">成功通知</el-button>
        <el-button @click="notify('warning')">警告通知</el-button>
        <el-button @click="notify('error')">错误通知（不自动关闭）</el-button>
      </div>
    </section>

    <!-- MessageBox -->
    <section class="fb-card">
      <h3>ElMessageBox · 模态确认</h3>
      <p class="fb-desc">破坏性操作一律走「二次确认」，并区分 confirm / prompt / alert 三种形态。</p>
      <div class="fb-row">
        <el-button @click="confirmDelete">删除确认（返回结果）</el-button>
        <el-button @click="promptInput">输入确认（prompt）</el-button>
        <el-button @click="alertOnly">纯提示（alert）</el-button>
        <el-button @click="customHtml">自定义内容 + 校验</el-button>
      </div>
      <div class="fb-row">
        <span class="m-chip m-chip--info">最近操作：{{ confirmResult }}</span>
      </div>
    </section>

    <!-- Loading / Progress -->
    <section class="fb-card">
      <h3>Loading · Progress · Skeleton</h3>
      <p class="fb-desc">加载态三种粒度：整区遮罩（Loading）、进度条（Progress）、骨架屏（Skeleton）。</p>
      <div class="fb-grid">
        <div v-loading="loadingArea" class="fb-box" element-loading-text="正在加载区块数据…">
          <div class="fb-box__title">区域 Loading</div>
          <p class="fb-desc" style="margin: 0">点击右侧按钮触发 1.6s 遮罩加载。</p>
        </div>
        <div class="fb-box">
          <div class="fb-box__title">Progress（{{ progress }}%）</div>
          <el-progress :percentage="progress" :status="progress === 100 ? 'success' : ''" />
          <el-progress :percentage="progress" :stroke-width="14" striped striped-flow />
          <div class="fb-row" style="margin-top: 8px">
            <el-button size="small" :disabled="progress >= 100" @click="tick">+20%</el-button>
            <el-button size="small" @click="progress = 0">归零</el-button>
            <el-button size="small" @click="loadingArea = true">触发区域 Loading</el-button>
          </div>
        </div>
        <div class="fb-box">
          <div class="fb-box__title">Skeleton</div>
          <el-skeleton v-if="skeletonOn" :rows="4" animated />
          <template v-else>
            <p class="fb-desc" style="margin: 0">骨架屏加载完毕，真实内容已就绪。</p>
            <el-button size="small" @click="skeletonOn = true">重新加载</el-button>
          </template>
        </div>
      </div>
    </section>

    <!-- Empty / Result / Alert -->
    <section class="fb-card">
      <h3>Empty · Result · Alert</h3>
      <div class="fb-grid">
        <div class="fb-box">
          <div class="fb-box__title">Empty</div>
          <el-empty description="暂无数据，先添加一条吧" :image-size="72">
            <el-button type="primary" size="small" @click="msg('success')">去添加</el-button>
          </el-empty>
        </div>
        <div class="fb-box">
          <div class="fb-box__title">Result（四种状态）</div>
          <el-tabs v-model="resultTab">
            <el-tab-pane label="成功" name="success">
              <el-result icon="success" title="提交成功" sub-title="审批流已发起" />
            </el-tab-pane>
            <el-tab-pane label="警告" name="warning">
              <el-result icon="warning" title="存在风险项" sub-title="请复核 2 条待处理告警" />
            </el-tab-pane>
            <el-tab-pane label="失败" name="error">
              <el-result icon="error" title="执行失败" sub-title="接口返回 500，请稍后重试" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <div class="fb-row" style="margin-top: 12px; flex-direction: column; align-items: stretch">
        <el-alert title="普通信息提示" type="info" show-icon :closable="false" />
        <el-alert title="成功：配置已同步到 3 个分区" type="success" show-icon :closable="false" />
        <el-alert title="警告：该楼栋有 2 个房间处于告警态" type="warning" show-icon />
        <el-alert title="错误：网关超时，请检查网络" type="error" show-icon description="TraceId: vue-app-9f3c2a" />
      </div>
    </section>

    <!-- 自研 toast 对照 -->
    <section class="fb-card">
      <h3>对照：自研 useToast（不依赖 UI 库）</h3>
      <p class="fb-desc">同一个提示诉求，用组合式函数 + 20 行 CSS 也能做到，便于整体搬迁到别的工程。</p>
      <div class="fb-row">
        <button class="m-btn" type="button" @click="toast.info('自研 toast：普通提示')">info</button>
        <button class="m-btn m-btn--primary" type="button" @click="toast.success('自研 toast：操作成功')">success</button>
        <button class="m-btn" type="button" @click="toast.error('自研 toast：请求失败')">error</button>
      </div>
      <ul class="fb-toasts">
        <li v-for="t in toast.items.value" :key="t.id" class="m-chip" :class="`m-chip--${toastTone(t.type)}`">
          {{ t.text }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  ElMessage, ElMessageBox, ElNotification,
} from 'element-plus'
import { useToast } from '../composables'

const MESSAGES = {
  success: '操作成功，配置已保存',
  warning: '当前有 2 条未处理告警',
  error: '请求失败：网关超时 504',
  info: '已切换到只读模式',
}
const msg = (type) => ElMessage({ type, message: MESSAGES[type], grouping: true })

const hanging = ref(false)
const hang = () => {
  hanging.value = true
  const close = ElMessage({ type: 'info', message: '正在上传，请稍候…', duration: 0 })
  setTimeout(() => {
    close.close()
    hanging.value = false
    ElMessage.success('上传完成')
  }, 1800)
}
const batchMsgs = () => {
  ;['第 1 条', '第 2 条', '第 3 条'].forEach((t, i) => setTimeout(() => {
    ElMessage({ message: `${t}：批量消息分组演示`, grouping: true })
  }, i * 220))
}

const notify = (type) => ElNotification({
  type,
  title: { info: '提示', success: '成功', warning: '警告', error: '错误' }[type],
  message: '这是来自 vue-app 子应用的通知，可用于异步任务完成提醒。',
  duration: type === 'error' ? 0 : 3000,
})

const confirmResult = ref('（尚未操作）')
const confirmDelete = async () => {
  try {
    await ElMessageBox.confirm('删除后该监控点不再上报数据，确认删除？', '删除确认', {
      type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '再想想',
    })
    confirmResult.value = '已确认删除'
    ElMessage.success('删除成功')
  } catch {
    confirmResult.value = '已取消删除'
    ElMessage.info('已取消')
  }
}
const promptInput = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的监控点名称', '重命名', {
      inputPlaceholder: '例如：A 座-301',
      inputPattern: /^.{2,20}$/,
      inputErrorMessage: '长度需 2-20 个字符',
    })
    confirmResult.value = `重命名为「${value}」`
    ElMessage.success('已重命名')
  } catch {
    confirmResult.value = '已取消重命名'
  }
}
const alertOnly = () => {
  ElMessageBox.alert('该功能在本地演示环境下不会真正调用后端接口。', '环境说明', { confirmButtonText: '知道了' })
  confirmResult.value = '已阅读环境说明'
}
const customHtml = async () => {
  try {
    await ElMessageBox.confirm(
      '<div style="line-height:1.8;font-size:13px;color:#606266">'
      + '本次将同步以下内容：<br/>· 房间基础信息（128 条）<br/>· 阈值配置（36 条）<br/>'
      + '<span style="color:#f56c6c">· 告警规则（5 条，覆盖后将无法回滚）</span></div>',
      '同步确认',
      { dangerouslyUseHTMLString: true, type: 'warning', confirmButtonText: '确认同步' },
    )
    confirmResult.value = '已确认同步配置'
    ElMessage.success('同步任务已下发')
  } catch {
    confirmResult.value = '已取消同步'
  }
}

const loadingArea = ref(false)
const progress = ref(40)
const skeletonOn = ref(false)
const resultTab = ref('success')
const tick = () => { progress.value = Math.min(100, progress.value + 20) }

const toast = useToast(2600)
const toastTone = (type) => ({ info: 'info', success: 'ok', warn: 'warn', error: 'danger' }[type] || '')
</script>

<style scoped>
.fb-page { padding: 20px 24px 44px; }
.fb-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.fb-card h3 { margin: 0 0 4px; font-size: 15px; color: #303133; }
.fb-desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.7; }
.fb-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.fb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.fb-box {
  border: 1px solid #f0f2f5; border-radius: 8px; padding: 12px 14px; background: #fcfdff;
  min-height: 120px;
}
.fb-box__title { font-size: 12.5px; font-weight: 600; color: #606266; margin-bottom: 8px; }
.fb-toasts { list-style: none; margin: 10px 0 0; padding: 0; display: flex; gap: 6px; flex-wrap: wrap; }
</style>
