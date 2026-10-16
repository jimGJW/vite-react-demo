import { useState } from 'react'
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd'
const { Paragraph } = Typography
import {
  AsyncSelect,

  TagInput, TimeRangeInput,
} from '../../../components/Kit/index.js'
import { DEFAULT_RANGES, OVERLAP_RANGES, INITIAL_TAGS, loadDevices } from './KitData.js'
import { useI18n } from '../../../i18n/index.js'

export default function FormTab() {
  const { t } = useI18n()
  const [tags, setTags] = useState(INITIAL_TAGS)
  const [device, setDevice] = useState()
  const [ranges, setRanges] = useState(DEFAULT_RANGES)

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card size="small" title={t('kit.form.tagTitle')} extra={<Tag color="cyan">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.form.tagDesc')}
          </Paragraph>
          <TagInput value={tags} onChange={setTags} max={6} />
          <div className="kit-demo__status">
            {t('kit.form.currentTags', { tags: tags.length ? tags.join(' / ') : t('kit.form.emptyValue') })}
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title={t('kit.form.asyncTitle')} extra={<Tag color="cyan">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.form.asyncDesc')}
          </Paragraph>
          <Space direction="vertical" style={{ width: '100%' }}>
            <AsyncSelect
              load={loadDevices}
              value={device}
              onChange={setDevice}
              fields={{ value: 'id', label: 'name' }}
              placeholder={t('kit.form.asyncPlaceholder')}
              style={{ width: '100%' }}
              renderOption={(item) => (
                <div className="kit-async-option">
                  <span>{item.name}</span>
                  <span className="kit-async-option__desc">{item.dept}</span>
                </div>
              )}
            />
            <AsyncSelect
              multiple
              autoLoad
              load={loadDevices}
              placeholder={t('kit.form.asyncMultiPlaceholder')}
              style={{ width: '100%' }}
              fields={{ value: 'id', label: 'name' }}
            />
          </Space>
          <div className="kit-demo__status">
            {t('kit.form.selected', {
              value: device ? `${device.value} · ${device.label}` : t('kit.form.notSelected'),
            })}
          </div>
        </Card>
      </Col>

      <Col span={24}>
        <Card
          size="small"
          title={t('kit.form.timerangeTitle')}
          extra={
            <Space size={8}>
              <Tag color="cyan">mobile</Tag>
              <Button size="small" onClick={() => setRanges(OVERLAP_RANGES)}>
                {t('kit.form.fillOverlap')}
              </Button>
              <Button size="small" onClick={() => setRanges(DEFAULT_RANGES)}>
                {t('kit.form.reset')}
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.form.timerangeDesc')}
          </Paragraph>
          <TimeRangeInput value={ranges} onChange={setRanges} maxHours={12} />
        </Card>
      </Col>
    </Row>
  )
}
