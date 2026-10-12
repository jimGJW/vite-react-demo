import { Input, Tag } from 'antd'
import { useLocalStorage, useOnline, useMediaQuery } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'

/** 存储与环境：持久化 state / 网络状态 / 媒体查询 */
export default function StorageDemos() {
  const [note, setNote] = useLocalStorage('utils-demo:note', '改我，然后刷新页面')
  const online = useOnline()
  const isWide = useMediaQuery('(min-width: 1024px)')

  return (
    <>
      <DemoCard
        title="useLocalStorage · 持久化 state"
        desc="与 localStorage 双向同步，支持过期时间；刷新后仍保留。"
        usage="const [v, setV] = useLocalStorage('key', 初值, { expire })"
      >
        <Input value={note} onChange={(e) => setNote(e.target.value)} style={{ maxWidth: 300 }} />
        <div className="utils-demo__out">已写入 localStorage</div>
      </DemoCard>

      <DemoCard
        title="useOnline · 网络状态"
        desc="监听 online / offline 事件，断网提示常用。"
        usage="const online = useOnline()"
      >
        <Tag color={online ? 'green' : 'red'}>{online ? '在线' : '离线'}</Tag>
      </DemoCard>

      <DemoCard
        title="useMediaQuery · 媒体查询"
        desc="响应式断点判断，避免把断点写死在 JS 里。"
        usage="const isWide = useMediaQuery('(min-width: 1024px)')"
      >
        <Tag color={isWide ? 'blue' : 'default'}>{isWide ? '宽屏 (≥1024px)' : '窄屏 (<1024px)'}</Tag>
      </DemoCard>
    </>
  )
}
