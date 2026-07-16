# Track1 강사용 데이터 정답노트 (Answer Key) — 데이터셋 v1.1

> 본 문서는 **강사/운영 전용**입니다. 참가자에게 배포하지 마세요.
> [track1/data/](../data/) 데이터에 **의도적으로 삽입한 노이즈**의 정확한 위치와, 각 미션에서 예상되는 발견 결과를 정리합니다.

## 0. 데이터셋 개요
- 버전: v1.1 (의도된 노이즈 포함)
- 전 테이블 1,000행 이상 (단, `channels.csv`는 실제 의미 있는 채널 4개로만 구성 — CH0001~CH0004)
- 노이즈는 모두 **고정 ID**로 삽입되어 재현 가능

---

## 1. 의도된 노이즈 매트릭스 (핵심)

### 🔴 참조 무결성 오류 (R1) — 2건
| 파일 | 행 | 문제 | 설명 |
|---|---|---|---|
| `payments.csv` | `PAY90001` | `order_id = O99999` | orders에 없는 주문 참조 |
| `support_tickets.csv` | `T90001` | `customer_id = C99999` | customers에 없는 고객 참조 |

### 🔴 기본키(PK) 중복 (R2) — 1건
| 파일 | 값 | 설명 |
|---|---|---|
| `shipments.csv` | `SH00001` 2회 | 동일 shipment_id 중복 행 |

### 🔴 결측값 NULL (R3) — 5건
| 파일 | 행 | NULL 컬럼 |
|---|---|---|
| `customers.csv` | `C00007` | `customer_segment` |
| `orders.csv` | `O00013` | `order_date` |
| `payments.csv` | `PAY00019` | `payment_status` |
| `returns.csv` | `R00011` | `return_reason` |
| `support_tickets.csv` | `T00005` | `ticket_reason` |

### 🔴 이상값 (R4) — 4건
| 파일 | 행 | 값 | 문제 |
|---|---|---|---|
| `products.csv` | `P00050` | `unit_price = 0.00` | 0 가격 |
| `promotions.csv` | `PR00050` | `discount_amount = -5.00` | 음수 할인 |
| `inventory_snapshots.csv` | `S00050` | `on_hand_qty = -3` | 음수 재고 |
| `order_items.csv` | `O00033` 소속 아이템 | `quantity = -1` | 음수 수량 |

> 참고: `O00033`은 음수 수량이 반영돼도 `gross_amount == SUM(items)`는 유지됩니다(가격정합 규칙 위반이 아닌 **이상값**으로만 발견되도록 설계).

### 🟢 금액 정합성 불일치 (R6) — 2건
| 파일 | 행 | 문제 |
|---|---|---|
| `orders.csv` | `O00007` | `gross_amount`가 SUM(items)보다 +10 |
| `orders.csv` | `O00600` | `gross_amount`가 SUM(items)보다 -25 |

---

## 2. 비표준 코드셋 (의도된 노이즈, 미션 3 표준화 대상)

아래 상태값은 **원천이 비표준**이라는 실습 스토리를 위한 것입니다. **자동 검증 스크립트가 fail 처리하지 않도록** 하고, 참가자 질문에 아래 표준 매핑으로 답하세요.

| 파일.컬럼 | 현재(원천) 값 | 표준 코드셋(권장) |
|---|---|---|
| `orders.order_status` | `Completed`, `Cancelled` | `NEW, PAID, SHIPPED, CANCELLED, RETURNED` |
| `payments.payment_status` | `Success`, `Failed`, `RetrySuccess` | `INITIATED, AUTHORIZED, FAILED, REFUNDED` |
| `shipments.shipment_status` | `Delivered`, `Delayed`, `InTransit` (CamelCase) | `READY, IN_TRANSIT, DELIVERED, DELAYED` (UPPER_SNAKE) |
| `campaign_attribution.attribution_model` | `LastTouch`, `MultiTouch` | 유효값 리스트: `LastTouch`, `MultiTouch` (표준으로 확정) |

### `RetrySuccess` 토론 소재 (미션 3)
- `RetrySuccess`는 **상태 + 재시도 여부** 두 개념이 섞임.
- 정석: `payment_status = AUTHORIZED` + 별도 `attempt_count`/`is_retry` 컬럼 분리.
- 참가자에게 "하나의 코드에 두 의미가 섞였을 때 어떻게 표준화할지" 토론시키세요.

---

## 3. 미션별 예상 발견(Answer Key)

### 미션 2 — 프로파일링 (이슈 목록 최소 5개)
예상 발견 이슈(최소):
1. NULL 5건 (segment/date/payment_status/return_reason/ticket_reason)
2. 이상값 4건 (price 0, discount 음수, 재고 음수, 수량 음수)
3. 비표준 상태 코드셋 3종 (orders/payments/shipments)
4. 금액 정합성 불일치 2건 (O00007, O00600)
5. 날짜/타임스탬프 포맷 혼재
→ **10개 이상 발견 가능**하므로 DoD(최소 5개) 충분히 달성.

### 미션 3 — 표준 스키마/코드셋
- 위 코드셋 매핑 적용
- `RetrySuccess` → `AUTHORIZED` + `is_retry=true` 분리 토론
- 날짜/타임스탬프 포맷 표준화(예: 모두 ISO8601 + KST)

### 미션 5 — 구조 무결성 검증
- R1 참조 무결성: **2건 실패** (PAY90001, T90001)
- R2 PK 중복: **1건 실패** (SH00001)
- R6 금액 정합성: **2건 실패** (O00007, O00600)
- R7 순액 정합성: 위반 없음(모두 통과)
- R8 귀속 합계: MultiTouch 주문 위반 없음(모두 통과)

### 미션 5 선택 심화 — 의미 질의 검증(온톨로지 경로)
- 질문 예시: "캠페인 유입 주문 중 결제 실패 주문은?"
- 기대 경로: `Campaign -> CampaignAttribution -> Order -> Payment`
- 정답 판정 기준:
  1. SQL 기준값(캠페인ID/주문ID) 결과를 먼저 산출했는가
  2. `getDefinition`에서 경로 엔터티/관계 존재를 확인했는가
  3. (GraphModel 가능 시) `executeQuery` 결과와 SQL 결과를 비교했는가
  4. 불일치 시 원인(`매핑 누락`, `관계 방향 오류`, `코드셋 표준화 미반영`)을 기록했는가

#### 채점 예시 (PASS / FAIL)

**PASS 예시**
- `baselineSqlRows=12`, `graphQueryStatus=200`, `graphRows=12`
- `comparison=PASS`, `failReason=-`
- 비고에 "샘플 10건 키(campaign_id, order_id) 일치"가 있으면 가산점

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

**FAIL 예시**
- `baselineSqlRows=12`, `graphRows=4`처럼 차이 발생
- `comparison=FAIL` + `failReason`이 구체적이어야 인정
- 예: 관계 방향 오류(`Order_has_Payment`) 기록 + `refreshGraph` 재실행 계획 명시

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

---

## 4. 검증 쿼리 (강사용 확인)

```sql
-- R1 참조 무결성 (payments)
SELECT p.payment_id FROM payments p
LEFT JOIN orders o ON p.order_id = o.order_id
WHERE o.order_id IS NULL;              -- PAY90001

-- R1 참조 무결성 (support_tickets)
SELECT t.ticket_id FROM support_tickets t
LEFT JOIN customers c ON t.customer_id = c.customer_id
WHERE c.customer_id IS NULL;           -- T90001

-- R2 PK 중복 (shipments)
SELECT shipment_id, COUNT(*) c FROM shipments
GROUP BY shipment_id HAVING COUNT(*) > 1;   -- SH00001

-- R3 NULL 점검 (예: orders)
SELECT order_id FROM orders WHERE order_date IS NULL OR order_date = '';  -- O00013

-- R4 이상값
SELECT product_id FROM products WHERE unit_price <= 0;            -- P00050
SELECT promotion_id FROM promotions WHERE discount_amount < 0;    -- PR00050
SELECT snapshot_id FROM inventory_snapshots WHERE on_hand_qty < 0;-- S00050
SELECT order_id FROM order_items WHERE quantity <= 0;             -- O00033

-- R6 금액 정합성
SELECT o.order_id, o.gross_amount, SUM(i.sales_amount) s
FROM orders o JOIN order_items i ON o.order_id = i.order_id
GROUP BY o.order_id, o.gross_amount
HAVING ABS(o.gross_amount - SUM(i.sales_amount)) > 0.01;  -- O00007, O00600

-- R8 귀속 합계 (MultiTouch)
SELECT a.order_id, SUM(a.attributed_revenue) r, o.net_amount
FROM campaign_attribution a JOIN orders o ON a.order_id = o.order_id
WHERE a.attribution_model = 'MultiTouch'
GROUP BY a.order_id, o.net_amount
HAVING ABS(SUM(a.attributed_revenue) - o.net_amount) > 0.02;  -- (없음)
```

---

## 5. Q3 시나리오 (재고 부족 ↔ CS/배송) 정답 경로

명명 상품 기준으로 스토리가 구성되어 있습니다.

| 상품 | 이름 | 2026-05-16 재고(on_hand) | 관련 주문 | 배송 | CS 티켓 |
|---|---|---|---|---|---|
| `P00005` | AeroPhone X | 4 (예약 30) | `O09001` | `SH09001` Delayed | `T09001` NoTrackingUpdate |
| `P00006` | SmartWatch Pro | 3 (예약 25) | `O09002` | `SH09002` Delayed | `T09002` LateDelivery |
| `P00001` | UltraBook 15 | 6 (예약 40) | `O09003` | `SH09003` InTransit | `T09003` NoTrackingUpdate |

- 재고 스냅샷: `S09001`(P00005), `S09002`(P00006), `S09003`(P00001)
- 분석 스토리: **재고 부족(on_hand < reserved) → 배송 지연 → CS 티켓 증가**의 선행 신호 연결.
- WorkIQ(Track 2)에서는 상품ID가 아니라 **상품명("AeroPhone X" 등)**으로 문서 검색됨 → 시드 콘텐츠 명세 참고: [Track1_WorkIQ_Seed_Content_Specification.md](Track1_WorkIQ_Seed_Content_Specification.md)
