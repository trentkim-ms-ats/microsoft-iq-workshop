#!/usr/bin/env python3
"""Evaluate Track4 FoundryIQ Microsoft IQ workshop simulation outputs and build the final briefing."""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DEFAULT_RESPONSES_DIR = ROOT / "generated" / "microsoft_iq_responses"
DEFAULT_REPORT_PATH = ROOT / "generated" / "reports" / "microsoft_iq_evaluation_report.json"
DEFAULT_MARKDOWN_REPORT_PATH = ROOT / "generated" / "reports" / "microsoft_iq_evaluation_report.md"
DEFAULT_BRIEFING_PATH = ROOT / "generated" / "reports" / "microsoft_iq_leadership_briefing.md"
DEFAULT_SOURCE_CATALOG = ROOT.parent.parent / "track3" / "data" / "source_catalog.json"
EXPECTED_IQ = {"FabricIQ", "WorkIQ", "WebIQ", "FoundryIQ"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate Microsoft IQ workshop simulation responses.")
    parser.add_argument("--responses-dir", type=Path, default=DEFAULT_RESPONSES_DIR)
    parser.add_argument("--report-path", type=Path, default=DEFAULT_REPORT_PATH)
    parser.add_argument("--markdown-report-path", type=Path, default=DEFAULT_MARKDOWN_REPORT_PATH)
    parser.add_argument("--briefing-path", type=Path, default=DEFAULT_BRIEFING_PATH)
    parser.add_argument("--source-catalog", type=Path, default=DEFAULT_SOURCE_CATALOG)
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--pretty", action="store_true")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise RuntimeError(f"File not found: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError(f"Expected a JSON object: {path}")
    return payload


def has_warning(warnings: list[str], token: str) -> bool:
    return any(token in warning for warning in warnings)


def validate_web_citations(
    citations: list[dict[str, Any]],
    *,
    scenario_id: str,
    execution_mode: str,
    source_catalog: dict[str, Any],
) -> list[str]:
    reasons: list[str] = []
    required = {"title", "url", "domain", "observedAt", "scope", "factStatus", "limitations"}
    catalog_rows = source_catalog.get("scenarios", [])
    catalog_row = next(
        (
            row
            for row in catalog_rows
            if isinstance(row, dict) and row.get("scenarioId") == scenario_id
        ),
        None,
    )
    if catalog_row is None:
        return [f"source catalog missing scenario: {scenario_id}"]

    allowed_domains = set(catalog_row.get("allowedDomains", []))
    for item in citations:
        missing = required - set(item)
        if missing:
            reasons.append(f"web citation missing fields: {sorted(missing)}")
            continue
        parsed = urlparse(str(item["url"]))
        if parsed.scheme != "https" or parsed.hostname != item["domain"]:
            reasons.append(f"invalid web citation URL/domain: {item.get('id', '-')}")
        if item["domain"] not in allowed_domains:
            reasons.append(f"web citation domain is not allowed for {scenario_id}: {item['domain']}")
        try:
            datetime.fromisoformat(str(item["observedAt"]))
        except ValueError:
            reasons.append(f"invalid observedAt: {item.get('id', '-')}")
        expected_fact_status = "fixture-contract" if execution_mode == "simulation" else "live-observation"
        if item["factStatus"] != expected_fact_status:
            reasons.append(
                f"{execution_mode} citation must use factStatus={expected_fact_status}: "
                f"{item.get('id', '-')}"
            )
        if not isinstance(item["limitations"], list) or not item["limitations"]:
            reasons.append(f"limitations must be a non-empty array: {item.get('id', '-')}")
    return reasons


def evaluate_response(
    payload: dict[str, Any],
    *,
    source_catalog: dict[str, Any],
) -> tuple[bool, list[str]]:
    run_context = payload.get("runContext", {})
    response = payload.get("response", {})
    tool_status = payload.get("toolStatus", {})
    mode = run_context.get("mode")
    scenario_id = str(run_context.get("scenarioId", ""))
    execution_mode = str(run_context.get("executionMode", ""))
    warnings = response.get("warnings", [])
    traces = {
        item.get("iq")
        for item in response.get("sourceTrace", [])
        if isinstance(item, dict)
    }
    checks = response.get("qualityChecks", {})
    guardrails = response.get("guardrails", {})
    notices = response.get("notices", [])
    work_links = response.get("workEvidenceLinks", [])
    web_citations = response.get("webCitations", [])
    reasons: list[str] = []
    minimum_citations = int(
        source_catalog.get("policy", {}).get("minimumCitationsPerScenario", 2)
    )
    catalog_scenario_ids = {
        row.get("scenarioId")
        for row in source_catalog.get("scenarios", [])
        if isinstance(row, dict)
    }

    if scenario_id not in catalog_scenario_ids:
        reasons.append(f"source catalog missing scenario: {scenario_id}")
    if execution_mode != "simulation":
        reasons.append(f"Microsoft IQ workshop simulation evaluator requires executionMode=simulation, got {execution_mode}")
    retry_policy = run_context.get("retryPolicy", {})
    max_retries = retry_policy.get("maxRetries")
    retry_delays = retry_policy.get("retryDelaysSec")
    if max_retries is None or max_retries < 1:
        reasons.append("retry policy must define maxRetries >= 1")
    if not isinstance(retry_delays, list) or len(retry_delays) == 0:
        reasons.append("retry policy must define retryDelaysSec as a non-empty list")
    if not guardrails.get("webContentIsDataNotInstruction"):
        reasons.append("web prompt-injection guardrail missing")
    if guardrails.get("sensitiveDataInWebQuery") is not False:
        reasons.append("web query privacy check missing")
    if not guardrails.get("humanApprovalRequired"):
        reasons.append("human approval guardrail missing")
    if run_context.get("executionMode") == "simulation" and not any("fixture" in str(notice) for notice in notices):
        reasons.append("simulation fixture notice missing")
    if web_citations:
        reasons.extend(
            validate_web_citations(
                web_citations,
                scenario_id=scenario_id,
                execution_mode=execution_mode,
                source_catalog=source_catalog,
            )
        )

    status = response.get("overallStatus")
    pass_modes = {"normal", "fabric-transient", "work-transient", "web-transient"}
    if mode in pass_modes:
        if status != "pass":
            reasons.append(f"expected pass but got {status}")
        if traces != EXPECTED_IQ:
            reasons.append("sourceTrace must identify FabricIQ, WorkIQ, WebIQ, and FoundryIQ")
        if not checks.get("hasStructuredMetric"):
            reasons.append("structured metric missing")
        if len(work_links) < 2:
            reasons.append("WorkIQ evidence links < 2")
        if len(web_citations) < minimum_citations:
            reasons.append(f"WebIQ citations < {minimum_citations}")
        if not checks.get("hasAllIQ"):
            reasons.append("all four IQ responsibilities must be present")
        if warnings:
            reasons.append("warnings should be empty in pass mode")
    elif mode == "fabric-down":
        if status != "partial" or not has_warning(warnings, "정형 수치 미검증"):
            reasons.append("fabric-down must be partial with structured metric warning")
        if tool_status.get("fabric", {}).get("attempts") != 4:
            reasons.append("fabric-down must record four attempts")
        if len(web_citations) < minimum_citations:
            reasons.append("fabric-down must retain WebIQ citations")
    elif mode == "work-down":
        if status != "partial" or not has_warning(warnings, "업무 문서 근거 없음"):
            reasons.append("work-down must be partial with WorkIQ warning")
        if tool_status.get("work", {}).get("attempts") != 4:
            reasons.append("work-down must record four attempts")
        if len(web_citations) < minimum_citations:
            reasons.append("work-down must retain WebIQ citations")
    elif mode == "web-down":
        if status != "partial" or not has_warning(warnings, "외부 최신 근거 없음"):
            reasons.append("web-down must be partial with WebIQ warning")
        if tool_status.get("web", {}).get("attempts") != 4:
            reasons.append("web-down must record four attempts")
    elif mode == "internal-down":
        if status != "blocked" or not has_warning(warnings, "내부 근거 없음"):
            reasons.append("internal-down must block public-web-only business analysis")
        if tool_status.get("fabric", {}).get("attempts") != 4:
            reasons.append("internal-down FabricIQ attempts must be four")
        if tool_status.get("work", {}).get("attempts") != 4:
            reasons.append("internal-down WorkIQ attempts must be four")
        if len(web_citations) < minimum_citations:
            reasons.append("internal-down should retain WebIQ citations as non-business context")
    elif mode == "all-down":
        if status != "blocked":
            reasons.append("all-down must be blocked")
        if response.get("evidenceLinks"):
            reasons.append("all-down must not return evidence links")
        if any(tool_status.get(name, {}).get("attempts") != 4 for name in ("fabric", "work", "web")):
            reasons.append("all-down must record four attempts per tool")
    else:
        reasons.append(f"unknown mode: {mode}")

    return not reasons, reasons


def render_report(report: dict[str, Any]) -> str:
    lines = [
        "# Track4 FoundryIQ Microsoft IQ Workshop Evaluation Report",
        "",
        f"- total: {report['total']}",
        f"- passed: {report['passed']}",
        f"- failed: {report['failed']}",
        "",
        "| Scenario | Mode | Result | Reasons |",
        "|---|---|---|---|",
    ]
    for row in report["results"]:
        status = "PASS" if row["passed"] else "FAIL"
        reasons = "; ".join(row["reasons"]) or "-"
        lines.append(f"| {row['scenarioId']} | {row['mode']} | {status} | {reasons} |")
    return "\n".join(lines) + "\n"


def build_briefing(normal_payloads: list[dict[str, Any]]) -> str:
    lines = [
        "# Track4 FoundryIQ Microsoft IQ Workshop Leadership Briefing",
        "",
        "> simulation reference: 현재 웹 사실이 아니라 교육용 WebIQ fixture를 사용했습니다.",
        "",
        "## Executive Summary",
        "",
    ]
    actions: list[str] = []
    web_links: list[dict[str, Any]] = []
    work_links: list[dict[str, Any]] = []
    for payload in normal_payloads:
        response = payload["response"]
        lines.append(f"- **{response['question']}**: {response['summary']}")
        actions.extend(response.get("recommendedActions", []))
        web_links.extend(response.get("webCitations", []))
        work_links.extend(response.get("workEvidenceLinks", []))

    lines.extend(["", "## Recommended Actions", ""])
    lines.extend(f"- {action}" for action in dict.fromkeys(actions))
    lines.extend(["", "## WorkIQ Evidence", "", "| Title | Source | Reference |", "|---|---|---|"])
    for item in work_links:
        reference = item.get("location") or item.get("target") or "-"
        lines.append(f"| {item.get('title', '-')} | {item.get('source', '-')} | {reference} |")
    lines.extend(["", "## WebIQ Citations", "", "| Title | Scope | URL |", "|---|---|---|"])
    for item in web_links:
        lines.append(f"| {item.get('title', '-')} | {item.get('scope', '-')} | {item.get('url', '-')} |")
    lines.extend(
        [
            "",
            "## Source Responsibility",
            "",
            "- FabricIQ: 내부 정형 지표",
            "- WorkIQ: 권한이 적용된 내부 업무 근거",
            "- WebIQ: 공개 웹의 외부 근거",
            "- FoundryIQ + Foundry Agent Service: 권위 지식, 라우팅, 결합, 평가, 최종 문장화",
            "",
            "모든 실행 조치는 담당자 승인 후 수행합니다.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    args = parse_args()
    responses_dir = args.responses_dir.resolve()
    source_catalog = load_json(args.source_catalog.resolve())
    files = sorted(responses_dir.glob("*.json"))
    if not files:
        raise RuntimeError(f"No response files found in: {responses_dir}")

    results: list[dict[str, Any]] = []
    normal_payloads: dict[str, dict[str, Any]] = {}
    for path in files:
        payload = load_json(path)
        passed, reasons = evaluate_response(payload, source_catalog=source_catalog)
        context = payload.get("runContext", {})
        results.append(
            {
                "file": str(path),
                "scenarioId": context.get("scenarioId"),
                "mode": context.get("mode"),
                "passed": passed,
                "reasons": reasons,
            }
        )
        if context.get("mode") == "normal":
            normal_payloads[str(context.get("scenarioId"))] = payload

    failed = sum(not row["passed"] for row in results)
    report = {
        "responsesDir": str(responses_dir),
        "total": len(results),
        "passed": len(results) - failed,
        "failed": failed,
        "results": results,
    }

    report_path = args.report_path.resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2 if args.pretty else None),
        encoding="utf-8",
    )
    markdown_path = args.markdown_report_path.resolve()
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(render_report(report), encoding="utf-8")

    briefing_path: Path | None = None
    if set(normal_payloads) == {"Q1", "Q2", "Q3"}:
        briefing_path = args.briefing_path.resolve()
        briefing_path.parent.mkdir(parents=True, exist_ok=True)
        briefing_path.write_text(
            build_briefing([normal_payloads[scenario_id] for scenario_id in ("Q1", "Q2", "Q3")]),
            encoding="utf-8",
        )

    print("[Track4 FoundryIQ Microsoft IQ Workshop Evaluation]")
    print(f"- total: {report['total']}")
    print(f"- passed: {report['passed']}")
    print(f"- failed: {report['failed']}")
    print(f"- report: {report_path}")
    print(f"- briefing: {briefing_path or '(not generated: Q1-Q3 normal responses required)'}")
    if args.strict and failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
