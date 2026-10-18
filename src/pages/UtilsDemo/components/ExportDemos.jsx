import { Button, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { exportCsv, copyText } from '@components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { SAMPLE_ROWS, CSV_COLUMNS } from './sampleData.js'
import { useI18n } from '@i18n/index.js'

/** 导出与下载：CSV 导出（带 BOM）+ 文本复制 */
export default function ExportDemos() {
  const { t } = useI18n()
  return (
    <>
      <DemoCard
        title={t('utilsdemo.exportCsvTitle')}
        desc={t('utilsdemo.exportCsvDesc')}
        usage="exportCsv({ columns, rows, filename: '资源清单.csv' })"
      >
        <Space wrap>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => exportCsv({ columns: CSV_COLUMNS, rows: SAMPLE_ROWS, filename: '资源清单.csv' })}
          >
            {t('utilsdemo.exportDownload')}
          </Button>
          <Button size="small" onClick={() => copyText(JSON.stringify(SAMPLE_ROWS[0]))}>{t('utilsdemo.exportCopyJson')}</Button>
        </Space>
        <div className="utils-demo__out">{t('utilsdemo.exportRowsCols', { rows: SAMPLE_ROWS.length, cols: CSV_COLUMNS.length })}</div>
      </DemoCard>
    </>
  )
}
