#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
 项目全页面逻辑测试 · Python 自动化 E2E
=====================================================================
自动启动 Vite dev server，用 Playwright 模拟真实用户：
  登录 → 逐页访问 → 检查关键元素渲染 → 代表性交互验证

用法:
  pip install -r tests/requirements.txt
  playwright install chromium
  python tests/test_pages.py

可选环境变量:
  BASE_URL   已运行的 dev server 地址（设置后跳过自动启动）
  KEEP_OPEN   =1 时测试结束不关闭浏览器（便于调试）
=====================================================================
"""
import os
import re
import sys
import time
import signal
import socket
import pathlib
import subprocess

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    print("缺少依赖，请先安装：")
    print("  pip install -r tests/requirements.txt")
    print("  playwright install chromium")
    sys.exit(1)

# —— 配置 ——————————————————————————————————————————————
ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_PORT = 5173
BASE = os.environ.get("BASE_URL", "").rstrip("/") or None
KEEP_OPEN = os.environ.get("KEEP_OPEN") == "1"
TIMEOUT = 8000  # 单步超时 ms

# —— 测试用例配置 ——————————————————————————————————————
# path: 路由 / name: 用例名 / texts: 页面应包含的文本 / selector: 至少存在的元素
CASES = [
    {"path": "/login", "name": "星空登录页", "texts": ["星际控制台", "访问密钥"], "selector": "form"},
    {"path": "/", "name": "首页·周天星辰大阵", "texts": ["欢迎来到首页", "周天星辰"], "selector": ".sa-array"},
    {"path": "/about", "name": "关于页", "texts": ["关于"], "selector": "h1"},
    {"path": "/dashboard", "name": "控制台", "texts": ["控制台"], "selector": ".page-card"},
    {"path": "/scan", "name": "扫码", "texts": ["扫码"], "selector": ".page-card"},
    {"path": "/embed", "name": "嵌套预览", "texts": ["嵌套"], "selector": ".embed-page"},
    {"path": "/agent", "name": "AI Agent", "texts": ["Agent"], "selector": ".agent-container"},
    {"path": "/voice", "name": "语音助手", "texts": ["语音"], "selector": ".page-card"},
    {"path": "/form-builder", "name": "配置表单", "texts": ["表单"], "selector": "h1"},
    {"path": "/theme", "name": "主题切换", "texts": ["主题"], "selector": ".theme-toggle"},
    {"path": "/charts", "name": "SVG 图表", "texts": ["图表"], "selector": "svg"},
    {"path": "/command-palette", "name": "命令面板", "texts": ["命令"], "selector": ".page-card"},
    {"path": "/notify", "name": "通知中心", "texts": ["通知"], "selector": ".page-card"},
    {"path": "/data-table", "name": "高级表格", "texts": ["表格"], "selector": "table"},
]


def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def wait_for_server(url, timeout=60):
    import urllib.request
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=2)
            return True
        except Exception:
            time.sleep(0.5)
    return False


def start_dev_server():
    """启动 Vite dev server，返回 (proc, base_url)"""
    port = DEFAULT_PORT
    while port_in_use(port):
        port += 1
    print(f"[setup] 启动 dev server 于端口 {port} ...")
    proc = subprocess.Popen(
        ["npm", "run", "dev", "--", "--port", str(port), "--strictPort"],
        cwd=str(ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, "CI": "true"},
    )
    base = f"http://127.0.0.1:{port}"
    if not wait_for_server(base):
        proc.terminate()
        raise RuntimeError("dev server 启动超时")
    print(f"[setup] dev server 就绪: {base}")
    return proc, base


def login(page, base):
    """走 UI 登录流程获取受保护路由访问权"""
    print("\n[flow] 登录流程")
    page.goto(f"{base}/login", wait_until="load")
    # 用户名/密码输入框
    page.fill('input[type="text"], input[name="username"]', "admin")
    page.fill('input[type="password"], input[name="password"]', "admin")
    page.click('button[type="submit"]')
    try:
        page.wait_for_url(f"{base}/", timeout=TIMEOUT)
        print("  ✓ 登录成功，跳转首页")
        return True
    except PWTimeout:
        print("  ✗ 登录后未跳转首页")
        return False


def run_case(page, base, case):
    """单个页面测试：访问 + 关键文本 + 选择器"""
    url = f"{base}{case['path']}"
    page.goto(url, wait_until="load")
    # 等待关键元素出现，确保 React 已渲染
    page.wait_for_selector(case["selector"], timeout=10000)
    title = page.title()
    body = page.inner_text("body")

    errors = []
    # 关键文本
    for t in case.get("texts", []):
        if t not in body:
            errors.append(f"缺少文本「{t}」")
    # 关键元素
    sel = case.get("selector")
    if sel and page.locator(sel).count() == 0:
        errors.append(f"缺少元素 {sel}")

    return {
        "path": case["path"],
        "name": case["name"],
        "title": title,
        "pass": not errors,
        "errors": errors,
    }


def interaction_tests(page, base):
    """代表性交互逻辑验证"""
    results = []

    # 1) 首页计数器
    try:
        page.goto(f"{base}/", wait_until="load")
        btn = page.locator("button", has_text="点击计数").first
        if btn.count():
            before = btn.inner_text()
            btn.click()
            time.sleep(0.3)
            after = btn.inner_text()
            ok = after != before
            results.append({"name": "首页计数器点击自增", "pass": ok,
                             "detail": f"{before} → {after}"})
        else:
            results.append({"name": "首页计数器点击自增", "pass": False,
                             "detail": "未找到计数按钮"})
    except Exception as e:
        results.append({"name": "首页计数器点击自增", "pass": False, "detail": str(e)})

    # 2) 周天星辰点击弹出详情
    try:
        page.goto(f"{base}/", wait_until="load")
        star = page.locator(".sa-star").first
        if star.count():
            star.click(force=True)
            time.sleep(0.4)
            dialog = page.locator(".sa-modal, [role='dialog']").count() > 0
            results.append({"name": "周天星辰点击弹详情", "pass": dialog,
                             "detail": "弹窗已出现" if dialog else "未弹出详情"})
        else:
            results.append({"name": "周天星辰点击弹详情", "pass": False,
                             "detail": "无星点元素"})
    except Exception as e:
        results.append({"name": "周天星辰点击弹详情", "pass": False, "detail": str(e)})

    # 3) 命令面板 Cmd+K 唤起
    try:
        page.goto(f"{base}/command-palette", wait_until="load")
        page.wait_for_selector(".demo-hint-box", timeout=10000)
        time.sleep(0.6)  # 等待 CommandPalette 全局键盘监听注册
        page.keyboard.press("ControlOrMeta+K")
        time.sleep(0.6)
        opened = page.locator("[role='dialog'], .cp-overlay, .cp-input").count() > 0
        results.append({"name": "命令面板 Cmd+K 唤起", "pass": opened,
                         "detail": "面板已打开" if opened else "未唤起"})
        page.keyboard.press("Escape")
    except Exception as e:
        results.append({"name": "命令面板 Cmd+K 唤起", "pass": False, "detail": str(e)})

    # 4) 通知中心 Toast 弹出
    try:
        page.goto(f"{base}/notify", wait_until="load")
        btn = page.locator(".btn--success").first
        if btn.count():
            btn.click()
            time.sleep(0.4)
            toast = page.locator(".notif-toast, [class*='toast']").count() > 0
            results.append({"name": "通知中心 Toast 弹出", "pass": toast,
                             "detail": "Toast 已出现" if toast else "无 Toast"})
        else:
            results.append({"name": "通知中心 Toast 弹出", "pass": False,
                             "detail": "未找到触发按钮"})
    except Exception as e:
        results.append({"name": "通知中心 Toast 弹出", "pass": False, "detail": str(e)})

    # 5) 测试中心前端测试套件全过（点击运行并抓取失败用例名）
    try:
        page.goto(f"{base}/test-center", wait_until="load")
        page.locator(".tc-run-all").click()
        # 等待运行完成：进度条 100%
        page.wait_for_function(
            "() => { const b = document.querySelector('.tc-progress-bar');"
            " return b && b.style.width === '100%'; }",
            timeout=60000,
        )
        time.sleep(0.8)
        fail_names = page.locator(".tc-fail .tc-name").all_inner_texts()
        ok = len(fail_names) == 0
        detail = "全过" if ok else "失败: " + "；".join(fail_names)
        results.append({"name": "前端测试套件全过", "pass": ok, "detail": detail})
    except Exception as e:
        results.append({"name": "前端测试套件全过", "pass": False, "detail": str(e)})

    return results


def print_report(page_results, inter_results):
    print("\n" + "=" * 64)
    print(" 测试报告")
    print("=" * 64)
    total = len(page_results) + len(inter_results)
    passed = sum(1 for r in page_results if r["pass"]) + sum(1 for r in inter_results if r["pass"])

    print(f"\n【页面渲染测试】 {sum(1 for r in page_results if r['pass'])}/{len(page_results)}")
    for r in page_results:
        mark = "✓" if r["pass"] else "✗"
        line = f"  {mark} [{r['path']}] {r['name']}"
        if r["errors"]:
            line += "  " + "；".join(r["errors"])
        print(line)

    print(f"\n【交互逻辑测试】 {sum(1 for r in inter_results if r['pass'])}/{len(inter_results)}")
    for r in inter_results:
        mark = "✓" if r["pass"] else "✗"
        print(f"  {mark} {r['name']}  — {r['detail']}")

    print("\n" + "=" * 64)
    print(f" 总计 {passed}/{total} 通过", end="")
    print("  ✅ 全部通过" if passed == total else "  ❌ 存在失败")
    print("=" * 64)
    return passed == total


def main():
    global BASE
    proc = None
    if not BASE:
        proc, BASE = start_dev_server()

    all_pass = False
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=not KEEP_OPEN)
            ctx = browser.new_context(viewport={"width": 1280, "height": 800})
            page = ctx.new_page()
            page.set_default_timeout(TIMEOUT)

            if not login(page, BASE):
                print("[fatal] 登录失败，无法继续受保护页面测试")
                browser.close()
                return

            page_results = [run_case(page, BASE, c) for c in CASES]
            inter_results = interaction_tests(page, BASE)
            all_pass = print_report(page_results, inter_results)

            browser.close()
    finally:
        if proc:
            print("\n[teardown] 关闭 dev server")
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
