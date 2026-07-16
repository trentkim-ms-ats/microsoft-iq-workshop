#!/usr/bin/env python3
"""Validate Track2 cross-source Entity-to-Document mapping results."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_MANIFEST = ROOT / "generated" / "manifests" / "content_manifest.csv"

ID_PATTERN = re.compile(r"\b(?:SP|OD|EM|TM)\d{2}\b", re.IGNORECASE)

HEADER_ALIASES: dict[str, set[str]] = {
    "entity_type": {
        "엔터티유형",
        "엔티티유형",
        "entitytype",
        "entity_kind",
        "entitykind",
    },
    "entity_value": {
        "엔터티값",
        "엔티티값",
        "entityvalue",
        "entityname",
        "entity",
    },
    "document_title": {
        "매칭문서제목",
        "문서제목",
        "documenttitle",
        "matchingdocumenttitle",
        "title",
    },
    "source": {
        "소스",
        "source",
    },
    "document_ref": {
        "문서링크id",
        "문서링크/id",
        "문서링크",
        "문서id",
        "documentlinkid",
        "documentlink/id",
        "documentref",
        "documentid",
        "url",
        "link",
    },
    "match_status": {
        "매칭상태",
        "matchstatus",
        "matchingstatus",
        "status",
    },
    "note": {
        "비고",
        "note",
        "notes",
        "remark",
    },
}

ENTITY_TYPE_ALIASES: dict[str, set[str]] = {
    "campaign": {"캠페인", "campaign"},
    "product": {"상품", "product"},
    "customer_grade": {"고객등급", "customergrade", "customer_tier", "customer tier", "tier"},
}

SOURCE_ALIASES: dict[str, set[str]] = {
    "SharePoint": {"sharepoint", "share point", "쉐어포인트"},
    "Outlook": {"outlook", "메일", "email"},
    "Teams": {"teams", "team", "팀즈"},
    "OneDrive": {"onedrive", "one drive", "원드라이브"},
}

CORE_PRODUCT_ALIASES: dict[str, str] = {
    "aerophone x": "AeroPhone X",
    "aero phone x": "AeroPhone X",
    "smartwatch pro": "SmartWatch Pro",
    "ultrabook 15": "UltraBook 15",
    "ultrabook15": "UltraBook 15",
}

NORMALIZATION_HINTS = {
    "정규화",
    "normalize",
    "normalization",
    "원문",
    "canonical",
    "alias",
    "별칭",
    "오탈자",
    "표기",
}


@dataclass
class MappingRow:
    line_no: int
    entity_type: str
    entity_value: str
    document_title: str
    source: str
    document_ref: str
    match_status: str
    note: str


def normalize_key(value: str) -> str:
    return re.sub(r"[\s_]+", "", value.strip().lower())


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def canonical_source(value: str) -> str:
    token = normalize_text(value).lower()
    for canonical, aliases in SOURCE_ALIASES.items():
        if token in aliases:
            return canonical
    return normalize_text(value)


def canonical_entity_type(value: str) -> str:
    token = normalize_text(value).lower().replace(" ", "")
    for canonical, aliases in ENTITY_TYPE_ALIASES.items():
        normalized_aliases = {alias.replace(" ", "") for alias in aliases}
        if token in normalized_aliases:
            return canonical
    return ""


def canonical_product(value: str) -> str:
    token = normalize_text(value).lower()
    return CORE_PRODUCT_ALIASES.get(token, normalize_text(value))


def is_failed_status(value: str) -> bool:
    token = normalize_text(value).lower()
    return "실패" in token or "fail" in token


def is_partial_status(value: str) -> bool:
    token = normalize_text(value).lower()
    return "부분" in token or "partial" in token


def has_normalization_note(value: str) -> bool:
    note = value.lower()
    if "->" in note or "→" in note or "=>" in note:
        return True
    return any(hint in note for hint in NORMALIZATION_HINTS)


def resolve_headers(fieldnames: list[str]) -> dict[str, str]:
    normalized = {normalize_key(name): name for name in fieldnames}
    resolved: dict[str, str] = {}
    for canonical, aliases in HEADER_ALIASES.items():
        candidates = {normalize_key(alias) for alias in aliases}
        for candidate in candidates:
            if candidate in normalized:
                resolved[canonical] = normalized[candidate]
                break
    required = {"entity_type", "entity_value", "document_title", "source", "document_ref", "match_status"}
    missing = sorted(required - set(resolved))
    if missing:
        raise RuntimeError(f"Mapping file missing required columns: {missing}")
    if "note" not in resolved:
        resolved["note"] = ""
    return resolved


def read_mapping_rows(path: Path) -> list[MappingRow]:
    if not path.is_file():
        raise RuntimeError(f"Mapping file not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(4096)
        handle.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",\t;")
        except csv.Error:
            dialect = csv.excel
        reader = csv.DictReader(handle, dialect=dialect)
        if not reader.fieldnames:
            raise RuntimeError(f"Mapping file has no header row: {path}")
        headers = resolve_headers(reader.fieldnames)
        rows: list[MappingRow] = []
        for index, raw in enumerate(reader, start=2):
            rows.append(
                MappingRow(
                    line_no=index,
                    entity_type=normalize_text(raw.get(headers["entity_type"], "") or ""),
                    entity_value=normalize_text(raw.get(headers["entity_value"], "") or ""),
                    document_title=normalize_text(raw.get(headers["document_title"], "") or ""),
                    source=canonical_source(raw.get(headers["source"], "") or ""),
                    document_ref=normalize_text(raw.get(headers["document_ref"], "") or ""),
                    match_status=normalize_text(raw.get(headers["match_status"], "") or ""),
                    note=normalize_text(raw.get(headers["note"], "") or "") if headers["note"] else "",
                )
            )
    return rows


def load_manifest(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        raise RuntimeError(f"Manifest file not found: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise RuntimeError(f"Manifest file has no header row: {path}")
        rows = []
        for row in reader:
            rows.append(
                {
                    "id": normalize_text(row.get("id", "") or "").upper(),
                    "source": canonical_source(row.get("source", "") or ""),
                    "title": normalize_text(row.get("title", "") or ""),
                }
            )
    return rows


def is_valid_mapping(row: MappingRow) -> bool:
    if is_failed_status(row.match_status):
        return False
    required_values = [row.entity_type, row.entity_value, row.document_title, row.source, row.document_ref]
    return all(bool(value) for value in required_values)


def find_manifest_match(
    row: MappingRow,
    manifest_by_id: dict[str, dict[str, str]],
    manifest_by_source_title: set[tuple[str, str]],
) -> tuple[bool, str]:
    id_match = ID_PATTERN.search(row.document_ref)
    if id_match:
        key = id_match.group(0).upper()
        manifest_row = manifest_by_id.get(key)
        if not manifest_row:
            return False, f"id_not_found:{key}"
        if manifest_row["source"] != row.source:
            return False, f"id_source_mismatch:{key}:{row.source}!={manifest_row['source']}"
        return True, key

    key = (row.source, row.document_title)
    if key in manifest_by_source_title:
        return True, f"title_match:{row.document_title}"
    return False, "title_source_not_found"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate Track2 cross-source Entity-to-Document mapping table."
    )
    parser.add_argument(
        "--mapping-csv",
        type=Path,
        required=True,
        help="Participant mapping CSV/TSV file path.",
    )
    parser.add_argument(
        "--manifest-csv",
        type=Path,
        default=DEFAULT_MANIFEST,
        help="Manifest CSV used to verify mapped documents exist.",
    )
    parser.add_argument(
        "--skip-manifest-check",
        action="store_true",
        help="Skip consistency check against content_manifest.csv.",
    )
    parser.add_argument(
        "--require-manifest-match",
        action="store_true",
        help="Fail command when any valid mapping row cannot be matched in manifest.",
    )
    parser.add_argument(
        "--json-output",
        type=Path,
        help="Optional JSON output file path for validation report.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rows = read_mapping_rows(args.mapping_csv)
    valid_rows = [row for row in rows if is_valid_mapping(row)]

    campaigns = {normalize_text(row.entity_value) for row in valid_rows if canonical_entity_type(row.entity_type) == "campaign"}
    products = {canonical_product(row.entity_value) for row in valid_rows if canonical_entity_type(row.entity_type) == "product"}
    customer_grades = {normalize_text(row.entity_value) for row in valid_rows if canonical_entity_type(row.entity_type) == "customer_grade"}

    core_counts = {
        "AeroPhone X": 0,
        "SmartWatch Pro": 0,
        "UltraBook 15": 0,
    }
    for row in valid_rows:
        if canonical_entity_type(row.entity_type) != "product":
            continue
        product = canonical_product(row.entity_value)
        if product in core_counts:
            core_counts[product] += 1

    normalization_cases = [
        row
        for row in valid_rows
        if has_normalization_note(row.note) and (is_partial_status(row.match_status) or row.note)
    ]

    manifest_unmatched: list[dict[str, Any]] = []
    manifest_match_count = 0
    if not args.skip_manifest_check:
        manifest_rows = load_manifest(args.manifest_csv)
        manifest_by_id = {row["id"]: row for row in manifest_rows if row["id"]}
        manifest_by_source_title = {(row["source"], row["title"]) for row in manifest_rows}
        for row in valid_rows:
            matched, reason = find_manifest_match(row, manifest_by_id, manifest_by_source_title)
            if matched:
                manifest_match_count += 1
                continue
            manifest_unmatched.append(
                {
                    "line": row.line_no,
                    "entityValue": row.entity_value,
                    "source": row.source,
                    "title": row.document_title,
                    "documentRef": row.document_ref,
                    "reason": reason,
                }
            )

    check_entity_span = (
        len(campaigns) >= 4
        and len(products) >= 5
        and len(customer_grades) >= 1
        and len(valid_rows) >= 10
    )
    check_core_products = all(count >= 2 for count in core_counts.values())
    check_normalization_case = len(normalization_cases) >= 1
    check_manifest = args.skip_manifest_check or not args.require_manifest_match or len(manifest_unmatched) == 0

    passed = check_entity_span and check_core_products and check_normalization_case and check_manifest

    report: dict[str, Any] = {
        "mappingFile": str(args.mapping_csv),
        "validRowCount": len(valid_rows),
        "metrics": {
            "campaignUniqueCount": len(campaigns),
            "productUniqueCount": len(products),
            "customerGradeUniqueCount": len(customer_grades),
            "coreProductCounts": core_counts,
            "normalizationCaseCount": len(normalization_cases),
        },
        "checks": {
            "entitySpan": check_entity_span,
            "coreProducts": check_core_products,
            "normalizationCase": check_normalization_case,
            "manifestMatch": check_manifest,
        },
        "manifest": {
            "enabled": not args.skip_manifest_check,
            "matchedRowCount": manifest_match_count,
            "unmatchedRowCount": len(manifest_unmatched),
            "unmatchedRows": manifest_unmatched,
        },
        "passed": passed,
    }

    print("=== Track2 Entity-to-Document Mapping Validation ===")
    print(f"mapping file: {args.mapping_csv}")
    print(f"valid rows: {len(valid_rows)}")
    print(f"campaign unique: {len(campaigns)} (required >= 4)")
    print(f"product unique: {len(products)} (required >= 5)")
    print(f"customer-grade unique: {len(customer_grades)} (required >= 1)")
    print("core products (required >= 2 each):")
    for name, count in core_counts.items():
        print(f"  - {name}: {count}")
    print(f"normalization cases: {len(normalization_cases)} (required >= 1)")
    if not args.skip_manifest_check:
        print(
            f"manifest matches: {manifest_match_count}/{len(valid_rows)} "
            f"(unmatched: {len(manifest_unmatched)})"
        )
    print(f"RESULT: {'PASS' if passed else 'FAIL'}")

    if args.json_output:
        args.json_output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"json report: {args.json_output}")

    return 0 if passed else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RuntimeError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
