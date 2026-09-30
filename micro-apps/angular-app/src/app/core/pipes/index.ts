import { Pipe, type PipeTransform } from '@angular/core'
import { highlight, formatBytes, formatDate, relativeTime, truncate, formatNumber, abbrevNumber } from '../../../utils'

/**
 * 自定义管道（Pipe）—— Angular 官方模板表达式能力
 *
 * 与 Vue 的 `filters`/computed、React 的「渲染时调函数」对照：
 * Angular 管道的价值在于 **纯管道（pure: true）会按输入自动缓存**，
 * 只有输入引用变化才重新执行，模板里可以放心使用。
 */

/** 关键字高亮：复用 utils 的 highlight（内部已转义），配合 [innerHTML] 使用 */
@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  transform(text: string, keyword = '', cls = 'ng-hl'): string {
    return highlight(text, keyword, cls)
  }
}

/** 字节数人性化：1536000 → 1.5 MB */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number, digits = 1): string {
    return formatBytes(bytes, digits)
  }
}

/** 相对时间：时间戳 → 刚刚 / 3 分钟前 / 2 天前 */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | number | Date): string {
    return relativeTime(value)
  }
}

/** 截断 */
@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(text: string, max = 20, suffix = '…'): string {
    return truncate(text, max, suffix)
  }
}

/** 千分位 */
@Pipe({ name: 'thousands' })
export class ThousandsPipe implements PipeTransform {
  transform(n: number, digits = 0): string {
    return formatNumber(n, digits)
  }
}

/** 大数字缩写：12345 → 1.2万 */
@Pipe({ name: 'abbrev' })
export class AbbrevPipe implements PipeTransform {
  transform(n: number, digits = 1): string {
    return abbrevNumber(n, digits)
  }
}

/** 状态中文名：ok → 正常 */
@Pipe({ name: 'statusText' })
export class StatusTextPipe implements PipeTransform {
  private readonly MAP: Record<string, string> = { ok: '正常', alarm: '告警', offline: '离线' }
  transform(status: string): string {
    return this.MAP[status] ?? status
  }
}

/** 日期格式化（演示带参管道） */
@Pipe({ name: 'myDate' })
export class MyDatePipe implements PipeTransform {
  transform(value: string | number | Date, fmt = 'YYYY-MM-DD HH:mm:ss'): string {
    return formatDate(value, fmt)
  }
}

/** 汇总导出：视图里 imports: [...PIPES] 一次拿全 */
export const PIPES = [
  HighlightPipe, FileSizePipe, RelativeTimePipe, TruncatePipe,
  ThousandsPipe, AbbrevPipe, StatusTextPipe, MyDatePipe,
]
