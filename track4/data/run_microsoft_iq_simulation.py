#!/usr/bin/env python3
"""Run Track4 FoundryIQ Microsoft IQ workshop simulations without changing the legacy two-source Microsoft IQ baseline harness."""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = ROOT / "generated"
DEFAULT_WEB_FIXTURE = ROOT.parent.parent / "track3" / "data" / "web_evidence_fixture.json"
DEFAULT_RESPONSE_DIR = ROOT / "generated" / "microsoft_iq_responses"
MODES = {
    "normal",
    "fabric-down",
    "work-down",
    "web-down",
    "internal-down",
    "all-down",
    "fabric-transient",
    "work-transient",
    "web-transient",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Simulate Track4 FoundryIQ orchestration of FabricIQ, WorkIQ, and WebIQ."
    )
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--web-fixture", type=Path, default=DEFAULT_WEB_FIXTURE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_RESPONSE_DIR)
    parser.add_argument("--scenario-id", action="append")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--mode", choices=sorted(MODES), default="normal")
    parser.add_argument("--max-retries", type=int, default=3)
    parser.add_argument("--retry-delays", default="5,10,20")
    parser.add_argument("--simulate-wait", action="store_true")
    parser.add_argument("--pretty", action="store_true")
    parser.add_argument("--pipeline-version", default="microsoft-iq-sim-v1")
    parser.add_argument("--prompt-version", default="microsoft-iq-prompt-v1")
    parser.add_argument("--model-version", default="foundry-responses-v1")
    parser.add_argument("--toolset-version", default="fabriciq-v1+workiq-v1+webiq-v1")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise RuntimeError(f"Required JSON file not found: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError(f"Expected a JSON object: {path}")
    return payload


def parse_retry_delays(value: str, max_retries: int) -> list[int]:
    delays = [int(chunk.strip()) for chunk in value.split(",") if chunk.strip()]
    if len(delays) < max_retries:
        delays.extend([delays[-1] if delays else 0] * (max_retries - len(delays)))
    return delays[:max_retries]


def should_fail(mode: str, tool_name: str, attempt: int) -> bool:
    permanent_failures = {
        "fabric-down": {"fabric"},
        "work-down": {"work"},
        "web-down": {"web"},
        "internal-down": {"fabric", "work"},
        "all-down": {"fabric", "work", "web"},
    }
    if tool_name in permanent_failures.get(mode, set()):
        return True
    return mode == f"{tool_name}-transient" and attempt == 1


def execute_tool(
    *,
    tool_name: str,
    payload: dict[str, Any],
    mode: str,
    max_retries: int,
    retry_delays: list[int],
    simulate_wait: bool,
) -> dict[str, Any]:
    logs: list[dict[str, Any]] = []
    for attempt in range(1, max_retries + 2):
        if not should_fail(mode, tool_name, attempt):
            logs.append({"attempt": attempt, "status": "ok"})
            return {"status": "ok", "attempts": attempt, "logs": logs, "payload": payload}
        logs.append({"attempt": attempt, "status": "fail", "error": "simulated_tool_failure"})
        if attempt <= max_retries and simulate_wait:
            time.sleep(retry_delays[attempt - 1])
    return {"status": "fail", "attempts": max_retries + 1, "logs": logs, "payload": None}


def trace(iq: str, role: str, origin: str, scenario: dict[str, Any]) -> dict[str, Any]:
    return {
        "iq": iq,
        "role": role,
        "origin": origin,
        "semanticKeys": scenario.get("semanticKeys", []),
    }


def compose_response(
    *,
    scenario: dict[str, Any],
    fabric_result: dict[str, Any],
    work_result: dict[str, Any],
    web_result: dict[str, Any],
    fixture_notice: str,
) -> dict[str, Any]:
    fabric_ok = fabric_result["status"] == "ok"
    work_ok = work_result["status"] == "ok"
    web_ok = web_result["status"] == "ok"
    internal_ok = fabric_ok or work_ok

    key_findings: list[str] = []
    work_evidence: list[dict[str, Any]] = []
    web_citations: list[dict[str, Any]] = []
    warnings: list[str] = []
    source_trace: list[dict[str, Any]] = []

    if fabric_ok and fabric_result["payload"]:
        key_findings.extend(fabric_result["payload"].get("highlights", []))
        source_trace.append(trace("FabricIQ", "structured", "track1-csv-simulation", scenario))
    if work_ok and work_result["payload"]:
        work_evidence = work_result["payload"].get("evidence", [])[:5]
        source_trace.append(trace("WorkIQ", "work-context", "track2-manifest-simulation", scenario))
    # web_citations is populated here (lines 135-136) BEFORE the internal_ok check below.
    # In internal-down mode (fabric=fail, work=fail, web=ok), web_citations is intentionally
    # retained so evaluate_microsoft_iq_outputs.py can assert len(web_citations) >= minimum_citations.
    # Do NOT move or clear web_citations inside the `if not internal_ok` block unless web_ok is also False.
    if web_ok and web_result["payload"]:
        web_citations = web_result["payload"].get("evidence", [])
        source_trace.append(trace("WebIQ", "public-web", "webiq-fixture-simulation", scenario))

    source_trace.append(trace("FoundryIQ", "orchestrator", "microsoft-iq-rules-simulation", scenario))

    if not internal_ok:
        overall_status = "blocked"
        key_findings = ["내부 정형·업무 근거가 없어 공개 웹만으로 기업 원인을 분석하지 않습니다."]
        warnings.append("내부 근거 없음: 비즈니스 브리핑 생성을 중단합니다.")
        actions = [
            "FabricIQ와 WorkIQ 연결을 복구합니다.",
            "복구 후 동일 질문으로 내부 근거를 먼저 재수집합니다.",
        ]
        # Only clear web_citations when web is also down; if web is up in internal-down mode,
        # web_citations must be preserved — the evaluator asserts their presence (see evaluate_microsoft_iq_outputs.py).
        if not web_ok:
            web_citations = []
    else:
        overall_status = "pass" if fabric_ok and work_ok and web_ok else "partial"
        if not fabric_ok:
            warnings.append("정형 수치 미검증")
        if not work_ok:
            warnings.append("업무 문서 근거 없음")
        if not web_ok:
            warnings.append("외부 최신 근거 없음")
        actions = [
            "내부 지표와 외부 사건의 시간·지역·제품 범위를 교차 확인합니다.",
            "자동 실행 전에 담당자의 승인을 받습니다.",
        ]

    combined_links: list[dict[str, Any]] = []
    combined_links.extend({**item, "iq": "WorkIQ"} for item in work_evidence)
    combined_links.extend({**item, "iq": "WebIQ"} for item in web_citations)

    return {
        "question": scenario["question"],
        "overallStatus": overall_status,
        "summary": f"{scenario['id']} Microsoft IQ workshop 실행 결과: {overall_status}",
        "keyFindings": key_findings,
        "workEvidenceLinks": work_evidence,
        "webCitations": web_citations,
        "evidenceLinks": combined_links,
        "warnings": warnings,
        "notices": [fixture_notice],
        "recommendedActions": actions,
        "sourceTrace": source_trace,
        "guardrails": {
            "webContentIsDataNotInstruction": True,
            "sensitiveDataInWebQuery": False,
            "causalityRequiresInternalMatch": True,
            "humanApprovalRequired": True,
        },
        "qualityChecks": {
            "hasStructuredMetric": fabric_ok and bool(key_findings),
            "hasWorkEvidence": len(work_evidence) >= 2,
            "hasWebCitation": len(web_citations) >= 2,
            "hasAllIQ": fabric_ok and work_ok and web_ok,
        },
    }


def save_json(path: Path, payload: dict[str, Any], pretty: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    indent = 2 if pretty else None
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=indent), encoding="utf-8")


def main() -> None:
    args = parse_args()
    data_dir = args.data_dir.resolve()
    output_dir = args.output_dir.resolve()

    scenarios_payload = load_json(data_dir / "scenarios.json")
    fabric_metrics = load_json(data_dir / "tool_a_metrics.json")
    work_evidence = load_json(data_dir / "tool_b_evidence.json")
    web_fixture = load_json(args.web_fixture.resolve())
    web_scenarios = web_fixture.get("scenarios", {})

    scenarios = scenarios_payload.get("scenarios", [])
    scenario_by_id = {scenario["id"]: scenario for scenario in scenarios}
    if args.all:
        scenario_ids = sorted(scenario_by_id)
    elif args.scenario_id:
        scenario_ids = args.scenario_id
    else:
        raise RuntimeError("Either --all or --scenario-id must be provided.")

    unknown = [scenario_id for scenario_id in scenario_ids if scenario_id not in scenario_by_id]
    if unknown:
        raise RuntimeError(f"Unknown scenario ID(s): {unknown}")
    missing_web = [scenario_id for scenario_id in scenario_ids if scenario_id not in web_scenarios]
    if missing_web:
        raise RuntimeError(f"WebIQ fixture missing scenario ID(s): {missing_web}")

    retry_delays = parse_retry_delays(args.retry_delays, args.max_retries)
    print("[Track4 FoundryIQ Microsoft IQ workshop Simulation]")
    print(f"- mode: {args.mode}")
    print(f"- scenarios: {scenario_ids}")
    print(f"- retryPolicy: maxRetries={args.max_retries}, delays={retry_delays}")

    for scenario_id in scenario_ids:
        scenario = scenario_by_id[scenario_id]
        tool_results = {
            "fabric": execute_tool(
                tool_name="fabric",
                payload=fabric_metrics.get(scenario_id, {}),
                mode=args.mode,
                max_retries=args.max_retries,
                retry_delays=retry_delays,
                simulate_wait=args.simulate_wait,
            ),
            "work": execute_tool(
                tool_name="work",
                payload=work_evidence.get(scenario_id, {}),
                mode=args.mode,
                max_retries=args.max_retries,
                retry_delays=retry_delays,
                simulate_wait=args.simulate_wait,
            ),
            "web": execute_tool(
                tool_name="web",
                payload=web_scenarios.get(scenario_id, {}),
                mode=args.mode,
                max_retries=args.max_retries,
                retry_delays=retry_delays,
                simulate_wait=args.simulate_wait,
            ),
        }
        payload = {
            "runContext": {
                "scenarioId": scenario_id,
                "executionMode": "simulation",
                "mode": args.mode,
                "runAt": datetime.now(timezone.utc).isoformat(),
                "retryPolicy": {
                    "maxRetries": args.max_retries,
                    "retryDelaysSec": retry_delays,
                },
                "release": {
                    "pipelineVersion": args.pipeline_version,
                    "promptVersion": args.prompt_version,
                    "modelVersion": args.model_version,
                    "toolsetVersion": args.toolset_version,
                },
            },
            "toolStatus": {
                name: {key: value for key, value in result.items() if key != "payload"}
                for name, result in tool_results.items()
            },
            "response": compose_response(
                scenario=scenario,
                fabric_result=tool_results["fabric"],
                work_result=tool_results["work"],
                web_result=tool_results["web"],
                fixture_notice=str(web_fixture.get("fixtureNotice", "")),
            ),
        }
        output_path = output_dir / f"{scenario_id}__{args.mode}.json"
        save_json(output_path, payload, args.pretty)
        print(f"- wrote: {output_path}")


if __name__ == "__main__":
    main()
