import { Tabs } from 'antd'
import ContextCase from './ContextCase.jsx'
import ApiBasics from './ApiBasics.jsx'
import NewFeatures from './NewFeatures.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const CORE_APIS = [
  { name: 'createContext', descKey: 'hooks.index.coreApis.createContext' },
  { name: 'useContext', descKey: 'hooks.index.coreApis.useContext' },
  { name: 'useMemo', descKey: 'hooks.index.coreApis.useMemo' },
  { name: 'useCallback', descKey: 'hooks.index.coreApis.useCallback' },
]

export default function ReactHooksDemo() {
  const { t } = useI18n()
  const items = [
    { key: 'case', label: t('hooks.index.tabCase'), children: <ContextCase /> },
    { key: 'basics', label: t('hooks.index.tabBasics'), children: <ApiBasics /> },
    { key: 'features', label: t('hooks.index.tabFeatures'), children: <NewFeatures /> },
  ]

  return (
    <div className="rh-page">
      <header className="rh-page__header">
        <h1>{t('hooks.index.title')}</h1>
        <p className="rh-page__lead">
          {t('hooks.index.lead')}
        </p>

        <div className="rh-page__apis">
          {CORE_APIS.map((api) => (
            <span key={api.name} className="rh-api-pill">
              <code>{api.name}</code>
              <em>{t(api.descKey)}</em>
            </span>
          ))}
        </div>
      </header>

      <Tabs className="rh-page__tabs" items={items} />
    </div>
  )
}
