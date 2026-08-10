#!/usr/bin/env python3
"""Validate Track1 -> Track2 handoff package completeness."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


PACKAGE_START = "[TRACK2_WORKIQ_HANDOFF_PACKAGE]"
PACKAGE_END = "[/TRACK2_WORKIQ_HANDOFF_PACKAGE]"
LEGACY_PACKAGE_START = "[TRACK2_HANDOFF_PACKAGE]"
LEGACY_PACKAGE_END = "[/TRACK2_HANDOFF_PACKAGE]"

REQUIRED_FIELDS = [
    "team",
    "handoffAtKst",
    "workspaceId",
    "ontologyId",
    "ontologyName",
    "entityCount",
    "relationshipCount",
    "corePaths",
    "mappingHighlights",
    "openIssues",
    "workiqKeys",
    "evidenceLinks",
]

GUID_PATTERN = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate Track2 handoff package text from Track1 outputs."
    )
    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Path to a text/markdown file containing [TRACK2_WORKIQ_HANDOFF_PACKAGE] block.",
    )
    parser.add_argument(
        "--json-output",
        type=Path,
        help="Optional path to write machine-readable validation report.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with non-zero status if validation fails.",
    )
    return parser.parse_args()


def load_text(path: Path) -> str:
    if not path.is_file():
        raise RuntimeError(f"Input file not found: {path}")
    return path.read_text(encoding="utf-8")


def extract_package_block(text: str) -> list[str]:
    start = text.find(PACKAGE_START)
    end = text.find(PACKAGE_END)
    used_start = PACKAGE_START
    if start < 0 or end < 0 or end < start:
        start = text.find(LEGACY_PACKAGE_START)
        end = text.find(LEGACY_PACKAGE_END)
        used_start = LEGACY_PACKAGE_START
    if start < 0 or end < 0 or end < start:
        raise RuntimeError(
            "TRACK2 handoff block not found. Ensure file contains "
            "[TRACK2_WORKIQ_HANDOFF_PACKAGE] ... [/TRACK2_WORKIQ_HANDOFF_PACKAGE]."
        )
    body = text[start + len(used_start) : end]
    return [line.strip() for line in body.splitlines() if line.strip()]


def parse_key_values(lines: list[str]) -> dict[str, str]:
    payload: dict[str, str] = {}
    for line in lines:
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        payload[key.strip()] = value.strip()
    return payload


def split_items(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def is_placeholder(value: str) -> bool:
    trimmed = value.strip()
    return trimmed.startswith("<") and trimmed.endswith(">")


def validate_payload(payload: dict[str, str]) -> tuple[bool, list[str], dict[str, Any]]:
    reasons: list[str] = []

    missing = [field for field in REQUIRED_FIELDS if field not in payload]
    if missing:
        reasons.append(f"missing fields: {', '.join(missing)}")

    for field in REQUIRED_FIELDS:
        value = payload.get(field, "")
        if not value:
            reasons.append(f"empty value: {field}")
        elif is_placeholder(value):
            reasons.append(f"placeholder not replaced: {field}")

    for guid_field in ["workspaceId", "ontologyId"]:
        value = payload.get(guid_field, "")
        if value and not is_placeholder(value) and not GUID_PATTERN.match(value):
            reasons.append(f"invalid GUID format: {guid_field}")

    for count_field in ["entityCount", "relationshipCount"]:
        value = payload.get(count_field, "")
        if value and not is_placeholder(value):
            try:
                if int(value) <= 0:
                    reasons.append(f"{count_field} must be > 0")
            except ValueError:
                reasons.append(f"{count_field} must be numeric")

    core_paths = split_items(payload.get("corePaths", ""))
    if core_paths and len(core_paths) < 3:
        reasons.append("corePaths should include at least 3 paths")

    mappings = [item.strip() for item in re.split(r"[;,]", payload.get("mappingHighlights", "")) if item.strip()]
    if mappings and len(mappings) < 5:
        reasons.append("mappingHighlights should include at least 5 entries")

    open_issues = split_items(payload.get("openIssues", ""))

    workiq_keys = split_items(payload.get("workiqKeys", ""))
    if workiq_keys and len(workiq_keys) < 3:
        reasons.append("workiqKeys should include at least 3 groups")

    evidence_links = split_items(payload.get("evidenceLinks", ""))
    if not evidence_links:
        reasons.append("evidenceLinks should include at least 1 item")

    report = {
        "status": "PASS" if not reasons else "FAIL",
        "fieldCount": len(payload),
        "corePathCount": len(core_paths),
        "mappingHighlightCount": len(mappings),
        "openIssueCount": len(open_issues),
        "workiqKeyGroupCount": len(workiq_keys),
        "evidenceLinkCount": len(evidence_links),
    }
    return not reasons, reasons, report


def main() -> int:
    args = parse_args()
    text = load_text(args.input)
    lines = extract_package_block(text)
    payload = parse_key_values(lines)
    passed, reasons, metrics = validate_payload(payload)

    print("[Track1 Handoff Validation]")
    print(f"- input: {args.input.resolve()}")
    print(f"- status: {metrics['status']}")
    print(f"- fields: {metrics['fieldCount']}")
    print(f"- corePaths: {metrics['corePathCount']}")
    print(f"- mappingHighlights: {metrics['mappingHighlightCount']}")
    print(f"- openIssues: {metrics['openIssueCount']}")
    print(f"- workiqKeyGroups: {metrics['workiqKeyGroupCount']}")
    print(f"- evidenceLinks: {metrics['evidenceLinkCount']}")
    if reasons:
        print("- reasons:")
        for reason in reasons:
            print(f"  - {reason}")

    if args.json_output:
        report = {
            "input": str(args.input.resolve()),
            "status": metrics["status"],
            "passed": passed,
            "reasons": reasons,
            "metrics": metrics,
            "parsed": payload,
        }
        args.json_output.parent.mkdir(parents=True, exist_ok=True)
        args.json_output.write_text(
            json.dumps(report, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"- json report: {args.json_output.resolve()}")

    if args.strict and not passed:
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RuntimeError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
