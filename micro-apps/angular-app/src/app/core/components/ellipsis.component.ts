import {
  ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, effect, input, signal, viewChild,
} from '@angular/core'

/**
 * EllipsisComponent —— 多行省略 + 自动判断是否需要「展开」
 *
 * 官方用法要点：
 * - `viewChild()` 信号式查询：拿到真实 DOM 引用（替代 @ViewChild + ngAfterViewInit）
 * - `afterNextRender()`：只在浏览器渲染后执行测量，SSR 安全
 * - `effect()` 依赖 text/lines 变化重新测量
 */
@Component({
  selector: 'ng-ellipsis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p #textEl class="ng-ellipsis__text" [class.is-clamped]="!expanded()" [style]="clampStyle()">
      {{ text() }}
    </p>
    @if (overflow()) {
      <button class="ng-ellipsis__toggle" (click)="expanded.update(v => !v)">
        {{ expanded() ? '收起' : '展开' }}
      </button>
    }
  `,
  styles: [`
    :host { display: block; }
    .ng-ellipsis__text { margin: 0; font-size: 13px; line-height: 1.7; color: #4b5563; }
    .ng-ellipsis__text.is-clamped {
      display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;
    }
    .ng-ellipsis__toggle {
      border: 0; background: none; color: #6366f1; font-size: 12.5px; cursor: pointer; padding: 2px 0;
    }
  `],
})
export class EllipsisComponent {
  readonly text = input('')
  readonly lines = input(2)

  readonly expanded = signal(false)
  readonly overflow = signal(false)
  private readonly textEl = viewChild<ElementRef<HTMLElement>>('textEl')

  /** 带厂商前缀的样式键用对象绑定（`[style.-webkit-line-clamp]` 语法非法） */
  readonly clampStyle = computed<Record<string, string>>(() => ({ '-webkit-line-clamp': String(this.lines()) }))

  constructor() {
    afterNextRender(() => this.measure())
    // text / lines 变化后重新测量
    effect(() => {
      this.text()
      this.lines()
      queueMicrotask(() => this.measure())
    })
  }

  /** 截断态 scrollHeight < 完整态 scrollHeight → 说明被省略了 */
  private measure() {
    const el = this.textEl()?.nativeElement
    if (!el) return
    const clamped = el.scrollHeight
    const wasExpanded = this.expanded()
    el.classList.remove('is-clamped')
    const full = el.scrollHeight
    if (!wasExpanded) el.classList.add('is-clamped')
    this.overflow.set(full > clamped + 1)
  }
}
