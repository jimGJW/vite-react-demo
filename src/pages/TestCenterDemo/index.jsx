import TestCenter from '../../components/TestCenter/index.js'
// 以原始字符串导入真实 Python 脚本与 App 路由源码，保证展示内容与文件同步
import pyScript from '../../../tests/test_pages.py?raw'
import './index.scss'

/** 动态导入组件并校验有任意导出（具名或 default） */
async function checkImport(path) {
  try {
    const mod = await import(path)
    const keys = Object.keys(mod)
    const ok = keys.length > 0 || mod.default != null
    return {
      pass: ok,
      detail: ok ? `导出 ${keys.length} 项${mod.default ? '（含 default）' : ''}` : '无导出',
    }
  } catch (e) {
    return { pass: false, detail: String(e?.message || e) }
  }
}

/**
 * 前端测试用例：点击即时执行，验证数据 / 组件 / 路由层逻辑。
 * 用例 run 为 async，支持动态 import，结果实时回显。
 */
const CASES = [
  // —— 数据完整性 ——
  {
    id: 'd1', group: '数据完整性', name: 'STARS 恒星总数 = 365',
    run: async () => {
      const { STARS } = await import('../../components/StarArray/stars-data.js')
      return { pass: STARS.length === 365, detail: `实际 ${STARS.length} 颗` }
    },
  },
  {
    id: 'd2', group: '数据完整性', name: 'STARS 名称全部唯一',
    run: async () => {
      const { STARS } = await import('../../components/StarArray/stars-data.js')
      const dup = STARS.length - new Set(STARS.map((s) => s.name)).size
      return { pass: dup === 0, detail: dup ? `重复 ${dup} 个` : '全部唯一' }
    },
  },
  {
    id: 'd3', group: '数据完整性', name: '每颗星字段完整（tag/mag/distance/color/note）',
    run: async () => {
      const { STARS } = await import('../../components/StarArray/stars-data.js')
      const miss = STARS.filter(
        (s) => !s.tag || s.mag == null || !s.distance || !s.color || !s.note,
      )
      return { pass: miss.length === 0, detail: miss.length ? `缺失 ${miss.length} 颗` : '字段完整' }
    },
  },
  {
    id: 'd4', group: '数据完整性', name: '著名星含通俗标签（非光谱型术语）',
    run: async () => {
      const { STARS } = await import('../../components/StarArray/stars-data.js')
      const sirius = STARS.find((s) => s.name === '天狼星')
      const ok = !!sirius && !!sirius.tag && !sirius.tag.includes('型')
      return { pass: ok, detail: sirius?.tag || '未找到天狼星' }
    },
  },

  // —— 组件可导入 ——
  { id: 'c1', group: '组件可导入', name: 'CommandPalette 命令面板',
    run: () => checkImport('../../components/CommandPalette/index.js') },
  { id: 'c2', group: '组件可导入', name: 'Charts SVG 图表',
    run: () => checkImport('../../components/Charts/index.js') },
  { id: 'c3', group: '组件可导入', name: 'ThemeProvider 主题系统',
    run: () => checkImport('../../components/ThemeProvider/index.js') },
  { id: 'c4', group: '组件可导入', name: 'Notification 通知中心',
    run: () => checkImport('../../components/Notification/index.js') },
  { id: 'c5', group: '组件可导入', name: 'DataTable 高级表格',
    run: () => checkImport('../../components/DataTable/index.js') },
  { id: 'c6', group: '组件可导入', name: 'TestCenter 测试中心（自身）',
    run: () => checkImport('../../components/TestCenter/index.js') },

  // —— 路由配置 ——
  {
    id: 'r1', group: '路由配置', name: '路由表覆盖全部 14 条页面路由',
    run: async () => {
      const src = (await import('../../App.jsx?raw')).default
      const expected = [
        'login', 'about', 'dashboard', 'scan', 'embed', 'agent', 'voice',
        'form-builder', 'theme', 'charts', 'command-palette', 'notify', 'data-table', '404',
      ]
      // 兼容 path="x"（相对）与 path="/x"（绝对，如 login）
      const missing = expected.filter(
        (p) => !src.includes(`path="${p}"`) && !src.includes(`path="/${p}"`),
      )
      return {
        pass: missing.length === 0,
        detail: missing.length ? `缺失: ${missing.join(', ')}` : `覆盖 ${expected.length} 条`,
      }
    },
  },
  {
    id: 'r2', group: '路由配置', name: '受保护路由使用 RequireAuth 守卫',
    run: async () => {
      const src = (await import('../../App.jsx?raw')).default
      return {
        pass: src.includes('RequireAuth') && src.includes('<Navigate to="/login"'),
        detail: src.includes('RequireAuth') ? '守卫已配置' : '未发现 RequireAuth',
      }
    },
  },

  // —— 小功能集 Utils（浏览器侧断言，补齐 node 单测覆盖不到的 DOM/计时/存储）——
  {
    id: 'u1', group: '小功能集 Utils', name: 'Utils 导出完整（工具函数 + Hooks）',
    run: async () => {
      const mod = await import('../../components/Utils/index.js')
      const fns = ['formatDate', 'formatRelativeTime', 'debounce', 'throttle', 'mask', 'exportCsv',
        'copyText', 'groupBy', 'arrayToTree', 'treeToArray', 'deepMerge', 'pick', 'omit',
        'safeJsonParse', 'hexToRgba', 'classNames']
      const hooks = ['useDebounce', 'useThrottle', 'useLocalStorage', 'useCopy', 'useWatermark',
        'useOnline', 'useMediaQuery', 'useClickOutside', 'useHover', 'useSize', 'useKeyPress',
        'useInterval', 'useToggle', 'useCounter']
      const missFns = fns.filter((f) => typeof mod[f] !== 'function')
      const missHooks = hooks.filter((h) => typeof mod[h] !== 'function')
      return {
        pass: !missFns.length && !missHooks.length,
        detail: missFns.length || missHooks.length
          ? `缺失: ${[...missFns, ...missHooks].join(', ')}`
          : `函数 ${fns.length} 个 + Hook ${hooks.length} 个齐全`,
      }
    },
  },
  {
    id: 'u2', group: '小功能集 Utils', name: '字符串 / 颜色工具行为正确',
    run: async () => {
      const { classNames, escapeHtml, hexToRgba, camelToKebab, kebabToCamel } =
        await import('../../components/Utils/utils.js')
      const ok = classNames('a', { b: true, c: false }, ['d']) === 'a b d'
        && escapeHtml('<b>') === '&lt;b&gt;'
        && hexToRgba('#ff0000', 0.5) === 'rgba(255, 0, 0, 0.5)'
        && camelToKebab('fooBar') === 'foo-bar'
        && kebabToCamel('foo-bar') === 'fooBar'
      return { pass: ok, detail: ok ? '5 项断言全部通过' : '存在断言失败' }
    },
  },
  {
    id: 'u3', group: '小功能集 Utils', name: 'storage 读写 / 过期 / 删除',
    run: async () => {
      const { setStorage, getStorage, removeStorage } = await import('../../components/Utils/utils.js')
      const key = '__utils_test_key__'
      setStorage(key, { a: 1 })
      const okWrite = JSON.stringify(getStorage(key)) === '{"a":1}'
      setStorage(key, 'x', { expire: -1000 }) // 已过期
      const okExpire = getStorage(key, 'fallback') === 'fallback'
      removeStorage(key)
      const okRemove = getStorage(key, 'gone') === 'gone'
      return {
        pass: okWrite && okExpire && okRemove,
        detail: `写入:${okWrite} 过期清理:${okExpire} 删除:${okRemove}`,
      }
    },
  },
  {
    id: 'u4', group: '小功能集 Utils', name: 'debounce / throttle 计时行为',
    run: async () => {
      const { debounce, throttle } = await import('../../components/Utils/utils.js')
      let d = 0
      const dFn = debounce(() => { d += 1 }, 40)
      dFn(); dFn(); dFn()
      const beforeWait = d === 0
      await new Promise((r) => { setTimeout(r, 120) })
      const afterWait = d === 1
      let t = 0
      const tFn = throttle(() => { t += 1 }, 40)
      tFn(); tFn(); tFn()
      const tLeading = t === 1
      return {
        pass: beforeWait && afterWait && tLeading,
        detail: `debounce 等待期不触发:${beforeWait} / 合并为 1 次:${afterWait}；throttle 立即 1 次:${tLeading}`,
      }
    },
  },
  {
    id: 'u5', group: '小功能集 Utils', name: '新增页面路由已注册（/utils /templates）',
    run: async () => {
      const src = (await import('../../App.jsx?raw')).default
      const hasUtils = src.includes('path="utils"')
      const hasTpl = src.includes('path="templates"')
      return {
        pass: hasUtils && hasTpl,
        detail: `/utils:${hasUtils} /templates:${hasTpl}`,
      }
    },
  },
]

function TestCenterDemo() {
  return (
    <div className="page-card">
      <h1>测试中心</h1>
      <p>
        整理项目测试脚本：前端用例点击即时执行，验证数据 / 组件 / 路由层逻辑；
        下方 Python E2E 脚本可在终端运行，用 Playwright 自动启动 dev server、登录并逐页验证渲染与交互。
      </p>

      <TestCenter
        cases={CASES}
        pythonScript={pyScript}
        runCommand="python tests/test_pages.py"
      />

      <section className="tc-help">
        <h2>Python 脚本运行步骤</h2>
        <ol>
          <li>安装依赖：<code>pip install -r tests/requirements.txt</code></li>
          <li>安装浏览器内核：<code>playwright install chromium</code></li>
          <li>运行测试：<code>python tests/test_pages.py</code></li>
          <li>保留浏览器调试：<code>KEEP_OPEN=1 python tests/test_pages.py</code></li>
        </ol>
        <p className="tc-help-tip">
          脚本自动启动 Vite dev server，无需手动起服务；若已自行启动，可用
          <code>BASE_URL=http://localhost:5173 python tests/test_pages.py</code> 复用。
        </p>
      </section>
    </div>
  )
}

export default TestCenterDemo
