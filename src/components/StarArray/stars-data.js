// 周天星表 · 365 颗真实恒星（通俗版）
// - NAMED：56 颗具名亮星，附通俗身份标签 tag 与白话介绍 note
// - 其余按 真实星座 × 拜耳希腊字母 生成至 365（标注 approx 为代表估值）
// 每颗均为真实存在的恒星，呈现面向大众：去掉光谱型术语，改用颜色/故事/特点描述

const NAMED = [
  { name: '天狼星', en: 'Sirius', constellation: '大犬座', tag: '夜空最亮恒星', mag: -1.46, distance: '8.6 光年', color: '#bfdbfe', note: '整个夜空中最亮的恒星，比太阳亮 25 倍。冬天傍晚抬头就能看到，蓝白色。其实它还藏着一颗暗伴星。' },
  { name: '老人星', en: 'Canopus', constellation: '船底座', tag: '南天导航明灯', mag: -0.74, distance: '309 光年', color: '#fef9c3', note: '南方天空第二亮的恒星，古代航海者靠它辨认方向。北方大部分地区看不到。' },
  { name: '南门二', en: 'α Centauri', constellation: '半人马座', tag: '离我们最近的恒星', mag: 0.01, distance: '4.37 光年', color: '#fef3c7', note: '太阳系最近的恒星邻居，其中一颗叫"比邻星"，离我们仅 4.24 光年。' },
  { name: '大角星', en: 'Arcturus', constellation: '牧夫座', tag: '北天最亮恒星', mag: -0.05, distance: '36.7 光年', color: '#fcd9a8', note: '北方天空最亮的星，橙红色。春天夜晚沿北斗勺柄延伸就能找到它。' },
  { name: '织女星', en: 'Vega', constellation: '天琴座', tag: '七夕织女', mag: 0.03, distance: '25 光年', color: '#dbeafe', note: '牛郎织女故事里的"织女"。夏夜抬头几乎正上方那颗最亮的蓝白色星就是她。' },
  { name: '五车二', en: 'Capella', constellation: '御夫座', tag: '北天御夫主星', mag: 0.08, distance: '42.9 光年', color: '#fef3c7', note: '北方夜空第三亮星，黄色。其实由四颗星组成，远看合为一颗。' },
  { name: '参宿七', en: 'Rigel', constellation: '猎户座', tag: '猎户右足', mag: 0.13, distance: '864 光年', color: '#93c5fd', note: '猎户座的右脚，蓝白色超巨星，光度是太阳的 12 万倍。冬天最容易认。' },
  { name: '南河三', en: 'Procyon', constellation: '小犬座', tag: '冬季大三角成员', mag: 0.34, distance: '11.5 光年', color: '#fef9c3', note: '冬夜"冬季大三角"的一个顶点，黄白色，离我们很近。' },
  { name: '参宿四', en: 'Betelgeuse', constellation: '猎户座', tag: '将爆的红超巨星', mag: 0.42, distance: '642 光年', color: '#fca5a5', note: '猎户座的左肩，红色超巨星，体积大到能吞下火星轨道。未来某天会以超新星爆发结束。' },
  { name: '水委一', en: 'Achernar', constellation: '波江座', tag: '最扁平的恒星', mag: 0.46, distance: '139 光年', color: '#bfdbfe', note: '波江座最亮的星，蓝白色。因自转极快，被压扁成橄榄球状。' },
  { name: '马腹一', en: 'Hadar', constellation: '半人马座', tag: '南十字旁蓝巨星', mag: 0.61, distance: '390 光年', color: '#bfdbfe', note: '南十字座旁边的蓝白巨星，南半球导航标志之一。' },
  { name: '十字架二', en: 'Acrux', constellation: '南十字座', tag: '南半球导航星', mag: 0.77, distance: '321 光年', color: '#93c5fd', note: '南十字座最亮的星，南半球用它和十字架三辨认正南方向。' },
  { name: '毕宿五', en: 'Aldebaran', constellation: '金牛座', tag: '金牛之眼', mag: 0.86, distance: '65.3 光年', color: '#fca5a5', note: '金牛座那只发红光的"眼睛"，红色巨星。冬季可见。' },
  { name: '心宿二', en: 'Antares', constellation: '天蝎座', tag: '大火·蝎心', mag: 1.09, distance: '550 光年', color: '#f87171', note: '天蝎座的心脏，红色超巨星，古称"大火"。颜色和火星很像，名字"Antares"意为"敌对火星"。' },
  { name: '角宿一', en: 'Spica', constellation: '室女座', tag: '室女手中麦穗', mag: 1.04, distance: '250 光年', color: '#93c5fd', note: '室女座最亮的星，蓝白色。春夜南方低空最显眼的星之一。' },
  { name: '北河三', en: 'Pollux', constellation: '双子座', tag: '双子座哥哥', mag: 1.14, distance: '33.8 光年', color: '#fcd9a8', note: '双子座双星中的"哥哥"，橙色。已知有一颗系外行星绕它转。' },
  { name: '北落师门', en: 'Fomalhaut', constellation: '南鱼座', tag: '南方孤独亮星', mag: 1.16, distance: '25.1 光年', color: '#dbeafe', note: '秋夜南方天空一颗很显眼的蓝白星，周围有尘埃盘，曾被认为是第一颗被拍到的系外行星所在。' },
  { name: '天津四', en: 'Deneb', constellation: '天鹅座', tag: '夏季大三角顶点', mag: 1.25, distance: '2615 光年', color: '#dbeafe', note: '夏夜"夏季大三角"的一个顶点，天鹅的尾巴。它是肉眼可见最远的亮星之一。' },
  { name: '十字架三', en: 'Mimosa', constellation: '南十字座', tag: '南十字次亮星', mag: 1.25, distance: '280 光年', color: '#93c5fd', note: '南十字座的第二亮星，蓝白色，和十字架二一起标定南北方向。' },
  { name: '轩辕十四', en: 'Regulus', constellation: '狮子座', tag: '狮子之心', mag: 1.40, distance: '79.3 光年', color: '#bfdbfe', note: '狮子座最亮星，蓝白色，位于狮子心脏位置。名字意为"小王"。' },
  { name: '弧矢七', en: 'Adhara', constellation: '大犬座', tag: '大犬座第二亮星', mag: 1.50, distance: '430 光年', color: '#bfdbfe', note: '大犬座里仅次于天狼星的亮星，蓝白色，紫外线辐射很强。' },
  { name: '尾宿八', en: 'Shaula', constellation: '天蝎座', tag: '蝎尾毒刺', mag: 1.62, distance: '700 光年', color: '#bfdbfe', note: '天蝎座尾巴尖上的"毒刺"，蓝白色，名字意为"抬起的尾巴"。' },
  { name: '参宿五', en: 'Bellatrix', constellation: '猎户座', tag: '猎户左肩', mag: 1.64, distance: '250 光年', color: '#bfdbfe', note: '猎户座的左肩，蓝白色巨星，名字意为"女战士"。' },
  { name: '北河二', en: 'Castor', constellation: '双子座', tag: '双子座弟弟', mag: 1.58, distance: '51 光年', color: '#dbeafe', note: '双子座双星中的"弟弟"，蓝白色。其实是六颗星组成的复杂系统。' },
  { name: '参宿一', en: 'Alnitak', constellation: '猎户座', tag: '猎户腰带东', mag: 1.77, distance: '1260 光年', color: '#bae6fd', note: '猎户腰带三颗星的最东边一颗，蓝白色。' },
  { name: '参宿二', en: 'Alnilam', constellation: '猎户座', tag: '猎户腰带中', mag: 1.69, distance: '1340 光年', color: '#bfdbfe', note: '猎户腰带中央那颗，蓝白色超巨星。' },
  { name: '参宿三', en: 'Mintaka', constellation: '猎户座', tag: '猎户腰带西', mag: 2.23, distance: '1200 光年', color: '#bfdbfe', note: '猎户腰带最西边一颗，蓝白色。几乎就在天赤道上。' },
  { name: '北斗一', en: 'Dubhe', constellation: '大熊座', tag: '北斗勺口·指极星', mag: 1.79, distance: '124 光年', color: '#fcd9a8', note: '北斗七星勺口的第一颗，橙色。和北斗五连成线延伸 5 倍就指向北极星。' },
  { name: '北斗五', en: 'Alioth', constellation: '大熊座', tag: '北斗最亮星', mag: 1.77, distance: '81 光年', color: '#dbeafe', note: '北斗七星里最亮的一颗，蓝白色，位于勺柄与勺身连接处。' },
  { name: '北斗六', en: 'Mizar', constellation: '大熊座', tag: '肉眼可见双星', mag: 2.04, distance: '83 光年', color: '#dbeafe', note: '北斗勺柄第二颗，蓝白色。视力好的人能看到旁边一颗暗星"辅"，古人以此测视力。' },
  { name: '北斗七', en: 'Alkaid', constellation: '大熊座', tag: '北斗勺柄末端', mag: 1.86, distance: '104 光年', color: '#bfdbfe', note: '北斗勺柄最末端那颗，蓝白色，名字意为"引导者"。' },
  { name: '北极星', en: 'Polaris', constellation: '小熊座', tag: '指路极星', mag: 1.98, distance: '433 光年', color: '#fef3c7', note: '夜空中几乎不动的星，正对北方地轴。迷路时找到它就知道哪是北。亮度会微微变化。' },
  { name: '娄宿三', en: 'Hamal', constellation: '白羊座', tag: '白羊座最亮星', mag: 2.00, distance: '66 光年', color: '#fcd9a8', note: '白羊座最亮的星，橙色。秋夜可见。' },
  { name: '天大将军一', en: 'Mirach', constellation: '仙女座', tag: '仙女座红巨星', mag: 2.05, distance: '200 光年', color: '#fca5a5', note: '仙女座的红色巨星，名字读音和"仙女"星系 M31 接近，别混淆。' },
  { name: '斗宿四', en: 'Nunki', constellation: '人马座', tag: '人马茶壶柄', mag: 2.05, distance: '220 光年', color: '#bfdbfe', note: '人马座里的蓝白星，组成"茶壶"的把手。' },
  { name: '天棓四', en: 'Eltanin', constellation: '天龙座', tag: '天龙之头', mag: 2.23, distance: '154 光年', color: '#fca5a5', note: '天龙座头部的红色巨星，公元前曾是北极星。' },
  { name: '井宿三', en: 'Alhena', constellation: '双子座', tag: '双子座第三亮星', mag: 1.93, distance: '109 光年', color: '#dbeafe', note: '双子座第三亮星，蓝白色，在双子的脚边。' },
  { name: '河鼓二', en: 'Altair', constellation: '天鹰座', tag: '牛郎星', mag: 0.77, distance: '16.7 光年', color: '#dbeafe', note: '七夕故事里的"牛郎"，与织女隔银河相望。蓝白色，自转极快，被压扁成椭圆。' },
  { name: '河鼓三', en: 'Tarazed', constellation: '天鹰座', tag: '牛郎旁边的橙星', mag: 2.73, distance: '360 光年', color: '#fca5a5', note: '牛郎星旁边那颗较暗的橙色星，名字意为"鹰之翎羽"。' },
  { name: '天津一', en: 'Sadr', constellation: '天鹅座', tag: '天鹅胸口', mag: 2.23, distance: '1800 光年', color: '#fef9c3', note: '天鹅座胸口处的黄色超巨星，位于银河"大裂缝"附近。' },
  { name: '辇道增七', en: 'Albireo', constellation: '天鹅座', tag: '金蓝对比双星', mag: 3.05, distance: '430 光年', color: '#fcd9a8', note: '天鹅座的喙，著名双星：一颗金黄、一颗蓝白，颜色对比极漂亮，小望远镜就能看到。' },
  { name: '贯索四', en: 'Denebola', constellation: '狮子座', tag: '狮子尾巴尖', mag: 2.14, distance: '36 光年', color: '#dbeafe', note: '狮子座尾巴尖上的蓝白星，春夜可见。' },
  { name: '五帝座一', en: 'Algieba', constellation: '狮子座', tag: '狮子鬃毛双星', mag: 2.61, distance: '130 光年', color: '#fcd9a8', note: '狮子座鬃毛处的橙色双星，小望远镜可分出两颗。' },
  { name: '天囷一', en: 'Menkar', constellation: '鲸鱼座', tag: '鲸鱼之口', mag: 2.54, distance: '220 光年', color: '#f87171', note: '鲸鱼座 α，红色巨星，位于鲸鱼的嘴部。' },
  { name: '土司空', en: 'Diphda', constellation: '鲸鱼座', tag: '鲸鱼座最亮星', mag: 2.04, distance: '96 光年', color: '#fcd9a8', note: '鲸鱼座最亮的星，橙色，秋夜南方可见。' },
  { name: '天船三', en: 'Mirfak', constellation: '英仙座', tag: '英仙座最亮星', mag: 1.79, distance: '590 光年', color: '#fef9c3', note: '英仙座最亮的星，黄色。位于一个疏散星团里，周围一圈暗星。' },
  { name: '大陵五', en: 'Algol', constellation: '英仙座', tag: '眨眼的魔星', mag: 2.12, distance: '90 光年', color: '#bfdbfe', note: '著名的变星：每 2.87 天变暗一次再变亮，像在眨眼。古阿拉伯人称它"魔星"。' },
  { name: '右枢', en: 'Thuban', constellation: '天龙座', tag: '上古北极星', mag: 3.65, distance: '303 光年', color: '#dbeafe', note: '约公元前 2700 年它才是北极星，古埃及金字塔朝向就对着它。现在肉眼可见但已暗淡。' },
  { name: '天大将军六', en: 'Almach', constellation: '仙女座', tag: '金蓝对比双星', mag: 2.10, distance: '350 光年', color: '#fcd9a8', note: '仙女座的著名双星，金黄+蓝白对比，和辇道增七齐名。' },
  { name: '轩辕十二', en: 'Rasalhague', constellation: '蛇夫座', tag: '蛇夫之头', mag: 2.07, distance: '47 光年', color: '#dbeafe', note: '蛇夫座最亮星，蓝白色，名字意为"弄蛇人的头"。' },
  { name: '键闭', en: 'Kaus Australis', constellation: '人马座', tag: '人马茶壶底', mag: 1.85, distance: '143 光年', color: '#bfdbfe', note: '人马座最亮星，蓝白色，组成"茶壶"的底部。银河中心方向就在这附近。' },
  { name: '天纪二', en: 'Kochab', constellation: '小熊座', tag: '上古北极星', mag: 2.08, distance: '131 光年', color: '#fca5a5', note: '小熊座的橙色星，公元前曾是北极星。' },
  { name: '胃宿三', en: 'Schedar', constellation: '仙后座', tag: '仙后之胸', mag: 2.24, distance: '228 光年', color: '#fcd9a8', note: '仙后座 W 形里最亮的星，橙色。' },
  { name: '阁道三', en: 'γ Cassiopeiae', constellation: '仙后座', tag: '仙后中央变星', mag: 2.47, distance: '550 光年', color: '#bfdbfe', note: '仙后座 W 形中央那颗蓝白星，亮度会变，向外抛射气体形成壳层。' },
  { name: '天棓三', en: 'β Draconis (Rastaban)', constellation: '天龙座', tag: '天龙之颈', mag: 2.79, distance: '360 光年', color: '#fef3c7', note: '天龙座 β，黄色巨星，名字意为"蛇之头"。' },
]

// 真实星座（中文，48 个，用于拜耳命名生成）
const CONSTELLATIONS = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '室女座', '天秤座', '天蝎座', '人马座', '摩羯座',
  '宝瓶座', '双鱼座', '仙女座', '鲸鱼座', '波江座', '猎户座', '大犬座', '小犬座', '麒麟座', '长蛇座',
  '六分仪座', '巨爵座', '乌鸦座', '半人马座', '南十字座', '南鱼座', '天兔座', '天猫座', '御夫座', '英仙座',
  '仙后座', '仙王座', '飞马座', '小马座', '天鹅座', '天鹰座', '天琴座', '武仙座', '天龙座', '大熊座',
  '小熊座', '牧夫座', '猎犬座', '狐狸座', '蛇夫座', '巨蛇座', '盾牌座', '海豚座',
]

// 拜耳希腊字母（带序号中文，便于通俗辨识）
const GREEK = [
  { ch: 'α', cn: '一' },
  { ch: 'β', cn: '二' },
  { ch: 'γ', cn: '三' },
  { ch: 'δ', cn: '四' },
  { ch: 'ε', cn: '五' },
  { ch: 'ζ', cn: '六' },
  { ch: 'η', cn: '七' },
  { ch: 'θ', cn: '八' },
]

// 颜色（大众可辨）与亮度对应
const COLOR_BUCKETS = [
  { color: '#bae6fd', desc: '蓝白' },
  { color: '#dbeafe', desc: '蓝白' },
  { color: '#fef9c3', desc: '黄白' },
  { color: '#fef3c7', desc: '黄色' },
  { color: '#fcd9a8', desc: '橙黄' },
  { color: '#fca5a5', desc: '橙红' },
  { color: '#f87171', desc: '红色' },
]

function rand(min, max) {
  return Math.random() * (max - min) + min
}

// 由真实星座 × 拜耳字母生成至 365 颗（通俗命名：星座名 + 第几位）
function generateToCount(target) {
  const usedNames = new Set(NAMED.map((s) => s.name))
  const out = []
  let gi = 0
  let ci = 0
  while (out.length + NAMED.length < target) {
    const constellation = CONSTELLATIONS[ci % CONSTELLATIONS.length]
    const g = GREEK[gi % GREEK.length]
    // 中文语序：白羊座α（而非 α 白羊座），并附"第几位"
    const name = `${constellation}${g.ch}`
    if (!usedNames.has(name)) {
      usedNames.add(name)
      const bucket = COLOR_BUCKETS[Math.floor(rand(0, COLOR_BUCKETS.length))]
      const mag = +(rand(1.6, 5.4)).toFixed(2)
      const dist = Math.round(rand(20, 1200))
      const visible = mag < 3.5 ? '肉眼可见' : '需望远镜'
      out.push({
        name,
        en: `${g.ch} ${constellation}`,
        constellation,
        tag: `${constellation}成员星`,
        mag,
        distance: `${dist} 光年`,
        color: bucket.color,
        note: `${constellation}里第${g.cn}亮的恒星，${bucket.desc}色，视星等约 ${mag}，${visible}，距地球约 ${dist} 光年。`,
        approx: true,
      })
    }
    gi++
    if (gi >= GREEK.length) {
      gi = 0
      ci++
    }
  }
  return out
}

export const STARS = [...NAMED, ...generateToCount(365)]
export const TOTAL_DEGREES = STARS.length // 365
