# 트랙1 실습지(참가자용) v1.0

- 트랙명: Track 1 — FabricIQ 시맨틱 레이어: Fabric + Ontology(Preview) 데이터 준비
- 3-IQ 통합 스택 내 위치: **FabricIQ 구축 단계**. Track 2에서 WorkIQ 인덱스와 연결되고, Track 3에서 FoundryIQ 에이전트의 그라운딩 소스로 사용됩니다.
- 총 시간: 150분 (실습 140분 + 휴식 10분)
- 권장 시간대: 09:35-12:05
- 대상: 데이터/SQL 기초 보유자

## 참고 자료
- End-to-End 실습 노트북: [Track1_EndToEnd_Learner_Notebook.ipynb](./Track1_EndToEnd_Learner_Notebook.ipynb)
- 데이터 구조 상세 설명: [Track1_Data_Structure_Detailed_Guide.md](./docs/Track1_Data_Structure_Detailed_Guide.md)
- 온톨로지 개념/그래프 가이드: [Track1_Ontology_Concepts_and_Graph_Design_Guide.md](./docs/Track1_Ontology_Concepts_and_Graph_Design_Guide.md)
- Track2 시작 인계 체크: [PREREQUISITES.md](../track2/PREREQUISITES.md)
- 공통 설계 의도: [데이터 구조 설계 의도](./docs/Track1_Data_Structure_Detailed_Guide.md#design-intent)
- 고급 기준 시나리오: [End-to-End 복합 관계 시나리오](./docs/Track1_Data_Structure_Detailed_Guide.md#advanced-scenario)
- 미션 1 참고: [원천 테이블 구조와 역할](./docs/Track1_Data_Structure_Detailed_Guide.md#source-table-structure)
- 미션 2 참고: [프로파일링 관점 체크포인트](./docs/Track1_Data_Structure_Detailed_Guide.md#profiling-checkpoints)
- 미션 3 참고: [표준화 규칙의 구조적 의미](./docs/Track1_Data_Structure_Detailed_Guide.md#standardization-rules)
- 미션 4 참고: [Ontology 구조(의미 모델)](./docs/Track1_Data_Structure_Detailed_Guide.md#ontology-model)
- 미션 5 참고: [3단 매핑 구조](./docs/Track1_Data_Structure_Detailed_Guide.md#mapping-3step), [검증 구조](./docs/Track1_Data_Structure_Detailed_Guide.md#validation-structure), [의미 질의 검증 구조(선택)](./docs/Track1_Data_Structure_Detailed_Guide.md#semantic-validation-structure)

## 실습 목표
1. 원천 데이터를 FabricIQ가 이해 가능한 표준 시맨틱 구조로 정리한다.
2. Ontology 엔터티/관계/속성을 정의해 3-IQ 스택 공통 어휘로 만든다.
3. 원천-표준-온톨로지 매핑 및 1차 정합성 검증을 통과해 Track 2/3의 입력을 확정한다.

## 완료 기준(DoD)
1. 엔터티 10-16개, 관계 15-25개 정의 완료.
   - **통과 범위**는 10-16/15-25이며, 본 워크숍의 **권장 기준 모델**은 엔터티 14개/관계 20개입니다.
2. 매핑표(원천 컬럼 -> 표준 컬럼 -> Ontology 속성) 100% 작성.
3. 검증 쿼리 3종(참조 무결성, 코드 유효성, 중복/결측) 실행 및 결과 제출 완료.
   - 참조 무결성 오류 2건, PK 중복 1건, 금액 정합성 불일치 2건을 실제로 검출해 목록화.

## 실습 준비물
1. Fabric Workspace 접근 권한
2. Lakehouse
3. Notebook
4. 샘플 테이블 14종: `customers`, `products`, `orders`, `order_items`, `returns`, `channels`, `payments`, `shipments`, `inventory_snapshots`, `promotions`, `order_promotions`, `campaigns`, `campaign_attribution`, `support_tickets`
5. 제출 템플릿 파일 또는 Markdown 표

준비물 상세는 [PREREQUISITES.md](PREREQUISITES.md)를 참조.

## 사용 데이터 구조 원칙
- 온톨로지의 강력함을 보여주기 위한 데이터 구조를 사용한다.
- 데이터간의 복잡한 관계를 활용해 다중 홉 분석이 가능하도록 설계한다.

## 중간 점검 타임마커
- **T+20 (미션2 초반)**  
  - 14개 테이블 접근/필수 컬럼 확인 완료
  - 프로파일링 쿼리 실행 시작 상태 확인
- **T+60 (미션3 진행 중)**  
  - 표준 스키마(키/타입/코드) 초안 확정
  - 주문/결제/배송 + 문의유형 + 반품사유 코드셋 정렬 상태 확인
- **T+130 (미션5 진행 중)**  
  - 매핑표 70% 이상 작성
  - 검증 쿼리 3종(참조 무결성/코드 유효성/중복·결측) 실행 여부 확인

## 단계별 미션

### 미션 1. 비즈니스 질문 정리 (10분) - [고급 시나리오](./docs/Track1_Data_Structure_Detailed_Guide.md#advanced-scenario) / [원천 구조](./docs/Track1_Data_Structure_Detailed_Guide.md#source-table-structure)
1. 아래 **공통 질문 5개**를 워크숍 전체 기준 질문으로 확정한다.
2. 질문별로 필요한 데이터 테이블과 핵심 컬럼을 연결한다.

| 질문 ID | 비즈니스 질문 | 필요 테이블 | 핵심 컬럼 |
|---|---|---|---|
| Q1 | 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가? | campaigns, campaign_attribution, customers, orders, payments | campaign_id, customer_id, order_id, payment_status, attributed_revenue, order_date |
| Q2 | 배송 지연은 반품률과 고객 만족도에 어떤 영향을 미치는가? | shipments, returns, support_tickets, orders, customers, channels | shipment_status, delivered_at, return_reason, ticket_type, customer_tier, channel_id |
| Q3 | 프로모션 유형별 할인 전략이 매출총이익과 재구매율에 미치는 영향은 무엇인가? | promotions, order_promotions, orders, order_items, products, customers | promotion_type, discount_amount, order_value, unit_price, quantity, customer_id |
| Q4 | 재고 부족/품절 경험은 주문 취소율과 고객센터 문의량에 어떤 영향을 미치는가? | inventory_snapshots, products, orders, support_tickets, channels | on_hand_qty, reserved_qty, order_status, ticket_type, ticket_reason, channel_id |
| Q5 | 채널·고객등급별 반품 사유 패턴은 재구매율에 어떤 차이를 만드는가? | returns, orders, customers, channels, order_items, products | return_reason, customer_tier, channel_id, order_date, customer_id, product_id |

#### Q1~Q5 권장 KPI 및 검증 쿼리

| 질문 | 권장 KPI |
|---|---|
| Q1 | 결제 실패율, 캠페인 전환율(승인 결제 기준) |
| Q2 | 배송 지연군 반품률, 배송 지연군 불만 티켓율(`ticket_type='COMPLAINT'`) |
| Q3 | 프로모션 유형별 매출총이익률(Proxy), 재구매율 |
| Q4 | 품절 경험 상품군 주문 취소율, 주문당 문의 건수 |
| Q5 | 채널·고객등급·반품사유별 재구매율 |

```sql
-- Q1: 결제 실패율이 캠페인 전환율(승인 결제 기준)에 미치는 영향
WITH campaign_orders AS (
  SELECT ca.campaign_id, ca.order_id
  FROM campaign_attribution ca
),
payment_flags AS (
  SELECT
    p.order_id,
    MAX(CASE WHEN UPPER(TRIM(COALESCE(p.payment_status, ''))) IN ('FAILED') THEN 1 ELSE 0 END) AS has_failed,
    MAX(CASE WHEN UPPER(TRIM(COALESCE(p.payment_status, ''))) IN ('SUCCESS', 'RETRYSUCCESS', 'AUTHORIZED') THEN 1 ELSE 0 END) AS has_authorized
  FROM payments p
  GROUP BY p.order_id
)
SELECT
  co.campaign_id,
  COUNT(*) AS attributed_orders,
  AVG(COALESCE(pf.has_failed, 0)) AS payment_failure_rate,
  AVG(COALESCE(pf.has_authorized, 0)) AS conversion_rate
FROM campaign_orders co
LEFT JOIN payment_flags pf ON co.order_id = pf.order_id
GROUP BY co.campaign_id
ORDER BY conversion_rate ASC;

-- Q2: 배송 지연이 반품률/고객 불만 티켓율에 미치는 영향
WITH order_flags AS (
  SELECT
    o.order_id,
    MAX(CASE WHEN UPPER(TRIM(COALESCE(s.shipment_status, ''))) IN ('DELAYED') THEN 1 ELSE 0 END) AS is_delayed,
    MAX(CASE WHEN r.return_id IS NOT NULL THEN 1 ELSE 0 END) AS is_returned,
    MAX(CASE WHEN UPPER(TRIM(COALESCE(st.ticket_type, ''))) IN ('COMPLAINT') THEN 1 ELSE 0 END) AS has_complaint
  FROM orders o
  LEFT JOIN shipments s ON o.order_id = s.order_id
  LEFT JOIN returns r ON o.order_id = r.order_id
  LEFT JOIN support_tickets st ON o.order_id = st.order_id
  GROUP BY o.order_id
)
SELECT
  is_delayed,
  COUNT(*) AS orders_cnt,
  AVG(is_returned) AS return_rate,
  AVG(has_complaint) AS complaint_ticket_rate
FROM order_flags
GROUP BY is_delayed;

-- Q3: 프로모션 유형별 매출총이익률(Proxy)·재구매율
WITH order_amounts AS (
  SELECT
    o.order_id,
    CAST(o.gross_amount AS DOUBLE) AS gross_amount,
    CAST(o.net_amount AS DOUBLE) AS net_amount
  FROM orders o
),
customer_repeat AS (
  SELECT customer_id, CASE WHEN COUNT(*) >= 2 THEN 1 ELSE 0 END AS is_repeat
  FROM orders
  GROUP BY customer_id
)
SELECT
  p.promotion_type,
  COUNT(DISTINCT o.order_id) AS orders_cnt,
  SUM(oa.net_amount) / NULLIF(SUM(oa.gross_amount), 0) AS gross_margin_proxy,
  AVG(cr.is_repeat) AS repurchase_rate
FROM orders o
JOIN order_promotions op ON o.order_id = op.order_id
JOIN promotions p ON op.promotion_id = p.promotion_id
JOIN order_amounts oa ON o.order_id = oa.order_id
LEFT JOIN customer_repeat cr ON o.customer_id = cr.customer_id
GROUP BY p.promotion_type
ORDER BY gross_margin_proxy ASC;

-- Q4: 품절 경험 상품군의 취소율/문의량 영향
WITH stockout_products AS (
  SELECT DISTINCT product_id
  FROM inventory_snapshots
  WHERE CAST(on_hand_qty AS DOUBLE) - CAST(reserved_qty AS DOUBLE) <= 0
),
order_stockout_flag AS (
  SELECT
    o.order_id,
    MAX(CASE WHEN sp.product_id IS NOT NULL THEN 1 ELSE 0 END) AS has_stockout_product,
    MAX(CASE WHEN UPPER(TRIM(COALESCE(o.order_status, ''))) IN ('CANCELLED', 'CANCELED') THEN 1 ELSE 0 END) AS is_cancelled
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  LEFT JOIN stockout_products sp ON oi.product_id = sp.product_id
  GROUP BY o.order_id
),
ticket_cnt AS (
  SELECT order_id, COUNT(*) AS tickets_per_order
  FROM support_tickets
  GROUP BY order_id
)
SELECT
  osf.has_stockout_product,
  COUNT(*) AS orders_cnt,
  AVG(osf.is_cancelled) AS cancel_rate,
  AVG(COALESCE(tc.tickets_per_order, 0)) AS avg_tickets_per_order
FROM order_stockout_flag osf
LEFT JOIN ticket_cnt tc ON osf.order_id = tc.order_id
GROUP BY osf.has_stockout_product;

-- Q5: 채널·고객등급·반품사유 패턴별 재구매율
WITH customer_repeat AS (
  SELECT customer_id, CASE WHEN COUNT(*) >= 2 THEN 1 ELSE 0 END AS is_repeat
  FROM orders
  GROUP BY customer_id
)
SELECT
  ch.channel_name,
  c.customer_tier,
  r.return_reason,
  COUNT(DISTINCT r.customer_id) AS returned_customers,
  AVG(cr.is_repeat) AS repurchase_rate
FROM returns r
JOIN orders o ON r.order_id = o.order_id
JOIN customers c ON o.customer_id = c.customer_id
JOIN channels ch ON o.channel_id = ch.channel_id
LEFT JOIN customer_repeat cr ON r.customer_id = cr.customer_id
GROUP BY ch.channel_name, c.customer_tier, r.return_reason
ORDER BY repurchase_rate ASC;
```

#### 체크
- 질문 5개 확정
- 질문-테이블 매핑 완료

### 미션 2. 데이터 프로파일링 (30분) - [상세 설명](./docs/Track1_Data_Structure_Detailed_Guide.md#profiling-checkpoints)
1. 결측률, 중복률, 이상값, 코드값 분포를 점검한다.
2. 품질 이슈를 심각도(High/Medium/Low)로 분류한다.

```sql
-- (예시) payments 결측률
SELECT
  SUM(CASE WHEN payment_id IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS null_rate_payment_id,
  SUM(CASE WHEN order_id IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS null_rate_order_id,
  SUM(CASE WHEN payment_status IS NULL OR payment_status = '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS null_rate_payment_status
FROM payments;

-- (예시) 중복 키 점검
SELECT shipment_id, COUNT(*) cnt
FROM shipments
GROUP BY shipment_id
HAVING COUNT(*) > 1;

-- (예시) 이상값 점검
SELECT 'products.unit_price<=0' AS issue, COUNT(*) c FROM products WHERE unit_price <= 0
UNION ALL SELECT 'promotions.discount<0', COUNT(*) FROM promotions WHERE discount_amount < 0
UNION ALL SELECT 'inventory.on_hand<0', COUNT(*) FROM inventory_snapshots WHERE on_hand_qty < 0
UNION ALL SELECT 'order_items.qty<=0', COUNT(*) FROM order_items WHERE quantity <= 0;
```

> 💡 이 데이터셋에는 품질 이슈가 **의도적으로** 포함되어 있습니다. 아래 유형을 모두 찾으면 이슈 10개 이상 도출이 가능합니다.
> - 결측(NULL) 5건 (customer_segment / order_date / payment_status / return_reason / ticket_reason)
> - 이상값 4건 (price 0 / 음수 할인 / 음수 재고 / 음수 수량)
> - 비표준 상태 코드셋 3종 (orders / payments / shipments) → 미션 3에서 표준화
> - 금액 정합성 불일치 2건 (`gross_amount` ≠ `SUM(order_items.sales_amount)`)
> - 날짜(Date)와 타임스탬프(DateTime) 포맷 혼재

#### 체크
- 필수 테이블 14개 중 10개 이상 프로파일링 완료
- 이슈 목록 최소 5개 기록 (본 데이터셋은 10개 이상 발견 가능)

### 미션 3. 표준 스키마 설계 (30분) - [상세 설명](./docs/Track1_Data_Structure_Detailed_Guide.md#standardization-rules)
1. 공통 키 규칙을 정의한다.
2. 타입 표준을 맞춘다.
3. 코드 딕셔너리를 합의한다.

| 항목 | 규칙 |
|---|---|
| 키 네이밍 | `<entity>_id` 소문자 스네이크케이스 |
| 날짜 타입 | `DATE` 또는 `TIMESTAMP`로 통일 (현재 원천은 Date/DateTime 혼재) |
| 상태 코드 | 주문(`NEW`, `PAID`, `SHIPPED`, `CANCELLED`, `RETURNED`) / 결제(`INITIATED`, `AUTHORIZED`, `FAILED`, `REFUNDED`) / 배송(`READY`, `IN_TRANSIT`, `DELIVERED`, `DELAYED`) / 문의(`INCIDENT`, `REQUEST`, `COMPLAINT`) / 반품사유(`DEFECT`, `DELAY`, `CHANGED_MIND`, `WRONG_ITEM`) |

> 💡 원천 상태값은 **비표준**입니다. 아래 매핑을 설계하세요.
> - `orders.order_status`: `Completed`/`Cancelled` → 표준 코드셋
> - `payments.payment_status`: `Success`/`Failed`/`RetrySuccess` → 표준 코드셋
> - `shipments.shipment_status`: `Delivered`/`Delayed`/`InTransit` (CamelCase) → `UPPER_SNAKE`
> - `RetrySuccess`는 **상태 + 재시도 여부**가 섞인 값입니다 → `AUTHORIZED` + 별도 `is_retry`/`attempt_count` 컬럼 분리 토론.

#### 체크
- 핵심 엔터티 키 정의 완료
- 상태 코드 표준화 완료 (3개 테이블 비표준 코드 → 표준 매핑)

### 미션 4. Ontology 엔터티/관계 설계 (40분) - [상세 설명](./docs/Track1_Data_Structure_Detailed_Guide.md#ontology-model)
1. 엔터티 10-16개를 명사형으로 정의한다.
2. 관계 15-25개를 동사형으로 정의한다.
3. 각 관계의 카디널리티를 명시한다.

#### 권장 기준 엔터티 전체 목록 (14개)
| 엔터티 | 역할/정의 | 핵심 속성(예시) | 원천 테이블 |
|---|---|---|---|
| Customer | 구매/문의/반품의 주체 고객 | customer_id, customer_tier, customer_segment, join_date | customers |
| Product | 판매 상품 마스터 | product_id, product_name, category, unit_price, currency | products |
| Channel | 유입/판매 채널 | channel_id, channel_name | channels |
| Campaign | 마케팅 캠페인 단위 | campaign_id, campaign_name, campaign_type, start_date, end_date | campaigns |
| Promotion | 할인 정책/프로모션 단위 | promotion_id, promotion_name, promotion_type, discount_amount | promotions |
| Order | 주문 헤더(거래 중심) | order_id, order_date, order_status, gross_amount, net_amount | orders |
| OrderItem | 주문-상품 상세 라인 | order_id, product_id, quantity, sales_amount | order_items |
| Payment | 주문 결제 시도/승인 이벤트 | payment_id, order_id, payment_status, approved_amount, approved_at | payments |
| Shipment | 주문 배송 이행 이벤트 | shipment_id, order_id, shipment_status, delivered_at | shipments |
| Return | 반품 이벤트 | return_id, order_id, product_id, return_reason, return_date | returns |
| SupportTicket | 고객 문의/클레임 이벤트 | ticket_id, customer_id, order_id, ticket_type, ticket_reason | support_tickets |
| InventorySnapshot | 시점별 재고 스냅샷 | snapshot_id, product_id, snapshot_date, on_hand_qty, reserved_qty | inventory_snapshots |
| OrderPromotion | 주문-프로모션 브릿지 | order_id, promotion_id | order_promotions |
| CampaignAttribution | 캠페인-주문 귀속 브릿지 | campaign_id, order_id, customer_id, attribution_model, attributed_revenue | campaign_attribution |

#### 권장 기준 관계 전체 목록 (20개)
| 관계(동사형) | 설명 | 카디널리티 | 구현 근거 |
|---|---|---|---|
| Customer places Order | 고객이 주문 생성 | Customer 1 : N Order | orders.customer_id |
| Order belongs_to Channel | 주문이 채널에 속함 | Order N : 1 Channel | orders.channel_id |
| Order has Payment | 주문의 결제 시도/승인 이력 | Order 1 : N Payment | payments.order_id |
| Order fulfilled_by Shipment | 주문의 배송 이행 흐름 | Order 1 : N Shipment | shipments.order_id |
| Order includes OrderItem | 주문 상세 라인 포함 | Order 1 : N OrderItem | order_items.order_id |
| OrderItem references Product | 주문 라인이 상품 참조 | OrderItem N : 1 Product | order_items.product_id |
| Order has Return | 주문에서 반품 발생 | Order 1 : N Return | returns.order_id |
| Return references Product | 반품 대상 상품 참조 | Return N : 1 Product | returns.product_id |
| Return requested_by Customer | 반품 요청 고객 참조 | Return N : 1 Customer | returns.customer_id |
| Customer raises SupportTicket | 고객이 문의/클레임 생성 | Customer 1 : N SupportTicket | support_tickets.customer_id |
| SupportTicket relates_to Order | 문의가 특정 주문과 연결 | SupportTicket N : 1 Order | support_tickets.order_id |
| Product has InventorySnapshot | 상품의 시점별 재고 기록 | Product 1 : N InventorySnapshot | inventory_snapshots.product_id |
| Order receives OrderPromotion | 주문이 프로모션 연결정보를 가짐 | Order 1 : N OrderPromotion | order_promotions.order_id |
| OrderPromotion points_to Promotion | 주문-프로모션 브릿지에서 정책 참조 | OrderPromotion N : 1 Promotion | order_promotions.promotion_id |
| Campaign drives CampaignAttribution | 캠페인이 귀속 레코드 생성 | Campaign 1 : N CampaignAttribution | campaign_attribution.campaign_id |
| CampaignAttribution points_to Order | 귀속 레코드가 주문 참조 | CampaignAttribution N : 1 Order | campaign_attribution.order_id |
| CampaignAttribution points_to Customer | 귀속 레코드가 고객 참조 | CampaignAttribution N : 1 Customer | campaign_attribution.customer_id |
| Promotion influences Order (logical) | 프로모션이 주문 순액/할인에 영향 | Promotion N : M Order | order_promotions + orders |
| Campaign influences Order (logical) | 캠페인이 주문 전환에 영향 | Campaign N : M Order | campaign_attribution |
| Customer purchases Product (logical) | 고객의 상품 구매 관계(다중 홉) | Customer N : M Product | orders + order_items |

#### 권장 확장 논리 관계 (다중경로 분석)
아래 3개는 강사 진행 시 추가로 도출하는 다중경로 논리 관계입니다. 기본 20개 관계를 완성한 뒤, 팀 난이도/시간 여유에 맞춰 확장하세요.

| 관계(동사형) | 설명 | 카디널리티 | 구현 근거(다중 홉) |
|---|---|---|---|
| Payment relates_to Return (logical) | 결제 이력이 있는 반품 관계 추적 | Payment N : M Return | payments -> orders -> returns |
| Shipment relates_to Return (logical) | 배송 이후 반품 발생 관계 추적 | Shipment N : M Return | shipments -> orders -> returns |
| Order applies Promotion (logical path) | 주문별 적용 프로모션 경로 추적 | Order N : M Promotion | orders -> order_promotions -> promotions |

> 💡 다중 홉 복합 경로 예시: `Campaign -> Order -> Payment -> Shipment -> Return`, `Promotion -> Order -> Margin(파생지표)`.

#### Fabric Ontology로 구성하는 방법 (상세)
아래 순서대로 진행하면 미션 4 산출물(엔터티/관계/카디널리티)을 Fabric Ontology 화면에서 바로 구현할 수 있습니다.

**📌 빠른 방법: Python/REST API 자동화 (권장 - 5분)**

별도 Notebook 셀에서 [부록 A. Fabric Ontology 자동 구성 스크립트](#부록-a-fabric-ontology-자동-구성-스크립트-미션-4-보조)를 실행하면 엔터티 생성(단계 1)·속성 추가(단계 3)·물리 관계(단계 5)가 자동화됩니다. 원천 테이블 매핑(단계 4)과 논리 관계(단계 6)는 UI로 수동 진행합니다.

**📌 표준 방법: UI 수동 생성 (학습용)**

Fabric에서 Ontology를 만드는 전체 흐름은 다음 순서입니다:

```text
Workspace 준비 → Ontology item 생성 → Entity type 추가 → Property 추가 → Relationship 추가 → 저장/검증
```

> 💡 **핵심 개념**: **Entity type**은 `Customer`/`Product`/`Order` 같은 **비즈니스 객체**, **Property**는 `customer_id`/`order_date` 같은 **속성**, **Relationship**은 `Customer–Order` 같은 **객체 간 연결**입니다.
> 아래 예시는 UI 조작 방법을 보여주는 것이며, 실제로 만들 **정규 엔터티 14개·관계 20개는 위 [권장 기준 엔터티 전체 목록](#권장-기준-엔터티-전체-목록-14개)·[권장 기준 관계 전체 목록](#권장-기준-관계-전체-목록-20개)** 을 기준으로 삼으세요.

1. **Workspace 준비**
   - Fabric workspace가 **Fabric capacity에 연결**되어 있어야 합니다. 가능하면 F2 이상 capacity 또는 적절한 Fabric-enabled workspace를 사용하세요.
   - 사용자 권한은 최소 **Contributor** 이상이 필요합니다.

2. **Ontology item 생성**
   - Fabric 포털에서 workspace로 이동합니다.
     ```text
     app.fabric.microsoft.com → Workspace → New item
     ```
   - 검색창에서 `Ontology`를 찾아 선택하고, 이름을 입력합니다.
     ```text
     retail_track1_ontology_v1
     ```
   - 생성하면 workspace에 Ontology item이 생깁니다.

3. **Ontology 편집 화면 열기**
   - 생성된 Ontology item을 클릭합니다. 상단에 아래 버튼들이 보이면 올바른 화면입니다.
     ```text
     + Add entity type
     + Add relationship
     View Entity Type details
     ```

4. **Entity type 생성**
   - `+ Add entity type`을 클릭합니다. 예를 들어 고객 엔터티를 만들려면:
     ```text
     Name: Customer
     Description: 고객 마스터
     ```
   - 저장한 뒤, 같은 방식으로 아래 14개 엔터티를 모두 추가합니다.
     ```text
     Customer, Product, Channel, Campaign, Promotion,
     Order, OrderItem, Payment, Shipment, Return,
     SupportTicket, InventorySnapshot, OrderPromotion, CampaignAttribution
     ```
   - 네이밍 규칙: 엔터티명은 **PascalCase**(예: `CampaignAttribution`), 속성명은 **snake_case/표준 컬럼명 유지**(예: `customer_id`, `order_date`).

5. **Entity type 상세 열기**
   - 캔버스나 목록에서 `Customer`를 선택한 뒤 **View Entity Type details**를 클릭합니다. 오른쪽 또는 하단에 상세 패널이 열립니다.

6. **Property 추가**
   - 상세 패널에서 `Properties`, `Attributes`, `Fields`, `Schema` 중 비슷한 섹션을 찾고 **Add property**를 클릭합니다.
   - `Customer`에는 예를 들어 아래처럼 입력합니다.

     | Name | Type | Required |
     |---|---|---|
     | `customer_id` | Text/String | Yes |
     | `customer_name` | Text/String | Yes |
     | `customer_segment` | Text/String | No |
     | `registration_date` | Date | No |

   - 저장합니다.
   - 권장 타입 기준: 식별자/코드 → Text, 금액 → Decimal/Double, 수량 → Integer, 날짜 → Date, 시각 → DateTime/Timestamp. 필수 식별자(`*_id`)는 Required로 둡니다.

7. **다른 Entity type에도 Property 추가**
   - 같은 방식으로 나머지 엔터티에도 속성을 추가합니다. 예를 들어 `Order`에는:

     | Name | Type | Required |
     |---|---|---|
     | `order_id` | Text/String | Yes |
     | `order_date` | Date | Yes |
     | `order_status` | Text/String | No |
     | `gross_amount` | Decimal | No |
     | `net_amount` | Decimal | No |

   - 각 엔터티의 핵심 속성은 위 [권장 기준 엔터티 전체 목록](#권장-기준-엔터티-전체-목록-14개)의 "핵심 속성" 열을 참고하세요.

8. **Relationship 추가**
   - 엔터티 간 관계는 상단의 `+ Add relationship`을 사용합니다. 예시:

     | Relationship | From | To |
     |---|---|---|
     | Customer places Order | Customer | Order |
     | Order contains OrderItem | Order | OrderItem |
     | Product appears in OrderItem | Product | OrderItem |
     | Order has Payment | Order | Payment |
     | Order has Shipment | Order | Shipment |
     | Order has Return | Order/OrderItem | Return |
     | Campaign drives Attribution | Campaign | CampaignAttribution |
     | Promotion applies through OrderPromotion | Promotion | OrderPromotion |

   - 관계를 만들 때 cardinality를 선택할 수 있으면 보통 아래처럼 지정합니다.
     ```text
     Customer 1 → many Order
     Order 1 → many OrderItem
     Product 1 → many OrderItem
     Order 1 → many Payment
     Order 1 → many Shipment
     ```
   - 위 표는 UI 예시이며, **제출 기준 관계 20개(카디널리티·구현 근거 포함)** 는 [권장 기준 관계 전체 목록](#권장-기준-관계-전체-목록-20개)을 그대로 사용하세요. 브릿지 기반 N:M(`OrderPromotion`, `CampaignAttribution`)과 논리 관계(다중 홉)도 이 표에 정리되어 있습니다.

9. **저장/게시**
   - 변경 후 상단의 **Save**, **Publish**, **Apply changes**, **Commit changes** 중 표시되는 버튼을 눌러 저장합니다.
   - ⚠️ 저장하지 않으면 REST `getDefinition`에서 계속 `{}`처럼 보일 수 있습니다.

10. **검증**
   - Notebook에서 Ontology definition을 조회합니다.
     ```python
     url = f"https://api.fabric.microsoft.com/v1/workspaces/{WORKSPACE_ID}/ontologies/{ONTOLOGY_ID}/getDefinition"
     response = requests.post(url, headers=headers, timeout=30)
     print(response.status_code)
     print(response.text)
     ```
   - `definition.json`을 Base64 decode했을 때 `{}`가 아니라 entity/property/relationship 구조가 나오면 정상 저장된 것입니다.

**✅ 미션 4 마무리 (제출·미션 5 연계)**
- **제출용 스냅샷**: 엔터티/관계 다이어그램 화면을 캡처하고, ① 엔터티 목록(14개)+핵심 속성 ② 관계 목록(20개)+카디널리티 ③ 논리 관계의 구현 근거(브릿지/다중 홉)를 함께 제출합니다.
- **카디널리티 점검**: 모든 관계에 방향(From→To)과 카디널리티가 빠짐없이 있는지 확인합니다. 특히 `Order has Payment`는 재시도 결제가 있으므로 1:1로 고정하지 말고, `Campaign influences Order`는 직접 FK가 아니라 귀속 테이블 기반임을 명시합니다.
- **미션 5 선반영**: `orders.gross_amount / net_amount`, `payments.payment_status`, `shipments.shipment_status`, `campaign_attribution.attribution_model`가 Ontology 속성으로 연결되어 있는지 미션 4 종료 전에 확인합니다.

#### 체크
- 엔터티/관계 수량 기준 충족
- 카디널리티 누락 없음

### 미션 5. 매핑 및 1차 검증 (30분) - [매핑](./docs/Track1_Data_Structure_Detailed_Guide.md#mapping-3step) / [검증](./docs/Track1_Data_Structure_Detailed_Guide.md#validation-structure)
1. 원천 컬럼 -> 표준 컬럼 -> Ontology 속성 매핑을 작성한다.
2. 무결성 검증 쿼리 3종을 실행한다.
3. (선택) [의미 질의 검증 구조](./docs/Track1_Data_Structure_Detailed_Guide.md#semantic-validation-structure) 기준으로 온톨로지 경로 기반 검증을 수행한다.

```sql
-- 참조 무결성: payments.order_id -> orders.order_id  (기대: 1건 검출)
SELECT p.payment_id
FROM payments p
LEFT JOIN orders o ON p.order_id = o.order_id
WHERE o.order_id IS NULL;

-- 참조 무결성: support_tickets.customer_id -> customers  (기대: 1건 검출)
SELECT t.ticket_id
FROM support_tickets t
LEFT JOIN customers c ON t.customer_id = c.customer_id
WHERE c.customer_id IS NULL;

-- 코드값 유효성
SELECT shipment_status, COUNT(*)
FROM shipments
GROUP BY shipment_status;

-- 중복/결측 검증  (기대: shipment_id 1건 중복)
SELECT shipment_id, COUNT(*) AS cnt
FROM shipments
GROUP BY shipment_id
HAVING COUNT(*) > 1;

-- 금액 정합성: gross_amount == SUM(order_items.sales_amount)  (기대: 2건 불일치)
SELECT o.order_id, o.gross_amount, SUM(i.sales_amount) AS items_sum
FROM orders o
JOIN order_items i ON o.order_id = i.order_id
GROUP BY o.order_id, o.gross_amount
HAVING ABS(o.gross_amount - SUM(i.sales_amount)) > 0.01;
```

#### 체크
- 매핑표 100% 작성
- 검증 쿼리 3종 결과 캡처
- 기대 검출: 참조 무결성 **2건**, PK 중복 **1건**, 금액 정합성 불일치 **2건**
- (선택) 의미 질의 검증 로그 1세트(경로 정의 + SQL 기준값 + GraphModel 실행 결과/미실행 사유)

## 제출물
1. 질문 정의서
2. 프로파일링 결과(SQL + 이슈 목록)
3. 표준 스키마 규칙표
4. Ontology 모델 v0.1
5. 매핑표 + 검증 결과
6. Track2 인계 패키지(아래 템플릿)

## Track2 시작 인계 패키지 (필수, 10분)

Track1 산출물을 Track2에서 바로 사용할 수 있도록, 아래 항목을 **한 번에** 정리해 전달합니다.

| 인계 항목 | 필수 내용 |
|---|---|
| Ontology 식별 정보 | `WORKSPACE_ID`, `ONTOLOGY_ID`, Ontology 이름 |
| 모델 요약 | 엔터티/관계 개수, 핵심 경로 3개(예: Campaign->Order->Payment) |
| 매핑 근거 | `Entity -> table/column` 핵심 매핑 5개 이상 |
| 품질 이슈 | 미해결 이슈 Top 3 (영향도 + 임시 우회안) |
| WorkIQ 매칭 키 | 캠페인명/상품명/고객등급 등 문서 검색 키워드 |
| 검증 로그 | 미션5 SQL 결과 캡처 + (선택) 의미 질의 검증 로그 |

복붙 템플릿:
```text
[TRACK2_HANDOFF_PACKAGE]
team=<팀명>
handoffAtKst=<YYYY-MM-DD HH:MM>
workspaceId=<GUID>
ontologyId=<GUID>
ontologyName=<이름>
entityCount=<숫자>
relationshipCount=<숫자>
corePaths=<Path1;Path2;Path3>
mappingHighlights=<Entity:table.column,...>
openIssues=<이슈1|영향|우회안; 이슈2|영향|우회안; 이슈3|영향|우회안>
workiqKeys=<캠페인명,...; 상품명,...; 고객등급,...>
evidenceLinks=<노트북/캡처 경로>
[/TRACK2_HANDOFF_PACKAGE]
```

## 참가자 자가점검표
| 항목 | 완료(Y/N) |
|---|---|
| 질문-테이블 매핑 완료 |  |
| 프로파일링 이슈 5개 이상 도출 (10개 이상 가능) |  |
| 비표준 상태 코드 3종 표준화 |  |
| 표준 스키마 규칙 확정 |  |
| DoD 범위(엔터티 10-16/관계 15-25) 충족; 권장 14/20 확인 |  |
| 매핑표 100% 작성 |  |
| 검증 쿼리 3종 실행 (FK 2건·PK중복 1건·금액불일치 2건 검출) |  |
| Track2 인계 패키지 작성/공유 완료 |  |

---

## 부록 A. Fabric Ontology 자동 구성 스크립트 (미션 4 보조)

> 이 부록은 미션 4의 엔터티/속성/관계를 Notebook(PySpark) 셀에서 **REST API로 자동 구성**하는 보조 자료입니다.
> UI 수동 생성과 결과는 동일하며, 시간을 단축하려는 팀만 선택적으로 사용하세요.
> 아래 단계 번호는 미션 4 [Fabric Ontology로 구성하는 방법](#fabric-ontology로-구성하는-방법-상세)의 UI 단계와 대응됩니다.

| 부록 단계 | 작업 | 자동화 방식 | 대응 미션4 UI 단계 |
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
| `ALMOperationImportFailed` | 환경별 Definition import 제한 | UI 방식 또는 부록 B의 core fallback 사용 |

> 존재가 확인되지 않은 별도 `fabric-sdk` 예시는 사용하지 않습니다. 자동화는 검증된 Definition API 방식과 [부록 B](#부록-b-선언적-일괄-정의-방식-심화)를 사용합니다.

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
print("이 단계는 UI에서 추가하거나, 부록 B의 RelationshipTypes 일괄 배포를 사용하세요.")
```

> `/items/{ONTOLOGY_ID}/relationships` 형태의 개별 관계 API는 워크숍 기본 경로로 사용하지 않습니다. 검증된 UI 또는 부록 B Definition API 경로만 사용합니다.

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

> 부록 A 종료. 미션 4 본문의 [Fabric Ontology로 구성하는 방법](#fabric-ontology로-구성하는-방법-상세)과 함께 사용하세요.

---

## 부록 B. 선언적 일괄 정의 방식 (심화)

> ℹ️ 이 부록은 **개념 이해용 참고 자료**입니다. Track1 실습의 제출 기준은 부록 A(또는 미션 4 UI)로 충분하며, 부록 B는 심화/자동화에 관심 있는 참가자를 위한 것입니다.

### B-1. 핵심 아이디어: "사람이 읽는 계약(contract) → 정의 parts 번들"

이 방식은 먼저 엔터티/속성/관계를 **선언적 YAML 계약**으로 적어둡니다.

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

엔터티마다 `EntityTypes/{entity_id}/definition.json` 파트를 만들고, **Property를 그 안 `properties[]` 배열에 함께** 넣습니다(우리 부록 A처럼 속성만 따로 `updateDefinition` 하지 않음).

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

추가로 엔터티마다 **DataBinding 파트**(`EntityTypes/{id}/DataBindings/{bindingId}.json`)를 넣어 각 Property를 Lakehouse 테이블 컬럼에 직접 매핑합니다(`sourceColumnName` → `targetPropertyId`). 부록 A에서 UI로 하던 "원천 테이블 매핑"이 정의에 포함되는 셈입니다.

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

`.platform`(아이템 타입=Ontology)과 `definition.json`을 포함한 전체 parts를 **한 번의 정의로** 전송합니다. 부록 A의 제네릭 `/items` 방식과 달리 **`/ontologies` 전용 엔드포인트**를 사용합니다.

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

### B-5. 부록 A(점진적) vs 부록 B(선언적) 비교

| 항목 | 부록 A (본 실습 기본) | 부록 B (선언적 일괄) |
|---|---|---|
| 엔드포인트 | `/workspaces/{ws}/items` (제네릭) | `/workspaces/{ws}/ontologies` (전용) |
| 엔터티 생성 | 14개를 루프로 하나씩 | 정의 parts에 포함해 **한 번에** |
| Property | 엔터티별 `updateDefinition` 반복 | 엔터티 정의에 **인라인** |
| 원천 매핑 | UI 수동 | **DataBinding 파트로 정의에 포함** |
| Relationship | UI 수동 | `RelationshipTypes` + Contextualization |
| 적합한 상황 | 학습/단계별 이해 | 자동화/재현 가능한 프로비저닝 |

### B-6. 실행 파일 세트 & Notebook 배포 (실제 실행)

부록 B를 **실제로 실행**할 수 있도록, 모든 샘플 데이터에 대한 정의 파일과 배포 코드를 [`track1/ontology_bundle/`](./ontology_bundle) 폴더에 준비해 두었습니다.

| 파일 | 역할 |
|---|---|
| [`ontology_contract.yaml`](./ontology_bundle/ontology_contract.yaml) | 선언적 계약(단일 진실 원천): 14 엔터티 + 17 물리관계 + 3 논리관계 |
| [`generate_definition.py`](./ontology_bundle/generate_definition.py) · [`.ipynb`](./ontology_bundle/generate_definition.ipynb) | 계약 → Fabric Ontology `definition parts`(JSON) 생성기 (스크립트/노트북) |
| [`definition_parts/`](./ontology_bundle/definition_parts) | 생성된 정의 파트(업로드 대상). 총 67 parts + `_manifest.json` |
| [`deploy_ontology_notebook.py`](./ontology_bundle/deploy_ontology_notebook.py) · [`.ipynb`](./ontology_bundle/deploy_ontology_notebook.ipynb) | Notebook 셀 단위 배포 코드 (스크립트/노트북) |
| [`README.md`](./ontology_bundle/README.md) | 실행 순서 안내 |

정의 파트는 [`track1/data/`](./data/)의 실제 CSV 스키마(컬럼/PK/FK)와 1:1로 정합합니다.

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

이어서 아래 셀을 순서대로 실행합니다(전체 코드는 [`deploy_ontology_notebook.ipynb`](./ontology_bundle/deploy_ontology_notebook.ipynb) / [`.py`](./ontology_bundle/deploy_ontology_notebook.py)):

```python
# CELL 1 : 설정
import base64, json, os, requests
FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1"
WORKSPACE_ID  = "your-workspace-id"                 # 부록 A의 ID 조회 방법 참고
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
    body = {"displayName": ONTOLOGY_NAME, "description": "Track1 선언적 일괄 정의(부록 B)", "definition": definition}
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
- 의도된 노이즈(결측/중복/이상값)가 실제로 조회되는가

**⑦ 온톨로지 추론/의미 질의 검증 미니 실습 (선택, 10~15분)**

목적: SQL 조인 결과와 별개로, **질문을 온톨로지 경로(엔터티-관계)**로 표현하고 그 경로가 실제 질의로 재현되는지 확인합니다.

중요:
- 이 섹션은 Track1 기본 DoD 필수는 아니며, 시간 여유 팀의 심화 과제입니다.
- 테넌트에서 GraphModel Preview가 불가하면 **Level A까지만 수행**해도 됩니다.

검증 시나리오(권장 1개):
- 질문: "캠페인 유입 주문 중 결제 실패가 있는 주문은 무엇인가?"
- 온톨로지 경로: `Campaign -> CampaignAttribution -> Order -> Payment`

### Level A. 의미 경로 검증(환경 무관, 필수 권장)
1) 질문을 경로로 고정
- 엔터티/관계를 문장 대신 경로 문자열로 명시:  
  `Campaign influences Order` + `Order has Payment`

2) `getDefinition`으로 경로 구성요소 존재 확인
- 엔터티(`Campaign`, `Order`, `Payment`)와 관계가 정의에 있는지 확인
- DataBinding/Contextualization이 있다면 FK 바인딩까지 확인

3) SQL 기준값 계산(베이스라인)
```sql
SELECT DISTINCT ca.campaign_id, o.order_id
FROM campaign_attribution ca
JOIN orders o ON ca.order_id = o.order_id
JOIN payments p ON p.order_id = o.order_id
WHERE UPPER(TRIM(COALESCE(p.payment_status, ''))) = 'FAILED'
ORDER BY ca.campaign_id, o.order_id
LIMIT 20;
```

4) 로그 템플릿으로 기록
```text
[SEMANTIC_VALIDATION_START]
question=캠페인 유입 주문 중 결제 실패가 있는 주문은?
path=Campaign->CampaignAttribution->Order->Payment
baselineSqlRows=<행수>
```

### Level B. 의미 질의 실행 검증(GraphModel Preview 가능 환경)
1) GraphModel 준비
- Ontology와 별도 GraphModel 아이템 생성/갱신
- `refreshGraph` 완료(202 LRO polling 후 succeeded)

2) 의미 질의 실행
```python
GRAPH_MODEL_ID = "your-graph-model-item-id"  # Fabric UI에서 생성한 GraphModel item ID

query = """
MATCH (c:`Campaign`)-[:`Campaign_influences_Order`]->(o:`Order`)
MATCH (o)-[:`Order_has_Payment`]->(p:`Payment`)
WHERE toUpper(coalesce(p.payment_status, '')) = 'FAILED'
RETURN c.campaign_id AS campaign_id, o.order_id AS order_id
LIMIT 20;
"""
resp = requests.post(
    f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/executeQuery?beta=True",
    headers=headers,
    json={"query": query},
    timeout=60,
)
print(resp.status_code, resp.text[:500])
```

3) SQL 기준값과 비교
- 비교 기준:
  - Row count 차이 허용범위: 0 (동일 데이터 시점 기준)
  - `campaign_id`, `order_id` 샘플 10건이 동일
  - 불일치 시 원인 분류: 매핑 누락 / 관계 방향 오류 / 상태코드 표준화 미반영

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

> `definition.json` 이 `{}` 가 아니라 위처럼 엔터티/관계 개수가 나오면 정상 저장된 것입니다.
> ⚠️ 이 Notebook 은 **default Lakehouse 연결**이 필요합니다(`/lakehouse/default/Files/...` 접근). 202(비동기) 응답 시 `Location` 헤더로 완료를 폴링하는 코드는 전체 파일에 포함되어 있습니다.

---

## 부록 C. (심화) GraphModel — 그래프 쿼리를 원하는 경우

**본 Track1 기본 실습은 GraphModel을 필수로 다루지 않습니다.** 미션 4의 목표는 Ontology(엔터티/관계/속성 의미 모델)를 정의해 3-IQ의 공통 어휘를 만드는 것입니다. 다만 위 ⑦ 선택 심화처럼 GraphModel 가능 환경에서는 의미 질의 검증을 수행할 수 있으며, 더 확장된 그래프 질의가 필요하면 아래 경로를 따릅니다.

### C-1. Ontology와 GraphModel의 차이

- **Ontology 아이템**: 엔터티/관계/속성의 **의미 스키마**(무엇이 무엇과 어떻게 연결되는가). Track1의 산출물.
- **GraphModel 아이템**: 그 스키마를 실제 Lakehouse Delta 테이블에서 **노드/엣지로 물질화(materialize)**한 뒤 그래프 쿼리(MATCH … RETURN)를 실행할 수 있는 **별도 아이템**.

즉 GraphModel은 Ontology와 **별개의 Fabric 아이템**(`.platform` metadata `type: "GraphModel"`)으로 추가 생성해야 합니다.

### C-2. GraphModel을 원할 때의 구성

GraphModel 정의는 4개 파트 + `.platform`으로 구성됩니다.

| 파트 | 역할 |
|---|---|
| `graphType.json` | `nodeTypes` / `edgeTypes` — 노드·엣지 타입과 속성 타입 정의 |
| `dataSources.json` | 각 Delta 테이블을 `DeltaTable` 데이터 소스로 등록 (OneLake abfss 경로) |
| `graphDefinition.json` | `nodeTables` / `edgeTables` — 테이블 컬럼을 노드/엣지 속성에 매핑하고, 엣지의 `sourceNodeKeyColumns` / `destinationNodeKeyColumns`로 연결 |
| `stylingConfiguration.json` | 그래프 시각화 레이아웃(노드 위치/크기) |

```python
# 노드 타입: 엔터티 = 노드
node_types = [{
    "alias": entity_id, "labels": ["Customer"],
    "primaryKeyProperties": ["CustomerId"],
    "properties": [{"name": "CustomerId", "type": "STRING"}, ...],
}]
# 엣지 타입: 관계 = 엣지 (source/destination 노드 타입 연결)
edge_types = [{
    "alias": rel_id, "labels": ["Customer_places_Order"],
    "sourceNodeType": {"alias": entity_ids["Customer"]},
    "destinationNodeType": {"alias": entity_ids["Order"]},
}]
```

### C-3. 생성 → 새로고침 → 질의 흐름

먼저 Fabric UI에서 GraphModel item을 생성한 뒤, 항목 URL의 item ID를 복사합니다.

```python
GRAPH_MODEL_ID = "your-graph-model-item-id"

# 1) GraphModel 정의 배포
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/updateDefinition",
              headers=headers, json={"definition": {"parts": [...]}})

# 2) Delta 테이블에서 그래프 인덱스 빌드(새로고침) - 비동기 LRO
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/jobs/refreshGraph/instances",
              headers=headers)   # 202 → Location 헤더로 완료까지 폴링

# 3) 그래프 쿼리 실행 (Cypher 유사 문법, beta)
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/executeQuery?beta=True",
              headers=headers,
              json={"query": "MATCH (c:`Customer`)-[:`Customer_places_Order`]->(o:`Order`) RETURN c, o LIMIT 5;"})
```

### C-4. 언제 GraphModel을 고려하나

- **필요 없음(Track1 기본)**: 엔터티/관계 의미 모델 정의, 3-IQ 공통 어휘, WorkIQ/FoundryIQ 그라운딩 → **Ontology만으로 충분**.
- **고려할 만함**: 다중 홉 경로 탐색(예: 캠페인→주문→결제→반품 경로를 그래프 순회), 커뮤니티/중심성 등 그래프 분석, MATCH 패턴 질의를 직접 실행하고 싶을 때.

> ⚠️ GraphModel의 `executeQuery`는 현재 `beta` 파라미터가 필요한 Preview 기능입니다. 테넌트/리전에 따라 미지원일 수 있으므로, 사용 전 Fabric 공개 미리보기 제한 사항과 워크숍 환경을 먼저 확인하세요.
