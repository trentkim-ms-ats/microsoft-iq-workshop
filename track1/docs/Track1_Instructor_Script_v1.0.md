# 트랙1 강사용 진행 대본(분단위) v1.0

- 트랙명: Track 1 — FabricIQ 시맨틱 레이어: Fabric + Ontology(Preview) 데이터 준비
- Microsoft IQ 흐름 내 위치: **FabricIQ 시맨틱 구축 단계** (Track 2 WorkIQ / Track 3 WebIQ / Track 4 FoundryIQ의 그라운딩 소스가 됨)
- 총 시간: 150분 (실습 140분 + 휴식 10분)
- 권장 시간대: 09:35-12:05
- 대상: 데이터/SQL 기초 보유자

## 참고 자료
- 실습지: [WORKBOOK.md](../WORKBOOK.md)
- 데이터 구조 상세 설명: [Track1_Data_Structure_Detailed_Guide.md](Track1_Data_Structure_Detailed_Guide.md)
- 고급 기준 시나리오: [End-to-End 복합 관계 시나리오](Track1_Data_Structure_Detailed_Guide.md#advanced-scenario)
- 미션 1 핵심 질문(고급 Q1~Q5): [WORKBOOK.md](../WORKBOOK.md)
- 미션 1 참고: [원천 테이블 구조와 역할](Track1_Data_Structure_Detailed_Guide.md#source-table-structure)
- 미션 2 참고: [데이터 품질 개념 체크포인트](Track1_Data_Structure_Detailed_Guide.md#profiling-checkpoints)
- 미션 3 참고: [표준화 규칙의 구조적 의미](Track1_Data_Structure_Detailed_Guide.md#standardization-rules)
- 미션 4 참고: [Ontology 구조(의미 모델)](Track1_Data_Structure_Detailed_Guide.md#ontology-model)
- 미션 5 참고: [3단 매핑 구조](Track1_Data_Structure_Detailed_Guide.md#mapping-3step), [의미 질의 확인 구조](Track1_Data_Structure_Detailed_Guide.md#semantic-validation-structure)
- Track2 시작 체크: [PREREQUISITES.md](../../track2/PREREQUISITES.md)
- 전체 당일 운영 체크: [Microsoft IQ Instructor Day-of Operations Checklist](../../common/docs/Microsoft_IQ_Instructor_Day_of_Operations_Checklist.md)

## 운영 원칙
1. 30분 단위 진도체크, 10분 이상 지연 팀은 즉시 보조 지원.
2. 기능 설명보다 결과물 제출 기준을 먼저 강조.
3. 기술 이슈는 별도 지원 트랙으로 분리해 메인 흐름 유지.
4. 데이터 구조 설명 시 "온톨로지 강점"과 "복잡 관계 활용"을 반드시 함께 강조.

## 분단위 대본 (T=10:00 시작, 총 150분)

미션-시간 매핑 요약:
- 미션1 (질문 정리): T+00~10 (10분)
- 미션2 (데이터 구조·품질 개념): T+10~40 (30분)
- 미션3 (표준 스키마): T+40~70 (30분)
- 미션4 (Ontology 설계): T+70~90 및 T+100~120 (총 40분, 사이 휴식)
- 휴식: T+90~100 (10분)
- 미션5 (매핑/의미 경로 확인): T+120~150 (30분)

| 시간(분) | 미션 | 진행 스크립트(강사용) | 참가자 액션 | 강사 체크포인트 |
|---|---|---|---|---|
| T+00~03 | M1 | "Track 1의 목표는 데이터 정리 자체가 아니라 **FabricIQ가 이해할 시맨틱 구조** 완성입니다. 여기서 만든 Ontology가 Track 2 WorkIQ, Track 3 WebIQ 공개 확인 범위, Track 4 FoundryIQ의 공통 어휘로 재사용됩니다." | 화면/자료 준비 | 시작 상태 통일, Microsoft IQ workshop 흐름 안내 |
| T+03~05 | M1 | "최종 제출물 5개를 먼저 확인하고 시작합니다." | 제출물 템플릿 오픈 | 팀별 템플릿 준비 |
| T+05~10 | M1 | "워크숍 공통 질문 5개(Q1~Q5)를 먼저 확정하세요. 질문이 모델을 결정합니다. 오늘은 **고급 Q1~Q5(캠페인·결제·배송·프로모션·재고·반품·CS)** 기준으로 진행합니다." ([고급 시나리오](Track1_Data_Structure_Detailed_Guide.md#advanced-scenario)) | 질문 확정, 질문-데이터 매핑 초안 | Q1~Q5 확정 여부·매핑표 초안 |
| T+10~20 | M2 | "P1 데이터 품질은 오늘 탐지·수정하지 않습니다. 참조 무결성, 중복, 결측, 이상값이 KPI와 Ontology를 왜곡하는 이유만 설명하겠습니다." ([미션2 참조](Track1_Data_Structure_Detailed_Guide.md#profiling-checkpoints)) | 설명 청취, 영향 메모 | P1 쿼리 실행 팀이 없도록 확인 |
| T+20~30 | M2 | "14개 테이블의 행 수·필수 컬럼·로드 순서를 확인하고 Q1~Q5에 필요한 키를 찾으세요." | 데이터 사전과 질문-키 연결표 작성 | 필수 컬럼 누락 여부, 질문별 키 연결 |
| T+30~40 | M2 | "품질 개념이 Q1~Q5 해석에 미치는 영향을 한 줄씩 정리하세요. 위치나 건수는 찾지 않습니다." | 영향 요약·팀 공유 | 개념 이해와 시나리오 연결 확인 |
| T+40~55 | M3 | "이제 표준 스키마: 키/타입/코드 규칙 통일" ([미션3 참조](Track1_Data_Structure_Detailed_Guide.md#standardization-rules)) | 스키마 규칙표 작성 | 규칙 누락 여부 |
| T+55~65 | M3 | 표준 코드 딕셔너리 확정 유도(주문/결제/배송 + 문의유형 + 반품사유 코드) | 코드셋 정리 | 상태코드·문의·반품사유 표준화 |
| T+65~70 | M3 | 미니 리뷰: 규칙표 상호 점검 | 팀 내 크로스 체크 | 규칙 확정 |
| T+70~80 | M4 | "Ontology 모델링 시작: 엔터티는 명사, 관계는 동사" ([미션4 참조](Track1_Data_Structure_Detailed_Guide.md#ontology-model)). **Fabric Ontology 구성**: 검증된 Definition API/번들 노트북으로 단일 Ontology 안에 엔터티를 추가하거나 UI로 생성합니다. `/items`를 반복 호출해 Ontology item 14개를 만들지 않도록 주의합니다. 스크린샷: `updateDefinition 200/202` + 엔터티 정의 14개 | 엔터티 생성 및 매핑 | Ontology 항목 1개 안에 엔터티 14개 생성 확인 |
| T+80~90 | M4 | 속성 타입과 필수/선택 설정 확인 유도. "식별자(`*_id`)는 Required, 상태값은 Enum 타입으로 관리하세요." 엔터티별 핵심 속성 검토(예: Order - order_id, order_date, order_status, gross_amount, net_amount). API 방식 선택팀은 속성 추가 결과(Properties: 42 total) 확인. | 속성 정의 완성 | 필수 속성 누락 여부, 타입 오류 확인, API 팀 속성 추가 완료 |
| T+90~100 | 휴식 | 휴식(10분) 안내 및 복귀 시간 고지 | 휴식 | 복귀율 체크 |
| T+100~110 | M4 | "관계 카디널리티(1:N/N:M) 빠짐없이 기입" (동사형). **Fabric Ontology 관계 구성**: ① 마스터 테이블 기반 1:N 관계부터(FK 매핑 8개): Customer-Order, Channel-Order, Product-OrderItem, Order-OrderItem, Product-Inventory, Promotion-OrderPromotion, Campaign-CampaignAttribution ② 브릿지 테이블(N:M): OrderPromotion과 CampaignAttribution을 통한 간접 N:M 관계 ③ 각 관계에 "사람", "상품을 주문한다" 등 의미 설명 추가. 스크린샷: 관계도 뷰에서 연결선 확인. 캠페인-주문은 Last-touch(1:N)인지 Multi-touch(N:M)인지 선택 근거를 기록하세요. | 관계 생성 및 매핑 | 관계 8개 이상(FK기반) + 2개(N:M 브릿지) 확인, 카디널리티 레이블 표기 완료 |
| T+110~120 | M4 | 복합 관계 강조: 캠페인→주문→결제→배송→반품, 프로모션→주문→마진. `Margin`은 파생지표(계산식 명시)로 기록. **논리 관계(다중경로 분석) 추가**: Payment→Order→Return(결제 이력이 있는 반품), Shipment→Order→Return(배송 후 반품), Order→OrderPromotion→Promotion(주문별 적용 프로모션 추적). 예상 관계 20-25개 도출. 스크린샷: 관계도 전체 뷰(각 경로별 색상/legend 구분) | 논리 관계 정의 | 관계 20개 이상 확정, 파생 지표(Margin) 계산식 명시, 관계도 스크린샷 |
| T+120~130 | M5 | 매핑표 작성 가이드: 원천→표준→Ontology ([매핑 참조](Track1_Data_Structure_Detailed_Guide.md#mapping-3step)) | 매핑표 작성 | 결제/배송/프로모션/캠페인/CS 포함 70% |
| T+130~138 | M5 | "시나리오 A/B의 엔터티-관계 경로가 `getDefinition`에 있는지 확인하세요." | 의미 경로 2개 확인 | 경로·방향·매핑 기록 |
| T+138~145 | M5 | "제공 SQL baseline을 저장하세요. GraphModel 가능 팀만 `executeQuery`와 비교합니다." | baseline 저장, 선택 Graph 비교 | 의미 경로 로그 확보 또는 미실행 사유 |
| T+145~148 | 마감 | "제출물 5개 + Track2 인계 패키지 최종 점검" | 파일 정리/제출 | 누락 항목 확인 |
| T+148~150 | 마감 | 마감 멘트: "Track 2에서 이 Ontology를 WorkIQ의 M365 문서 태그와 연결하고, 크로스 소스 품질 게이트를 통과시킵니다." | 제출 완료 | 100% 제출 확인 |

## 상황별 즉시 멘트

| 상황 | 강사 멘트 |
|---|---|
| 엔터티가 너무 많음 | "핵심 질문에 직접 필요하지 않으면 후보로만 남기고 제외하세요." |
| 관계가 모호함 | "주어-동사-목적어 문장으로 말해본 뒤 관계명 확정하세요." |
| 쿼리 오류 다발 | "SQL 디버깅은 보조 트랙에서 처리하고 본 트랙은 결과물부터 맞춥니다." |
| 시간 지연 | "선택 미션은 생략하고 DoD 3개를 먼저 충족하세요." |
| 참가자가 P1 탐지 쿼리를 실행함 | "P1은 설명 전용입니다. 쿼리를 중단하고 Ontology 매핑과 의미 경로 확인으로 돌아가세요." |
| 캠페인 관계 모델 혼선 | "어트리뷰션 기준을 먼저 정하세요. Last-touch면 1:N, Multi-touch면 N:M으로 표기하고 근거를 남기세요." |
| 마진 정의가 없음 | "`Margin`은 파생지표입니다. 계산식과 가정값을 매핑표 비고에 명시하세요." |
| Track2에서 문서 매칭이 안 됨 | "Track1 인계 패키지의 WorkIQ 키워드(캠페인/상품/고객등급) 표기를 먼저 통일하고 재검색하세요." |

---

## Track2 시작 인계 게이트 (마감 5분)

아래 4개가 모두 준비돼야 Track2를 시작합니다.

1. `WORKSPACE_ID`, `ONTOLOGY_ID`, Ontology 이름 기록
2. 엔터티/관계 수량 + 핵심 경로 3개 기록
3. 실제 구현 제한 또는 `none-known` 기록
4. WorkIQ 검색 키워드(캠페인명/상품명/고객등급) 기록

강사 멘트(권장):
- "Track2는 Track1 인계 패키지가 없으면 시작이 지연됩니다. 지금 5분만 써서 인계 템플릿을 채우고 넘어갑니다."

---

## 의미 질의 확인 운영 가이드 (Level A 필수, Level B 선택)

Level A(경로와 SQL baseline)는 기본 제출이며, GraphModel을 사용하는 Level B만
시간과 환경이 허용되는 팀에 적용합니다.

1. 질문 1개 선택  
   - 예: "캠페인 유입 주문 중 결제 실패 주문은?"
2. 경로 고정  
   - `Campaign -> CampaignAttribution -> Order -> Payment`
3. SQL 기준값 확보  
   - 캠페인ID/주문ID 기준 결과 행수와 샘플 10건
4. (가능 환경) GraphModel 질의 실행  
   - `executeQuery?beta=True` 결과와 SQL을 비교
5. 기록  
   - `comparison=PASS|FAIL`, 실패 시 `failReason`을 반드시 남김
   - 실습지 ⑦의 "제출 템플릿(복붙용)" 표에 결과를 그대로 기록하게 안내

강사 확인 포인트:
- 경로를 자연어가 아닌 엔터티-관계 문자열로 고정했는가
- SQL 기준값을 먼저 만들고 의미 질의를 비교했는가
- 실패 시 원인을 "매핑 누락/관계 방향/코드셋" 중 하나로 분류했는가

---

## Ontology REST API 스크립트

**위치**: Notebook(PySpark)의 별도 셀에서 실행 (T+70~80 구간)

**사전 준비**:
1. **Workspace ID 찾기**: 
   - Workspace 진입 후 URL 확인
   - `https://msit.powerbi.com/groups/{WORKSPACE_ID}` 패턴에서 추출
   - 또는 `https://app.fabric.microsoft.com/workspaces/{WORKSPACE_ID}` 에서 추출
   
2. **Ontology ID 찾기**: 
   - Ontology 항목 열기 후 URL 확인
   - `?itemId=...` 또는 `?viewModel=...` 뒤의 ID 추출

```python
# Fabric Ontology REST API를 통한 14개 엔터티 일괄 생성
# 전제: Fabric Workspace와 Ontology 항목 사전 생성 필수

import requests
import json
from notebookutils.authentication import AzureStorageCredentialsManager

# Fabric API 기본 설정
FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1"
WORKSPACE_ID = "your-workspace-id"  # URL: groups/{ID} 또는 workspaces/{ID} 에서 복사
ONTOLOGY_ID = "your-ontology-id"      # URL: ?itemId={ID} 또는 ?viewModel={ID} 에서 복사

# Fabric 인증 토큰 (Notebook 자동 제공)
try:
    token = AzureStorageCredentialsManager().get_notebookutils_aad_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
except:
    print("⚠️ 토큰 획득 실패. Fabric 권한을 확인하세요.")
    token = None

# 14개 엔터티 정의 (이름, 설명, 핵심 속성)
entities_config = [
    {
        "name": "Customer",
        "description": "고객 마스터",
        "properties": ["customer_id", "customer_name", "customer_segment", "registration_date"]
    },
    {
        "name": "Product",
        "description": "상품 카탈로그",
        "properties": ["product_id", "product_name", "category", "price"]
    },
    {
        "name": "Channel",
        "description": "판매 채널",
        "properties": ["channel_id", "channel_name", "channel_type"]
    },
    {
        "name": "Campaign",
        "description": "마케팅 캠페인",
        "properties": ["campaign_id", "campaign_name", "start_date", "end_date", "budget"]
    },
    {
        "name": "Promotion",
        "description": "프로모션/할인",
        "properties": ["promotion_id", "promotion_name", "discount_percent", "valid_from", "valid_to"]
    },
    {
        "name": "Order",
        "description": "고객 주문",
        "properties": ["order_id", "order_date", "order_status", "gross_amount", "net_amount"]
    },
    {
        "name": "OrderItem",
        "description": "주문 상세 항목",
        "properties": ["order_item_id", "order_id", "product_id", "quantity", "unit_price"]
    },
    {
        "name": "Payment",
        "description": "결제 기록",
        "properties": ["payment_id", "order_id", "payment_status", "payment_amount", "payment_date"]
    },
    {
        "name": "Shipment",
        "description": "배송 정보",
        "properties": ["shipment_id", "order_id", "shipment_status", "ship_date", "delivery_date"]
    },
    {
        "name": "Return",
        "description": "반품 기록",
        "properties": ["return_id", "order_id", "product_id", "return_date", "return_reason", "return_status"]
    },
    {
        "name": "SupportTicket",
        "description": "고객 지원 문의",
        "properties": ["ticket_id", "customer_id", "ticket_date", "ticket_reason", "ticket_status"]
    },
    {
        "name": "InventorySnapshot",
        "description": "재고 스냅샷",
        "properties": ["snapshot_id", "product_id", "snapshot_date", "on_hand", "reorder_level"]
    },
    {
        "name": "OrderPromotion",
        "description": "주문-프로모션 브릿지 (N:M)",
        "properties": ["order_promotion_id", "order_id", "promotion_id", "applied_discount"]
    },
    {
        "name": "CampaignAttribution",
        "description": "캠페인-어트리뷰션 브릿지 (N:M)",
        "properties": ["attribution_id", "campaign_id", "order_id", "customer_id", "touch_type", "attribution_date"]
    }
]

# 엔터티는 /items로 14개 Ontology item을 만드는 방식이 아니라,
# 기존 ONTOLOGY_ID의 definition.parts 안에 EntityTypes로 추가해야 합니다.
# 실행 코드는 참가자 실습지 Appendix A의 최신 "단계 1" 셀을 그대로 사용합니다.
assert token, "토큰 없이 실행할 수 없습니다. Notebook 환경을 확인하세요."
print("실습지 Appendix A 단계 1 셀 실행 → updateDefinition 상태 200/202 확인")
print("자동화 전체 경로는 track1/ontology_bundle/deploy_ontology_notebook.ipynb 사용")
```

> 별도 `fabric-sdk` 예시는 사용하지 않습니다. 워크숍에서 검증한 Definition API 또는 번들 노트북만 사용합니다.

---

### 📋 API 방식 운영 가이드

1. **사전 준비** (강사/TA 담당):
   - Workspace ID, Ontology ID를 강사 노트에 기록
   - Notebook 셀에 위 스크립트 사전 배치
   - API 토큰 테스트 실행 (사전 검증)

2. **실습 중 (T+70 시작)**:
   - 참가자에게 스크립트 공유 (또는 복사/붙여넣기 링크)
   - 실습지 Appendix A 단계 1 셀 또는 번들 노트북 실행
   - 콘솔 출력 확인: `updateDefinition: 200/202`, 엔터티 정의 14개

3. **다음 단계 (T+80~90)**:
   - 생성된 엔터티 리스트를 Ontology UI에서 확인
   - 각 엔터티 속성 추가 (UI 수동)
   - 관계 그리기 (UI 수동)

4. **문제 해결**:
   - `401 Unauthorized`: Fabric 권한 재확인
   - `404 Not Found`: Workspace/Ontology ID 오류 확인
   - `429 Too Many Requests`: 5초 대기 후 재시도

---


### 📌 단계별 자동화 가이드

실습지 [Appendix A. Fabric Ontology 자동 구성 스크립트](./Appendix_A_Fabric_Ontology_Auto_Script.md)의 각 단계 스크립트를 순서대로 실행하세요:

| Step | 작업 | 방식 | 시간 |
|---|---|---|---|
| 3 | 속성 추가 | Definition API 또는 번들 | ~2분 |
| 4 | 테이블 매핑 | UI 수동 | ~10분 (선택) |
| 5 | 물리 관계 (핵심 9개/권장 모델 17개) | UI 또는 번들 | ~10분 |
| 6 | 논리 관계 (다중홉) | UI 수동 | ~10분 (필수) |

**강사 팁**:
- API가 preview 단계이므로 "실패 가능" 미리 공지
- UI 수동 추가는 entity naming 규칙 설명하기
- 논리 관계 (Step 6)는 "비즈니스 로직" 관점 강조

### ⏱️ 시간 절감 효과

| 작업 | 수동 UI | Definition API/번들 |
|---|---|---|
| 엔터티 생성 | ~20분 (명명+타입 선택 반복) | ~2분 (스크립트 실행) |
| 속성 추가 | ~15분 (UI 클릭) | ~2분 |
| 관계 그리기 | ~15분 (드래그) | ~5분(번들) |
| **총 시간** | **~50분** | **~10분 + 검증** |

**결과**: T+70~120 (50분) 내에 엔터티+관계 완성 가능
