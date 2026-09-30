/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 创意 demo 的公共绘制工具 —— 只依赖 Canvas 2D，不依赖任何框架。
 */

/** 统一的深色底。绝大多数 demo 自己声明 `bg`，这个是给「拖尾 / 淡出」用的兜底色 */
export const BG = '#0b1120'

/**
 * 预生成色相色板（`hsla(...)` 字符串数组）。
 *
 * 为什么预生成：逐帧现拼 `hsla(...)` 字符串会产生大量短命字符串，
 * 分桶后每帧只需填一次 canvas 状态，剩下的开销全在几何上。
 */
export const makePalette = (n, s, l, a) => Array.from(
  { length: n },
  (_, i) => `hsla(${Math.round((i / n) * 360)}, ${s}%, ${l}%, ${a})`,
)

/**
 * 固定步长累加器。
 *
 * 物理积分必须用固定 dt —— 直接拿帧间隔积分，掉一帧弹簧/摆就会炸
 * （能量凭空增加，几十帧后飞出画布）。`guard` 是给「切标签页回来」准备的：
 * 那种情况 dt 会被 clamp 到 0.05s，但积压的步数仍然可能很多，不设上限会卡死一帧。
 */
export const makeStepper = (step, run) => {
  let acc = 0
  return (dt) => {
    acc += dt
    let guard = 0
    while (acc >= step && guard < 40) {
      acc -= step
      run(step)
      guard += 1
    }
  }
}

/**
 * 低分辨率离屏缓冲：逐像素算法先把结果写进 `data`，再整体放大贴回主画布。
 *
 * 为什么需要它：逐像素算法在 825×464 上是 38 万次/帧，软件渲染下必掉帧；
 * 缩到 1/3 ~ 1/4（两三万像素）再放大，肉眼看不出差别，帧率差一个数量级。
 */
export const makeFieldBuffer = (scale) => {
  const buf = document.createElement('canvas')
  const bctx = buf.getContext('2d')
  let bw = 2
  let bh = 2
  let img = bctx.createImageData(2, 2)
  return {
    get width() { return bw },
    get height() { return bh },
    get data() { return img.data },
    resize(pw, ph) {
      bw = Math.max(2, Math.floor(pw / scale))
      bh = Math.max(2, Math.floor(ph / scale))
      buf.width = bw
      buf.height = bh
      img = bctx.createImageData(bw, bh)
    },
    blit(ctx, pw, ph) {
      bctx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(buf, 0, 0, bw, bh, 0, 0, pw, ph)
    },
  }
}
