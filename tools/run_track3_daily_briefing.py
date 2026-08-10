#!/usr/bin/env python3
"""Run the Track4 FoundryIQ daily pipeline and build a leadership briefing.

The filename and TRACK3 response block are retained legacy FoundryIQ identifiers.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    repo_root_default = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Execute the Track4 FoundryIQ daily run and generate a leadership briefing."
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=repo_root_default,
        help="Repository root path.",
    )
    parser.add_argument(
        "--pipeline-version",
        default="track4-foundry-prod-v1",
        help="Pipeline version tag forwarded to run_track3_simulation.py.",
    )
    parser.add_argument(
        "--prompt-version",
        default="track4-foundry-prompt-v1",
        help="Prompt version tag forwarded to run_track3_simulation.py.",
    )
    parser.add_argument(
        "--model-version",
        default="foundry-responses-v1",
        help="Model version tag forwarded to run_track3_simulation.py.",
    )
    parser.add_argument(
        "--toolset-version",
        default="fabriciq-v1+workiq-v1+webiq-v1",
        help="Toolset version tag forwarded to run_microsoft_iq_simulation.py.",
    )
    parser.add_argument(
        "--run-fallback-check",
        action="store_true",
        help="Also execute fallback scenarios (tool-a-down/tool-b-down/both-down).",
    )
    parser.add_argument(
        "--require-llm-refine",
        action="store_true",
        help="Fail if Foundry Responses API is not configured for final briefing refinement.",
    )
    return parser.parse_args()


def run_command(command: list[str], cwd: Path) -> None:
    print(f"[run] {' '.join(command)}")
    subprocess.run(command, cwd=str(cwd), check=True)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def evidence_reference(link: dict[str, Any]) -> str:
    return str(link.get("url") or link.get("location") or link.get("target") or "-")


def clean_response_files(responses_dir: Path) -> None:
    responses_dir.mkdir(parents=True, exist_ok=True)
    for path in responses_dir.glob("*.json"):
        path.unlink()


def format_legacy_track3_response_block(question: str, response: dict[str, Any]) -> str:
    metrics = response.get("keyFindings", [])
    links = response.get("evidenceLinks", [])
    actions = response.get("recommendedActions", [])
    warnings = response.get("warnings", [])
    source_trace = response.get("sourceTrace", [])

    metric_text = "; ".join(metrics) if metrics else "-"
    link_text = ", ".join(evidence_reference(link) for link in links) if links else "-"
    action_text = "; ".join(actions) if actions else "-"
    warning_text = "; ".join(warnings) if warnings else "없음"
    trace_text = ", ".join(
        f"{item.get('iq', '-')}:{item.get('role', '-')}"
        for item in source_trace
        if isinstance(item, dict)
    ) or "-"
    summary = response.get("summary", "").strip() or "-"

    return (
        "[TRACK3_RESPONSE]\n"
        f"question={question}\n"
        f"summary={summary}\n"
        f"structuredMetrics={metric_text}\n"
        f"evidenceLinks={link_text}\n"
        f"sourceTrace={trace_text}\n"
        f"actions={action_text}\n"
        f"warnings={warning_text}\n"
        "[/TRACK3_RESPONSE]"
    )


def compose_briefing(responses: list[dict[str, Any]], generated_at: str) -> str:
    lines: list[str] = []
    lines.append("# Track4 FoundryIQ Leadership Briefing")
    lines.append("")
    lines.append(f"- generatedAtUtc: {generated_at}")
    lines.append("- source: Q1~Q3 normal mode responses")
    lines.append("")
    lines.append("## Executive Summary")
    lines.append("")

    summary_lines: list[str] = []
    all_actions: list[str] = []
    all_warnings: list[str] = []
    all_links: list[dict[str, str]] = []

    for payload in responses:
        response = payload.get("response", {})
        question = response.get("question", "")
        summary = response.get("summary", "")
        summary_lines.append(f"- **{question}**: {summary}")
        all_actions.extend(response.get("recommendedActions", []))
        all_warnings.extend(response.get("warnings", []))
        all_links.extend(response.get("evidenceLinks", []))

    lines.extend(summary_lines if summary_lines else ["- 요약 없음"])
    lines.append("")
    lines.append("## Recommended Actions")
    lines.append("")
    if all_actions:
        for action in dict.fromkeys(all_actions):
            lines.append(f"- {action}")
    else:
        lines.append("- 조치안 없음")

    lines.append("")
    lines.append("## Warnings")
    lines.append("")
    if all_warnings:
        for warning in dict.fromkeys(all_warnings):
            lines.append(f"- {warning}")
    else:
        lines.append("- 없음")

    lines.append("")
    lines.append("## Evidence Links")
    lines.append("")
    if all_links:
        lines.append("| title | source | reference |")
        lines.append("| --- | --- | --- |")
        for link in all_links:
            lines.append(
                f"| {link.get('title', '-')} | {link.get('source', '-')} | {evidence_reference(link)} |"
            )
    else:
        lines.append("- 근거 링크 없음")

    lines.append("")
    lines.append("## Legacy TRACK3_RESPONSE Blocks")
    lines.append("")
    for payload in responses:
        response = payload.get("response", {})
        question = response.get("question", "unknown")
        lines.append("```text")
        lines.append(format_legacy_track3_response_block(question, response))
        lines.append("```")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    foundry_data_dir = repo_root / "track4" / "data"
    responses_dir = foundry_data_dir / "generated" / "microsoft_iq_responses"
    reports_dir = foundry_data_dir / "generated" / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    clean_response_files(responses_dir)

    run_command(["python3", "generate_track3_samples.py"], cwd=foundry_data_dir)
    run_command(
        [
            "python3",
            "run_microsoft_iq_simulation.py",
            "--all",
            "--mode",
            "normal",
            "--pipeline-version",
            args.pipeline_version,
            "--prompt-version",
            args.prompt_version,
            "--model-version",
            args.model_version,
            "--toolset-version",
            args.toolset_version,
        ],
        cwd=foundry_data_dir,
    )
    run_command(["python3", "evaluate_microsoft_iq_outputs.py", "--strict"], cwd=foundry_data_dir)

    if args.run_fallback_check:
        run_command(["python3", "run_microsoft_iq_simulation.py", "--scenario-id", "Q1", "--mode", "fabric-down"], cwd=foundry_data_dir)
        run_command(["python3", "run_microsoft_iq_simulation.py", "--scenario-id", "Q1", "--mode", "work-down"], cwd=foundry_data_dir)
        run_command(["python3", "run_microsoft_iq_simulation.py", "--scenario-id", "Q1", "--mode", "web-down"], cwd=foundry_data_dir)
        run_command(["python3", "run_microsoft_iq_simulation.py", "--scenario-id", "Q1", "--mode", "internal-down"], cwd=foundry_data_dir)
        run_command(["python3", "run_microsoft_iq_simulation.py", "--scenario-id", "Q1", "--mode", "all-down"], cwd=foundry_data_dir)
        run_command(["python3", "evaluate_microsoft_iq_outputs.py", "--strict"], cwd=foundry_data_dir)

    responses: list[dict[str, Any]] = []
    for scenario_id in ("Q1", "Q2", "Q3"):
        response_path = responses_dir / f"{scenario_id}__normal.json"
        if not response_path.is_file():
            raise RuntimeError(f"Response file not found: {response_path}")
        responses.append(load_json(response_path))

    generated_at = datetime.now(timezone.utc).isoformat()
    briefing = compose_briefing(responses, generated_at)
    briefing_path = reports_dir / "leadership_briefing.md"
    briefing_path.write_text(briefing, encoding="utf-8")
    stale_llm_briefing = reports_dir / "leadership_briefing_llm.md"
    if stale_llm_briefing.exists():
        stale_llm_briefing.unlink()

    foundry_config = None
    llm_briefing_path: Path | None = None
    try:
        if str(foundry_data_dir) not in sys.path:
            sys.path.insert(0, str(foundry_data_dir))
        from foundry_responses import FoundryResponsesConfig, generate_leadership_briefing  # noqa: PLC0415

        foundry_config = FoundryResponsesConfig.from_env()
        if foundry_config.is_configured:
            llm_briefing = generate_leadership_briefing(briefing, config=foundry_config)
            llm_briefing_path = reports_dir / "leadership_briefing_llm.md"
            llm_briefing_path.write_text(llm_briefing, encoding="utf-8")
        elif args.require_llm_refine:
            foundry_config.require_configured()
    except ModuleNotFoundError:
        if args.require_llm_refine:
            raise RuntimeError(
                "foundry_responses module not found but --require-llm-refine was set"
            ) from None

    run_meta = {
        "generatedAtUtc": generated_at,
        "executionMode": "simulation-reference",
        "sourceContract": {
            "structured": "FabricIQ simulation generated from Track1 CSV",
            "unstructured": "WorkIQ simulation generated from Track2 manifest",
            "orchestrator": "Foundry Responses API" if (foundry_config and foundry_config.is_configured) else "rules-only",
        },
        "pipelineVersion": args.pipeline_version,
        "promptVersion": args.prompt_version,
        "modelVersion": args.model_version,
        "toolsetVersion": args.toolset_version,
        "runFallbackCheck": args.run_fallback_check,
        "briefingPath": str(briefing_path),
        "llmBriefingPath": str(llm_briefing_path) if llm_briefing_path else None,
    }
    metadata_path = reports_dir / "daily_run_metadata.json"
    metadata_path.write_text(json.dumps(run_meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print("[Track4 FoundryIQ Daily Briefing]")
    print(f"- briefing: {briefing_path}")
    print(f"- llmBriefing: {llm_briefing_path or '(skipped: Responses API not configured)'}")
    print(f"- metadata: {metadata_path}")


if __name__ == "__main__":
    main()
