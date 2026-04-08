#!/usr/bin/env python3
"""Booking executor for Java -> Python automation bridge.

Supported modes:
- mock: local mock success
- always-fail: local mock failure
- selenium-headless: open target site in headless browser and try submit flow
- selenium-visible: open visible browser and try submit flow

The script always prints exactly one JSON line at the end for Java parsing.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait
except Exception:
    webdriver = None
    By = None
    EC = None
    WebDriverWait = None


DEFAULT_PROVIDER = "XLX_DEMO"
DEFAULT_TARGET_URL = "https://www.cs4hospital.cn/"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Hospital booking automation executor")
    parser.add_argument("--department", default="中医科", help="target department")
    parser.add_argument("--date", default="明天", help="preferred date")
    parser.add_argument("--mode", default="mock", help="execution mode")
    parser.add_argument("--target-url", default=DEFAULT_TARGET_URL, help="booking site url")
    parser.add_argument("--timeout-sec", type=float, default=25.0, help="max browser wait seconds")
    parser.add_argument("--trace-id", default="", help="trace id from Java")
    return parser


def now_ts() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def ensure_utf8_stdio() -> None:
    # Ensure Java bridge always receives UTF-8 text on Windows/legacy locales.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def emit(data: Dict[str, Any]) -> int:
    print(json.dumps(data, ensure_ascii=False))
    return 0


def build_failure(args: argparse.Namespace, code: str, message: str, **extra: Any) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "status": "failed",
        "errorCode": code,
        "message": message,
        "provider": DEFAULT_PROVIDER,
        "department": args.department,
        "date": args.date,
        "mode": args.mode,
    }
    if args.trace_id:
        payload["traceId"] = args.trace_id
    payload.update(extra)
    return payload


def build_success(args: argparse.Namespace, message: str, **extra: Any) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "status": "success",
        "message": message,
        "provider": DEFAULT_PROVIDER,
        "department": args.department,
        "date": args.date,
        "mode": args.mode,
    }
    if args.trace_id:
        payload["traceId"] = args.trace_id
    payload.update(extra)
    return payload


def run_mock(args: argparse.Namespace) -> Dict[str, Any]:
    if args.mode == "always-fail":
        return build_failure(args, "MOCK_FORCED_FAILURE", "Mock booking failed by mode setting")

    queue_no = random.randint(20, 120)
    return build_success(
        args,
        f"Mock booking submitted for {args.department} on {args.date}",
        bookingNo=f"BOOK-{int(time.time())}-{queue_no}",
        queueNo=queue_no,
    )


def _find_input(driver: Any, selectors: list[str], timeout_sec: float = 1.5) -> Optional[Any]:
    for selector in selectors:
        try:
            element = WebDriverWait(driver, timeout_sec).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            if element:
                return element
        except Exception:
            continue
    return None


def _click_candidates(driver: Any, xpath_list: list[str], timeout_sec: float = 1.5) -> bool:
    for xpath in xpath_list:
        try:
            button = WebDriverWait(driver, timeout_sec).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            button.click()
            return True
        except Exception:
            continue
    return False


def _extract_booking_no(text: str) -> str:
    match = re.search(r"(?:订单号|预约号|挂号号|bookingNo)[:：\s]*([A-Za-z0-9\-]{6,})", text, flags=re.IGNORECASE)
    if match:
        return match.group(1)
    return f"BOOK-SEL-{now_ts()}"


def _extract_queue_no(text: str) -> Optional[int]:
    match = re.search(r"(?:排队号|队列号|queueNo)[:：\s]*(\d{1,6})", text, flags=re.IGNORECASE)
    if not match:
        return None
    try:
        return int(match.group(1))
    except Exception:
        return None


def _detect_manual_gate(page_text: str) -> Optional[Dict[str, str]]:
    lowered = (page_text or "").lower()
    if not lowered:
        return None

    bot_block_signals = [
        "受自动控制软件",
        "自动化软件控制",
        "automation software",
        "automated software",
        "webdriver",
        "检测到异常访问",
    ]
    if any(signal in lowered for signal in bot_block_signals):
        return {
            "code": "BOT_PROTECTION_BLOCKED",
            "message": "目标站点触发反自动化保护，当前流程需人工接管。",
        }

    manual_verification_signals = [
        "验证码",
        "人机验证",
        "滑块",
        "请先登录",
        "实名",
        "security check",
        "verify you are human",
    ]
    if any(signal in lowered for signal in manual_verification_signals):
        return {
            "code": "MANUAL_VERIFICATION_REQUIRED",
            "message": "页面要求人工验证（登录/验证码/实名等），请手动完成后再继续。",
        }

    return None


def run_selenium(args: argparse.Namespace, visible: bool) -> Dict[str, Any]:
    if webdriver is None:
        return build_failure(
            args,
            "SELENIUM_MISSING",
            "当前 Python 环境缺少 selenium 依赖，无法启动机械臂。请先执行: python -m pip install selenium",
        )

    target_url = args.target_url or DEFAULT_TARGET_URL
    timeout_sec = max(8.0, float(args.timeout_sec or 25.0))

    logs: list[str] = []
    screenshot_path = ""
    driver = None
    browser_name = ""

    def build_chrome_options() -> Any:
        options = webdriver.ChromeOptions()
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1600,960")
        options.add_argument("--lang=zh-CN")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        if not visible:
            options.add_argument("--headless=new")
        return options

    def build_edge_options() -> Any:
        options = webdriver.EdgeOptions()
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1600,960")
        options.add_argument("--lang=zh-CN")
        if not visible:
            options.add_argument("--headless=new")
        return options

    try:
        launch_errors: list[str] = []

        try:
            driver = webdriver.Chrome(options=build_chrome_options())
            browser_name = "chrome"
        except Exception as chrome_exc:
            launch_errors.append(f"chrome: {chrome_exc}")

        if driver is None:
            try:
                driver = webdriver.Edge(options=build_edge_options())
                browser_name = "edge"
            except Exception as edge_exc:
                launch_errors.append(f"edge: {edge_exc}")

        if driver is None:
            return build_failure(
                args,
                "DRIVER_NOT_AVAILABLE",
                "未能启动 Chrome/Edge WebDriver。请安装 Chrome 或 Edge 浏览器，并确保机器可使用 Selenium Manager 下载对应驱动。",
                targetUrl=target_url,
                logs=launch_errors,
            )

        driver.set_page_load_timeout(timeout_sec)

        logs.append(f"open:{target_url}")
        logs.append(f"browser:{browser_name}")
        driver.get(target_url)

        landing_text = (driver.page_source or "")[-16000:]
        landing_gate = _detect_manual_gate(landing_text)
        if landing_gate:
            return build_failure(
                args,
                landing_gate["code"],
                landing_gate["message"],
                manualRequired=True,
                targetUrl=target_url,
                currentUrl=getattr(driver, "current_url", target_url),
                logs=logs,
            )

        # Try to close obvious popups if present.
        _click_candidates(driver, [
            "//button[contains(.,'关闭')]",
            "//button[contains(.,'我知道了')]",
            "//span[contains(.,'关闭')]",
        ], 0.8)

        department_input = _find_input(driver, [
            "input[placeholder*='科室']",
            "input[placeholder*='门诊']",
            "input[name*='department']",
            "input[id*='department']",
            "input[type='search']",
        ])
        if department_input:
            department_input.clear()
            department_input.send_keys(args.department)
            logs.append("department-filled")

        date_input = _find_input(driver, [
            "input[placeholder*='日期']",
            "input[placeholder*='时间']",
            "input[name*='date']",
            "input[id*='date']",
        ])
        if date_input:
            date_input.clear()
            date_input.send_keys(args.date)
            logs.append("date-filled")

        clicked = _click_candidates(driver, [
            "//button[contains(.,'提交')]",
            "//button[contains(.,'预约')]",
            "//button[contains(.,'挂号')]",
            "//a[contains(.,'提交')]",
            "//a[contains(.,'预约')]",
            "//a[contains(.,'挂号')]",
        ], 1.8)

        if not clicked:
            return build_failure(
                args,
                "SUBMIT_BUTTON_NOT_FOUND",
                "已打开挂号网站，但未找到可点击的提交/预约按钮（可能需要先登录或切换页面）。",
                targetUrl=target_url,
                currentUrl=getattr(driver, "current_url", target_url),
                logs=logs,
            )

        logs.append("submit-clicked")
        time.sleep(2.2)

        page_text = (driver.page_source or "")[-12000:]
        post_submit_gate = _detect_manual_gate(page_text)
        if post_submit_gate:
            return build_failure(
                args,
                post_submit_gate["code"],
                post_submit_gate["message"],
                manualRequired=True,
                targetUrl=target_url,
                currentUrl=getattr(driver, "current_url", target_url),
                logs=logs,
            )

        success_patterns = ["预约成功", "提交成功", "挂号成功", "预约申请已提交", "订单号", "预约号"]
        success_hit = any(pattern in page_text for pattern in success_patterns)

        if not success_hit:
            return build_failure(
                args,
                "SUCCESS_SIGNAL_NOT_FOUND",
                "页面已执行到提交动作，但未检测到成功回执（可能需要人工验证码/实名验证）。",
                targetUrl=target_url,
                currentUrl=getattr(driver, "current_url", target_url),
                logs=logs,
            )

        booking_no = _extract_booking_no(page_text)
        queue_no = _extract_queue_no(page_text)

        return build_success(
            args,
            "Selenium automation submitted booking request",
            bookingNo=booking_no,
            queueNo=queue_no,
            browser=browser_name,
            targetUrl=target_url,
            currentUrl=getattr(driver, "current_url", target_url),
            logs=logs,
        )

    except Exception as exc:
        if driver is not None:
            try:
                screenshot_dir = Path(__file__).resolve().parent / "screenshots"
                screenshot_dir.mkdir(parents=True, exist_ok=True)
                screenshot_path = str((screenshot_dir / f"booking-failed-{now_ts()}.png").resolve())
                driver.save_screenshot(screenshot_path)
            except Exception:
                screenshot_path = ""

        return build_failure(
            args,
            "SELENIUM_RUNTIME_ERROR",
            f"Selenium 执行异常: {exc}",
            targetUrl=target_url,
            screenshot=screenshot_path,
            logs=logs,
        )
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception:
                pass


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    ensure_utf8_stdio()
    mode = str(args.mode or "mock").strip().lower()

    time.sleep(0.15)

    if mode in {"mock", "always-fail"}:
        return emit(run_mock(args))

    if mode == "selenium-headless":
        return emit(run_selenium(args, visible=False))

    if mode == "selenium-visible":
        return emit(run_selenium(args, visible=True))

    return emit(build_failure(args, "UNSUPPORTED_MODE", f"Unsupported mode: {args.mode}"))


if __name__ == "__main__":
    sys.exit(main())
