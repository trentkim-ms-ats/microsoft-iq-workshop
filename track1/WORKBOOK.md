# 트랙1 실습지(참가자용) v1.0

> 이 트랙의 시나리오, CSV, Ontology 계약을 기준으로 진행합니다. 전체 순서는 [Microsoft IQ 입문자 학습 지도](../common/docs/Microsoft_IQ_Beginner_Learning_Map.md)를 참조하세요.

- 트랙명: Track 1 — FabricIQ 시맨틱 레이어: Fabric + Ontology(Preview) 데이터 준비
- Microsoft IQ 흐름 내 위치: **FabricIQ 구축 단계**. Track2에서 WorkIQ 인덱스와 연결되고, Track3에서 WebIQ 공개 확인 질문과 분리해 사용한 뒤, Track4에서 FoundryIQ orchestration의 정형 근거로 사용됩니다.
- 총 시간: 150분 (실습 140분 + 휴식 10분)
- 현재 1일 운영 시간대: 09:30-12:00.
  [canonical 통합 계획](../common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md#current-480-minute-schedule)의
  순서와 분량을 따릅니다.
- 대상: 데이터/SQL 기초 보유자

## 참고 자료
- End-to-End 실습 노트북: [Track1_EndToEnd_Learner_Notebook.ipynb](./Track1_EndToEnd_Learner_Notebook.ipynb)
- 데이터 구조 상세 설명: [Track1_Data_Structure_Detailed_Guide.md](./docs/Track1_Data_Structure_Detailed_Guide.md)
- 온톨로지 개념/그래프 가이드: [Track1_Ontology_Concepts_and_Graph_Design_Guide.md](./docs/Track1_Ontology_Concepts_and_Graph_Design_Guide.md)
- Track2 시작 인계 체크: [PREREQUISITES.md](../track2/PREREQUISITES.md)
- 공통 설계 의도: [데이터 구조 설계 의도](./docs/Track1_Data_Structure_Detailed_Guide.md#design-intent)
- 고급 기준 시나리오: [End-to-End 복합 관계 시나리오](./docs/Track1_Data_Structure_Detailed_Guide.md#advanced-scenario)
- 미션 1 참고: [원천 테이블 구조와 역할](./docs/Track1_Data_Structure_Detailed_Guide.md#source-table-structure)
- 미션 2 참고: [데이터 품질 개념과 구조 확인](./docs/Track1_Data_Structure_Detailed_Guide.md#profiling-checkpoints)
- 미션 3 참고: [표준화 규칙의 구조적 의미](./docs/Track1_Data_Structure_Detailed_Guide.md#standardization-rules)
- 미션 4 참고: [Ontology 구조(의미 모델)](./docs/Track1_Data_Structure_Detailed_Guide.md#ontology-model)
- 미션 5 참고: [3단 매핑 구조](./docs/Track1_Data_Structure_Detailed_Guide.md#mapping-3step), [의미 질의 검증 구조](./docs/Track1_Data_Structure_Detailed_Guide.md#semantic-validation-structure)


## 실습 목표
1. 원천 데이터를 FabricIQ가 이해 가능한 표준 시맨틱 구조로 정리한다.
2. Ontology 엔터티/관계/속성을 정의해 Microsoft IQ workshop 공통 어휘로 만든다.
3. 원천-표준-온톨로지 매핑과 의미 경로를 확인해 WorkIQ, WebIQ, FoundryIQ의 공통 내부 기준을 확정한다.

## 완료 기준(DoD)
1. 엔터티 10-16개, 관계 15-25개 정의 완료.
   - **통과 범위**는 10-16/15-25이며, 본 워크숍의 **권장 기준 모델**은 엔터티 14개/관계 20개입니다.
2. 매핑표(원천 컬럼 -> 표준 컬럼 -> Ontology 속성) 100% 작성.
3. 핵심 매핑 5개 이상과 Ontology 의미 경로 2개를 확인하고 결과 제출 완료.
   - P1 데이터 오류 탐지·수정 쿼리는 참가자 실습과 완료 기준에 포함하지 않음.

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
  - 데이터 품질 개념 설명과 Q1~Q5 영향 연결 완료
- **T+60 (미션3 진행 중)**  
  - 표준 스키마(키/타입/코드) 초안 확정
  - 주문/결제/배송 + 문의유형 + 반품사유 코드셋 정렬 상태 확인
- **T+130 (미션5 진행 중)**  
  - 매핑표 70% 이상 작성
  - 의미 경로 2개와 SQL 기준값 준비 여부 확인

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

#### Q1~Q5 권장 KPI 및 분리 실행 쿼리

| 질문 | 권장 KPI |
|---|---|
| Q1 | 결제 실패율, 캠페인 전환율(승인 결제 기준) |
| Q2 | 배송 지연군 반품률, 배송 지연군 불만 티켓율(`ticket_type='COMPLAINT'`) |
| Q3 | 프로모션 유형별 매출총이익률(Proxy), 재구매율 |
| Q4 | 품절 경험 상품군 주문 취소율, 주문당 문의 건수 |
| Q5 | 채널·고객등급·반품사유별 재구매율 |

##### Q1. 결제 실패가 캠페인 전환율에 미치는 영향

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

**기대 신호 (v1.2 데이터 · seed `20260701`)**  
결제 실패율이 높은 캠페인일수록 전환율이 낮은 **강한 음의 상관**이 나타나도록 데이터가 구성되어 있습니다. 귀속은 소수의 활성 캠페인(약 60개)에 집중되어 캠페인당 표본(약 30~40건)이 충분합니다.

| 지표 | 값(근사) |
|---|---|
| 귀속 캠페인 수 | 약 60개 |
| 캠페인당 귀속 주문 | 약 30~40건 |
| 결제 실패율 분포 | 약 0.13 ~ 0.71 |
| `payment_failure_rate` ↔ `conversion_rate` 상관 | 약 **-1.0** |

- 하위(전환율 낮음): 실패율 0.65~0.71 캠페인 → 전환율 0.29~0.35
- 상위(전환율 높음): 실패율 0.13~0.17 캠페인 → 전환율 0.83~0.87
- **해석**: 전환율 하위 캠페인은 마케팅 품질이 아니라 **결제 실패**가 병목임을 명확히 보여줍니다. 결제 재시도/대체 수단 개선이 우선 조치입니다.

##### Q2. 배송 지연이 반품률·불만 티켓에 미치는 영향

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

**기대 신호 (v1.2 데이터 · seed `20260701`)**  
배송 지연군(`is_delayed=1`)이 비지연군보다 반품률·불만율이 **뚜렷하게 높게** 구성되어 있습니다.

| `is_delayed` | 주문 수(근사) | 반품률 | 불만 티켓율 |
|---|---|---|---|
| 0 (정상) | 약 1,337 | 약 **0.19** | 약 **0.09** |
| 1 (지연) | 약 666 | 약 **0.44** | 약 **0.32** |

- 반품률 격차 약 **2.3배**, 불만율 격차 약 **3.4배**로 지연 → 고객경험 악화의 전이가 관찰됩니다.
- **해석**: 배송 지연이 반품과 불만을 동시에 끌어올리는 공통 원인임을 시사합니다. 지연 알림/보상·물류 SLA 개선이 반품·불만을 함께 낮출 수 있는 지렛대입니다.

##### Q3. 프로모션 유형별 마진(Proxy)·재구매율 비교

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

**기대 신호 (v1.2 데이터 · seed `20260701`)**  
프로모션 유형별로 **마진(Proxy)과 재구매율이 모두 차등**되도록 구성되어 있습니다. 마진이 낮은 유형이 반드시 재구매를 잘 끌어오는 것은 아니라는 점이 핵심입니다.

| `promotion_type` | 주문 수(근사) | `gross_margin_proxy` | `repurchase_rate` |
|---|---|---|---|
| Percent | 약 379 | 약 **0.75** | 약 **0.30** |
| BOGO | 약 441 | 약 **0.85** | 약 **0.83** |
| Amount | 약 376 | 약 **0.90** | 약 **0.72** |
| Bundle | 약 468 | 약 **0.95** | 약 **0.90** |

- `Percent`는 **마진도 최저이고 재구매율도 최저** → 우선 조정 후보입니다.
- `Bundle`/`BOGO`는 마진과 재구매율이 모두 양호 → 유지·확대 후보입니다.
- **해석**: 단순 할인율(Percent)보다 묶음형(Bundle/BOGO) 프로모션이 수익성과 고객 유지 측면에서 유리합니다.

##### Q4. 재고 부족(품절 노출) 경험이 취소율·문의량에 미치는 영향

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

**기대 신호 (v1.2 데이터 · seed `20260701`)**  
품절 상품이 포함된 주문(`has_stockout_product=1`)의 취소율·주문당 문의량이 비품절 주문보다 **더 높게** 구성되어 있습니다.

| `has_stockout_product` | 주문 수(근사) | 취소율 | 주문당 문의 건수 |
|---|---|---|---|
| 0 (비품절) | 약 1,647 | 약 **0.02** | 약 **0.50** |
| 1 (품절 포함) | 약 356 | 약 **0.17** | 약 **1.40** |

- 취소율 격차 약 **7배**, 주문당 문의 격차 약 **2.8배**입니다.
- 명명 상품(**AeroPhone X**, **SmartWatch Pro**, **UltraBook 15**)의 2026-05-16 재고부족 시나리오가 이 신호의 대표 사례입니다.
- **해석**: 재고 부족 노출이 취소와 CS 부하를 동시에 키우므로, 재고 가시성·품절 임박 알림·대체 상품 추천이 운영 비용 절감의 우선 과제입니다.

##### Q5. 채널·고객등급·반품사유 패턴별 재구매율 차이

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

**기대 신호 (v1.2 데이터 · seed `20260701`)**  
반품 이후 재구매율이 **고객등급에 따라 단조 증가**하도록 구성되어 있으며, 채널·반품사유까지 조합하면 **약 81개 세그먼트**로 편차를 관찰할 수 있습니다.

> 보강 설명: 데이터가 \"너무 많아서\"라기보다, **조합 수(채널×등급×사유)가 81개**여서 본문에서는 방향성만 요약했습니다. 아래에 실제 세그먼트 예시를 추가합니다.

| `customer_tier` | 재구매율(근사) |
|---|---|
| Bronze | 약 **0.49** |
| Silver | 약 **0.66** |
| Gold | 약 **0.77** |
| Platinum | 약 **0.85** |

- 세그먼트 상세 예시(실제 집계):

| channel_name | customer_tier | return_reason | returned_customers | repurchase_rate |
|---|---|---|---:|---:|
| OnlineMall | Bronze | ChangedMind | 8 | 0.2727 |
| Social | Bronze | Damaged | 12 | 0.3846 |
| MobileApp | Gold | NotAsDescribed | 18 | 0.9000 |
| Social | Platinum | SizeIssue | 11 | 1.0000 |

- 고객 단위 상세 예시(동일 세그먼트 내부에서도 주문 이력에 따라 차이 발생):

| 세그먼트 | customer_id 예시 | sample_return_order | order_cnt | is_repeat |
|---|---|---|---:|---:|
| 저재구매 (OnlineMall/Bronze/ChangedMind) | C00049 | O00078 | 1 | 0 |
| 저재구매 (OnlineMall/Bronze/ChangedMind) | C00129 | O00218 | 1 | 0 |
| 저재구매 (OnlineMall/Bronze/ChangedMind) | C00229 | O00380 | 2 | 1 |
| 고재구매 (Social/Platinum/SizeIssue) | C00008 | O00012 | 3 | 1 |
| 고재구매 (Social/Platinum/SizeIssue) | C00260 | O00429 | 2 | 1 |
| 고재구매 (Social/Platinum/SizeIssue) | C00356 | O00596 | 2 | 1 |

- 최저 재구매 조합은 대체로 **Bronze 등급 + 불량/사이즈/변심 사유**에서 나타나고, Platinum은 대부분 조합에서 높은 재구매율을 보입니다.
- `returned_customers`가 매우 작은 조합(표본 왜곡)과 고객등급 결측 그룹은 별도로 분리해 해석합니다.
- **해석**: 동일한 "반품"이라도 저등급·품질불만 세그먼트의 이탈 위험이 가장 크므로, 보상 정책과 상세 안내 개선의 **우선순위**를 이 조합에 두어야 합니다.

> **신호 재현·확인**: 위 Q1~Q5 수치는 v1.2 데이터셋(seed `20260701`) 기준 근사치이며 방향성이 핵심입니다. 데이터 재생성은 강사/운영자가 수행하며, 참가자는 [데이터 README](./data/README.md#7-q1q5-기대-신호-강사-확인용)의 분석 신호만 참고합니다. P1 사례의 위치·건수는 참가자 과제가 아닙니다.

#### 체크
- 질문 5개 확정
- 질문-테이블 매핑 완료

### 미션 2. 데이터 구조 읽기와 품질 개념 이해 (30분) - [상세 설명](./docs/Track1_Data_Structure_Detailed_Guide.md#profiling-checkpoints)

P1 데이터 검증은 설명만 듣고, 오류 위치·건수 탐지와 수정 쿼리는 실행하지 않습니다.

1. 14개 테이블의 행 수, 필수 컬럼, 로드 순서를 확인한다.
2. Q1~Q5마다 필요한 키와 날짜·상태·금액 컬럼을 데이터 사전에서 찾는다.
3. 강사의 설명을 듣고 품질 문제가 분석에 주는 영향을 한 줄씩 기록한다.

| 품질 개념 | 운영 영향 예 | 이 실습에서 하는 일 |
|---|---|---|
| 참조 무결성 | 주문과 결제가 연결되지 않아 경로가 끊김 | 개념과 영향만 이해 |
| PK 중복 | 배송 건수가 과대 집계될 수 있음 | 개념과 영향만 이해 |
| 결측 | 상태·날짜 기준 분류가 불가능할 수 있음 | 개념과 영향만 이해 |
| 이상값 | 매출·재고·마진 지표가 왜곡될 수 있음 | 개념과 영향만 이해 |
| 비표준 코드 | 같은 상태가 여러 표현으로 나뉨 | 미션 3에서 표준 매핑 설계 |

> 데이터셋에는 강사 설명과 회귀 재현을 위한 P1 사례가 남아 있습니다. 참가자는
> 사례를 찾거나 수정하지 않으며, 해당 건수는 제출물·평가·Track2 시작 조건이 아닙니다.

#### 체크
- 14개 테이블 접근과 필수 컬럼 확인
- Q1~Q5 질문-키-컬럼 연결표 작성
- 품질 개념이 KPI/Ontology에 미치는 영향 요약

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
아래 3개는 브릿지/이벤트 테이블을 거쳐 엔터티를 N:M으로 연결하는 **다중 홉 논리 경로**입니다. 물리 FK를 넘는 의미 질의(경로 탐색, 원인-결과 추적) 검증에 사용합니다.

| 관계(동사형) | 설명 | 카디널리티 | 구현 근거(다중 홉) |
|---|---|---|---|
| Payment relates_to Return (logical) | 결제 이력이 있는 반품 관계 추적 | Payment N : M Return | payments -> orders -> returns |
| Shipment relates_to Return (logical) | 배송 이후 반품 발생 관계 추적 | Shipment N : M Return | shipments -> orders -> returns |
| Order applies Promotion (logical path) | 주문별 적용 프로모션 경로 추적 | Order N : M Promotion | orders -> order_promotions -> promotions |

> 💡 다중 홉 복합 경로 예시:
> - `Campaign -> Order -> Payment -> Shipment -> Return`  
>   (캠페인 유입이 결제/배송을 거쳐 반품까지 어떻게 이어졌는지)
> - `Promotion -> Order -> Margin`  
>   (프로모션이 주문 금액/마진에 어떤 영향을 주는지)

#### Fabric Ontology로 구성하는 방법 (상세)
아래 순서대로 진행하면 미션 4 산출물(엔터티/관계/카디널리티)을 Fabric Ontology 화면에서 바로 구현할 수 있습니다.

**📌 빠른 방법: Python/REST API 자동화 (권장 - 5분)**

자동화 실행은 별도 Notebook/스크립트([`ontology_bundle/deploy_ontology_notebook.ipynb`](./ontology_bundle/deploy_ontology_notebook.ipynb), [`ontology_bundle/deploy_ontology_notebook.py`](./ontology_bundle/deploy_ontology_notebook.py))에서 수행합니다. 상세 단계는 [Appendix A. Fabric Ontology 자동 구성 스크립트](./docs/Appendix_A_Fabric_Ontology_Auto_Script.md)를 참고하세요. 자동화 범위는 엔터티 생성(단계 1)·속성 추가(단계 3)·물리 관계(단계 5)이며, 원천 테이블 매핑(단계 4)과 논리 관계(단계 6)는 UI에서 수동으로 진행합니다.  
⚠️ **Fabric Notebook 실행 주의사항**  
- 셀 실행 전에 우측 상단에서 Notebook 세션(**Start session**)을 먼저 시작하세요.  
- SQL 셀은 실행 전에 셀 언어를 반드시 **Spark SQL**로 전환하세요.

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

### 미션 5. 매핑 및 의미 경로 확인 (30분) - [매핑](./docs/Track1_Data_Structure_Detailed_Guide.md#mapping-3step) / [의미 경로 확인](./docs/Track1_Data_Structure_Detailed_Guide.md#semantic-validation-structure)
1. 원천 컬럼 -> 표준 컬럼 -> Ontology 속성 매핑을 작성한다.
2. 시나리오 A와 B의 엔터티-관계 경로가 `getDefinition`에 존재하는지 확인한다.
3. 제공된 SQL 기준값을 실행해 의미 경로 비교용 baseline을 저장한다.
4. GraphModel 사용 가능 환경에서만 `executeQuery` 결과와 비교한다.

| 시나리오 | 질문 | 확인 경로 |
|---|---|---|
| A | 캠페인 유입 주문 중 결제 실패 주문은? | `Campaign -> CampaignAttribution -> Order -> Payment` |
| B | 프로모션 유형별 재구매율은? | `Promotion -> OrderPromotion -> Order -> Customer` |

> 참조 무결성·PK 중복·결측·이상값·금액 불일치 탐지 쿼리는 이 미션에서 실행하지
> 않습니다. 운영 검증 규칙은 [개념 참고](./docs/Track1_Data_Structure_Detailed_Guide.md#validation-structure)로만 제공합니다.

#### 체크
- 매핑표 100% 작성
- 의미 경로 2개와 SQL 기준값 저장
- `getDefinition` 경로 확인 기록
- (선택) GraphModel 비교 로그 또는 미실행 사유

## 제출물
1. 질문 정의서
2. 데이터 구조·품질 개념 요약
3. 표준 스키마 규칙표
4. Ontology 모델 v0.1
5. 매핑표 + 의미 경로 확인 결과
6. Track2 인계 패키지(아래 템플릿)

## Track2 시작 인계 패키지 (필수, 10분)

Track1 산출물을 Track2에서 바로 사용할 수 있도록, 아래 항목을 **한 번에** 정리해 전달합니다.

| 인계 항목 | 필수 내용 |
|---|---|
| Ontology 식별 정보 | `WORKSPACE_ID`, `ONTOLOGY_ID`, Ontology 이름 |
| 모델 요약 | 엔터티/관계 개수, 핵심 경로 3개(예: Campaign->Order->Payment) |
| 매핑 근거 | `Entity -> table/column` 핵심 매핑 5개 이상 |
| 구현 제한 | 실제 Ontology/GraphModel/매핑 관련 제한 또는 `none-known` |
| WorkIQ 검색 키 | 캠페인명/상품명/고객등급 등 문서 검색 키워드 |
| 의미 경로 로그 | 매핑 검토 + 의미 경로 SQL baseline + (선택) GraphModel 비교 |

복붙 템플릿:
```text
[TRACK2_WORKIQ_HANDOFF_PACKAGE]
team=<팀명>
handoffAtKst=<YYYY-MM-DD HH:MM>
workspaceId=<GUID>
ontologyId=<GUID>
ontologyName=<이름>
entityCount=<숫자>
relationshipCount=<숫자>
corePaths=<Path1;Path2;Path3>
mappingHighlights=<Entity:table.column,...>
openIssues=<구현 제한|영향|우회안; ... 또는 none-known>
workiqKeys=<캠페인명,...; 상품명,...; 고객등급,...>
evidenceLinks=<노트북/캡처 경로>
[/TRACK2_WORKIQ_HANDOFF_PACKAGE]
```

## 참가자 자가점검표
| 항목 | 완료(Y/N) |
|---|---|
| 질문-테이블 매핑 완료 |  |
| 데이터 구조와 P1 품질 개념의 영향 설명 |  |
| 비표준 상태 코드 3종 표준화 |  |
| 표준 스키마 규칙 확정 |  |
| DoD 범위(엔터티 10-16/관계 15-25) 충족; 권장 14/20 확인 |  |
| 매핑표 100% 작성 |  |
| 의미 경로 2개와 SQL baseline 확인 |  |
| Track2 인계 패키지 작성/공유 완료 |  |

---


## Appendix (분리 문서)

> Appendix A와 Appendix B는 동일 목표(테스트 데이터가 Ontology에서 해석/조회되도록 구조·매핑 구성)를 다른 방식으로 수행합니다. 팀 상황에 맞춰 **A 또는 B 중 하나를 선택**해 진행하세요.

- [Appendix A. Fabric Ontology 자동 구성 스크립트](./docs/Appendix_A_Fabric_Ontology_Auto_Script.md): 미션 4에서 엔터티/속성/물리 관계를 Notebook 기반으로 자동 구성하는 실행 가이드입니다.
- [Appendix B. 선언적 일괄 정의 방식 (심화)](./docs/Appendix_B_Declarative_Bundle_Deployment.md): 별도 Notebook([`generate_definition.ipynb`](./ontology_bundle/generate_definition.ipynb), [`deploy_ontology_notebook.ipynb`](./ontology_bundle/deploy_ontology_notebook.ipynb))으로 제공되며, Ontology 번들을 사용해 정의를 일괄 배포하는 심화 가이드입니다.
- [Appendix C. GraphModel 심화 가이드](./docs/Appendix_C_GraphModel_Deep_Dive.md): GraphModel 중심의 다중 홉 질의/검증 패턴을 정리한 심화 가이드입니다.
