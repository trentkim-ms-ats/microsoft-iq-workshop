## Appendix B. 선언적 일괄 정의 방식 (심화)

> ℹ️ 이 Appendix는 별도 Notebook([`generate_definition.ipynb`](../ontology_bundle/generate_definition.ipynb), [`deploy_ontology_notebook.ipynb`](../ontology_bundle/deploy_ontology_notebook.ipynb))으로 제공되는 **개념 이해용 참고 자료**입니다. Track1 실습의 제출 기준은 Appendix A(또는 미션 4 UI)로 충분하며, Appendix B는 심화/자동화에 관심 있는 참가자를 위한 것입니다.

### B-1. 핵심 아이디어: "사람이 읽는 계약(contract) → 정의 parts 번들"

이 방식은 먼저 엔터티/속성/관계를 **선언적 YAML 계약**으로 적어둡니다.
실제 계약 파일은 [`ontology_contract.yaml`](../ontology_bundle/ontology_contract.yaml)이며, 이 파일을 [`generate_definition.py`](../ontology_bundle/generate_definition.py) 또는 [`generate_definition.ipynb`](../ontology_bundle/generate_definition.ipynb)가 읽어 `definition_parts` JSON들을 생성합니다.

```yaml
entities:
  Customer:
    primary_key: customer_id
    source: customers.csv
    fields: [customer_id, customer_name, customer_segment, registration_date]
relationships:
  - name: Customer_places_Order
    from_entity: Customer
    from_field: customer_id
    to_entity: Order
    to_field: customer_id
```

이 계약을 코드가 읽어 **여러 개의 JSON 파일(parts)**로 변환하고, 이를 base64(InlineBase64)로 인코딩해 하나의 `definition.parts[]`로 묶습니다.

### B-2. Entity Type + Property는 "엔터티 정의 파일" 안에 인라인

엔터티마다 `EntityTypes/{entity_id}/definition.json` 파트를 만들고, **Property를 그 안 `properties[]` 배열에 함께** 넣습니다(우리 Appendix A처럼 속성만 따로 `updateDefinition` 하지 않음).

```python
entity_definition = {
    "$schema": ".../ontology/entityType/1.0.0/schema.json",
    "id": entity_id,
    "name": "Customer",
    "entityIdParts": [<customer_id property id>],        # PK
    "displayNamePropertyId": <customer_name property id>,
    "properties": [                                        # ← Property 인라인
        {"id": pid, "name": "CustomerId",       "valueType": "String"},
        {"id": pid, "name": "CustomerName",     "valueType": "String"},
        {"id": pid, "name": "CustomerSegment",  "valueType": "String"},
        {"id": pid, "name": "RegistrationDate", "valueType": "String"},
    ],
}
parts.append({"path": f"EntityTypes/{entity_id}/definition.json",
              "payload": b64_json(entity_definition), "payloadType": "InlineBase64"})
```

추가로 엔터티마다 **DataBinding 파트**(`EntityTypes/{id}/DataBindings/{bindingId}.json`)를 넣어 각 Property를 Lakehouse 테이블 컬럼에 직접 매핑합니다(`sourceColumnName` → `targetPropertyId`). Appendix A에서 UI로 하던 "원천 테이블 매핑"이 정의에 포함되는 셈입니다.

### B-3. Relationship은 "관계 정의 파일 + Contextualization"

관계는 `RelationshipTypes/{rel_id}/definition.json` 파트로 만들고 source/target을 **엔터티 타입 ID**로 연결합니다.

```python
relationship_definition = {
    "$schema": ".../ontology/relationshipType/1.0.0/schema.json",
    "id": rel_id, "name": "Customer_places_Order",
    "source": {"entityTypeId": entity_ids["Customer"]},
    "target": {"entityTypeId": entity_ids["Order"]},
}
```

여기에 **Contextualization 파트**(`RelationshipTypes/{id}/Contextualizations/{ctxId}.json`)를 추가해, 관계를 실제 FK 컬럼에 바인딩합니다(`sourceKeyRefBindings` / `targetKeyRefBindings`). 즉 물리 관계의 근거(FK)가 정의 안에 명시됩니다.

### B-4. API 호출: Ontology 전용 엔드포인트에 한 번에

`.platform`(아이템 타입=Ontology)과 `definition.json`을 포함한 전체 parts를 **한 번의 정의로** 전송합니다. Appendix A의 제네릭 `/items` 방식과 달리 **`/ontologies` 전용 엔드포인트**를 사용합니다.

```python
definition = {"parts": [
    {"path": "definition.json", "payload": b64_json({}), "payloadType": "InlineBase64"},
    {"path": ".platform", "payload": b64_json({
        "metadata": {"type": "Ontology", "displayName": ONTOLOGY_NAME}, ...
    }), "payloadType": "InlineBase64"},
    # EntityTypes/*/definition.json, EntityTypes/*/DataBindings/*.json,
    # RelationshipTypes/*/definition.json, RelationshipTypes/*/Contextualizations/*.json ...
]}

# 신규 생성
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies",
              headers=headers,
              json={"displayName": ONTOLOGY_NAME, "description": "...", "definition": definition})

# 기존 아이템 정의 교체
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/updateDefinition",
              headers=headers, json={"definition": definition})

# 검증
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition",
              headers=headers)
```

### B-5. Appendix A(점진적) vs Appendix B(선언적) 비교

| 항목 | Appendix A (본 실습 기본) | Appendix B (선언적 일괄) |
|---|---|---|
| 엔드포인트 | `/workspaces/{ws}/items` (제네릭) | `/workspaces/{ws}/ontologies` (전용) |
| 엔터티 생성 | 14개를 루프로 하나씩 | 정의 parts에 포함해 **한 번에** |
| Property | 엔터티별 `updateDefinition` 반복 | 엔터티 정의에 **인라인** |
| 원천 매핑 | UI 수동 | **DataBinding 파트로 정의에 포함** |
| Relationship | UI 수동 | `RelationshipTypes` + Contextualization |
| 적합한 상황 | 학습/단계별 이해 | 자동화/재현 가능한 프로비저닝 |

### B-6. 실행 파일 세트 & Notebook 배포 (실제 실행)

Appendix B를 **실제로 실행**할 수 있도록, 모든 샘플 데이터에 대한 정의 파일과 배포 코드를 [`track1/ontology_bundle/`](../ontology_bundle) 폴더에 준비해 두었습니다.

| 파일 | 역할 |
|---|---|
| [`ontology_contract.yaml`](../ontology_bundle/ontology_contract.yaml) | 선언적 계약(단일 진실 원천): 14 엔터티 + 17 물리관계 + 3 논리관계 |
| [`generate_definition.py`](../ontology_bundle/generate_definition.py) · [`.ipynb`](../ontology_bundle/generate_definition.ipynb) | 계약 → Fabric Ontology `definition parts`(JSON) 생성기 (스크립트/노트북) |
| [`definition_parts/`](../ontology_bundle/definition_parts) | 생성된 정의 파트(업로드 대상). 총 67 parts + `_manifest.json` |
| [`deploy_ontology_notebook.py`](../ontology_bundle/deploy_ontology_notebook.py) · [`.ipynb`](../ontology_bundle/deploy_ontology_notebook.ipynb) | Notebook 셀 단위 배포 코드 (스크립트/노트북) |
| [`README.md`](../ontology_bundle/README.md) | 실행 순서 안내 |

정의 파트는 [`track1/data/`](../data/)의 실제 CSV 스키마(컬럼/PK/FK)와 1:1로 정합합니다.

#### 전제 조건 (실행 전 반드시 확인)

| 전제 | 설명 |
|---|---|
| Fabric capacity 연결 | 워크스페이스가 F2 이상(또는 Trial) capacity 에 연결되어 있어야 합니다 |
| 권한 | 해당 워크스페이스에 **Contributor 이상** |
| **Lakehouse 연결** | 배포 노트북이 파일을 읽을 수 있도록 **default Lakehouse 를 노트북에 연결** (아래 상세) |
| 커널 | Notebook 언어 **PySpark (Python)** |

**Lakehouse 연결이 왜 필요한가**
CELL 3 은 업로드한 정의 파트를 `PARTS_ROOT = "/lakehouse/default/Files/ontology_bundle/definition_parts"` 경로에서 읽습니다.
이 `/lakehouse/default/...` 경로는 노트북에 **default 로 지정된 Lakehouse** 가 있을 때만 자동 마운트됩니다.
Lakehouse 를 연결하지 않으면 이 경로가 존재하지 않아 `FileNotFoundError` 가 발생합니다.

**default Lakehouse 연결 방법 (노트북 편집 화면)**
```text
1. 노트북 왼쪽의 Explorer 패널에서 'Lakehouses'(또는 'Add lakehouse') 클릭
2. Add → Existing lakehouse → ②에서 업로드한 Lakehouse(lh_track1_...) 선택 → Add
3. 연결된 Lakehouse 목록에서 해당 Lakehouse 의 ⋯(More) → 'Set as default'
   (여러 Lakehouse 를 붙였다면 반드시 하나를 default 로 지정)
4. 왼쪽 Explorer 에서 Files > ontology_bundle > definition_parts 폴더가 보이면 정상
```

> 💡 **default 의 의미**: 노트북에는 여러 Lakehouse 를 연결할 수 있지만, `/lakehouse/default/` 는 그중 **default 로 표시된 한 개**를 가리킵니다. default 가 없거나 다른 Lakehouse 가 default 이면 경로가 어긋납니다.

**연결 확인 (노트북에서 실행)**
```python
import os
print(os.path.exists("/lakehouse/default"))                                   # True 여야 함
print(os.listdir("/lakehouse/default/Files"))                                 # ontology_bundle 이 보여야 함
print(os.listdir("/lakehouse/default/Files/ontology_bundle/definition_parts")) # .platform, EntityTypes, ... 확인
```

**자주 발생하는 문제**
- `FileNotFoundError: /lakehouse/default/...` → Lakehouse 미연결 또는 default 미지정. 위 2~3단계를 다시 수행하세요.
- 경로는 존재하나 `definition_parts` 가 비어 있음 → ②의 업로드가 다른 Lakehouse/폴더에 되었거나 폴더 구조가 깨진 경우. **노트북에 연결한 Lakehouse == 파일을 업로드한 Lakehouse** 인지 확인하세요.
- default Lakehouse 를 바꾼 뒤에는 노트북 세션을 **재시작(Restart)** 해야 마운트가 갱신됩니다.
- 파일을 Lakehouse 로 옮기고 싶지 않다면, ②를 생략하고 `PARTS_ROOT` 를 노트북에 내장 리소스(`builtin/`)나 다른 접근 가능한 경로로 바꿔도 됩니다(고급).

**① (로컬) 정의 파일 생성** — 계약을 수정했을 때만. 기본 제공본을 쓰면 생략 가능:

```bash
cd track1/ontology_bundle
python3 generate_definition.py     # → definition_parts/ 재생성 (67 parts)
```

각 엔터티는 `EntityTypes/<id>/definition.json`(속성 인라인) + `DataBindings/<id>.json`(컬럼→속성 매핑)로,
각 물리관계는 `RelationshipTypes/<id>/definition.json` + `Contextualizations/<id>.json`(FK 바인딩)로 생성됩니다.

**② Fabric Lakehouse 에 업로드** — 폴더 구조를 그대로 유지:

```text
Lakehouse > Files > (새 폴더) ontology_bundle > definition_parts 업로드
최종 경로:  Files/ontology_bundle/definition_parts/...
```

**③ Notebook 을 워크스페이스로 Import 후 배포**

먼저 노트북을 워크스페이스에 가져옵니다:

```text
app.fabric.microsoft.com → 대상 Workspace → Import(또는 + New item) → Notebook
→ Import from this device → deploy_ontology_notebook.ipynb 선택 → Upload
```

Import 후: 노트북을 열고 상단에서 **Add lakehouse** 로 ②의 Lakehouse 를 연결(**default 설정**)해야 `/lakehouse/default/Files/...` 경로가 동작합니다. 커널은 **PySpark (Python)** 을 사용합니다.

이어서 아래 셀을 순서대로 실행합니다(전체 코드는 [`deploy_ontology_notebook.ipynb`](../ontology_bundle/deploy_ontology_notebook.ipynb) / [`.py`](../ontology_bundle/deploy_ontology_notebook.py)):

```python
# CELL 1 : 설정
import base64, json, os, requests
FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1"
WORKSPACE_ID  = "your-workspace-id"                 # Appendix A의 ID 조회 방법 참고
LAKEHOUSE_ID  = "your-lakehouse-item-id"            # /workspaces/{ws}/lakehouses 응답의 id
ONTOLOGY_NAME = "retail_track1_ontology_v1"
PARTS_ROOT    = "/lakehouse/default/Files/ontology_bundle/definition_parts"

# CELL 2 : 인증 토큰 (Fabric 자동 제공)
from notebookutils.authentication import AzureStorageCredentialsManager
token = AzureStorageCredentialsManager().get_notebookutils_aad_token()
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# CELL 3 : 업로드한 파트를 읽어 definition.parts[] 조립 (InlineBase64)
def build_definition_from_folder(parts_root):
    parts = []
    for dirpath, _dirs, files in os.walk(parts_root):
        for fn in sorted(files):
            if fn == "_manifest.json":
                continue
            ap = os.path.join(dirpath, fn)
            rel = os.path.relpath(ap, parts_root).replace(os.sep, "/")
            with open(ap, "rb") as fh:
                parts.append({"path": rel,
                              "payload": base64.b64encode(fh.read()).decode(),
                              "payloadType": "InlineBase64"})
    priority = {".platform": 0, "definition.json": 1}
    parts.sort(key=lambda p: (priority.get(p["path"], 2), p["path"]))
    return {"parts": parts}

definition = build_definition_from_folder(PARTS_ROOT)
print("parts:", len(definition["parts"]))

# CELL 4 : 신규 생성(create) 또는 정의 교체(updateDefinition) - 한 번에 배포
def find_existing(ws, name):
    r = requests.get(f"{FABRIC_API_BASE}/workspaces/{ws}/ontologies", headers=headers, timeout=30)
    return next((i["id"] for i in r.json().get("value", []) if i.get("displayName") == name), None) if r.status_code == 200 else None

existing = find_existing(WORKSPACE_ID, ONTOLOGY_NAME)
if existing:
    url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{existing}/updateDefinition?updateMetadata=True"
    resp = requests.post(url, headers=headers, json={"definition": definition}, timeout=120)
    ONTOLOGY_ID = existing
else:
    url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies"
    body = {"displayName": ONTOLOGY_NAME, "description": "Track1 선언적 일괄 정의(Appendix B)", "definition": definition}
    resp = requests.post(url, headers=headers, json=body, timeout=120)
    ONTOLOGY_ID = resp.json().get("id") if resp.status_code in (200, 201) else None
print(resp.status_code, resp.text[:300])

# CELL 5 : 검증 (getDefinition → base64 decode)
url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition"
resp = requests.post(url, headers=headers, timeout=60)
parts = resp.json()["definition"]["parts"]
ents = [p for p in parts if p["path"].startswith("EntityTypes/") and p["path"].endswith("definition.json")]
rels = [p for p in parts if p["path"].startswith("RelationshipTypes/") and p["path"].endswith("definition.json")]
print(f"엔터티 {len(ents)} / 관계 {len(rels)} / 총 {len(parts)} parts")
```

**④ 배포 실행 상세 가이드 (권장 순서)**

1. **토큰 갱신**
   - 401 `TokenExpired`가 자주 발생하므로 배포 직전에 토큰을 다시 받습니다.
   - 예시:
     ```bash
     TOKEN=$(az account get-access-token \
       --resource https://analysis.windows.net/powerbi/api \
       --query accessToken -o tsv)
     ```

2. **LAKEHOUSE_ID 확인 (필수)**
   - `WORKSPACE_ID`의 Lakehouse 목록에서 배포 대상 Lakehouse의 `id`를 복사해 `LAKEHOUSE_ID`에 넣습니다.
   - 예시:
     ```bash
     curl -s -H "Authorization: Bearer $TOKEN" \
       "https://api.fabric.microsoft.com/v1/workspaces/<WORKSPACE_ID>/lakehouses"
     ```

3. **노트북에서 full/core 동작 이해**
   - full: `definition_parts` 전체(67 parts) 배포 시도
   - core: 엔터티/관계 중심(36 parts)만 배포
   - 일부 환경에서는 full이 `ALMOperationImportFailed`로 실패할 수 있어, **core로 자동 재시도**하도록 스크립트가 구성되어 있습니다.

4. **성공 판정 기준**
   - CELL 5 출력에서 최소 다음을 확인:
     - 엔터티 정의: 14
     - 관계 정의: 20
   - DataBindings/Contextualizations는 환경에 따라 0일 수 있습니다(core fallback 시 정상).

5. **실패 시 점검 순서**
   - `TokenExpired` → 토큰 재발급 후 재실행
   - `FileNotFoundError: /lakehouse/default/...` → default Lakehouse 재지정 + 경로 재확인
   - `ALMOperationImportFailed` → full 실패 케이스이므로 core 재시도 결과(엔터티/관계 개수)를 기준으로 검증

**⑤ API 직접 검증(선택)**

```bash
# getDefinition
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '' \
  "https://api.fabric.microsoft.com/v1/workspaces/<WORKSPACE_ID>/ontologies/<ONTOLOGY_ID>/getDefinition"

# updateDefinition
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @payload.json \
  "https://api.fabric.microsoft.com/v1/workspaces/<WORKSPACE_ID>/ontologies/<ONTOLOGY_ID>/updateDefinition?updateMetadata=True"
```

**⑥ 온톨로지에 연결된 실제 샘플 데이터 값 검증(권장 추가)**

핵심: Ontology item은 스키마/매핑 정의를 저장하고, 실제 레코드 값은 Lakehouse 테이블에 있습니다.  
따라서 아래 2단계를 함께 확인합니다.

1) `getDefinition`으로 온톨로지 정의를 조회  
2) 매핑된 테이블에 SQL을 실행해 샘플 값 조회

Notebook 예시:

```python
# 1) Ontology definition 조회
url = f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition"
resp = requests.post(url, headers=headers, timeout=60)
parts = resp.json()["definition"]["parts"]

# 2) 엔터티별 실제 값 샘플 조회 (예: Customer)
spark.sql("""
SELECT customer_id, customer_segment, customer_tier, join_date
FROM customers
LIMIT 5
""").show(truncate=False)

# 3) 다른 엔터티도 동일하게 확인 (예: Order)
spark.sql("""
SELECT order_id, customer_id, channel_id, order_date, gross_amount, net_amount
FROM orders
LIMIT 5
""").show(truncate=False)
```

출력 포맷(통일):
```text
=== ONTOLOGY_VALUE_VALIDATION_START ===
workspaceId=...
ontologyId=...
ontologyName=...
mappingSource=DataBinding 또는 WorkshopFallback
sampleRows=5
entityCount=14
======================================
[ENTITY] name=Customer table=customers
[COLUMNS] selected=customer_id,customer_segment,customer_tier,join_date total=4
[QUERY] SELECT `customer_id`, `customer_segment`, `customer_tier`, `join_date` FROM `customers` LIMIT 5
...
[ENTITY_DONE] name=Customer
=== ONTOLOGY_VALUE_VALIDATION_SUMMARY ===
=== ONTOLOGY_VALUE_VALIDATION_DONE ===
```

검증 체크:
- 샘플 값이 기대 엔터티의 테이블/컬럼에서 조회되는가
- 날짜/금액/수량 컬럼 값 형식이 Ontology의 `valueType` 의도와 일치하는가
- 핵심 속성 샘플이 기대 타입과 의미로 조회되는가

**⑦ 온톨로지 추론/의미 질의 확인 (Level A 필수, Level B 선택, 10~15분)**

목적: SQL 조인 결과와 별개로, **질문을 온톨로지 경로(엔터티-관계)**로 표현하고 그 경로가 실제 질의로 재현되는지 확인합니다.

중요:
- 경로와 SQL baseline을 확인하는 Level A는 Track1 기본 DoD입니다.
- 테넌트에서 GraphModel Preview가 불가하면 **Level A까지만 수행**합니다.

검증 시나리오(권장 2개):
- **시나리오 A (Q1)**  
  - 질문: "캠페인 유입 주문 중 결제 실패가 있는 주문은 무엇인가?"  
  - 온톨로지 경로: `Campaign -> CampaignAttribution -> Order -> Payment`
- **시나리오 B (Q3, 기존 미제공 보강)**  
  - 질문: "프로모션 유형별 재구매율은 어떻게 다른가?"  
  - 온톨로지 경로: `Promotion -> OrderPromotion -> Order -> Customer`

### Level A. 의미 경로 검증(환경 무관, 필수 권장)
1) 질문을 경로로 고정
- 엔터티/관계를 문장 대신 경로 문자열로 명시:  
  - 시나리오 A: `Campaign influences Order` + `Order has Payment`
  - 시나리오 B: `Promotion influences Order` + `Customer places Order`

2) `getDefinition`으로 경로 구성요소 존재 확인
- 시나리오 A: 엔터티(`Campaign`, `Order`, `Payment`)와 관계 존재 확인
- 시나리오 B: 엔터티(`Promotion`, `OrderPromotion`, `Order`, `Customer`)와 관계 존재 확인
- DataBinding/Contextualization이 있다면 FK 바인딩까지 확인

3) SQL 기준값 계산(베이스라인)

**시나리오 A (Q1)**
```sql
SELECT DISTINCT ca.campaign_id, o.order_id
FROM campaign_attribution ca
JOIN orders o ON ca.order_id = o.order_id
JOIN payments p ON p.order_id = o.order_id
WHERE UPPER(TRIM(COALESCE(p.payment_status, ''))) = 'FAILED'
ORDER BY ca.campaign_id, o.order_id
LIMIT 20;
```

**시나리오 B (Q3)**
```sql
WITH customer_repeat AS (
  SELECT customer_id, CASE WHEN COUNT(*) >= 2 THEN 1 ELSE 0 END AS is_repeat
  FROM orders
  GROUP BY customer_id
)
SELECT
  p.promotion_type,
  COUNT(DISTINCT o.order_id) AS orders_cnt,
  AVG(cr.is_repeat) AS repurchase_rate
FROM orders o
JOIN order_promotions op ON o.order_id = op.order_id
JOIN promotions p ON op.promotion_id = p.promotion_id
LEFT JOIN customer_repeat cr ON o.customer_id = cr.customer_id
GROUP BY p.promotion_type
ORDER BY p.promotion_type;
```

4) 로그 템플릿으로 기록
```text
[SEMANTIC_VALIDATION_START]
scenarioId=A|B
question=<질문>
path=<Entity->...->Entity>
baselineSqlRows=<행수>
```

### Level B. 의미 질의 실행 검증(GraphModel Preview 가능 환경)
1) GraphModel 준비
- Ontology와 별도 GraphModel 아이템 생성/갱신
- `refreshGraph` 완료(202 LRO polling 후 succeeded)

2) 의미 질의 실행
```python
GRAPH_MODEL_ID = "your-graph-model-item-id"  # Fabric UI에서 생성한 GraphModel item ID

# 시나리오 A (Q1)
query_q1 = """
MATCH (c:`Campaign`)-[:`Campaign_influences_Order`]->(o:`Order`)
MATCH (o)-[:`Order_has_Payment`]->(p:`Payment`)
WHERE toUpper(coalesce(p.payment_status, '')) = 'FAILED'
RETURN c.campaign_id AS campaign_id, o.order_id AS order_id
LIMIT 20;
"""
resp_q1 = requests.post(
    f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/executeQuery?beta=True",
    headers=headers,
    json={"query": query_q1},
    timeout=60,
)
print("Q1", resp_q1.status_code, resp_q1.text[:500])

# 시나리오 B (Q3): 경로 결과를 row-level로 가져온 뒤 promotion_type별로 재집계
query_q3 = """
MATCH (p:`Promotion`)-[:`OrderPromotion_points_to_Promotion`]->(op:`OrderPromotion`)
MATCH (o:`Order`)-[:`Order_receives_OrderPromotion`]->(op)
MATCH (c:`Customer`)-[:`Customer_places_Order`]->(o)
MATCH (c)-[:`Customer_places_Order`]->(o2:`Order`)
WITH p.promotion_type AS promotion_type,
     o.order_id AS order_id,
     c.customer_id AS customer_id,
     COUNT(DISTINCT o2.order_id) AS customer_order_count
RETURN promotion_type, order_id, customer_id,
       CASE WHEN customer_order_count >= 2 THEN 1 ELSE 0 END AS is_repeat
LIMIT 20000;
"""
resp_q3 = requests.post(
    f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/executeQuery?beta=True",
    headers=headers,
    json={"query": query_q3},
    timeout=60,
)
print("Q3", resp_q3.status_code, resp_q3.text[:500])

# (선택) row-level 결과를 promotion_type별 집계로 변환해 SQL baseline과 비교
# 응답 JSON 스키마는 테넌트/프리뷰 버전에 따라 달라질 수 있어 키를 확인해 맞춰주세요.
payload = resp_q3.json() if resp_q3.status_code == 200 else {}
rows = payload.get("rows") or payload.get("data") or payload.get("results") or []
if rows:
    import pandas as pd
    gdf = pd.DataFrame(rows)
    q3_graph = (
        gdf.groupby("promotion_type", as_index=False)
           .agg(
               orders_cnt=("order_id", "nunique"),
               repurchase_rate=("is_repeat", "mean"),
           )
           .sort_values("promotion_type")
    )
    print(q3_graph)
```

3) SQL 기준값과 비교
- 비교 기준:
  - 시나리오 A(Q1): Row count 차이 허용범위 0, `campaign_id`/`order_id` 샘플 10건 동일
  - 시나리오 B(Q3): `promotion_type`별 `orders_cnt`/`repurchase_rate` 비교
    - 권장 허용오차: `orders_cnt` 0, `repurchase_rate` ±0.001
  - 불일치 시 원인 분류: 매핑 누락 / 관계 방향 오류 / 코드셋 표준화 미반영

4) 결과 로그(권장)
```text
[SEMANTIC_VALIDATION_RESULT]
level=GraphModel
graphQueryStatus=200
graphRows=<행수>
sqlRows=<행수>
comparison=PASS|FAIL
failReason=<사유>
[SEMANTIC_VALIDATION_DONE]
```

합격 기준(선택 심화):
- Level A 수행 완료 + SQL 기준값 산출
- (GraphModel 가능 시) 비교 결과 `PASS` 또는 `FAIL 사유` 명확 기록

제출 템플릿(복붙용):

| 항목 | 기록 값 |
|---|---|
| 팀명 |  |
| 검증 일시(KST) |  |
| 질문(question) |  |
| 경로(path) |  |
| baselineSqlRows |  |
| graphQueryStatus (없으면 N/A) |  |
| graphRows (없으면 N/A) |  |
| comparison (PASS/FAIL/N/A) |  |
| failReason (없으면 `-`) |  |
| 비고(매핑 누락/관계 방향/코드셋 이슈 등) |  |

복붙 로그 템플릿:
```text
[SEMANTIC_VALIDATION_SUBMISSION]
team=<팀명>
validatedAtKst=<YYYY-MM-DD HH:MM>
question=<질문>
path=<Entity->...->Entity>
baselineSqlRows=<행수>
graphQueryStatus=<코드 또는 N/A>
graphRows=<행수 또는 N/A>
comparison=<PASS|FAIL|N/A>
failReason=<사유 또는 ->
notes=<추가 메모>
[/SEMANTIC_VALIDATION_SUBMISSION]
```

샘플 작성본:

**샘플 A (PASS 케이스)**

| 항목 | 기록 값 |
|---|---|
| 팀명 | Team Alpha |
| 검증 일시(KST) | 2026-07-12 10:42 |
| 질문(question) | 캠페인 유입 주문 중 결제 실패 주문은? |
| 경로(path) | Campaign->CampaignAttribution->Order->Payment |
| baselineSqlRows | 12 |
| graphQueryStatus (없으면 N/A) | 200 |
| graphRows (없으면 N/A) | 12 |
| comparison (PASS/FAIL/N/A) | PASS |
| failReason (없으면 `-`) | - |
| 비고(매핑 누락/관계 방향/코드셋 이슈 등) | SQL 샘플 10건과 그래프 결과 키(campaign_id, order_id) 일치 |

```text
[SEMANTIC_VALIDATION_SUBMISSION]
team=Team Alpha
validatedAtKst=2026-07-12 10:42
question=캠페인 유입 주문 중 결제 실패 주문은?
path=Campaign->CampaignAttribution->Order->Payment
baselineSqlRows=12
graphQueryStatus=200
graphRows=12
comparison=PASS
failReason=-
notes=샘플 10건 키 일치 확인
[/SEMANTIC_VALIDATION_SUBMISSION]
```

**샘플 B (FAIL 케이스)**

| 항목 | 기록 값 |
|---|---|
| 팀명 | Team Beta |
| 검증 일시(KST) | 2026-07-12 10:55 |
| 질문(question) | 캠페인 유입 주문 중 결제 실패 주문은? |
| 경로(path) | Campaign->CampaignAttribution->Order->Payment |
| baselineSqlRows | 12 |
| graphQueryStatus (없으면 N/A) | 200 |
| graphRows (없으면 N/A) | 4 |
| comparison (PASS/FAIL/N/A) | FAIL |
| failReason (없으면 `-`) | 관계 방향 오류(`Order_has_Payment` 반대로 모델링) |
| 비고(매핑 누락/관계 방향/코드셋 이슈 등) | 관계 방향 수정 후 `refreshGraph` 재실행 필요 |

```text
[SEMANTIC_VALIDATION_SUBMISSION]
team=Team Beta
validatedAtKst=2026-07-12 10:55
question=캠페인 유입 주문 중 결제 실패 주문은?
path=Campaign->CampaignAttribution->Order->Payment
baselineSqlRows=12
graphQueryStatus=200
graphRows=4
comparison=FAIL
failReason=관계 방향 오류(Order_has_Payment)
notes=관계 수정 후 refreshGraph 재실행 예정
[/SEMANTIC_VALIDATION_SUBMISSION]
```

**샘플 C (Q3 PASS 케이스, 기존 미제공 보강)**

| 항목 | 기록 값 |
|---|---|
| 팀명 | Team Gamma |
| 검증 일시(KST) | 2026-07-12 11:20 |
| 질문(question) | 프로모션 유형별 재구매율은? |
| 경로(path) | Promotion->OrderPromotion->Order->Customer |
| baselineSqlRows | 4 |
| graphQueryStatus (없으면 N/A) | 200 |
| graphRows (없으면 N/A) | 1664 (row-level) |
| comparison (PASS/FAIL/N/A) | PASS |
| failReason (없으면 `-`) | - |
| 비고(매핑 누락/관계 방향/코드셋 이슈 등) | promotion_type별 orders_cnt/repurchase_rate가 SQL 기준과 허용오차(±0.001) 내 일치 |

```text
[SEMANTIC_VALIDATION_SUBMISSION]
team=Team Gamma
validatedAtKst=2026-07-12 11:20
question=프로모션 유형별 재구매율은?
path=Promotion->OrderPromotion->Order->Customer
baselineSqlRows=4
graphQueryStatus=200
graphRows=1664
comparison=PASS
failReason=-
notes=promotion_type별 집계가 SQL 기준과 일치(허용오차 ±0.001)
[/SEMANTIC_VALIDATION_SUBMISSION]
```

**샘플 D (Q3 FAIL 케이스, 기존 미제공 보강)**

| 항목 | 기록 값 |
|---|---|
| 팀명 | Team Delta |
| 검증 일시(KST) | 2026-07-12 11:35 |
| 질문(question) | 프로모션 유형별 재구매율은? |
| 경로(path) | Promotion->OrderPromotion->Order->Customer |
| baselineSqlRows | 4 |
| graphQueryStatus (없으면 N/A) | 200 |
| graphRows (없으면 N/A) | 1430 (row-level) |
| comparison (PASS/FAIL/N/A) | FAIL |
| failReason (없으면 `-`) | `Order_receives_OrderPromotion` 관계 누락 |
| 비고(매핑 누락/관계 방향/코드셋 이슈 등) | Percent/Bundle 주문수가 SQL 대비 과소, 관계 추가 후 `refreshGraph` 재실행 필요 |

```text
[SEMANTIC_VALIDATION_SUBMISSION]
team=Team Delta
validatedAtKst=2026-07-12 11:35
question=프로모션 유형별 재구매율은?
path=Promotion->OrderPromotion->Order->Customer
baselineSqlRows=4
graphQueryStatus=200
graphRows=1430
comparison=FAIL
failReason=Order_receives_OrderPromotion 관계 누락
notes=누락 관계 보완 후 refreshGraph 재실행 예정
[/SEMANTIC_VALIDATION_SUBMISSION]
```

> `definition.json` 이 `{}` 가 아니라 위처럼 엔터티/관계 개수가 나오면 정상 저장된 것입니다.
> ⚠️ 이 Notebook 은 **default Lakehouse 연결**이 필요합니다(`/lakehouse/default/Files/...` 접근). 202(비동기) 응답 시 `Location` 헤더로 완료를 폴링하는 코드는 전체 파일에 포함되어 있습니다.

---
