<template>
  <div class="dir-page">
    <header class="page-header-vue">
      <h1>自定义指令 · Directives</h1>
      <p>{{ DIRECTIVE_REGISTRY.length }} 个指令（src/directives/index.js），把「操作 DOM 但不值得写组件」的能力下沉</p>
    </header>

    <section class="dir-card">
      <h3>指令目录</h3>
      <table class="dir-table">
        <thead><tr><th>指令</th><th>用法</th><th>说明</th></tr></thead>
        <tbody>
          <tr v-for="d in DIRECTIVE_REGISTRY" :key="d.name">
            <td><code>{{ d.name }}</code></td>
            <td><code class="dir-usage">{{ d.usage }}</code></td>
            <td>{{ d.desc }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- v-focus -->
    <section class="dir-card">
      <h3>v-focus / v-longpress</h3>
      <p class="dir-desc">v-focus 挂载即聚焦；v-longpress 长按 600ms 触发（移动端长按菜单）。</p>
      <div class="dir-row">
        <el-input v-focus v-model="focusText" placeholder="页面加载后我会自动聚焦" style="max-width: 280px" />
        <el-button v-longpress="onLongpress" @click="shortClick">长按我 600ms（点击则短按）</el-button>
        <span class="m-chip m-chip--info">{{ longpressTip }}</span>
      </div>
    </section>

    <!-- v-copy -->
    <section class="dir-card">
      <h3>v-copy 点击复制</h3>
      <p class="dir-desc">复制成功后元素加上 is-copied 类，可用 CSS 做「已复制」气泡反馈。</p>
      <div class="dir-row">
        <span v-copy="inviteCode" class="dir-code">{{ inviteCode }}</span>
        <span v-copy="'https://example.com/docs?token=abc123'" class="dir-code">复制链接（指令值直接写死）</span>
        <el-button size="small" @click="inviteCode = randomId('INV')">换一个邀请码</el-button>
      </div>
    </section>

    <!-- v-debounce / v-throttle -->
    <section class="dir-card">
      <h3>v-debounce:click / v-throttle:scroll</h3>
      <p class="dir-desc">指令参数指定事件名，回调自动包防抖/节流 —— 比每次手写 debounce() 更省事。</p>
      <div class="dir-row">
        <el-button
          v-debounce:click="{ handler: onDebouncedClick, wait: 500 }"
          @click="debounceClicks += 1"
        >
          防抖按钮（连点只算一次，{{ debounceHits }} 次生效 / {{ debounceClicks }} 次点击）
        </el-button>
      </div>
      <div v-throttle:scroll="{ handler: onScrolled, wait: 200 }" class="dir-scroll">
        <div v-for="i in 40" :key="i" class="dir-scroll__row">滚动行 {{ i }} · 节流回调已触发 {{ throttleHits }} 次</div>
      </div>
    </section>

    <!-- v-lazy -->
    <section class="dir-card">
      <h3>v-lazy 进场加载</h3>
      <p class="dir-desc">IntersectionObserver 监听：元素真正进入视口才加 is-visible 类（这里用于渐显 + 换背景）。</p>
      <div class="dir-lazywrap">
        <div v-for="i in 6" :key="i" v-lazy class="dir-lazybox">
          <span class="dir-lazybox__no">{{ i }}</span>
          <span class="dir-lazybox__txt">滚动到此处才渐显</span>
        </div>
      </div>
      <span class="m-chip m-chip--ok">已进入视口 {{ lazyVisibleCount }} / 6（请在上方区块内滚动）</span>
    </section>

    <!-- v-draggable -->
    <section class="dir-card">
      <h3>v-draggable 拖拽（限制在父容器内）</h3>
      <p class="dir-desc">指针事件 + transform 位移，opts.bounds !== false 时限制在父容器范围内。</p>
      <div class="dir-dragstage">
        <div v-draggable="{ bounds: true }" class="dir-dragbox">拖我 🖱️</div>
        <div v-draggable class="dir-dragbox dir-dragbox--free">我也可以拖</div>
      </div>
    </section>

    <!-- v-permission -->
    <section class="dir-card">
      <h3>v-permission 权限裁剪</h3>
      <p class="dir-desc">无权限的元素在 mounted 阶段直接从 DOM 移除（不是 display:none，抓不到残留节点）。</p>
      <div class="dir-row">
        <el-radio-group v-model="role">
          <el-radio-button label="admin">admin</el-radio-button>
          <el-radio-button label="editor">editor</el-radio-button>
          <el-radio-button label="guest">guest</el-radio-button>
        </el-radio-group>
      </div>
      <div :key="role" class="dir-row">
        <el-button v-permission="['admin', 'editor']" type="primary">编辑（admin/editor 可见）</el-button>
        <el-button v-permission="'admin'" type="danger">删除（仅 admin 可见）</el-button>
        <el-button v-permission="['admin', 'editor', 'guest']">查看（所有人可见）</el-button>
      </div>
      <p class="dir-desc" style="margin-top: 8px">
        当前角色 <b>{{ role }}</b>：被裁掉的按钮不会出现在 DOM 中（可打开 DevTools 验证）。
      </p>
    </section>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DIRECTIVE_REGISTRY } from '../directives'
import { randomId } from '../utils'

/* —— v-focus / v-longpress —— */
const focusText = ref('')
const longpressTip = ref('等待操作…')
const onLongpress = () => {
  longpressTip.value = '触发长按！'
  ElMessage.success('长按生效')
}
const shortClick = () => {
  longpressTip.value = '触发短按'
  ElMessage.info('短按：执行普通点击逻辑')
}

/* —— v-copy —— */
const inviteCode = ref(randomId('INV'))

/* —— v-debounce —— */
const debounceClicks = ref(0)
const debounceHits = ref(0)
const onDebouncedClick = () => { debounceHits.value += 1 }

/* —— v-throttle —— */
const throttleHits = ref(0)
const onScrolled = () => { throttleHits.value += 1 }

/* —— v-lazy：轮询统计已显形元素数量（纯演示，卸载时清理） —— */
const lazyVisibleCount = ref(0)
const lazyTimer = setInterval(() => {
  lazyVisibleCount.value = document.querySelectorAll('.dir-lazybox.is-visible').length
}, 500)
onUnmounted(() => clearInterval(lazyTimer))

/* —— v-permission —— */
const role = ref('editor')
</script>

<style scoped>
.dir-page { padding: 20px 24px 44px; }
.dir-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.dir-card h3 { margin: 0 0 4px; font-size: 15px; color: #303133; }
.dir-desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.7; }
.dir-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.dir-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.dir-table th, .dir-table td { text-align: left; padding: 8px 8px; border-bottom: 1px solid #f2f4f7; vertical-align: top; }
.dir-table th { color: #909399; font-weight: 600; font-size: 12px; }
.dir-table code { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #409eff; }
.dir-table .dir-usage { color: #8e44ad; }

.dir-code {
  display: inline-block; padding: 6px 12px; border-radius: 6px;
  border: 1px dashed #c6e2ff; background: #f2f8ff; color: #409eff;
  font-family: 'SF Mono', Monaco, monospace; font-size: 12.5px;
  transition: all 0.2s;
}
.dir-code.is-copied {
  border-style: solid; border-color: #67c23a; background: #f0f9eb; color: #529b2e;
}
.dir-code.is-copied::after { content: ' ✓ ' attr(data-copy-tip); font-size: 11px; }

.dir-scroll {
  margin-top: 12px; height: 150px; overflow-y: auto;
  border: 1px solid #e4e7ed; border-radius: 8px; background: #fafcff;
}
.dir-scroll__row { padding: 6px 12px; font-size: 12.5px; color: #606266; border-bottom: 1px solid #f7f8fa; }

.dir-lazywrap { display: grid; gap: 8px; margin-bottom: 10px; }
.dir-lazybox {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 14px; border-radius: 8px;
  border: 1px dashed #dcdfe6; background: #fafafa;
  opacity: 0; transform: translateY(10px);
  transition: all 0.5s ease;
}
.dir-lazybox.is-visible { opacity: 1; transform: none; border-style: solid; border-color: #c6e2ff; background: #f2f8ff; }
.dir-lazybox__no {
  width: 22px; height: 22px; border-radius: 50%;
  background: #409eff; color: #fff; font-size: 11px;
  display: inline-flex; align-items: center; justify-content: center;
}
.dir-lazybox__txt { font-size: 12.5px; color: #606266; }

.dir-dragstage {
  position: relative; height: 190px; border-radius: 10px;
  border: 1px dashed #c6e2ff; background: repeating-linear-gradient(45deg, #f7fbff, #f7fbff 10px, #f2f8ff 10px, #f2f8ff 20px);
  overflow: hidden;
}
.dir-dragbox {
  position: absolute; top: 12px; left: 12px;
  padding: 14px 20px; border-radius: 10px; cursor: grab;
  background: #409eff; color: #fff; font-size: 13px; font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);
  touch-action: none;
}
.dir-dragbox--free { background: #8e44ad; box-shadow: 0 4px 12px rgba(142, 68, 173, 0.35); }
</style>
