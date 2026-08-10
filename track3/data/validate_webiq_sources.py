#!/usr/bin/env python3
"""Validate the deterministic WebIQ source catalog and evidence fixture."""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DEFAULT_CATALOG = ROOT / "source_catalog.json"
DEFAULT_FIXTURE = ROOT / "web_evidence_fixture.json"
REQUIRED_SCENARIOS = {"Q1", "Q2", "Q3"}
REQUIRED_EVIDENCE_FIELDS = {
    "id",
    "scenarioId",
    "title",
    "url",
    "domain",
    "sourceType",
    "observedAt",
    "scope",
    "factStatus",
    "summary",
    "limitations",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate WebIQ workshop source fixtures.")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--fixture", type=Path, default=DEFAULT_FIXTURE)
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise RuntimeError(f"Required JSON file not found: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError(f"Expected a JSON object: {path}")
    return payload


def validate() -> tuple[int, int]:
    args = parse_args()
    catalog = load_json(args.catalog.resolve())
    fixture = load_json(args.fixture.resolve())

    catalog_rows = catalog.get("scenarios", [])
    if not isinstance(catalog_rows, list):
        raise RuntimeError("catalog.scenarios must be an array")

    catalog_by_id = {row.get("scenarioId"): row for row in catalog_rows if isinstance(row, dict)}
    if set(catalog_by_id) != REQUIRED_SCENARIOS:
        raise RuntimeError(f"catalog scenarios must be {sorted(REQUIRED_SCENARIOS)}")

    fixture_scenarios = fixture.get("scenarios", {})
    if not isinstance(fixture_scenarios, dict) or set(fixture_scenarios) != REQUIRED_SCENARIOS:
        raise RuntimeError(f"fixture scenarios must be {sorted(REQUIRED_SCENARIOS)}")

    minimum = catalog.get("policy", {}).get("minimumCitationsPerScenario", 2)
    evidence_ids: set[str] = set()
    citation_count = 0

    for scenario_id in sorted(REQUIRED_SCENARIOS):
        catalog_row = catalog_by_id[scenario_id]
        allowed_domains = set(catalog_row.get("allowedDomains", []))
        if not allowed_domains:
            raise RuntimeError(f"{scenario_id}: allowedDomains must not be empty")

        evidence = fixture_scenarios[scenario_id].get("evidence", [])
        if not isinstance(evidence, list) or len(evidence) < minimum:
            raise RuntimeError(f"{scenario_id}: requires at least {minimum} citations")

        for item in evidence:
            if not isinstance(item, dict):
                raise RuntimeError(f"{scenario_id}: evidence entries must be objects")
            missing = REQUIRED_EVIDENCE_FIELDS - set(item)
            if missing:
                raise RuntimeError(f"{scenario_id}: evidence missing fields {sorted(missing)}")
            if item["scenarioId"] != scenario_id:
                raise RuntimeError(f"{item['id']}: scenarioId mismatch")
            if item["id"] in evidence_ids:
                raise RuntimeError(f"Duplicate evidence id: {item['id']}")
            evidence_ids.add(item["id"])

            parsed = urlparse(item["url"])
            if parsed.scheme != "https" or not parsed.hostname:
                raise RuntimeError(f"{item['id']}: URL must use https")
            if parsed.hostname != item["domain"]:
                raise RuntimeError(f"{item['id']}: URL hostname and domain field differ")
            if item["domain"] not in allowed_domains:
                raise RuntimeError(f"{item['id']}: domain is not in allowedDomains for {scenario_id}")
            datetime.fromisoformat(item["observedAt"])
            if item["factStatus"] != "fixture-contract":
                raise RuntimeError(f"{item['id']}: fixture factStatus must be fixture-contract")
            if not isinstance(item["limitations"], list) or not item["limitations"]:
                raise RuntimeError(f"{item['id']}: limitations must be a non-empty array")
            citation_count += 1

    return len(REQUIRED_SCENARIOS), citation_count


def main() -> None:
    scenario_count, citation_count = validate()
    print("[WebIQ Source Validation]")
    print(f"- scenarios: {scenario_count}")
    print(f"- citations: {citation_count}")
    print("- result: PASS")


if __name__ == "__main__":
    main()

