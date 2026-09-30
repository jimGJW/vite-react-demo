import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import {
  type AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators,
  type ValidationErrors, type ValidatorFn,
} from '@angular/forms'
import { ToastService } from '../core/services/toast.service'
import { TagInputComponent, TimelineComponent, type TimelineNode } from '../core/components'
import { createValidator, formatDate, rules } from '../../utils'

/** 自定义校验器：口令强度（官方 ValidatorFn 形态） */
function strongPassword(min = 8): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v = String(ctrl.value ?? '')
    if (v.length < min) return { strongPassword: { reason: `至少 ${min} 位` } }
    if (!/[a-z]/.test(v)) return { strongPassword: { reason: '需含小写字母' } }
    if (!/[A-Z]/.test(v)) return { strongPassword: { reason: '需含大写字母' } }
    if (!/\d/.test(v)) return { strongPassword: { reason: '需含数字' } }
    return null
  }
}

/** 跨字段校验：两次密码一致（挂在 FormGroup 上） */
const passwordMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pwd = group.get('password')?.value
  const confirm = group.get('confirm')?.value
  return pwd && confirm && pwd !== confirm ? { passwordMismatch: true } : null
}

/**
 * Reactive Forms 视图 —— Angular 官方表单体系（响应式表单）
 *
 * 与模板式表单（forms-view）的差别：
 *   模板式：状态在模板里（ngModel），适合简单表单
 *   响应式：状态在组件的 FormGroup 里（TS 可读可测），适合动态/复杂表单
 *
 * 本页演示：FormBuilder 构建嵌套表单、同步/异步校验、FormArray 动态增减、
 * 表单状态订阅（statusChanges/valueChanges）、以及「官方校验 vs 纯函数校验器」对照。
 */
@Component({
  selector: 'app-forms-advanced-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TagInputComponent, TimelineComponent],
  template: `
    <div class="fa">
      <header class="fa__head">
        <h1>响应式表单 · Reactive Forms</h1>
        <p>FormBuilder 嵌套结构 + 同步/自定义校验 + FormArray 动态增删 + 状态订阅 + 纯函数校验器对照</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" class="ng-card">
        <h2>① 项目登记表（嵌套 FormGroup）</h2>
        <p class="ng-desc">
          表单整体状态：<span class="ng-chip" [class]="form.valid ? 'ng-chip ng-chip--ok' : 'ng-chip ng-chip--danger'">
            {{ form.valid ? 'VALID' : 'INVALID' }}
          </span>
          <span class="ng-chip ng-chip--info">{{ form.status }}</span>
          <span class="ng-chip">脏值 {{ form.dirty ? '是' : '否' }}</span>
          <span class="ng-chip">改动次数 {{ changeCount() }}</span>
        </p>

        <div class="fa__grid2">
          <label class="fa__field">
            <span class="fa__label">项目名称 *</span>
            <input class="ng-input" formControlName="name" placeholder="2-20 字" />
            @if (err('name')) { <em class="fa__err">{{ err('name') }}</em> }
          </label>

          <label class="fa__field">
            <span class="fa__label">负责人 *</span>
            <input class="ng-input" formControlName="owner" placeholder="请输入姓名" />
            @if (err('owner')) { <em class="fa__err">{{ err('owner') }}</em> }
          </label>

          <label class="fa__field">
            <span class="fa__label">上线日期 *</span>
            <input class="ng-input" type="date" formControlName="onlineDate" />
            @if (err('onlineDate')) { <em class="fa__err">{{ err('onlineDate') }}</em> }
          </label>

          <label class="fa__field">
            <span class="fa__label">预算（万元）</span>
            <input class="ng-input" type="number" formControlName="budget" />
            @if (err('budget')) { <em class="fa__err">{{ err('budget') }}</em> }
          </label>
        </div>

        <!-- 嵌套：账户信息 -->
        <fieldset formGroupName="account" class="fa__group">
          <legend>账户信息（嵌套 FormGroup + 跨字段校验）</legend>
          <div class="fa__grid2">
            <label class="fa__field">
              <span class="fa__label">邮箱 *</span>
              <input class="ng-input" formControlName="email" placeholder="a@b.com" />
              @if (err('account.email')) { <em class="fa__err">{{ err('account.email') }}</em> }
            </label>
            <label class="fa__field">
              <span class="fa__label">口令 *</span>
              <input class="ng-input" type="password" formControlName="password" placeholder="≥8 位，含大小写与数字" />
              @if (err('account.password')) { <em class="fa__err">{{ err('account.password') }}</em> }
            </label>
            <label class="fa__field">
              <span class="fa__label">确认口令 *</span>
              <input class="ng-input" type="password" formControlName="confirm" />
              @if (form.get('account')?.errors?.['passwordMismatch'] && form.get('account.confirm')?.touched) {
                <em class="fa__err">两次输入不一致</em>
              }
            </label>
            <label class="fa__field">
              <span class="fa__label">团队规模</span>
              <select class="ng-input" formControlName="teamSize">
                @for (t of teamSizes; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </label>
          </div>
        </fieldset>

        <!-- FormArray 动态字段 -->
        <h3 class="fa__h3">② 环境配置（FormArray 动态增删）</h3>
        <div formArrayName="envs">
          @for (g of envs.controls; track $index; let i = $index) {
            <div [formGroupName]="i" class="fa__row">
              <input class="ng-input" formControlName="key" placeholder="配置项，如 API_BASE" />
              <select class="ng-input" formControlName="env" style="max-width: 130px">
                <option value="dev">dev</option>
                <option value="staging">staging</option>
                <option value="prod">prod</option>
              </select>
              <input class="ng-input" formControlName="value" placeholder="值" />
              <label class="fa__ck">
                <input type="checkbox" formControlName="secret" /> 敏感
              </label>
              <button type="button" class="ng-btn ng-btn--danger" (click)="removeEnv(i)">删除</button>
            </div>
          } @empty {
            <p class="ng-desc">还没有配置项，点下面新增。</p>
          }
        </div>
        <button type="button" class="ng-btn" (click)="addEnv()">+ 新增配置项</button>

        <!-- 标签输入（自有组件接进响应式表单） -->
        <h3 class="fa__h3">③ 技术栈（自有组件 + 响应式表单）</h3>
        <ng-tag-input [value]="stackValue()" (valueChange)="onStack($event)" [max]="6" placeholder="回车添加技术栈" />

        <div class="fa__row" style="margin-top: 14px">
          <button class="ng-btn ng-btn--primary" type="submit" [disabled]="form.invalid">提交</button>
          <button class="ng-btn" type="button" (click)="markAll()">标记全部为已触碰</button>
          <button class="ng-btn" type="button" (click)="reset()">重置</button>
          <button class="ng-btn" type="button" (click)="fillDemo()">填充示例数据</button>
          <span class="ng-chip ng-chip--warn">触达字段 {{ touchedCount() }} / {{ totalFields }}</span>
        </div>
      </form>

      <!-- 双轨校验对照 -->
      <section class="ng-card">
        <h2>④ 双轨校验：FormGroup 校验 vs 纯函数 createValidator</h2>
        <p class="ng-desc">
          同一份值跑两套校验：官方 Validators 绑定在控件上（页面能提示到具体控件），
          纯函数校验器（utils/createValidator）不依赖任何框架，可在 Node 里跑单测、也能复用到服务端。
        </p>
        <div class="fa__grid2">
          <div class="fa__panel">
            <div class="fa__panel-title">FormGroup（官方）</div>
            <ul class="fa__list">
              @for (p of officialPairs(); track p.field) {
                <li [class.is-fail]="!p.pass"><b>{{ p.pass ? '✓' : '✗' }}</b> {{ p.field }} — {{ p.msg }}</li>
              }
            </ul>
          </div>
          <div class="fa__panel">
            <div class="fa__panel-title">createValidator（纯函数）</div>
            <ul class="fa__list">
              @for (p of purePairs(); track p.field) {
                <li [class.is-fail]="!p.pass"><b>{{ p.pass ? '✓' : '✗' }}</b> {{ p.field }} — {{ p.msg }}</li>
              }
            </ul>
            <span class="ng-chip" [class]="pureResult().valid ? 'ng-chip ng-chip--ok' : 'ng-chip ng-chip--danger'">
              {{ pureResult().valid ? '全部通过' : '首个错误：' + pureResult().firstError }}
            </span>
          </div>
        </div>
      </section>

      <!-- 提交记录 -->
      <section class="ng-card">
        <h2>⑤ 提交记录</h2>
        <ng-timeline [nodes]="logs()" />
      </section>
    </div>
  `,
  styles: [`
    .fa__head { margin-bottom: 16px; }
    .fa__head h1 { margin: 0 0 4px; font-size: 20px; color: #111827; }
    .fa__head p { margin: 0; font-size: 12.5px; color: #9ca3af; line-height: 1.8; }
    .fa__grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
    .fa__field { display: flex; flex-direction: column; gap: 4px; }
    .fa__label { font-size: 12px; color: #6b7280; }
    .fa__err { font-style: normal; font-size: 11.5px; color: #dc2626; }
    .fa__group { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin: 12px 0; }
    .fa__group legend { font-size: 12.5px; color: #6366f1; padding: 0 6px; }
    .fa__h3 { font-size: 14px; color: #111827; margin: 16px 0 8px; }
    .fa__row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .fa__ck { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: #4b5563; }
    .fa__panel { border: 1px solid #f3f4f6; border-radius: 8px; padding: 12px; background: #fcfdff; }
    .fa__panel-title { font-size: 12.5px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
    .fa__list { list-style: none; margin: 0 0 8px; padding: 0; font-size: 12.5px; color: #4b5563; }
    .fa__list li { padding: 4px 0; border-bottom: 1px dashed #f3f4f6; }
    .fa__list li b { margin-right: 6px; color: #22c55e; }
    .fa__list li.is-fail { color: #b91c1c; }
    .fa__list li.is-fail b { color: #b91c1c; }
  `],
})
export class FormsAdvancedView {
  private readonly fb = inject(FormBuilder)
  private readonly toast = inject(ToastService)

  readonly teamSizes = ['1-5 人', '6-20 人', '21-50 人', '50 人以上']
  readonly totalFields = 8 + 4
  readonly changeCount = signal(0)
  readonly logs = signal<TimelineNode[]>([
    { title: '等待首次提交', desc: '填写表单后点击「提交」', tone: 'primary' },
  ])

  /** FormGroup 嵌套结构（FormBuilder 官方写法） */
  readonly form: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      owner: ['', [Validators.required, Validators.minLength(2)]],
      onlineDate: ['', [Validators.required]],
      budget: [null, [Validators.min(0), Validators.max(100000)]],
      account: this.fb.group(
        {
          email: ['', [Validators.required, Validators.email]],
          password: ['', [Validators.required, strongPassword(8)]],
          confirm: ['', [Validators.required]],
          teamSize: ['1-5 人'],
        },
        { validators: passwordMatch },
      ),
      envs: this.fb.array([this.makeEnv('API_BASE', 'dev', 'https://dev.example.com', false)]),
    },
    { updateOn: 'change' },
  )

  readonly stack = signal<string[]>(['Angular', 'Signals'])
  readonly stackValue = computed(() => this.stack())

  /**
   * 表单值的 signal 镜像：`computed` 只对 signal 依赖敏感，
   * 直接读 `form.getRawValue()` 不会触发重算 —— 所以订阅 valueChanges 写进 signal。
   */
  readonly formValue = signal<Record<string, unknown>>(this.form.getRawValue() as Record<string, unknown>)

  /** 纯函数校验器（与官方表单并行），规则与 FormGroup 对齐 */
  private readonly pureValidate = createValidator({
    name: [rules.required('项目名称'), rules.minLen(2, '项目名称'), rules.maxLen(20, '项目名称')],
    owner: [rules.required('负责人')],
    onlineDate: [rules.required('上线日期')],
    email: [rules.required('邮箱'), rules.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, '邮箱格式不正确')],
    password: [rules.minLen(8, '口令')],
  })

  constructor() {
    // 订阅表单值变化（官方 valueChanges）：累计改动次数 + 刷新 signal 镜像（供 computed 派生）
    this.form.valueChanges.subscribe(() => {
      this.changeCount.update((n) => n + 1)
      this.formValue.set(this.form.getRawValue() as Record<string, unknown>)
    })
    this.form.statusChanges.subscribe(() => {
      this.formValue.set(this.form.getRawValue() as Record<string, unknown>)
    })
  }

  /* —— FormArray —— */
  private makeEnv(key: string, env: string, value: string, secret: boolean) {
    return this.fb.group({
      key: [key, [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
      env: [env],
      value: [value, [Validators.required]],
      secret: [secret],
    })
  }
  get envs(): FormArray {
    return this.form.get('envs') as FormArray
  }
  addEnv() {
    this.envs.push(this.makeEnv(`NEW_KEY_${this.envs.length + 1}`, 'dev', '', false))
    this.toast.info(`已新增配置项，共 ${this.envs.length} 条`)
  }
  removeEnv(i: number) {
    this.envs.removeAt(i)
    this.toast.warn(`已删除第 ${i + 1} 条配置`)
  }

  /* —— 标签输入回写（注意 model() 双向绑定需要写回 signal） —— */
  onStack(next: string[]) {
    this.stack.set(next)
    // 同步进表单（用 hidden 控件承载，便于统一提交）
    this.form.get('owner')?.markAsDirty()
  }

  /* —— 错误信息 —— */
  err(path: string): string {
    const ctrl = this.form.get(path)
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return ''
    const e = ctrl.errors as Record<string, unknown>
    if (e['required']) return '必填'
    if (e['email']) return '邮箱格式不正确'
    if (e['minlength']) return `至少 ${(e['minlength'] as { requiredLength: number }).requiredLength} 个字符`
    if (e['maxlength']) return `最多 ${(e['maxlength'] as { requiredLength: number }).requiredLength} 个字符`
    if (e['min']) return `不能小于 ${(e['min'] as { min: number }).min}`
    if (e['max']) return `不能大于 ${(e['max'] as { max: number }).max}`
    if (e['pattern']) return '格式不正确（仅大写字母/数字/下划线）'
    if (e['strongPassword']) return `口令强度不足：${(e['strongPassword'] as { reason: string }).reason}`
    return '格式不正确'
  }

  /** 触达字段数：读 signal 镜像保证 OnPush 下也会刷新 */
  touchedCount(): number {
    this.formValue()
    let n = 0
    const walk = (c: AbstractControl) => {
      if (c.touched) n += 1
      if (c instanceof FormGroup || c instanceof FormArray) {
        Object.values((c as FormGroup).controls).forEach(walk)
      }
    }
    walk(this.form)
    return n
  }

  /* —— 双轨对照 —— */
  private readonly values = computed<Record<string, unknown>>(() => {
    const v = this.formValue() as Record<string, { email?: string; password?: string } | string>
    const account = (v['account'] || {}) as { email?: string; password?: string }
    return {
      name: v['name'],
      owner: v['owner'],
      onlineDate: v['onlineDate'],
      email: account.email,
      password: account.password,
    }
  })

  readonly officialPairs = computed(() => {
    this.formValue()
    const c = this.form.get('account') as FormGroup
    const rows: { field: string; ctrl: AbstractControl | null }[] = [
      { field: 'name', ctrl: this.form.get('name') },
      { field: 'owner', ctrl: this.form.get('owner') },
      { field: 'onlineDate', ctrl: this.form.get('onlineDate') },
      { field: 'email', ctrl: c.get('email') },
      { field: 'password', ctrl: c.get('password') },
    ]
    return rows.map((r) => ({
      field: r.field,
      pass: r.ctrl?.valid ?? false,
      msg: r.ctrl?.valid ? '通过' : this.plainErr(r.ctrl),
    }))
  })

  readonly pureResult = computed(() => this.pureValidate(this.values() as never))
  readonly purePairs = computed(() => {
    const k = this.values()
    return Object.keys(k).map((field) => {
      const msg = (this.pureResult().errors as Record<string, string>)[field]
      return { field, pass: !msg, msg: msg || '通过' }
    })
  })

  private plainErr(ctrl: AbstractControl | null): string {
    if (!ctrl) return '—'
    const e = (ctrl.errors || {}) as Record<string, unknown>
    const k = Object.keys(e)[0]
    return k ? k : '—'
  }

  /* —— 操作 —— */
  markAll() {
    this.form.markAllAsTouched()
    this.toast.info('已把全部字段标记为「已触碰」，错误提示将全部展示')
  }

  reset() {
    this.form.reset({
      name: '', owner: '', onlineDate: '', budget: null,
      account: { email: '', password: '', confirm: '', teamSize: '1-5 人' },
    })
    // FormArray 单独重置：reset() 传 undefined 会让 FormArray 抛错
    this.envs.clear()
    this.envs.push(this.makeEnv('API_BASE', 'dev', 'https://dev.example.com', false))
    this.stack.set([])
    this.changeCount.set(0)
    this.formValue.set(this.form.getRawValue() as Record<string, unknown>)
    this.logs.set([{ title: '已重置表单', time: formatDate(new Date(), 'HH:mm:ss'), tone: 'warn' }])
    this.toast.info('表单已重置')
  }

  fillDemo() {
    this.form.patchValue({
      name: '房间监控平台',
      owner: 'gujiawei',
      onlineDate: formatDate(new Date(), 'YYYY-MM-DD'),
      budget: 128,
      account: { email: 'dev@example.com', password: 'Angular2026', confirm: 'Angular2026' },
    })
    this.envs.clear()
    this.envs.push(this.makeEnv('API_BASE', 'prod', 'https://api.example.com', false))
    this.envs.push(this.makeEnv('API_TOKEN', 'prod', 's3cr3t-token', true))
    this.stack.set(['Angular', 'Signals', 'RxJS', 'qiankun'])
    this.toast.success('已填充示例数据')
  }

  submit() {
    this.form.markAllAsTouched()
    if (this.form.invalid) {
      this.toast.error('表单校验未通过，请检查标红字段')
      return
    }
    const raw = this.form.getRawValue()
    const at = formatDate(new Date(), 'HH:mm:ss')
    this.logs.update((l) => [
      {
        title: `提交成功 · ${raw.name}`,
        time: at,
        desc: `${raw.owner} / ${raw.account.email} / 配置项 ${this.envs.length} 个 / 技术栈 ${this.stack().length} 个`,
        tone: 'ok',
      },
      ...l,
    ])
    this.toast.success('提交成功')
  }
}
