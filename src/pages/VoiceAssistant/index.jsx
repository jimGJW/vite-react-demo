import VoiceAssistantPanel from '../../components/Assistants/VoiceAssistantPanel.jsx'
import { useAssistants } from '../../components/Assistants/index.jsx'
import { useI18n } from '../../i18n/index.js'
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
  const { t } = useI18n()

  return (
    <div className="page-card voice-page">
      <h1>{t('voice.page.title')}</h1>
      <p className="voice-page-desc">
        {t('voice.page.descPre')}<strong>{t('voice.input.webEngine')}</strong>{t('voice.page.descOnline')}
        <strong>{t('voice.input.localEngine')}</strong>{t('voice.page.descOffline')}
      </p>

      <VoiceAssistantPanel
        embedded
        onSendToAgent={(text) => assistants?.sendToAgent(text)}
      />

      <p className="voice-page-tip">
        <strong>{t('voice.page.tipLabel')}</strong> {t('voice.page.tipPre')}<strong>{t('voice.page.tipKey')}</strong>{t('voice.page.tipMid')}
        <strong>{t('voice.page.tipShortcut')}</strong>{t('voice.page.tipPost')}
      </p>
    </div>
  )
}
