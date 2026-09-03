import VoiceAssistantPanel from '../../components/Assistants/VoiceAssistantPanel.jsx'
import { useAssistants } from '../../components/Assistants/index.jsx'
import './index.scss'

/**
 * 语音助手页面
 *
 * 直接复用可复用的 <VoiceAssistantPanel /> 组件（embedded 内嵌模式），
 * 与右下角快捷助手键唤起的「语音助手弹窗」是同一套 UI、同一份代码，
 * 区别只在于渲染形态：页面内嵌 vs 浮层弹窗。
 *
 * 点「交给 AI Agent →」会把识别出的文字转交全局 AI Agent 执行。
 */
export default function VoiceAssistant() {
  const assistants = useAssistants()

  return (
    <div className="page-card voice-page">
      <h1>语音助手</h1>
      <p className="voice-page-desc">
        语音转文字，支持两种引擎：<strong>在线识别</strong>（浏览器原生，实时连续）与
        <strong>离线识别</strong>（本地 Whisper 模型，语音不出本机，无需外网，模型已内置无需下载）。
        识别出的文字会自动填入文本框，可直接编辑修改。
      </p>

      <VoiceAssistantPanel
        embedded
        onSendToAgent={(text) => assistants?.sendToAgent(text)}
      />

      <p className="voice-page-tip">
        <strong>使用提示：</strong> 在任意页面点击右下角的<strong>快捷助手键 ⚡</strong>（可拖动），
        展开菜单即可开关「语音助手」弹窗、或一键跳转到其它页面；也可按
        <strong> Ctrl+Shift+V </strong>快捷键直接呼出语音助手浮层。
      </p>
    </div>
  )
}
