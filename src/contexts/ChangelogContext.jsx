import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * 功能版本时间轴上下文
 * - selected: 当前选中的批次（release id）或 'all'（默认全选）
 * - open:     时间轴抽屉是否打开
 * 与 StyleModeContext 同理，属于「Provider + Hook」固定搭配，已在 eslint 豁免清单。
 */
const ChangelogContext = createContext({
  selected: 'all',
  open: false,
  setSelected: () => {},
  openChangelog: () => {},
  closeChangelog: () => {},
})

export function ChangelogProvider({ children }) {
  const [selected, setSelected] = useState('all')
  const [open, setOpen] = useState(false)

  const openChangelog = useCallback((id = 'all') => {
    setSelected(id)
    setOpen(true)
  }, [])
  const closeChangelog = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ selected, open, setSelected, openChangelog, closeChangelog }),
    [selected, open, setSelected, openChangelog, closeChangelog],
  )

  return (
    <ChangelogContext.Provider value={value}>
      {children}
    </ChangelogContext.Provider>
  )
}

export function useChangelog() {
  return useContext(ChangelogContext)
}
