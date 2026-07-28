## Appendix A Fabric Ontology Auto Script
### Appendix A. Fabric Ontology 자동 구성 스크립트 (미션 4 보조)

> Appendix A는 Track1 WORKBOOK에서 분리된 별도 자동화 실행 가이드 문서입니다.
> 이 Appendix는 미션 4의 엔터티/속성/관계를 Notebook(PySpark) 셀에서 **REST API로 자동 구성**하는 보조 자료입니다.
> UI 수동 생성과 결과는 동일하며, 시간을 단축하려는 팀만 선택적으로 사용하세요.
> 아래 단계 번호는 미션 4 [Fabric Ontology로 구성하는 방법](../WORKBOOK.md)의 UI 단계와 대응됩니다.

| Appendix 단계 | 작업 | 자동화 방식 | 대응 미션4 UI 단계 |
|---|---|---|---|
| 단계 1 | 엔터티 14개 생성 | ✅ REST API | 2. 엔터티 14개 생성 |
| 단계 3 | 엔터티 속성 추가 | ✅ Definition API | 3. 각 엔터티 속성 추가 |
| 단계 4 | 원천 테이블 매핑 | 🖱️ UI 수동 | 4. 원천 테이블 매핑 연결 |
| 단계 5 | 물리 관계(FK) | ✅ REST API | 5. 물리 관계(1차) 생성 |
| 단계 6 | 논리 관계(다중홉) | 🖱️ UI 수동 | 7. 논리 관계(3차) 정의 |

> ⚠️ 단계 2(생성 확인)와 단계 4·6(매핑/논리 관계)은 현재 Preview API 미공개로 UI에서 수행합니다.
> API는 Preview 단계로 엔드포인트가 변경될 수 있으므로, 실패 시 미션 4의 UI 수동 절차로 진행하세요.

### 단계 1: 엔터티 14개 생성 (Python REST API)

**위치**: Notebook(PySpark)의 별도 셀에서 실행 (미션 4 > 엔터티 14개 생성 단계)

**전제 조건**:
- Fabric Workspace 생성 완료
- Ontology 항목 생성 완료 (또는 사전에 생성됨)
- Workspace ID, Ontology ID를 먼저 조회

**Workspace ID / Ontology ID 조회 방법** (URL 기반 - 모든 환경 지원):

**① Workspace ID 찾기**:
1. Workspace 진입
2. 브라우저 주소창 확인
3. 아래 패턴 중 하나에서 ID 추출:
   - `https://app.fabric.microsoft.com/workspaces/{WORKSPACE_ID}` → ID 복사
   - `https://msit.powerbi.com/groups/{WORKSPACE_ID}` → ID 복사 (또는 여기서 "WORKSPACE_ID"는 group ID)
   - `https://powerbi.microsoft.com/groups/{WORKSPACE_ID}` → ID 복사

   예:
   ```
   https://msit.powerbi.com/groups/12345678-1234-5678-1234-567812345678/...
   → Workspace ID = 12345678-1234-5678-1234-567812345678
   ```

**② Ontology ID 찾기**:
1. Ontology 항목 열기
2. 브라우저 주소창 확인: `?itemId=` 또는 `?viewModel=` 뒤의 ID
   
   예:
   ```
   https://msit.powerbi.com/groups/.../reports/abcd1234-...?itemId=xyz789...
   → Ontology ID = xyz789...
   ```

**③ 가장 간단한 방법 (권장): Notebook 내 자동 추출**:
```python
# Notebook 실행 환경에서 자동으로 ID 획득 (토큰 방식과 같음)
# 아래 스크립트 최상단에 추가

import requests
from notebookutils.authentication import AzureStorageCredentialsManager

# 현재 Workspace/Item ID 자동 감지 (일부 환경)
# 또는 수동 기입 후 테스트

WORKSPACE_ID = "12345678-1234-5678-1234-567812345678"  # 위에서 복사
ONTOLOGY_ID = "abcd1234-efgh-5678-ijkl-mnopqrstuvwx"    # 위에서 복사

print(f"✓ Workspace ID: {WORKSPACE_ID}")
print(f"✓ Ontology ID: {ONTOLOGY_ID}")
```

**Script 실행**:

```python
# Fabric Ontology REST API를 통한 14개 엔터티 일괄 생성
# 실행 시간: 일반적으로 수초~2분(비동기 처리/환경에 따라 달라짐)

import requests
import json
from notebookutils.authentication import AzureStorageCredentialsManager

# ============ 설정 ============
FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1"
WORKSPACE_ID = "your-workspace-id"  # 위 조회 방법으로 기입
ONTOLOGY_ID = "your-ontology-id"      # 위 조회 방법으로 기입

# ============ 인증 토큰 (Fabric 자동 제공) ============
try:
    token = AzureStorageCredentialsManager().get_notebookutils_aad_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    print("✅ 인증 토큰 획득 완료")
except Exception as e:
    print(f"❌ 토큰 획득 실패: {str(e)}")
    print("   → Fabric 권한 재확인 또는 UI 수동 생성으로 진행하세요.")
    token = None

# ============ 14개 엔터티 정의 ============
entities_config = [
    {"name": "Customer", "description": "고객 마스터"},
    {"name": "Product", "description": "상품 카탈로그"},
    {"name": "Channel", "description": "판매 채널"},
    {"name": "Campaign", "description": "마케팅 캠페인"},
    {"name": "Promotion", "description": "프로모션/할인"},
    {"name": "Order", "description": "고객 주문"},
    {"name": "OrderItem", "description": "주문 상세 항목"},
    {"name": "Payment", "description": "결제 기록"},
    {"name": "Shipment", "description": "배송 정보"},
    {"name": "Return", "description": "반품 기록"},
    {"name": "SupportTicket", "description": "고객 지원 문의"},
    {"name": "InventorySnapshot", "description": "재고 스냅샷"},
    {"name": "OrderPromotion", "description": "주문-프로모션 브릿지 (N:M)"},
    {"name": "CampaignAttribution", "description": "캠페인-어트리뷰션 브릿지 (N:M)"},
]

# ============ 단일 Ontology 안에 EntityTypes 추가 ============
# /items에 Ontology를 14번 생성하면 "엔터티 14개"가 아니라 빈 Ontology item 14개가 생깁니다.
# 반드시 현재 ONTOLOGY_ID의 definition.parts에 EntityTypes를 추가합니다.
import base64
import uuid

id_property_by_entity = {
    "Customer": "customer_id",
    "Product": "product_id",
    "Channel": "channel_id",
    "Campaign": "campaign_id",
    "Promotion": "promotion_id",
    "Order": "order_id",
    "OrderItem": "order_id",
    "Payment": "payment_id",
    "Shipment": "shipment_id",
    "Return": "return_id",
    "SupportTicket": "ticket_id",
    "InventorySnapshot": "snapshot_id",
    "OrderPromotion": "order_id",
    "CampaignAttribution": "campaign_id",
}

assert token, "토큰이 없습니다. 인증 셀을 먼저 성공시키세요."
get_url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition"
get_response = requests.post(get_url, headers=headers, data="", timeout=60)
get_response.raise_for_status()
parts = get_response.json()["definition"]["parts"]

existing_names = set()
for part in parts:
    if part["path"].startswith("EntityTypes/") and part["path"].endswith("/definition.json"):
        entity = json.loads(base64.b64decode(part["payload"]).decode("utf-8"))
        existing_names.add(entity["name"])

created_names = []
for entity in entities_config:
    name = entity["name"]
    if name in existing_names:
        continue
    entity_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"track1-ontology:{name}"))
    property_name = id_property_by_entity[name]
    property_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"track1-ontology:{name}:{property_name}"))
    entity_definition = {
        "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/ontology/entityType/1.0.0/schema.json",
        "id": entity_id,
        "namespace": "usertypes",
        "baseEntityTypeId": None,
        "name": name,
        "description": entity["description"],
        "entityIdParts": [property_id],
        "displayNamePropertyId": property_id,
        "namespaceType": "Custom",
        "visibility": "Visible",
        "properties": [
            {
                "id": property_id,
                "name": property_name,
                "valueType": "String",
                "sourceColumnName": property_name,
            }
        ],
        "timeseriesProperties": [],
        "untypedProperties": [],
    }
    encoded = base64.b64encode(
        json.dumps(entity_definition, ensure_ascii=False).encode("utf-8")
    ).decode("utf-8")
    parts.append(
        {
            "path": f"EntityTypes/{entity_id}/definition.json",
            "payload": encoded,
            "payloadType": "InlineBase64",
        }
    )
    created_names.append(name)

update_url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/updateDefinition?updateMetadata=True"
update_response = requests.post(
    update_url,
    headers=headers,
    json={"definition": {"parts": parts}},
    timeout=120,
)
print("updateDefinition:", update_response.status_code)
print("기존 엔터티:", len(existing_names), "/ 새로 추가:", len(created_names))
print("추가 목록:", created_names or "(없음: 모두 이미 존재)")
if update_response.status_code not in (200, 201, 202):
    raise RuntimeError(update_response.text[:800])
```

**예상 출력**:
```
✅ 인증 토큰 획득 완료
updateDefinition: 200 또는 202
기존 엔터티: 0 / 새로 추가: 14
추가 목록: ['Customer', ..., 'CampaignAttribution']
```

**트러블슈팅**:

| 오류 | 원인 | 해결 방법 |
|---|---|---|
| `401 Unauthorized` | Fabric 권한 없음 | Ontology 편집 권한 확인 |
| `404 Not Found` | Workspace/Ontology ID 오류 | ID 재확인 및 복사 |
| `429 Too Many Requests` | API 호출 제한 | 5초 대기 후 재시도 |
| `Timeout` | 네트워크 지연 | 재실행 또는 UI 수동 생성 |
| `ALMOperationImportFailed` | 환경별 Definition import 제한 | UI 방식 또는 Appendix B의 core fallback 사용 |

> 존재가 확인되지 않은 별도 `fabric-sdk` 예시는 사용하지 않습니다. 자동화는 검증된 Definition API 방식과 [Appendix B](./Appendix_B_Declarative_Bundle_Deployment.md)를 사용합니다.

---

### 단계 2: 엔터티 생성 확인 (UI)

엔터티 생성 후 Ontology UI에서 14개 엔터티가 모두 생성되었는지 확인한 뒤 다음 단계로 진행합니다. 이후 속성(단계 3)·물리 관계(단계 5)는 스크립트로, 매핑(단계 4)·논리 관계(단계 6)는 UI로 진행합니다.

---

### 단계 3: 엔터티 속성 추가

**목적**: 각 엔터티에 필수 속성(식별자, 날짜, 금액 등)을 추가합니다.

**설명**:
- 각 엔터티별로 핵심 속성 2~8개를 정의
- 타입 설정 (Text, Integer, Decimal, Date, DateTime)
- 첫 번째 식별자(`*_id`)를 `entityIdParts`와 `displayNamePropertyId`로 지정

**Step 3 Script** (속성 추가):

```python
# 단계 3: getDefinition/updateDefinition 방식으로 속성 반영
import base64
import json
import requests
import uuid
from notebookutils.authentication import AzureStorageCredentialsManager

FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1"
WORKSPACE_ID = "your-workspace-id"
ONTOLOGY_ID = "your-ontology-id"

token = AzureStorageCredentialsManager().get_notebookutils_aad_token()
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("📌 단계 3: 엔터티 속성 추가 (Definition 업데이트 방식)")

entity_properties = {
    "Customer": [{"name": "customer_id", "type": "Text", "required": True},
                {"name": "customer_segment", "type": "Text", "required": False},
                {"name": "customer_tier", "type": "Text", "required": False},
                {"name": "join_date", "type": "DateTime", "required": False}],
    "Product": [{"name": "product_id", "type": "Text", "required": True},
                {"name": "product_name", "type": "Text", "required": True},
                {"name": "category", "type": "Text", "required": False},
                {"name": "unit_price", "type": "Decimal", "required": False},
                {"name": "currency", "type": "Text", "required": False}],
    "Channel": [{"name": "channel_id", "type": "Text", "required": True},
                {"name": "channel_name", "type": "Text", "required": True}],
    "Campaign": [{"name": "campaign_id", "type": "Text", "required": True},
                 {"name": "campaign_name", "type": "Text", "required": True},
                {"name": "campaign_type", "type": "Text", "required": False},
                {"name": "channel_id", "type": "Text", "required": False},
                {"name": "start_date", "type": "Date", "required": False},
                {"name": "end_date", "type": "Date", "required": False}],
    "Promotion": [{"name": "promotion_id", "type": "Text", "required": True},
                 {"name": "promotion_name", "type": "Text", "required": True},
                 {"name": "promotion_type", "type": "Text", "required": False},
                 {"name": "discount_amount", "type": "Decimal", "required": False},
                 {"name": "start_date", "type": "Date", "required": False},
                 {"name": "end_date", "type": "Date", "required": False}],
    "Order": [{"name": "order_id", "type": "Text", "required": True},
              {"name": "customer_id", "type": "Text", "required": True},
              {"name": "channel_id", "type": "Text", "required": True},
              {"name": "order_date", "type": "DateTime", "required": True},
              {"name": "order_status", "type": "Text", "required": False},
              {"name": "gross_amount", "type": "Decimal", "required": False},
              {"name": "discount_applied", "type": "Decimal", "required": False},
              {"name": "net_amount", "type": "Decimal", "required": False},
              {"name": "currency", "type": "Text", "required": False}],
    "OrderItem": [{"name": "order_id", "type": "Text", "required": True},
                 {"name": "product_id", "type": "Text", "required": True},
                 {"name": "quantity", "type": "Integer", "required": False},
                 {"name": "sales_amount", "type": "Decimal", "required": False}],
    "Payment": [{"name": "payment_id", "type": "Text", "required": True},
                {"name": "order_id", "type": "Text", "required": True},
                {"name": "payment_status", "type": "Text", "required": False},
                {"name": "approved_amount", "type": "Decimal", "required": False},
                {"name": "approved_at", "type": "DateTime", "required": False}],
    "Shipment": [{"name": "shipment_id", "type": "Text", "required": True},
                {"name": "order_id", "type": "Text", "required": True},
                {"name": "shipment_status", "type": "Text", "required": False},
                {"name": "delivered_at", "type": "DateTime", "required": False}],
    "Return": [{"name": "return_id", "type": "Text", "required": True},
               {"name": "order_id", "type": "Text", "required": True},
               {"name": "product_id", "type": "Text", "required": True},
               {"name": "customer_id", "type": "Text", "required": True},
               {"name": "return_date", "type": "Date", "required": False},
               {"name": "return_reason", "type": "Text", "required": False}],
    "SupportTicket": [{"name": "ticket_id", "type": "Text", "required": True},
                     {"name": "customer_id", "type": "Text", "required": True},
                     {"name": "order_id", "type": "Text", "required": False},
                     {"name": "ticket_type", "type": "Text", "required": False},
                     {"name": "ticket_reason", "type": "Text", "required": False},
                     {"name": "created_at", "type": "DateTime", "required": False}],
    "InventorySnapshot": [{"name": "snapshot_id", "type": "Text", "required": True},
                         {"name": "product_id", "type": "Text", "required": True},
                         {"name": "snapshot_date", "type": "Date", "required": False},
                         {"name": "on_hand_qty", "type": "Integer", "required": False},
                         {"name": "reserved_qty", "type": "Integer", "required": False}],
    "OrderPromotion": [{"name": "order_id", "type": "Text", "required": True},
                      {"name": "promotion_id", "type": "Text", "required": True}],
    "CampaignAttribution": [{"name": "campaign_id", "type": "Text", "required": True},
                           {"name": "order_id", "type": "Text", "required": True},
                           {"name": "customer_id", "type": "Text", "required": True},
                           {"name": "attribution_model", "type": "Text", "required": False},
                           {"name": "attributed_revenue", "type": "Decimal", "required": False}]
}

# 1) 현재 definition 조회
get_url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition"
get_response = requests.post(get_url, headers=headers, data="", timeout=60)
print("getDefinition:", get_response.status_code)
get_response.raise_for_status()
current_definition = get_response.json()["definition"]

# 2) 각 EntityTypes 정의에 속성 추가
type_map = {
    "Text": "String",
    "Integer": "BigInt",
    "Decimal": "Double",
    "Date": "DateTime",
    "DateTime": "DateTime",
}
updated_entities = []
for part in current_definition["parts"]:
    if not (part["path"].startswith("EntityTypes/") and part["path"].endswith("/definition.json")):
        continue
    entity = json.loads(base64.b64decode(part["payload"]).decode("utf-8"))
    specs = entity_properties.get(entity["name"])
    if not specs:
        continue
    properties = []
    for spec in specs:
        property_id = str(
            uuid.uuid5(
                uuid.NAMESPACE_URL,
                f"track1-ontology:{entity['name']}:{spec['name']}",
            )
        )
        properties.append(
            {
                "id": property_id,
                "name": spec["name"],
                "valueType": type_map[spec["type"]],
                "sourceColumnName": spec["name"],
            }
        )
    entity["properties"] = properties
    entity["entityIdParts"] = [properties[0]["id"]]
    entity["displayNamePropertyId"] = properties[0]["id"]
    part["payload"] = base64.b64encode(
        json.dumps(entity, ensure_ascii=False).encode("utf-8")
    ).decode("utf-8")
    updated_entities.append(entity["name"])

# 3) definition 전체를 보존한 채 업데이트
update_url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/updateDefinition?updateMetadata=True"
update_response = requests.post(
    update_url,
    headers=headers,
    json={"definition": current_definition},
    timeout=120
)

print("updateDefinition:", update_response.status_code)
print("속성 갱신 엔터티:", len(updated_entities), updated_entities)

if update_response.status_code in (200, 201, 202):
    print("✅ Ontology 속성 스키마 업데이트 요청 성공")
else:
    raise RuntimeError(update_response.text[:800])
```

**설명**:
- 속성 추가는 개별 엔드포인트 호출보다 `getDefinition → updateDefinition` 흐름이 안정적으로 동작
- 각 `EntityTypes/{id}/definition.json`을 Base64 decode/수정/re-encode하며, 다른 파트는 그대로 유지
- `updateDefinition?updateMetadata=True` 반영 후 Ontology UI에서 최종 확인

---

### 단계 4: 원천 테이블 매핑 (선택)

**목적**: 각 Ontology 엔터티를 Lakehouse 원천 테이블에 매핑합니다.

**설명**:
- Ontology 속성 ↔ Lakehouse 테이블 컬럼 연결
- 매핑 우선순위: 식별자 > 날짜/금액 > 분석 속성

**Step 4 Script** (UI 수동 권장 - API 미공개):

```
Ontology 항목 → [엔터티 선택] → [매핑] 탭 → [+ 테이블 추가] → 원천 테이블 선택 → 컬럼 매핑

예:
- Customer 엔터티 → customers 테이블
- Order 엔터티 → orders 테이블
- Payment 엔터티 → payments 테이블
```

---

### 단계 5: 물리 관계(1차) - FK 기반 생성

**목적**: 원천 데이터의 Foreign Key(FK) 기반 1:N 관계를 정의합니다.

**설명**:
- Customer 1 : N Order (customers.customer_id ← orders.customer_id)
- Order 1 : N Payment (orders.order_id ← payments.order_id)
- Product 1 : N OrderItem (products.product_id ← order_items.product_id)
- 총 9개 FK 기반 관계

**Step 5 Script** (물리 관계 추가):

```python
# 단계 5: 물리 관계(FK 기반) 생성
import requests
from notebookutils.authentication import AzureStorageCredentialsManager

FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1"
WORKSPACE_ID = "your-workspace-id"
ONTOLOGY_ID = "your-ontology-id"

try:
    token = AzureStorageCredentialsManager().get_notebookutils_aad_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
except:
    token = None

print("📌 단계 5: 물리 관계 (FK 기반) 추가\n")

physical_relationships = [
    {"from": "Customer", "to": "Order", "name": "places", "card": "1:N"},
    {"from": "Channel", "to": "Order", "name": "belongs_to", "card": "N:1"},
    {"from": "Order", "to": "Payment", "name": "has", "card": "1:N"},
    {"from": "Order", "to": "Shipment", "name": "fulfilled_by", "card": "1:N"},
    {"from": "Order", "to": "OrderItem", "name": "includes", "card": "1:N"},
    {"from": "Product", "to": "OrderItem", "name": "referenced_by", "card": "1:N"},
    {"from": "Order", "to": "Return", "name": "has_return", "card": "1:N"},
    {"from": "Customer", "to": "SupportTicket", "name": "raises", "card": "1:N"},
    {"from": "Product", "to": "InventorySnapshot", "name": "has_snapshot", "card": "1:N"},
]

print("관계 후보 9개를 확인했습니다.")
for rel in physical_relationships:
    print(f"  - {rel['from']} → {rel['to']} ({rel['card']})")
print("이 단계는 UI에서 추가하거나, Appendix B의 RelationshipTypes 일괄 배포를 사용하세요.")
```

> `/items/{ONTOLOGY_ID}/relationships` 형태의 개별 관계 API는 워크숍 기본 경로로 사용하지 않습니다. 검증된 UI 또는 Appendix B Definition API 경로만 사용합니다.

---

### 단계 6: 논리 관계(2차) - 다중홉 관계

**목적**: 브릿지 테이블과 다중홉 분석을 위한 논리 관계를 추가합니다.

**설명**:
- **브릿지 기반 N:M**:
  - Order ↔ Promotion (OrderPromotion 브릿지)
  - Campaign ↔ Order (CampaignAttribution 브릿지)
  
- **다중홉 분석**:
  - Campaign → Order → Payment (캠페인별 결제 추적)
  - Promotion → Order → Return (프로모션별 반품 추적)
  - Customer → Order → Product (고객 구매 상품)

**Step 6 Script** (논리 관계 - UI 수동 권장):

```
Ontology 항목 → [관계 탭] → [+ Logical Relation 추가]

다중홉 관계 정의:
1. Campaign → CampaignAttribution → Order
   - Campaign influences Order (다중터치 어트리뷰션)
   
2. Promotion → OrderPromotion → Order
   - Promotion influences Order (프로모션 영향도)
   
3. Customer → Order → OrderItem → Product
   - Customer purchases Product (간접 구매 관계)

각 논리 관계별 설명:
- 카디널리티: N:M
- 경로: [브릿지 엔터티] 거쳐 연결
- 분석 목적: 마케팅ROI, 프로모션효과, 교차판매 등
```

**⚠️ 주의**: 논리 관계는 현재 Fabric UI에서만 생성 가능합니다 (API 미공개). UI에서 직접 추가하세요.

---

### 단계별 완료 체크리스트

| 단계 | 작업 | 상태 |
|---|---|---|
| 3 | 속성 14개 엔터티 × 4~6개 속성 | Script/UI |
| 4 | 원천 테이블 매핑 | UI (선택) |
| 5 | 물리 관계 9개 (FK 기반) | Script/UI |
| 6 | 논리 관계 5~6개 (다중홉) | UI (필수) |

---

> Appendix A 종료. 미션 4 본문의 [Fabric Ontology로 구성하는 방법](../WORKBOOK.md)과 함께 사용하세요.

---
