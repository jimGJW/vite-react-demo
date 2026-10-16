import { Card, Tag, Typography, Tooltip } from 'antd'
import { GithubOutlined, BranchesOutlined } from '@ant-design/icons'
import { FRAMEWORK_COLOR } from '../../../components/Templates/index.js'
import { useI18n } from '../../../i18n/index.js'

const { Paragraph, Text } = Typography


export function TemplateCard({ item }) {
  const { t } = useI18n()
  const color = FRAMEWORK_COLOR[item.framework] || '#1677ff'
  return (
    <Card
      className="tpl-card"
      size="small"
      styles={{ body: { padding: 16 } }}
      hoverable
    >
      <div className="tpl-card__head">
        <span className="tpl-card__fw" style={{ background: color }}>{item.framework}</span>
        <Text strong className="tpl-card__name">{item.name}</Text>
      </div>
      <div className="tpl-card__cat">{item.category}</div>
      <Paragraph type="secondary" className="tpl-card__desc">{item.desc}</Paragraph>

      <ul className="tpl-card__feats">
        {item.features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>

      <div className="tpl-card__tags">
        {item.tags.map((t) => (
          <Tag key={t} bordered={false} className="tpl-card__tag">{t}</Tag>
        ))}
      </div>

      <div className="tpl-card__foot">
        {item.upstream ? (
          <a className="tpl-card__link" href={item.upstream} target="_blank" rel="noreferrer">
            <GithubOutlined /> {t('templates.card.upstream')}
          </a>
        ) : (
          <Tooltip title={item.derived ? t('templates.card.derivedTip') : t('templates.card.templateTip')}>
            <span className="tpl-card__link tpl-card__link--disabled">
              <BranchesOutlined /> {item.derived ? t('templates.card.derivedLocal') : t('templates.card.templateLocal')}
            </span>
          </Tooltip>
        )}
      </div>
    </Card>
  )
}

