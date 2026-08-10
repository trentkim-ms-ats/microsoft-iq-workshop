# Track1 실습 데이터 구조 상세 설명

이 문서는 [WORKBOOK.md](../WORKBOOK.md)에서 사용되는 데이터 구조를 상세히 설명합니다. 본 데이터 구조는 워크숍 네 구성요소 Microsoft IQ 흐름(FabricIQ + WorkIQ + WebIQ + FoundryIQ)의 **내부 공통 시맨틱 어휘**로 사용됩니다.

## Microsoft IQ workshop에서의 역할

| 계층 | 이 구조를 사용하는 방식 |
|---|---|
| **FabricIQ (Track 1)** | Ontology 엔터티/관계로 정형 데이터를 의미화하고 시맨틱 질의를 수행 |
| **WorkIQ (Track 2)** | 동일한 엔터티명(Customer/Campaign/Product/Order 등)을 M365 문서 태그로 사용해 정형↔비정형을 연결 |
| **WebIQ (Track 3)** | 공개 확인 질문에 이 공통 키를 사용하되 내부 수치는 계산하지 않음 |
| **FoundryIQ (Track 4)** | 에이전트가 이 엔터티/관계 경로를 정형 근거 trace로 참조해 근거 기반 답변 생성 |

네 계층은 동일한 엔터티/속성 이름을 재사용하므로, Track 1에서 정의한 이름·상태 코드는 **Track 2 매핑표, Track 3 공개 확인 범위, Track 4 Foundry prompt에 그대로 인용**됩니다. 명명 규칙 일관성이 Microsoft IQ workshop 통합 품질의 전제 조건입니다.

> ⚠️ **실행 전 확인**: 본 문서의 SQL 예시는 Notebook 셀 언어가 **Spark SQL**일 때 실행됩니다. 각 SQL 실행 전에 셀 언어를 Spark SQL로 전환하세요.

## 미션별 바로가기
- 온톨로지 설명 문서: [Track1_Ontology_Concepts_and_Graph_Design_Guide.md](Track1_Ontology_Concepts_and_Graph_Design_Guide.md)
- 공통 설계 의도: [데이터 구조 설계 의도](#design-intent)
- 고급 기준 시나리오: [End-to-End 복합 관계 시나리오](#advanced-scenario)
- 미션 1(비즈니스 질문 정리): [질문 세트(Q1~Q5)와 권장 쿼리](#mission1-question-set), [원천 테이블 구조와 역할](#source-table-structure)
- 미션 2(데이터 구조·품질 개념): [데이터 품질 개념 체크포인트](#profiling-checkpoints)
- 미션 3(표준 스키마 설계): [표준화 규칙의 구조적 의미](#standardization-rules)
- 미션 4(Ontology 엔터티/관계 설계): [Ontology 구조(의미 모델)](#ontology-model)
- 미션 5(매핑 및 의미 경로 확인): [3단 매핑 구조](#mapping-3step), [운영 검증 개념](#validation-structure), [의미 질의 검증 구조](#semantic-validation-structure)

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

<a id="mission1-question-set"></a>
## 0-2) 미션 1 기준 질문(Q1~Q5)과 권장 쿼리

아래 Q1~Q5는 Track1에서 질문-데이터 매핑을 확정할 때 사용하는 기준 질문 세트입니다.  
각 쿼리는 결과 숫자 자체보다 **해석 경로(어떤 관계를 통해 결론을 냈는가)**를 남기는 데 목적이 있습니다.

### 질문/테이블/핵심 컬럼 매핑

| 질문 ID | 비즈니스 질문 | 필요 테이블 | 핵심 컬럼 |
|---|---|---|---|
| Q1 | 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가? | campaigns, campaign_attribution, customers, orders, payments | campaign_id, customer_id, order_id, payment_status, attributed_revenue, order_date |
| Q2 | 배송 지연은 반품률과 고객 만족도에 어떤 영향을 미치는가? | shipments, returns, support_tickets, orders, customers, channels | shipment_status, delivered_at, return_reason, ticket_type, customer_tier, channel_id |
| Q3 | 프로모션 유형별 할인 전략이 매출총이익과 재구매율에 미치는 영향은 무엇인가? | promotions, order_promotions, orders, order_items, products, customers | promotion_type, discount_amount, order_value, unit_price, quantity, customer_id |
| Q4 | 재고 부족/품절 경험은 주문 취소율과 고객센터 문의량에 어떤 영향을 미치는가? | inventory_snapshots, products, orders, support_tickets, channels | on_hand_qty, reserved_qty, order_status, ticket_type, ticket_reason, channel_id |
| Q5 | 채널·고객등급별 반품 사유 패턴은 재구매율에 어떤 차이를 만드는가? | returns, orders, customers, channels, order_items, products | return_reason, customer_tier, channel_id, order_date, customer_id, product_id |

### 권장 KPI

| 질문 | 권장 KPI |
|---|---|
| Q1 | 결제 실패율, 캠페인 전환율(승인 결제 기준) |
| Q2 | 배송 지연군 반품률, 배송 지연군 불만 티켓율(`ticket_type='COMPLAINT'`) |
| Q3 | 프로모션 유형별 매출총이익률(Proxy), 재구매율 |
| Q4 | 품절 경험 상품군 주문 취소율, 주문당 문의 건수 |
| Q5 | 채널·고객등급·반품사유별 재구매율 |

#### Q1. 결제 실패가 캠페인 전환율에 미치는 영향

**배경**  
캠페인 유입 주문이 실제 매출로 이어지지 않는 대표 원인은 결제 실패입니다.  
Q1은 `유입 성과(캠페인)`와 `거래 성사(결제 승인)`를 분리해, 마케팅 문제와 결제 운영 문제를 구분해 해석하기 위한 기준 쿼리입니다.

**분석 경로**  
`Campaign -> CampaignAttribution -> Order -> Payment`

**결과 해석 포인트**  
- `payment_failure_rate`가 높은 캠페인에서 `conversion_rate`가 낮으면 결제 구간 병목 가능성이 큽니다.
- `conversion_rate`는 승인 결제(`SUCCESS`, `RETRYSUCCESS`, `AUTHORIZED`) 기준입니다.
- 귀속 데이터 누락 가능성이 있으므로, 값이 낮다고 바로 캠페인 품질 문제로 단정하지 않습니다.

```sql
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
```

#### Q2. 배송 지연이 반품률·불만 티켓에 미치는 영향

**배경**  
배송 지연은 반품 증가와 고객 불만을 동시에 유발할 수 있습니다.  
Q2는 배송 상태 변화가 고객경험 지표(반품/불만)로 어떻게 전이되는지 확인하는 운영 리스크 진단 쿼리입니다.

**분석 경로**  
`Order -> Shipment -> Return`, `Order -> SupportTicket`

**결과 해석 포인트**  
- `is_delayed=1` 집단의 `return_rate`, `complaint_ticket_rate`가 동시 상승하면 배송 이슈가 고객경험 악화로 이어졌다고 해석할 수 있습니다.
- 반품/티켓은 주문 단위 플래그(있음/없음)로 집계되므로, 건수 자체보다 비율 비교가 핵심입니다.
- 티켓 유형은 `COMPLAINT` 기준이며, `INQUIRY`와 혼합 해석하지 않습니다.

```sql
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
```

#### Q3. 프로모션 유형별 마진(Proxy)·재구매율 비교

**배경**  
프로모션은 단기 매출을 올릴 수 있지만, 할인 구조에 따라 마진 훼손과 재구매 효과가 다릅니다.  
Q3는 프로모션 유형별로 수익성과 고객 유지 신호를 동시에 비교하기 위한 기준 쿼리입니다.

**분석 경로**  
`Promotion -> OrderPromotion -> Order -> Customer`

**결과 해석 포인트**  
- `gross_margin_proxy`는 `SUM(net_amount)/SUM(gross_amount)` 기반 근사치이며, 실제 원가 기반 마진과는 다를 수 있습니다.
- `repurchase_rate`는 고객 전체 주문 이력에서 `2회 이상 주문` 고객 비율입니다.
- 특정 프로모션이 마진을 낮추면서 재구매율도 낮다면 우선 조정 후보입니다.

```sql
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
```

#### Q4. 재고 부족(품절 노출) 경험이 취소율·문의량에 미치는 영향

**배경**  
재고 부족은 주문 취소와 CS 문의 증가로 이어져 운영 비용을 키웁니다.  
Q4는 품절 노출 상품이 포함된 주문과 아닌 주문을 나눠 취소율/문의량 차이를 확인하는 기준 쿼리입니다.

**분석 경로**  
`InventorySnapshot -> Product -> OrderItem -> Order -> SupportTicket`

**결과 해석 포인트**  
- `has_stockout_product=1` 집단의 `cancel_rate`, `avg_tickets_per_order`가 높으면 재고-고객영향 연쇄를 의심할 수 있습니다.
- 재고 스냅샷은 시점 데이터이므로, 주문 시점과의 완전한 인과를 보장하지 않습니다.
- 이 쿼리는 원인 확정이 아니라 우선 점검 대상을 찾는 탐지용 분석입니다.

```sql
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
```

#### Q5. 채널·고객등급·반품사유 패턴별 재구매율 차이

**배경**  
반품은 동일 현상처럼 보이지만 채널/고객등급/사유 조합에 따라 재구매 회복력 차이가 큽니다.  
Q5는 어떤 세그먼트에서 반품 이후 재구매가 특히 낮은지 파악해 대응 우선순위를 정하기 위한 기준 쿼리입니다.

**분석 경로**  
`Return -> Order -> Channel/CustomerTier`, `Customer -> Order(반복구매)`

**결과 해석 포인트**  
- `repurchase_rate`가 낮은 조합(채널/등급/사유)은 보상 정책·상세 안내 개선의 우선 후보입니다.
- `returned_customers`가 매우 작은 그룹은 표본 왜곡이 있으므로 함께 확인합니다.
- 고객 등급 결측/이상값은 별도 그룹으로 분리해 해석합니다.

```sql
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
## 7) 운영 데이터 검증 구조(개념 설명용, 참가자 실행 제외)

아래 규칙은 운영에서 왜 필요한지 설명하기 위한 참고입니다. 현재 Track1 참가자
실습에서는 P1 오류를 찾거나 수정하는 SQL을 실행하지 않으며, 결과 건수도 제출하거나
채점하지 않습니다. 강사·운영 회귀가 필요할 때만 정답노트를 사용합니다.
1. 참조 무결성 검증  
   - 예: `payments.order_id`가 `orders.order_id`에 존재하는지 확인
   - 예: `order_promotions.promotion_id`가 `promotions.promotion_id`에 존재하는지 확인
2. 코드 유효성 검증  
   - 예: `payment_status`, `shipment_status`, `ticket_type`, `return_reason` 값이 표준 코드셋 내에 있는지 확인
3. 중복/결측 검증  
   - PK/FK 결측, 중복 키 존재 여부 확인

### 값 정합성 규칙 예시(운영 참고)
트랙2 품질 점수화에서 그대로 재사용할 수 있는 값 정합성 규칙 예시입니다.
- `SUM(order_items.sales_amount) BY order_id` == `orders.gross_amount` (할인 전 금액과 일치, 오차 0.01 허용 → 데이터셋에 의도적 불일치 2건 포함)
- `orders.net_amount` == `orders.gross_amount - orders.discount_applied` (할인 후 순액 정합)
- `orders.order_value` == `orders.net_amount` (표시 금액 = 순액)
- MultiTouch 주문: `SUM(campaign_attribution.attributed_revenue) BY order_id` == `orders.net_amount`
- 결제 승인 합계(`payments.approved_amount` where status=`AUTHORIZED`) ≤ `orders.net_amount`
- 재고 스냅샷 `on_hand_qty >= 0` 및 `reserved_qty >= 0`

<a id="semantic-validation-structure"></a>
### 7-1) 온톨로지 의미 질의/추론 확인 구조(미션 5)
이 미션은 데이터 오류 탐지가 아니라 "질문 경로가 온톨로지에서 재현되는가"를
확인합니다. Level A는 참가자 기본 과정이고 Level B는 환경이 지원할 때만 수행합니다.

권장 2단계:
1. **Level A (환경 무관)**  
   - 질문을 엔터티-관계 경로로 명시  
   - `getDefinition`에서 경로 엔터티/관계/매핑 존재 확인  
   - 동일 질문의 SQL 기준값(베이스라인) 산출
2. **Level B (GraphModel 가능 환경)**  
   - GraphModel `refreshGraph` 후 `executeQuery` 실행  
   - Graph 질의 결과와 SQL 기준값을 비교(행수/샘플 키)

권장 시나리오 팩(기존 미제공 보강 포함):

| 시나리오 | 질문 | 경로 | SQL 기준값 |
|---|---|---|---|
| A (기본) | 캠페인 유입 주문 중 결제 실패 주문은? | `Campaign -> CampaignAttribution -> Order -> Payment` | 실패 주문의 `campaign_id, order_id` 목록 |
| B (보강) | 프로모션 유형별 재구매율은? | `Promotion -> OrderPromotion -> Order -> Customer` | `promotion_type`별 `orders_cnt`, `repurchase_rate` |

시나리오 B 비교 기준(권장):
- `orders_cnt` 차이 허용: 0
- `repurchase_rate` 허용오차: ±0.001
- 불일치 시 우선 점검: `Order_receives_OrderPromotion`, `OrderPromotion_points_to_Promotion`, `Customer_places_Order` 관계/방향

검증 로그 최소 항목:
- `question`, `path`, `baselineSqlRows`
- `graphQueryStatus`, `graphRows`, `comparison(PASS|FAIL)`, `failReason`

이 구조를 쓰면 "SQL이 되는가?"를 넘어 "온톨로지 의미 경로가 실제 질의 엔진에서 일관되게 동작하는가?"까지 확인할 수 있습니다.

<a id="profiling-checkpoints"></a>
## 8) 데이터 품질 개념 체크포인트(미션 2 설명용)

강사가 아래 개념과 분석 영향을 설명합니다. 참가자는 실제 오류 위치·건수를 탐지하거나
수정하지 않고 Q1~Q5에 미치는 영향만 기록합니다.
1. 결측률
   - 핵심 키(`order_id`, `customer_id`, `product_id`, `payment_id`, `shipment_id`) 및 기준 날짜 컬럼의 결측 여부를 우선 점검
2. 중복률
   - 마스터(`customers`, `products`, `campaigns`)와 이벤트(`payments`, `shipments`, `support_tickets`)의 식별자 중복을 분리해 확인
3. 코드값 분포
   - `order_status`, `payment_status`, `shipment_status`, `ticket_type`, `return_reason` 등 범주형 값의 분포/이상값 확인
4. 이상값
   - `unit_price`, `order_value`, `sales_amount`, `discount_amount`, `on_hand_qty`, `quantity`의 음수/비정상 극단값 확인
5. 운영 시 이슈 심각도 분류 예
   - High: 무결성/분석 결과 왜곡 가능
   - Medium: 일부 지표 영향
   - Low: 해석 가능하나 품질 개선 필요

---

실습 수행 시에는 [WORKBOOK.md](../WORKBOOK.md)의 단계별 미션 순서를 따릅니다.
P1 탐지 SQL은 이 문서의 설명과 별개로 참가자 실습에 포함되지 않습니다.
