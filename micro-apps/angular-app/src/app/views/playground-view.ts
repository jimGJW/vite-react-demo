import {
  ChangeDetectionStrategy, Component, ElementRef, type OnDestroy, afterNextRender,
  computed, effect, signal, viewChild,
} from '@angular/core'
import { DEMOS, DEMO_GROUPS } from '../../creative/index'

/**
 * 创意 Playground（Angular 版）
 *
 * 全部 demo 的实现在 `src/creative/`（每 demo 一文件、按分组分目录）
 * —— 从主应用的同名目录经 `scripts/sync-creative-demos.mjs` 整体镜像而来（纯 canvas、零框架依赖）。
 * 本视图只做：选 demo、挂 canvas、跑 rAF、把控件事件转发进去。
 *
 * 三端薄壳对照（同一件事的三种写法）：
 *   React   ：实例挂 useRef，useEffect 依赖 [demo, nonce] 重建，HUD 用 data-live + querySelectorAll 直写
 *   Vue     ：实例挂普通变量，watch([active, nonce]) 重建，HUD 用 template ref 直写 textContent
 *   Angular ：实例挂私有字段，effect() 读 signal 重建，HUD 用 viewChild 直写 textContent
 *
 * 渲染约定：HUD（FPS / 指针）逐帧直写 DOM，**不经过模板绑定** ——
 * 逐帧 set 一个 signal 会让 OnPush 组件被 60fps 重渲染，模板函数调用的代价比 Vue/React 更贵。
 * 面板上的 active / paused / values 只在用户真的操作时才变，走 signal 没问题。
 *
 * ⚠️ Angular 模板三条老坑（AOT 构建与 tsc 都不查，只有运行时才炸）：
 *   ① 模板文本里的裸 @ 必须写 &#64;（@if/@for 是控制流关键字）
 *   ② @for 的集合是 signal 时必须显式调用：`@for (p of demo().params; ...)`
 *   ③ 模板表达式拿不到全局 Math —— 需要就用组件方法包一层
 *
 * `data-pg="*"` 是**跨三端统一的探针选择器**（三份薄壳的 DOM 结构、类名、属性完全一致），
 * 让 `scripts/playground-probe.mjs` 一套选择器就能跑完三端。
 * 注：静态属性用 data-pg="..."，动态值用 [attr.data-demo-id] / [attr.data-param-key]。
 */

type DemoParam = { key: string; label: string; min: number; max: number; step: number; value: number }
type DemoAction = { key: string; label: string }
type DemoInstance = {
  resize(w: number, h: number): void
  frame(ts: number, dt: number): void
  pointer(kind: string, x: number, y: number): void
  setParam(key: string, value: number): void
  action(key: string): void
  destroy(): void
}
type Demo = {
  id: string
  title: string
  tag: string
  desc: string
  bg: string
  params: DemoParam[]
  actions: DemoAction[]
  create(ctx: CanvasRenderingContext2D): DemoInstance
}

/** 同步过来的文件是纯 JS，这里补一份形状声明，模板与字段才有类型 */
const DEMO_LIST = DEMOS as unknown as Demo[]

type RawGroup = { label: string; hint: string; from: number; to: number }
const RAW_GROUPS = DEMO_GROUPS as unknown as RawGroup[]

/**
 * 分组表 → 手风琴所需的「组 + 组内条目」。分组是连续区间，所以按下标切片即可。
 * 纯模块级常量（不依赖任何 signal），模板直接 @for 遍历。
 */
const GROUP_LIST = RAW_GROUPS.map((g) => ({
  label: g.label,
  hint: g.hint,
  count: g.to - g.from + 1,
  items: DEMO_LIST.slice(g.from, g.to + 1).map((d, k) => ({ d, i: g.from + k })),
}))

/** 下标 → 所属分组序号（用于「选中某 demo 时顺手展开它所在的组」） */
const GROUP_OF = DEMO_LIST.map((_, i) => RAW_GROUPS.findIndex((g) => i >= g.from && i <= g.to))

/** 取某个 demo 声明的参数默认值 */
function defaultsFor(index: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const p of DEMO_LIST[index]?.params ?? []) out[p.key] = p.value
  return out
}

@Component({
  selector: 'app-playground-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pg">
      <header class="pg-head">
        <h1>创意 Playground</h1>
        <p>
          {{ DEMOS.length }} 个算法型 demo —— 流场、元胞自动机、密度波、混沌、数值解、脉冲耦合、
          分形、优化…… 按主题分成 {{ GROUPS.length }} 组，左栏是手风琴，一次只展开一组。
          实现在 <code>src/creative/</code>（纯 canvas、不含任何框架 API，每 demo 一文件），
          由 <code>scripts/sync-creative-demos.mjs</code> 从主应用同步而来，只维护一份真相。
        </p>
      </header>

      <div class="pg-body">
        <!-- 左：手风琴分组卡片（收起用 [hidden]，DOM 里始终保留全部 demo 项） -->
        <aside class="pg-list">
          <div class="pg-list__head">
            <span>全部 demo</span><em>{{ DEMOS.length }} 个 · {{ GROUPS.length }} 组</em>
          </div>
          @for (g of GROUPS; track g.label; let gi = $index) {
            <section class="pg-acc" [class.is-open]="gi === openGroup()">
              <button
                type="button"
                class="pg-acc__head"
                data-pg="group"
                [attr.data-group-label]="g.label"
                [attr.data-group-index]="gi"
                [attr.data-group-open]="gi === openGroup() ? '1' : '0'"
                [attr.aria-expanded]="gi === openGroup()"
                (click)="toggleGroup(gi)"
              >
                <span class="pg-acc__chev" aria-hidden="true">▶</span>
                <span class="pg-acc__label">{{ g.label }}</span>
                <em class="pg-acc__count">{{ g.count }}</em>
                <i class="pg-acc__hint">{{ g.hint }}</i>
              </button>
              <div class="pg-acc__items" [hidden]="gi !== openGroup()">
                @for (it of g.items; track it.d.id) {
                  <button
                    type="button"
                    class="pg-item"
                    data-pg="demo"
                    [attr.data-demo-id]="it.d.id"
                    [class.is-active]="it.i === active()"
                    (click)="pick(it.i)"
                  >
                    <span class="pg-item__no">{{ pad2(it.i) }}</span>
                    <span class="pg-item__body"><b>{{ it.d.title }}</b><em>{{ it.d.tag }}</em></span>
                  </button>
                }
              </div>
            </section>
          }
        </aside>

        <!-- 右：舞台 + 控件 + 说明 -->
        <section class="pg-stage">
          <div class="pg-toolbar">
            <b class="pg-toolbar__title" data-pg="title">{{ demo().title }}</b>
            <span class="pg-tag">{{ demo().tag }}</span>
            <span class="pg-spacer"></span>
            <button type="button" class="pg-btn" data-pg="pause" [class.is-on]="paused()" (click)="togglePause()">
              {{ paused() ? '继续' : '暂停' }}
            </button>
            <button type="button" class="pg-btn" data-pg="restart" (click)="restart()">重开</button>
          </div>

          <div class="pg-canvas-wrap" [style.background]="demo().bg">
            <canvas
              #stage
              class="pg-canvas"
              data-pg="canvas"
              (pointerdown)="onPointer('down', $event)"
              (pointermove)="onPointer('move', $event)"
              (pointerup)="onPointer('up', $event)"
              (pointerleave)="onPointer('leave', $event)"
            ></canvas>
            <div class="pg-hud">
              <span><i>FPS</i><b #fpsEl data-pg="fps">—</b></span>
              <span><i>指针</i><b #ptrEl data-pg="ptr">—</b></span>
            </div>
            @if (paused()) { <span class="pg-paused">已暂停</span> }
          </div>

          <div class="pg-controls">
            @if (demo().params.length === 0) {
              <span class="pg-controls__empty">此 demo 无可调参数，直接在画布上交互</span>
            }
            @for (p of demo().params; track p.key) {
              <label class="pg-param" data-pg="param" [attr.data-param-key]="p.key">
                <span class="pg-param__label">{{ p.label }}</span>
                <input
                  type="range"
                  [min]="p.min"
                  [max]="p.max"
                  [step]="p.step"
                  [value]="values()[p.key]"
                  (input)="onParam(p.key, $event)"
                />
                <b class="pg-param__val">{{ values()[p.key] }}</b>
              </label>
            }
            @if (demo().actions.length > 0) { <span class="pg-sep"></span> }
            @for (a of demo().actions; track a.key) {
              <button
                type="button"
                class="pg-btn pg-btn--act"
                data-pg="act"
                [attr.data-act-key]="a.key"
                (click)="onAction(a.key)"
              >{{ a.label }}</button>
            }
          </div>

          <p class="pg-desc">{{ demo().desc }}</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    /* 颜色沿用子应用既有色板（见 orbit-lab-view.ts）；画布区是刻意的深色例外 */
    .pg { padding: 18px 22px 44px; }
    .pg-head h1 { margin: 0 0 4px; font-size: 20px; color: #1f2d3d; }
    .pg-head p { margin: 0 0 16px; max-width: 900px; font-size: 12.5px; color: #8a929f; line-height: 1.85; }
    .pg-head code { font-size: 11.5px; background: #f2f4f7; border-radius: 4px; padding: 1px 5px; }

    .pg-body { display: grid; grid-template-columns: 236px minmax(0, 1fr); gap: 14px; align-items: start; }

    .pg-list {
      border: 1px solid #e4e7ed; border-radius: 10px; padding: 8px;
      background: #fff; max-height: 660px; overflow: auto;
    }
    .pg-list__head {
      display: flex; align-items: baseline; justify-content: space-between;
      padding: 4px 8px 8px; margin-bottom: 6px; font-size: 12px;
      color: #8a929f; border-bottom: 1px solid #f0f2f5;
    }
    .pg-list__head em { font-style: normal; font-weight: 600; color: #dd0031; }

    /* 手风琴分组卡片：82 个条目平铺会滚到天边，折起来左栏高度才稳。
       同一时刻只展开一张（openGroup 保证），收起走 [hidden] 而不是 @if ——
       [data-pg="demo"] 必须始终是全集，探针拿它当结构断言。 */
    .pg-acc {
      border: 1px solid #f0f2f5; border-radius: 8px; margin-bottom: 4px;
      background: #fff; overflow: hidden;
    }
    .pg-acc.is-open {
      border-color: #dd0031;
      box-shadow: 0 0 0 1px rgba(221, 0, 49, 0.12);
    }

    /* 卡片头就是折叠开关：整条可点，键盘/读屏靠 aria-expanded 传达状态 */
    .pg-acc__head {
      display: flex; align-items: baseline; gap: 6px; width: 100%;
      padding: 8px 8px 7px; border: 0; background: transparent;
      font: inherit; color: inherit; text-align: left; cursor: pointer;
      transition: background 0.15s;
    }
    .pg-acc__head:hover { background: #f7f8fa; }

    .pg-acc__chev {
      flex: 0 0 auto; font-size: 9px; line-height: 1; color: #c0c4cc;
      transition: transform 0.18s ease, color 0.18s ease;
    }
    .pg-acc.is-open .pg-acc__chev { transform: rotate(90deg); color: #dd0031; }

    .pg-acc__label {
      font-size: 12px; font-weight: 700; color: #1f2d3d;
      padding-left: 7px; border-left: 3px solid #e4e7ed; line-height: 1.1;
      transition: border-color 0.18s ease;
    }
    .pg-acc.is-open .pg-acc__label { border-left-color: #dd0031; }

    .pg-acc__count {
      flex: 0 0 auto; font-style: normal; font-size: 11px; font-weight: 700;
      color: #8a929f; background: #f2f4f7; border-radius: 999px;
      padding: 0 6px; line-height: 16px;
      transition: background 0.18s ease, color 0.18s ease;
    }
    .pg-acc.is-open .pg-acc__count { color: #b3001f; background: #fdecef; }

    .pg-acc__hint {
      flex: 1 1 auto; font-style: normal; font-size: 11px; color: #8a929f;
      text-align: right; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    }

    .pg-acc__items { padding: 2px 6px 6px; animation: pgAccIn 0.18s ease both; }

    /* 显式写一条：UA 的 [hidden]{display:none} 优先级最低，别让别的规则把它顶掉 */
    .pg-acc__items[hidden] { display: none; }

    @keyframes pgAccIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .pg-item {
      display: flex; align-items: center; gap: 9px; width: 100%;
      border: 1px solid transparent; border-radius: 8px; padding: 7px 8px;
      margin-bottom: 2px; text-align: left; cursor: pointer; background: transparent;
      font: inherit; transition: background 0.15s, border-color 0.15s;
    }
    .pg-item:hover { background: #f7f8fa; }
    /* 选中态：实色描边 + 主色序号，与全局导航条的「当前页」信号同一套语言 */
    .pg-item.is-active { border-color: #dd0031; background: rgba(221, 0, 49, 0.06); }
    .pg-item__no { flex: 0 0 20px; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; color: #c0c4cc; }
    .pg-item.is-active .pg-item__no { color: #b3001f; }
    .pg-item__body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .pg-item__body b { font-size: 13px; font-weight: 600; color: #1f2d3d; }
    .pg-item__body em {
      font-style: normal; font-size: 11px; color: #8a929f;
      overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    }

    .pg-stage { min-width: 0; }
    .pg-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-height: 30px; margin-bottom: 10px; }
    .pg-toolbar__title { font-size: 15px; color: #1f2d3d; }
    .pg-tag { padding: 1px 8px; border-radius: 999px; font-size: 11px; color: #b3001f; background: #fdecef; }
    .pg-spacer { flex: 1 1 auto; }

    .pg-canvas-wrap { position: relative; border: 1px solid #e4e7ed; border-radius: 10px; overflow: hidden; aspect-ratio: 16 / 9; min-height: 300px; }
    .pg-canvas { display: block; width: 100%; height: 100%; cursor: crosshair; touch-action: none; }

    .pg-hud {
      position: absolute; top: 8px; right: 10px; display: flex; gap: 12px;
      padding: 3px 9px; border-radius: 999px; font-size: 11px; pointer-events: none;
      color: rgba(255, 255, 255, 0.72); background: rgba(6, 10, 20, 0.55); backdrop-filter: blur(3px);
    }
    .pg-hud span { display: inline-flex; align-items: baseline; gap: 5px; }
    .pg-hud i { font-style: normal; color: rgba(255, 255, 255, 0.42); }
    .pg-hud b { font-variant-numeric: tabular-nums; font-weight: 600; color: #7dd3fc; }

    .pg-paused {
      position: absolute; left: 10px; bottom: 10px; padding: 2px 9px;
      border-radius: 999px; font-size: 11px; color: #ffd666; background: rgba(6, 10, 20, 0.6);
    }

    .pg-controls {
      display: flex; align-items: center; flex-wrap: wrap; gap: 10px 16px;
      padding: 12px 14px; margin-top: 12px; border: 1px solid #e4e7ed;
      border-radius: 10px; background: #fff;
    }
    .pg-controls__empty { font-size: 12px; color: #8a929f; }
    .pg-param { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: #606266; }
    .pg-param__label { white-space: nowrap; }
    .pg-param__val { min-width: 38px; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #b3001f; }
    .pg-param input[type='range'] { width: 112px; accent-color: #dd0031; cursor: pointer; }
    .pg-sep { width: 1px; height: 20px; background: #ebeef5; }

    .pg-btn {
      border: 1px solid #dcdfe6; border-radius: 8px; padding: 5px 14px;
      font-size: 12.5px; color: #1f2d3d; background: #fff; cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .pg-btn:hover { border-color: #dd0031; color: #b3001f; background: #fdecef; }
    .pg-btn.is-on { border-color: #52c41a; color: #2e8b5f; background: #eefaf3; }
    .pg-btn--act { color: #b3001f; border-color: rgba(221, 0, 49, 0.3); background: rgba(221, 0, 49, 0.04); }

    .pg-desc {
      margin: 12px 0 0; padding: 12px 14px; border-left: 3px solid #dd0031;
      border-radius: 0 8px 8px 0; font-size: 12.5px; line-height: 1.9;
      color: #8a929f; background: #f7f8fa;
    }

    @media (max-width: 980px) {
      .pg-body { grid-template-columns: minmax(0, 1fr); }
      .pg-list { max-height: 260px; }
      /* 窄屏下卡片头只有一行宽，hint 会跟组名抢位置，优先保组名 */
      .pg-acc__hint { display: none; }
    }
  `],
})
export class PlaygroundView implements OnDestroy {
  private readonly stageRef = viewChild<ElementRef<HTMLCanvasElement>>('stage')
  private readonly fpsRef = viewChild<ElementRef<HTMLElement>>('fpsEl')
  private readonly ptrRef = viewChild<ElementRef<HTMLElement>>('ptrEl')

  readonly DEMOS = DEMO_LIST
  readonly GROUPS = GROUP_LIST
  readonly active = signal(0)
  /** nonce 只用来强制重建实例（「重开」按钮），值本身没有含义 */
  readonly nonce = signal(0)
  readonly paused = signal(false)
  /** 展开的组序号；-1 = 全部收起（手风琴允许「只看目录」） */
  readonly openGroup = signal(0)
  /** values 只驱动控件显示；demo 内部状态由 setParam 命令式维护，不回流 signal */
  readonly values = signal<Record<string, number>>(defaultsFor(0))

  readonly demo = computed(() => DEMO_LIST[this.active()] ?? DEMO_LIST[0])

  /* 逐帧对象全部放私有字段，且都不是 signal —— 不进变更检测，也就没有 60fps 重渲染 */
  private inst: DemoInstance | null = null
  private ctx2d: CanvasRenderingContext2D | null = null
  private rafId = 0
  private last = 0
  private frames = 0
  private hudAt = 0
  private ro: ResizeObserver | null = null
  /** afterNextRender 之前不建实例（那时 #stage 还没进 DOM） */
  private domReady = false

  constructor() {
    effect(() => {
      const index = this.active()
      this.nonce() // 读一下建立依赖，「重开」也走这条重建路径
      if (!this.domReady) return
      this.build(index)
    })

    afterNextRender(() => {
      this.domReady = true
      this.build(this.active())
      this.rafId = requestAnimationFrame(this.frame)

      const el = this.stageRef()?.nativeElement
      if (el && typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.fit())
        this.ro.observe(el)
      } else {
        window.addEventListener('resize', this.onWindowResize)
      }
    })
  }

  /* ==================== 模板调用的小工具 ==================== */

  pad2(n: number) { return String(n + 1).padStart(2, '0') }

  /* ==================== 交互 ==================== */

  pick(index: number) {
    if (index === this.active()) return
    this.active.set(index)
    /* 选中的 demo 可能不在当前展开的那组里（探针会按 index 直接点），顺手把它的组打开 */
    const gi = GROUP_OF[index]
    this.openGroup.set(gi >= 0 ? gi : 0)
    this.paused.set(false)
  }

  /** 点已展开的组 → 收起（只留目录）；点别的组 → 换展开 */
  toggleGroup(gi: number) {
    this.openGroup.set(this.openGroup() === gi ? -1 : gi)
  }

  togglePause() { this.paused.set(!this.paused()) }

  restart() { this.nonce.set(this.nonce() + 1) }

  /** 指针坐标换算成画布内 CSS px 再交给 demo */
  onPointer(kind: string, e: PointerEvent) {
    const el = this.stageRef()?.nativeElement
    if (!el || !this.inst) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    this.inst.pointer(kind, x, y)
    if (kind === 'move') {
      const node = this.ptrRef()?.nativeElement
      if (node) node.textContent = `${Math.round(x)}, ${Math.round(y)}`
    }
  }

  onParam(key: string, e: Event) {
    const value = Number((e.target as HTMLInputElement).value)
    this.values.set({ ...this.values(), [key]: value })
    this.inst?.setParam(key, value)
  }

  onAction(key: string) { this.inst?.action(key) }

  /* ==================== 实例生命周期 ==================== */

  private fit() {
    const el = this.stageRef()?.nativeElement
    if (!el || !this.inst || !this.ctx2d) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = el.clientWidth
    const h = el.clientHeight
    el.width = Math.max(1, Math.round(w * dpr))
    el.height = Math.max(1, Math.round(h * dpr))
    this.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.inst.resize(w, h)
  }

  /** 切 demo / 重开：销毁旧实例，建新的，并把声明里的默认值灌进去 */
  private build(index: number) {
    this.inst?.destroy()
    this.inst = null

    const el = this.stageRef()?.nativeElement
    if (!el) return

    const d = DEMO_LIST[index]
    if (!d) return

    this.ctx2d = el.getContext('2d')
    if (!this.ctx2d) return
    this.inst = d.create(this.ctx2d)

    this.values.set(defaultsFor(index))
    this.fit()
    for (const p of d.params) this.inst.setParam(p.key, p.value)

    this.last = 0
    this.frames = 0
    this.hudAt = 0
    const fps = this.fpsRef()?.nativeElement
    const ptr = this.ptrRef()?.nativeElement
    if (fps) fps.textContent = '—'
    if (ptr) ptr.textContent = '—'
  }

  private readonly frame = (ts: number) => {
    this.rafId = requestAnimationFrame(this.frame)
    const dt = this.last ? Math.min((ts - this.last) / 1000, 0.05) : 0
    this.last = ts
    if (!this.paused() && this.inst) this.inst.frame(ts, dt)

    /* FPS 每 500ms 汇总一次，比瞬时间隔稳得多；直写 DOM，不进变更检测 */
    this.frames += 1
    if (!this.hudAt) this.hudAt = ts
    else if (ts - this.hudAt >= 500) {
      const node = this.fpsRef()?.nativeElement
      if (node) node.textContent = String(Math.round((this.frames * 1000) / (ts - this.hudAt)))
      this.frames = 0
      this.hudAt = ts
    }
  }

  private readonly onWindowResize = () => this.fit()

  ngOnDestroy() {
    cancelAnimationFrame(this.rafId)
    this.ro?.disconnect()
    window.removeEventListener('resize', this.onWindowResize)
    this.inst?.destroy()
    this.inst = null
  }
}
