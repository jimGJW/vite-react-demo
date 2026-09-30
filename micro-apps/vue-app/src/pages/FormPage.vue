<template>
  <div class="form-page">
    <header class="page-header-vue">
      <h1>表单与校验 · Form</h1>
      <p>三步向导 + 动态字段 + 规则引擎（自研 createValidator）双轨：既用 Element Plus 校验，也演示不依赖 UI 库的纯函数校验</p>
    </header>

    <!-- 分步向导 -->
    <section class="form-card">
      <h3>分步向导（useStepper）</h3>
      <div class="form-steps">
        <div
          v-for="(s, i) in steps" :key="s.key"
          class="form-step" :class="{ 'is-active': i === stepper.index.value, 'is-done': i < stepper.index.value }"
          @click="stepper.goTo(i)"
        >
          <span class="form-step__no">{{ i + 1 }}</span>
          <span class="form-step__label">{{ s.label }}</span>
        </div>
      </div>
      <div class="form-progress">
        <ProgressRing :percent="stepper.progress.value" :size="60" :stroke="6" />
        <div>
          <div class="form-progress__title">当前步骤：{{ stepper.current.value.label }}</div>
          <div class="form-progress__desc">{{ stepper.current.value.desc }}</div>
        </div>
      </div>
    </section>

    <!-- 步骤一：基本信息（Element Plus 校验） -->
    <section v-if="stepper.current.value.key === 'base'" class="form-card">
      <h3>步骤一 · 基本信息</h3>
      <el-form ref="baseFormRef" :model="baseForm" :rules="baseRules" label-width="96px" style="max-width: 520px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="baseForm.name" placeholder="2-20 字" clearable />
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-input v-model="baseForm.owner" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="归属城市" prop="city">
          <el-select v-model="baseForm.city" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="上线时间" prop="date">
          <el-date-picker v-model="baseForm.date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="技术栈">
          <TagInput v-model="baseForm.stack" :max="5" placeholder="回车添加技术栈" />
        </el-form-item>
      </el-form>
    </section>

    <!-- 步骤二：动态字段 -->
    <section v-if="stepper.current.value.key === 'fields'" class="form-card">
      <h3>步骤二 · 动态字段（增删字段行）</h3>
      <p class="form-desc">字段类型切换会改变渲染控件；删除/新增行实时影响配置行数。</p>
      <div v-for="(f, i) in dynamicFields" :key="f.id" class="form-dynrow">
        <el-input v-model="f.key" placeholder="字段名" style="width: 170px" />
        <el-select v-model="f.type" style="width: 130px">
          <el-option label="文本" value="text" />
          <el-option label="数字" value="number" />
          <el-option label="开关" value="boolean" />
          <el-option label="下拉" value="select" />
        </el-select>
        <component
          :is="controlOf(f.type)"
          v-model="f.value"
          v-bind="f.type === 'select' ? { options: f.options } : f.type === 'number' ? { min: 0, max: 999 } : {}"
          style="width: 200px"
        />
        <el-switch v-model="f.required" active-text="必填" />
        <el-button type="danger" link @click="removeField(i)">删除</el-button>
      </div>
      <el-button type="primary" plain @click="addField">+ 新增字段</el-button>
    </section>

    <!-- 步骤三：规则引擎 + 预览 -->
    <section v-if="stepper.current.value.key === 'validate'" class="form-card">
      <h3>步骤三 · 规则引擎（纯函数校验）</h3>
      <p class="form-desc">
        同一份值同时跑「Element Plus 表单校验」和「createValidator 规则引擎」——前者绑定 UI，后者可复用到任意端。
      </p>
      <div class="form-grid2">
        <div>
          <div class="form-sub">逐字段结果（Element Plus 风格）</div>
          <ul class="form-result">
            <li v-for="r in fieldResults" :key="r.field" :class="r.pass ? 'is-pass' : 'is-fail'">
              <b>{{ r.pass ? '✓' : '✗' }}</b> {{ r.label }} — {{ r.msg }}
            </li>
          </ul>
        </div>
        <div>
          <div class="form-sub">规则引擎汇总（createValidator）</div>
          <ul class="form-result">
            <li :class="validatorResult.valid ? 'is-pass' : 'is-fail'">
              <b>{{ validatorResult.valid ? '✓' : '✗' }}</b>
              整体校验 — {{ validatorResult.valid ? '全部规则通过' : `${errorCount} 项未通过` }}
            </li>
            <li v-if="!validatorResult.valid" class="is-fail">
              <b>!</b> 首个错误 — {{ validatorResult.firstError }}
            </li>
            <li :class="passRate === 100 ? 'is-pass' : ''">
              <b>%</b> 通过率 — {{ passRate }}%（{{ fieldResults.length - errorCount }} / {{ fieldResults.length }}）
            </li>
          </ul>
          <div class="form-row">
            <span class="m-chip" :class="validatorResult.valid ? 'm-chip--ok' : 'm-chip--danger'">
              {{ validatorResult.valid ? '可以提交' : '暂不可提交' }}
            </span>
          </div>
        </div>
      </div>

      <div class="form-sub" style="margin-top: 16px">提交预览</div>
      <pre class="form-preview">{{ JSON.stringify(previewPayload, null, 2) }}</pre>
    </section>

    <!-- 操作区 -->
    <section class="form-card form-actions">
      <el-button :disabled="stepper.isFirst.value" @click="stepper.prev()">上一步</el-button>
      <el-button v-if="!stepper.isLast.value" type="primary" @click="onNext">下一步</el-button>
      <el-button v-else type="success" @click="submit">提交</el-button>
      <el-button @click="resetAll">重置全部</el-button>
      <span class="m-chip m-chip--info">已填 {{ filledCount }} / {{ totalCount }} 项</span>
      <span v-if="lastSubmit" class="m-chip m-chip--ok">最近提交：{{ lastSubmit }}</span>
    </section>

    <!-- 提交记录 -->
    <section class="form-card">
      <h3>提交记录（Timeline）</h3>
      <Timeline :nodes="submitLogs" />
      <el-button v-if="submitLogs.length" link type="danger" @click="submitLogs = []">清空记录</el-button>
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref, watch } from 'vue'
import { ElInput, ElInputNumber, ElMessage, ElSwitch, ElSelect, ElOption } from 'element-plus'
import { ProgressRing, TagInput, Timeline } from '../components'
import { useStepper } from '../composables'
import { createValidator, rules, formatDate } from '../utils'

/* —— 步骤 —— */
const steps = [
  { key: 'base', label: '基本信息', desc: '名称 / 负责人 / 城市 / 上线时间 / 技术栈' },
  { key: 'fields', label: '动态字段', desc: '按需增删字段行，切换类型即换控件' },
  { key: 'validate', label: '校验与提交', desc: '双轨校验 + 预览 + 提交记录' },
]
const stepper = useStepper(steps)

/* —— 基表单 —— */
const baseFormRef = ref(null)
const cityOptions = ['北京', '上海', '广州', '深圳', '杭州', '成都']
const baseForm = reactive({
  name: '',
  owner: '',
  city: '',
  date: '',
  stack: ['Vue 3'],
})
const baseRules = {
  name: [
    { required: true, message: '项目名称必填', trigger: 'blur' },
    { min: 2, max: 20, message: '长度 2-20 字', trigger: 'blur' },
  ],
  owner: [{ required: true, message: '负责人必填', trigger: 'blur' }],
  city: [{ required: true, message: '请选择归属城市', trigger: 'change' }],
  date: [{ required: true, message: '请选择上线时间', trigger: 'change' }],
}

/* —— 动态字段 —— */
let seq = 0
const newField = (type = 'text') => ({
  id: `f${++seq}`,
  key: `字段${seq}`,
  type,
  value: type === 'boolean' ? true : type === 'number' ? 0 : '',
  options: ['选项 A', '选项 B'],
  required: false,
})
const dynamicFields = ref([newField('text'), newField('number'), newField('boolean')])
const addField = () => { dynamicFields.value = [...dynamicFields.value, newField()] }
const removeField = (i) => { dynamicFields.value = dynamicFields.value.filter((_, idx) => idx !== i) }

/** 动态控件：用渲染函数直接产出对应 Element Plus 控件（避免 v-if 分支爆炸） */
const controlOf = (type) => defineComponent({
  props: { modelValue: { default: null }, options: { type: Array, default: () => [] }, min: Number, max: Number },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const onUpdate = (v) => emit('update:modelValue', v)
      if (type === 'number') return h(ElInputNumber, { modelValue: props.modelValue, min: props.min, max: props.max, 'onUpdate:modelValue': onUpdate })
      if (type === 'boolean') return h(ElSwitch, { modelValue: props.modelValue, 'onUpdate:modelValue': onUpdate })
      if (type === 'select') {
        return h(ElSelect, { modelValue: props.modelValue, 'onUpdate:modelValue': onUpdate, placeholder: '请选择' },
          () => props.options.map((o) => h(ElOption, { key: o, label: o, value: o })))
      }
      return h(ElInput, { modelValue: props.modelValue, 'onUpdate:modelValue': onUpdate, placeholder: '请输入' })
    }
  },
})

/* —— 校验双轨 —— */
const validate = createValidator({
  name: [rules.required('项目名称'), rules.minLen(2, '项目名称'), rules.maxLen(20, '项目名称')],
  owner: [rules.required('负责人'), rules.minLen(2, '负责人')],
  city: [rules.required('归属城市')],
  date: [rules.required('上线时间'), rules.pattern(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD')],
  stack: [(v) => (Array.isArray(v) && v.length ? true : '至少添加 1 个技术栈')],
})

const validatorResult = computed(() => validate({ ...baseForm }))

const FIELD_LABELS = { name: '项目名称', owner: '负责人', city: '归属城市', date: '上线时间', stack: '技术栈' }
const fieldResults = computed(() => Object.entries(FIELD_LABELS).map(([field, label]) => {
  const msg = validatorResult.value.errors[field]
  return { field, label, msg: msg || '通过', pass: !msg }
}))
const errorCount = computed(() => Object.keys(validatorResult.value.errors).length)
const passRate = computed(() => (
  fieldResults.value.length
    ? Math.round(((fieldResults.value.length - errorCount.value) / fieldResults.value.length) * 100)
    : 100
))

/* —— 预览与提交 —— */
const previewPayload = computed(() => ({
  base: { ...baseForm },
  dynamic: dynamicFields.value.map(({ key, type, value, required }) => ({ key, type, value, required })),
}))

const filledCount = computed(() => {
  let n = 0
  if (baseForm.name) n += 1
  if (baseForm.owner) n += 1
  if (baseForm.city) n += 1
  if (baseForm.date) n += 1
  if (baseForm.stack.length) n += 1
  n += dynamicFields.value.filter((f) => f.value !== '' && f.value !== null).length
  return n
})
const totalCount = computed(() => 5 + dynamicFields.value.length)

const submitLogs = ref([])
const lastSubmit = ref('')

/** 下一步：前两步做「软校验」，避免带着错往下走 */
const onNext = async () => {
  if (stepper.current.value.key === 'base') {
    const ok = await baseFormRef.value?.validate().catch(() => false)
    if (!ok) {
      ElMessage.warning('请先补全基本信息')
      return
    }
  }
  if (stepper.current.value.key === 'fields' && !dynamicFields.value.length) {
    ElMessage.warning('至少保留一个字段')
    return
  }
  stepper.next()
}

const submit = () => {
  if (!validatorResult.value.valid) {
    ElMessage.error(`校验未通过：${validatorResult.value.firstError}`)
    return
  }
  const at = formatDate(new Date(), 'HH:mm:ss')
  lastSubmit.value = at
  submitLogs.value = [
    {
      title: `提交成功 · ${baseForm.name}`,
      time: at,
      desc: `${baseForm.city} / ${baseForm.owner} / 动态字段 ${dynamicFields.value.length} 个`,
      tone: 'ok',
    },
    ...submitLogs.value,
  ]
  ElMessage.success('提交成功')
}

const resetAll = () => {
  baseForm.name = ''
  baseForm.owner = ''
  baseForm.city = ''
  baseForm.date = ''
  baseForm.stack = []
  dynamicFields.value = [newField('text')]
  stepper.goTo(0)
  lastSubmit.value = ''
  ElMessage.info('已重置')
}

watch(() => stepper.current.value.key, () => { /* 切步时可做埋点/懒加载，这里留钩子 */ })
</script>

<style scoped>
.form-page { padding: 20px 24px 44px; }
.form-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.form-card h3 { margin: 0 0 10px; font-size: 15px; color: #303133; }
.form-desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.7; }
.form-sub { font-size: 12.5px; font-weight: 600; color: #606266; margin-bottom: 8px; }

.form-steps { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.form-step {
  display: flex; align-items: center; gap: 7px;
  border: 1px solid #dcdfe6; border-radius: 999px; background: #fff;
  padding: 5px 14px 5px 6px; font-size: 12.5px; color: #909399; cursor: pointer;
  transition: all 0.15s;
}
.form-step__no {
  width: 20px; height: 20px; border-radius: 50%; background: #f0f2f5; color: #909399;
  display: inline-flex; align-items: center; justify-content: center; font-size: 11px;
}
.form-step.is-active { border-color: #409eff; color: #409eff; background: #ecf5ff; }
.form-step.is-active .form-step__no { background: #409eff; color: #fff; }
.form-step.is-done .form-step__no { background: #67c23a; color: #fff; }

.form-progress { display: flex; align-items: center; gap: 14px; }
.form-progress__title { font-size: 13px; color: #303133; font-weight: 600; }
.form-progress__desc { font-size: 12px; color: #909399; margin-top: 2px; }

.form-dynrow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.form-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.form-result { list-style: none; margin: 0; padding: 0; font-size: 12.5px; }
.form-result li { padding: 5px 0; border-bottom: 1px dashed #f0f2f5; color: #606266; }
.form-result li b { margin-right: 6px; }
.form-result li.is-pass b { color: #67c23a; }
.form-result li.is-fail { color: #f56c6c; }
.form-result li.is-fail b { color: #f56c6c; }
.form-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.form-preview {
  margin: 0; padding: 12px; border-radius: 8px; background: #1f2d3d; color: #a9d1ff;
  font-family: 'SF Mono', Monaco, monospace; font-size: 12px; line-height: 1.6;
  max-height: 260px; overflow: auto;
}
.form-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
</style>
