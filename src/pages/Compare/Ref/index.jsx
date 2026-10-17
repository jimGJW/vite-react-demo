import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Button, Space, Input, Tag, Card, Divider, Typography, Progress } from 'antd'
import {
  ThunderboltOutlined, AimOutlined, ClearOutlined, SyncOutlined,
} from '@ant-design/icons'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { useI18n } from '../../../i18n/index.js'

const { Text, Paragraph } = Typography

/* =====================================================================
   React · Ref / DOM 操作演示
   1. 直接操作 DOM：useRef + div/input + scroll/select/focus
   2. forwardRef + useImperativeHandle：暴露命令式 API（自定义 VideoPlayer）
   ===================================================================== */

// 2. 自定义组件：VideoPlayer（模拟）—— 暴露 { play, pause, seek, getState } 命令式方法
const VideoPlayer = forwardRef(function VideoPlayer({ title, duration = 120 }, ref) {
  const { t } = useI18n()
  const playerTitle = title || t('compare.ref.videoTitle')
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)   // 0..duration
  const timerRef = useRef(null)
  // 与 time 同步的 ref：定时器回调需要同步读取当前进度来决定是否到达片尾
  const timeRef = useRef(0)

  // 卸载时必须清理计时器：否则播放中离开页面后，interval 会持续 setState（对应 Vue 版的 onBeforeUnmount）
  useEffect(() => () => clearInterval(timerRef.current), [])

  useImperativeHandle(ref, () => ({
    play() {
      if (playing) return
      setPlaying(true)
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        // 进度推进与片尾自停都放在定时器回调里（普通事件回调），
        // 不写进 setState 的 updater —— updater 必须是纯函数，StrictMode 下可能被调用两次
        const next = Math.min(timeRef.current + 1, duration)
        timeRef.current = next
        setTime(next)
        if (next >= duration) {
          clearInterval(timerRef.current)
          timerRef.current = null
          setPlaying(false)
        }
      }, 200)
    },
    pause() {
      clearInterval(timerRef.current)
      timerRef.current = null
      setPlaying(false)
    },
    seek(sec) {
      const v = Math.max(0, Math.min(duration, sec))
      timeRef.current = v
      setTime(v)
    },
    reset() {
      clearInterval(timerRef.current)
      timerRef.current = null
      setPlaying(false)
      timeRef.current = 0
      setTime(0)
    },
    getState() { return { playing, time, duration } },
  }), [playing, time, duration])

  const pct = Math.round((time / duration) * 100)

  return (
    <div className="r-player">
      <div className="r-player__screen">
        <div className="r-player__title">{playerTitle}</div>
        <Progress
          type="circle"
          percent={pct}
          size={110}
          format={v => `${Math.round(v/100*duration)}s / ${duration}s`}
          status={playing ? 'active' : undefined}
        />
      </div>
      <div className="r-player__bar">
        <Tag color={playing ? 'green' : 'default'}>
          {playing ? t('compare.ref.playing') : t('compare.ref.paused')}
        </Tag>
        <Progress percent={pct} showInfo={false} style={{ flex: 1, marginLeft: 12 }} />
      </div>
    </div>
  )
})

function ReactDemo() {
  const { t } = useI18n()
  // 1. DOM 引用
  const inputRef   = useRef(null)
  const scrollBox  = useRef(null)
  const [log, setLog] = useState([])
  const append = (v) => setLog(l => [v, ...l].slice(0, 8))

  // 2. 自定义组件命令式引用
  const playerRef = useRef(null)

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">

      <Card size="small" title={<><Tag color="blue">{t('compare.ref.domRefCard')}</Tag></>}>
        <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
          <Input ref={inputRef} placeholder={t('compare.ref.inputPlaceholder')} defaultValue="Hello React Refs!" />
          <Button type="primary" icon={<AimOutlined />}
            onClick={() => { inputRef.current?.focus(); inputRef.current?.select() }}
          >{t('compare.ref.focusSelect')}</Button>
          <Button icon={<SyncOutlined />}
            onClick={() => {
              const v = inputRef.current?.value || ''
              inputRef.current.value = v.split('').reverse().join('')
              append(t('compare.ref.reverseLog') + inputRef.current.value)
            }}
          >{t('compare.ref.reverseText')}</Button>
        </Space.Compact>

        <div ref={scrollBox} className="r-scroll">
          {log.length === 0
            ? <Text type="secondary" style={{ fontSize: 12 }}>
                {t('compare.ref.logEmpty')}
              </Text>
            : log.map((l, i) => (
                <div key={i} className="r-scroll__item">
                  <Tag color="geekblue" style={{ fontSize: 11 }}>#{log.length - i}</Tag>
                  &nbsp;{l}
                </div>
              ))}
          {/* 占位以便溢出 */}
          <div style={{ height: 60 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button size="small" icon={<ThunderboltOutlined />}
            onClick={() => { append(t('compare.ref.appendLog') + Date.now()); scrollBox.current?.scrollTo({ top: 0, behavior: 'smooth' }) }}
          >{t('compare.ref.appendScroll')}</Button>
          <Button size="small" icon={<ClearOutlined />} onClick={() => setLog([])}>{t('compare.ref.clear')}</Button>
        </div>
      </Card>

      <Card size="small" title={<><Tag color="magenta">{t('compare.ref.imperativeCard')}</Tag></>}>
        <VideoPlayer ref={playerRef} />
        <Divider style={{ margin: '12px 0' }} />
        <Space wrap>
          <Button type="primary" onClick={() => playerRef.current?.play()}>{t('compare.ref.playBtn')}</Button>
          <Button onClick={() => playerRef.current?.pause()}>{t('compare.ref.pauseBtn')}</Button>
          <Button onClick={() => playerRef.current?.seek(30)}>{t('compare.ref.seekBtn')}</Button>
          <Button onClick={() => playerRef.current?.seek(playerRef.current?.getState()?.duration ?? 120)}>{t('compare.ref.jumpEnd')}</Button>
          <Button danger onClick={() => playerRef.current?.reset()}>{t('compare.ref.resetBtn')}</Button>
          <Button
            onClick={() => append('getState(): ' + JSON.stringify(playerRef.current?.getState() ?? {}))}
          >{t('compare.ref.getStateBtn')}</Button>
        </Space>
        <Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
          {t('compare.ref.imperativeNote1')} <Text code>useImperativeHandle</Text>
          {t('compare.ref.imperativeNote2')} <Text code>defineExpose</Text> {t('compare.ref.imperativeNote3')}
        </Paragraph>
      </Card>
    </Space>
  )
}

/* ========== 页面 ========== */
export default function CompareRef() {
  const { t } = useI18n()
  return (
    <CompareLayout
      title={t('compare.ref.title')}
      subtitle={t('compare.ref.subtitle')}
      tags={[
        { label: t('compare.ref.tagRef') },
        { label: t('compare.ref.tagImperative'), color: 'cyan' },
        { label: t('compare.ref.tagForward') },
      ]}
      reactDemo={<ReactDemo />}
      vueAppPath="/pattern/ref"
      diffRows={[
        { title: t('compare.ref.diff.domRef.title'), antd: t('compare.ref.diff.domRef.antd'), vue: t('compare.ref.diff.domRef.vue') },
        { title: t('compare.ref.diff.crossRef.title'), antd: t('compare.ref.diff.crossRef.antd'), vue: t('compare.ref.diff.crossRef.vue') },
        { title: t('compare.ref.diff.exposeApi.title'), antd: t('compare.ref.diff.exposeApi.antd'), vue: t('compare.ref.diff.exposeApi.vue') },
        { title: t('compare.ref.diff.readWrite.title'), antd: t('compare.ref.diff.readWrite.antd'), vue: t('compare.ref.diff.readWrite.vue') },
        { title: t('compare.ref.diff.multiRef.title'), antd: t('compare.ref.diff.multiRef.antd'), vue: t('compare.ref.diff.multiRef.vue') },
        { title: t('compare.ref.diff.sideEffect.title'), antd: t('compare.ref.diff.sideEffect.antd'), vue: t('compare.ref.diff.sideEffect.vue') },
      ]}
      code={{
        antdCode:
`// DOM
const inputRef = useRef(null)
useEffect(() => {
  inputRef.current?.focus()
}, [])
<input ref={inputRef} />

// forwardRef + useImperativeHandle
const Player = forwardRef(function Player(_, ref) {
  const [playing, setP] = useState(false)
  useImperativeHandle(ref, () => ({
    play()  { setP(true)  },
    pause() { setP(false) },
  }), [])
  return <div>{playing ? '▶' : '⏸'}</div>
})

// 使用
const pRef = useRef(null)
<Player ref={pRef} />
<button onClick={() => pRef.current?.play()}>Play</button>`,
        vueCode:
`<!-- 1. DOM -->
<script setup>
  const inputRef = ref(null)
  onMounted(() => { inputRef.value?.focus() })
</script>
<template>
  <input ref="inputRef" />
</template>

<!-- 2. defineExpose：子组件 -->
<script setup>
const playing = ref(false)
const time    = ref(0)
defineExpose({
  play()  { playing.value = true  },
  pause() { playing.value = false },
  seek(s) { time.value = s },
  getState() { return { playing: playing.value, time: time.value } }
})
</script>

<!-- 父组件 -->
<VideoPlayer ref="player" />
<el-button @click="player.play()">▶ play()</el-button>`,
      }}
    />
  )
}
