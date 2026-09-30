import { Component, inject, signal, computed } from '@angular/core'
import { Injectable } from '@angular/core'
import { CommonModule, DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common'

/**
 * LoggerService —— 演示 Angular 依赖注入（app 级 Provider，见 app.config.ts）
 * 用 signal 存日志列表，跨视图切换后日志保留
 */
@Injectable()
export class LoggerService {
  messages = signal<string[]>([])
  log(msg: string) {
    this.messages.update((list) => [...list, msg])
  }
}

/**
 * 服务与管道视图 —— 官方 DI（inject）+ 内置管道
 */
@Component({
  selector: 'app-services-view',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, CurrencyPipe],
  template: `
    <!-- 依赖注入 -->
    <section class="ng-card">
      <h2>依赖注入 (Dependency Injection)</h2>
      <p class="ng-desc">inject() 函数式注入 app 级 LoggerService，切换视图日志不丢失</p>
      <div class="di-demo">
        <div class="di-actions">
          <button class="ng-btn ng-btn--primary" (click)="logCount()">记录一条日志</button>
          <button class="ng-btn ng-btn--danger" (click)="clear()">清空日志</button>
        </div>
        <ul class="log-list">
          @for (msg of logger.messages(); track $index) {
            <li>{{ msg }}</li>
          } @empty {
            <li class="ng-desc">暂无日志，点上面的按钮试试</li>
          }
        </ul>
      </div>
    </section>

    <!-- 管道 -->
    <section class="ng-card">
      <h2>内置管道 (Pipes)</h2>
      <p class="ng-desc">date / number / currency 管道组合，Signal 状态直接作为管道输入</p>
      <table class="pipe-table">
        <thead>
          <tr><th>表达式</th><th>输出</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>now | date: 'yyyy-MM-dd HH:mm:ss'</td>
            <td>{{ now | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
          </tr>
          <tr>
            <td>price | number: '1.2-2'</td>
            <td>{{ price | number: '1.2-2' }}</td>
          </tr>
          <tr>
            <td>price | currency: 'CNY' : 'symbol' : '1.0-0'</td>
            <td>{{ price | currency: 'CNY' : 'symbol' : '1.0-0' }}</td>
          </tr>
          <tr>
            <td>ratio() | number: '1.1-1'（computed 派生）</td>
            <td>{{ ratio() | number: '1.1-1' }}%</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Signals 小结 -->
    <section class="ng-card">
      <h2>Signals 状态速览</h2>
      <p class="ng-desc">signal / computed / update —— Angular 16+ 官方响应式方案</p>
      <div class="signal-demo">
        <button class="ng-btn ng-btn--primary" (click)="bump()">点击 +7</button>
        <span class="counter-value">{{ total() }}</span>
        <span class="counter-double">占比 {{ ratio() | number: '1.1-1' }}%（目标 1000）</span>
      </div>
    </section>
  `,
})
export class ServicesView {
  logger = inject(LoggerService)

  now = new Date()
  price = 1280.5
  total = signal(0)
  ratio = computed(() => Math.min(100, (this.total() / 1000) * 100))

  bump() {
    this.total.update((v) => v + 7)
  }
  logCount() {
    this.logger.log(`[${new Date().toLocaleTimeString()}] 记录一条日志（累计 +${this.total()}）`)
  }
  clear() {
    this.logger.messages.set([])
  }
}
