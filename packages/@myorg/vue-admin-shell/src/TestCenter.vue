<script setup>
import { ref, computed } from 'vue'
import './TestCenter.scss'

/**
 * 测试中心 · 通用测试运行器组件（Vue 3 版）
 *
 * 与 @myorg/react-admin-shell 的 TestCenter 功能一一对应：
 * - 接收一组测试用例，点击「运行全部」逐个异步执行，实时显示状态与结果
 * - 同时展示配套的 Python 脚本（可复制 / 下载）与终端运行命令
 * - 零外部依赖，仅 Vue 3；样式消费项目 CSS 变量保持 Indigo 玻璃态统一
 *
 * @typedef {Object} TestCase
 * @property {string} id      用例唯一 id
 * @property {string} name     用例名
 * @property {string} group    分组名
 * @property {() => Promise<{pass: boolean, detail?: string}>} run 执行函数，返回是否通过与详情
 */

const props = defineProps({
  /** 测试用例数组 */
  cases: { type: Array, default: () => [] },
  /** 配套 Python 脚本原文（展示/复制/下载） */
  pythonScript: { type: String, default: '' },
  /** 终端运行命令 */
  runCommand: { type: String, default: '' },
  /** 额外类名 */
  className: { type: String, default: '' },
})

// results: { [id]: { status: 'idle'|'running'|'pass'|'fail', detail?: string } }
const results = ref(
  Object.fromEntries((props.cases || []).map((c) => [c.id, { status: 'idle' }])),
)
const running = ref(false)
const copied = ref('')

const update = (id, patch) => {
  results.value = { ...results.value, [id]: { ...results.value[id], ...patch } }
}

const runOne = async (tc) => {
  update(tc.id, { status: 'running', detail: undefined })
  try {
    const r = await tc.run()
    update(tc.id, {
      status: r.pass ? 'pass' : 'fail',
      detail: r.detail ?? (r.pass ? '通过' : '失败'),
    })
    return !!r.pass
  } catch (e) {
    update(tc.id, { status: 'fail', detail: String(e?.message || e) })
    return false
  }
}

const runAll = async () => {
  running.value = true
  // 串行执行，避免用例间状态互相干扰
  for (const tc of props.cases) {
    // eslint-disable-next-line no-await-in-loop
    await runOne(tc)
  }
  running.value = false
}

const stats = computed(() => {
  let pass = 0
  let fail = 0
  let done = 0
  for (const c of props.cases) {
    const s = results.value[c.id]?.status
    if (s === 'pass') { pass++; done++ }
    else if (s === 'fail') { fail++; done++ }
  }
  return { pass, fail, done, total: props.cases.length }
})

const groups = computed(() => {
  const m = new Map()
  for (const c of props.cases) {
    if (!m.has(c.group)) m.set(c.group, [])
    m.get(c.group).push(c)
  }
  return [...m.entries()]
})

const copyText = async (text, tag) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = tag
    setTimeout(() => { copied.value = '' }, 1500)
  } catch {
    // 忽略剪贴板权限失败
  }
}

const downloadScript = () => {
  if (!props.pythonScript) return
  const blob = new Blob([props.pythonScript], { type: 'text/x-python' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'test_pages.py'
  a.click()
  URL.revokeObjectURL(url)
}

const progress = computed(() => (stats.value.total ? (stats.value.done / stats.value.total) * 100 : 0))
</script>

<template>
  <div :class="['tc', className]">
    <!-- 控制条 + 统计 -->
    <div class="tc-toolbar">
      <button
        type="button"
        class="btn tc-run-all"
        :disabled="running"
        @click="runAll"
      >
        {{ running ? `运行中 ${stats.done}/${stats.total}` : '运行全部测试' }}
      </button>
      <div class="tc-stats">
        <span class="tc-stat tc-stat-pass">通过 {{ stats.pass }}</span>
        <span class="tc-stat tc-stat-fail">失败 {{ stats.fail }}</span>
        <span class="tc-stat tc-stat-total">合计 {{ stats.total }}</span>
      </div>
      <div class="tc-progress" aria-hidden="true">
        <div class="tc-progress-bar" :style="{ width: `${progress}%` }" />
      </div>
    </div>

    <!-- 用例列表 -->
    <div class="tc-groups">
      <section v-for="[group, list] in groups" :key="group" class="tc-group">
        <h3 class="tc-group-title">{{ group }}</h3>
        <ul class="tc-list">
          <li
            v-for="tc in list"
            :key="tc.id"
            :class="['tc-item', `tc-${results[tc.id]?.status || 'idle'}`]"
          >
            <span class="tc-mark" aria-hidden="true">
              {{ (results[tc.id]?.status || 'idle') === 'pass' ? '✓' : (results[tc.id]?.status || 'idle') === 'fail' ? '✗' : (results[tc.id]?.status || 'idle') === 'running' ? '⟳' : '•' }}
            </span>
            <span class="tc-name">{{ tc.name }}</span>
            <span v-if="results[tc.id]?.detail" class="tc-detail">{{ results[tc.id].detail }}</span>
            <button
              type="button"
              class="tc-run-one"
              :disabled="running"
              @click="runOne(tc)"
            >
              运行
            </button>
          </li>
        </ul>
      </section>
    </div>

    <!-- Python 脚本区 -->
    <section v-if="pythonScript" class="tc-script">
      <div class="tc-script-head">
        <h3 class="tc-script-title">Python E2E 测试脚本</h3>
        <div class="tc-script-actions">
          <button type="button" class="tc-action" @click="copyText(pythonScript, 'script')">
            {{ copied === 'script' ? '已复制' : '复制脚本' }}
          </button>
          <button type="button" class="tc-action" @click="downloadScript">
            下载 .py
          </button>
        </div>
      </div>
      <div v-if="runCommand" class="tc-cmd">
        <code>{{ runCommand }}</code>
        <button type="button" class="tc-action" @click="copyText(runCommand, 'cmd')">
          {{ copied === 'cmd' ? '已复制' : '复制' }}
        </button>
      </div>
      <pre class="tc-code"><code>{{ pythonScript }}</code></pre>
      <p class="tc-tip">
        浏览器无法直接执行 Python。上述前端测试即时验证逻辑层；Python 脚本在终端运行，
        用 Playwright 自动启动 dev server、登录并逐页验证渲染与交互。
      </p>
    </section>
  </div>
</template>
