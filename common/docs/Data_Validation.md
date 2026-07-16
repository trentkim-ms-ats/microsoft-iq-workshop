# 워크숍 샘플 데이터 리뷰

전체적으로 **데이터 모델 관계와 카디널리티는 매우 잘 설계**되어 있고 (14개 테이블 모두 존재, 다중 홉 분석 가능한 참조 구조), 로드 순서까지 정리되어 있어 좋습니다. 다만 **워크숍의 실습 미션이 성립하려면 데이터가 지금보다 "지저분해야" 합니다.** 지금 데이터는 너무 깨끗해서 미션에서 발견할 이슈가 부족합니다.

---

## 🔴 P1: 실습 미션이 성립하지 않는 결정적 이슈

### 1. 참조 무결성 오류 케이스 **0건**
- 미션 5의 "참조 무결성 검증" 실습에서 발견할 오류가 없음
- 모든 `order_id`, `customer_id`, `product_id`, `campaign_id`가 완벽하게 존재함
- **필요**: 예를 들어 `payments.csv`에 `order_id=O999`(존재하지 않음) 1건, `support_tickets.csv`에 `customer_id=C999` 1건 삽입

### 2. PK 중복 케이스 **0건**
- 미션 5의 "중복 키 존재 여부" 검증에서 발견할 것이 없음
- **필요**: `shipments.csv`에 같은 `shipment_id`를 갖는 행 1건 추가, 또는 `customers.csv`에 `C002` 중복

### 3. 결측값(NULL) 케이스 사실상 **0건**
- 유일한 결측은 `shipments.SH005.delivered_at`인데, 이는 `InTransit`이라 정당한 NULL
- 미션 2 DoD "이슈 목록 최소 5개"를 달성하기 어려움
- **필요**: `customer_segment` NULL 1건, `order_date` NULL 1건, `payment_status` NULL 1건, `return_reason` NULL 1건 등

### 4. 이상값(음수/극단값) **0건**
- 미션 2의 "이상값 확인" 실습에서 발견할 것이 없음
- **필요**: `order_items.quantity=-1`, `products.unit_price=0`, `promotions.discount_amount=-5`, `inventory_snapshots.on_hand_qty=-3` 중 2~3건

### 5. 표준 코드셋 위반 케이스는 있지만 **문서화 안 됨**
현재 상태 코드가 문서의 표준셋과 다름 (이건 오히려 좋은 실습 재료):

| 파일 | 실제 값 | 문서상 표준 코드 |
|---|---|---|
| `orders.order_status` | `Completed`, `Cancelled` | `NEW, PAID, SHIPPED, CANCELLED, RETURNED` |
| `payments.payment_status` | `Success, Failed, RetrySuccess` | `INITIATED, AUTHORIZED, FAILED, REFUNDED` |
| `shipments.shipment_status` | `Delivered, Delayed, InTransit` (CamelCase) | `READY, IN_TRANSIT, DELIVERED, DELAYED` (UPPER_SNAKE) |

이건 "원천은 비표준, 미션 3에서 표준화"라는 실습 스토리에 딱 맞지만, **강사용 노트에 "의도된 노이즈"임을 명시**해야 참가자 질문에 답할 수 있고, 자동 검증 스크립트가 fail 처리하지 않게 할 수 있습니다.

---

## 🟡 P2: 시나리오 완결성 (비즈니스 질문 답변 불가)

### 6. Q3 답변 불가능
"재고 부족 시점과 채널별 고가치 고객 이탈의 선행 신호"를 물어보는데:
- `P005`(2026-05-15 재고 available=9), `P006`(available=8), `P001`(58) 재고 부족 상황이 만들어져 있음
- 그런데 이 상품들에 대한 **CS 티켓·주문 이상 이력이 하나도 없음**
- **필요**: 5월 15일 이후 P005/P006 관련 재고부족·배송지연·CS 티켓 케이스 2~3건 추가

### 7. 상품·프로모션·캠페인에 사람이 부를 수 있는 이름이 없음
- `products.csv`: `product_id`, `category`, `unit_price`만 있고 `product_name` 없음
- `promotions.csv`: `promotion_code`/`promotion_name` 없음
- Track 2 WorkIQ가 M365 문서에서 검색할 때 "P001"이라고 검색하지 않음. 실제로는 "제품명"으로 검색
- **필요**: `products.product_name`, `promotions.promotion_name` 컬럼 추가 (예: P001 → "UltraBook 15")

### 8. `campaigns.csv` 정보가 너무 빈약
- `campaign_id`, `campaign_name` 2개 컬럼뿐
- Q1 "캠페인 유입 시점 분석"을 하려면 `start_date`, `end_date`, `channel_id` (or channel_mix), `campaign_type` 필요
- 예: SummerPush = 2026-04-15 ~ 2026-06-15, Social 중심 등

### 9. Q2 답변 커버리지 부족
"프로모션 마진 훼손과 CS 티켓 증가 동시 발생"을 분석하려면:
- 현재 프로모션은 4개인데, 실제 order_value에 할인이 반영됐는지 확인 불가
- 예: O001 = P001(1290) + P008(89) = 1379, PR001(10%) 적용 → 원래는 1241.10이어야 하는데 그대로 1379
- **필요**: `orders.csv`에 `gross_amount`, `discount_applied`, `net_amount` 분리 또는 프로모션 반영 로직 명시

---

## 🟢 P3: 정합성·포맷 개선

### 10. 값 정합성 이슈가 **하나도 없음**
- 데이터구조 문서에 추가한 규칙 `SUM(order_items.sales_amount) ≈ orders.order_value`를 검증하려는데 모든 주문이 정확히 일치
- **필요**: 1~2건 의도적 mismatch (예: O005는 items 합 240인데 order_value=250처럼)

### 11. 날짜 포맷 불일치
- `orders.order_date`, `returns.return_date`, `promotions.start_date`: `YYYY-MM-DD`
- `payments.approved_at`, `shipments.delivered_at`, `support_tickets.created_at`: `YYYY-MM-DDTHH:MM:SS` (타임존 없음)
- **개선**: 
  - 강사용 노트에 "표준화 미션의 대상"임을 명시
  - 또는 최소 타임존 표기 추가 (`+09:00` 또는 `Z`)

### 12. 통화·단위 없음
- 모든 금액에 currency 컬럼 없음 (KRW/USD 불명)
- **필요**: `orders.currency`, `products.currency` 추가하거나 README에 "모든 금액 KRW 가정" 명시

### 13. `attribution_model` 값 검증 규칙 필요
- `LastTouch`, `MultiTouch` 두 값만 사용됨
- 표준 코드셋에 포함되지 않음. 이 필드도 유효값 리스트 정의 필요

### 14. `campaign_attribution` 합계 검증 규칙 명시 필요
- O006 (MultiTouch): 282 + 188 = 470 = order_value ✔
- 이 규칙(`SUM(attributed_revenue by order) == order_value for MultiTouch`)이 검증 대상임을 문서에 추가

### 15. `inventory_snapshots` 커버리지 불균등
- 5-01: 8개 상품 모두 있음
- 5-15: P001, P005, P006, P008 4개만 있음 (P002/P003/P004/P007 없음)
- 의도인지 결측인지 불명 → 강사용 노트에 명시하거나 정합화

### 16. `RetrySuccess` 인코딩
- `payments.PAY007.payment_status = RetrySuccess`
- 이건 상태 + 재시도 여부 두 개념이 섞임
- **필요**: `attempt_count`, `is_retry` 별도 컬럼으로 분리하는 것이 정석 → 미션 3 "코드셋 표준화" 토론 소재로 활용

---

## 🔵 P4: 문서화·강사 지원

### 17. README 부재
- `track1/data/` 폴더에 데이터셋 개요·의도된 노이즈·라이선스 안내 파일 없음
- **필요**: `README.md`에 다음 명시
  - 파일별 행수·주요 컬럼
  - **의도적으로 삽입된 품질 이슈 매트릭스** (강사용, 참가자용 별도)
  - 로드 순서 및 참조 관계 다이어그램
  - 시나리오 Q1/Q2/Q3와 필요 테이블 매핑

### 18. 강사용 정답 노트 없음
- 각 미션의 "예상 발견 이슈 리스트" (Answer Key)가 필요
- 예: 미션 2 프로파일링 → "결측: X건 발견 예상 / 중복: Y건 / 이상값: Z건"

### 19. WorkIQ 매칭용 샘플 M365 콘텐츠 시드 목록 없음
- 준비물 문서에는 "샘플 콘텐츠 30~50건 필요"라 되어 있으나, **어떤 캠페인/상품/주문을 언급하는 문서가 필요한지** 구체 목록 없음
- **필요**: 예를 들어 "SummerPush 캠페인 kickoff 이메일 (2026-04-15)", "P005 재고 부족 대응 Teams 스레드 (2026-05-16)" 같은 시드 문서 명세 15~20건

---

## 요약 - 데이터 개선 우선순위

| 우선순위 | 조치 | 예상 소요 |
|---|---|---|
| 🔴 P1-1 | 참조 무결성 오류 2건 삽입 | 5분 |
| 🔴 P1-2 | PK 중복 1건 삽입 | 2분 |
| 🔴 P1-3 | 결측값 4~5건 삽입 | 10분 |
| 🔴 P1-4 | 이상값 3건 삽입 | 5분 |
| 🔴 P1-5 | 표준 코드셋 위반 강사노트 문서화 | 10분 |
| 🟡 P2-6 | Q3용 재고부족-CS 시나리오 3건 추가 | 15분 |
| 🟡 P2-7 | products/promotions에 name 컬럼 추가 | 10분 |
| 🟡 P2-8 | campaigns 컬럼 확장 | 10분 |
| 🟡 P2-9 | 프로모션 실제 반영 로직 정리 (gross/net) | 20분 |
| 🟢 P3-10 | 값 정합성 mismatch 2건 삽입 | 5분 |
| 🟢 P3-11~16 | 포맷·통화·코드 정리 | 20분 |
| 🔵 P4-17 | `README.md` 작성 | 20분 |
| 🔵 P4-18 | 강사용 정답노트 작성 | 30분 |
| 🔵 P4-19 | WorkIQ 시드 콘텐츠 명세 | 30분 |

**핵심 메시지**: 지금 데이터는 "정답지"에 가깝고, 워크숍은 "지저분한 원천을 정리하는 실습"이 목적입니다. **의도된 노이즈 15~20건을 삽입하고, 강사용 정답 노트로 그 위치를 문서화**하는 것이 최소한의 개선입니다.

원하시면 P1(필수 데이터 오염)과 P2(시나리오 완결성)를 바로 반영해서 v1.1 데이터셋을 만들어 드릴 수 있습니다.