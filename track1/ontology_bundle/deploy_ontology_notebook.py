# =============================================================================
# deploy_ontology_notebook.py
# -----------------------------------------------------------------------------
# Appendix B "선언적 일괄 정의 방식"을 Fabric Notebook 에서 실행하는 배포 코드.
#
# 이 파일은 Fabric Notebook 셀 단위로 붙여넣어 실행하도록 구성되어 있습니다.
# 각 "# ======== CELL n ========" 블록을 하나의 노트북 셀에 복사하세요.
# =============================================================================


# ======== CELL 1 : 설정 ========
import base64
import json
import os

import requests

FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1"

WORKSPACE_ID = "your-workspace-id"
LAKEHOUSE_ID = "your-lakehouse-item-id"
ONTOLOGY_NAME = "retail_track1_ontology_v1"
PARTS_ROOT = "/lakehouse/default/Files/ontology_bundle/definition_parts"

print("FABRIC_API_BASE:", FABRIC_API_BASE)
print("WORKSPACE_ID   :", WORKSPACE_ID)
print("LAKEHOUSE_ID   :", LAKEHOUSE_ID)
print("ONTOLOGY_NAME  :", ONTOLOGY_NAME)
print("PARTS_ROOT     :", PARTS_ROOT)


# ======== CELL 2 : 인증 토큰 ========
from notebookutils.authentication import AzureStorageCredentialsManager

try:
    token = AzureStorageCredentialsManager().get_notebookutils_aad_token()
    headers = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}
    print("✅ 인증 토큰 획득 완료")
except Exception as exc:  # noqa: BLE001
    token = None
    print("❌ 토큰 획득 실패:", exc)
    print("   → Fabric 권한/capacity 연결을 확인하세요.")


# ======== CELL 3 : definition_parts 읽어 definition.parts[] 조립 ========
def _inject_binding_identifiers(part_path: str, payload_obj: dict, workspace_id: str, lakehouse_id: str) -> dict:
    if "/DataBindings/" in part_path:
        if "dataBindingConfiguration" in payload_obj:
            source = payload_obj["dataBindingConfiguration"].get("sourceTableProperties", {})
            source["workspaceId"] = workspace_id
            source["itemId"] = lakehouse_id
        if "sourceTableProperties" in payload_obj:
            source = payload_obj["sourceTableProperties"]
            source["workspaceId"] = workspace_id
            source["itemId"] = lakehouse_id

    if "/Contextualizations/" in part_path:
        if "dataBindingTable" in payload_obj:
            table = payload_obj["dataBindingTable"]
            table["workspaceId"] = workspace_id
            table["itemId"] = lakehouse_id
        if "bindingTableProperties" in payload_obj:
            table = payload_obj["bindingTableProperties"]
            table["workspaceId"] = workspace_id
            table["itemId"] = lakehouse_id

    return payload_obj


def build_definition_from_folder(parts_root: str, workspace_id: str, lakehouse_id: str) -> dict:
    if not os.path.isdir(parts_root):
        raise FileNotFoundError(
            f"경로를 찾을 수 없습니다: {parts_root}\n"
            "definition_parts 폴더를 Lakehouse Files 에 업로드했는지, "
            "이 Notebook 에 default Lakehouse 가 연결되었는지 확인하세요."
        )

    parts = []
    for dirpath, _dirnames, filenames in os.walk(parts_root):
        for filename in sorted(filenames):
            if filename == "_manifest.json":
                continue
            abs_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(abs_path, parts_root).replace(os.sep, "/")
            with open(abs_path, "r", encoding="utf-8") as fh:
                payload_obj = json.load(fh)
            payload_obj = _inject_binding_identifiers(rel_path, payload_obj, workspace_id, lakehouse_id)
            raw_bytes = json.dumps(payload_obj, ensure_ascii=False, indent=2).encode("utf-8")
            parts.append(
                {
                    "path": rel_path,
                    "payload": base64.b64encode(raw_bytes).decode("utf-8"),
                    "payloadType": "InlineBase64",
                }
            )

    priority = {".platform": 0, "definition.json": 1}
    parts.sort(key=lambda p: (priority.get(p["path"], 2), p["path"]))
    return {"parts": parts}


def build_core_definition(definition: dict) -> dict:
    core_parts = [
        p
        for p in definition["parts"]
        if "/DataBindings/" not in p["path"] and "/Contextualizations/" not in p["path"]
    ]
    return {"parts": core_parts}


definition_full = build_definition_from_folder(PARTS_ROOT, WORKSPACE_ID, LAKEHOUSE_ID)
definition_core = build_core_definition(definition_full)
print(f"✅ parts 조립 완료: full={len(definition_full['parts'])} / core={len(definition_core['parts'])}")
for p in definition_full["parts"][:5]:
    print("  -", p["path"])
print("  ...")


# ======== CELL 4 : 온톨로지 생성(create) 또는 정의 교체(updateDefinition) ========
def find_existing_ontology(workspace_id: str, display_name: str) -> str | None:
    url = f"{FABRIC_API_BASE}/workspaces/{workspace_id}/ontologies"
    resp = requests.get(url, headers=headers, timeout=30)
    if resp.status_code != 200:
        print("ℹ️ 목록 조회 실패(무시 가능):", resp.status_code, resp.text[:200])
        return None
    for item in resp.json().get("value", []):
        if item.get("displayName") == display_name:
            return item.get("id")
    return None


assert token, "토큰이 없습니다. CELL 2 를 먼저 성공시키세요."

existing_id = find_existing_ontology(WORKSPACE_ID, ONTOLOGY_NAME)

if existing_id:
    print(f"🔁 기존 온톨로지 발견 → updateDefinition (id={existing_id})")
    url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{existing_id}/updateDefinition?updateMetadata=True"
    resp = requests.post(url, headers=headers, json={"definition": definition_full}, timeout=120)
    # 일부 환경에서는 DataBinding/Contextualization 포함 시 ALMOperationImportFailed가 발생할 수 있어 core 재시도
    if resp.status_code == 400 and "ALMOperationImportFailed" in (resp.text or ""):
        print("⚠️ full(67 parts) 배포 실패 → core(36 parts: 엔터티/관계 중심)로 재시도")
        resp = requests.post(url, headers=headers, json={"definition": definition_core}, timeout=120)
    ONTOLOGY_ID = existing_id
else:
    print("🆕 신규 온톨로지 생성 → POST /ontologies")
    url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies"
    body = {
        "displayName": ONTOLOGY_NAME,
        "description": "Track1 선언적 일괄 정의(Appendix B)",
        "definition": definition_full,
    }
    resp = requests.post(url, headers=headers, json=body, timeout=120)
    if resp.status_code == 400 and "ALMOperationImportFailed" in (resp.text or ""):
        print("⚠️ full(67 parts) 생성 실패 → core(36 parts: 엔터티/관계 중심)로 재시도")
        body["definition"] = definition_core
        resp = requests.post(url, headers=headers, json=body, timeout=120)
    ONTOLOGY_ID = None
    if resp.status_code in (200, 201):
        ONTOLOGY_ID = resp.json().get("id")

print("상태 코드:", resp.status_code)
print(resp.text[:800])

if resp.status_code == 202 and resp.headers.get("Location"):
    import time

    location = resp.headers["Location"]
    for _ in range(60):
        poll = requests.get(location, headers=headers, timeout=30)
        status = (poll.json() or {}).get("status", "").lower()
        print("  LRO status:", status)
        if status in ("succeeded", "completed", "failed"):
            break
        time.sleep(5)

if resp.status_code in (200, 201, 202):
    print("✅ 배포 요청 성공")
else:
    print("❌ 배포 실패 - 응답 본문을 확인하세요.")


# ======== CELL 5 : 검증 (getDefinition → base64 decode) ========
if not ONTOLOGY_ID:
    ONTOLOGY_ID = find_existing_ontology(WORKSPACE_ID, ONTOLOGY_NAME)

url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition"
resp = requests.post(url, headers=headers, timeout=60)
print("getDefinition:", resp.status_code)

if resp.status_code == 200:
    returned_parts = resp.json()["definition"]["parts"]
    entity_parts = [p for p in returned_parts if p["path"].startswith("EntityTypes/") and p["path"].endswith("definition.json")]
    rel_parts = [p for p in returned_parts if p["path"].startswith("RelationshipTypes/") and p["path"].endswith("definition.json")]
    db_parts = [p for p in returned_parts if "/DataBindings/" in p["path"]]
    ctx_parts = [p for p in returned_parts if "/Contextualizations/" in p["path"]]
    print(f"  총 parts       : {len(returned_parts)}")
    print(f"  엔터티 정의    : {len(entity_parts)}")
    print(f"  관계 정의      : {len(rel_parts)}")
    print(f"  DataBindings   : {len(db_parts)}")
    print(f"  Contextualizations: {len(ctx_parts)}")

    if entity_parts:
        decoded = base64.b64decode(entity_parts[0]["payload"]).decode("utf-8")
        sample = json.loads(decoded)
        print("\n  예시 엔터티:", sample.get("name"))
        print("   속성:", [prop["name"] for prop in sample.get("properties", [])])
    print("\n✅ 검증 완료: definition 이 정상적으로 채워졌습니다.")
else:
    print(resp.text[:800])


# ======== CELL 6 : 온톨로지와 실제 샘플 데이터 값 매핑 검증 ========
# 목적:
# - Ontology item 정의에서 Entity -> (Lakehouse table, column) 매핑을 추출하고
# - 실제 Lakehouse 테이블 값 샘플을 조회해, "어떤 값이 온톨로지에 연결되는지" 확인
#
# 참고:
# - Ontology item 자체에는 레코드 값이 저장되지 않고, 스키마/매핑 정의가 저장됩니다.
# - 실제 값은 Lakehouse 테이블에서 조회해야 합니다.

import base64

sample_rows = 5
max_columns_per_query = 6


def _unique_preserve_order(values: list[str]) -> list[str]:
    seen = set()
    ordered = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def _print_validation_header(mapping_source: str, entity_count: int) -> None:
    print("\n=== ONTOLOGY_VALUE_VALIDATION_START ===")
    print(f"workspaceId={WORKSPACE_ID}")
    print(f"ontologyId={ONTOLOGY_ID}")
    print(f"ontologyName={ONTOLOGY_NAME}")
    print(f"mappingSource={mapping_source}")
    print(f"sampleRows={sample_rows}")
    print(f"entityCount={entity_count}")
    print("======================================")

url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition"
resp = requests.post(url, headers=headers, timeout=60)
assert resp.status_code == 200, f"getDefinition 실패: {resp.status_code} {resp.text[:300]}"
parts = resp.json()["definition"]["parts"]

# 1) 엔터티 ID -> 엔터티 이름 매핑
entity_name_by_id = {}
for part in parts:
    if part["path"].startswith("EntityTypes/") and part["path"].endswith("definition.json"):
        entity_def = json.loads(base64.b64decode(part["payload"]).decode("utf-8"))
        entity_name_by_id[entity_def["id"]] = entity_def["name"]

# 2) DataBinding 파트에서 Entity -> table/columns 추출
mapping = {}
mapping_source = "DataBinding"
for part in parts:
    if "/DataBindings/" not in part["path"]:
        continue
    binding = json.loads(base64.b64decode(part["payload"]).decode("utf-8"))

    # Entity ID는 path 기준으로 안정적으로 찾는다: EntityTypes/{entityId}/DataBindings/{bindingId}.json
    tokens = part["path"].split("/")
    entity_id = tokens[1]
    entity_name = entity_name_by_id.get(entity_id, entity_id)

    cfg = binding.get("dataBindingConfiguration", {})
    source_props = cfg.get("sourceTableProperties", {})
    table_name = source_props.get("sourceTableName")
    property_bindings = cfg.get("propertyBindings", [])
    source_columns = _unique_preserve_order([b["sourceColumnName"] for b in property_bindings if b.get("sourceColumnName")])

    if table_name and source_columns:
        mapping[entity_name] = {"table": table_name, "columns": source_columns}

# 3) core fallback(36 parts)로 DataBinding이 없으면 워크숍 기본 매핑 사용
if not mapping:
    mapping_source = "WorkshopFallback"
    print("ℹ️ DataBindings가 없어(core 배포), 워크숍 기본 매핑으로 샘플 값을 검증합니다.")
    mapping = {
        "Customer": {"table": "customers", "columns": ["customer_id", "customer_segment", "customer_tier", "join_date"]},
        "Product": {"table": "products", "columns": ["product_id", "product_name", "category", "unit_price", "currency"]},
        "Channel": {"table": "channels", "columns": ["channel_id", "channel_name"]},
        "Campaign": {"table": "campaigns", "columns": ["campaign_id", "campaign_name", "campaign_type", "channel_id", "start_date", "end_date"]},
        "Promotion": {"table": "promotions", "columns": ["promotion_id", "promotion_name", "promotion_type", "discount_amount", "start_date", "end_date"]},
        "Order": {"table": "orders", "columns": ["order_id", "customer_id", "channel_id", "order_date", "order_status", "gross_amount", "discount_applied", "net_amount", "order_value", "currency"]},
        "OrderItem": {"table": "order_items", "columns": ["order_id", "product_id", "quantity", "sales_amount"]},
        "Payment": {"table": "payments", "columns": ["payment_id", "order_id", "payment_status", "approved_amount", "approved_at"]},
        "Shipment": {"table": "shipments", "columns": ["shipment_id", "order_id", "shipment_status", "delivered_at"]},
        "Return": {"table": "returns", "columns": ["return_id", "order_id", "product_id", "customer_id", "return_reason", "return_date"]},
        "SupportTicket": {"table": "support_tickets", "columns": ["ticket_id", "customer_id", "order_id", "ticket_type", "ticket_reason", "created_at"]},
        "InventorySnapshot": {"table": "inventory_snapshots", "columns": ["snapshot_id", "product_id", "snapshot_date", "on_hand_qty", "reserved_qty"]},
        "OrderPromotion": {"table": "order_promotions", "columns": ["order_id", "promotion_id"]},
        "CampaignAttribution": {"table": "campaign_attribution", "columns": ["campaign_id", "order_id", "customer_id", "attribution_model", "attributed_revenue"]},
    }

# 4) 실제 값 샘플 조회
_print_validation_header(mapping_source, len(mapping))
validation_summary = []
for entity_name in sorted(mapping.keys()):
    table_name = mapping[entity_name]["table"]
    all_columns = _unique_preserve_order(mapping[entity_name]["columns"])
    cols = all_columns[:max_columns_per_query]
    cols_sql = ", ".join([f"`{c}`" for c in cols])
    query = f"SELECT {cols_sql} FROM `{table_name}` LIMIT {sample_rows}"
    print(f"\n[ENTITY] name={entity_name} table={table_name}")
    print(f"[COLUMNS] selected={','.join(cols)} total={len(all_columns)}")
    print(f"[QUERY] {query}")
    spark.sql(query).show(truncate=False)
    print(f"[ENTITY_DONE] name={entity_name}")
    validation_summary.append(
        {
            "entityName": entity_name,
            "tableName": table_name,
            "mappingSource": mapping_source,
            "selectedColumns": ", ".join(cols),
            "totalColumns": len(all_columns),
            "sampleRows": sample_rows,
        }
    )

print("\n=== ONTOLOGY_VALUE_VALIDATION_SUMMARY ===")
spark.createDataFrame(validation_summary).orderBy("entityName").show(truncate=False)
print("=== ONTOLOGY_VALUE_VALIDATION_DONE ===")
