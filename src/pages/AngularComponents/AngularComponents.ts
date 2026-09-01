/**
 * AngularComponents.ts · Angular 22 Standalone Component
 *
 * 展示 Angular 核心能力：模板语法、双向绑定、管道、依赖注入、指令
 * 对标 VueComponents.vue，用纯 Angular + 自定义 CSS 实现
 */
import { Component, signal, computed, inject, Injectable } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CommonModule, UpperCasePipe, DatePipe, DecimalPipe } from '@angular/common'

interface TodoItem {
  id: number
  text: string
  done: boolean
}

/**
 * 内置 LoggerService — 演示 Angular 依赖注入
 * 必须在 AngularComponents 之前定义，否则 class 不会被 hoist
 */
@Injectable()
export class LoggerService {
  messages = signal<string[]>([])
  log(msg: string) {
    this.messages.update((list) => [...list, msg])
  }
}

@Component({
  selector: 'app-angular-components',
  standalone: true,
  imports: [CommonModule, FormsModule, UpperCasePipe, DatePipe, DecimalPipe],
  providers: [LoggerService],
  template: `
    <div class="ng-page">
      <!-- 头部 -->
      <header class="ng-header">
        <h1>Angular 22 组件库展示</h1>
        <p class="ng-subtitle">
          Standalone Component · Signals · Dependency Injection · Pipes
        </p>
        <span class="ng-badge">.ts SFC</span>
      </header>

      <!-- 计数器：Signal + Computed -->
      <section class="ng-card">
        <h2>Signal 计数器</h2>
        <p class="ng-desc">使用 Angular 16+ 的 Signal 响应式系统</p>
        <div class="counter-demo">
          <button class="ng-btn ng-btn--primary" (click)="dec()">-</button>
          <span class="counter-value">{{ count() }}</span>
          <button class="ng-btn ng-btn--primary" (click)="inc()">+</button>
          <span class="counter-double">双倍 = {{ doubled() }}</span>
        </div>
      </section>

      <!-- 双向绑定：ngModel -->
      <section class="ng-card">
        <h2>双向绑定 (ngModel)</h2>
        <p class="ng-desc">FormsModule 的 ngModel 指令实现双向数据流</p>
        <div class="input-demo">
          <input
            class="ng-input"
            [(ngModel)]="name"
            placeholder="输入你的名字…"
          />
          <p class="echo">你好，{{ name || '匿名舰长' }}！</p>
          <p class="echo" *ngIf="name">
            大写：{{ name | uppercase }}
          </p>
        </div>
      </section>

      <!-- 列表渲染：*ngFor + 管道 -->
      <section class="ng-card">
        <h2>列表渲染 (*ngFor + Pipes)</h2>
        <p class="ng-desc">*ngFor 遍历 + uppercase / number 管道</p>
        <ul class="todo-list">
          <li *ngFor="let item of todos(); let i = index" class="todo-item">
            <label class="todo-label">
              <input
                type="checkbox"
                [checked]="item.done"
                (change)="toggle(i)"
              />
              <span [class.done]="item.done">
                #{{ i + 1 }} {{ item.text }}
              </span>
            </label>
            <button class="ng-btn ng-btn--danger" (click)="remove(i)">×</button>
          </li>
        </ul>
        <div class="todo-add">
          <input
            class="ng-input"
            [(ngModel)]="newTodo"
            (keyup.enter)="add()"
            placeholder="添加一条待办…"
          />
          <button class="ng-btn ng-btn--primary" (click)="add()">添加</button>
        </div>
        <p class="stat">已完成：{{ doneCount() }} / {{ todos().length }}</p>
      </section>

      <!-- 条件渲染 + 日期管道 -->
      <section class="ng-card">
        <h2>条件渲染 (*ngIf + Date Pipe)</h2>
        <p class="ng-desc">*ngIf 控制显隐 + date 管道格式化</p>
        <div class="cond-demo">
          <button class="ng-btn" (click)="togglePanel()">
            {{ showPanel() ? '收起' : '展开' }}面板
          </button>
          <div *ngIf="showPanel()" class="panel">
            <p>当前时间：{{ now | date: 'yyyy-MM-dd HH:mm:ss' }}</p>
            <p>价格：{{ price | number: '1.2-2' }} 元</p>
          </div>
        </div>
      </section>

      <!-- 依赖注入 -->
      <section class="ng-card">
        <h2>依赖注入 (Dependency Injection)</h2>
        <p class="ng-desc">inject() 函数式注入 LoggerService</p>
        <div class="di-demo">
          <button class="ng-btn ng-btn--primary" (click)="log()">调用 Logger.log()</button>
          <ul class="log-list">
            <li *ngFor="let msg of logger.messages()">{{ msg }}</li>
          </ul>
        </div>
      </section>

      <!-- 底部信息 -->
      <footer class="ng-footer">
        <p>Angular 22 · Standalone Components · Signals · 无 zone.js (zoneless)</p>
        <p>由 React 通过 mountAngularBridge 挂载 · 真正 .ts SFC 编译</p>
      </footer>
    </div>
  `,
  styles: [
    `
    :host { display: block; width: 100%; }

    .ng-page {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 20px 48px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
    }

    .ng-header { text-align: center; margin-bottom: 32px; position: relative; }
    .ng-header h1 {
      font-size: 28px; font-weight: 700; margin: 0 0 8px;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .ng-subtitle { color: #6b7280; font-size: 14px; margin: 0; }
    .ng-badge {
      display: inline-block; margin-top: 8px; padding: 2px 10px;
      border-radius: 999px; font-size: 11px; font-weight: 600;
      background: #eef2ff; color: #6366f1; border: 1px solid #c7d2fe;
    }

    .ng-card {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 20px 24px; margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .ng-card h2 { font-size: 18px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .ng-desc { font-size: 13px; color: #9ca3af; margin: 0 0 16px; }

    .counter-demo { display: flex; align-items: center; gap: 12px; }
    .counter-value { font-size: 28px; font-weight: 700; color: #6366f1; min-width: 40px; text-align: center; }
    .counter-double { margin-left: 12px; color: #8b5cf6; font-weight: 500; }

    .input-demo { display: flex; flex-direction: column; gap: 8px; }
    .echo { margin: 0; font-size: 15px; }

    .todo-list { list-style: none; padding: 0; margin: 0 0 12px; }
    .todo-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; border-radius: 8px; transition: background 0.15s;
    }
    .todo-item:hover { background: #f9fafb; }
    .todo-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .todo-label .done { text-decoration: line-through; color: #9ca3af; }
    .todo-add { display: flex; gap: 8px; margin-bottom: 8px; }
    .stat { font-size: 13px; color: #6b7280; margin: 4px 0 0; }

    .cond-demo { display: flex; flex-direction: column; gap: 12px; }
    .panel {
      background: #f3f4f6; border-radius: 8px; padding: 12px 16px;
      border: 1px solid #e5e7eb; font-size: 14px;
    }
    .panel p { margin: 4px 0; }

    .di-demo { display: flex; flex-direction: column; gap: 8px; }
    .log-list {
      list-style: none; padding: 0; margin: 0;
      max-height: 120px; overflow-y: auto;
      font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
    }
    .log-list li { padding: 2px 0; color: #6b7280; border-bottom: 1px dashed #f3f4f6; }

    .ng-btn {
      border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 16px;
      font-size: 14px; cursor: pointer; background: #fff; color: #374151;
      transition: all 0.15s;
    }
    .ng-btn:hover { border-color: #6366f1; color: #6366f1; }
    .ng-btn--primary { background: #6366f1; border-color: #6366f1; color: #fff; }
    .ng-btn--primary:hover { background: #4f46e5; border-color: #4f46e5; color: #fff; }
    .ng-btn--danger { background: #fff; border-color: #ef4444; color: #ef4444; padding: 4px 10px; font-size: 13px; }
    .ng-btn--danger:hover { background: #ef4444; color: #fff; }

    .ng-input {
      flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: 14px; outline: none; transition: border-color 0.15s;
    }
    .ng-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

    .ng-footer {
      text-align: center; margin-top: 32px; padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    .ng-footer p { margin: 4px 0; font-size: 12px; color: #9ca3af; }
    `,
  ],
})
export default class AngularComponents {
  // —— Signal 响应式状态 ——
  count = signal(0)
  doubled = computed(() => this.count() * 2)
  showPanel = signal(true)
  todos = signal<TodoItem[]>([
    { id: 1, text: '学习 Angular 22 Standalone', done: true },
    { id: 2, text: 'React + Vue + Angular 三框架共存', done: false },
    { id: 3, text: '体验 Signal 响应式', done: false },
  ])
  doneCount = computed(() => this.todos().filter((t) => t.done).length)

  // —— 非信号状态（ngModel 双向绑定）——
  name = ''
  newTodo = ''
  now = new Date()
  price = 1280.5

  // —— 依赖注入 ——
  logger = inject(LoggerService)

  inc() {
    this.count.update((v) => v + 1)
  }
  dec() {
    this.count.update((v) => v - 1)
  }
  togglePanel() {
    this.showPanel.update((v) => !v)
  }
  add() {
    const text = this.newTodo.trim()
    if (!text) return
    this.todos.update((list) => [
      ...list,
      { id: Date.now(), text, done: false },
    ])
    this.newTodo = ''
  }
  remove(index: number) {
    this.todos.update((list) => list.filter((_, i) => i !== index))
  }
  toggle(index: number) {
    this.todos.update((list) =>
      list.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item,
      ),
    )
  }
  log() {
    this.logger.log(`[${new Date().toLocaleTimeString()}] 计数器 = ${this.count()}`)
  }
}
