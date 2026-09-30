import { ChangeDetectionStrategy, Component, type OnDestroy, type OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs'
import { MockApiService, type CityRow } from '../core/services/mock-api.service'
import { ToastService } from '../core/services/toast.service'
import { PIPES } from '../core/pipes'
import { downloadText, formatDate, paginate, sortBy, toCsv } from '../../utils'

/**
 * Table 视图 —— 数据表格（排序 / 过滤 / 分页 / 多选 / 行内编辑 / 导出 / 触底加载）
 *
 * 官方用法要点：
 * - 过滤关键字走 RxJS `Subject + debounceTime + switchMap`（输入流的标准处理链）
 * - 派生数据全部用 `computed`：过滤 → 排序 → 分页，三层链式派生，不存中间状态
 * - 行内编辑用「快照 + 取消回滚」，保存调用 MockApiService（形态与 HttpClient 一致）
 */
@Component({
  selector: 'app-table-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ...PIPES],
  template: `
    <div class="tv">
      <header class="tv__head">
        <h1>数据表格 · Table</h1>
        <p>排序 / 关键字过滤 / 多选 / 行内编辑 / 分页 / 导出 CSV / 触底加载 —— 派生数据全用 computed 链</p>
      </header>

      <!-- 服务端加载 -->
      <section class="ng-card">
        <h2>① 服务端分页（MockApiService）</h2>
        <p class="ng-desc">
          RxJS <code>switchMap</code> 拉动分页请求；「触底加载」用 <code>(appThrottleScroll)</code> 或滚动事件判定。
        </p>
        <div class="tv__row">
          <button class="ng-btn ng-btn--primary" (click)="loadServer(1)">加载第 1 页</button>
          <button class="ng-btn" (click)="loadServerNext()">加载下一页（触底语义）</button>
          <button class="ng-btn" (click)="resetServer()">清空</button>
          <span class="ng-chip ng-chip--info">已加载 {{ serverRows().length }} / {{ serverTotal() }} 条</span>
          <span class="ng-chip" [class.ng-chip--ok]="serverFinished()">
            {{ serverFinished() ? '没有更多了' : '还有更多' }}
          </span>
          <span class="ng-chip ng-chip--warn">pending {{ api.pending() }}</span>
        </div>
        <ul class="tv__list">
          @for (r of serverRows(); track r.id) {
            <li>
              <span class="tv__name">{{ r.name }}</span>
              <span class="ng-chip" [class]="'ng-chip ng-chip--' + toneOf(r.status)">{{ r.status | statusText }}</span>
              <span class="tv__meta">房间 {{ r.rooms }} · 告警 {{ r.alarms }} · {{ r.owner }}</span>
              <span class="tv__meta">{{ r.updatedAt | relativeTime }}</span>
            </li>
          } @empty {
            <li class="tv__empty">还没加载数据，点上面的按钮</li>
          }
        </ul>
      </section>

      <!-- 本地表格 -->
      <section class="ng-card">
        <h2>② 本地表格：过滤 → 排序 → 分页 三层 computed 派生</h2>
        <div class="tv__row">
          <input
            class="ng-input"
            [ngModel]="keyword()"
            (ngModelChange)="onKeyword($event)"
            placeholder="搜索城市 / 负责人 / 状态（走 RxJS 防抖）"
            style="max-width: 300px"
          />
          <select class="ng-input" [ngModel]="statusFilter()" (ngModelChange)="onStatus($event)" style="max-width: 130px">
            <option value="">全部状态</option>
            <option value="ok">正常</option>
            <option value="alarm">告警</option>
            <option value="offline">离线</option>
          </select>
          <button class="ng-btn" (click)="exportCsv()">导出 CSV（当前筛选结果）</button>
          <button class="ng-btn" (click)="resetTable()">重置</button>
        </div>
        <div class="tv__row">
          <span class="ng-chip ng-chip--info">原始 {{ allRows().length }}</span>
          <span class="ng-chip ng-chip--ok">过滤后 {{ filtered().length }}</span>
          <span class="ng-chip ng-chip--warn">当前页 {{ paged().rows.length }}</span>
          <span class="ng-chip">第 {{ paged().page }} / {{ paged().pageCount }} 页</span>
          <span class="ng-chip">排序 {{ sortKey() || '（无）' }} {{ sortOrder() }}</span>
        </div>

        <table class="tv__table">
          <thead>
            <tr>
              <th class="tv__ck"><input type="checkbox" [checked]="allChecked()" (change)="toggleAll()" /></th>
              <th class="tv__sortable" (click)="toggleSort('name')">
                城市 @if (sortKey() === 'name') { <i>{{ sortOrder() === 'asc' ? '▲' : '▼' }}</i> }
              </th>
              <th class="tv__sortable tv__num" (click)="toggleSort('rooms')">
                房间数 @if (sortKey() === 'rooms') { <i>{{ sortOrder() === 'asc' ? '▲' : '▼' }}</i> }
              </th>
              <th class="tv__sortable tv__num" (click)="toggleSort('alarms')">
                告警 @if (sortKey() === 'alarms') { <i>{{ sortOrder() === 'asc' ? '▲' : '▼' }}</i> }
              </th>
              <th>负责人</th>
              <th>状态</th>
              <th class="tv__sortable" (click)="toggleSort('updatedAt')">
                更新时间 @if (sortKey() === 'updatedAt') { <i>{{ sortOrder() === 'asc' ? '▲' : '▼' }}</i> }
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (row of paged().rows; track row.id) {
              <tr [class.is-selected]="selected().has(row.id)" [class.is-editing]="editingId() === row.id">
                <td class="tv__ck">
                  <input type="checkbox" [checked]="selected().has(row.id)" (change)="toggleRow(row.id)" />
                </td>
                <td>
                  @if (editingId() === row.id) {
                    <input class="ng-input tv__mini" [ngModel]="draft().name" (ngModelChange)="patchDraft({ name: $event })" />
                  } @else {
                    <span class="tv__name">{{ row.name }}</span>
                  }
                </td>
                <td class="tv__num">
                  @if (editingId() === row.id) {
                    <input class="ng-input tv__mini" type="number" [ngModel]="draft().rooms" (ngModelChange)="patchDraft({ rooms: +$event })" />
                  } @else {
                    {{ row.rooms | thousands }}
                  }
                </td>
                <td class="tv__num">
                  <span [class.tv__danger]="row.alarms > 5">{{ row.alarms }}</span>
                </td>
                <td>
                  @if (editingId() === row.id) {
                    <input class="ng-input tv__mini" [ngModel]="draft().owner" (ngModelChange)="patchDraft({ owner: $event })" />
                  } @else {
                    {{ row.owner }}
                  }
                </td>
                <td>
                  <span class="ng-chip" [class]="'ng-chip ng-chip--' + toneOf(row.status)">{{ row.status | statusText }}</span>
                </td>
                <td class="tv__meta">{{ row.updatedAt | relativeTime }}</td>
                <td class="tv__ops">
                  @if (editingId() === row.id) {
                    <button class="ng-btn ng-btn--primary tv__sm" (click)="save(row)">保存</button>
                    <button class="ng-btn tv__sm" (click)="cancel()">取消</button>
                  } @else {
                    <button class="ng-btn tv__sm" (click)="startEdit(row)">编辑</button>
                    <button class="ng-btn ng-btn--danger tv__sm" (click)="remove(row)">删除</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="tv__empty">没有匹配的数据</td></tr>
            }
          </tbody>
        </table>

        <div class="tv__row">
          <button class="ng-btn" [disabled]="paged().page <= 1" (click)="go(-1)">上一页</button>
          <button class="ng-btn" [disabled]="!paged().hasNext" (click)="go(1)">下一页</button>
          <select class="ng-input" [ngModel]="pageSize()" (ngModelChange)="onPageSize($event)" style="max-width: 130px">
            @for (s of [4, 6, 10]; track s) {
              <option [value]="s">每页 {{ s }} 条</option>
            }
          </select>
          @if (selected().size) {
            <button class="ng-btn ng-btn--danger" (click)="batchDisable()">批量置为离线（{{ selected().size }}）</button>
            <button class="ng-btn" (click)="clearSelection()">清空选择</button>
          }
        </div>
      </section>

      <!-- 两步式交互 -->
      <section class="ng-card">
        <h2>③ 两步式交互：先展开明细，再在展开区触发二次确认</h2>
        <p class="ng-desc">展开行懒加载房间明细；危险操作在展开区里走「二次确认」才真正执行。</p>
        <table class="tv__table">
          <thead><tr><th class="tv__ck"></th><th>楼栋</th><th>联系人</th><th>房间数</th><th>状态分布</th></tr></thead>
          <tbody>
            @for (b of buildings; track b.building) {
              <tr>
                <td class="tv__ck">
                  <button class="tv__expand" (click)="toggleExpand(b.building)">
                    {{ expanded() === b.building ? '▾' : '▸' }}
                  </button>
                </td>
                <td class="tv__name">{{ b.building }}</td>
                <td>{{ b.contact }}</td>
                <td class="tv__num">{{ b.rooms.length }}</td>
                <td>
                  <span class="ng-chip ng-chip--ok">正常 {{ countBy(b, 'ok') }}</span>
                  <span class="ng-chip ng-chip--danger">告警 {{ countBy(b, 'alarm') }}</span>
                  <span class="ng-chip">离线 {{ countBy(b, 'offline') }}</span>
                </td>
              </tr>
              @if (expanded() === b.building) {
                <tr class="tv__expandrow">
                  <td colspan="5">
                    <div class="tv__expandbody">
                      @if (expandedLoading()) {
                        <span class="ng-chip ng-chip--info">加载明细中…</span>
                      } @else {
                        <div class="tv__rooms">
                          @for (r of b.rooms; track r.id) {
                            <span class="ng-chip" [class]="'ng-chip ng-chip--' + toneOf(r.status)">{{ r.id }} · {{ r.name }}</span>
                          }
                        </div>
                        @if (confirmTarget() === b.building) {
                          <div class="tv__confirm">
                            <strong>确认停用「{{ b.building }}」？</strong>
                            <span class="ng-chip ng-chip--danger">其下 {{ b.rooms.length }} 个房间将离线</span>
                            <button class="ng-btn ng-btn--danger" (click)="doDisable(b)">确认停用</button>
                            <button class="ng-btn" (click)="confirmTarget.set('')">取消</button>
                          </div>
                        } @else {
                          <div class="tv__ops">
                            <button class="ng-btn ng-btn--primary" (click)="toast.success('已下发同步任务：' + b.building)">
                              同步该楼栋配置
                            </button>
                            <button class="ng-btn ng-btn--danger" (click)="confirmTarget.set(b.building)">停用该楼栋</button>
                          </div>
                        }
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [`
    .tv__head { margin-bottom: 16px; }
    .tv__head h1 { margin: 0 0 4px; font-size: 20px; color: #111827; }
    .tv__head p { margin: 0; font-size: 12.5px; color: #9ca3af; line-height: 1.8; }
    .tv__row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
    .tv__list { list-style: none; margin: 10px 0 0; padding: 0; font-size: 12.5px; color: #4b5563; max-height: 260px; overflow-y: auto; }
    .tv__list li { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px dashed #f3f4f6; }
    .tv__name { font-weight: 600; color: #111827; min-width: 56px; }
    .tv__meta { color: #9ca3af; font-size: 12px; }
    .tv__table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 8px; }
    .tv__table th, .tv__table td { text-align: left; padding: 8px 8px; border-bottom: 1px solid #f3f4f6; }
    .tv__table th { color: #9ca3af; font-weight: 600; font-size: 12px; background: #fafafa; }
    .tv__table th i { font-style: normal; font-size: 9px; color: #6366f1; }
    .tv__sortable { cursor: pointer; user-select: none; }
    .tv__sortable:hover { color: #6366f1; }
    .tv__num { font-variant-numeric: tabular-nums; }
    .tv__danger { color: #dc2626; }
    .tv__ck { width: 34px; }
    .tv__ops { white-space: nowrap; }
    .tv__sm { padding: 3px 9px; font-size: 12px; }
    .tv__mini { padding: 3px 6px; font-size: 12px; }
    .tv__empty { text-align: center; color: #d1d5db; padding: 16px 0; }
    tr.is-selected { background: #f8faff; }
    tr.is-editing { background: #fffbeb; }
    .tv__expand { border: 0; background: none; cursor: pointer; color: #6366f1; font-size: 13px; }
    .tv__expandrow td { background: #fcfdff; }
    .tv__expandbody { padding: 8px 4px 12px; }
    .tv__rooms { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .tv__confirm {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      border: 1px solid #fecaca; background: #fef2f2; border-radius: 8px; padding: 10px 12px;
    }
  `],
})
export class TableView implements OnInit, OnDestroy {
  readonly api = inject(MockApiService)
  readonly toast = inject(ToastService)

  private readonly subs: Subscription[] = []

  /* ===== ① 服务端分页 ===== */
  readonly serverRows = signal<CityRow[]>([])
  readonly serverTotal = signal(0)
  readonly serverFinished = signal(false)
  private serverPage = 0

  /* ===== ② 本地表格 ===== */
  readonly keyword = signal('')
  readonly statusFilter = signal('')
  readonly sortKey = signal('')
  readonly sortOrder = signal<'asc' | 'desc'>('asc')
  readonly page = signal(1)
  readonly pageSize = signal(6)
  readonly selected = signal(new Set<number>())

  private readonly keyword$ = new Subject<string>()

  /**
   * 稳定数据集 —— 必须是 **signal**，不能是普通数组：
   * OnPush + computed 只对 signal 依赖敏感，直接 mutate 普通数组不会触发重渲染。
   */
  readonly allRows = signal<CityRow[]>(Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    name: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '天津', '重庆'][i],
    rooms: 40 + ((i * 17) % 260),
    alarms: (i * 7) % 14,
    owner: ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊'][i % 6],
    status: (['ok', 'alarm', 'offline'] as const)[i % 3],
    updatedAt: new Date(Date.now() - i * 3600_000).toISOString(),
  })))

  readonly filtered = computed(() => {
    const kw = this.keyword().trim().toLowerCase()
    const st = this.statusFilter()
    return this.allRows().filter((r) => {
      if (st && r.status !== st) return false
      if (!kw) return true
      return [r.name, r.owner, r.status].some((v) => String(v).toLowerCase().includes(kw))
    })
  })
  readonly sorted = computed(() => (
    this.sortKey() ? sortBy(this.filtered(), this.sortKey() as keyof CityRow, this.sortOrder()) : this.filtered()
  ))
  readonly paged = computed(() => paginate(this.sorted(), this.page(), this.pageSize()))
  readonly allChecked = computed(() => (
    this.paged().rows.length > 0 && this.paged().rows.every((r) => this.selected().has(r.id))
  ))

  /* ===== 行内编辑（草稿模型：改动先进 draft，点保存才写回 allRows） ===== */
  readonly editingId = signal<number | null>(null)
  readonly draft = signal<Partial<CityRow>>({})

  /* ===== ③ 两步式交互 ===== */
  readonly buildings = Array.from({ length: 3 }).map((_, bi) => ({
    building: `${['A', 'B', 'C'][bi]} 座`,
    contact: ['张伟', '李娜', '王强'][bi],
    rooms: Array.from({ length: 6 + bi * 2 }, (_, i) => ({
      id: `${['A', 'B', 'C'][bi]}-${String(i + 1).padStart(3, '0')}`,
      name: `房${i + 1}`,
      status: (['ok', 'alarm', 'offline'] as const)[(bi + i) % 3],
    })),
  }))
  readonly expanded = signal('')
  readonly expandedLoading = signal(false)
  readonly confirmTarget = signal('')

  constructor() {
    // 关键字输入 → 防抖 350ms → 去重 → 重置到第 1 页（标准输入流处理链）
    this.subs.push(
      this.keyword$
        .pipe(debounceTime(350), distinctUntilChanged())
        .subscribe((kw) => {
          this.keyword.set(kw)
          this.page.set(1)
        }),
    )
  }

  ngOnInit() {
    this.loadServer(1)
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe())
  }

  toneOf(status: string) {
    return status === 'ok' ? 'ok' : status === 'alarm' ? 'danger' : 'info'
  }

  /* ===== ① 服务端 ===== */
  private async loadServer(page: number) {
    const res = await this.api.getCitiesPage(page, 6)
    this.serverPage = page
    this.serverRows.set(page === 1 ? res.items : [...this.serverRows(), ...res.items])
    this.serverTotal.set(res.total)
    this.serverFinished.set(res.finished)
  }
  loadServerNext() {
    if (this.serverFinished()) {
      this.toast.warn('已经没有更多数据了')
      return
    }
    void this.loadServer(this.serverPage + 1)
  }
  resetServer() {
    this.serverRows.set([])
    this.serverTotal.set(0)
    this.serverFinished.set(false)
    this.serverPage = 0
  }

  /* ===== ② 本地 ===== */
  onKeyword(v: string) { this.keyword$.next(v) }
  onStatus(v: string) { this.statusFilter.set(v); this.page.set(1) }
  onPageSize(v: string | number) { this.pageSize.set(Number(v)); this.page.set(1) }
  go(delta: number) { this.page.update((p) => Math.max(1, p + delta)) }
  toggleSort(key: string) {
    if (this.sortKey() === key) this.sortOrder.update((o) => (o === 'asc' ? 'desc' : 'asc'))
    else { this.sortKey.set(key); this.sortOrder.set('asc') }
    this.page.set(1)
  }
  resetTable() {
    this.keyword.set('')
    this.statusFilter.set('')
    this.sortKey.set('')
    this.page.set(1)
    this.selected.set(new Set())
    this.toast.info('已重置筛选条件')
  }
  toggleRow(id: number) {
    this.selected.update((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  /** 清空选择。
   *  注意：模板表达式里不能写 `new Set()`（Angular 解析器只支持表达式子集），
   *  所以这种「构造新对象」的动作必须落在组件方法里。 */
  clearSelection() {
    this.selected.set(new Set<number>())
  }
  toggleAll() {
    const rows = this.paged().rows
    const all = rows.every((r) => this.selected().has(r.id))
    this.selected.update((s) => {
      const next = new Set(s)
      rows.forEach((r) => (all ? next.delete(r.id) : next.add(r.id)))
      return next
    })
  }

  exportCsv() {
    if (!this.filtered().length) {
      this.toast.warn('当前筛选结果为空，无可导出数据')
      return
    }
    const csv = toCsv(this.filtered() as unknown as Record<string, unknown>[], ['id', 'name', 'rooms', 'alarms', 'owner', 'status', 'updatedAt'])
    downloadText(`城市监控-${formatDate(new Date(), 'YYYYMMDD-HHmmss')}.csv`, csv, 'text/csv;charset=utf-8')
    this.toast.success(`已导出 ${this.filtered().length} 条记录`)
  }

  /* ===== 行内编辑 ===== */
  startEdit(row: CityRow) {
    this.draft.set({ name: row.name, rooms: row.rooms, owner: row.owner })
    this.editingId.set(row.id)
  }
  patchDraft(patch: Partial<CityRow>) {
    this.draft.update((d) => ({ ...d, ...patch }))
  }
  async save(row: CityRow) {
    const saved = await this.api.saveCity({ ...row, ...this.draft() })
    this.allRows.update((list) => list.map((r) => (
      r.id === row.id ? { ...saved, id: r.id, updatedAt: new Date().toISOString() } : r
    )))
    this.editingId.set(null)
    this.draft.set({})
    this.toast.success(`已保存「${saved.name}」`)
  }
  cancel() {
    this.editingId.set(null)
    this.draft.set({})
    this.toast.info('已撤销修改')
  }
  async remove(row: CityRow) {
    await this.api.deleteCity(row.id)
    this.allRows.update((list) => list.filter((r) => r.id !== row.id))
    this.selected.update((s) => { const n = new Set(s); n.delete(row.id); return n })
    this.toast.success(`已删除「${row.name}」`)
  }
  batchDisable() {
    const ids = this.selected()
    this.allRows.update((list) => list.map((r) => (
      ids.has(r.id) ? { ...r, status: 'offline' as const, alarms: 0 } : r
    )))
    this.toast.warn(`已把 ${ids.size} 条记录置为离线`)
    this.selected.set(new Set())
  }

  /* ===== ③ 两步式 ===== */
  countBy(b: { rooms: { status: string }[] }, status: string) {
    return b.rooms.filter((r) => r.status === status).length
  }
  toggleExpand(building: string) {
    if (this.expanded() === building) {
      this.expanded.set('')
      return
    }
    this.confirmTarget.set('')
    // 模拟明细懒加载（真实项目这里会调接口）
    this.expandedLoading.set(true)
    this.expanded.set(building)
    setTimeout(() => this.expandedLoading.set(false), 320)
  }
  doDisable(b: { building: string; rooms: unknown[] }) {
    this.confirmTarget.set('')
    this.toast.warn(`已发起停用流程：${b.building}（${b.rooms.length} 个房间）`)
  }
}
