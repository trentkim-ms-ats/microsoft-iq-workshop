# Track1 온톨로지 개념 및 그래프 설계 가이드

이 문서는 Track 1의 고급 시나리오(캠페인/결제/배송/재고/프로모션/CS)를 기준으로, 데이터 구조를 **Ontology 관점**에서 설명합니다.

> 📌 **관계명 규칙 안내**: 이 문서의 관계명(`contains`, `has_payment`, `applies_promotion` 등)은 개념 이해를 돕는 **예시 표현**입니다.
> 실습에서 실제로 사용하는 **정규 엔터티/관계명·카디널리티**는 [WORKBOOK.md 미션 4](../WORKBOOK.md#미션-4-ontology-엔터티관계-설계-40분---상세-설명)의 "권장 기준 관계 전체 목록(20개)"을 기준으로 삼으세요. Microsoft IQ workshop 통합 품질을 위해 Track 2/3에서도 실습지 미션 4의 이름을 그대로 재사용합니다.

## 1) 먼저 전체 그림

비즈니스에서 실제로는 아래와 같은 흐름이 발생합니다.

```text
광고 클릭
  ↓
고객 유입
  ↓
상품 조회
  ↓
주문
  ↓
결제
  ↓
배송
  ↓
리뷰
  ↓
반품
  ↓
고객센터 문의
```

기존 DB에서는 테이블이 분리되어 존재합니다.

```text
Customer Table
Order Table
Payment Table
Shipment Table
Return Table
```

하지만 AI는 테이블명만으로 의미를 이해하지 못합니다.  
Ontology는 **“객체의 의미 + 객체 간 관계”**를 정의해 AI가 비즈니스 맥락을 해석하게 만듭니다.

---

## 2) Ontology의 3요소

```text
Ontology
├── Entity (명사)
├── Relationship (동사)
└── Property (속성)
```

예:

```text
Customer --places--> Order
```

- `Customer`: Entity
- `places`: Relationship
- `Customer.name`: Property

---

## 3) Entity (명사)

Entity는 현실 세계의 객체(Class)입니다.

예: `Customer`

```text
Customer
- CustomerID
- Name
- Age
- Gender
- Tier
- JoinDate
```

실제 데이터는 Instance입니다.

```text
ID=100, Name=John
ID=101, Name=Alice
```

동일하게 `Product`, `Order`, `Payment`, `Shipment`, `Promotion`, `SupportTicket` 등도 Entity입니다.

---

## 4) Relationship (동사)

Ontology에서 가장 중요한 요소는 Relationship입니다.  
SQL의 JOIN과 달리, Ontology 관계는 **의미가 있는 연결**입니다.

주요 관계:

- `Customer places Order`
- `Order contains OrderItem`
- `OrderItem belongs_to Product`
- `Order has_payment Payment`
- `Order fulfilled_by Shipment`
- `Order applies_promotion Promotion`
- `Order attributed_by Campaign` (어트리뷰션 모델 기준)
- `Customer raises_ticket SupportTicket`
- `Product tracked_by_inventory InventorySnapshot`
- `Order results_in Return` (결과 관점 확장)

---

## 5) Property (속성)

Property는 Entity의 속성입니다.

- Customer: `CustomerID`, `Name`, `Tier`
- Product: `SKU`, `Category`, `Price`
- Shipment: `Carrier`, `TrackingNumber`
- SupportTicket: `Priority`, `ResolutionTime`
- Promotion: `DiscountRate`, `CouponCode`

---

## 6) 전체 Graph 예시

```text
                    Campaign
                        │
                    attributes
                        │
                      Order
                    /  |   \
           has_payment | fulfilled_by
                /       |       \
          Payment    contains    Shipment
                        |
                   OrderItem
                        |
                   belongs_to
                        |
                     Product
                        |
             tracked_by_inventory
                        |
               InventorySnapshot

Customer
   │
places
   │
Order
   │
applies_promotion
   │
Promotion

Customer
   │
raises_ticket
   │
SupportTicket

Order
   │
results_in
   │
Return
```

---

## 7) 핵심 관점 (End-to-End Customer Journey)

```text
누가(Customer)
  ↓
어떤 유입(Campaign, Channel)
  ↓
주문(Order)
  ↓
결제(Payment)
  ↓
배송(Shipment)
  ↓
프로모션(Promotion)
  ↓
재고(Inventory)
  ↓
문의(Support)
  ↓
반품(Return)
  ↓
재구매 또는 이탈(Outcome)
```

이 흐름이 그래프로 연결되면 AI는 단순 조회를 넘어 원인-결과를 추론할 수 있습니다.
실습 적용은 [WORKBOOK.md](../WORKBOOK.md)의 "⑦ 온톨로지 추론/의미 질의 검증 미니 실습" 절차를 따르세요.

예시 질문:
- 광고 캠페인 A 유입 VIP 고객 중 반품률이 가장 높은 상품은?
- 배송 지연이 문의 증가와 재구매 감소에 준 영향은?
- 특정 프로모션 적용 주문의 결제금액/반품률 변화는?
- 재고 부족이 주문 취소/이탈과 어떤 관계가 있는가?

---

## 8) 카디널리티와 제약조건(실무 필수)

관계는 이름만 정의하면 불충분합니다. **카디널리티와 제약조건**을 같이 설계해야 합니다.

- `Customer 1:N Order`
- `Order 1:N Payment` (재시도/부분승인 고려)
- `Order 1:N Shipment` (분할배송 고려)
- `Order N:M Promotion` (브릿지: `order_promotions`)
- `Product 1:N InventorySnapshot`
- `Order 1:N Return` 또는 `OrderItem 1:N Return` (운영 기준 선택)

어트리뷰션은 모델을 명시해야 합니다.
- Last-touch: `Campaign 1:N Order`
- Multi-touch: `Campaign N:M Order` (브릿지/가중치 필요)

---

## 9) Ontology 설계 품질 체크리스트

- 관계명이 동사형인가? (`places`, `contains`, `fulfilled_by`)
- 관계 방향이 일관적인가? (주어-동사-목적어)
- 카디널리티가 모두 정의되어 있는가?
- 코드셋이 문서화되어 있는가? (주문/결제/배송/문의/반품사유)
- 파생지표 계산식이 있는가? (`Margin`, `DelayRate`, `ReturnRate`)
- Track 2/3 재사용을 위한 명명 규칙이 고정되어 있는가?

---

## 10) Agent/RAG에서의 활용 패턴

에이전트는 보통 아래 순서로 그래프를 활용합니다.

1. 질문을 엔터티/관계 경로로 분해  
   - 예: "캠페인 A 유입 고객의 반품률"  
   - 경로: `Campaign -> Order -> Return`
2. FabricIQ(정형)에서 수치 집계
3. WorkIQ(비정형)에서 문서 근거 검색
4. Track4 FoundryIQ가 FabricIQ 수치, WorkIQ 근거, Track3 WebIQ citation을 결합해 최종 답변 생성

즉, Ontology는 데이터 사전을 넘어 **질문 라우팅 스키마** 역할을 합니다.

---

## 11) 자주 발생하는 모델링 실수

- 테이블명만 옮기고 관계 의미를 생략함
- `N:M` 관계를 브릿지 없이 직접 정의함
- 카디널리티를 누락함
- 코드셋 표준 없이 자유 텍스트를 그대로 사용함
- `Margin` 같은 파생지표를 정의하지 않고 질문부터 수행함

---

## 12) Microsoft Fabric/Knowledge Graph 관점 구현

Ontology는 **Schema Layer**이고, 실제 데이터는 **Knowledge Graph Instance Layer**입니다.

```text
Ontology (Semantic Model)
Customer ── places ──► Order
Order ── contains ──► OrderItem
OrderItem ── belongs_to ──► Product

Knowledge Graph (Data Instance)
Hyungil ── places ──► Order#1001
Order#1001 ── contains ──► Item#1
Item#1 ── belongs_to ──► Galaxy S26
```

정리하면:
- Ontology = 어떤 개념/관계가 존재하는지 정의한 설계도
- Knowledge Graph = 그 설계도에 맞춰 실제 데이터를 연결한 실행 결과

AI Agent/RAG는 이 의미 계층을 활용해 키워드 검색을 넘어 맥락 기반 답변을 생성합니다.
