import { Button, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { exportCsv, copyText } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { SAMPLE_ROWS, CSV_COLUMNS } from './sampleData.js'

/** 导出与下载：CSV 导出（带 BOM）+ 文本复制 */
export default function ExportDemos() {
  return (
    <>
      <DemoCard
        title="exportCsv · 导出 CSV"
        desc="带 BOM，Excel 打开中文不乱码；字段值自动转义引号与换行。"
        usage="exportCsv({ columns, rows, filename: '资源清单.csv' })"
      >
        <Space wrap>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => exportCsv({ columns: CSV_COLUMNS, rows: SAMPLE_ROWS, filename: '资源清单.csv' })}
          >
            下载示例 CSV
          </Button>
          <Button size="small" onClick={() => copyText(JSON.stringify(SAMPLE_ROWS[0]))}>复制首行 JSON</Button>
        </Space>
        <div className="utils-demo__out">共 {SAMPLE_ROWS.length} 行 × {CSV_COLUMNS.length} 列</div>
      </DemoCard>
    </>
  )
}
