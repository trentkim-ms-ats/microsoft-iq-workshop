#!/usr/bin/env python3
# =============================================================================
# generate_definition.py
# -----------------------------------------------------------------------------
# Appendix B "선언적 일괄 정의 방식"의 정의 파일 생성기.
#
# 입력 : ontology_contract.yaml (엔터티/속성/관계 선언)
# 출력 : definition_parts/  아래에 Fabric Ontology definition parts(JSON)
#        - definition.json                                  (루트, 빈 오브젝트)
#        - .platform                                         (아이템 메타데이터)
#        - EntityTypes/<EntityId>/definition.json            (엔터티 + Property 인라인)
#        - EntityTypes/<EntityId>/DataBindings/<bindingId>.json  (컬럼→속성 매핑)
#        - RelationshipTypes/<RelId>/definition.json         (관계 정의)
#        - RelationshipTypes/<RelId>/Contextualizations/<ctxId>.json (FK 바인딩)
#        - _manifest.json                                    (parts 경로/ID 요약)
#
# 이 스크립트는 표준 라이브러리 + pyyaml 만 사용합니다 (로컬 준비 단계에서 실행).
# 실행:  python3 generate_definition.py
#        python3 generate_definition.py --contract ontology_contract.yaml --out definition_parts
#
# 생성된 definition_parts/ 폴더를 Fabric Lakehouse의
#   Files/ontology_bundle/definition_parts/  로 업로드한 뒤,
# Notebook(Appendix B-6)에서 읽어 한 번의 API 호출로 온톨로지를 배포합니다.
# =============================================================================
from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    raise SystemExit(
        "pyyaml 가 필요합니다.  설치:  pip install pyyaml\n"
        "(Fabric Notebook 에는 기본 포함되어 있습니다.)"
    )

# 재현 가능한(deterministic) ID 생성을 위한 고정 네임스페이스.
# 같은 계약 → 항상 같은 ID → 재실행해도 동일한 정의가 나옵니다.
_NAMESPACE = uuid.UUID("6f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b")

# Fabric Ontology 스키마 URL (버전 1.0.0)
SCHEMA_ENTITY = "https://developer.microsoft.com/json-schemas/fabric/item/ontology/entityType/1.0.0/schema.json"
SCHEMA_DATABINDING = "https://developer.microsoft.com/json-schemas/fabric/item/ontology/dataBinding/1.0.0/schema.json"
SCHEMA_RELATIONSHIP = "https://developer.microsoft.com/json-schemas/fabric/item/ontology/relationshipType/1.0.0/schema.json"
SCHEMA_CONTEXTUALIZATION = "https://developer.microsoft.com/json-schemas/fabric/item/ontology/contextualization/1.0.0/schema.json"
SCHEMA_PLATFORM = "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json"

# DataBinding/Contextualization 스키마에서 workspaceId, itemId가 필수이므로
# 기본값으로 형식상 유효한 0 UUID를 사용한다. 실제 배포 시에는 Notebook에서
# 현재 실행 환경의 값으로 치환한다.
UUID_ZERO = "00000000-0000-0000-0000-000000000000"


def det_uuid(*parts: str) -> str:
    """계약 상의 이름들로부터 결정적 UUID를 생성한다."""
    return str(uuid.uuid5(_NAMESPACE, "::".join(parts)))


def infer_value_type(column: str) -> str:
    """컬럼명 규칙으로 Fabric Ontology valueType 을 추론한다."""
    col = column.lower()
    if col.endswith("_at"):
        return "DateTime"
    if col.endswith("_date") or col == "join_date":
        return "DateTime"
    if col in {"quantity", "on_hand_qty", "reserved_qty"} or col.endswith("_qty"):
        return "BigInt"
    if (
        col.endswith("_amount")
        or col.endswith("_price")
        or col.endswith("_value")
        or col.endswith("_revenue")
        or col in {"discount_applied", "unit_price"}
    ):
        return "Double"
    return "String"


def build_entities(contract: dict, binding_workspace_id: str, binding_item_id: str, binding_source_schema: str) -> tuple[dict, dict, list]:
    """엔터티 정의/데이터바인딩 parts 와, 관계 생성에 필요한 인덱스를 만든다."""
    entity_ids: dict[str, str] = {}
    property_ids: dict[str, dict[str, str]] = {}
    parts: list[dict] = []

    for entity_name, spec in contract["entities"].items():
        entity_id = det_uuid("entity", entity_name)
        entity_ids[entity_name] = entity_id
        property_ids[entity_name] = {}

        # ---- Property (엔터티 정의 안에 인라인) ----
        properties = []
        for column in spec["fields"]:
            pid = det_uuid("property", entity_name, column)
            property_ids[entity_name][column] = pid
            properties.append(
                {
                    "id": pid,
                    "name": column,
                    "valueType": infer_value_type(column),
                    "sourceColumnName": column,
                }
            )

        pk_cols = spec["primary_key"]
        if isinstance(pk_cols, str):
            pk_cols = [pk_cols]
        entity_id_parts = [property_ids[entity_name][c] for c in pk_cols]
        display_col = spec.get("display", pk_cols[0])
        display_property_id = property_ids[entity_name][display_col]

        entity_definition = {
            "$schema": SCHEMA_ENTITY,
            "id": entity_id,
            "namespace": "usertypes",
            "baseEntityTypeId": None,
            "name": entity_name,
            "description": f"{entity_name} (source: {spec['source']})",
            "entityIdParts": entity_id_parts,
            "displayNamePropertyId": display_property_id,
            "namespaceType": "Custom",
            "visibility": "Visible",
            "properties": properties,
            "timeseriesProperties": [],
            "untypedProperties": [],
        }
        parts.append(
            {
                "path": f"EntityTypes/{entity_id}/definition.json",
                "content": entity_definition,
            }
        )

        # ---- DataBinding (Property ↔ Lakehouse 컬럼 매핑) ----
        binding_id = det_uuid("databinding", entity_name)
        property_bindings = [
            {
                "sourceColumnName": column,
                "targetPropertyId": property_ids[entity_name][column],
            }
            for column in spec["fields"]
        ]
        data_binding = {
            "$schema": SCHEMA_DATABINDING,
            "id": binding_id,
            "dataBindingConfiguration": {
                "dataBindingType": "NonTimeSeries",
                "propertyBindings": property_bindings,
                "sourceTableProperties": {
                    "sourceType": "LakehouseTable",
                    "workspaceId": binding_workspace_id,
                    "itemId": binding_item_id,
                    "sourceTableName": spec["source"],
                    "sourceSchema": binding_source_schema,
                },
            },
        }
        parts.append(
            {
                "path": f"EntityTypes/{entity_id}/DataBindings/{binding_id}.json",
                "content": data_binding,
            }
        )

    return entity_ids, property_ids, parts


def build_relationships(
    contract: dict,
    entity_ids: dict,
    property_ids: dict,
    binding_workspace_id: str,
    binding_item_id: str,
    binding_source_schema: str,
) -> list:
    """물리 관계(Contextualization 포함) + 논리 관계(정의만) parts 를 만든다."""
    parts: list[dict] = []

    # ---- 물리 관계: 관계 정의 + Contextualization(FK 바인딩) ----
    for rel in contract.get("relationships", []):
        rel_id = det_uuid("relationship", rel["name"])
        from_e, to_e = rel["from_entity"], rel["to_entity"]

        relationship_definition = {
            "$schema": SCHEMA_RELATIONSHIP,
            "id": rel_id,
            "namespace": "usertypes",
            "name": rel["name"],
            "displayName": rel.get("display_name", rel["name"]),
            "description": f"{rel.get('cardinality', '')} ({from_e} → {to_e})",
            "namespaceType": "Custom",
            "source": {"entityTypeId": entity_ids[from_e]},
            "target": {"entityTypeId": entity_ids[to_e]},
        }
        parts.append(
            {
                "path": f"RelationshipTypes/{rel_id}/definition.json",
                "content": relationship_definition,
            }
        )

        ctx_id = det_uuid("contextualization", rel["name"])
        contextualization = {
            "$schema": SCHEMA_CONTEXTUALIZATION,
            "id": ctx_id,
            "relationshipTypeId": rel_id,
            "dataBindingTable": {
                "sourceType": "LakehouseTable",
                "workspaceId": binding_workspace_id,
                "itemId": binding_item_id,
                "sourceTableName": rel["binding_table"],
                "sourceSchema": binding_source_schema,
            },
            "sourceKeyRefBindings": [
                {
                    "sourceColumnName": rel["from_key"],
                    "targetPropertyId": property_ids[from_e].get(rel["from_key"]),
                }
            ],
            "targetKeyRefBindings": [
                {
                    "sourceColumnName": rel["to_key"],
                    "targetPropertyId": property_ids[to_e].get(rel["to_key"]),
                }
            ],
        }
        parts.append(
            {
                "path": f"RelationshipTypes/{rel_id}/Contextualizations/{ctx_id}.json",
                "content": contextualization,
            }
        )

    # ---- 논리 관계: 관계 정의만 (FK 없음) ----
    for rel in contract.get("logical_relationships", []):
        rel_id = det_uuid("relationship", rel["name"])
        from_e, to_e = rel["from_entity"], rel["to_entity"]
        relationship_definition = {
            "$schema": SCHEMA_RELATIONSHIP,
            "id": rel_id,
            "namespace": "usertypes",
            "name": rel["name"],
            "displayName": rel.get("display_name", rel["name"]),
            "description": f"LOGICAL {rel.get('cardinality', '')} derived via {rel.get('derived_via', '')}",
            "isLogical": True,
            "namespaceType": "Custom",
            "source": {"entityTypeId": entity_ids[from_e]},
            "target": {"entityTypeId": entity_ids[to_e]},
        }
        parts.append(
            {
                "path": f"RelationshipTypes/{rel_id}/definition.json",
                "content": relationship_definition,
            }
        )

    return parts


def build_root_parts(contract: dict) -> list:
    """definition.json(빈) 과 .platform(아이템 메타) parts."""
    onto = contract["ontology"]
    platform = {
        "$schema": SCHEMA_PLATFORM,
        "metadata": {"type": "Ontology", "displayName": onto["display_name"]},
        "config": {"version": "2.0", "logicalId": "00000000-0000-0000-0000-000000000000"},
    }
    return [
        {"path": "definition.json", "content": {}},
        {"path": ".platform", "content": platform},
    ]


def main() -> None:
    ap = argparse.ArgumentParser(description="Track1 온톨로지 definition parts 생성기")
    ap.add_argument("--contract", default="ontology_contract.yaml", help="계약 YAML 경로")
    ap.add_argument("--out", default="definition_parts", help="출력 폴더")
    ap.add_argument("--binding-workspace-id", default=UUID_ZERO, help="DataBinding/Contextualization workspaceId")
    ap.add_argument("--binding-item-id", default=UUID_ZERO, help="DataBinding/Contextualization lakehouse itemId")
    ap.add_argument("--binding-source-schema", default="dbo", help="DataBinding/Contextualization source schema")
    args = ap.parse_args()

    base = Path(__file__).resolve().parent
    contract_path = (base / args.contract) if not Path(args.contract).is_absolute() else Path(args.contract)
    out_dir = (base / args.out) if not Path(args.out).is_absolute() else Path(args.out)

    with open(contract_path, "r", encoding="utf-8") as fh:
        contract = yaml.safe_load(fh)

    entity_ids, property_ids, entity_parts = build_entities(
        contract,
        args.binding_workspace_id,
        args.binding_item_id,
        args.binding_source_schema,
    )
    relationship_parts = build_relationships(
        contract,
        entity_ids,
        property_ids,
        args.binding_workspace_id,
        args.binding_item_id,
        args.binding_source_schema,
    )
    root_parts = build_root_parts(contract)
    all_parts = root_parts + entity_parts + relationship_parts

    # 이전 산출물 정리 후 재생성
    if out_dir.exists():
        import shutil

        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest_parts = []
    for part in all_parts:
        target = out_dir / part["path"]
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "w", encoding="utf-8") as fh:
            json.dump(part["content"], fh, ensure_ascii=False, indent=2)
        manifest_parts.append(part["path"])

    manifest = {
        "ontologyDisplayName": contract["ontology"]["display_name"],
        "description": contract["ontology"]["description"],
        "counts": {
            "entities": len(contract["entities"]),
            "physicalRelationships": len(contract.get("relationships", [])),
            "logicalRelationships": len(contract.get("logical_relationships", [])),
            "totalParts": len(all_parts),
        },
        "entityIds": entity_ids,
        "parts": manifest_parts,
    }
    with open(out_dir / "_manifest.json", "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)

    print(f"✅ 생성 완료: {out_dir}")
    print(f"   엔터티        : {manifest['counts']['entities']}")
    print(f"   물리 관계     : {manifest['counts']['physicalRelationships']}")
    print(f"   논리 관계     : {manifest['counts']['logicalRelationships']}")
    print(f"   총 parts      : {manifest['counts']['totalParts']} (+ _manifest.json)")


if __name__ == "__main__":
    main()
