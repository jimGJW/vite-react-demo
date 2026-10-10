import { useState } from 'react'
import { Alert, Button, Card, Space, Tag, Typography } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import ErrorBoundary from '../../../components/ErrorBoundary/index.jsx'
import { useAsyncError } from '../../../components/ErrorBoundary/useAsyncError.js'


export function Bomb({ armed, label }) {
  if (armed) throw new Error(`${label}：这是在渲染期抛出的错误`)
  return <Alert type="success" showIcon message="渲染正常，没有抛错" />
}

/* —— 事件 / 异步抛错：必须借助 useAsyncError 抛回渲染期 —— */
export function AsyncThrower() {
  const throwError = useAsyncError()
  return (
    <Space wrap>
      <Button danger onClick={() => throwError(new Error('事件回调里抛的错 —— 已被边界接住'))}>
        事件回调里抛错
      </Button>
      <Button danger onClick={() => {
        setTimeout(() => throwError(new Error('定时器里抛的错 —— 已被边界接住')), 200)
      }}>
        定时器里抛错
      </Button>
      <Button danger onClick={() => {
        Promise.reject(new Error('Promise 里抛的错 —— 已被边界接住')).catch(throwError)
      }}>
        Promise 里抛错
      </Button>
    </Space>
  )
}

/* —— 对照组：不用 useAsyncError，直接在事件里 throw —— */
export function NaiveThrower() {
  return (
    <Button onClick={() => {
      throw new Error('直接抛：边界看不见它（打开控制台能看到报错，但页面不会降级）')
    }}>
      直接抛（兜不住）
    </Button>
  )
}
