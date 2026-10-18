import {  NotificationProvider } from '@components/Notification'
import './index.scss'

/** 演示页内容：必须在 Provider 内调用 useNotification，因此拆出内部组件 */

import { NotifyDemoInner } from './components/notifyInner.jsx'

function NotifyDemo() {
  return (
    <NotificationProvider>
      <NotifyDemoInner />
    </NotificationProvider>
  )
}

export default NotifyDemo
