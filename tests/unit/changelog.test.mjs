import { eq, length, ok, deepEq } from './harness.mjs'
import { pickText } from '../../src/i18n/translate.mjs'
import { RELEASES, getRelease, ROUTE_LATEST, ROUTE_RELEASES, TOTAL_CHANGES } from '../../src/components/Changelog/releases.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const LOCALE_DIR = path.join(ROOT, 'src', 'i18n', 'locales')
const LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'th', 'mn', 'bo']
const HAS_CJK = /[一-鿿]/

export default [
  ['批次数量与顺序正确', () => {
    length(RELEASES, 10)
    eq(RELEASES[0].id, 'r1')
    eq(RELEASES[9].id, 'r10')
  }],
  ['getRelease 按 id 查找 / 缺失返回 null', () => {
    eq(pickText(getRelease('r2').title, 'zh-CN'), '核心 API 演示 + 验证体系')
    eq(getRelease('r4').short, '9/30')
    eq(getRelease('r5').short, '10/10')
    eq(getRelease('nope'), null)
  }],
  ['每条 release / change 的 title / desc 双语齐备（zh-CN + en 双稿）', () => {
    for (const r of RELEASES) {
      ok(r.title && typeof r.title === 'object', `release ${r.id} title 未改为双语对象`)
      ok(typeof r.title['zh-CN'] === 'string' && r.title['zh-CN'].length > 0, `release ${r.id} 缺 zh-CN 标题`)
      ok(typeof r.title.en === 'string' && r.title.en.length > 0, `release ${r.id} 缺 en 标题`)
      ok(!HAS_CJK.test(r.title.en), `release ${r.id} en 标题残留中文`)
      ok(r.title.en !== r.title['zh-CN'], `release ${r.id} en 标题未翻译`)
      for (const c of r.changes) {
        ok(c.title && typeof c.title === 'object', `release ${r.id} change 缺双语 title`)
        ok(typeof c.title['zh-CN'] === 'string' && c.title['zh-CN'].length > 0, `release ${r.id} change 缺 zh-CN title`)
        ok(typeof c.title.en === 'string' && c.title.en.length > 0, `release ${r.id} change 缺 en title`)
        ok(!HAS_CJK.test(c.title.en), `release ${r.id} change en 标题残留中文`)
        ok(c.title.en !== c.title['zh-CN'], `release ${r.id} change en 标题未翻译`)
        ok(c.desc && typeof c.desc === 'object', `release ${r.id} change 缺双语 desc`)
        ok(typeof c.desc['zh-CN'] === 'string' && c.desc['zh-CN'].length > 0, `release ${r.id} change 缺 zh-CN desc`)
        ok(typeof c.desc.en === 'string' && c.desc.en.length > 0, `release ${r.id} change 缺 en desc`)
        ok(!HAS_CJK.test(c.desc.en), `release ${r.id} change en desc 残留中文`)
        ok(c.desc.en !== c.desc['zh-CN'], `release ${r.id} change en desc 未翻译`)
      }
    }
  }],
  ['ROUTE_LATEST 路由映射到最新批次（/utils 取 r3，数据看板取 r5）', () => {
    eq(ROUTE_LATEST['/perf-lab'], 'r3')
    eq(ROUTE_LATEST['/kit'], 'r1')
    eq(ROUTE_LATEST['/utils'], 'r3')
    /* r4 的路由：/playground 只在 r4 出现，所以取 r4 */
    eq(ROUTE_LATEST['/playground'], 'r4')
    eq(ROUTE_LATEST['/micro-frontend'], 'r4')
    /* r5 数据看板批次 */
    eq(ROUTE_LATEST['/astro'], 'r5')
    eq(ROUTE_LATEST['/geo'], 'r5')
    eq(ROUTE_LATEST['/agent'], 'r5')
    /* r6 新增台风页签，/ocean 最新批次升级为 r6 */
    eq(ROUTE_LATEST['/ocean'], 'r6')
    /* r7 经纬度检查、r8 城市词典都落在 /timeline，最新批次升级为 r8 */
    eq(ROUTE_LATEST['/timeline'], 'r8')
    eq(ROUTE_LATEST['/honghuang'], 'r8')
    eq(ROUTE_LATEST['/stars'], 'r8')
    /* r9 ChatBot 思考态条 / 输入 / 推荐体验，最新批次升级为 r9 */
    eq(ROUTE_LATEST['/chatbot'], 'r9')
    /* r10 只有 __infra__ 条目（性能优化），不占用任何真实路由，路由映射保持不变 */
    eq(ROUTE_LATEST['/home-missing'] === undefined, true)
  }],
  ['ROUTE_RELEASES 路由归属全部批次（/utils 在 r1、r3）', () => {
    eq(ROUTE_RELEASES['/utils'].includes('r1'), true)
    eq(ROUTE_RELEASES['/utils'].includes('r3'), true)
    deepEq(ROUTE_RELEASES['/perf-lab'], ['r3'])
    deepEq(ROUTE_RELEASES['/orbit'], ['r4'])
    eq(ROUTE_RELEASES['/home-missing'] === undefined, true)
  }],
  ['TOTAL_CHANGES 等于各批次之和（6+2+5+8+7+2+1+5+3+2=41）', () => {
    const sum = RELEASES.reduce((n, r) => n + r.changes.length, 0)
    eq(sum, TOTAL_CHANGES)
    eq(TOTAL_CHANGES, 41)
  }],
  ['每条改动都有必填字段', () => {
    for (const r of RELEASES) {
      for (const c of r.changes) {
        const title = pickText(c.title, 'zh-CN')
        ok(typeof title === 'string' && title.length > 0, `release ${r.id} change 缺 title`)
        ok(typeof c.changedAt === 'string', `release ${r.id} change 缺 changedAt`)
      }
    }
  }],
  ['changelog 命名空间 UI 文案：10 语种齐备、英文真译、占位符保留', () => {
    const base = JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, 'zh-CN', 'changelog.json'), 'utf8'))
    const baseKeys = Object.keys(base)
    length(baseKeys, 7, 'changelog UI 键数')
    for (const lang of LANGS) {
      const j = JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, lang, 'changelog.json'), 'utf8'))
      for (const k of baseKeys) {
        ok(typeof j[k] === 'string' && j[k].trim().length > 0, `${lang}.changelog.${k} 缺失或为空`)
      }
    }
    const zh = base
    const en = JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, 'en', 'changelog.json'), 'utf8'))
    for (const k of baseKeys) {
      ok(!HAS_CJK.test(en[k]), `en.changelog.${k} 残留中文：${en[k]}`)
      ok(en[k] !== zh[k], `en.changelog.${k} 未翻译（与简体相同）`)
    }
    /* 插值占位符跨语种一致：{n} / {date} / {title} 必须保留，否则页面会渲染字面量 */
    for (const lang of LANGS) {
      const j = JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, lang, 'changelog.json'), 'utf8'))
      ok(j.items.includes('{n}'), `${lang}.changelog.items 丢失 {n} 占位符`)
      ok(j.changesCount.includes('{n}'), `${lang}.changelog.changesCount 丢失 {n} 占位符`)
      ok(j.changedAt.includes('{date}'), `${lang}.changelog.changedAt 丢失 {date} 占位符`)
      ok(j.batchTip.includes('{date}') && j.batchTip.includes('{title}'), `${lang}.changelog.batchTip 丢失占位符`)
    }
  }],
]
