#!/usr/bin/env python3
"""Evaluate Track3 simulation outputs against workshop fallback policies."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_RESPONSES_DIR = ROOT / "generated" / "responses"
DEFAULT_REPORT_PATH = ROOT / "generated" / "reports" / "evaluation_report.json"
DEFAULT_MARKDOWN_REPORT_PATH = ROOT / "generated" / "reports" / "evaluation_report.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate Track3 simulation response JSON files.")
    parser.add_argument(
        "--responses-dir",
        type=Path,
        default=DEFAULT_RESPONSES_DIR,
        help="Directory containing Track3 response JSON files.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=DEFAULT_REPORT_PATH,
        help="JSON report output path.",
    )
    parser.add_argument(
        "--markdown-report-path",
        type=Path,
        default=DEFAULT_MARKDOWN_REPORT_PATH,
        help="Markdown report output path (generated from the JSON report).",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with non-zero code if any result fails.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print report JSON.",
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def contains_warning(warnings: list[str], token: str) -> bool:
    normalized = token.strip().lower()
    return any(normalized in warning.strip().lower() for warning in warnings)


def evaluate_response(payload: dict[str, Any]) -> tuple[bool, list[str]]:
    run_context = payload.get("runContext", {})
    response = payload.get("response", {})
    mode = run_context.get("mode", "")
    retry_policy = run_context.get("retryPolicy", {})
    tool_status = payload.get("toolStatus", {})

    overall_status = response.get("overallStatus", "")
    warnings = response.get("warnings", [])
    links = response.get("evidenceLinks", [])
    source_trace = response.get("sourceTrace", [])
    quality_checks = response.get("qualityChecks", {})
    traced_iq = {item.get("iq") for item in source_trace if isinstance(item, dict)}

    reasons: list[str] = []
    passed = True

    if retry_policy.get("maxRetries") != 3 or retry_policy.get("retryDelaysSec") != [5, 10, 20]:
        passed = False
        reasons.append("retry policy must be maxRetries=3 with delays [5, 10, 20]")

    if mode in {"normal", "tool-a-transient", "tool-b-transient"}:
        if overall_status != "pass":
            passed = False
            reasons.append(f"expected overallStatus=pass but got {overall_status}")
        if not quality_checks.get("hasStructuredMetric", False):
            passed = False
            reasons.append("structured metric missing")
        if len(links) < 2:
            passed = False
            reasons.append("evidence links < 2")
        if warnings:
            passed = False
            reasons.append("warnings should be empty in pass mode")
        if traced_iq != {"FabricIQ", "WorkIQ"}:
            passed = False
            reasons.append("sourceTrace must identify FabricIQ and WorkIQ")
    elif mode == "tool-a-down":
        if overall_status != "partial":
            passed = False
            reasons.append(f"expected partial for tool-a-down but got {overall_status}")
        if not contains_warning(warnings, "정형 수치 미검증"):
            passed = False
            reasons.append("missing warning: 정형 수치 미검증")
        if tool_status.get("toolA", {}).get("attempts") != 4:
            passed = False
            reasons.append("tool-a-down must record initial call plus 3 retries")
    elif mode == "tool-b-down":
        if overall_status != "partial":
            passed = False
            reasons.append(f"expected partial for tool-b-down but got {overall_status}")
        if not contains_warning(warnings, "업무 문서 근거 없음"):
            passed = False
            reasons.append("missing warning: 업무 문서 근거 없음")
        if tool_status.get("toolB", {}).get("attempts") != 4:
            passed = False
            reasons.append("tool-b-down must record initial call plus 3 retries")
    elif mode == "both-down":
        if overall_status != "blocked":
            passed = False
            reasons.append(f"expected blocked for both-down but got {overall_status}")
        if links:
            passed = False
            reasons.append("both-down must not return evidence links")
        if (
            tool_status.get("toolA", {}).get("attempts") != 4
            or tool_status.get("toolB", {}).get("attempts") != 4
        ):
            passed = False
            reasons.append("both-down must record initial call plus 3 retries per tool")
    else:
        passed = False
        reasons.append(f"unknown mode: {mode}")

    return passed, reasons


def render_markdown_report(report: dict[str, Any]) -> str:
    """Render the evaluation JSON report as a human-readable Markdown document."""
    lines: list[str] = []
    lines.append("# Track3 Evaluation Report")
    lines.append("")
    lines.append(f"- responsesDir: `{report['responsesDir']}`")
    lines.append(f"- total: {report['total']}")
    lines.append(f"- passed: {report['passed']}")
    lines.append(f"- failed: {report['failed']}")
    lines.append("")
    lines.append("## Results")
    lines.append("")
    lines.append("| Scenario | Mode | Result | Reasons |")
    lines.append("| --- | --- | --- | --- |")
    for row in report["results"]:
        status = "✅ PASS" if row["passed"] else "❌ FAIL"
        reasons = "; ".join(row["reasons"]) if row["reasons"] else "-"
        lines.append(f"| {row['scenarioId']} | {row['mode']} | {status} | {reasons} |")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    args = parse_args()
    responses_dir = args.responses_dir.resolve()
    report_path = args.report_path.resolve()
    markdown_report_path = args.markdown_report_path.resolve()

    if not responses_dir.is_dir():
        raise RuntimeError(f"Responses directory not found: {responses_dir}")

    files = sorted(responses_dir.glob("*.json"))
    if not files:
        raise RuntimeError(f"No response files found in: {responses_dir}")

    results: list[dict[str, Any]] = []
    failed_count = 0

    for file_path in files:
        payload = load_json(file_path)
        passed, reasons = evaluate_response(payload)
        if not passed:
            failed_count += 1
        results.append(
            {
                "file": str(file_path),
                "scenarioId": payload.get("runContext", {}).get("scenarioId"),
                "mode": payload.get("runContext", {}).get("mode"),
                "passed": passed,
                "reasons": reasons,
            }
        )

    report = {
        "responsesDir": str(responses_dir),
        "total": len(results),
        "passed": len(results) - failed_count,
        "failed": failed_count,
        "results": results,
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    if args.pretty:
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        report_path.write_text(json.dumps(report, ensure_ascii=False), encoding="utf-8")

    # Markdown report is always generated from the JSON report right after it is written.
    markdown_report_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_report_path.write_text(render_markdown_report(report), encoding="utf-8")

    print("[Track3 Evaluation]")
    print(f"- total: {report['total']}")
    print(f"- passed: {report['passed']}")
    print(f"- failed: {report['failed']}")
    print(f"- report (json): {report_path}")
    print(f"- report (markdown): {markdown_report_path}")

    if args.strict and failed_count > 0:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
