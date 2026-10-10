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

import { CASES } from './components/testCases.js'

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
