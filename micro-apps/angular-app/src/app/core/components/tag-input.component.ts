import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core'

/**
 * TagInputComponent —— 标签输入
 *
 * 官方用法要点：
 * - `model()` 声明式双向绑定：父组件写 `[(value)]="tags"`，子组件内部 `value.set(...)` 即可回写
 *   （等价 Vue 的 defineModel()；这是 Angular 17.2+ 才有的官方双向绑定写法）
 */
@Component({
  selector: 'ng-tag-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-tags" [class.is-focus]="focused()">
      @for (tag of value(); track tag) {
        <span class="ng-tags__item">
          @if ($index === 0) {
            <em class="ng-tags__star">★</em>
          }
          {{ tag }}
          <button type="button" class="ng-tags__close" (click)="remove($index)">×</button>
        </span>
      }
      <input
        class="ng-tags__input"
        [value]="draft()"
        [placeholder]="value().length >= max() ? '已达上限 ' + max() + ' 个' : placeholder()"
        [disabled]="value().length >= max()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
      />
    </div>

    <div class="ng-tags__foot">
      <span class="ng-chip ng-chip--info">已选 {{ value().length }} / {{ max() }}</span>
      @if (tip()) {
        <span class="ng-chip ng-chip--warn">{{ tip() }}</span>
      }
      <button class="ng-btn" type="button" (click)="value.set([])">清空</button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ng-tags {
      display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
      min-height: 36px; padding: 4px 8px;
      border: 1px solid #d1d5db; border-radius: 6px; background: #fff; transition: border-color 0.15s;
    }
    .ng-tags.is-focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12); }
    .ng-tags__item {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 4px 2px 8px; border-radius: 4px;
      background: #eef2ff; color: #6366f1; font-size: 12.5px;
    }
    .ng-tags__star { font-style: normal; font-size: 10px; color: #f59e0b; }
    .ng-tags__close { border: 0; background: none; cursor: pointer; color: #6366f1; font-size: 14px; line-height: 1; padding: 0 2px; }
    .ng-tags__close:hover { color: #ef4444; }
    .ng-tags__input { flex: 1; min-width: 140px; border: 0; outline: none; font-size: 13px; padding: 4px 2px; background: transparent; }
    .ng-tags__foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
  `],
})
export class TagInputComponent {
  /** 官方双向绑定：父组件 [(value)]="tags" */
  readonly value = model<string[]>([])
  readonly max = input(6)
  readonly placeholder = input('输入后回车生成标签')

  readonly draft = signal('')
  readonly focused = signal(false)
  readonly tip = signal('')
  private tipTimer: ReturnType<typeof setTimeout> | null = null

  private flashTip(msg: string) {
    this.tip.set(msg)
    if (this.tipTimer) clearTimeout(this.tipTimer)
    this.tipTimer = setTimeout(() => this.tip.set(''), 1600)
  }

  onInput(e: Event) {
    this.draft.set((e.target as HTMLInputElement).value)
  }

  /** Enter / 逗号 提交；空输入 Backspace 删末尾 */
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
      e.preventDefault()
      this.commit()
      return
    }
    if (e.key === 'Backspace' && !this.draft() && this.value().length) {
      this.remove(this.value().length - 1)
    }
  }

  private commit() {
    const v = this.draft().trim()
    if (!v) return
    if (this.value().includes(v)) {
      this.flashTip(`「${v}」已存在`)
      this.draft.set('')
      return
    }
    if (this.value().length >= this.max()) {
      this.flashTip(`最多 ${this.max()} 个`)
      return
    }
    this.value.update((list) => [...list, v])
    this.draft.set('')
  }

  remove(i: number) {
    this.value.update((list) => list.filter((_, idx) => idx !== i))
  }

  readonly count = computed(() => this.value().length)
}
