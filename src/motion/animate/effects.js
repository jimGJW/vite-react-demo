/* =====================================================================
   Motion · animate.css 纯逻辑层
   ---------------------------------------------------------------------
   把 animate.css 效果清单、速度映射、类名组合抽成「无 JSX / 无 CSS」的
   纯逻辑模块，专门供 Node 单测（tests/unit/motion.test.mjs）直接 import。

   之所以单列本文件：src/motion/animate/index.jsx 同目录引入了
   'animate.css' 与 './animate.scss'，Node 侧无法解析 CSS，单测 import
   它会直接失败。把可纯逻辑校验的部分下沉到这里，既让 <Animate> 组件
   复用，也让测试能锁定「效果分类完整性 / 跨类无重复 / 速度映射 /
   类名组合」这些不变量。
   ===================================================================== */

/* 常用效果清单（用于文档 / 联想，不全量） */
export const ANIMATE_EFFECTS = {
  attention: [
    'bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY',
    'headShake', 'swing', 'wobble', 'jello', 'heartBeat',
  ],
  entrance: [
    'fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight',
    'zoomIn', 'slideInUp', 'slideInLeft', 'slideInRight',
    'flipInX', 'flipInY', 'rotateIn', 'rollIn', 'lightSpeedIn',
  ],
  exit: [
    'fadeOut', 'fadeOutUp', 'fadeOutDown', 'fadeOutLeft', 'fadeOutRight',
    'zoomOut', 'slideOutUp', 'slideOutLeft', 'slideOutRight', 'rotateOut',
  ],
  special: [
    'hinge', 'jackInTheBox', 'rollOut', 'bounceIn', 'bounceInUp',
    'bounceInDown', 'flip', 'tada',
  ],
}

/* 平铺后的全部效果名（去重校验用） */
export const ALL_ANIMATE_EFFECTS = Object.values(ANIMATE_EFFECTS).flat()

/* 速度档位 → animate.css 类名（仅这四档，其它值视为无效） */
export const SPEED_CLASS = {
  slow: 'animate__slow',
  slower: 'animate__slower',
  fast: 'animate__fast',
  faster: 'animate__faster',
}

/**
 * 由入参组合出 animate.css 需要的 className 数组。
 * 与 <Animate> 组件内的拼接逻辑保持单一真源（组件从此处 import）。
 *
 * @param {object} opts
 * @param {string} [opts.name='fadeIn']       效果名（不带 animate__ 前缀）
 * @param {string} [opts.speed]               'slow'|'slower'|'fast'|'faster'，其它值忽略
 * @param {boolean}[opts.infinite=false]      循环播放
 * @param {number} [opts.repeat]              1~3，循环 N 次
 * @returns {string[]} className 数组（不含用户自定义 className）
 */
export function buildAnimateClasses({ name = 'fadeIn', speed, infinite = false, repeat } = {}) {
  const classes = ['animate__animated', `animate__${name}`]
  if (speed && SPEED_CLASS[speed]) classes.push(SPEED_CLASS[speed])
  if (infinite) classes.push('animate__infinite')
  if (repeat && repeat >= 1 && repeat <= 3) classes.push(`animate__repeat-${repeat}`)
  return classes
}
