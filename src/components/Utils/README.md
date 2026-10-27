# Utils —— 通用工具唯一真源

零依赖的纯函数与 React Hooks 集合（从存量项目按出现频次筛选、去业务化重写），是**全站新增通用函数的唯一收口处**——不要在页面/组件里散落第二份（历史上 `clamp` 曾重复过 11 处）。

## 目录结构（28 个文件 = 19 纯函数域 + 9 Hook 域）

| 类别 | 文件 | 职责（代表函数） |
| --- | --- | --- |
| 数组 | `array.js` | `chunk` / `range` / `shuffle` / `sample` / `move` |
| 集合 | `collection.js` | `difference` / `intersection` / `union` / `compact` / `countBy` / `sumBy` |
| 异步 | `async.js` | `debounce` / `throttle`（带 cancel/flush）/ `sleep` / `retry` |
| 对象 | `objectPath.js` | `arrayToObject` / `groupBy` / `unique` / `sortBy` / `flatten` / `deepClone` / `deepMerge` / `isEmpty` / `pick` / `omit` / `safeJsonParse` |
| 树 | `tree.js` | `treeToArray` / `arrayToTree` / `findTreeNode` |
| 日期 | `date.js` / `dateExtra.js` | `formatDate` / `formatRelativeTime` / `diffDays` / `addDays` / `weekdayOf` / `isLeapYear` |
| 数字 | `number.js` | `sum` / `avg` / `median` / `inRange` / `roundTo` / `percentOf` / `formatDuration` |
| 格式化脱敏 | `format.js` | `formatThousands` / `formatFileSize` / `formatPercent` / `mask`（手机号打码） |
| 字符串 | `string.js` | 常用字符串处理 |
| 颜色 | `color.js` | `colorFromString` / `contrastColor` |
| 校验 | `validate.js` | 常用校验器 |
| DOM | `dom.js` | `scrollToBottom` / `preloadImages` / `classNames` |
| 下载 | `download.js` | `exportCsv`（带 BOM，Excel 中文不乱码）/ `downloadBlob` / `downloadUrl` |
| URL | `url.js` | `parseQuery` / `stringifyQuery` |
| 存储 | `storage.js` | 带过期时间的 `setStorage` 等 |
| 环境 | `env.js` | `isMobile` / `isIOS` / `isAndroid` / `isWeixin` 等 UA 判断 |
| Hooks | `useFreq.js`（`useDebounce`/`useThrottle`）· `useStorage.js` · `useBrowser.js`（`useOnline`/`useMediaQuery`）· `useDom.js`（`useSize`/`useHover`/`useClickOutside`）· `useStateKit.js`（`useToggle`/`useCounter`）· `useWatermark.js`（**MutationObserver 防删除**）· `useTiming.js` · `useEventKit.js` |

> 完整 API 以各文件导出为准；`index.js` 统一 `export *`，`utils.js` / `hooks.js` 仅是转发层。

## 使用

```js
import { debounce, formatDate, exportCsv, useWatermark } from '@components/Utils'
// 或相对路径 import { debounce } from '../Utils'
```

## 约定

- **零依赖**：纯函数不依赖 React / DOM，可直接 node 跑断言（`tests/unit/utils.test.mjs` / `utils-extra.test.mjs`）
- **React 19 红线**：Hook 的 ref 由调用方创建后传入；不在 effect 里同步 setState；定时器统一清理
- **样式零耦合**：所有 CSS 变量带 fallback，复制到其他项目可直接用
- 新增通用函数**一律放这里**并补单测，别在业务目录里定义
