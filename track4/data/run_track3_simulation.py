#!/usr/bin/env python3
"""Run Track4 FoundryIQ Tool A/B simulations with fallback policies.

The filename is retained as a legacy Track3 FoundryIQ compatibility identifier.
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = ROOT / "generated"
DEFAULT_RESPONSE_DIR = ROOT / "generated" / "responses"

MODES = {
    "normal",
    "tool-a-down",
    "tool-b-down",
    "both-down",
    "tool-a-transient",
    "tool-b-transient",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Simulate Track4 FoundryIQ integrated responses and fallback behavior."
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="Directory containing generated Track4 FoundryIQ scenario files.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_RESPONSE_DIR,
        help="Directory to write Track4 FoundryIQ response JSON files.",
    )
    parser.add_argument(
        "--scenario-id",
        action="append",
        help="Scenario ID to execute (e.g., Q1). Can be repeated.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Execute all scenarios in scenarios.json.",
    )
    parser.add_argument(
        "--mode",
        default="normal",
        choices=sorted(MODES),
        help="Failure mode simulation policy.",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=3,
        help="Maximum retry attempts per tool.",
    )
    parser.add_argument(
        "--retry-delays",
        default="5,10,20",
        help="Comma-separated retry delays (seconds).",
    )
    parser.add_argument(
        "--simulate-wait",
        action="store_true",
        help="Actually sleep between retries.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print output JSON.",
    )
    parser.add_argument(
        "--pipeline-version",
        default="track3-sim-v1",
        help="Pipeline version tag recorded in runContext.release.",
    )
    parser.add_argument(
        "--prompt-version",
        default="track3-prompt-v1",
        help="Prompt template version tag recorded in runContext.release.",
    )
    parser.add_argument(
        "--model-version",
        default="foundry-responses-v1",
        help="Foundry model deployment version tag recorded in runContext.release.",
    )
    parser.add_argument(
        "--toolset-version",
        default="fabriciq-v1+workiq-v1",
        help="Tool connector version tag recorded in runContext.release.",
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    if not path.is_file():
        raise RuntimeError(f"Required JSON file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def parse_retry_delays(value: str, max_retries: int) -> list[int]:
    items = [chunk.strip() for chunk in value.split(",") if chunk.strip()]
    delays = [int(chunk) for chunk in items]
    if len(delays) < max_retries:
        delays.extend([delays[-1] if delays else 0] * (max_retries - len(delays)))
    return delays[:max_retries]


def should_tool_fail(mode: str, tool_name: str, attempt: int) -> bool:
    if mode == "both-down":
        return True
    if mode == "tool-a-down" and tool_name == "toolA":
        return True
    if mode == "tool-b-down" and tool_name == "toolB":
        return True
    if mode == "tool-a-transient" and tool_name == "toolA":
        return attempt == 1
    if mode == "tool-b-transient" and tool_name == "toolB":
        return attempt == 1
    return False


def execute_tool(
    *,
    tool_name: str,
    payload: Any,
    mode: str,
    max_retries: int,
    retry_delays: list[int],
    simulate_wait: bool,
) -> dict[str, Any]:
    logs: list[dict[str, Any]] = []
    for attempt in range(1, max_retries + 2):
        failed = should_tool_fail(mode, tool_name, attempt)
        if not failed:
            logs.append({"attempt": attempt, "status": "ok"})
            return {
                "status": "ok",
                "attempts": attempt,
                "logs": logs,
                "payload": payload,
            }
        logs.append({"attempt": attempt, "status": "fail", "error": "simulated_tool_failure"})
        if attempt <= max_retries and simulate_wait:
            time.sleep(retry_delays[attempt - 1])
    return {
        "status": "fail",
        "attempts": max_retries + 1,
        "logs": logs,
        "payload": None,
    }


def compose_response(
    *,
    scenario: dict[str, Any],
    tool_a_result: dict[str, Any],
    tool_b_result: dict[str, Any],
) -> dict[str, Any]:
    warnings: list[str] = []
    evidence_links: list[dict[str, str]] = []
    key_findings: list[str] = []
    actions: list[str] = []
    source_trace: list[dict[str, Any]] = []
    overall_status = "pass"

    tool_a_ok = tool_a_result["status"] == "ok"
    tool_b_ok = tool_b_result["status"] == "ok"

    if tool_a_ok and tool_a_result["payload"]:
        key_findings.extend(tool_a_result["payload"].get("highlights", []))
        source_trace.append(
            {
                "iq": "FabricIQ",
                "role": "structured",
                "origin": "track1-csv-simulation",
                "semanticKeys": scenario.get("semanticKeys", []),
            }
        )
    if tool_b_ok and tool_b_result["payload"]:
        evidence_links = tool_b_result["payload"].get("evidence", [])[:5]
        source_trace.append(
            {
                "iq": "WorkIQ",
                "role": "unstructured",
                "origin": "track2-manifest-simulation",
                "semanticKeys": scenario.get("semanticKeys", []),
            }
        )

    if not tool_a_ok and not tool_b_ok:
        overall_status = "blocked"
        warnings.append("Tool A/B 모두 실패: 답변 생성을 중단하고 차단 원인 및 복구 조치만 반환합니다.")
        key_findings = ["정형·비정형 도구가 모두 실패해 분석을 지속할 수 없습니다."]
        actions = [
            "권한/토큰 상태를 먼저 복구합니다.",
            "인덱스 범위와 커넥터 상태를 재점검합니다.",
            "복구 후 표준 질문 Q1으로 재시도합니다.",
        ]
        evidence_links = []
    elif not tool_a_ok:
        overall_status = "partial"
        warnings.append("정형 수치 미검증")
        actions = [
            "Tool A(FabricIQ) 인증 또는 SQL endpoint 연결을 복구합니다.",
            "복구 후 동일 질문으로 정형 지표를 재수집합니다.",
        ]
    elif not tool_b_ok:
        overall_status = "partial"
        warnings.append("업무 문서 근거 없음")
        actions = [
            "Tool B(WorkIQ) 권한/인덱스 최신성을 확인합니다.",
            "복구 후 동일 질문으로 근거 링크를 재수집합니다.",
        ]
    else:
        actions = [
            "근거 링크 접근 권한(ACL) 유효성을 교차 확인합니다.",
            "응답 품질 점수(정확도/근거성/환각률)를 기록합니다.",
        ]

    response = {
        "question": scenario["question"],
        "overallStatus": overall_status,
        "summary": f"{scenario['id']} 실행 결과: {overall_status}",
        "keyFindings": key_findings,
        "warnings": warnings,
        "recommendedActions": actions,
        "evidenceLinks": evidence_links,
        "sourceTrace": source_trace,
        "qualityChecks": {
            "hasStructuredMetric": tool_a_ok and bool(key_findings),
            "hasEvidenceLink": len(evidence_links) > 0,
            "hasBothSources": tool_a_ok and tool_b_ok and bool(key_findings) and bool(evidence_links),
        },
    }
    return response


def save_json(path: Path, payload: Any, pretty: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if pretty:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    args = parse_args()
    data_dir = args.data_dir.resolve()
    output_dir = args.output_dir.resolve()

    scenarios_payload = load_json(data_dir / "scenarios.json")
    tool_a_metrics = load_json(data_dir / "tool_a_metrics.json")
    tool_b_evidence = load_json(data_dir / "tool_b_evidence.json")

    scenarios = scenarios_payload.get("scenarios", [])
    scenario_by_id = {scenario["id"]: scenario for scenario in scenarios}

    if args.all:
        scenario_ids = sorted(scenario_by_id.keys())
    elif args.scenario_id:
        scenario_ids = args.scenario_id
    else:
        raise RuntimeError("Either --all or --scenario-id must be provided.")

    unknown = [scenario_id for scenario_id in scenario_ids if scenario_id not in scenario_by_id]
    if unknown:
        raise RuntimeError(f"Unknown scenario ID(s): {unknown}")

    retry_delays = parse_retry_delays(args.retry_delays, args.max_retries)

    print("[Track4 FoundryIQ Simulation]")
    print(f"- mode: {args.mode}")
    print(f"- scenarios: {scenario_ids}")
    print(
        f"- retryPolicy: maxRetries={args.max_retries}, "
        f"maxAttempts={args.max_retries + 1}, delays={retry_delays}"
    )

    for scenario_id in scenario_ids:
        scenario = scenario_by_id[scenario_id]
        tool_a_payload = tool_a_metrics.get(scenario_id, {})
        tool_b_payload = tool_b_evidence.get(scenario_id, {})

        tool_a_result = execute_tool(
            tool_name="toolA",
            payload=tool_a_payload,
            mode=args.mode,
            max_retries=args.max_retries,
            retry_delays=retry_delays,
            simulate_wait=args.simulate_wait,
        )
        tool_b_result = execute_tool(
            tool_name="toolB",
            payload=tool_b_payload,
            mode=args.mode,
            max_retries=args.max_retries,
            retry_delays=retry_delays,
            simulate_wait=args.simulate_wait,
        )

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
                "toolA": {k: v for k, v in tool_a_result.items() if k != "payload"},
                "toolB": {k: v for k, v in tool_b_result.items() if k != "payload"},
            },
            "response": compose_response(scenario=scenario, tool_a_result=tool_a_result, tool_b_result=tool_b_result),
        }
        output_path = output_dir / f"{scenario_id}__{args.mode}.json"
        save_json(output_path, payload, args.pretty)
        print(f"- wrote: {output_path}")


if __name__ == "__main__":
    main()
