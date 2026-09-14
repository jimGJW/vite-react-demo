import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Select, Spin } from 'antd'

/**
 * AsyncSelect · 异步选择器
 * =====================================================================
 * 移植自 旧移动端项目 `components/select/SelectCustomOption.js`（441 行，
 * 那份实现里最有价值的一个）。原实现的核心能力是「配置驱动 + 防抖 + 依赖
 * 字段变化重新拉取 + labelInValue」，但深度耦合 dva 的 `preload` 与
 * react-weui 的表单壳。
 *
 * 这里重建为纯受控组件，保留：防抖搜索 / 请求竞态保护 / 自定义选项渲染 /
 * 静态与异步两种数据源共用一套 API。
 *
 * 与原实现的一处**有意不同**：改为**惰性加载**（首次展开下拉或输入搜索词
 * 时才请求），而不是挂载即请求。原因是挂载即请求需要在 effect 里同步
 * setLoading → 触发 react-hooks/set-state-in-effect；惰性加载同时也更省请求。
 * 需要挂载即加载时传 `autoLoad`。
 *
 * 用法：
 *   const loadUsers = async (keyword) => api.get('/users', { keyword })
 *   <AsyncSelect
 *     load={loadUsers}
 *     fields={{ value: 'uid', label: 'name' }}
 *     renderOption={(item) => <div>{item.name} <span>{item.dept}</span></div>}
 *     onChange={(v, option) => setUser(v)}
 *   />
 */

export default function AsyncSelect({
  load,
  value,
  onChange,
  options: staticOptions,
  fields = { value: 'value', label: 'label' },
  multiple = false,
  labelInValue = false,
  debounce = 300,
  placeholder = '请选择',
  emptyText = '暂无数据',
  renderOption,
  allowClear = true,
  showSearch = true,
  disabled = false,
  autoLoad = false,
  size,
  style,
  className = '',
}) {
  const isAsync = typeof load === 'function'
  const [asyncOptions, setAsyncOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const seqRef = useRef(0)
  const timerRef = useRef(0)
  const loadedRef = useRef(false)

  const valueField = fields.value
  const labelField = fields.label

  const runLoad = useCallback(
    async (keyword) => {
      if (!isAsync) return
      const seq = seqRef.current + 1
      seqRef.current = seq
      setLoading(true)
      try {
        const result = await load(keyword ?? '')
        if (seq !== seqRef.current) return // 竞态：只认最后一次请求
        setAsyncOptions(Array.isArray(result) ? result : [])
        loadedRef.current = true
        setLoaded(true)
      } finally {
        if (seq === seqRef.current) setLoading(false)
      }
    },
    [isAsync, load],
  )

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current)
      seqRef.current += 1 // 让在途请求的结果作废
    },
    [],
  )

  // autoLoad：放到定时器里执行，避免在 effect 中同步 setState
  useEffect(() => {
    if (!autoLoad || !isAsync || loaded) return undefined
    const id = window.setTimeout(() => {
      void runLoad('')
    }, 0)
    return () => window.clearTimeout(id)
  }, [autoLoad, isAsync, loaded, runLoad])

  const normalized = useMemo(() => {
    const list = isAsync ? asyncOptions : staticOptions || []
    return list.map((item) => ({
      value: item?.[valueField],
      label: item?.[labelField],
      raw: item,
    }))
  }, [isAsync, asyncOptions, staticOptions, valueField, labelField])

  const selectOptions = useMemo(
    () =>
      normalized.map((item) => ({
        value: item.value,
        label: renderOption ? renderOption(item.raw) : item.label,
        title: String(item.label ?? ''),
      })),
    [normalized, renderOption],
  )

  const handleOpenChange = (open) => {
    if (!open || loadedRef.current) return
    void runLoad('')
  }

  const handleSearch = (keyword) => {
    if (!isAsync) return
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void runLoad(keyword)
    }, debounce)
  }

  return (
    <Select
      className={`kit-async-select ${className}`}
      mode={multiple ? 'multiple' : undefined}
      labelInValue={labelInValue}
      value={value}
      onChange={onChange}
      options={selectOptions}
      loading={loading}
      disabled={disabled}
      size={size}
      style={style}
      allowClear={allowClear}
      showSearch={showSearch}
      filterOption={false} // 异步模式下由服务端过滤
      placeholder={placeholder}
      onOpenChange={handleOpenChange}
      onSearch={handleSearch}
      notFoundContent={loading ? <Spin size="small" /> : <div className="kit-async-select__empty">{emptyText}</div>}
    />
  )
}
