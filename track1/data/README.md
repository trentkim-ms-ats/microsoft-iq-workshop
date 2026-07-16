# Track1 실습 데이터셋 (v1.1)

이 폴더는 Track 1(FabricIQ 시맨틱 레이어) 실습에 사용하는 샘플 데이터셋입니다.
데이터는 **의도적으로 "지저분하게"** 설계되어 있습니다. 참가자가 프로파일링/표준화/검증 미션에서 실제로 발견하고 고칠 이슈가 포함되어 있습니다.

> ⚠️ 강사/운영자는 이 README와 함께 [Track1_Instructor_Data_Answer_Key.md](../docs/Track1_Instructor_Data_Answer_Key.md)를 반드시 참고하세요. 의도된 노이즈의 정확한 위치가 정리되어 있습니다.

## 실습 노트북(참가자용)

- 전체 미션(1~5) 실행형 노트북: [../Track1_EndToEnd_Learner_Notebook.ipynb](../Track1_EndToEnd_Learner_Notebook.ipynb)
- 실행 결과 산출물은 `generated/workbench/` 아래에 저장됩니다.

## 1) 파일 목록 · 행 수 · 주요 컬럼

- 폴더 구성: **CSV 14개 + 보조 파일 1개(`load_order.txt`) = 총 15개 파일**

| 파일 | 행 수 | 주요 컬럼 |
|---|---|---|
| `customers.csv` | 1,200 | customer_id, customer_segment, customer_tier, join_date |
| `products.csv` | 1,200 | product_id, product_name, category, unit_price, currency |
| `channels.csv` | 4 | channel_id, channel_name |
| `campaigns.csv` | 1,000 | campaign_id, campaign_name, campaign_type, channel_id, start_date, end_date |
| `promotions.csv` | 1,000 | promotion_id, promotion_name, promotion_type, discount_amount, start_date, end_date |
| `orders.csv` | 2,003 | order_id, customer_id, channel_id, order_date, order_status, gross_amount, discount_applied, net_amount, order_value, currency |
| `order_items.csv` | 4,004 | order_id, product_id, quantity, sales_amount |
| `payments.csv` | 2,004 | payment_id, order_id, payment_status, approved_amount, approved_at |
| `shipments.csv` | 2,004 | shipment_id, order_id, shipment_status, delivered_at |
| `returns.csv` | 1,000 | return_id, order_id, product_id, customer_id, return_reason, return_date |
| `inventory_snapshots.csv` | 2,003 | snapshot_id, product_id, snapshot_date, on_hand_qty, reserved_qty |
| `order_promotions.csv` | 1,885 | order_id, promotion_id |
| `campaign_attribution.csv` | 2,250 | campaign_id, order_id, customer_id, attribution_model, attributed_revenue |
| `support_tickets.csv` | 1,204 | ticket_id, customer_id, order_id, ticket_type, ticket_reason, created_at |

- 통화: 모든 금액은 **KRW** 가정 (`currency` 컬럼 명시).
- 채널: `channels.csv`는 실제 의미 있는 **4개 채널**로만 구성됩니다 — `CH0001`(OnlineMall), `CH0002`(MobileApp), `CH0003`(Social), `CH0004`(OfflineStore). `orders.channel_id`와 `campaigns.channel_id`는 모두 이 4개 채널 중 하나를 참조합니다(고아 참조 없음).
- 타임스탬프: `approved_at`, `delivered_at`, `created_at`는 `YYYY-MM-DDThh:mm:ss+09:00`(KST).
- 날짜: `order_date`, `return_date`, `*_date`는 `YYYY-MM-DD`.
  - 날짜(Date)와 타임스탬프(DateTime) 표기가 혼재하는 것은 **미션 3 표준화 대상**입니다.

## 2) 로드 순서

`load_order.txt` 참고. 참조 무결성상 마스터 → 트랜잭션 → 브릿지 순서로 로드하세요.

## 3) 관계(참조) 구조 요약

```
customers ─1:N─ orders ─N:1─ channels
                  │
                  ├─1:N─ order_items ─N:1─ products
                  ├─1:N─ payments
                  ├─1:N─ shipments
                  ├─N:M─ promotions        (order_promotions 브릿지)
                  └─N:M─ campaigns          (campaign_attribution 브릿지)
products ─1:N─ inventory_snapshots
customers ─1:N─ returns ─N:1─ orders/products
customers ─1:N─ support_tickets ─N:1─ orders
```

## 4) 의도된 품질 이슈 (요약 · 참가자용)

이 데이터에는 최소 다음 유형의 이슈가 **의도적으로** 포함되어 있습니다. 정확한 위치는 강사용 노트에 있습니다.

- 참조 무결성 오류 (존재하지 않는 FK)
- 기본키(PK) 중복
- 결측값(NULL)
- 이상값(음수/0 등)
- 비표준 상태 코드셋 (표준화 필요)
- 값 정합성 불일치 (`gross_amount` vs `SUM(order_items.sales_amount)`)

## 5) 검증 규칙 (미션 5 기준)

| # | 규칙 | 설명 |
|---|---|---|
| R1 | 참조 무결성 | 모든 FK가 부모 테이블에 존재해야 함 |
| R2 | PK 유일성 | 각 테이블 PK 중복 없음 |
| R3 | NOT NULL | 필수 컬럼 결측 없음 |
| R4 | 값 유효 범위 | `quantity>0`, `unit_price>=0`, `discount_amount>=0`, `on_hand_qty>=0` |
| R5 | 코드셋 유효성 | 상태값이 표준 코드셋에 속함 (표준화 후) |
| R6 | 금액 정합성 | `gross_amount == SUM(order_items.sales_amount)` (주문별) |
| R7 | 순액 정합성 | `net_amount == gross_amount - discount_applied` |
| R8 | 귀속 합계 | MultiTouch 주문: `SUM(attributed_revenue) == net_amount` |

## 6) 시나리오 질문 ↔ 필요 테이블 매핑

| 질문 | 핵심 테이블 |
|---|---|
| Q1. 결제 실패가 캠페인 전환율에 미치는 영향 | orders, payments, campaign_attribution, campaigns |
| Q2. 배송 지연이 반품률·고객 만족도에 미치는 영향 | orders, shipments, returns, support_tickets |
| Q3. 재고 부족/품절 경험이 주문 취소율·CS 문의량에 미치는 영향 | inventory_snapshots, orders, shipments, support_tickets, products |
| Q4. 프로모션 유형별 할인 전략이 매출총이익·재구매율에 미치는 영향 | orders, order_promotions, promotions, order_items |
| Q5. 채널·고객등급별 반품 사유 패턴과 재구매율 차이 | returns, customers, channels, orders |

Q3용 재고부족–CS 연결 시나리오는 명명 상품(**UltraBook 15**, **AeroPhone X**, **SmartWatch Pro**)에 대해 2026-05-16 전후로 구성되어 있습니다. 상세는 강사용 노트 참고.
