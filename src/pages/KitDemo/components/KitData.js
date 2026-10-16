/* KitDemo 模拟数据与工具函数，从 index.jsx 拆出
 * ---------------------------------------------------------------------
 * 文案字段统一按语种分键 { '<lang>': text }（README 数据文件模式），
 * 消费方用下方 pick() 取值：obj[lang] || obj['zh-CN']。
 * 本文件不 import i18n（locales/index.js 依赖 import.meta.glob，node 单测跑不了），
 * 纯函数形态保证任何环境都能直接引用。 */

/** 按语种取数据对象的文案值，缺语种落简体 */
const pick = (obj, lang) => obj?.[lang] || obj?.['zh-CN'] || ''

export const DEVICES = [
  {
    id: 'SRV-001',
    name: {
      'zh-CN': '应用服务器 A', 'zh-TW': '應用伺服器 A', en: 'Application Server A',
      ja: 'アプリケーションサーバー A', ko: '애플리케이션 서버 A', de: 'Anwendungsserver A',
      fr: "Serveur d'applications A", th: 'เซิร์ฟเวอร์แอป A', mn: 'Аппликейшн сервер A',
      bo: 'ཉེར་སྤྱོད་ཞབས་འཁོར་ཆས A',
    },
    dept: {
      'zh-CN': '机房', 'zh-TW': '機房', en: 'Data Center', ja: 'データセンター',
      ko: '데이터센터', de: 'Rechenzentrum', fr: 'Centre de données', th: 'ดาต้าเซ็นเตอร์',
      mn: 'Дата төв', bo: 'གྲོགས་འཕྲུལ་ཁང་།',
    },
    py: 'ying yong fu wu qi a',
  },
  {
    id: 'SRV-002',
    name: {
      'zh-CN': '应用服务器 B', 'zh-TW': '應用伺服器 B', en: 'Application Server B',
      ja: 'アプリケーションサーバー B', ko: '애플리케이션 서버 B', de: 'Anwendungsserver B',
      fr: "Serveur d'applications B", th: 'เซิร์ฟเวอร์แอป B', mn: 'Аппликейшн сервер B',
      bo: 'ཉེར་སྤྱོད་ཞབས་འཁོར་ཆས B',
    },
    dept: {
      'zh-CN': '机房', 'zh-TW': '機房', en: 'Data Center', ja: 'データセンター',
      ko: '데이터센터', de: 'Rechenzentrum', fr: 'Centre de données', th: 'ดาต้าเซ็นเตอร์',
      mn: 'Дата төв', bo: 'གྲོགས་འཕྲུལ་ཁང་།',
    },
    py: 'ying yong fu wu qi b',
  },
  {
    id: 'NET-101',
    name: {
      'zh-CN': '核心交换机', 'zh-TW': '核心交換器', en: 'Core Switch',
      ja: 'コアスイッチ', ko: '코어 스위치', de: 'Core-Switch', fr: 'Commutateur central',
      th: 'สวิตช์หลัก', mn: 'Үндсэн свич', bo: 'སྒུལ་ཆས་གཙོ་བོ།',
    },
    dept: {
      'zh-CN': '网络组', 'zh-TW': '網路組', en: 'Network Team', ja: 'ネットワークチーム',
      ko: '네트워크 팀', de: 'Netzwerkteam', fr: 'Équipe réseau', th: 'ทีมเครือข่าย',
      mn: 'Сүлжээний баг', bo: 'དྲ་རྒྱའི་ཚན་ཁག',
    },
    py: 'he xin jiao huan ji',
  },
  {
    id: 'IOT-201',
    name: {
      'zh-CN': '边缘采集网关', 'zh-TW': '邊緣採集閘道', en: 'Edge Gateway',
      ja: 'エッジゲートウェイ', ko: '엣지 게이트웨이', de: 'Edge-Gateway', fr: 'Passerelle edge',
      th: 'เกตเวย์ขอบ', mn: 'Ирмэгийн цуглуулагч гарц', bo: 'མཐའ་མཚམས་བསྡུ་སྒོ།',
    },
    dept: {
      'zh-CN': '物联网组', 'zh-TW': '物聯網組', en: 'IoT Team', ja: 'IoTチーム',
      ko: 'IoT 팀', de: 'IoT-Team', fr: 'Équipe IoT', th: 'ทีม IoT',
      mn: 'IoT баг', bo: 'ནུས་འཁྲུལ་དྲ་རྒྱའི་ཚན་ཁག',
    },
    py: 'bian yuan cai ji wang guan',
  },
  {
    id: 'TER-301',
    name: {
      'zh-CN': '自助终端一体机', 'zh-TW': '自助終端一體機', en: 'Self-Service Terminal',
      ja: 'セルフサービス端末', ko: '셀프서비스 단말기', de: 'Self-Service-Terminal',
      fr: 'Terminal en libre-service', th: 'ตู้บริการตนเอง', mn: 'Өөрөө үйлчлэх терминал',
      bo: 'རང་བདེ་བའི་མཐའ་སྣེ།',
    },
    dept: {
      'zh-CN': '终端组', 'zh-TW': '終端組', en: 'Terminal Team', ja: '端末チーム',
      ko: '단말기 팀', de: 'Terminalteam', fr: 'Équipe terminaux', th: 'ทีมเทอร์มินัล',
      mn: 'Терминалын баг', bo: 'མཐའ་སྣེའི་ཚན་ཁག',
    },
    py: 'zi zhu zhong duan',
  },
  {
    id: 'SEC-401',
    name: {
      'zh-CN': '日志审计一体机', 'zh-TW': '日誌稽核一體機', en: 'Log Audit Appliance',
      ja: 'ログ監査アプライアンス', ko: '로그 감사 어플라이언스', de: 'Log-Audit-Appliance',
      fr: "Appliance d'audit de journaux", th: 'เครื่องตรวจสอบล็อก', mn: 'Лог аудит төхөөрөмж',
      bo: 'ཉིན་བསྒྲགས་བརྟག་དཔྱད་ཡན་ལག',
    },
    dept: {
      'zh-CN': '安全组', 'zh-TW': '安全組', en: 'Security Team', ja: 'セキュリティチーム',
      ko: '보안 팀', de: 'Sicherheitsteam', fr: 'Équipe sécurité', th: 'ทีมความปลอดภัย',
      mn: 'Аюулгүй байдлын баг', bo: 'བདེ་འཇགས་ཚན་ཁག',
    },
    py: 'ri zhi shen ji',
  },
]

export const STAT_AREA = [
  { x: { 'zh-CN': '周一', 'zh-TW': '週一', en: 'Mon', ja: '月', ko: '월', de: 'Mo', fr: 'lun.', th: 'จ.', mn: 'Да', bo: 'གཟའ་ཟླ།' }, y: 32 },
  { x: { 'zh-CN': '周二', 'zh-TW': '週二', en: 'Tue', ja: '火', ko: '화', de: 'Di', fr: 'mar.', th: 'อ.', mn: 'Мя', bo: 'གཟའ་མིག།' }, y: 45 },
  { x: { 'zh-CN': '周三', 'zh-TW': '週三', en: 'Wed', ja: '水', ko: '수', de: 'Mi', fr: 'mer.', th: 'พ.', mn: 'Лх', bo: 'གཟའ་ལྷག།' }, y: 38 },
  { x: { 'zh-CN': '周四', 'zh-TW': '週四', en: 'Thu', ja: '木', ko: '목', de: 'Do', fr: 'jeu.', th: 'พฤ.', mn: 'Пү', bo: 'གཟའ་ཕུར་བུ།' }, y: 61 },
  { x: { 'zh-CN': '周五', 'zh-TW': '週五', en: 'Fri', ja: '金', ko: '금', de: 'Fr', fr: 'ven.', th: 'ศ.', mn: 'Ба', bo: 'གཟའ་པ་སངས།' }, y: 54 },
  { x: { 'zh-CN': '周六', 'zh-TW': '週六', en: 'Sat', ja: '土', ko: '토', de: 'Sa', fr: 'sam.', th: 'ส.', mn: 'Бя', bo: 'གཟའ་སྤེན་པ།' }, y: 72 },
  { x: { 'zh-CN': '周日', 'zh-TW': '週日', en: 'Sun', ja: '日', ko: '일', de: 'So', fr: 'dim.', th: 'อา.', mn: 'Ня', bo: 'གཟའ་ཉི་མ།' }, y: 66 },
]

export const STAT_BAR = [
  { x: { 'zh-CN': '机房', 'zh-TW': '機房', en: 'Data Center', ja: 'データセンター', ko: '데이터센터', de: 'Rechenzentrum', fr: 'Centre de données', th: 'ดาต้าเซ็นเตอร์', mn: 'Дата төв', bo: 'གྲོགས་འཕྲུལ་ཁང་།' }, y: 42 },
  { x: { 'zh-CN': '网络组', 'zh-TW': '網路組', en: 'Network Team', ja: 'ネットワークチーム', ko: '네트워크 팀', de: 'Netzwerkteam', fr: 'Équipe réseau', th: 'ทีมเครือข่าย', mn: 'Сүлжээний баг', bo: 'དྲ་རྒྱའི་ཚན་ཁག' }, y: 68 },
  { x: { 'zh-CN': '物联网组', 'zh-TW': '物聯網組', en: 'IoT Team', ja: 'IoTチーム', ko: 'IoT 팀', de: 'IoT-Team', fr: 'Équipe IoT', th: 'ทีม IoT', mn: 'IoT баг', bo: 'ནུས་འཁྲུལ་དྲ་རྒྱའི་ཚན་ཁག' }, y: 31 },
  { x: { 'zh-CN': '终端组', 'zh-TW': '終端組', en: 'Terminal Team', ja: '端末チーム', ko: '단말기 팀', de: 'Terminalteam', fr: 'Équipe terminaux', th: 'ทีมเทอร์มินัล', mn: 'Терминалын баг', bo: 'མཐའ་སྣེའི་ཚན་ཁག' }, y: 55 },
]

export const TIMELINE = Array.from({ length: 24 }, (_, i) => ({
  x: `${String(i).padStart(2, '0')}:00`,
  y1: Math.round(20 + Math.sin(i / 3) * 12 + Math.random() * 6),
  y2: Math.round(14 + Math.cos(i / 4) * 9 + Math.random() * 5),
}))

export const NOTICE_TABS = [
  {
    key: 'todo',
    title: {
      'zh-CN': '待办', 'zh-TW': '待辦', en: 'To-Do', ja: '未処理', ko: '할 일',
      de: 'Aufgaben', fr: 'À faire', th: 'สิ่งที่ต้องทำ', mn: 'Хийх ажил', bo: 'བྱེད་དགོས།',
    },
    count: 3,
    items: [
      {
        id: 'n1',
        title: {
          'zh-CN': '工单 WO-2081 待验收', 'zh-TW': '工單 WO-2081 待驗收',
          en: 'Work Order WO-2081 Pending Acceptance', ja: '工単 WO-2081 の検収待ち',
          ko: '작업 지시 WO-2081 검수 대기', de: 'Arbeitsauftrag WO-2081 wartet auf Abnahme',
          fr: 'Bon de travail WO-2081 en attente de validation', th: 'ใบสั่งงาน WO-2081 รอตรวจรับ',
          mn: 'WO-2081 ажлын захиалга хүлээн авах хүлээлгэндээ', bo: 'ལས་ཀའི WO-2081 ལེན་འབྱོར་སྒུག།',
        },
        desc: {
          'zh-CN': '应用服务器 A · 电源模块更换', 'zh-TW': '應用伺服器 A · 電源模組更換',
          en: 'Application Server A · Power Module Replacement', ja: 'アプリケーションサーバー A · 電源モジュール交換',
          ko: '애플리케이션 서버 A · 전원 모듈 교체', de: 'Anwendungsserver A · Netzteil-Austausch',
          fr: "Serveur d'applications A · Remplacement du module d'alimentation",
          th: 'เซิร์ฟเวอร์แอป A · เปลี่ยนโมดูลพลังงาน', mn: 'Аппликейшн сервер A · цахилгаан блок солих',
          bo: 'ཉེར་སྤྱོད་ཞབས་འཁོར་ཆས A · གློག་ཆས་སྒྲིབ་བརྗེ།',
        },
        time: {
          'zh-CN': '10 分钟前', 'zh-TW': '10 分鐘前', en: '10 minutes ago', ja: '10分前',
          ko: '10분 전', de: 'vor 10 Minuten', fr: 'il y a 10 minutes', th: '10 นาทีที่แล้ว',
          mn: '10 минутын өмнө', bo: 'སྐར་མ 10 སྔོན།',
        },
      },
      {
        id: 'n2',
        title: {
          'zh-CN': '计量校准即将到期', 'zh-TW': '計量校準即將到期', en: 'Metrology Calibration Due Soon',
          ja: '計量校正の期限が近づいています', ko: '계량 교정 만료 임박', de: 'Kalibrierung läuft bald ab',
          fr: 'Étalonnage métrologique bientôt échu', th: 'การสอบเทียบมาตรฐานใกล้หมดอายุ',
          mn: 'Хэмжил зүйн тохируулга дуусах гэж байна', bo: 'འཇལ་ཞིབ་དུས་ཚོད་ཉེ་འབབ།',
        },
        desc: {
          'zh-CN': '6 台资产将在 7 天内到期', 'zh-TW': '6 台資產將在 7 天內到期',
          en: '6 assets will expire within 7 days', ja: '6 台の資産が 7 日以内に期限切れ',
          ko: '6대 자산이 7일 내 만료', de: '6 Anlagen laufen innerhalb von 7 Tagen ab',
          fr: '6 actifs expirent sous 7 jours', th: 'สินทรัพย์ 6 ชิ้นจะหมดอายุใน 7 วัน',
          mn: '6 хөрөнгө 7 хоногийн дотор дуусна', bo: 'ཐོབ་རྩིས 6 ཉིན 7 ནང་དུས་ཚོད་འདས།',
        },
        time: {
          'zh-CN': '1 小时前', 'zh-TW': '1 小時前', en: '1 hour ago', ja: '1時間前',
          ko: '1시간 전', de: 'vor 1 Stunde', fr: 'il y a 1 heure', th: '1 ชั่วโมงที่แล้ว',
          mn: '1 цагийн өмнө', bo: 'ཆུ་ཚོད 1 སྔོན།',
        },
      },
      {
        id: 'n3',
        title: {
          'zh-CN': '巡检计划待确认', 'zh-TW': '巡檢計畫待確認', en: 'Inspection Plan Pending Confirmation',
          ja: '巡検計画の確認待ち', ko: '점검 계획 확인 대기', de: 'Inspektionsplan wartet auf Bestätigung',
          fr: "Plan d'inspection à confirmer", th: 'แผนการตรวจสอบรอยืนยัน',
          mn: 'Тохируулгыг хүлээн зөвшөөрөх хүлээлгэндээ', bo: 'བརྟག་ཞིབ་འཆར་གཞི་གཏན་འཁེལ་སྒུག།',
        },
        desc: {
          'zh-CN': '本周机房巡检排期', 'zh-TW': '本週機房巡檢排期',
          en: "This week's data center inspection schedule", ja: '今週のデータセンター巡検スケジュール',
          ko: '이번 주 데이터센터 점검 일정', de: 'Inspektionstermine des Rechenzentrums diese Woche',
          fr: 'Planning des inspections du centre de données cette semaine',
          th: 'ตารางตรวจดาต้าเซ็นเตอร์สัปดาห์นี้', mn: 'Энэ долоо хоногийн дата төвийн үзлэгийн хуваарь',
          bo: 'བདུན་འཁོར་གྲོགས་འཕྲུལ་ཁང་བརྟག་ཞིབ་དུས་རིམ།',
        },
        time: {
          'zh-CN': '昨天', 'zh-TW': '昨天', en: 'Yesterday', ja: '昨日',
          ko: '어제', de: 'Gestern', fr: 'Hier', th: 'เมื่อวาน', mn: 'Өчигдөр', bo: 'ཁ་སང།',
        },
      },
    ],
  },
  {
    key: 'message',
    title: {
      'zh-CN': '消息', 'zh-TW': '訊息', en: 'Messages', ja: 'メッセージ', ko: '메시지',
      de: 'Nachrichten', fr: 'Messages', th: 'ข้อความ', mn: 'Зурвас', bo: 'ཆ་འཕྲིན།',
    },
    count: 1,
    items: [
      {
        id: 'm1',
        title: {
          'zh-CN': '系统升级通知', 'zh-TW': '系統升級通知', en: 'System Upgrade Notice',
          ja: 'システムアップグレード通知', ko: '시스템 업그레이드 공지', de: 'Hinweis zum System-Upgrade',
          fr: 'Notification de mise à niveau du système', th: 'ประกาศอัปเกรดระบบ',
          mn: 'Систем шинэчлэх мэдэгдэл', bo: 'མ་ལག་གསར་སྒྱུར་བརྡ་ཐོ།',
        },
        desc: {
          'zh-CN': '本周六 02:00-04:00 停机维护', 'zh-TW': '本週六 02:00-04:00 停機維護',
          en: 'Scheduled maintenance this Saturday 02:00-04:00', ja: '今週土曜 02:00-04:00 メンテナンス停止',
          ko: '이번 주 토요일 02:00-04:00 정기 점검', de: 'Wartungsstillstand diesen Samstag 02:00-04:00',
          fr: 'Maintenance ce samedi 02:00-04:00', th: 'ปิดปรับปรุงเสาร์นี้ 02:00-04:00',
          mn: 'Энэ долоо хоногийн баасан гариг 02:00-04:00 засвар', bo: 'གཟའ་སྤེན་འདི 02:00-04:00 བརྒྱུད་འཛིན།',
        },
        time: {
          'zh-CN': '周一', 'zh-TW': '週一', en: 'Monday', ja: '月曜',
          ko: '월요일', de: 'Montag', fr: 'Lundi', th: 'วันจันทร์', mn: 'Даваа', bo: 'གཟའ་ཟླ།',
        },
        read: true,
      },
    ],
  },
]

export const DEFAULT_RANGES = [
  { id: 'r1', start: '09:00', end: '12:00' },
  { id: 'r2', start: '13:30', end: '18:00' },
]

export const OVERLAP_RANGES = [
  { id: 'r1', start: '09:00', end: '13:00' },
  { id: 'r2', start: '12:30', end: '18:00' },
]

export const INITIAL_CARDS = [
  {
    key: 'overview',
    title: {
      'zh-CN': '概览卡片', 'zh-TW': '概覽卡片', en: 'Overview Card', ja: '概要カード',
      ko: '개요 카드', de: 'Übersichtskarte', fr: "Carte d'aperçu", th: 'การ์ดภาพรวม',
      mn: 'Тойм карт', bo: 'སྤྱི་མང་གདགས་ཀ',
    },
    desc: {
      'zh-CN': '设备总数、在线率、告警数', 'zh-TW': '設備總數、上線率、告警數',
      en: 'Total devices, online rate, alert count', ja: 'デバイス总数・オンライン率・アラート数',
      ko: '장치 총수, 온라인율, 알림 수', de: 'Gerätezahl, Online-Rate, Alarmanzahl',
      fr: "Nombre d'appareils, taux en ligne, nombre d'alertes", th: 'จำนวนอุปกรณ์, อัตราออนไลน์, จำนวนการแจ้งเตือน',
      mn: 'Төхөөрөмжийн нийт, онлайн хувь, дохио тоо', bo: 'ཡན་ལག་བསྡོམས་གྲངས། དྲ་རྒྱ་འདུས་ཚད། བརྡ་སྐད་གྲངས།',
    },
    visible: true,
  },
  {
    key: 'alarm',
    title: {
      'zh-CN': '告警卡片', 'zh-TW': '告警卡片', en: 'Alert Card', ja: 'アラートカード',
      ko: '알림 카드', de: 'Alarmkarte', fr: "Carte d'alertes", th: 'การ์ดแจ้งเตือน',
      mn: 'Дохионы карт', bo: 'བརྡ་སྐད་གདགས་ཀ',
    },
    desc: {
      'zh-CN': '实时告警与处理进度', 'zh-TW': '即時告警與處理進度',
      en: 'Real-time alerts and handling progress', ja: 'リアルタイムアラートと処理進捗',
      ko: '실시간 알림과 처리 진행률', de: 'Echtzeit-Alarme und Bearbeitungsfortschritt',
      fr: 'Alertes en temps réel et progression du traitement', th: 'การแจ้งเตือนแบบเรียลไทม์และความคืบหน้า',
      mn: 'Бодит цагийн дохио ба боловсруулалтын явц', bo: 'དུས་ཐོག་བརྡ་སྐད་དང་བྱེད་དཔྱད་གྲུབ་ཚད།',
    },
    visible: true,
  },
  {
    key: 'workorder',
    title: {
      'zh-CN': '工单卡片', 'zh-TW': '工單卡片', en: 'Work Order Card', ja: '工単カード',
      ko: '작업 카드', de: 'Arbeitsauftragskarte', fr: 'Carte de bons de travail', th: 'การ์ดใบสั่งงาน',
      mn: 'Ажлын захиалгын карт', bo: 'ལས་ཀའི་གདགས་ཀ',
    },
    desc: {
      'zh-CN': '待办工单与超期提醒', 'zh-TW': '待辦工單與逾期提醒',
      en: 'Pending work orders and overdue reminders', ja: '未処理の工単と期限超過リマインダー',
      ko: '대기 작업 지시와 기한 초과 알림', de: 'Offene Aufträge und Fälligkeitserinnerungen',
      fr: 'Bons en attente et rappels de dépassement', th: 'ใบสั่งงานที่ค้างและการเตือนเลยกำหนด',
      mn: 'Хүлээгдэж буй ажил ба хугацаа хэтэрсхийн сануулга', bo: 'བྱེད་དགོས་ལས་ཀ་དང་དུས་ཚོད་བརྒལ་བར་ཞུ།',
    },
    visible: false,
  },
  {
    key: 'report',
    title: {
      'zh-CN': '报表卡片', 'zh-TW': '報表卡片', en: 'Report Card', ja: 'レポートカード',
      ko: '보고서 카드', de: 'Berichtskarte', fr: 'Carte de rapports', th: 'การ์ดรายงาน',
      mn: 'Тайлан карт', bo: 'ཆ་འཕྲིན་གདགས་ཀ',
    },
    desc: {
      'zh-CN': '月度统计与导出入口', 'zh-TW': '月度統計與導出入口',
      en: 'Monthly statistics and export entry', ja: '月次統計とエクスポート入口',
      ko: '월간 통계와 내보내기 입구', de: 'Monatsstatistik und Export-Einstieg',
      fr: "Statistiques mensuelles et accès à l'export", th: 'สถิติรายเดือนและทางเข้าส่งออก',
      mn: 'Сарын статистик ба экспортын хаалга', bo: 'ཟླ་འཁོར་བསྡོམས་ཐོ། ཕྱིར་འདོན་སྒོ།',
    },
    visible: true,
  },
]

/** 标签输入（TagInput）演示用的初始标签 */
export const INITIAL_TAGS = ['周巡检', '月校准', '季度保养']

/** 倒计时目标写在模块级：渲染期调用 Date.now() 会被判为不纯函数 */
export const COUNTDOWN_TARGET = Date.now() + 2 * 3600 * 1000 + 45 * 1000

export function makeRows(start, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `r_${start + i}`,
    no: String(start + i + 1).padStart(3, '0'),
    time: `${String(8 + ((start + i) % 10)).padStart(2, '0')}:${String(((start + i) * 7) % 60).padStart(2, '0')}`,
  }))
}

/** 模拟异步查询：按名称 / 拼音 / 分组过滤，400ms 延迟。lang 决定返回哪语种的名称与分组 */
export function loadDevices(keyword, lang = 'zh-CN') {
  const kw = String(keyword || '').trim().toLowerCase()
  return new Promise((resolve) => {
    setTimeout(() => {
      const list = DEVICES.map((item) => ({
        ...item,
        name: pick(item.name, lang),
        dept: pick(item.dept, lang),
      }))
      resolve(
        kw
          ? list.filter(
              (item) =>
                item.name.toLowerCase().includes(kw) ||
                item.py.includes(kw) ||
                item.dept.includes(kw) ||
                item.id.toLowerCase().includes(kw),
            )
          : list,
      )
    }, 400)
  })
}

/* =====================================================================
 * 各分组内容
 * ===================================================================== */
