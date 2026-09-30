import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, type OnDestroy,
  afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core'
import { Router } from '@angular/router'
import { copyText, randomInt } from '../../utils'
import { MENU_ITEMS } from '../view-state'

interface Command {
  id: string
  kind: string
  label: string
  hint: string
  keyword: string
  run: () => void
}

/**
 * 创意实验室（Angular 版）
 *
 * 与 vue-app 的 `pages/CreativeLab.vue` 一一对应，用来对照「同一件事在两套框架里怎么写」：
 *   命令面板 · 粒子星轨 · 打字机 · 聚光卡片 · 3D 翻转 · 点击涟漪
 *
 * 全部零第三方依赖：只用 signals / 官方事件绑定 / 原生 canvas 与 DOM API。
 */
@Component({
  selector: 'app-creative-lab-view',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lab">
      <header class="lab-head">
        <h1>创意实验室</h1>
        <p>六个「好看且有用」的交互 demo —— 零第三方依赖，只用 signals 与原生能力</p>
      </header>

      <!-- ① 命令面板 -->
      <section class="lab-card">
        <h3>① 命令面板 <span class="hint">⌘ / Ctrl + K</span></h3>
        <p class="desc">键盘优先的跳转入口：模糊过滤 + ↑↓ 选择 + Enter 执行。路表直接派生命令集。</p>
        <button class="cbtn" (click)="openPalette()">打开命令面板</button>
        <button class="cbtn ghost" (click)="copyCurrent()">复制当前路由</button>
        <span class="metrics">上次执行：{{ lastCommand() || '（还没执行过）' }}</span>
      </section>

      <!-- ② 粒子星轨 -->
      <section class="lab-card">
        <h3>② 粒子星轨 <span class="hint">canvas + rAF</span></h3>
        <p class="desc">鼠标移动即产生引力，粒子被拽向光标又互相弹开。纯 2D canvas。</p>
        <canvas #particleCanvas class="lab-canvas" (pointermove)="onParticleMove($event)"></canvas>
      </section>

      <!-- ③ 打字机 -->
      <section class="lab-card">
        <h3>③ 打字机 <span class="hint">interval + 光标闪烁</span></h3>
        <p class="desc">逐字上屏、到末尾停顿再回删重来。常用于落地页主标题。</p>
        <p class="typewriter">
          <span class="typewriter__text">{{ typed() }}</span><span class="typewriter__caret"></span>
        </p>
        <button class="cbtn" (click)="toggleTypewriter()">{{ typePaused() ? '继续' : '暂停' }}</button>
      </section>

      <!-- ④ 聚光卡片 -->
      <section class="lab-card">
        <h3>④ 聚光卡片 <span class="hint">内联样式 + pointermove</span></h3>
        <p class="desc">光斑位置由 JS 写成内联样式，动画交给合成层，不触发重排。</p>
        <div class="spotlight-row">
          @for (card of spotlights(); track card.title) {
            <div
              class="spotlight"
              (pointermove)="onSpotlight($event, card.title)"
              (pointerleave)="resetSpotlight(card.title)"
            >
              <span
                class="spotlight__glow"
                [style.left.px]="card.x"
                [style.top.px]="card.y"
              ></span>
              <b>{{ card.title }}</b>
              <em>{{ card.desc }}</em>
            </div>
          }
        </div>
      </section>

      <!-- ⑤ 3D 翻转 -->
      <section class="lab-card">
        <h3>⑤ 3D 翻转卡片 <span class="hint">preserve-3d</span></h3>
        <p class="desc">点击翻面。backface-visibility 让背面不参与绘制，比切 DOM 更省。</p>
        <div class="flip-row">
          @for (f of flips(); track f.front) {
            <div class="flip" [class.is-flipped]="f.flipped" (click)="flipIt(f.front)">
              <div class="flip__inner">
                <div class="flip__face flip__face--front">{{ f.front }}</div>
                <div class="flip__face flip__face--back">{{ f.back }}</div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ⑥ 点击涟漪 -->
      <section class="lab-card">
        <h3>⑥ 涟漪按钮 <span class="hint">点击点扩散</span></h3>
        <p class="desc">按点击坐标生成扩散圆，动画结束自动移除节点 —— DOM 不会越点越多。</p>
        <div class="ripple-row">
          @for (n of [1, 2, 3]; track n) {
            <button class="ripple-btn" [class.ripple-btn--2]="n === 2" [class.ripple-btn--3]="n === 3" (click)="spawnRipple($event)">
              点我看涟漪 {{ n }}
            </button>
          }
        </div>
      </section>
    </div>

    <!-- —— 命令面板浮层 —— -->
    @if (paletteOpen()) {
      <div class="palette-mask" (click)="closePalette()">
        <div class="palette" role="dialog" aria-label="命令面板" (click)="$event.stopPropagation()">
          <div class="palette__head">
            <span class="palette__icon">⌘</span>
            <input
              #paletteInput
              class="palette__input"
              placeholder="输入命令：跳转页面 / 复制 / 随机…"
              [value]="query()"
              (input)="onQuery($event)"
              (keydown)="onPaletteKey($event)"
            />
            <span class="palette__count">{{ hits().length }} 项</span>
          </div>
          <ul class="palette__list">
            @for (cmd of hits(); track cmd.id; let i = $index) {
              <li
                class="palette__item"
                [class.is-cursor]="i === cursor()"
                (mouseenter)="cursor.set(i)"
                (click)="runCommand(cmd)"
              >
                <span class="palette__kind">{{ cmd.kind }}</span>
                <span class="palette__label">{{ cmd.label }}</span>
                <span class="palette__path">{{ cmd.hint }}</span>
              </li>
            }
            @if (!hits().length) {
              <li class="palette__empty">没有匹配的命令</li>
            }
          </ul>
        </div>
      </div>
    }
  `,
  styles: [`
    .lab { padding: 18px 22px 44px; }
    .lab-head h1 { margin: 0 0 4px; font-size: 20px; }
    .lab-head p { margin: 0 0 16px; font-size: 12.5px; color: #8a929f; }
    .lab-card { border: 1px solid #e3e6eb; border-radius: 10px; padding: 16px 18px; margin-bottom: 14px; background: #fff; }
    .lab-card h3 { margin: 0 0 6px; font-size: 15px; }
    .hint { margin-left: 6px; font-size: 11px; font-weight: 500; color: #4f46e5; background: #eef2ff; border-radius: 999px; padding: 1px 8px; }
    .desc { margin: 0 0 12px; font-size: 12.5px; color: #8a929f; line-height: 1.7; }
    .metrics { margin-left: 10px; font-size: 12.5px; color: #4b5563; }

    .cbtn { border: 1px solid #d4d7de; border-radius: 8px; background: #6366f1; color: #fff; border-color: #6366f1; padding: 7px 16px; font-size: 13px; cursor: pointer; }
    .cbtn:hover { background: #4f46e5; }
    .cbtn.ghost { background: #fff; color: #4b5563; margin-left: 8px; }
    .cbtn.ghost:hover { border-color: #6366f1; color: #6366f1; }

    .lab-canvas { display: block; width: 100%; height: 220px; border-radius: 10px; background: #0f172a; cursor: crosshair; touch-action: none; }

    .typewriter { margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #4f46e5; min-height: 28px; font-family: 'SF Mono', Monaco, ui-monospace, monospace; }
    .typewriter__caret { display: inline-block; width: 2px; height: 18px; margin-left: 2px; background: #6366f1; vertical-align: -3px; animation: caretBlink 0.9s steps(1) infinite; }
    @keyframes caretBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

    .spotlight-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .spotlight { position: relative; overflow: hidden; flex: 1 1 180px; min-height: 92px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fafbff; padding: 14px 16px; cursor: crosshair; }
    .spotlight__glow { position: absolute; width: 260px; height: 260px; margin: -130px 0 0 -130px; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.30), rgba(99, 102, 241, 0) 68%); transition: left 0.08s linear, top 0.08s linear; }
    .spotlight b { position: relative; display: block; font-size: 13.5px; }
    .spotlight em { position: relative; display: block; margin-top: 4px; font-style: normal; font-size: 12px; color: #8a929f; }

    .flip-row { display: flex; gap: 12px; flex-wrap: wrap; perspective: 900px; }
    .flip { flex: 1 1 170px; height: 92px; cursor: pointer; }
    .flip__inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.55s cubic-bezier(0.34, 1.3, 0.64, 1); }
    .flip.is-flipped .flip__inner { transform: rotateY(180deg); }
    .flip__face { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 13px; font-weight: 600; backface-visibility: hidden; }
    .flip__face--front { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
    .flip__face--back { transform: rotateY(180deg); background: #f5f6ff; color: #4f46e5; border: 1px solid #c7d2fe; }

    .ripple-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .ripple-btn { position: relative; overflow: hidden; border: 0; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; background: #6366f1; transition: transform 0.14s; }
    .ripple-btn--2 { background: #0ea5e9; }
    .ripple-btn--3 { background: #f59e0b; }
    .ripple-btn:active { transform: scale(0.97); }
    /* 涟漪节点由 DOM API 创建，不带组件样式作用域属性（Angular 用 _ngcontent-xxx），
       因此这里是全局选择器写法（组件样式默认不隔离动态节点之外的匹配也成立） */
    :host ::ng-deep .ripple-wave { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.45); pointer-events: none; animation: rippleSpread 0.62s ease-out forwards; }
    @keyframes rippleSpread { from { transform: scale(0); opacity: 0.75; } to { transform: scale(1); opacity: 0; } }

    .palette-mask { position: fixed; inset: 0; z-index: 3000; background: rgba(15, 23, 42, 0.42); display: flex; align-items: flex-start; justify-content: center; padding-top: 12vh; backdrop-filter: blur(2px); }
    .palette { width: min(620px, 92vw); border-radius: 14px; background: #fff; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.32); overflow: hidden; animation: paletteIn 0.18s ease-out; }
    @keyframes paletteIn { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: none; } }
    .palette__head { display: flex; align-items: center; gap: 9px; padding: 12px 14px; border-bottom: 1px solid #eef0f3; }
    .palette__icon { width: 22px; height: 22px; border-radius: 6px; background: #eef2ff; color: #4f46e5; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; }
    .palette__input { flex: 1; border: 0; outline: 0; font-size: 14px; background: transparent; color: #1f2937; }
    .palette__count { font-size: 11px; color: #b6bcc8; white-space: nowrap; }
    .palette__list { list-style: none; margin: 0; padding: 6px; max-height: 46vh; overflow-y: auto; }
    .palette__item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .palette__item.is-cursor { background: #eef2ff; }
    .palette__kind { flex: 0 0 auto; font-size: 10px; padding: 1px 7px; border-radius: 999px; background: #f0f2f5; color: #8a929f; }
    .palette__item.is-cursor .palette__kind { background: #6366f1; color: #fff; }
    .palette__label { flex: 1; }
    .palette__path { font-size: 11px; color: #b6bcc8; font-family: 'SF Mono', Monaco, ui-monospace, monospace; }
    .palette__empty { padding: 18px; text-align: center; font-size: 12.5px; color: #b6bcc8; }
  `],
})
export class CreativeLabView implements OnDestroy {
  private readonly router = inject(Router)

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('particleCanvas')
  private readonly paletteInput = viewChild<ElementRef<HTMLInputElement>>('paletteInput')

  /* ==================== ① 命令面板 ==================== */

  readonly paletteOpen = signal(false)
  readonly query = signal('')
  readonly cursor = signal(0)
  readonly lastCommand = signal('')

  private readonly commands: Command[] = [
    ...MENU_ITEMS.map((i) => ({
      id: `go:${i.path}`,
      kind: '跳转',
      label: i.label,
      hint: i.path,
      keyword: `${i.label} ${i.path} ${i.group}`,
      run: () => { void this.router.navigateByUrl(i.path) },
    })),
    {
      id: 'act:copy-url',
      kind: '动作',
      label: '复制当前页面路径',
      hint: 'clipboard',
      keyword: '复制 copy 路径 url',
      run: () => { void copyText(this.router.url) },
    },
    {
      id: 'act:random',
      kind: '动作',
      label: '随机跳到一个页面',
      hint: 'fun',
      keyword: '随机 random 随便',
      run: () => {
        const target = MENU_ITEMS[randomInt(0, MENU_ITEMS.length - 1)]
        void this.router.navigateByUrl(target.path)
      },
    },
  ]

  /** 模糊匹配：先整体包含，再退化为「子序列」匹配 */
  private fuzzyHit(text: string, q: string): boolean {
    const t = text.toLowerCase()
    if (t.includes(q)) return true
    let i = 0
    for (const ch of t) {
      if (ch === q[i]) i += 1
      if (i >= q.length) return true
    }
    return q.length === 0
  }

  readonly hits = computed(() => {
    const q = this.query().trim().toLowerCase()
    if (!q) return this.commands
    return this.commands.filter((c) => this.fuzzyHit(c.keyword, q) || this.fuzzyHit(c.label, q))
  })

  openPalette() {
    this.query.set('')
    this.cursor.set(0)
    this.paletteOpen.set(true)
  }

  closePalette() {
    this.paletteOpen.set(false)
    this.query.set('')
  }

  onQuery(e: Event) {
    this.query.set((e.target as HTMLInputElement).value)
    this.cursor.set(0)
  }

  onPaletteKey(e: KeyboardEvent) {
    const n = this.hits().length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (n) this.cursor.update((c) => (c + 1) % n)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (n) this.cursor.update((c) => (c - 1 + n) % n)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      this.runCommand(this.hits()[this.cursor()])
    } else if (e.key === 'Escape') {
      this.closePalette()
    }
  }

  runCommand(cmd: Command | undefined) {
    if (!cmd) return
    this.lastCommand.set(`${cmd.kind} · ${cmd.label}`)
    this.closePalette()
    cmd.run()
  }

  copyCurrent() {
    void copyText(this.router.url)
    this.lastCommand.set(`动作 · 复制当前页面路径`)
  }

  /** ⌘/Ctrl + K 唤起，Esc 关闭 */
  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      if (this.paletteOpen()) {
        this.closePalette()
      } else {
        this.openPalette()
        // 打开后聚焦输入框（等本次变更检测把 @if 的内容插进 DOM）
        setTimeout(() => this.paletteInput()?.nativeElement.focus(), 0)
      }
      return
    }
    if (e.key === 'Escape' && this.paletteOpen()) this.closePalette()
  }

  /* ==================== ② 粒子星轨 ==================== */

  private particles: { x: number; y: number; vx: number; vy: number; r: number }[] = []
  private readonly pointer = { x: -999, y: -999 }
  private rafId = 0

  private resizeCanvas() {
    const el = this.canvasRef()?.nativeElement
    if (!el) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    el.width = el.clientWidth * dpr
    el.height = el.clientHeight * dpr
    el.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (!this.particles.length) {
      this.particles = Array.from({ length: 110 }, () => ({
        x: Math.random() * el.clientWidth,
        y: Math.random() * el.clientHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: 1 + Math.random() * 2,
      }))
    }
  }

  onParticleMove(e: PointerEvent) {
    const el = this.canvasRef()?.nativeElement
    if (!el) return
    const rect = el.getBoundingClientRect()
    this.pointer.x = e.clientX - rect.left
    this.pointer.y = e.clientY - rect.top
  }

  private tickParticles = () => {
    const el = this.canvasRef()?.nativeElement
    if (!el) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const w = el.clientWidth
    const h = el.clientHeight
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)

    for (const p of this.particles) {
      const dx = this.pointer.x - p.x
      const dy = this.pointer.y - p.y
      const d2 = Math.max(dx * dx + dy * dy, 400)
      const force = Math.min(3600 / d2, 0.9)
      const d = Math.sqrt(d2)
      p.vx += (dx / d) * force * 0.06
      p.vy += (dy / d) * force * 0.06
      p.vx *= 0.985
      p.vy *= 0.985
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0) p.x += w
      if (p.x > w) p.x -= w
      if (p.y < 0) p.y += h
      if (p.y > h) p.y -= h
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(129, 140, 248, 0.92)'
      ctx.fill()
    }

    const g = ctx.createRadialGradient(this.pointer.x, this.pointer.y, 0, this.pointer.x, this.pointer.y, 60)
    g.addColorStop(0, 'rgba(99, 102, 241, 0.32)')
    g.addColorStop(1, 'rgba(99, 102, 241, 0)')
    ctx.fillStyle = g
    ctx.fillRect(this.pointer.x - 60, this.pointer.y - 60, 120, 120)
    this.rafId = requestAnimationFrame(this.tickParticles)
  }

  /* ==================== ③ 打字机 ==================== */

  private readonly lines = [
    'Angular 22 · Standalone · Signals',
    'utils + 管道 + 指令 + DI 服务',
    '一个宿主页只加载一个子应用',
  ]
  readonly typed = signal('')
  readonly typePaused = signal(false)
  private lineIndex = 0
  private charIndex = 0
  private deleting = false
  private typeTimer: ReturnType<typeof setTimeout> | null = null

  toggleTypewriter() {
    this.typePaused.update((p) => !p)
    if (!this.typePaused()) this.scheduleType(120)
  }

  private scheduleType(delay: number) {
    if (this.typeTimer) clearTimeout(this.typeTimer)
    this.typeTimer = setTimeout(() => this.tickTypewriter(), delay)
  }

  private tickTypewriter() {
    if (this.typePaused()) return
    const line = this.lines[this.lineIndex]
    if (!this.deleting) {
      this.charIndex += 1
      this.typed.set(line.slice(0, this.charIndex))
      if (this.charIndex >= line.length) {
        this.deleting = true
        this.scheduleType(1400)
        return
      }
    } else {
      this.charIndex -= 1
      this.typed.set(line.slice(0, this.charIndex))
      if (this.charIndex <= 0) {
        this.deleting = false
        this.lineIndex = (this.lineIndex + 1) % this.lines.length
      }
    }
    this.scheduleType(this.deleting ? 45 : 90)
  }

  /* ==================== ④ 聚光卡片 ==================== */

  readonly spotlights = signal([
    { title: '指针事件', desc: 'pointermove 同时覆盖鼠标与触控', x: -200, y: -200 },
    { title: '内联样式', desc: '只有两个数在变，不产生布局计算', x: -200, y: -200 },
    { title: '合成层动画', desc: '光斑是渐变层，不阻塞主线程', x: -200, y: -200 },
  ])

  onSpotlight(e: PointerEvent, title: string) {
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    this.spotlights.update((list) => list.map((c) => (c.title === title ? { ...c, x, y } : c)))
  }

  resetSpotlight(title: string) {
    this.spotlights.update((list) => list.map((c) => (c.title === title ? { ...c, x: -200, y: -200 } : c)))
  }

  /* ==================== ⑤ 3D 翻转 ==================== */

  readonly flips = signal([
    { front: '正面 · signals', back: '背面 · computed / effect', flipped: false },
    { front: '正面 · DI', back: '背面 · providedIn root 单例', flipped: false },
    { front: '正面 · Router', back: '背面 · canActivate / resolve', flipped: false },
  ])

  flipIt(front: string) {
    this.flips.update((list) => list.map((f) => (f.front === front ? { ...f, flipped: !f.flipped } : f)))
  }

  /* ==================== ⑥ 涟漪 ==================== */

  spawnRipple(e: MouseEvent) {
    const btn = e.currentTarget as HTMLElement
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const span = document.createElement('span')
    span.className = 'ripple-wave'
    span.style.width = `${size}px`
    span.style.height = `${size}px`
    span.style.left = `${e.clientX - rect.left - size / 2}px`
    span.style.top = `${e.clientY - rect.top - size / 2}px`
    btn.appendChild(span)
    span.addEventListener('animationend', () => span.remove())
  }

  /* ==================== 生命周期 ==================== */

  private ro: ResizeObserver | null = null

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas()
      this.tickParticles()
      this.scheduleType(300)
      const el = this.canvasRef()?.nativeElement
      if (el && typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.resizeCanvas())
        this.ro.observe(el)
      } else {
        window.addEventListener('resize', this.resizeCanvas)
      }
    })
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.rafId)
    if (this.typeTimer) clearTimeout(this.typeTimer)
    this.ro?.disconnect()
    window.removeEventListener('resize', this.resizeCanvas)
  }
}
