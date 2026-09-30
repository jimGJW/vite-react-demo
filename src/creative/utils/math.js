/**
 * 创意 demo 的公共数学工具 —— 纯函数、无状态、不碰 DOM。
 *
 * 为什么单独一层：82 个 demo 里钳位、随机、噪声用得极多，而「值噪声 + fbm」
 * 是烟雾、湍流、极光、地形、剖切这几个 demo 共同的地基。
 * 留在各自文件里迟早会演化成「几份略有出入的 fbm」，然后同一个噪声函数在不同 demo 里表现不一致。
 */

export const TAU = Math.PI * 2

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

export const rand = (a, b) => a + Math.random() * (b - a)

/**
 * 值噪声的哈希：把整数格点映射到 [0, 1)。
 *
 * 用的是 `sin` 哈希而不是位运算 —— 在 JS 里它足够均匀，且天然接受浮点输入，
 * 不必先做 `| 0` 取整。同一个 (x, y) 永远得到同一个值，这是噪声可重复的前提。
 */
export const hash2 = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

/**
 * 2D 值噪声：双线性插值 + smoothstep 缓和。
 *
 * 比 simplex/perlin 好懂得多，也够用 —— 要的是「连续、可重复、没有明显格子感」。
 * 纯函数：不持有状态，所以多个 demo、多次 resize 之间不会互相污染。
 */
export const valueNoise = (x, y) => {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}

/**
 * 分形布朗运动：多个倍频叠加，`oct` 越大细节越多（也越贵）。
 *
 * 注意理论上限不到 1（首项 0.5 起、每层折半），需要 0..1 的归一化高度时
 * 得自己乘个系数（地形那几个 demo 用的是 1.9）。
 */
export const fbm = (x, y, oct) => {
  let sum = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < oct; i += 1) {
    sum += valueNoise(x * f, y * f) * amp
    f *= 2
    amp *= 0.5
  }
  return sum
}
