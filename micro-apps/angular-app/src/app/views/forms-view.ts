import { Component, computed, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgClass, NgStyle } from '@angular/common'

/**
 * 表单与指令视图 —— Angular 官方 FormsModule（ngModel 双向绑定）
 * + 内置指令 NgClass/NgStyle + 新控制流 @if/@for
 * v17.2+ 支持 WritableSignal 直接参与双向绑定：[(ngModel)]="name"
 * 与 vue-app 的 v-model、主应用 React 受控组件形成三方对照
 */
@Component({
  selector: 'app-forms-view',
  standalone: true,
  imports: [FormsModule, NgClass, NgStyle],
  template: `
    <div class="page">
      <header>
        <h1>表单与指令</h1>
        <p>FormsModule（ngModel ⇄ signal 双向绑定）+ NgClass/NgStyle + &#64;if/&#64;for 控制流</p>
      </header>

      <section class="card">
        <h3>报名表单（ngModel 双向绑定）</h3>
        <div class="field">
          <label>姓名</label>
          <input class="ipt" [(ngModel)]="name" placeholder="必填，2-10 字" />
        </div>
        <div class="field">
          <label>邮箱</label>
          <input class="ipt" [(ngModel)]="email" placeholder="含 &#64; 即视为合法" />
        </div>
        <div class="field">
          <label>级别</label>
          <select class="ipt sel" [(ngModel)]="level">
            <option value="beginner">入门</option>
            <option value="intermediate">进阶</option>
            <option value="expert">专家</option>
          </select>
        </div>
        <div class="field">
          <label class="chk"><input type="checkbox" [(ngModel)]="agree" /> 我已阅读使用条款</label>
        </div>

        <div class="metrics">
          @if (formValid()) {
            <span class="ok">✓ 可以提交：{{ summary() }}</span>
          } @else {
            <span class="hint">待完善：{{ problems() }}</span>
          }
        </div>
        <button class="btn primary" [disabled]="!formValid()" (click)="submit()">提交</button>
        @if (submitted()) {
          <span class="tag ok">{{ submitted() }}</span>
        }
      </section>

      <section class="card">
        <h3>NgClass / NgStyle 动态样式</h3>
        <div class="metrics">
          <button class="btn" (click)="toggleTheme()">切换主题（NgClass + NgStyle）</button>
        </div>
        <div
          class="color-box"
          [class.dark]="dark()"
          [ngStyle]="{ background: 'hsl(' + (dark() ? 210 : hue()) + ', 60%, ' + (dark() ? 30 : 70) + '%)' }"
        >
          {{ dark() ? '深色' : '浅色' }} · hue {{ dark() ? 210 : hue() }}
        </div>
      </section>

      <section class="card">
        <h3>&#64;for 列表渲染（track + &#64;empty）</h3>
        <ul class="demo-list">
          @for (lang of langs(); track lang.id) {
            <li>
              <span class="tag info">{{ lang.name }}</span>
              <span class="hint">{{ lang.note }}</span>
            </li>
          } @empty {
            <li class="hint">列表为空</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .page { padding: 18px 22px 36px; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    header p { margin: 0 0 14px; color: #8a929f; font-size: 12.5px; }
    .card { border: 1px solid #e3e6eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; background: #fff; }
    .card h3 { margin: 0 0 10px; font-size: 15px; }
    .field { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .field label { width: 46px; font-size: 13px; color: #555; flex-shrink: 0; }
    .ipt { border: 1px solid #d4d7de; border-radius: 6px; padding: 7px 10px; font-size: 13px; width: 260px; outline-color: #dd0031; }
    .ipt.sel { width: 284px; }
    .chk { font-size: 13px; color: #555; }
    .btn { border: 1px solid #d4d7de; border-radius: 6px; background: #fff; padding: 6px 14px; cursor: pointer; font-size: 12.5px; margin-top: 6px; }
    .btn.primary { border-color: #dd0031; color: #dd0031; }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .metrics { border: 1px solid #e3e6eb; border-radius: 6px; padding: 8px 10px; margin-top: 10px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .ok { color: #177a3d; font-size: 12.5px; }
    .hint { color: #8a929f; font-size: 12.5px; }
    .tag { padding: 3px 8px; border-radius: 4px; background: #f0f2f5; color: #444; font-size: 12px; }
    .tag.ok { background: #e8f7ee; color: #177a3d; }
    .tag.info { background: #eef3fd; color: #2b5db8; }
    .color-box { margin-top: 10px; border-radius: 8px; padding: 22px; text-align: center; color: #fff; font-weight: 600; transition: all 0.25s; }
    .color-box.dark { color: #eee; }
    .demo-list { list-style: none; margin: 0; padding: 0; }
    .demo-list li { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px dashed #eee; }
  `],
})
export class FormsView {
  /* —— 表单状态：WritableSignal 直接参与 [(ngModel)] 双向绑定（Angular v17.2+） —— */
  readonly name = signal('')
  readonly email = signal('')
  readonly level = signal('beginner')
  readonly agree = signal(false)
  readonly submitted = signal('')

  readonly formValid = computed(
    () => this.name().length >= 2 && this.name().length <= 10 && this.email().includes('@') && this.agree(),
  )
  readonly problems = computed(() => {
    const out: string[] = []
    if (this.name().length < 2 || this.name().length > 10) out.push('姓名 2-10 字')
    if (!this.email().includes('@')) out.push('邮箱需含 @')
    if (!this.agree()) out.push('勾选条款')
    return out.join('、')
  })
  readonly summary = computed(() => `${this.name()}（${this.level()}）${this.email()}`)

  submit() {
    this.submitted.set(`已提交：${this.name()} / ${this.level()}`)
  }

  /* —— NgClass / NgStyle —— */
  readonly dark = signal(false)
  readonly hue = signal(160)
  toggleTheme() {
    this.dark.update((v) => !v)
    this.hue.update((h) => (h + 47) % 360)
  }

  /* —— @for 列表 —— */
  readonly langs = signal([
    { id: 1, name: 'Angular', note: '注解 + 依赖注入' },
    { id: 2, name: 'React', note: '函数组件 + Hooks' },
    { id: 3, name: 'Vue', note: 'SFC + 组合式 API' },
  ])
}
