import { NotificationDrawer, NotificationProvider, useNotification } from '../../components/Notification'
import './index.scss'

/** 演示页内容：必须在 Provider 内调用 useNotification，因此拆出内部组件 */
function NotifyDemoInner() {
  const { notify, success, error, warning, info, removeAll } = useNotification()

  return (
    <div className="page-card notify-demo">
      <h1>通知中心</h1>
      <p>
        基于 <code>createPortal</code> 的全局通知系统：右上角 Toast 堆叠（自动消失 / 手动关闭 /
        进度条），并配一个右侧滑入的<strong>通知抽屉</strong>展示历史与未读红点。
        组件零外部依赖，仅依赖 React，API 自带 JSDoc 可整目录拷贝复用。
      </p>

      <div className="notify-demo-toolbar">
        <NotificationDrawer triggerLabel="通知中心" />
        <button type="button" className="btn secondary" onClick={removeAll}>
          清除全部 Toast
        </button>
      </div>

      <h2>各类型 Toast</h2>
      <div className="notify-demo-grid">
        <button
          type="button"
          className="btn btn--success"
          onClick={() => success('保存成功', '你的更改已提交', 4000)}
        >
          Success
        </button>
        <button
          type="button"
          className="btn btn--error"
          onClick={() => error('提交失败', '网络异常，请稍后重试', 5000)}
        >
          Error
        </button>
        <button
          type="button"
          className="btn btn--warning"
          onClick={() => warning('存储不足', '剩余空间不足 10%', 4000)}
        >
          Warning
        </button>
        <button
          type="button"
          className="btn btn--info"
          onClick={() => info('系统提示', '系统将于今晚 23:00 维护', 4000)}
        >
          Info
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => notify({ title: '常驻通知', description: 'duration=0 不自动关闭，仅手动关闭', duration: 0 })}
        >
          常驻通知（duration=0）
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => success({ title: '批量操作完成', description: '已处理 128 项任务', duration: 3000 })}
        >
          对象式调用
        </button>
      </div>

      <h2>堆叠演示</h2>
      <div className="notify-demo-row">
        <button
          type="button"
          className="btn"
          onClick={() => {
            for (let i = 1; i <= 5; i += 1) {
              setTimeout(() => info(`通知 ${i}`, '堆叠展示，新通知在顶部', 3000), i * 200)
            }
          }}
        >
          连发 5 条
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => success('进度条同步', '观察底部进度条与自动消失时长一致', 6000)}
        >
          长进度条（6s）
        </button>
      </div>

      <h2>用法</h2>
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

      <h2>API 说明</h2>
      <ul className="notify-demo-api">
        <li>
          <code>notify(options)</code>：弹出通知，<code>options = {'{ title, description, type, duration }'}</code>，
          返回 id。
        </li>
        <li>
          <code>success / error / warning / info(title, description?, duration?)</code>：
          类型便捷方法，首参也可直接传选项对象。
        </li>
        <li>
          <code>remove(id)</code> / <code>removeAll()</code>：移除单条 / 全部活动 Toast（保留历史）。
        </li>
        <li>
          <code>duration</code>：自动消失时长（毫秒），默认 <code>4000</code>；传 <code>0</code> 常驻不自动关闭。
        </li>
        <li>
          <code>toasts</code> / <code>history</code> / <code>unreadCount</code>：活动通知、历史列表、未读数。
        </li>
        <li>
          <code>markAllRead()</code> / <code>markRead(id)</code> / <code>clearHistory()</code>：已读与清空。
        </li>
      </ul>

      <div className="notify-demo-note">
        提示：通知抽屉的触发按钮自带未读徽标；打开后可点击列表项标记已读，或用「全部已读 / 清空」批量处理。
        所有 Toast 与抽屉均经 <code>createPortal</code> 挂载到 <code>document.body</code>，不受父级 overflow 裁剪。
      </div>
    </div>
  )
}

/** 演示页：在页面级包裹 Provider，使内部 useNotification 可用 */
function NotifyDemo() {
  return (
    <NotificationProvider>
      <NotifyDemoInner />
    </NotificationProvider>
  )
}

export default NotifyDemo
