import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '@i18n/index.js'

/**
 * 页面级返回。直接粘链进来或被守卫重登后的首个路由没有站内历史，
 * 此时 navigate(-1) 会退到站外，故回首页兜底。
 */
export default function BackButton({ homeTo = '/', size = 'large' }) {
  const navigate = useNavigate()
  const { key } = useLocation()
  const { t } = useI18n()
  const hasHistory = key !== 'default'

  return (
    <Button
      size={size}
      icon={<ArrowLeftOutlined />}
      onClick={() => navigate(hasHistory ? -1 : homeTo)}
    >
      {t(hasHistory ? 'shell.back' : 'shell.backHome')}
    </Button>
  )
}
