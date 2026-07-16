#!/usr/bin/env python3
"""Validate Track2 ACL probe results from a manual verification report CSV/TSV."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


EXPECTED_SOURCES = {"sharepoint", "outlook", "teams", "onedrive"}

HEADER_ALIASES: dict[str, set[str]] = {
    "source": {"source", "소스"},
    "resource": {"resource", "리소스", "title", "문서제목", "item"},
    "participant_access": {
        "participant_access",
        "participantaccess",
        "참가자접근",
        "participant",
        "user_access",
    },
    "restricted_access": {
        "restricted_access",
        "restrictedaccess",
        "제한계정접근",
        "acl_access",
        "aclaccount",
    },
    "expected_participant": {
        "expected_participant",
        "expectedparticipant",
        "기대참가자접근",
    },
    "expected_restricted": {
        "expected_restricted",
        "expectedrestricted",
        "기대제한계정접근",
    },
    "note": {"note", "notes", "비고", "remark"},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate ACL probe report for Track2 kickoff readiness."
    )
    parser.add_argument(
        "--acl-report-csv",
        type=Path,
        required=True,
        help="Path to ACL probe report CSV/TSV.",
    )
    parser.add_argument(
        "--min-rows",
        type=int,
        default=4,
        help="Minimum number of probe rows required.",
    )
    parser.add_argument(
        "--require-all-sources",
        action="store_true",
        help="Require at least one probe from each source (SharePoint/Outlook/Teams/OneDrive).",
    )
    parser.add_argument(
        "--json-output",
        type=Path,
        help="Optional path to write machine-readable validation report.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero if validation fails.",
    )
    return parser.parse_args()


def normalize_key(value: str) -> str:
    return re.sub(r"[\s_]+", "", value.strip().lower())


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def canonical_access(value: str) -> str:
    token = normalize_text(value).lower()
    if token in {"allow", "allowed", "ok", "pass", "성공", "허용", "y", "yes", "true", "1"}:
        return "allow"
    if token in {"deny", "denied", "block", "blocked", "fail", "차단", "거부", "n", "no", "false", "0"}:
        return "deny"
    return "unknown"


def canonical_source(value: str) -> str:
    token = normalize_text(value).lower()
    if "share" in token:
        return "sharepoint"
    if "outlook" in token or "mail" in token:
        return "outlook"
    if "team" in token:
        return "teams"
    if "onedrive" in token or "one drive" in token:
        return "onedrive"
    return token


def resolve_headers(fieldnames: list[str]) -> dict[str, str]:
    normalized = {normalize_key(name): name for name in fieldnames}
    resolved: dict[str, str] = {}
    for canonical, aliases in HEADER_ALIASES.items():
        for alias in aliases:
            key = normalize_key(alias)
            if key in normalized:
                resolved[canonical] = normalized[key]
                break

    required = {"source", "resource", "participant_access", "restricted_access"}
    missing = sorted(required - set(resolved))
    if missing:
        raise RuntimeError(f"ACL report missing required columns: {missing}")
    return resolved


def read_acl_rows(path: Path) -> tuple[list[dict[str, str]], dict[str, str]]:
    if not path.is_file():
        raise RuntimeError(f"ACL report file not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(4096)
        handle.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",\t;")
        except csv.Error:
            dialect = csv.excel
        reader = csv.DictReader(handle, dialect=dialect)
        if not reader.fieldnames:
            raise RuntimeError(f"ACL report has no header row: {path}")

        headers = resolve_headers(reader.fieldnames)
        rows: list[dict[str, str]] = []
        for raw in reader:
            source = canonical_source(raw.get(headers["source"], "") or "")
            resource = normalize_text(raw.get(headers["resource"], "") or "")
            participant_access = canonical_access(raw.get(headers["participant_access"], "") or "")
            restricted_access = canonical_access(raw.get(headers["restricted_access"], "") or "")

            expected_participant = "allow"
            expected_restricted = "deny"
            if "expected_participant" in headers:
                expected_participant = canonical_access(
                    raw.get(headers["expected_participant"], "") or "allow"
                )
            if "expected_restricted" in headers:
                expected_restricted = canonical_access(
                    raw.get(headers["expected_restricted"], "") or "deny"
                )

            rows.append(
                {
                    "source": source,
                    "resource": resource,
                    "participantAccess": participant_access,
                    "restrictedAccess": restricted_access,
                    "expectedParticipant": expected_participant,
                    "expectedRestricted": expected_restricted,
                }
            )
    return rows, headers


def validate_rows(
    rows: list[dict[str, str]],
    *,
    min_rows: int,
    require_all_sources: bool,
) -> tuple[bool, list[str], dict[str, Any]]:
    reasons: list[str] = []

    if len(rows) < min_rows:
        reasons.append(f"probe rows must be >= {min_rows} (actual={len(rows)})")

    source_coverage = sorted({row["source"] for row in rows if row["source"]})
    if require_all_sources:
        missing_sources = sorted(EXPECTED_SOURCES - set(source_coverage))
        if missing_sources:
            reasons.append(f"missing source coverage: {', '.join(missing_sources)}")

    mismatches = []
    unknown_rows = []
    for index, row in enumerate(rows, start=2):
        if "unknown" in {row["participantAccess"], row["restrictedAccess"]}:
            unknown_rows.append(index)
            continue

        if row["participantAccess"] != row["expectedParticipant"]:
            mismatches.append(
                f"line {index}: participantAccess={row['participantAccess']} "
                f"expected={row['expectedParticipant']}"
            )
        if row["restrictedAccess"] != row["expectedRestricted"]:
            mismatches.append(
                f"line {index}: restrictedAccess={row['restrictedAccess']} "
                f"expected={row['expectedRestricted']}"
            )

    if unknown_rows:
        reasons.append(f"unknown access value rows: {unknown_rows}")
    if mismatches:
        reasons.extend(mismatches)

    metrics = {
        "status": "PASS" if not reasons else "FAIL",
        "aclCheck": "PASS" if not reasons else "FAIL",
        "rowCount": len(rows),
        "sourceCoverage": source_coverage,
    }
    return not reasons, reasons, metrics


def main() -> int:
    args = parse_args()
    rows, headers = read_acl_rows(args.acl_report_csv)
    passed, reasons, metrics = validate_rows(
        rows,
        min_rows=args.min_rows,
        require_all_sources=args.require_all_sources,
    )

    print("[Track2 ACL Validation]")
    print(f"- input: {args.acl_report_csv.resolve()}")
    print(f"- status: {metrics['status']}")
    print(f"- aclCheck: {metrics['aclCheck']}")
    print(f"- rows: {metrics['rowCount']}")
    print(f"- sourceCoverage: {metrics['sourceCoverage']}")
    print("- required columns:", sorted(headers.keys()))
    if reasons:
        print("- reasons:")
        for reason in reasons:
            print(f"  - {reason}")

    if args.json_output:
        report = {
            "input": str(args.acl_report_csv.resolve()),
            "status": metrics["status"],
            "passed": passed,
            "reasons": reasons,
            "metrics": metrics,
            "rows": rows,
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
