"""本地媒体中心演示脚本：零第三方依赖，直接在本目录生成一张 SVG。
运行后，页面「Python 效果」区会把 effect_output.svg 作为本次新产物展示出来。"""
import os

svg = """<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1677ff"/>
      <stop offset="1" stop-color="#722ed1"/>
    </linearGradient>
  </defs>
  <rect width="480" height="240" rx="16" fill="url(#g)"/>
  <circle cx="240" cy="104" r="58" fill="rgba(255,255,255,0.9)"/>
  <text x="240" y="114" font-size="26" text-anchor="middle" fill="#1677ff" font-family="sans-serif">Hello Python</text>
  <text x="240" y="192" font-size="15" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="sans-serif">本地媒体中心 · python3 运行产物</text>
</svg>
"""

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "effect_output.svg")
with open(out, "w", encoding="utf-8") as f:
    f.write(svg)
print("已生成:", out)
