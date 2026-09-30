<template>
  <div class="table-page">
    <header class="page-header-vue">
      <h1>数据表格 · Table</h1>
      <p>排序 / 关键字过滤 / 多选 / 行内编辑 / 分页 / 导出 CSV —— 全部由 useTableState 组合式函数驱动</p>
    </header>

    <section class="table-card">
      <h3>筛选与批量操作</h3>
      <div class="table-toolbar">
        <el-input
          v-model="table.keyword.value"
          placeholder="搜索城市 / 负责人 / 状态"
          clearable
          style="max-width: 260px"
        >
          <template #prefix>🔍</template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 140px">
          <el-option label="全部状态" value="" />
          <el-option label="正常" value="ok" />
          <el-option label="告警" value="alarm" />
          <el-option label="离线" value="offline" />
        </el-select>
        <el-button type="primary" @click="exportCsv">导出 CSV</el-button>
        <el-button :disabled="!selection.length" @click="batchToggle">批量置为正常（{{ selection.length }}）</el-button>
        <el-button @click="reset">重置</el-button>
      </div>
      <div class="table-metrics">
        <span class="m-chip m-chip--info">总记录 {{ rows.length }}</span>
        <span class="m-chip m-chip--ok">过滤后 {{ table.filtered.value.length }}</span>
        <span class="m-chip m-chip--warn">当前页 {{ table.paged.value.rows.length }}</span>
        <span class="m-chip">第 {{ table.paged.value.page }} / {{ table.paged.value.pageCount }} 页</span>
      </div>
    </section>

    <section class="table-card">
      <h3>数据明细</h3>
      <el-table
        :data="table.paged.value.rows"
        border
        stripe
        highlight-current-row
        style="width: 100%"
        @selection-change="onSelectionChange"
        @sort-change="onSortChange"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column prop="name" label="城市" min-width="110" sortable="custom">
          <template #default="{ row }">
            <span class="tbl-name">
              <i class="tbl-dot" :class="`tbl-dot--${row.status}`" />{{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="rooms" label="房间数" width="100" sortable="custom" />
        <el-table-column prop="alarms" label="告警数" width="100" sortable="custom">
          <template #default="{ row }">
            <span :class="row.alarms > 5 ? 'tbl-danger' : 'tbl-ok'">{{ row.alarms }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="tagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="170" sortable="custom" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ $index, row }">
            <el-button link type="primary" size="small" @click="startEdit(row, $index)">编辑</el-button>
            <el-button link type="danger" size="small" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pager">
        <el-pagination
          layout="prev, pager, next, sizes, total"
          :total="table.paged.value.total"
          :current-page="table.paged.value.page"
          :page-size="table.paged.value.pageSize"
          :page-sizes="[5, 10, 20]"
          @current-change="(p) => (table.page.value = p)"
          @size-change="(s) => { table.size.value = s; table.page.value = 1 }"
        />
      </div>
    </section>

    <section class="table-card">
      <h3>行内编辑（双击单元格也可进入编辑）</h3>
      <el-table :data="editable" border style="width: 100%">
        <el-table-column prop="city" label="城市" min-width="120">
          <template #default="{ row }">
            <el-input v-if="row.editing" v-model="row.city" size="small" />
            <span v-else @dblclick="row.editing = true">{{ row.city }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="admins" label="管理员数" width="140">
          <template #default="{ row }">
            <el-input-number v-if="row.editing" v-model="row.admins" size="small" :min="0" :max="99" />
            <span v-else>{{ row.admins }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-input v-if="row.editing" v-model="row.owner" size="small" />
            <span v-else>{{ row.owner }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row, $index }">
            <el-button v-if="!row.editing" link type="primary" size="small" @click="row.editing = true">编辑</el-button>
            <template v-else>
              <el-button link type="success" size="small" @click="saveRow(row, $index)">保存</el-button>
              <el-button link size="small" @click="cancelRow(row, $index)">取消</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="table-card">
      <h3>展开行 + 确认弹窗（两步式交互：先展开看明细，再在展开区触发操作）</h3>
      <el-table :data="expandData" border style="width: 100%">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="tbl-expand">
              <p>房间明细（{{ row.rooms.length }} 间）：</p>
              <div class="tbl-expand__rooms">
                <span v-for="r in row.rooms" :key="r.id" class="m-chip" :class="`m-chip--${roomTone(r.status)}`">
                  {{ r.id }} · {{ r.name }}
                </span>
              </div>
              <div class="tbl-expand__actions">
                <el-button type="warning" size="small" @click="confirmSync(row)">同步该楼栋配置</el-button>
                <el-button type="danger" size="small" @click="confirmDisable(row)">停用该楼栋</el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="building" label="楼栋" min-width="120" />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column label="房间数" width="100">
          <template #default="{ row }">{{ row.rooms.length }}</template>
        </el-table-column>
        <el-table-column label="状态分布" min-width="200">
          <template #default="{ row }">
            <span class="m-chip m-chip--ok">正常 {{ countBy(row, 'ok') }}</span>
            <span class="m-chip m-chip--danger">告警 {{ countBy(row, 'alarm') }}</span>
            <span class="m-chip">离线 {{ countBy(row, 'offline') }}</span>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTableState } from '../composables'
import { formatDate, toCsv, downloadText, deepClone } from '../utils'

/* —— 主表数据 —— */
const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '天津', '重庆']
const OWNERS = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊']
const STATUSES = ['ok', 'alarm', 'offline']

const rows = ref(CITIES.map((name, i) => ({
  id: i + 1,
  name,
  rooms: 40 + ((i * 17) % 260),
  alarms: (i * 7) % 14,
  owner: OWNERS[i % OWNERS.length],
  status: STATUSES[i % STATUSES.length],
  updatedAt: formatDate(new Date(Date.now() - i * 3600_000), 'YYYY-MM-DD HH:mm:ss'),
})))

const statusFilter = ref('')
const filteredRows = computed(() => (
  statusFilter.value ? rows.value.filter((r) => r.status === statusFilter.value) : rows.value
))

const table = useTableState(filteredRows, { pageSize: 5, filterKeys: ['name', 'owner', 'status'] })

const statusText = (s) => ({ ok: '正常', alarm: '告警', offline: '离线' }[s] || s)
const tagType = (s) => ({ ok: 'success', alarm: 'danger', offline: 'info' }[s] || 'info')

const onSortChange = ({ prop, order }) => {
  if (!prop || !order) {
    table.sortKey.value = ''
    return
  }
  table.sortKey.value = prop
  table.sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  table.page.value = 1
}

const selection = ref([])
const onSelectionChange = (val) => { selection.value = val }
const batchToggle = () => {
  const ids = new Set(selection.value.map((r) => r.id))
  rows.value = rows.value.map((r) => (ids.has(r.id) ? { ...r, status: 'ok', alarms: 0 } : r))
  ElMessage.success(`已把 ${ids.size} 条记录置为正常`)
}

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」？此操作不可撤销。`, '删除确认', {
      type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消',
    })
    rows.value = rows.value.filter((r) => r.id !== row.id)
    ElMessage.success('已删除')
  } catch {
    ElMessage.info('已取消')
  }
}

const reset = () => {
  table.keyword.value = ''
  statusFilter.value = ''
  table.sortKey.value = ''
  table.page.value = 1
  ElMessage.info('已重置筛选条件')
}

const exportCsv = () => {
  const csv = toCsv(table.filtered.value, ['id', 'name', 'rooms', 'alarms', 'owner', 'status', 'updatedAt'])
  downloadText(`城市监控-${formatDate(new Date(), 'YYYYMMDD-HHmmss')}.csv`, csv, 'text/csv;charset=utf-8')
  ElMessage.success(`已导出 ${table.filtered.value.length} 条记录`)
}

/* —— 行内编辑 —— */
const editable = ref([
  { city: '北京', admins: 3, owner: '张伟', editing: false },
  { city: '上海', admins: 5, owner: '李娜', editing: false },
  { city: '广州', admins: 2, owner: '王强', editing: false },
])
const snapshot = ref({})
const startEdit = (row, index) => {
  snapshot.value[index] = deepClone({ city: row.city, admins: row.admins, owner: row.owner })
  row.editing = true
}
const saveRow = (row, index) => {
  row.editing = false
  delete snapshot.value[index]
  ElMessage.success(`已保存「${row.city}」`)
}
const cancelRow = (row, index) => {
  const prev = snapshot.value[index]
  if (prev) Object.assign(row, prev)
  row.editing = false
  ElMessage.info('已撤销修改')
}

/* —— 展开行 —— */
const expandData = ref(['A 座', 'B 座', 'C 座'].map((building, bi) => ({
  building,
  contact: OWNERS[bi % OWNERS.length],
  rooms: Array.from({ length: 6 + bi * 2 }, (_, i) => ({
    id: `${building}-${String(i + 1).padStart(3, '0')}`,
    name: `房${i + 1}`,
    status: STATUSES[(bi + i) % STATUSES.length],
  })),
})))
const roomTone = (s) => ({ ok: 'ok', alarm: 'danger', offline: '' }[s] || '')
const countBy = (row, status) => row.rooms.filter((r) => r.status === status).length

const confirmSync = async (row) => {
  try {
    await ElMessageBox.confirm(`将把最新配置同步到「${row.building}」的 ${row.rooms.length} 个房间`, '同步确认', { type: 'warning' })
    ElMessage.success('同步任务已下发')
  } catch {
    ElMessage.info('已取消同步')
  }
}
const confirmDisable = async (row) => {
  try {
    await ElMessageBox.confirm(`停用「${row.building}」后其下所有房间将离线，确认继续？`, '停用确认', {
      type: 'error', confirmButtonText: '确认停用',
    })
    ElMessage.warning('已发起停用流程')
  } catch {
    ElMessage.info('已取消')
  }
}
</script>

<style scoped>
.table-page { padding: 20px 24px 44px; }
.table-card {
  border: 1px solid #e4e7ed; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 14px; background: #fff;
}
.table-card h3 { margin: 0 0 12px; font-size: 15px; color: #303133; }
.table-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.table-metrics { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.table-pager { display: flex; justify-content: flex-end; margin-top: 14px; }

.tbl-name { display: inline-flex; align-items: center; gap: 6px; }
.tbl-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.tbl-dot--ok { background: #67c23a; }
.tbl-dot--alarm { background: #f56c6c; }
.tbl-dot--offline { background: #c0c4cc; }
.tbl-danger { color: #f56c6c; font-variant-numeric: tabular-nums; }
.tbl-ok { color: #67c23a; font-variant-numeric: tabular-nums; }

.tbl-expand { padding: 6px 18px 12px; }
.tbl-expand p { margin: 0 0 8px; font-size: 12.5px; color: #909399; }
.tbl-expand__rooms { display: flex; gap: 6px; flex-wrap: wrap; }
.tbl-expand__actions { display: flex; gap: 8px; margin-top: 12px; }
</style>
