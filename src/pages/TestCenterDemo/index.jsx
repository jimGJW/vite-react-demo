import TestCenter from '@components/TestCenter/index.js'
// 以原始字符串导入真实 Python 脚本与 App 路由源码，保证展示内容与文件同步
import pyScript from '@root/tests/test_pages.py?raw'
import { CASES } from './components/testCases.js'
import { useI18n } from '@i18n/index.js'
import './index.scss'

function TestCenterDemo() {
  const { t } = useI18n()
  return (
    <div className="page-card">
      <h1>{t('testCenter.demo.title')}</h1>
      <p>{t('testCenter.demo.lead')}</p>

      <TestCenter
        cases={CASES}
        pythonScript={pyScript}
        runCommand="python tests/test_pages.py"
      />

      <section className="tc-help">
        <h2>{t('testCenter.demo.pyStepsTitle')}</h2>
        <ol>
          <li>{t('testCenter.demo.stepInstall')}<code>pip install -r tests/requirements.txt</code></li>
          <li>{t('testCenter.demo.stepBrowser')}<code>playwright install chromium</code></li>
          <li>{t('testCenter.demo.stepRun')}<code>python tests/test_pages.py</code></li>
          <li>{t('testCenter.demo.stepKeep')}<code>KEEP_OPEN=1 python tests/test_pages.py</code></li>
        </ol>
        <p className="tc-help-tip">
          {t('testCenter.demo.tipBefore')}
          <code>BASE_URL=http://localhost:5173 python tests/test_pages.py</code>{t('testCenter.demo.tipAfter')}
        </p>
      </section>
    </div>
  )
}

export default TestCenterDemo
