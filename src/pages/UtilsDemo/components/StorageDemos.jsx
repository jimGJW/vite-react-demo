import { Input, Tag } from 'antd'
import { useLocalStorage, useOnline, useMediaQuery } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { useI18n } from '../../../i18n/index.js'

/** 存储与环境：持久化 state / 网络状态 / 媒体查询 */
export default function StorageDemos() {
  const { t } = useI18n()
  const [note, setNote] = useLocalStorage('utils-demo:note', '改我，然后刷新页面')
  const online = useOnline()
  const isWide = useMediaQuery('(min-width: 1024px)')

  return (
    <>
      <DemoCard
        title={t('utilsdemo.storeLSTitle')}
        desc={t('utilsdemo.storeLSDesc')}
        usage="const [v, setV] = useLocalStorage('key', 初值, { expire })"
      >
        <Input value={note} onChange={(e) => setNote(e.target.value)} style={{ maxWidth: 300 }} />
        <div className="utils-demo__out">{t('utilsdemo.storeWritten')}</div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.storeOnlineTitle')}
        desc={t('utilsdemo.storeOnlineDesc')}
        usage="const online = useOnline()"
      >
        <Tag color={online ? 'green' : 'red'}>{online ? t('utilsdemo.storeOnlineOn') : t('utilsdemo.storeOnlineOff')}</Tag>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.storeMediaTitle')}
        desc={t('utilsdemo.storeMediaDesc')}
        usage="const isWide = useMediaQuery('(min-width: 1024px)')"
      >
        <Tag color={isWide ? 'blue' : 'default'}>{isWide ? t('utilsdemo.storeWide') : t('utilsdemo.storeNarrow')}</Tag>
      </DemoCard>
    </>
  )
}
