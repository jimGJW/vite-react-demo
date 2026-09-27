/* =====================================================================
   Web Worker 封装 + 一组「CPU 密集型」纯函数

   前半部分（fib / sortHuge / crunch）是零依赖纯函数 —— 既能在主线程跑，
   也能被序列化进 Worker 跑，两边对比才有意义。
   后半部分 createWorker 依赖 Worker API，只在浏览器事件里调用，SSR 安全。
   ===================================================================== */

/** 朴素递归斐波那契：纯 CPU 消耗，适合制造可感知的卡顿 */
export function fib(n) {
  const k = Math.floor(n)
  if (k < 2) return k
  return fib(k - 1) + fib(k - 2)
}

/** 生成 + 排序一个乱序大数组，返回其长度（避免把大数组传回主线程） */
export function sortHuge(size) {
  const n = Math.max(1, Math.floor(size))
  const arr = new Array(n)
  for (let i = 0; i < n; i += 1) {
    arr[i] = (n - i) * 37 % 100003
  }
  arr.sort((a, b) => a - b)
  return arr.length
}

/**
 * 综合负载：n 项斐波那契 + 一个 size 长数组排序。
 * 返回值只是「算完了」的凭证，重点在耗时。
 */
export function crunch({ n = 30, size = 200000 } = {}) {
  const a = fib(n)
  const b = sortHuge(size)
  return { a, b }
}

/**
 * 直接把函数源码变成 Worker —— 不新增文件、不用改 vite 配置。
 *
 * 限制（Worker 的固有限制，不是本封装的）：
 *  传入的 fn 必须自包含，不能引用外部闭包变量（源码会被字符串化搬家）。
 *
 * @param {(payload:any)=>any} fn 自包含的纯函数
 * @returns {{ run: (payload:any)=>Promise<any>, terminate: ()=>void }}
 */
export function createWorker(fn) {
  if (typeof fn !== 'function') throw new TypeError('createWorker 需要一个函数')

  const body = `
    self.onmessage = function (e) {
      try {
        var fn = (${fn.toString()});
        var r = fn(e.data);
        self.postMessage({ ok: true, value: r });
      } catch (err) {
        self.postMessage({ ok: false, error: String((err && err.message) || err) });
      }
    };
  `
  const url = URL.createObjectURL(new Blob([body], { type: 'text/javascript' }))
  const worker = new Worker(url)

  return {
    run(payload) {
      return new Promise((resolve, reject) => {
        const onMsg = (e) => {
          cleanup()
          const data = e.data || {}
          if (data.ok) resolve(data.value)
          else reject(new Error(data.error || 'Worker 执行失败'))
        }
        const onErr = (e) => {
          cleanup()
          reject(new Error(e?.message || 'Worker 异常'))
        }
        const cleanup = () => {
          worker.removeEventListener('message', onMsg)
          worker.removeEventListener('error', onErr)
        }
        worker.addEventListener('message', onMsg)
        worker.addEventListener('error', onErr)
        worker.postMessage(payload)
      })
    },
    terminate() {
      worker.terminate()
      URL.revokeObjectURL(url)
    },
  }
}
