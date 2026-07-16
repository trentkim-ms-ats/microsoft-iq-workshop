# Track1 Ontology Bundle — 선언적 일괄 정의 방식 (부록 B 실행 세트)

이 폴더는 실습지 **부록 B "선언적 일괄 정의 방식"**을 실제로 실행하기 위한 파일 세트입니다.
엔터티 하나씩 만드는 부록 A와 달리, **14개 엔터티 + 17개 물리관계 + 3개 논리관계**를
하나의 정의(definition) 번들로 묶어 **한 번의 API 호출**로 배포합니다.

## 구성 파일

| 파일 | 역할 |
|---|---|
| `ontology_contract.yaml` | 선언적 계약(단일 진실 원천). 엔터티/속성/관계를 사람이 읽는 형태로 선언 |
| `generate_definition.py` / `generate_definition.ipynb` | 계약을 읽어 Fabric Ontology `definition parts`(JSON) 로 변환하는 생성기 (스크립트 / 노트북) |
| `definition_parts/` | 생성기가 만든 실제 정의 파트(업로드 대상). 재실행하면 재생성됨 |
| `definition_parts/_manifest.json` | parts 목록/엔터티 ID 요약(참고용, 배포에는 제외) |
| `deploy_ontology_notebook.py` / `deploy_ontology_notebook.ipynb` | Fabric Notebook 에 붙여넣어 실행하는 배포 코드(셀 단위 / 노트북) |

## 데이터 정합성

`definition_parts/` 는 [`track1/data/`](../data) 의 실제 CSV 스키마와 1:1로 맞춰져 있습니다.
- 엔터티/속성/원천 테이블/PK/FK가 실습지 **정규 목록(14 엔터티 / 20 관계)**과 동일
- 속성 타입은 컬럼명 규칙으로 추론(`_id`→String, `_date`/`join_date`/`_at`→DateTime, `_amount`/`_price`/`_value`/`_revenue`→Double, `_qty`/`quantity`→BigInt)
- DataBinding/Contextualization은 정규 스키마(`dataBindingConfiguration`, `dataBindingTable`)를 사용하며, `workspaceId`/`itemId`는 Notebook 실행 시 현재 값으로 주입됩니다.

## 실행 순서

### 1) (로컬) 정의 파일 생성
계약을 바꿨거나 처음 실행한다면 (`generate_definition.ipynb` 노트북 또는 `.py` 스크립트):
```bash
cd track1/ontology_bundle
python3 generate_definition.py
# → definition_parts/ 재생성 (67 parts + _manifest.json)
```
필요하면 생성 시점에 Lakehouse 바인딩 기본값을 지정할 수 있습니다:
```bash
python3 generate_definition.py \
  --binding-workspace-id <workspace-guid> \
  --binding-item-id <lakehouse-item-guid> \
  --binding-source-schema dbo
```
> `definition_parts/` 는 이미 생성되어 커밋되어 있으므로, 계약을 수정하지 않았다면 이 단계를 건너뛰어도 됩니다.

### 2) Fabric Lakehouse 에 업로드
Fabric 포털에서 실습용 Lakehouse 를 열고 `Files` 아래에 업로드합니다.
```text
Lakehouse > Files > (새 폴더) ontology_bundle > definition_parts 폴더 업로드
최종 경로:  Files/ontology_bundle/definition_parts/...
```
> 폴더 구조(`EntityTypes/<id>/...`, `RelationshipTypes/<id>/...`)를 **그대로** 유지해야 합니다.

### 3) Notebook 에서 배포

#### 3-1) 노트북을 워크스페이스로 Import
`deploy_ontology_notebook.ipynb` 를 Fabric 워크스페이스에 가져옵니다.

**방법 A — 워크스페이스에서 Import (권장)**
```text
app.fabric.microsoft.com → 대상 Workspace 진입
→ + New item  또는  Import  →  Notebook  →  Import from this device
→ deploy_ontology_notebook.ipynb 선택 → Open/Upload
```
> 일부 UI 버전에서는 `Import` → `Notebook` → `Upload`, 또는 Data Engineering/Data Science 화면 상단의 `Import notebook` 버튼으로 들어갑니다.

**방법 B — Data Engineering 경험에서**
```text
왼쪽 하단 경험 전환 → Data Engineering → Import notebook → deploy_ontology_notebook.ipynb 업로드
```

Import 후 확인/설정:
- 워크스페이스 목록에 `deploy_ontology_notebook` 이 보이면 성공 → 클릭해 엽니다.
- 노트북 상단에서 **Lakehouse 를 연결**합니다: `Add lakehouse` (또는 왼쪽 Explorer의 `Lakehouses` → `Add`) → 2)에서 업로드한 Lakehouse 선택 → **default 로 설정**. 이래야 `/lakehouse/default/Files/...` 경로가 동작합니다.
- 커널/언어가 **PySpark (Python)** 인지 확인합니다.

> 참고: `generate_definition.ipynb` 는 보통 로컬에서 실행합니다. 워크스페이스 안에서 파트를 만들고 싶다면 같은 방식으로 import 하되, `ontology_contract.yaml` 도 Lakehouse `Files/ontology_bundle/` 에 함께 업로드하고 노트북의 `CONTRACT`/`OUT_DIR` 경로를 `/lakehouse/default/Files/...` 로 맞추세요.

#### 3-2) 셀 실행
가져온 노트북의 셀을 위에서부터 순서대로 실행합니다.
(또는 `deploy_ontology_notebook.py` 의 각 `# ======== CELL n ========` 블록을 새 노트북 셀에 붙여넣어 실행)
- CELL 1: `WORKSPACE_ID`, `LAKEHOUSE_ID`, `ONTOLOGY_NAME`, `PARTS_ROOT` 설정
- CELL 2: 인증 토큰
- CELL 3: 업로드한 파트를 읽어 `definition.parts[]` 조립(InlineBase64) + 바인딩 ID 주입
- CELL 4: `POST /ontologies`(신규) 또는 `updateDefinition`(기존) — **full(67 parts) 우선**, 실패 시 core(36 parts) 자동 재시도
- CELL 5: `getDefinition` 으로 검증(엔터티/관계 + DataBindings/Contextualizations 개수 확인)
- CELL 6: **실제 값 검증** — 엔터티별 매핑 테이블에서 샘플 값을 조회해 “어떤 값이 연결되는지” 확인

> 이 Notebook 은 default Lakehouse 가 연결되어 있어야 `/lakehouse/default/Files/...` 로 파일을 읽습니다.

#### 3-3) 배포 전/후 상세 체크 (권장)

1. **WORKSPACE_ID 확인**
   - 주소창 또는 부록 A의 방법으로 확인

2. **LAKEHOUSE_ID 확인**
   - Lakehouse item의 GUID를 사용해야 합니다(이름 아님)
   - API 예시:
     ```bash
     TOKEN=$(az account get-access-token --resource https://analysis.windows.net/powerbi/api --query accessToken -o tsv)
     curl -s -H "Authorization: Bearer $TOKEN" \
       "https://api.fabric.microsoft.com/v1/workspaces/<WORKSPACE_ID>/lakehouses"
     ```
   - 배포 대상 Ontology와 짝인 Lakehouse를 선택합니다.

3. **정의 파일 경로 확인**
   - Notebook에서:
     ```python
     import os
     print(os.path.exists("/lakehouse/default/Files/ontology_bundle/definition_parts"))
     ```
   - `True`가 아니면 default Lakehouse 연결 또는 업로드 경로를 점검하세요.

4. **배포 결과 확인**
   - CELL 5 결과에서 최소 다음을 확인:
     - `엔터티 정의 = 14`
     - `관계 정의 = 20`
   - 환경에 따라 DataBindings/Contextualizations는 0일 수 있습니다(core fallback 배포).

#### 3-4) API 직접 배포 (고급)

Notebook 대신 REST로도 배포할 수 있습니다.

```bash
# 1) 토큰
TOKEN=$(az account get-access-token \
  --resource https://analysis.windows.net/powerbi/api \
  --query accessToken -o tsv)

# 2) updateDefinition (payload는 definition.parts 구조)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @payload.json \
  "https://api.fabric.microsoft.com/v1/workspaces/<WORKSPACE_ID>/ontologies/<ONTOLOGY_ID>/updateDefinition?updateMetadata=True"

# 3) 검증
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '' \
  "https://api.fabric.microsoft.com/v1/workspaces/<WORKSPACE_ID>/ontologies/<ONTOLOGY_ID>/getDefinition"
```

### 자주 발생하는 배포 실패와 대응

- `TokenExpired`
  - 증상: 401 + `TokenExpired`
  - 조치: `az account get-access-token ...`로 토큰 재발급 후 재시도

- `ALMOperationImportFailed` (400)
  - 증상: full(67 parts) 배포 시 일반화된 Import 실패 메시지
  - 조치: 노트북은 자동으로 core(36 parts)로 재시도합니다.
  - 결과: 엔터티/관계 정의는 정상 반영되며, 일부 환경에서는 DataBinding/Contextualization 파트가 제한될 수 있습니다.

#### 3-5) 온톨로지에 연결된 **실제 샘플 값** 확인 방법

중요: Ontology item은 스키마/매핑을 저장합니다. 레코드 값은 Lakehouse 테이블에 있습니다.  
따라서 값 검증은 **(a) Ontology 매핑 확인 + (b) Lakehouse 값 조회**를 함께 해야 합니다.

권장: `deploy_ontology_notebook`의 CELL 6 실행
- `getDefinition`에서 DataBinding을 읽어 `Entity -> table/column` 매핑을 추출
- 해당 테이블에 대해 `SELECT ... LIMIT N` 수행해 실제 값을 출력
- core fallback(36 parts)로 DataBinding이 없으면 워크숍 기본 매핑으로 검증
- 출력 포맷을 다음 태그로 통일해 여러 Ontology 실행 결과를 바로 비교할 수 있음:
  - `ONTOLOGY_VALUE_VALIDATION_START`
  - `[ENTITY]`, `[COLUMNS]`, `[QUERY]`, `[ENTITY_DONE]`
  - `ONTOLOGY_VALUE_VALIDATION_SUMMARY`, `ONTOLOGY_VALUE_VALIDATION_DONE`

간단 예시(핵심):
```python
url = f"https://api.fabric.microsoft.com/v1/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition"
resp = requests.post(url, headers=headers, timeout=60)
parts = resp.json()["definition"]["parts"]

# DataBinding에서 엔터티-테이블-컬럼 매핑 추출 후 실제 값 조회
query = "SELECT customer_id, customer_segment, customer_tier, join_date FROM customers LIMIT 5"
spark.sql(query).show(truncate=False)
```

예상 출력 예시:
```text
=== ONTOLOGY_VALUE_VALIDATION_START ===
workspaceId=...
ontologyId=...
ontologyName=...
mappingSource=DataBinding
sampleRows=5
entityCount=14
======================================

[ENTITY] name=Customer table=customers
[COLUMNS] selected=customer_id,customer_segment,customer_tier,join_date total=4
[QUERY] SELECT `customer_id`, `customer_segment`, `customer_tier`, `join_date` FROM `customers` LIMIT 5
...
[ENTITY_DONE] name=Customer

=== ONTOLOGY_VALUE_VALIDATION_SUMMARY ===
...
=== ONTOLOGY_VALUE_VALIDATION_DONE ===
```

검증 포인트:
- 엔터티별 샘플 값이 예상 테이블/컬럼에서 나오는지
- 날짜/금액/수량 컬럼 값 형식이 Ontology `valueType` 의도와 맞는지
- 노이즈 데이터(결측/이상값)가 의도대로 존재하는지

#### 3-6) 온톨로지 **의미 질의/추론 검증** 방법(선택 심화)

목적: SQL 결과 확인을 넘어, 질문을 온톨로지 경로로 표현했을 때 동일 의미가 재현되는지 검증합니다.

- Level A (환경 무관):
  1. 질문을 엔터티-관계 경로로 고정 (`Campaign -> CampaignAttribution -> Order -> Payment`)
  2. `getDefinition`으로 경로 구성 요소 존재 확인
  3. 동일 질문의 SQL 기준값 계산
- Level B (GraphModel 가능 환경):
  1. GraphModel `refreshGraph` 완료
  2. `executeQuery?beta=True`로 MATCH 질의 실행
  3. SQL 기준값과 행수/샘플 키 비교(PASS/FAIL 기록)

권장 기록 필드:
- `question`, `path`, `baselineSqlRows`
- `graphQueryStatus`, `graphRows`, `comparison`, `failReason`

참고:
- 이 검증은 Track1 기본 제출 필수는 아니며, 시간 여유 팀의 심화 과제입니다.
- 자세한 실습 절차는 [WORKBOOK.md](../WORKBOOK.md)의 "⑦ 온톨로지 추론/의미 질의 검증 미니 실습"을 따르세요.

## 부록 A와의 관계

| 항목 | 부록 A (기본) | 부록 B (이 번들) |
|---|---|---|
| 엔드포인트 | `/items` (제네릭) | `/ontologies` (전용) |
| 엔터티/속성 | 루프로 하나씩 + 반복 updateDefinition | 정의 번들에 인라인, **한 번에** |
| 원천 매핑 | UI 수동 | `DataBindings` 파트로 정의에 포함 |
| 관계 | `/relationships`(Preview) | `RelationshipTypes` + `Contextualizations` |
| 재현성 | 순차 실행 | 계약→결정적 ID로 항상 동일 결과 |

> ℹ️ 부록 B는 **심화/자동화 참고용**입니다. Track1 제출 기준은 부록 A(또는 미션 4 UI)로 충분합니다.
