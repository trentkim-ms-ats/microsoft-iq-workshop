#!/usr/bin/env python3
"""Generate deterministic Track4 FoundryIQ inputs from Track1/Track2 artifacts.

The filename and track3_seed_summary.json basename are legacy compatibility
identifiers; all default paths resolve to canonical track4/data.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_TRACK1_ROOT = ROOT.parent.parent / "track1" / "data"
DEFAULT_TRACK2_MANIFEST = ROOT.parent.parent / "track2" / "data" / "generated" / "manifests" / "content_manifest.csv"
DEFAULT_OUTPUT_DIR = ROOT / "generated"

CORE_CAMPAIGNS = {"SummerPush", "BackToSchool", "VIPRetention", "FlashWeek"}
CORE_PRODUCTS = {"AeroPhone X", "SmartWatch Pro", "UltraBook 15"}
SUCCESS_PAYMENT_STATUSES = {"success", "retrysuccess"}

SCENARIOS: list[dict[str, Any]] = [
    {
        "id": "Q1",
        "question": "결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?",
        "goal": "캠페인별 전환율과 결제 실패 패턴 비교",
        "keywords": ["SummerPush", "VIPRetention", "결제", "payment", "전환율"],
        "semanticKeys": ["CampaignId", "OrderId", "PaymentStatus"],
    },
    {
        "id": "Q2",
        "question": "배송 지연은 반품률과 고객 불만 티켓에 어떤 영향을 미치는가?",
        "goal": "배송 지연군의 반품/불만율 확인",
        "keywords": ["배송", "LateDelivery", "logistics", "return", "ticket"],
        "semanticKeys": ["OrderId", "DeliveryStatus", "ReturnId", "TicketId"],
    },
    {
        "id": "Q3",
        "question": "Q3 핵심 상품 3종의 매출/반품 신호를 어떻게 해석할 것인가?",
        "goal": "AeroPhone X/SmartWatch Pro/UltraBook 15 성과 비교",
        "keywords": ["AeroPhone X", "SmartWatch Pro", "UltraBook 15", "Q3", "제품"],
        "semanticKeys": ["ProductId", "OrderId", "ReturnId"],
    },
]


@dataclass
class EvidenceItem:
    item_id: str
    source: str
    title: str
    business_date: str
    owner: str
    location: str
    target: str

    def to_dict(self) -> dict[str, str]:
        return {
            "id": self.item_id,
            "source": self.source,
            "title": self.title,
            "businessDate": self.business_date,
            "owner": self.owner,
            "location": self.location,
            "target": self.target,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Track4 FoundryIQ scenario datasets from Track1/Track2 assets."
    )
    parser.add_argument(
        "--track1-root",
        type=Path,
        default=DEFAULT_TRACK1_ROOT,
        help="Track1 sample data folder containing CSV files.",
    )
    parser.add_argument(
        "--track2-manifest",
        type=Path,
        default=DEFAULT_TRACK2_MANIFEST,
        help="Track2 content manifest CSV path.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Output directory where Track4 FoundryIQ generated files are saved.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON output.",
    )
    return parser.parse_args()


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        raise RuntimeError(f"CSV file not found: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def to_float(value: str) -> float:
    if value is None:
        return 0.0
    token = value.strip()
    if not token:
        return 0.0
    return float(token)


def normalize_text(value: str) -> str:
    return " ".join(value.strip().split())


def build_q1_metrics(track1_root: Path) -> dict[str, Any]:
    campaigns = read_csv_rows(track1_root / "campaigns.csv")
    campaign_names = {row["campaign_id"]: row["campaign_name"] for row in campaigns if row["campaign_name"] in CORE_CAMPAIGNS}

    attribution = read_csv_rows(track1_root / "campaign_attribution.csv")
    payments = read_csv_rows(track1_root / "payments.csv")

    payment_status_by_order: dict[str, str] = {}
    for row in payments:
        order_id = normalize_text(row.get("order_id", ""))
        if not order_id:
            continue
        status = normalize_text(row.get("payment_status", ""))
        if status:
            payment_status_by_order[order_id] = status

    orders_by_campaign: dict[str, set[str]] = defaultdict(set)
    for campaign_id in campaign_names:
        orders_by_campaign[campaign_id]
    for row in attribution:
        campaign_id = normalize_text(row.get("campaign_id", ""))
        order_id = normalize_text(row.get("order_id", ""))
        if campaign_id in campaign_names and order_id:
            orders_by_campaign[campaign_id].add(order_id)

    per_campaign: list[dict[str, Any]] = []
    for campaign_id, campaign_name in sorted(campaign_names.items(), key=lambda item: item[1]):
        order_ids = orders_by_campaign[campaign_id]
        success_count = 0
        failed_count = 0
        for order_id in order_ids:
            status = payment_status_by_order.get(order_id, "").lower()
            if status in SUCCESS_PAYMENT_STATUSES:
                success_count += 1
            else:
                failed_count += 1
        total = len(order_ids)
        conversion_rate = round((success_count / total) * 100, 2) if total else 0.0
        per_campaign.append(
            {
                "campaignId": campaign_id,
                "campaignName": campaign_name,
                "orders": total,
                "paymentSuccessOrders": success_count,
                "paymentFailedOrUnknownOrders": failed_count,
                "conversionRatePct": conversion_rate,
            }
        )

    sorted_rates = sorted(per_campaign, key=lambda row: row["conversionRatePct"], reverse=True)
    best = sorted_rates[0]["campaignName"] if sorted_rates else "-"
    worst = sorted_rates[-1]["campaignName"] if sorted_rates else "-"

    highlights = [
        f"핵심 캠페인 {len(per_campaign)}개를 비교했고 최고 전환율은 {best}, 최저 전환율은 {worst}이다.",
        "payment_status가 Success/RetrySuccess가 아닌 주문은 결제 실패/미확정으로 분류했다.",
    ]

    return {
        "scenarioId": "Q1",
        "title": "결제 실패-전환율 영향 분석",
        "highlights": highlights,
        "perCampaign": per_campaign,
    }


def build_q2_metrics(track1_root: Path) -> dict[str, Any]:
    shipments = read_csv_rows(track1_root / "shipments.csv")
    returns = read_csv_rows(track1_root / "returns.csv")
    tickets = read_csv_rows(track1_root / "support_tickets.csv")

    delayed_orders: set[str] = set()
    for row in shipments:
        status = normalize_text(row.get("shipment_status", "")).lower()
        order_id = normalize_text(row.get("order_id", ""))
        if order_id and "delay" in status:
            delayed_orders.add(order_id)

    returned_orders: set[str] = set()
    delayed_return_reasons: Counter[str] = Counter()
    for row in returns:
        order_id = normalize_text(row.get("order_id", ""))
        reason = normalize_text(row.get("return_reason", "")) or "Unknown"
        if not order_id:
            continue
        returned_orders.add(order_id)
        if order_id in delayed_orders:
            delayed_return_reasons[reason] += 1

    complaint_orders: set[str] = set()
    for row in tickets:
        order_id = normalize_text(row.get("order_id", ""))
        ticket_type = normalize_text(row.get("ticket_type", "")).upper()
        if order_id and ticket_type == "COMPLAINT":
            complaint_orders.add(order_id)

    delayed_return_orders = delayed_orders & returned_orders
    delayed_complaint_orders = delayed_orders & complaint_orders
    delayed_count = len(delayed_orders)

    delayed_return_rate = round((len(delayed_return_orders) / delayed_count) * 100, 2) if delayed_count else 0.0
    delayed_complaint_rate = round((len(delayed_complaint_orders) / delayed_count) * 100, 2) if delayed_count else 0.0

    top_reasons = [{"reason": reason, "count": count} for reason, count in delayed_return_reasons.most_common(3)]

    highlights = [
        f"배송 지연 주문 {delayed_count}건 중 반품 발생 비율은 {delayed_return_rate}%이다.",
        f"배송 지연 주문의 COMPLAINT 티켓 비율은 {delayed_complaint_rate}%이다.",
    ]

    return {
        "scenarioId": "Q2",
        "title": "배송 지연 영향 분석",
        "highlights": highlights,
        "delayedOrderCount": delayed_count,
        "delayedReturnRatePct": delayed_return_rate,
        "delayedComplaintRatePct": delayed_complaint_rate,
        "topDelayedReturnReasons": top_reasons,
    }


def build_q3_metrics(track1_root: Path) -> dict[str, Any]:
    products = read_csv_rows(track1_root / "products.csv")
    order_items = read_csv_rows(track1_root / "order_items.csv")
    returns = read_csv_rows(track1_root / "returns.csv")

    product_name_by_id = {row["product_id"]: row["product_name"] for row in products}
    target_product_ids = {product_id for product_id, name in product_name_by_id.items() if name in CORE_PRODUCTS}

    summary: dict[str, dict[str, Any]] = {}
    for product_name in sorted(CORE_PRODUCTS):
        summary[product_name] = {"orderIds": set(), "units": 0.0, "salesAmount": 0.0, "returns": 0}

    for row in order_items:
        product_id = normalize_text(row.get("product_id", ""))
        order_id = normalize_text(row.get("order_id", ""))
        if product_id not in target_product_ids or not order_id:
            continue
        product_name = product_name_by_id[product_id]
        summary_row = summary[product_name]
        summary_row["orderIds"].add(order_id)
        summary_row["units"] += to_float(row.get("quantity", "0"))
        summary_row["salesAmount"] += to_float(row.get("sales_amount", "0"))

    for row in returns:
        product_id = normalize_text(row.get("product_id", ""))
        if product_id in target_product_ids:
            product_name = product_name_by_id[product_id]
            summary[product_name]["returns"] += 1

    per_product: list[dict[str, Any]] = []
    for product_name in sorted(summary):
        row = summary[product_name]
        order_count = len(row["orderIds"])
        per_product.append(
            {
                "productName": product_name,
                "orderCount": order_count,
                "units": int(row["units"]),
                "salesAmount": round(row["salesAmount"], 2),
                "returnCount": row["returns"],
                "returnRatePct": round((row["returns"] / order_count) * 100, 2) if order_count else 0.0,
            }
        )

    highlights = [
        "Q3 핵심 상품 3종(AeroPhone X, SmartWatch Pro, UltraBook 15)을 동일 기준으로 비교했다.",
        "주문 수, 매출, 반품률을 함께 보고 대응 우선순위를 선정한다.",
    ]

    return {
        "scenarioId": "Q3",
        "title": "핵심 상품 3종 성과 비교",
        "highlights": highlights,
        "perProduct": per_product,
    }


def score_manifest_row(row: dict[str, str], keywords: list[str]) -> int:
    title = normalize_text(row.get("title", "")).lower()
    keyword_blob = normalize_text(row.get("keywords", "")).lower()
    score = 0
    for keyword in keywords:
        token = keyword.lower()
        if token in keyword_blob:
            score += 3
        if token in title:
            score += 2
    return score


def pick_evidence(manifest_rows: list[dict[str, str]], keywords: list[str], limit: int = 8) -> list[EvidenceItem]:
    candidates: list[tuple[int, EvidenceItem]] = []
    for row in manifest_rows:
        score = score_manifest_row(row, keywords)
        if score <= 0:
            continue
        candidates.append(
            (
                score,
                EvidenceItem(
                    item_id=normalize_text(row.get("id", "")),
                    source=normalize_text(row.get("source", "")),
                    title=normalize_text(row.get("title", "")),
                    business_date=normalize_text(row.get("businessDate", "")),
                    owner=normalize_text(row.get("owner", "")),
                    location=normalize_text(row.get("location", "")),
                    target=normalize_text(row.get("target", "")),
                ),
            )
        )

    candidates.sort(key=lambda item: (item[0], item[1].business_date), reverse=True)

    selected: list[EvidenceItem] = []
    seen_sources: set[str] = set()
    for _, item in candidates:
        if item.source and item.source not in seen_sources:
            selected.append(item)
            seen_sources.add(item.source)
            if len(selected) >= limit:
                return selected

    for _, item in candidates:
        if item in selected:
            continue
        selected.append(item)
        if len(selected) >= limit:
            break
    return selected


def write_json(path: Path, payload: Any, *, pretty: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if pretty:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    args = parse_args()
    track1_root = args.track1_root.resolve()
    manifest_path = args.track2_manifest.resolve()
    output_dir = args.output_dir.resolve()

    manifest_rows = read_csv_rows(manifest_path)
    source_counts = Counter(row.get("source", "").strip() for row in manifest_rows if row.get("source"))

    tool_a_metrics = {
        "Q1": build_q1_metrics(track1_root),
        "Q2": build_q2_metrics(track1_root),
        "Q3": build_q3_metrics(track1_root),
    }

    tool_b_evidence: dict[str, dict[str, Any]] = {}
    for scenario in SCENARIOS:
        evidence = pick_evidence(manifest_rows, scenario["keywords"])
        tool_b_evidence[scenario["id"]] = {
            "scenarioId": scenario["id"],
            "keywords": scenario["keywords"],
            "evidence": [item.to_dict() for item in evidence],
            "sourceCoverage": dict(Counter(item.source for item in evidence)),
        }

    scenario_payload = {
        "generatedFrom": {
            "track1Root": str(track1_root),
            "track2Manifest": str(manifest_path),
        },
        "scenarios": SCENARIOS,
    }
    summary_payload = {
        "manifestTotalItems": len(manifest_rows),
        "manifestSourceCounts": dict(source_counts),
        "scenarioCount": len(SCENARIOS),
    }

    write_json(output_dir / "scenarios.json", scenario_payload, pretty=args.pretty)
    write_json(output_dir / "tool_a_metrics.json", tool_a_metrics, pretty=args.pretty)
    write_json(output_dir / "tool_b_evidence.json", tool_b_evidence, pretty=args.pretty)
    write_json(output_dir / "track3_seed_summary.json", summary_payload, pretty=args.pretty)

    print("[Track4 FoundryIQ Sample Generation]")
    print(f"- outputDir: {output_dir}")
    print(f"- scenarios: {len(SCENARIOS)}")
    print(f"- manifestItems: {len(manifest_rows)}")
    print(f"- manifestSources: {dict(source_counts)}")


if __name__ == "__main__":
    main()
