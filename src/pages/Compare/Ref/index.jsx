import { forwardRef, useImperativeHandle, useRef, useState, lazy } from 'react'
import { Button, Space, Input, Tag, Card, Divider, Typography, Progress } from 'antd'
import {
  ThunderboltOutlined, AimOutlined, ClearOutlined, SyncOutlined,
} from '@ant-design/icons'
import CompareLayout from '../../../utils/CompareLayout.jsx'
import { mountVueBridge } from '../../../utils/mountVueBridge.jsx'

const RefVue = lazy(() => import('./demo-ref.vue').then((m) => ({ default: mountVueBridge(m.default || m) })))
const { Text, Paragraph } = Typography

/* =====================================================================
   React · Ref / DOM 操作演示
   1. 直接操作 DOM：useRef + div/input + scroll/select/focus
   2. forwardRef + useImperativeHandle：暴露命令式 API（自定义 VideoPlayer）
   ===================================================================== */

// 2. 自定义组件：VideoPlayer（模拟）—— 暴露 { play, pause, seek, getState } 命令式方法
const VideoPlayer = forwardRef(function VideoPlayer({ title = '影片「React vs Vue」', duration = 120 }, ref) {
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)   // 0..duration
  const timerRef = useRef(null)

  useImperativeHandle(ref, () => ({
    play() {
      if (playing) return
      setPlaying(true)
      timerRef.current = setInterval(() => {
        setTime(t => t >= duration ? (clearInterval(timerRef.current), setPlaying(false), duration) : t + 1)
      }, 200)
    },
    pause() {
      clearInterval(timerRef.current)
      setPlaying(false)
    },
    seek(sec) {
      setTime(Math.max(0, Math.min(duration, sec)))
    },
    reset() {
      clearInterval(timerRef.current)
      setPlaying(false)
      setTime(0)
    },
    getState() { return { playing, time, duration } },
  }), [playing, time, duration])

  const pct = Math.round((time / duration) * 100)

  return (
    <div className="r-player">
      <div className="r-player__screen">
        <div className="r-player__title">{title}</div>
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
          {playing ? '▶ 播放中' : '⏸ 已暂停'}
        </Tag>
        <Progress percent={pct} showInfo={false} style={{ flex: 1, marginLeft: 12 }} />
      </div>
    </div>
  )
})

function ReactDemo() {
  // 1. DOM 引用
  const inputRef   = useRef(null)
  const scrollBox  = useRef(null)
  const [log, setLog] = useState([])
  const append = (v) => setLog(l => [v, ...l].slice(0, 8))

  // 2. 自定义组件命令式引用
  const playerRef = useRef(null)

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">

      <Card size="small" title={<><Tag color="blue">① DOM Ref：操作原生 input / div</Tag></>}>
        <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
          <Input ref={inputRef} placeholder="点击「聚焦」选中文字…" defaultValue="Hello React Refs!" />
          <Button type="primary" icon={<AimOutlined />}
            onClick={() => { inputRef.current?.focus(); inputRef.current?.select() }}
          >聚焦 + 选中</Button>
          <Button icon={<SyncOutlined />}
            onClick={() => {
              const v = inputRef.current?.value || ''
              inputRef.current.value = v.split('').reverse().join('')
              append(`反转输入框文字 → ${inputRef.current.value}`)
            }}
          >倒转文字</Button>
        </Space.Compact>

        <div ref={scrollBox} className="r-scroll">
          {log.length === 0
            ? <Text type="secondary" style={{ fontSize: 12 }}>
                下方日志区：点击右侧按钮，自动滚动到底部（scrollBox.current.scrollTo）
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
            onClick={() => { append(`追加日志：${Date.now()}`); scrollBox.current?.scrollTo({ top: 0, behavior: 'smooth' }) }}
          >追加（滚到底）</Button>
          <Button size="small" icon={<ClearOutlined />} onClick={() => setLog([])}>清空</Button>
        </div>
      </Card>

      <Card size="small" title={<><Tag color="magenta">② forwardRef + useImperativeHandle：命令式组件 API</Tag></>}>
        <VideoPlayer ref={playerRef} />
        <Divider style={{ margin: '12px 0' }} />
        <Space wrap>
          <Button type="primary" onClick={() => playerRef.current?.play()}>▶ play()</Button>
          <Button onClick={() => playerRef.current?.pause()}>⏸ pause()</Button>
          <Button onClick={() => playerRef.current?.seek(30)}>⏭ seek(30s)</Button>
          <Button onClick={() => playerRef.current?.seek(playerRef.current?.getState()?.duration ?? 120)}>⏩ 跳到结尾</Button>
          <Button danger onClick={() => playerRef.current?.reset()}>⟲ reset()</Button>
          <Button
            onClick={() => append('getState(): ' + JSON.stringify(playerRef.current?.getState() ?? {}))}
          >getState() → 打印</Button>
        </Space>
        <Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
          父组件无法直接读取子组件内部 state；必须通过 <Text code>useImperativeHandle</Text>
          显式暴露方法。和 Vue 3 的 <Text code>defineExpose</Text> 一一对应。
        </Paragraph>
      </Card>
    </Space>
  )
}

/* ========== 页面 ========== */
export default function CompareRef() {
  return (
    <CompareLayout
      title="Ref / DOM 操作"
      subtitle={'React：useRef（DOM/变量）+ forwardRef + useImperativeHandle（命令式 API）；Vue：ref="x" + defineExpose 暴露方法。'}
      tags={[
        { label: 'useRef vs ref' },
        { label: '命令式 API', color: 'cyan' },
        { label: 'forwardRef / defineExpose' },
      ]}
      reactDemo={<ReactDemo />}
      vueDemo={<RefVue />}
      diffRows={[
        { title: 'DOM 引用声明', antd: 'const r = useRef(null); <input ref={r}/>', vue: 'const r = ref(null); <input ref="r" /> （同名即可绑定）' },
        { title: '跨组件传递 ref', antd: 'forwardRef(MyComp(props, ref))', vue: '子组件默认 ref 指向根 DOM；或 $refs（option API）' },
        { title: '暴露命令式 API', antd: 'useImperativeHandle(ref, () => ({ play, ... }), deps)', vue: 'defineExpose({ play, pause, getState })' },
        { title: '读取 / 写入 ref 值', antd: 'r.current 读写，.current 修改不触发渲染', vue: 'r.value 读写；ref(reactive) 自动响应式' },
        { title: '多个 ref：列表', antd: 'ref={el => arr[i] = el}（回调 ref）或 useRef([])', vue: '<div v-for="i in 5" :ref="el => list[i]=el" /> 或 :ref="keyed"' },
        { title: '「副作用」DOM 操作', antd: '在 useEffect 里操作（挂载后 / 依赖变化后）', vue: 'onMounted 钩子中' },
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
