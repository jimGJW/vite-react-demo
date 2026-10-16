import { NotificationDrawer, useNotification } from '../../../components/Notification'
import { useI18n } from '../../../i18n/index.js'

/** 演示页内容：必须在 Provider 内调用 useNotification，因此拆出内部组件 */

export function NotifyDemoInner() {
  const { t } = useI18n()
  const { notify, success, error, warning, info, removeAll } = useNotification()

  return (
    <div className="page-card notify-demo">
      <h1>{t('notify.demo.title')}</h1>
      <p>
        {t('notify.demo.leadBefore')}
        <code>createPortal</code>
        {t('notify.demo.leadAfter')}
        <strong>{t('notify.demo.leadDrawer')}</strong>
        {t('notify.demo.leadTail')}
      </p>

      <div className="notify-demo-toolbar">
        <NotificationDrawer triggerLabel={t('notify.demo.triggerLabel')} />
        <button type="button" className="btn secondary" onClick={removeAll}>
          {t('notify.demo.clearAll')}
        </button>
      </div>

      <h2>{t('notify.demo.typesTitle')}</h2>
      <div className="notify-demo-grid">
        <button
          type="button"
          className="btn btn--success"
          onClick={() => success(t('notify.demo.saveTitle'), t('notify.demo.saveDesc'), 4000)}
        >
          Success
        </button>
        <button
          type="button"
          className="btn btn--error"
          onClick={() => error(t('notify.demo.failTitle'), t('notify.demo.failDesc'), 5000)}
        >
          Error
        </button>
        <button
          type="button"
          className="btn btn--warning"
          onClick={() => warning(t('notify.demo.warnTitle'), t('notify.demo.warnDesc'), 4000)}
        >
          Warning
        </button>
        <button
          type="button"
          className="btn btn--info"
          onClick={() => info(t('notify.demo.infoTitle'), t('notify.demo.infoDesc'), 4000)}
        >
          Info
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => notify({ title: t('notify.demo.persistTitle'), description: t('notify.demo.persistDesc'), duration: 0 })}
        >
          {t('notify.demo.persistBtn')}
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => success({ title: t('notify.demo.objTitle'), description: t('notify.demo.objDesc'), duration: 3000 })}
        >
          {t('notify.demo.objBtn')}
        </button>
      </div>

      <h2>{t('notify.demo.stackTitle')}</h2>
      <div className="notify-demo-row">
        <button
          type="button"
          className="btn"
          onClick={() => {
            for (let i = 1; i <= 5; i += 1) {
              setTimeout(() => info(t('notify.demo.burstTitle', { index: i }), t('notify.demo.burstDesc'), 3000), i * 200)
            }
          }}
        >
          {t('notify.demo.burstBtn')}
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => success(t('notify.demo.progressTitle'), t('notify.demo.progressDesc'), 6000)}
        >
          {t('notify.demo.longBtn')}
        </button>
      </div>

      <h2>{t('notify.demo.usageTitle')}</h2>
      <pre className="notify-code">{`// 1. 在应用根部包裹 Provider（仅需一次）
import { NotificationProvider } from './components/Notification'

<NotificationProvider>
  <App />
</NotificationProvider>

// 2. 任意子组件弹出 Toast
import { useNotification } from './components/Notification'

const { notify, success, error, warning, info, removeAll } = useNotification()

// 便捷方法：(title, description?, duration?)
success('保存成功', '你的更改已提交', 4000)

// 通用方法：接受选项对象
notify({ title: '常驻', description: '不自动关闭', duration: 0 })

// 3. 放置通知抽屉（含未读徽标 + 历史列表）
import { NotificationDrawer } from './components/Notification'

<NotificationDrawer triggerLabel="通知" />`}</pre>

      <h2>{t('notify.demo.apiTitle')}</h2>
      <ul className="notify-demo-api">
        <li>
          <code>notify(options)</code>
          {t('notify.demo.apiNotifyA')}
          <code>options = {'{ title, description, type, duration }'}</code>
          {t('notify.demo.apiNotifyB')}
        </li>
        <li>
          <code>success / error / warning / info(title, description?, duration?)</code>
          {t('notify.demo.apiShortcut')}
        </li>
        <li>
          <code>remove(id)</code>
          {t('notify.demo.apiRemoveA')}
          <code>removeAll()</code>
          {t('notify.demo.apiRemoveB')}
        </li>
        <li>
          <code>duration</code>
          {t('notify.demo.apiDurationA')}
          <code>4000</code>
          {t('notify.demo.apiDurationB')}
          <code>0</code>
          {t('notify.demo.apiDurationC')}
        </li>
        <li>
          <code>toasts</code>
          {t('notify.demo.apiStateA')}
          <code>history</code>
          {t('notify.demo.apiStateA')}
          <code>unreadCount</code>
          {t('notify.demo.apiStateB')}
        </li>
        <li>
          <code>markAllRead()</code>
          {t('notify.demo.apiMarkA')}
          <code>markRead(id)</code>
          {t('notify.demo.apiMarkA')}
          <code>clearHistory()</code>
          {t('notify.demo.apiMarkB')}
        </li>
      </ul>

      <div className="notify-demo-note">
        {t('notify.demo.noteBefore')}
        <code>createPortal</code>
        {t('notify.demo.noteAfter')}
        <code>document.body</code>
        {t('notify.demo.noteTail')}
      </div>
    </div>
  )
}

/** 演示页：在页面级包裹 Provider，使内部 useNotification 可用 */
