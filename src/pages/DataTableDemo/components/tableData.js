import { pickLang } from '@i18n/index.js'

export const STATUS_LIST = [
  {
    key: 'active',
    tone: 'success',
    label: {
      'zh-CN': '正常',
      'zh-TW': '正常',
      en: 'Active',
      ja: '正常',
      ko: '정상',
      de: 'Aktiv',
      fr: 'Actif',
      th: 'ปกติ',
      mn: 'Идэвхтэй',
      bo: 'འགུལ་སྐྱོད།',
    },
  },
  {
    key: 'pending',
    tone: 'warning',
    label: {
      'zh-CN': '待审',
      'zh-TW': '待審',
      en: 'Pending',
      ja: '審査待ち',
      ko: '대기 중',
      de: 'Ausstehend',
      fr: 'En attente',
      th: 'รอดำเนินการ',
      mn: 'Хүлээгдэж буй',
      bo: 'བལྟས་བར།',
    },
  },
  {
    key: 'banned',
    tone: 'danger',
    label: {
      'zh-CN': '禁用',
      'zh-TW': '禁用',
      en: 'Banned',
      ja: '禁止',
      ko: '차단',
      de: 'Gesperrt',
      fr: 'Banni',
      th: 'ถูกแบน',
      mn: 'Хориглосон',
      bo: 'བཀག་འགུལ།',
    },
  },
]
export const STATUS_MAP = Object.fromEntries(STATUS_LIST.map((s) => [s.key, s]))

/** 演示人名（专有名词，不随语种翻译） */
export const NAMES = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二']

/** 部门名（按语种分键） */
export const DEPTS = {
  'zh-CN': ['研发部', '产品部', '设计部', '运营部', '市场部', '财务部', '人事部'],
  'zh-TW': ['研發部', '產品部', '設計部', '運營部', '市場部', '財務部', '人事部'],
  en: ['R&D', 'Product', 'Design', 'Operations', 'Marketing', 'Finance', 'HR'],
  ja: ['開発部', '製品部', 'デザイン部', '運営部', 'マーケティング部', '財務部', '人事部'],
  ko: ['개발팀', '제품팀', '디자인팀', '운영팀', '마케팅팀', '재무팀', '인사팀'],
  de: ['Entwicklung', 'Produkt', 'Design', 'Betrieb', 'Marketing', 'Finanzen', 'Personal'],
  fr: ['R&D', 'Produit', 'Design', 'Opérations', 'Marketing', 'Finance', 'RH'],
  th: ['วิศวกรรม', 'ผลิตภัณฑ์', 'ออกแบบ', 'ปฏิบัติการ', 'การตลาด', 'การเงิน', 'ทรัพยากรบุคคล'],
  mn: ['Хөгжүүлэлт', 'Бүтээгдэхүүн', 'Дизайн', 'Үйл ажиллагаа', 'Маркетинг', 'Санхүү', 'Хүний нөөц'],
  bo: ['གློག་ཤུགས་ཁུལ།', 'རྒས་ཐོན་ཁུལ།', 'འཇར་མཛེད་ཁུལ།', 'བས་བྱེད་ཁུལ།', 'ཁོར་ཡུག་ཁུལ།', 'དངུལ་འབྲེལ་ཁུལ།', 'མི་སྣ་ཁུལ།'],
}

/** 职位名（按语种分键） */
export const ROLES = {
  'zh-CN': ['工程师', '产品经理', '设计师', '运营专员', '主管', '总监'],
  'zh-TW': ['工程師', '產品經理', '設計師', '運營專員', '主管', '總監'],
  en: ['Engineer', 'Product Manager', 'Designer', 'Operations Specialist', 'Supervisor', 'Director'],
  ja: ['エンジニア', 'プロダクトマネージャー', 'デザイナー', '運営スペシャリスト', 'スーパーバイザー', 'ディレクター'],
  ko: ['엔지니어', '프로덕트 매니저', '디자이너', '운영 전문가', '슈퍼바이저', '디렉터'],
  de: ['Ingenieur', 'Produktmanager', 'Designer', 'Betriebsmitarbeiter', 'Supervisor', 'Direktor'],
  fr: ['Ingénieur', 'Chef de produit', 'Designer', 'Chargé des opérations', 'Superviseur', 'Directeur'],
  th: ['วิศวกร', 'ผู้จัดการผลิตภัณฑ์', 'นักออกแบบ', 'ผู้เชี่ยวชาญปฏิบัติการ', 'หัวหน้างาน', 'ผู้อำนวยการ'],
  mn: ['Инженер', 'Бүтээгдэхүүний менежер', 'Дизайнер', 'Үйл ажиллагааны мэргэжилтэн', 'Хянагч', 'Захирал'],
  bo: ['ལག་རྩལ་སློབ་གཉེར་བ།', 'རྒས་ཐོན་དོ་དམ་པ།', 'འཇར་མཛེད་མཁན།', 'བས་བྱེད་ལས་པ།', 'དོ་དམ་མཁན།', 'ཆེ་འགོ་འཛིན།'],
}

/** 生成 50 行演示数据 */
export function makeRows(lang) {
  const depts = pickLang(DEPTS, lang)
  const roles = pickLang(ROLES, lang)
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${i + 1}` : ''),
    age: 22 + (i * 7) % 30,
    email: `user${i + 1}@example.com`,
    dept: depts[i % depts.length],
    role: roles[i % roles.length],
    salary: 8000 + (i * 1234) % 22000,
    status: STATUS_LIST[i % STATUS_LIST.length].key,
    createdAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  }))
}
