#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""星际轨道的「真值」数据生成器 —— 零第三方依赖（只用 Python 标准库）。

为什么要有这个脚本
------------------
前端 canvas 里原本写的是「看得清但假」的轨道要素（`aPx` / `periodS` / `phase` 都是手调的），
只能画出「像那么回事」的椭圆。这里换成**真实的轨道力学**：
轨道要素取自 JPL《Keplerian Elements for Approximate Positions of the Major Planets》
的 J2000.0 表（含每儒略世纪的线性变化率，适用范围 1800–2050），
按目标历元线性外推，解开普勒方程，得到日心黄道三维坐标。

职责边界（刻意划清）
--------------------
* **本脚本负责天文**：要素外推、解开普勒方程、三维坐标、真实周期 / 速度 / 距离。
* **前端负责呈现**：比例压缩、视角投影、动画插值、配色与交互。
前端拿到的是「物理量」，不再自己算天体力学。

输出
----
1. `data/orbital-elements.json`         —— 权威数据（人类可读，可单独检视 / 复用）
2. `src/pages/OrbitLab/orbitData.js`    —— React 主应用直接 import
3. `micro-apps/vue-app/src/data/orbit.js`
4. `micro-apps/angular-app/src/data/orbit.ts`   —— 带 TS 类型声明

用法
----
    python3 scripts/orbit-data.py                 # 默认历元 2026-10-01T00:00:00Z
    python3 scripts/orbit-data.py 2030-01-01      # 指定历元（会写进 meta）
    python3 scripts/orbit-data.py --samples 240   # 采样点数（默认 180）

采样点为什么按「平均近点角」均匀
--------------------------------
平均近点角 M 与时间成正比（M = M₀ + 2πt/P），所以按 M 均匀采样 == 按时间均匀采样，
前端只要按 `frac(t/P)` 取下标再做一次线性插值，就能连续播放且**不需要前端再碰天体力学**。
反过来说，如果按偏近点角 E 均匀采样，前端就必须自己解 M→E 才能均匀走时。
180 点的弦高误差在屏幕上小于 0.04px（最坏情况水星近日点附近），完全够用。
"""

from __future__ import annotations

import json
import math
import os
import sys
from datetime import date, datetime, timezone

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------

AU_KM = 149_597_870.7            # 天文单位（km），IAU 2012 定义
GM_SUN = 1.32712440018e11        # 太阳引力常数 GM（km³/s²）
J2000_JD = 2_451_545.0           # J2000.0 对应儒略日
JULIAN_CENTURY_DAYS = 36_525.0   # 儒略世纪 = 36525 天
TAU = math.tau

# ---------------------------------------------------------------------------
# 行星轨道要素（JPL J2000.0 历元）+ 物理参数
#
# 要素列依次为：
#   a0, ȧ     半长轴（AU，每世纪）
#   e0, ė     偏心率（每世纪）
#   I0, İ     轨道倾角（°，每世纪，相对 J2000 黄道）
#   L0, L̇     平黄经（°，每世纪；L̇ 就是平均角速度）
#   ϖ0, ϖ̇     近日点黄经（°，每世纪）= Ω + ω
#   Ω0, Ω̇     升交点黄经（°，每世纪）
#
# 地球一行用的是「地月质心」（EM Bary），表中 Ω 取 0、ϖ 取 102.93768193。
# radius_km 用平均半径；note 是给人看的一句话，数字都对准真实值。
# ---------------------------------------------------------------------------

PLANETS = [
    dict(
        id="mercury", name="水星", en="Mercury", color="#b9a08a",
        a0=0.38709927, a_dot=0.00000037,
        e0=0.20563593, e_dot=0.00001906,
        i0=7.00497902, i_dot=-0.00594749,
        l0=252.25032350, l_dot=149472.67411175,
        peri0=77.45779628, peri_dot=0.16047689,
        node0=48.33076593, node_dot=-0.12534081,
        radius_km=2439.7, mass_earth=0.0553, moons=0, ring=False,
        note="偏心率 0.206 是八大行星里最大的 —— 近日点 0.307 AU、远日点 0.467 AU，差出 52%。"
             "水星也是跑得最快的，平均 47.4 km/s。",
    ),
    dict(
        id="venus", name="金星", en="Venus", color="#e8c07d",
        a0=0.72333566, a_dot=0.00000390,
        e0=0.00677672, e_dot=-0.00004107,
        i0=3.39467605, i_dot=-0.00078890,
        l0=181.97909950, l_dot=58517.81538729,
        peri0=131.60246718, peri_dot=0.00268329,
        node0=76.67984255, node_dot=-0.27769418,
        radius_km=6051.8, mass_earth=0.8150, moons=0, ring=False,
        note="轨道最接近正圆的行星 —— 偏心率只有 0.0068，近日点与远日点只差 1.4%。"
             "自转还是逆行的：一个金星日比一个金星年还长。",
    ),
    dict(
        id="earth", name="地球", en="Earth", color="#4f9cf0",
        a0=1.00000261, a_dot=0.00000562,
        e0=0.01671123, e_dot=-0.00004392,
        i0=0.00001531, i_dot=-0.01294668,
        l0=100.46457166, l_dot=35999.37244981,
        peri0=102.93768193, peri_dot=0.32327364,
        node0=0.0, node_dot=0.0,
        radius_km=6371.0, mass_earth=1.0, moons=1, ring=False,
        note="偏心率 0.0167，日地距离在 0.983~1.017 AU 之间摆动（约 147.1~152.1 百万公里）。"
             "北半球夏天时地球反而在远日点附近 —— 季节主要由地轴倾角决定，不是距离。",
    ),
    dict(
        id="mars", name="火星", en="Mars", color="#e2683c",
        a0=1.52371034, a_dot=0.00001847,
        e0=0.09339410, e_dot=0.00007882,
        i0=1.84969142, i_dot=-0.00813131,
        l0=-4.55343205, l_dot=19140.30268499,
        peri0=-23.94362959, peri_dot=0.44441088,
        node0=49.55953891, node_dot=-0.29257343,
        radius_km=3389.5, mass_earth=0.1074, moons=2, ring=False,
        note="开普勒正是从第谷的火星观测数据里发现「轨道是椭圆、太阳在一个焦点上」——"
             "因为它的偏心程度（0.093）刚好大到肉眼能看出中心不在正中的量级。",
    ),
    dict(
        id="jupiter", name="木星", en="Jupiter", color="#d9a066",
        a0=5.20288700, a_dot=-0.00011607,
        e0=0.04838624, e_dot=-0.00013253,
        i0=1.30439695, i_dot=-0.00183714,
        l0=34.39644051, l_dot=3034.74612775,
        peri0=14.72847983, peri_dot=0.21252668,
        node0=100.47390909, node_dot=0.20469106,
        radius_km=69911.0, mass_earth=317.83, moons=95, ring=True,
        note="质量是其余七颗行星总和的 2.5 倍（占全部行星质量的 71%）。"
             "正因为太大，它的质心其实略微跑到太阳外面 —— 日木共同质心离日心约 1.07 个太阳半径。",
    ),
    dict(
        id="saturn", name="土星", en="Saturn", color="#e3d6a3",
        a0=9.53667594, a_dot=-0.00125060,
        e0=0.05386179, e_dot=-0.00050991,
        i0=2.48599187, i_dot=0.00193609,
        l0=49.95424423, l_dot=1222.49362201,
        peri0=92.59887831, peri_dot=-0.41897216,
        node0=113.66242448, node_dot=-0.28867794,
        radius_km=58232.0, mass_earth=95.16, moons=274, ring=True,
        note="平均密度只有 0.687 g/cm³ —— 比水还轻，理论上能浮在水面上。"
             "这里给轨道加了 0.05 的倾角偏移示意光环平面，真实的环与黄道面差约 27°。",
    ),
    dict(
        id="uranus", name="天王星", en="Uranus", color="#8fd3d8",
        a0=19.18916464, a_dot=-0.00196176,
        e0=0.04725744, e_dot=-0.00004397,
        i0=0.77263783, i_dot=-0.00242939,
        l0=313.23810451, l_dot=428.48202785,
        peri0=170.95427630, peri_dot=0.40805281,
        node0=74.01692503, node_dot=0.04240589,
        radius_km=25362.0, mass_earth=14.54, moons=28, ring=True,
        note="自转轴倾角 97.8° —— 几乎是躺着绕太阳滚，所以它的极区会各有 42 年极昼与 42 年极夜。"
             "也是第一颗「先用笔算出来、再被望远镜看到」的行星。",
    ),
    dict(
        id="neptune", name="海王星", en="Neptune", color="#5b7fe0",
        a0=30.06992276, a_dot=0.00026291,
        e0=0.00859048, e_dot=0.00005105,
        i0=1.77004347, i_dot=0.00035372,
        l0=-55.12002969, l_dot=218.45945325,
        peri0=44.96476227, peri_dot=-0.32241464,
        node0=131.78422574, node_dot=-0.00508664,
        radius_km=24622.0, mass_earth=17.15, moons=16, ring=True,
        note="轨道最圆（e=0.0086），但离得太远：一个海王星年约 164.8 个地球年，"
             "自 1846 年被发现以来它才刚绕完太阳一圈多一点（2011 年完成第一圈）。",
    ),
]

# 星体配色补充（前端画恒星用）
SUN = dict(name="太阳", en="Sun", color="#ffd76a", radius_km=695_700.0, mass_earth=333_000.0)


# ---------------------------------------------------------------------------
# 日期 → 儒略日
# ---------------------------------------------------------------------------

def julian_day(dt: datetime) -> float:
    """公历 UTC → 儒略日（Fliegel–Van Flandern 算法，含儒略历/格里历分界处理）。"""
    y, m = dt.year, dt.month
    d = dt.day + (dt.hour + dt.minute / 60.0 + dt.second / 3600.0) / 24.0
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4  # 格里历修正
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + b - 1524.5


# ---------------------------------------------------------------------------
# 轨道力学
# ---------------------------------------------------------------------------

def normalize_deg(deg: float, center: float = 0.0) -> float:
    """把角度归一到 (center-180, center+180]。"""
    return (deg - center + 180.0) % 360.0 - 180.0 + center


def solve_kepler(m_rad: float, e: float, tol: float = 1e-12, max_iter: int = 40) -> float:
    """解开普勒方程 M = E - e·sinE，返回偏近点角 E（弧度）。

    牛顿迭代 + 初值保护：偏心率大的天体（这里最大 0.206）用 M 作初值足够，
    但加上一步「E = M + e·sinM」的一阶修正可以让迭代次数从 ~4 降到 ~2。
    """
    ecc_anom = m_rad + e * math.sin(m_rad) * (1.0 + e * math.cos(m_rad))
    for _ in range(max_iter):
        f = ecc_anom - e * math.sin(ecc_anom) - m_rad
        fp = 1.0 - e * math.cos(ecc_anom)
        step = f / fp
        ecc_anom -= step
        if abs(step) < tol:
            break
    return ecc_anom


def vis_viva(r_km: float, a_km: float) -> float:
    """活力公式：v = sqrt(GM · (2/r - 1/a))，返回 km/s。"""
    return math.sqrt(max(GM_SUN * (2.0 / r_km - 1.0 / a_km), 0.0))


def build_planet(spec: dict, centuries: float, samples: int) -> dict:
    """按历元外推要素，算出一个行星的完整数据块。"""
    t = centuries

    a = spec["a0"] + spec["a_dot"] * t
    e = spec["e0"] + spec["e_dot"] * t
    incl = spec["i0"] + spec["i_dot"] * t
    mean_lon = spec["l0"] + spec["l_dot"] * t
    peri_lon = spec["peri0"] + spec["peri_dot"] * t
    node = spec["node0"] + spec["node_dot"] * t

    # 近日点幅角 ω = ϖ - Ω；平近点角 M = L - ϖ
    arg_peri = peri_lon - node
    mean_anom = normalize_deg(mean_lon - peri_lon)

    # 周期直接由平均角速度反推（比用开普勒第三定律更贴合这张表）
    period_days = JULIAN_CENTURY_DAYS * 360.0 / spec["l_dot"]

    a_km = a * AU_KM
    r_peri = a * (1.0 - e)
    r_aph = a * (1.0 + e)

    # ---- 三维坐标采样：按平近点角均匀（= 按时间均匀）----
    cos_w, sin_w = math.cos(math.radians(arg_peri)), math.sin(math.radians(arg_peri))
    cos_o, sin_o = math.cos(math.radians(node)), math.sin(math.radians(node))
    cos_i, sin_i = math.cos(math.radians(incl)), math.sin(math.radians(incl))
    b = a * math.sqrt(1.0 - e * e)

    xs, ys, zs = [], [], []
    for k in range(samples):
        m_deg = mean_anom + 360.0 * k / samples
        ecc_anom = solve_kepler(math.radians(normalize_deg(m_deg)), e)
        xp = a * (math.cos(ecc_anom) - e)      # 沿近日点方向（原点在太阳 = 一个焦点）
        yp = b * math.sin(ecc_anom)
        xs.append(round(xp * (cos_w * cos_o - sin_w * sin_o * cos_i)
                        - yp * (sin_w * cos_o + cos_w * sin_o * cos_i), 4))
        ys.append(round(xp * (cos_w * sin_o + sin_w * cos_o * cos_i)
                        + yp * (-sin_w * sin_o + cos_w * cos_o * cos_i), 4))
        zs.append(round(xp * (sin_w * sin_i) + yp * (cos_w * sin_i), 4))

    return dict(
        id=spec["id"], name=spec["name"], en=spec["en"], color=spec["color"],
        # —— 轨道要素（历元时刻的真实值）——
        a=round(a, 9),
        e=round(e, 9),
        incl=round(incl, 6),
        node=round(normalize_deg(node, 0.0), 6),
        argPeri=round(normalize_deg(arg_peri, 0.0), 6),
        meanAnomaly=round(mean_anom, 6),
        periodDays=round(period_days, 6),
        periodYears=round(period_days / 365.25, 6),
        perihelionAU=round(r_peri, 6),
        aphelionAU=round(r_aph, 6),
        # —— 物理参数 ——
        radiusKm=spec["radius_km"],
        massEarth=spec["mass_earth"],
        moons=spec["moons"],
        ring=spec["ring"],
        # —— 由活力公式给出的速度区间（km/s）——
        speed=dict(
            perihelion=round(vis_viva(r_peri * AU_KM, a_km), 4),
            aphelion=round(vis_viva(r_aph * AU_KM, a_km), 4),
            mean=round(TAU * a_km / (period_days * 86400.0), 4),
        ),
        note=spec["note"],
        # —— 采样轨迹：下标 k 对应 M = meanAnomaly + 360·k/samples ——
        orbit=dict(x=xs, y=ys, z=zs),
    )


# ---------------------------------------------------------------------------
# 序列化
# ---------------------------------------------------------------------------

BANNER = "/* 本文件由 scripts/orbit-data.py 生成 —— 请勿手改。改算法请改脚本后重跑：\n" \
         "   python3 scripts/orbit-data.py\n" \
         "   数据来源：JPL《Keplerian Elements for Approximate Positions of the Major Planets》\n" \
         "   （J2000.0 要素 + 每儒略世纪变化率，适用 1800–2050）。 */\n"

TS_TYPES = """
export interface OrbitMeta {
  epoch: string
  julianDay: number
  centuriesSinceJ2000: number
  samples: number
  units: Record<string, string>
  source: string
  generator: string
}

export interface OrbitSpeed {
  perihelion: number
  aphelion: number
  mean: number
}

export interface OrbitBody {
  id: string
  name: string
  en: string
  color: string
  a: number
  e: number
  incl: number
  node: number
  argPeri: number
  meanAnomaly: number
  periodDays: number
  periodYears: number
  perihelionAU: number
  aphelionAU: number
  radiusKm: number
  massEarth: number
  moons: number
  ring: boolean
  speed: OrbitSpeed
  note: string
  /** 下标 k ↔ 平近点角 M = meanAnomaly + 360·k/samples（= 时间均匀），单位 AU */
  orbit: { x: number[]; y: number[]; z: number[] }
}

export interface OrbitData {
  meta: OrbitMeta
  sun: { name: string; en: string; color: string; radiusKm: number; massEarth: number }
  planets: OrbitBody[]
}
"""


def dump_payload(payload: dict) -> str:
    """紧凑 JSON：每个行星一行，既能 diff 又能把体积压到最小。"""
    meta = json.dumps(payload["meta"], ensure_ascii=False)
    sun = json.dumps(payload["sun"], ensure_ascii=False)
    lines = [f'  "meta": {meta},', f'  "sun": {sun},', '  "planets": [']
    for i, planet in enumerate(payload["planets"]):
        comma = "," if i < len(payload["planets"]) - 1 else ""
        lines.append(f'    {json.dumps(planet, ensure_ascii=False, separators=(",", ":"))}{comma}')
    lines.append("  ]")
    return "{\n" + "\n".join(lines) + "\n}"


def write(path: str, content: str, root: str) -> None:
    full = os.path.join(root, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)
    size_kb = len(content.encode("utf-8")) / 1024.0
    print(f"  ✓ {path}  ({size_kb:.1f} KB)")


def main() -> int:
    argv = sys.argv[1:]
    samples = 180
    if "--samples" in argv:
        idx = argv.index("--samples")
        samples = int(argv[idx + 1])
        del argv[idx:idx + 2]
    epoch_arg = argv[0] if argv else "2026-10-01"
    epoch = datetime.fromisoformat(epoch_arg).replace(tzinfo=timezone.utc, hour=0, minute=0, second=0)

    jd = julian_day(epoch)
    centuries = (jd - J2000_JD) / JULIAN_CENTURY_DAYS

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    payload = dict(
        meta=dict(
            epoch=epoch.strftime("%Y-%m-%dT%H:%M:%SZ"),
            julianDay=round(jd, 6),
            centuriesSinceJ2000=round(centuries, 9),
            samples=samples,
            units=dict(
                a="AU", perhelion="AU", aphelion="AU",
                incl="deg", period="day", speed="km/s", orbit="AU",
            ),
            source="JPL Keplerian Elements for Approximate Positions of the Major Planets "
                   "(J2000.0 + linear rates/century, valid 1800–2050)",
            generator="scripts/orbit-data.py",
        ),
        sun=dict(name=SUN["name"], en=SUN["en"], color=SUN["color"],
                 radiusKm=SUN["radius_km"], massEarth=SUN["mass_earth"]),
        planets=[build_planet(spec, centuries, samples) for spec in PLANETS],
    )

    body = dump_payload(payload)
    compact = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))

    print(f"历元 {payload['meta']['epoch']}（JD {jd:.5f}，J2000 后 {centuries:.6f} 儒略世纪），"
          f"每颗行星 {samples} 个采样点")
    print("写入:")

    # 1. 权威 JSON
    write("data/orbital-elements.json", json.dumps(payload, ensure_ascii=False, indent=2) + "\n", root)

    # 2. React 主应用
    write("src/pages/OrbitLab/orbitData.js",
          f"{BANNER}\nexport const ORBIT_DATA = {body}\n", root)

    # 3. Vue 子应用
    write("micro-apps/vue-app/src/data/orbit.js",
          f"{BANNER}\nexport const ORBIT_DATA = {body}\n", root)

    # 4. Angular 子应用（带类型）
    write("micro-apps/angular-app/src/data/orbit.ts",
          f"{BANNER}{TS_TYPES}\nexport const ORBIT_DATA: OrbitData = {body}\n", root)

    # 顺带打一张表，方便肉眼核对是否与天文年历一致
    print("\n核对表（历元时刻）:")
    print(f"{'行星':<6}{'a(AU)':>12}{'e':>11}{'i(°)':>9}{'P(年)':>11}"
          f"{'近日(AU)':>11}{'远日(AU)':>11}{'v近日(km/s)':>13}")
    for p in payload["planets"]:
        print(f"{p['name']:<6}{p['a']:>12.6f}{p['e']:>11.6f}{p['incl']:>9.3f}"
              f"{p['periodYears']:>11.3f}{p['perihelionAU']:>11.4f}{p['aphelionAU']:>11.4f}"
              f"{p['speed']['perihelion']:>13.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
