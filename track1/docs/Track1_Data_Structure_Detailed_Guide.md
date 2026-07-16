# Track1 실습 데이터 구조 상세 설명

이 문서는 [WORKBOOK.md](../WORKBOOK.md)에서 사용되는 데이터 구조를 상세히 설명합니다. 본 데이터 구조는 워크숍 3-IQ 스택(FabricIQ + WorkIQ + FoundryIQ)의 **공통 시맨틱 어휘**로 사용됩니다.

## 3-IQ 스택에서의 역할

| 계층 | 이 구조를 사용하는 방식 |
|---|---|
| **FabricIQ (Track 1)** | Ontology 엔터티/관계로 정형 데이터를 의미화하고 시맨틱 질의를 수행 |
| **WorkIQ (Track 2)** | 동일한 엔터티명(Customer/Campaign/Product/Order 등)을 M365 문서 태그로 사용해 정형↔비정형을 연결 |
| **FoundryIQ (Track 3)** | 에이전트가 이 엔터티/관계 경로를 지식 그래프로 참조해 근거 기반 답변 생성 |

세 계층 모두 동일한 엔터티/속성 이름을 재사용하므로, Track 1에서 정의한 이름·상태 코드는 **Track 2 매핑표와 Track 3 프롬프트에 그대로 인용**됩니다. 명명 규칙 일관성이 3-IQ 통합 품질의 전제 조건입니다.

## 미션별 바로가기
- 온톨로지 설명 문서: [Track1_Ontology_Concepts_and_Graph_Design_Guide.md](Track1_Ontology_Concepts_and_Graph_Design_Guide.md)
- 공통 설계 의도: [데이터 구조 설계 의도](#design-intent)
- 고급 기준 시나리오: [End-to-End 복합 관계 시나리오](#advanced-scenario)
- 미션 1(비즈니스 질문 정리): [원천 테이블 구조와 역할](#source-table-structure)
- 미션 2(데이터 프로파일링): [프로파일링 관점 체크포인트](#profiling-checkpoints)
- 미션 3(표준 스키마 설계): [표준화 규칙의 구조적 의미](#standardization-rules)
- 미션 4(Ontology 엔터티/관계 설계): [Ontology 구조(의미 모델)](#ontology-model)
- 미션 5(매핑 및 1차 검증): [3단 매핑 구조](#mapping-3step), [검증 구조](#validation-structure), [의미 질의 검증 구조(선택)](#semantic-validation-structure)

<a id="design-intent"></a>
## 0) 데이터 구조 설계 의도
- **온톨로지의 강력함을 보여주기 위한 데이터 구조**를 사용합니다.
  - 단순 테이블 나열이 아니라 엔터티-관계-속성으로 의미를 연결해 AI 질의 품질을 높이는 것이 목적입니다.
- **데이터간의 복잡한 관계를 활용**합니다.
  - 고객-주문-주문상세-상품-결제-배송-프로모션-캠페인-고객응대를 연결해 다중 홉 질의(예: 캠페인 유입 주문의 결제 실패-배송 지연-반품 연쇄 분석)를 가능하게 설계합니다.

<a id="advanced-scenario"></a>
## 0-1) End-to-End 복합 관계 시나리오(고급 기준안)

실습의 기본 데이터 구조는 아래 End-to-End 복합 관계를 기준으로 구성됩니다.

### 핵심 엔터티(예시)
- `customers` (고객 마스터)
- `orders` (주문 헤더)
- `order_items` (주문 상세)
- `products` (상품 마스터)
- `channels` (유입 채널)
- `returns` (반품 이력)
- `payments` (주문 결제 시도/승인/실패 이력)
- `shipments` (출고/배송 상태)
- `inventory_snapshots` (창고-상품 재고 시점 데이터)
- `promotions` (쿠폰/프로모션 정의)
- `order_promotions` (주문-프로모션 적용 브릿지)
- `campaigns` (캠페인 마스터)
- `campaign_attribution` (캠페인 유입 및 전환 연결)
- `support_tickets` (고객 문의/클레임 접수 및 처리)

### 핵심 관계 확장
- `Order 1:N Payment`
- `Order 1:N Shipment`
- `Product 1:N InventorySnapshot` (시점별 재고 상태 관리)
- `Order N:M Promotion` (주문/상품 단위 할인 적용)
- `Customer 1:N SupportTicket`
- `Campaign 1:N Order` 또는 `Campaign N:M Order` (어트리뷰션 모델 기준)
  - Last-touch면 1:N으로 단순화 가능, Multi-touch면 N:M으로 관리하는 것이 일반적입니다.

### 다중 홉 분석 시나리오
1. 캠페인 유입 고객의 주문이 특정 결제 실패 패턴을 가지는지 분석  
   `Campaign -> Customer -> Order -> Payment`
2. 특정 프로모션 적용 주문에서 배송 지연과 반품률이 함께 증가하는지 분석  
   `Promotion -> Order -> Shipment -> Return`
3. 재고 부족 구간과 CS 티켓 급증의 상관관계 분석  
   `InventorySnapshot -> Product -> Order -> SupportTicket`
4. 채널별 고가치 고객군에서 할인 의존 매출 비중 및 순이익 영향 분석  
   `Channel -> Customer -> Order -> Promotion -> OrderItem`

### 강사 대본 연계 확장 논리 관계
Track 1 강사 대본의 "다중경로 분석"에 맞춰 실습자도 아래 논리 관계를 확장 관계로 사용할 수 있습니다.

- `Payment relates_to Return (logical)`  
  `payments -> orders -> returns`
- `Shipment relates_to Return (logical)`  
  `shipments -> orders -> returns`
- `Order applies Promotion (logical path)`  
  `orders -> order_promotions -> promotions`

복합 경로 예시:
- `Campaign -> Order -> Payment -> Shipment -> Return`
- `Promotion -> Order -> Margin(파생지표)`

### Ontology 강점이 극대화되는 포인트
- 동일 이벤트(주문)를 결제/배송/재고/프로모션/CS와 연결해 **원인-결과 그래프**로 해석 가능
- SQL 조인 중심 분석을 넘어 엔터티 관계 경로 기반의 **설명 가능한 AI 답변** 생성 가능
- “무슨 일이 일어났나”를 넘어 “왜 일어났나”까지 추적 가능한 구조 확보

## 1) 전체 구조(3계층)
1. 원천(Source) 계층  
   - 테이블: `customers`, `products`, `orders`, `order_items`, `returns`, `channels`, `payments`, `shipments`, `inventory_snapshots`, `promotions`, `order_promotions`, `campaigns`, `campaign_attribution`, `support_tickets`
2. 표준(Standard) 계층  
   - 키/타입/코드 규칙 통일 (`<entity>_id`, `DATE`/`TIMESTAMP`, 상태코드 표준)
3. Ontology 계층  
   - 엔터티/관계/속성으로 비즈니스 의미 모델링 (AI 활용용 의미 구조)

<a id="source-table-structure"></a>
## 2) 원천 테이블 구조와 역할

### `customers` (고객 마스터)
- 주 식별자(PK): `customer_id`
- 주요 속성 예시: `customer_segment`, `customer_tier`, `join_date`
- 역할: 고객 특성 및 세그먼트 기준 제공

### `products` (상품 마스터)
- 주 식별자(PK): `product_id`
- 주요 속성 예시: `category`, `unit_price`
- 역할: 상품 분류/가격 기준 제공

### `orders` (주문 헤더)
- 주 식별자(PK): `order_id`
- 외래키(FK): `customer_id`, `channel_id`
- 주요 속성 예시: `order_date`, `order_status`, `order_value`
- 역할: 주문 단위 트랜잭션의 중심 테이블

### `order_items` (주문 상세)
- 키 구조: (`order_id`, `product_id`) 복합키 또는 별도 `order_item_id`
- 외래키(FK): `order_id`, `product_id`
- 주요 속성 예시: `quantity`, `sales_amount`
- 역할: 주문과 상품의 다대다(N:M) 관계를 해소하는 상세 라인

### `returns` (반품 이력)
- 주 식별자(PK): `return_id`
- 외래키(FK): `order_id`, `product_id`, `customer_id`
- 주요 속성 예시: `return_reason`, `return_date`
- 역할: 반품 이벤트 및 사유 분석 기준 제공

### `channels` (유입 채널 마스터)
- 주 식별자(PK): `channel_id`
- 주요 속성 예시: `channel_name`
- 역할: 주문 유입 경로 분석 기준 제공
- 구성: 실제 의미 있는 **4개 채널**로 구성됩니다.
  - `CH0001` OnlineMall(온라인몰), `CH0002` MobileApp(모바일 앱), `CH0003` Social(소셜), `CH0004` OfflineStore(오프라인 매장)
  - `orders.channel_id`, `campaigns.channel_id`는 모두 이 4개 채널 중 하나를 참조합니다.

### `payments` (결제 이력)
- 주 식별자(PK): `payment_id`
- 외래키(FK): `order_id`
- 주요 속성 예시: `payment_status`, `payment_method`, `approved_at`
- 역할: 결제 실패/재시도 패턴 및 승인 전환 분석

### `shipments` (배송 이력)
- 주 식별자(PK): `shipment_id`
- 외래키(FK): `order_id`
- 주요 속성 예시: `shipment_status`, `carrier`, `delivered_at`
- 역할: 배송 지연과 반품/CS 연계 분석

### `inventory_snapshots` (재고 스냅샷)
- 주 식별자(PK): `snapshot_id`
- 외래키(FK): `product_id`
- 주요 속성 예시: `snapshot_date`, `on_hand_qty`, `reserved_qty`
- 역할: 재고 부족 시점과 매출/반품/CS 상관관계 분석

### `promotions` / `order_promotions` (프로모션)
- `promotions` 주 식별자(PK): `promotion_id`
- `order_promotions` 외래키(FK): `order_id`, `promotion_id`
- 주요 속성 예시: `promotion_type`, `discount_amount`, `start_date`, `end_date`
- 역할: 할인 정책과 마진/반품/고객행동의 관계 분석

### `campaigns` / `campaign_attribution` (캠페인 어트리뷰션)
- `campaigns` 주 식별자(PK): `campaign_id`
- `campaign_attribution` 연결키: `campaign_id`, `order_id`, `customer_id`
- 주요 속성 예시: `touchpoint`, `attribution_model`, `attributed_revenue`
- 역할: 유입 캠페인과 전환 성과 및 품질 이슈 연결

### `support_tickets` (고객응대)
- 주 식별자(PK): `ticket_id`
- 외래키(FK): `customer_id`, `order_id`
- 주요 속성 예시: `ticket_type`, `ticket_reason`, `created_at`, `resolved_at`
- 역할: 결제/배송/반품 문제의 고객 영향도 측정

## 3) 관계(Cardinality) 관점
- Customer 1 : N Order  
  - 한 고객은 여러 주문을 생성할 수 있음
- Order N : M Product  
  - 한 주문은 여러 상품을 포함, 한 상품은 여러 주문에 포함
  - 물리 모델에서는 `order_items`가 브릿지 역할 수행
- Order N : 1 Channel  
  - 각 주문은 하나의 유입 채널에 귀속
- Order 1 : N Payment  
  - 주문은 여러 결제 시도(실패/재시도/승인)를 가질 수 있음
- Order 1 : N Shipment  
  - 주문은 분할배송 등으로 여러 배송 건을 가질 수 있음
- Order N : M Promotion (via `order_promotions`)  
  - 주문에 여러 프로모션이 적용되고, 프로모션은 여러 주문에 적용될 수 있음
- Campaign 1 : N Order (via `campaign_attribution`)  
  - 하나의 캠페인이 여러 전환 주문에 기여
- Customer 1 : N SupportTicket  
  - 고객 이슈/클레임이 주문 이벤트와 연계되어 발생
- Product 1 : N InventorySnapshot  
  - 시점별 재고 상태 추적

### 복합 관계 활용 예시
- `Campaign -> Customer -> Order -> Payment -> Shipment -> Return`  
  - 마케팅 유입 이후 결제/배송 문제를 거쳐 반품으로 이어지는 경로 분석
- `Promotion -> Order -> OrderItem -> Product -> Margin`  
  - 할인 정책이 매출은 올리지만 마진을 훼손하는 구간 탐색
- `InventorySnapshot -> Product -> Order -> SupportTicket`  
  - 재고 부족이 주문 지연/문의 폭증으로 이어지는 연쇄 패턴 탐색
- `Channel -> CustomerTier -> Order -> SupportTicket`  
  - 채널별 고가치 고객 경험 악화 신호 조기 탐지

### 파생 지표 정의: Margin
- 본 문서의 `Margin`은 별도 물리 테이블이 아닌 **파생 지표**로 정의합니다.
- 권장 계산식(예시):  
  - `order_item_margin = sales_amount - (quantity * unit_cost) - allocated_discount_amount`
  - `order_margin = SUM(order_item_margin) BY order_id`
- `unit_cost`가 없을 경우 실습에서는 `unit_price` 기반 근사치 또는 가정값을 사용하고, 가정값은 제출물에 명시합니다.

<a id="standardization-rules"></a>
## 4) 표준화 규칙의 구조적 의미
- 키 네이밍 통일: `<entity>_id` (snake_case)
- 시간 타입 통일: `DATE` 또는 `TIMESTAMP`
- 상태 코드 통일: 주문(`NEW`, `PAID`, `SHIPPED`, `CANCELLED`, `RETURNED`), 결제(`INITIATED`, `AUTHORIZED`, `FAILED`, `REFUNDED`), 배송(`READY`, `IN_TRANSIT`, `DELIVERED`, `DELAYED`), 문의(`INCIDENT`, `REQUEST`, `COMPLAINT`), 반품사유(`DEFECT`, `DELAY`, `CHANGED_MIND`, `WRONG_ITEM`)

효과:
1. 조인 및 검증 규칙 단순화
2. 쿼리 재사용성 증가
3. Ontology 매핑 시 의미 충돌 최소화

<a id="ontology-model"></a>
## 5) Ontology 구조(의미 모델)
- 엔터티(명사형): `Customer`, `Order`, `OrderItem`, `Product`, `Payment`, `Shipment`, `Return`, `Promotion`, `Campaign`, `SupportTicket`, `Channel`, `InventorySnapshot` 등
- 관계(동사형): `places`, `contains`, `belongs_to`, `has_payment`, `fulfilled_by`, `applies_promotion`, `attributed_by`, `raises_ticket`, `tracked_by_inventory` 등
- 속성: 엔터티별 식별자 + 핵심 비즈니스 속성

핵심 관점:
- "누가(Customer) 어떤 유입(Campaign/Channel)으로 주문(Order)했고, 결제/배송/할인/재고/CS 이벤트를 거쳐 어떤 결과(Return/이탈)로 이어졌는가"를 의미적으로 표현

<a id="mapping-3step"></a>
## 6) 3단 매핑 구조(원천 -> 표준 -> Ontology)
- `원천 컬럼 -> 표준 컬럼 -> Ontology 속성`

예시:
- `payments.payment_status -> payment_status_std -> Payment.status`
- `shipments.shipment_status -> shipment_status_std -> Shipment.status`
- `campaign_attribution.campaign_id -> campaign_id -> Campaign.campaign_id`
- `support_tickets.ticket_reason -> ticket_reason_std -> SupportTicket.reason`

<a id="validation-structure"></a>
## 7) 검증 구조(실습 미션 5)
1. 참조 무결성 검증  
   - 예: `payments.order_id`가 `orders.order_id`에 존재하는지 확인
   - 예: `order_promotions.promotion_id`가 `promotions.promotion_id`에 존재하는지 확인
2. 코드 유효성 검증  
   - 예: `payment_status`, `shipment_status`, `ticket_type`, `return_reason` 값이 표준 코드셋 내에 있는지 확인
3. 중복/결측 검증  
   - PK/FK 결측, 중복 키 존재 여부 확인

### 값 정합성 규칙 예시(권장 확장 검증)
트랙2 품질 점수화에서 그대로 재사용할 수 있는 값 정합성 규칙 예시입니다.
- `SUM(order_items.sales_amount) BY order_id` == `orders.gross_amount` (할인 전 금액과 일치, 오차 0.01 허용 → 데이터셋에 의도적 불일치 2건 포함)
- `orders.net_amount` == `orders.gross_amount - orders.discount_applied` (할인 후 순액 정합)
- `orders.order_value` == `orders.net_amount` (표시 금액 = 순액)
- MultiTouch 주문: `SUM(campaign_attribution.attributed_revenue) BY order_id` == `orders.net_amount`
- 결제 승인 합계(`payments.approved_amount` where status=`AUTHORIZED`) ≤ `orders.net_amount`
- 재고 스냅샷 `on_hand_qty >= 0` 및 `reserved_qty >= 0`

<a id="semantic-validation-structure"></a>
### 7-1) 온톨로지 의미 질의/추론 검증 구조(선택 심화)
SQL 검증은 "데이터 품질/정합성"을 검증하고, 의미 질의 검증은 "질문 경로가 온톨로지에서 재현되는가"를 검증합니다.

권장 2단계:
1. **Level A (환경 무관)**  
   - 질문을 엔터티-관계 경로로 명시  
   - `getDefinition`에서 경로 엔터티/관계/매핑 존재 확인  
   - 동일 질문의 SQL 기준값(베이스라인) 산출
2. **Level B (GraphModel 가능 환경)**  
   - GraphModel `refreshGraph` 후 `executeQuery` 실행  
   - Graph 질의 결과와 SQL 기준값을 비교(행수/샘플 키)

검증 로그 최소 항목:
- `question`, `path`, `baselineSqlRows`
- `graphQueryStatus`, `graphRows`, `comparison(PASS|FAIL)`, `failReason`

이 구조를 쓰면 "SQL이 되는가?"를 넘어 "온톨로지 의미 경로가 실제 질의 엔진에서 일관되게 동작하는가?"까지 확인할 수 있습니다.

<a id="profiling-checkpoints"></a>
## 8) 프로파일링 관점 체크포인트(실습 미션 2)
1. 결측률
   - 핵심 키(`order_id`, `customer_id`, `product_id`, `payment_id`, `shipment_id`) 및 기준 날짜 컬럼의 결측 여부를 우선 점검
2. 중복률
   - 마스터(`customers`, `products`, `campaigns`)와 이벤트(`payments`, `shipments`, `support_tickets`)의 식별자 중복을 분리해 확인
3. 코드값 분포
   - `order_status`, `payment_status`, `shipment_status`, `ticket_type`, `return_reason` 등 범주형 값의 분포/이상값 확인
4. 이상값
   - `unit_price`, `order_value`, `sales_amount`, `discount_amount`, `on_hand_qty`, `quantity`의 음수/비정상 극단값 확인
5. 이슈 심각도 분류
   - High: 무결성/분석 결과 왜곡 가능
   - Medium: 일부 지표 영향
   - Low: 해석 가능하나 품질 개선 필요

---

실습 수행 시에는 [WORKBOOK.md](../WORKBOOK.md)의 단계별 미션 순서에 맞춰 본 문서를 참고하세요.
