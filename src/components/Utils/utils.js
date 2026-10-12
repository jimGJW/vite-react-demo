/**
 * 小功能集 Utils —— 纯函数出口。
 *
 * 这里已不再放任何实现：90+ 个纯函数按职责域拆进同目录的子模块
 * （date / async / format / download / collection / tree / url / dom / storage / env / string / number / array / objectPath / dateExtra / color / validate），本文件只做聚合转发。
 *
 * 之所以保留这个文件而不是让调用方逐个改路径：
 *   1. 存量调用点（含单测与 TestCenterDemo 的动态 import）写的都是 './utils.js'；
 *   2. 子模块之间也互相引用（如 array 用 number 的 sum），需要一个稳定的中转。
 * 新代码建议直接从 './index.js' 导入，那里连同 hooks 一起导出。
 */
export * from './date.js'
export * from './async.js'
export * from './format.js'
export * from './download.js'
export * from './collection.js'
export * from './tree.js'
export * from './url.js'
export * from './dom.js'
export * from './storage.js'
export * from './env.js'
export * from './string.js'
export * from './number.js'
export * from './array.js'
export * from './objectPath.js'
export * from './dateExtra.js'
export * from './color.js'
export * from './validate.js'
