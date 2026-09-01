<script setup>
import { ref, computed, watch, h } from 'vue'
import './DataTable.scss'

/* =====================================================================
 * 高级数据表格 · 零外部依赖（仅 Vue 3）
 * 统一消费 :root 设计 token，保持 Indigo 玻璃态风格
 * 能力：列排序、列级模糊筛选、分页、行选择、空状态、加载骨架、横向滚动
 * ===================================================================== */

/** 取比较用的字段值（数字按数值比较，其他转小写字符串）。 */
function getSortValue(row, key) {
  const v = row[key]
  if (v == null) return ''
  if (typeof v === 'number') return v
  return String(v).toLowerCase()
}

/** 复选框（原生 input + 自定义玻璃态样式），以函数式组件内联定义。 */
const Checkbox = (props, { emit }) =>
  h('label', { class: 'dt-checkbox' }, [
    h('input', {
      type: 'checkbox',
      checked: props.checked,
      indeterminate: props.indeterminate,
      'aria-label': props.label,
      onChange: (e) => emit('change', e),
    }),
    h(
      'span',
      { class: 'dt-checkbox-box', 'aria-hidden': 'true' },
      props.indeterminate ? '−' : props.checked ? '✓' : '',
    ),
  ])
Checkbox.props = { checked: Boolean, indeterminate: Boolean, label: String }
Checkbox.emits = ['change']

/**
 * 单元格渲染器：优先用列 `render(value, row, index)`，否则取 `row[key]`。
 * 返回原始值由 Vue 自动归一为文本节点，返回 VNode 则直接渲染。
 */
const Cell = (props) => {
  const content =
    typeof props.render === 'function'
      ? props.render(props.value, props.row, props.index)
      : props.value
  return content == null ? null : content
}
Cell.props = { render: Function, value: null, row: Object, index: Number }

/**
 * 列定义 `columns` 每项支持：
 * - `key` 字段名；`title` 表头标题
 * - `render(value, row, index)` 自定义单元格渲染
 * - `sortable` 是否可排序；`filterable` 是否显示筛选输入框；`width` 列宽
 *
 * `rowSelection` 形如 `{ selectedRowKeys, onChange(keys, rows) }`，
 * `onRow` 形如 `{ onClick(row, index), onDoubleClick(row, index) }`。
 */
const props = defineProps({
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  /** 每页行数；不传或 <=0 则不分页。 */
  pageSize: { type: Number, default: undefined },
  rowSelection: { type: Object, default: null },
  onRow: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  rowKey: { type: String, default: 'id' },
  className: { type: String, default: '' },
})

const emit = defineEmits(['row-click', 'row-dblclick', 'selection-change'])

const sorter = ref({ key: null, order: null })
const filters = ref({})
const page = ref(1)

// pageSize 变化时回到第 1 页
watch(
  () => props.pageSize,
  () => {
    page.value = 1
  },
)

/** 筛选：对配置了 filterable 且输入了关键字的列做模糊匹配 */
const filteredData = computed(() => {
  const activeKeys = Object.keys(filters.value).filter((k) => filters.value[k])
  if (!activeKeys.length) return props.data
  return props.data.filter((row) =>
    activeKeys.every((k) => {
      const v = row[k]
      return v != null && String(v).toLowerCase().includes(filters.value[k].toLowerCase())
    }),
  )
})

/** 排序：asc / desc / null 三态 */
const sortedData = computed(() => {
  if (!sorter.value.key || !sorter.value.order) return filteredData.value
  const dir = sorter.value.order === 'asc' ? 1 : -1
  const key = sorter.value.key
  return [...filteredData.value].sort((a, b) => {
    const va = getSortValue(a, key)
    const vb = getSortValue(b, key)
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

// 分页
const usePagination = computed(() => typeof props.pageSize === 'number' && props.pageSize > 0)
const total = computed(() => sortedData.value.length)
const totalPages = computed(() =>
  usePagination.value ? Math.max(1, Math.ceil(total.value / props.pageSize)) : 1,
)
const safePage = computed(() => Math.min(Math.max(1, page.value), totalPages.value))
const pagedData = computed(() =>
  usePagination.value
    ? sortedData.value.slice((safePage.value - 1) * props.pageSize, safePage.value * props.pageSize)
    : sortedData.value,
)

// 行选择
const hasSelection = computed(() => !!props.rowSelection)
const selectedSet = computed(() => new Set(props.rowSelection?.selectedRowKeys || []))
const pageKeys = computed(() => pagedData.value.map((r) => r[props.rowKey]))
const allPageSelected = computed(
  () => pageKeys.value.length > 0 && pageKeys.value.every((k) => selectedSet.value.has(k)),
)
const somePageSelected = computed(() => pageKeys.value.some((k) => selectedSet.value.has(k)))

function fireSelectionChange(nextSet) {
  const keys = Array.from(nextSet)
  const rows = props.data.filter((r) => nextSet.has(r[props.rowKey]))
  emit('selection-change', keys, rows)
  props.rowSelection?.onChange?.(keys, rows)
}

function toggleRow(row) {
  const key = row[props.rowKey]
  const next = new Set(selectedSet.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  fireSelectionChange(next)
}

function toggleSelectAll() {
  const next = new Set(selectedSet.value)
  if (allPageSelected.value) pageKeys.value.forEach((k) => next.delete(k))
  else pageKeys.value.forEach((k) => next.add(k))
  fireSelectionChange(next)
}

/** 排序切换：asc -> desc -> 取消 */
function onSort(col) {
  if (!col.sortable) return
  const prev = sorter.value
  if (prev.key !== col.key) sorter.value = { key: col.key, order: 'asc' }
  else if (prev.order === 'asc') sorter.value = { key: col.key, order: 'desc' }
  else if (prev.order === 'desc') sorter.value = { key: null, order: null }
  else sorter.value = { key: col.key, order: 'asc' }
}

function onFilter(key, value) {
  filters.value = { ...filters.value, [key]: value }
}

function rowIndex(ri) {
  return (usePagination.value ? (safePage.value - 1) * props.pageSize : 0) + ri
}

// 行事件：同时支持 onRow prop 回调与 Vue 事件
function handleRowClick(row, ri) {
  props.onRow?.onClick?.(row, ri)
  emit('row-click', row, ri)
}

function handleRowDblClick(row, ri) {
  props.onRow?.onDoubleClick?.(row, ri)
  emit('row-dblclick', row, ri)
}

const colCount = computed(() => props.columns.length + (hasSelection.value ? 1 : 0))
</script>

<template>
  <div class="dt" :class="[className, { 'is-loading': loading }]">
    <div class="dt-scroll" role="region" aria-label="数据表格" tabindex="0">
      <table class="dt-table">
        <thead v-if="columns.length > 0">
          <tr>
            <th v-if="hasSelection" class="dt-cell-check" scope="col">
              <Checkbox
                :checked="allPageSelected"
                :indeterminate="!allPageSelected && somePageSelected"
                label="全选当前页"
                @change="toggleSelectAll"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              class="dt-th"
              :class="{
                'is-sortable': col.sortable,
                [`is-${sorter.order}`]: sorter.key === col.key && sorter.order,
              }"
              :style="col.width ? { width: col.width } : undefined"
            >
              <button
                type="button" class="dt-th-btn"
                :disabled="!col.sortable"
                @click="onSort(col)"
              >
                <span class="dt-th-title">{{ col.title }}</span>
                <span v-if="col.sortable" class="dt-sort-icon" aria-hidden="true">
                  {{
                    sorter.key === col.key && sorter.order
                      ? sorter.order === 'asc' ? '▲' : '▼'
                      : '⇅'
                  }}
                </span>
              </button>
              <div v-if="col.filterable" class="dt-filter">
                <input
                  type="search"
                  class="dt-filter-input"
                  :placeholder="`筛选 ${col.title}`"
                  :value="filters[col.key] || ''"
                  @input="onFilter(col.key, $event.target.value)"
                />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <template v-if="loading">
            <tr v-for="ri in 5" :key="`sk-${ri}`" class="dt-skeleton-row">
              <td v-if="hasSelection" class="dt-cell-check">
                <div class="dt-skeleton dt-skeleton-check" />
              </td>
              <td v-for="col in columns" :key="col.key">
                <div class="dt-skeleton" />
              </td>
            </tr>
          </template>

          <template v-else-if="pagedData.length === 0">
            <tr class="dt-empty-row">
              <td :colspan="colCount">
                <div class="dt-empty">
                  <span class="dt-empty-icon" aria-hidden="true">📭</span>
                  <span class="dt-empty-text">{{ emptyText }}</span>
                </div>
              </td>
            </tr>
          </template>

          <template v-else>
            <tr
              v-for="(row, ri) in pagedData"
              :key="row[rowKey] ?? ri"
              class="dt-row"
              :class="{ 'is-selected': selectedSet.has(row[rowKey]) }"
              @click="handleRowClick(row, rowIndex(ri))"
              @dblclick="handleRowDblClick(row, rowIndex(ri))"
            >
              <td v-if="hasSelection" class="dt-cell-check" @click.stop>
                <Checkbox
                  :checked="selectedSet.has(row[rowKey])"
                  :label="`选择第 ${rowIndex(ri) + 1} 行`"
                  @change="toggleRow(row)"
                />
              </td>
              <td v-for="col in columns" :key="col.key" class="dt-cell">
                <Cell :render="col.render" :value="row[col.key]" :row="row" :index="rowIndex(ri)" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="usePagination && !loading" class="dt-footer">
      <div class="dt-info">
        共 <strong>{{ total }}</strong> 条
        <template v-if="total > 0">
          · 第 {{ (safePage - 1) * pageSize + 1 }}-{{ Math.min(safePage * pageSize, total) }} 条
        </template>
      </div>
      <div class="dt-pager">
        <button
          type="button" class="dt-page-btn" aria-label="首页"
          :disabled="safePage <= 1" @click="page = 1"
        >
          «
        </button>
        <button
          type="button" class="dt-page-btn" aria-label="上一页"
          :disabled="safePage <= 1" @click="page = Math.max(1, safePage - 1)"
        >
          ‹
        </button>
        <span class="dt-page-info">{{ safePage }} / {{ totalPages }}</span>
        <button
          type="button" class="dt-page-btn" aria-label="下一页"
          :disabled="safePage >= totalPages" @click="page = Math.min(totalPages, safePage + 1)"
        >
          ›
        </button>
        <button
          type="button" class="dt-page-btn" aria-label="末页"
          :disabled="safePage >= totalPages" @click="page = totalPages"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>
