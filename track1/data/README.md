# Track1 실습 데이터셋 (v1.2)

이 폴더는 Track 1(FabricIQ 시맨틱 레이어) 실습에 사용하는 샘플 데이터셋입니다.
Q1~Q5 분석 신호가 실습의 중심이며, 데이터 품질 개념을 설명하기 위한 P1 사례도
포함되어 있습니다. P1 사례의 탐지·수정은 **참가자 실습과 완료 기준에서 제외**하며
강사 설명과 비파괴 회귀 확인에만 사용합니다.

> **v1.2 변경점**: WORKBOOK 미션1의 기준 질문 **Q1~Q5가 의미 있는 분석 신호**를 갖도록 테이블 간 키 매핑과 값 분포를 재구성했습니다(예: 배송 지연↔반품/불만, 품절↔취소/문의, 캠페인 결제실패↔전환율, 프로모션 유형↔마진/재구매율, 고객등급↔재구매율). P1 품질 사례와 명명 상품 시나리오는 재현성을 위해 보존되지만, 참가자가 P1 오류를 찾거나 고치는 실습은 수행하지 않습니다. 데이터는 [`generate_track1_samples.py`](generate_track1_samples.py)로 재현 가능합니다(seed 고정).

> ⚠️ 강사/운영자는 이 README와 함께 [Track1_Instructor_Data_Answer_Key.md](../docs/Track1_Instructor_Data_Answer_Key.md)를 반드시 참고하세요. 의도된 노이즈의 정확한 위치가 정리되어 있습니다.

## 실습 노트북(참가자용)

- 전체 미션(1~5) 실행형 노트북: [../Track1_EndToEnd_Learner_Notebook.ipynb](../Track1_EndToEnd_Learner_Notebook.ipynb)
- 실행 결과 산출물은 `generated/workbench/` 아래에 저장됩니다.
- Fabric Notebook에서 실행할 때는 우측 상단에서 Notebook 세션(**Start session**)을 먼저 시작한 뒤 셀을 실행합니다.

## 1) 파일 목록 · 행 수 · 주요 컬럼

- 폴더 구성: **CSV 14개 + 보조 파일 1개(`load_order.txt`) = 총 15개 파일** (생성 스크립트 `generate_track1_samples.py` 포함)

| 파일 | 행 수 | 주요 컬럼 |
|---|---|---|
| `customers.csv` | 1,200 | customer_id, customer_segment, customer_tier, join_date |
| `products.csv` | 1,200 | product_id, product_name, category, unit_price, currency |
| `channels.csv` | 4 | channel_id, channel_name |
| `campaigns.csv` | 1,000 | campaign_id, campaign_name, campaign_type, channel_id, start_date, end_date |
| `promotions.csv` | 1,000 | promotion_id, promotion_name, promotion_type, discount_amount, start_date, end_date |
| `orders.csv` | 2,003 | order_id, customer_id, channel_id, order_date, order_status, gross_amount, discount_applied, net_amount, order_value, currency |
| `order_items.csv` | 4,024 | order_id, product_id, quantity, sales_amount |
| `payments.csv` | 2,004 | payment_id, order_id, payment_status, approved_amount, approved_at |
| `shipments.csv` | 2,004 | shipment_id, order_id, shipment_status, delivered_at |
| `returns.csv` | 1,000 | return_id, order_id, product_id, customer_id, return_reason, return_date |
| `inventory_snapshots.csv` | 2,096 | snapshot_id, product_id, snapshot_date, on_hand_qty, reserved_qty |
| `order_promotions.csv` | 1,910 | order_id, promotion_id |
| `campaign_attribution.csv` | 2,250 | campaign_id, order_id, customer_id, attribution_model, attributed_revenue |
| `support_tickets.csv` | 1,314 | ticket_id, customer_id, order_id, ticket_type, ticket_reason, created_at |

- 통화: 모든 금액은 **KRW** 가정 (`currency` 컬럼 명시).
- 채널: `channels.csv`는 실제 의미 있는 **4개 채널**로만 구성됩니다 — `CH0001`(OnlineMall), `CH0002`(MobileApp), `CH0003`(Social), `CH0004`(OfflineStore). `orders.channel_id`와 `campaigns.channel_id`는 모두 이 4개 채널 중 하나를 참조합니다(고아 참조 없음).
- Q1 호환 캠페인: `CA00001`~`CA00004`는 각각 `SummerPush`, `BackToSchool`,
  `VIPRetention`, `FlashWeek`로 고정해 Track4 Q1과 Playground의 캠페인별
  결제 전환율 비교가 빈 결과가 되지 않도록 합니다.
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

## 4) 데이터 품질 개념 설명 (참가자용, 실행 과제 아님)

운영 데이터에서는 아래 문제가 Ontology 관계와 KPI를 왜곡할 수 있습니다. 강사가
영향을 설명하지만 참가자는 이 데이터셋에서 위치·건수를 조회하거나 수정하지 않습니다.
정확한 사례 위치는 강사용 노트에만 있습니다.

- 참조 무결성 오류 (존재하지 않는 FK)
- 기본키(PK) 중복
- 결측값(NULL)
- 이상값(음수/0 등)
- 비표준 상태 코드셋 (표준화 필요)
- 값 정합성 불일치 (`gross_amount` vs `SUM(order_items.sales_amount)`)

## 5) 운영 검증 규칙 참고 (개념 설명용)

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
| Q3. 프로모션 유형별 할인 전략이 매출총이익·재구매율에 미치는 영향 | orders, order_promotions, promotions, order_items, customers |
| Q4. 재고 부족/품절 경험이 주문 취소율·CS 문의량에 미치는 영향 | inventory_snapshots, products, order_items, orders, support_tickets |
| Q5. 채널·고객등급별 반품 사유 패턴과 재구매율 차이 | returns, customers, channels, orders |

Q4용 재고부족–CS 연결 시나리오는 명명 상품(**UltraBook 15**, **AeroPhone X**, **SmartWatch Pro**)에 대해 2026-05-16 전후로 구성되어 있습니다. 상세는 강사용 노트 참고.

## 7) Q1~Q5 기대 신호 (강사 확인용)

데이터에는 각 기준 질문이 **의미 있는 결론**을 도출하도록 아래 신호가 의도적으로 주입되어 있습니다(값은 seed `20260701` 기준 근사치이며, 방향성이 핵심).

| 질문 | 기대 신호 (방향) | 근사 수치 |
|---|---|---|
| Q1 | 캠페인 결제 실패율↑ ⇒ 전환율↓ (강한 음의 상관) | 활성 캠페인 60개, 실패율 0.13~0.71, 실패율↔전환율 상관 ≈ -1.0 |
| Q2 | 배송 지연군의 반품률·불만율이 비지연군보다 뚜렷이 높음 | 반품률 지연 ≈0.44 vs 비지연 ≈0.19 / 불만율 ≈0.32 vs ≈0.09 |
| Q3 | 프로모션 유형별 마진·재구매율 차등 | 마진 Percent 0.75 < BOGO 0.85 < Amount 0.90 < Bundle 0.95 / 재구매 Bundle 0.90 > BOGO 0.83 > Amount 0.72 > Percent 0.30 |
| Q4 | 품절 상품 포함 주문의 취소율·주문당 문의량이 더 높음 | 취소율 품절 ≈0.17 vs ≈0.02 / 주문당 문의 ≈1.4 vs ≈0.5 |
| Q5 | 고객등급(Platinum>Gold>Silver>Bronze)·채널·사유별 재구매율 편차, 81개 조합 커버 | Bronze·불량사유 조합이 최저 재구매율 |

Q5 상세 예시(세그먼트별 `returned_customers`/`repurchase_rate`, 고객 단위 샘플)는 [WORKBOOK.md의 Q5 기대 신호 섹션](../WORKBOOK.md#q5-채널고객등급반품사유-패턴별-재구매율-차이)을 참고하세요.

> 데이터 재생성이 필요하면 강사/운영자가 `python generate_track1_samples.py`를 실행합니다. 스크립트는 seed가 고정되어 있어 위 분석 신호와 강사용 P1 사례를 동일하게 재현합니다. 참가자에게 P1 사례의 탐지 결과를 요구하지 않습니다.
