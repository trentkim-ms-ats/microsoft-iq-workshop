# 발표자 데모 01 — FabricIQ: 숫자에서 의미 경로까지

## 이 데모의 약속

발표자가 화면을 조작하고 참석자는 관찰합니다. FabricIQ는 **내부 정형 지표와
Ontology 관계**를 담당합니다. Ontology는 비즈니스 객체와 관계의 설계도이고,
실제 행은 Lakehouse 테이블에 있습니다. WorkIQ 문서에서 수치를 역산하거나
정형 결과를 문서 근거라고 부르지 않습니다.

**실행 경계:** 아래 클라우드 생성·업로드·노트북·검색은 모두 사람의 별도 승인을
받은 샘플/격리 환경에서만 발표자가 수행합니다. 이 문서는 실행 승인이 아닙니다.
승인이 없거나 환경이 준비되지 않았다면 사전 승인된 캡처와 저장소의 샘플 구조를
보여주고 **기록 화면/설계 예시, live 미검증**이라고 표시합니다. 참가자 작업
완료나 실서비스 증거로 기록하지 않습니다.

## 기존 미션을 발표로 바꾼 범위

| 원래 미션 | 발표자가 보여줄 것 | 발표 후 남길 것 |
|---|---|---|
| 1 질문 | Q1~Q5와 테이블·KPI | 질문-테이블 표 |
| 2 구조·품질 | CSV 14종, 키와 P1의 영향 | 구조·품질 개념 요약 |
| 3 표준화 | 키·날짜·상태 매핑과 `RetrySuccess` | 표준 규칙표 |
| 4 Ontology | 엔터티·속성·관계·카디널리티 | 모델 화면과 관계 목록 |
| 5 매핑·의미 경로 | 매핑표, 두 경로와 SQL baseline | 매핑·검증 로그 |
| Track2 인계 | 6개 범주를 한 화면에서 검수 | `TRACK2_WORKIQ_HANDOFF_PACKAGE` |

기존 통합 일정은 480분, Track1은 09:30–12:00(휴식 포함 150분)입니다.
발표용 축약 설명이 공식 일정이나 완료 기준을 바꾸지는 않습니다.

## 사전 준비: D-1에 발표자가 확인

1. 별도 승인된 Fabric capacity 연결 Workspace, Contributor 이상 권한, Lakehouse,
   Notebook 및 Ontology 사용 가능 여부를 관리자와 확인합니다. 비용과 종료·정리
   책임자도 정합니다. [준비 사항](../track1/PREREQUISITES.md)을 참고합니다.
2. [CSV 14종](../track1/data/README.md)과
   [실행 노트북](../track1/Track1_EndToEnd_Learner_Notebook.ipynb),
   [미션·SQL 원본](../track1/WORKBOOK.md)을 준비합니다. `channels`는 4행이며
   다른 테이블과 무조건 같은 규모가 아닙니다. 재생성은 기본 경로가 아닙니다.
   Track1 생성기는 자기 `track1/data/`의 CSV를 덮어쓰므로 기존 파일을 보존하고
   소유자 승인 없이 실행하지 않습니다.
3. 승인된 **전용 Lakehouse**에 기존 동명 파일·테이블이 있는지 먼저 확인합니다.
   [적재 코드](../track1/PREREQUISITES.md)는 `overwrite`로 동명 테이블을
   덮어씁니다. 공용/운영 Lakehouse에서는 실행하지 않습니다.
   노트북도 CSV 루트의 `generated/workbench/`에 파일을 만들거나 덮어씁니다.
   해당 경로에 보존할 결과가 있으면 승인된 별도 복사본을 사용합니다.
4. P1은 참조 무결성·중복·결측·이상값이 지표에 주는 **영향 설명만** 합니다.
   오류 위치·건수 탐지나 수정은 시연·완료 증거·Track2 진입 조건이 아닙니다.
5. 실패 대비용으로 승인된 샘플의 모델·쿼리 결과 캡처와 인계 초안을 준비합니다.
   캡처에 실제 개인정보, 자격 증명, 민감한 식별자나 내부 URL이 없도록 검토합니다.

## 클라우드 화면 준비

승인된 환경에서만 다음을 수행합니다. UI 이름은 제품 버전에 따라 다를 수 있습니다.

1. Fabric 포털의 `Workspaces`에서 전용 Workspace를 열고 `New item` → `Lakehouse`를
   선택합니다. Lakehouse `Files` → `Upload` → `Files`에서 14개 CSV를 업로드합니다.
   `Tables`는 테이블 목록, `Files`는 파일 위치임을 짚어줍니다.
2. Workspace에서 `New → Notebook → Import notebook`으로 위 실행 노트북을
   가져옵니다. Explorer의 `Add data items` → `Existing lakehouse`로 같은
   Lakehouse를 연결하고 default로 지정한 뒤 세션을 재시작합니다.
   `Start session` 후 첫 셀에서 `TRACK1_DATA_ROOT`와 출력된 `DATA_ROOT`를 확인합니다.
   미지정 시 노트북은 환경별 후보 경로를 탐색합니다. Fabric 기본 후보는
   `/lakehouse/default/Files`이며 다른 폴더에 업로드했다면 그 폴더를 지정합니다.
3. 노트북은 CSV를 **메모리 SQLite**에 읽어 미션별 설계·검증 초안을 만듭니다.
   이것만으로 Fabric 테이블 적재나 Ontology 배포가 완료되지는 않습니다.
   실제 SQL baseline을 Fabric 테이블에서 보여주려면 사전 승인된 별도 적재 단계로
   14개 파일 각각 `Load to Tables`를 선택하거나 준비 사항의 PySpark 일괄 적재를
   사용한 뒤 `Tables`를 새로고침합니다. 동명 테이블 덮어쓰기 여부를 먼저 확인합니다.
4. 모델 화면이 필요하면 Workspace → `New item` → `Ontology`에서 전용 항목을
   생성하거나 미리 준비된 항목을 엽니다. 이 작업은 live 쓰기입니다.
   대량 자동 배포는 [번들 설명](../track1/ontology_bundle/README.md)을 따르되
   기존 Ontology 업데이트와 정의 생성 경로를 확인하고 별도 승인 후에만 수행합니다.

## 발표 진행: 화면·조작·멘트

### 1. 질문으로 시작하기

실행 노트북의 Mission 1 질문 표를 펼치고 공통 데모 질문인 **Q2**를 가리킵니다.
Q1과 Q3~Q5는 아래 표를 이용해 추가로 설명합니다.

| 질문 | 관찰할 지표와 경로 |
|---|---|
| Q1 결제 실패와 캠페인 전환 | 실패율·승인 결제 기준 전환율; Campaign → CampaignAttribution → Order → Payment |
| Q2 배송 지연과 반품·만족 | 지연군 반품률·불만 티켓율; Shipment → Order → Return/SupportTicket |
| Q3 프로모션과 마진·재구매 | 유형별 마진 **proxy**·재구매율; Promotion → OrderPromotion → Order → Customer |
| Q4 품절과 취소·문의 | 품절 노출 주문 취소율·주문당 문의; InventorySnapshot → Product → OrderItem → Order |
| Q5 채널·등급·반품 사유 | 각 조합의 재구매율; Channel → Order → Customer/Return |

> “질문을 먼저 쪼개야 필요한 데이터와 연결 방법이 보입니다. 여기의 수치는
> 가상 샘플이며, 마진은 실제 원가를 확정한 수치가 아니라 proxy입니다.”

### 2. 데이터 구조와 품질의 의미

Mission 2 셀을 순서대로 실행해 14개 테이블의 행 수와 질문별 키를 보여줍니다.
저장소의 [`load_order.txt`](../track1/data/load_order.txt)를 별도 편집기에서 열어
마스터 → 거래 → 브릿지 순서를 설명하고 `orders.order_id`와
`payments.order_id`를 비교합니다.

> “키가 맞아야 주문의 여러 결제 시도를 연결합니다. 부모가 없는 키나 중복 키는
> 경로가 끊기거나 집계가 부풀 수 있습니다. 오늘은 오류를 찾아 고치지 않습니다.”

### 3. 같은 뜻을 같은 코드로

Mission 3의 표준화 계획을 펼칩니다. `*_id` 키 규칙, Date와 DateTime의 차이,
주문·결제·배송의 원천/표준 상태를 비교합니다. 특히 결제 `RetrySuccess`는
`AUTHORIZED`와 별도 재시도 여부로 나누는 설계임을 보여줍니다.

> “재시도 성공을 단순 성공으로만 바꾸면 운영 맥락이 사라집니다.
> 이 표는 표준화 **설계**이며 원본이 자동 수정됐다는 뜻은 아닙니다.”

### 4. Ontology를 눈으로 만들고 읽기

Ontology 화면에서 `+ Add entity type` → `Customer`를 만들고 상세의
`Add property`로 `customer_id`를 추가합니다. `Order`와 `Payment`도 열고
`+ Add relationship`에서 `Customer places Order`와 `Order has Payment`의
방향과 1:N을 보여줍니다. `Save`/`Publish` 등 해당 화면의 저장 버튼으로
저장합니다. 전체 모델은 미리 준비된 모델을 열어 확인합니다.

> “엔터티는 명사, 속성은 그 특징, 관계는 연결입니다. 주문 하나에 결제 시도가
> 여러 번 있을 수 있으니 1:1로 가정하면 안 됩니다.”

권장 모델은 14 엔터티·20 관계(물리 17, 논리 3)입니다. 워크북의 통과 범위는
10–16 엔터티·15–25 관계입니다. 논리 N:M은 브릿지 경로를 설명하며 단일 FK가
아닙니다. 실제 저장된 모델 수와 구현 범위를 화면에서 확인하고, 일부만 만들었다면
전체 구현으로 주장하지 않습니다.

### 5. 매핑과 기준값 확인

Mission 5 매핑 초안에서 원천 컬럼 → 표준 컬럼 → Ontology 속성을 비교하고
예를 들어 `Payment → payments.payment_status`, `Order → orders.order_id`,
`Customer → customers.customer_tier`, `Campaign → campaigns.campaign_name`,
`Product → products.product_name`을 짚습니다. 전체 매핑표는 빠짐없이 검토합니다.
두 의미 경로 A(`Campaign → CampaignAttribution → Order → Payment`)와
B(`Promotion → OrderPromotion → Order → Customer`)를 모델 정의에서 확인합니다.

Fabric Notebook에서 각 SQL 셀 언어를 **Spark SQL**로 바꾸고
[워크북의 Q1~Q5 분리 SQL](../track1/WORKBOOK.md)을 각각 실행합니다.
먼저 Q2의 지연군·비지연군 주문 수와 반품률·불만 티켓율을 비교하고,
Q1의 귀속 주문 수·실패율·전환율 및 Q3~Q5도 확인합니다. Q2의 불만 티켓율은
고객 만족도 자체가 아닌 대리 지표이며 지연과 반품의 동반 변화는 인과관계 증명이
아닙니다. 이어지는 Track2에서 관련 배송/CS 문서를 보여줍니다.

Q1의 Track1 SQL과 Track4 simulation은 **같은 산식이 아닙니다**. Track1 SQL은
주문별 여러 결제 중 승인·실패 플래그를 집계하고 `AUTHORIZED`도 승인으로 취급합니다.
Track4 생성기는 파일에서 해당 주문에 대해 마지막으로 읽은 결제 상태를 사용하고
`Success`/`RetrySuccess`만 성공으로 분류합니다. 각 결과의 분모·상태 처리와
실행 모드를 확인하며 동일 baseline이나 직접 비교 가능한 결과로 주장하지 않습니다.

> “SQL은 비교 기준값입니다. 설계도에 경로가 있다는 것과 Graph가 실제로
> 같은 결과를 반환한다는 것은 다릅니다.”

`getDefinition`으로 경로와 매핑을 확인하고 baseline의 실행 시각·결과를 기록합니다.
GraphModel을 사용할 수 있을 때만 별도 승인된 refresh/query를 실행합니다. 시나리오
A는 SQL과 행 수·`(campaign_id, order_id)` 샘플 10건을 비교하고, B는
`promotion_type`별 주문 수 차이 0과 재구매율 허용오차 ±0.001을 확인합니다.
미실행은 `N/A`/`not run`, 실행 실패나 불일치는 `FAIL`과 이유로 기록합니다.
노트북의 예시 PASS/FAIL 로그는 실제 Graph 실행 증거가 아닙니다.

## 결과 확인과 Track2 인계

- 정식 완료 판단은 10–16 엔터티, 15–25 관계, 전체 매핑표 작성,
  핵심 매핑 5개 이상, 의미 경로 2개와 기준값 확인입니다.
- 발표자가 [Track1 인계 템플릿](../track1/WORKBOOK.md)을 채워
  `TRACK2_WORKIQ_HANDOFF_PACKAGE`를 만듭니다. Workspace/Ontology ID·이름,
  엔터티/관계 수, 핵심 경로 **3개**, 핵심 `Entity:table.column` 매핑 **5개 이상**,
  실제 제한과 영향·우회안 또는 `none-known`, WorkIQ 검색 키,
  매핑·SQL baseline·선택 Graph 비교 증적 경로가 필요합니다.
- 검색 키는 `SummerPush`, `VIPRetention`, `AeroPhone X`, `SmartWatch Pro`,
  `Platinum`입니다. 실제 ID와 내부 증적은 승인된 보관 위치에만 둡니다.
  미완성 항목은 미완성으로 표시하고 Track2 담당자에게 보정 요청합니다.
- 다음 발표는 [WorkIQ 가이드](02-workiq.md)입니다. 수치는 FabricIQ, 문서 맥락은
  WorkIQ로 분리해 인계합니다.

## 장애와 복구

| 증상 | 확인 및 안전한 대안 |
|---|---|
| Workspace/Ontology가 안 보임 | 테넌트·권한·capacity·Preview 지원 확인. 해결 전 승인된 모델 캡처로 전환, live 미검증 표시 |
| CSV 누락 또는 경로 오류 | 14개 파일과 `TRACK1_DATA_ROOT`, default Lakehouse 연결·세션 재시작 확인 |
| SQL에서 테이블 없음 | 노트북의 SQLite 로드와 Fabric 테이블 적재를 구분. 전용 Lakehouse에서 승인된 적재 상태 확인 |
| 정의에 바인딩 없음 | core fallback 또는 매핑 제한을 기록하고 SQL baseline과 수동 매핑을 분리해 제시; 자동 성공으로 표시하지 않음 |
| Graph 불가 또는 값 불일치 | SQL·정의 확인까지만 보고, 비교 미실행/FAIL과 이유를 인계. 임의 수치로 채우지 않음 |
