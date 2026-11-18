# Microsoft IQ 스피커 데모 가이드

참석자는 화면을 보며 질문하고, **스피커가 사전에 구성한 클라우드 환경을 조작**합니다.
이 폴더는 기존 참가자 실습을 대체하거나 새 제품을 배포하지 않습니다. 네 트랙의
실습을 시연 동작, 초보자 설명, 확인할 근거, 실패 시 대안으로 전환한 운영 자료입니다.

> **먼저 구분하세요:** 이 저장소는 완성된 라이브 FabricIQ/WorkIQ adapter 서버를
> 제공하지 않습니다. 클라우드 네 서비스가 연결된 통합 데모에는 별도로 구현·승인된
> adapter와 Foundry 환경이 필요합니다. 준비되지 않았으면 각 클라우드 화면을 별도로
> 시연하고 통합 결과는 `simulation`이라고 명시합니다. 로컬 fixture나 dry-run을
> 실제 검색, 배포, 권한 검증 또는 Foundry 응답으로 소개하지 않습니다.

## 시작하기

| 순서 | 자료 | 스피커가 보여줄 것 |
|---|---|---|
| 0 | [HTML 발표 슬라이드](./slides.html) | 전체 아키텍처와 각 기술의 책임 |
| 1 | [FabricIQ 데모](./01-fabriciq.md) | Lakehouse 테이블, Ontology, 정형 질의와 인계 |
| 2 | [WorkIQ 데모](./02-workiq.md) | 네 M365 소스, 검색·문서 매핑·권한과 품질 |
| 3 | [WebIQ 데모](./03-webiq.md) | 공개 질문 분리, citation·출처 품질과 인계 |
| 4 | [FoundryIQ 데모](./04-foundryiq.md) | 근거 라우팅·통합 응답·평가·실패 대응 |

브라우저에서 `demo/slides.html`을 열고 방향키나 버튼으로 넘깁니다.
슬라이드는 외부 라이브러리 없이 동작하며 인쇄 시 모든 페이지가 표시됩니다.
각 트랙의 원본 실습지와 [통합 계획](../common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md)이
세부 계약의 권위 원본입니다. 발표 시 기존 **480분 운영 기준**, Track2 **110분
(25+25+35+25)**과 트랙 순서는 그대로 유지합니다.

## 하나의 질문, 네 가지 책임

발표 질문으로 **Q2: 배송 지연은 반품률과 고객 불만 티켓에 어떤 영향을 미치는가?**를
사용합니다. 이는 원인 입증이 아니라 지표와 근거를 함께 확인하는 출발점입니다.

| 단계 | 하는 일 | 관객에게 보여줄 증거 | 하지 않는 일 |
|---|---|---|---|
| FabricIQ | 배송·주문·반품·티켓의 정형 관계와 지표 확인 | Lakehouse 테이블, Ontology, SQL 결과 | 업무 문서에서 수치 역산 |
| WorkIQ | 관련 내부 업무 문서를 권한 범위 내 검색 | 출처·문서 제목·원본 링크, 접근권한 결과 | 정형 결과를 문서 근거로 위장 |
| WebIQ | 공개적으로 확인할 외부 상황을 별도 검색 | 출처 URL·관찰 시각·지역·한계 | 내부 ID·수치 전송, 외부 근거만으로 내부 원인 단정 |
| FoundryIQ | 지식과 세 소스의 결과를 분리해 결합·평가 | sourceTrace, citation, 경고와 응답 상태 | 없는 숫자·링크·인과관계 생성 |

```text
Fabric Lakehouse / Ontology ─── FabricIQ ── 정형 지표 ─────┐
M365 샘플 테넌트 ───────────── WorkIQ ─── 내부 근거 ─────┤
공개 웹 ───────────────────── WebIQ ───── URL citation ──┤
권위 지식 ─────────────────── Foundry IQ ─────────────────┤
                                                         ▼
             Foundry Agent Service: 라우팅 · 결합 · 평가 · fallback
                                                         ▼
                근거별 출처와 한계를 표시한 브리핑
```

Foundry IQ의 권위 지식과 Foundry Agent Service의 오케스트레이션은 구분합니다.
화살표는 **책임과 데이터 흐름**이며 제품 간 기본 자동 연결을 의미하지 않습니다.

## 사전 준비: 클라우드 환경과 안전 경계

스피커 또는 승인된 운영자가 다음을 준비합니다. 비용·리전·라이선스·테넌트 정책은
조직에 따라 다르므로 실제 생성 전에 관리자와 확인합니다.

1. **Fabric:** 승인된 용량·workspace, Lakehouse, Notebook, Ontology 사용 권한과
   Track1 14종 CSV. Ontology 기능은 프리뷰이므로 UI와 기능 가용성을 미리 확인합니다.
2. **M365:** 실제 직원 데이터가 없는 샘플/격리 테넌트, SharePoint·Outlook·Teams·OneDrive,
   테스트 사용자와 접근 제한 대상, Graph 권한 및 관리자 동의. 콘텐츠 업로드·메일 발송·채널
   게시·앱/채널 생성은 반드시 별도 승인된 운영자가 수행합니다.
3. **WebIQ:** 승인된 Foundry Agent Service Web Search 또는 workshop WebIQ adapter,
   공개 정보만 들어간 질문, 출처별 URL/지역/시각을 확인할 브라우저. fixture는 백업용입니다.
4. **FoundryIQ:** 승인된 Azure AI Foundry 프로젝트와 모델, 권위 지식, 테스트할
   FabricIQ/WorkIQ workshop POST JSON adapter 및 필요 시 WebIQ adapter.
   `FABRICIQ_ENDPOINT`와 `WORKIQ_ENDPOINT`는 제품 원시 URL이 아닙니다.
   최종 문장화는 저장소의 Foundry Responses API 계약을 사용합니다.
5. **시연 계정과 증거:** 운영 계정과 일반 참가자·제한 계정을 구분하고 결과의 출처와
   실행 모드를 명시합니다. 개인 계정, 내부 URL, 토큰, 비밀 값은 슬라이드·로그·스크린샷에
   남기지 않습니다. 시연 종료 후 임시 권한과 리소스를 운영 정책에 따라 회수합니다.

각 라이브 환경은 사람이 별도로 승인한 후에만 검증합니다. 이 자료의 작성·로컬
리허설 자체가 라이브 승인이나 실제 환경 구성 완료를 뜻하지 않습니다.

## 준비·리허설·발표·종료

### D-1: 사전 구성과 리허설

- 각 트랙 가이드의 **사전 준비**와 기존 준비 문서를 따라 cloud 리소스를 준비합니다.
  원천 CSV·M365 샘플·인계 패키지와 citation을 사전 점검합니다.
- 참가자에게 보여줄 화면 및 실행 모드(`live`, `simulation`, `dry-run`)를 명시합니다.
- [운영 체크리스트](../common/docs/Microsoft_IQ_Instructor_Day_of_Operations_Checklist.md)의
  **D-1 검증 항목**에서 WebIQ fixture, compatibility, Microsoft IQ normal 및 fallback
  strict 검증을 리허설합니다. 일정 배치는 체크리스트의 별도 표가 아니라
  [통합 계획의 480분 시간표](../common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md#current-480-minute-schedule)를 따릅니다.
  생성 스크립트는 기존 `generated/` 결과를 덮어쓸 수 있으므로 보존할 산출물을 먼저
  분리하고 각 가이드의 출력 경로를 확인합니다.
- 실제 M365 검색과 제한 계정 차단, 라이브 citation 및 adapter 결과는 **별도 승인된
  라이브 점검의 실제 관찰**로만 입증합니다. 로컬 manifest는 이 증거가 아닙니다.

### 발표: 같은 질문을 각 IQ로 분해

1. 슬라이드로 네 역할과 내부·외부 경계를 설명합니다.
2. FabricIQ에서 원천 → Ontology → SQL 결과를 보여주고 인계를 소개합니다.
3. WorkIQ에서 같은 엔터티의 문서·링크와 권한을 확인하고 품질 점수를 보여줍니다.
4. WebIQ에서 민감정보를 제거한 공개 확인 질문과 citation의 출처·시각·범위를 확인합니다.
5. FoundryIQ에서 근거별 필드와 trace, 정상 응답과 장애별 부분응답을 비교합니다.
6. 마지막으로 Q1~Q3 결과와 한계를 비교합니다. 통합 자동검증의 Q3는
   **핵심 상품 3종의 매출·반품 신호**이고, 기본 실습 Q3의 프로모션 질문과 다릅니다.
   Q1과 Q2도 Track1 SQL과 Track4 simulation의 결제 상태 처리 또는 모집단·표현
   단위가 다를 수 있으므로 [Track4 가이드의 산식 차이](./04-foundryiq.md)를
   확인하고 동일한 baseline으로 단정하지 않습니다.

### 실패 시 발표를 멈추지 않는 방법

| 상황 | 스피커의 행동 | 관객에게 반드시 할 말 |
|---|---|---|
| 클라우드 권한·네트워크 실패 | 승인된 사전 화면 또는 simulation으로 전환 | “이 화면은 사전 자료/시뮬레이션이며 현재 라이브 결과가 아닙니다.” |
| Web Search 불가 | 검증된 fixture로 전환 | “fixture는 현재 웹의 실제 장애·경보·리콜을 증명하지 않습니다.” |
| WorkIQ 접근 실패 | 권한 확인 후 내부 근거 부재를 표시 | “다른 소스의 자료로 업무 문서 근거를 대체하지 않습니다.” |
| FabricIQ와 WorkIQ 모두 실패 | 내부 분석 중단, `blocked` 표시 | “공개 웹만으로 내부 KPI나 원인을 판단하지 않습니다.” |
| 검색어에 내부 식별자·수치 포함 | 외부 전송 전 중단·공개 질문으로 재작성 | “공개 웹에는 민감한 내부 정보를 보내지 않습니다.” |

### 종료

시연 결과의 모드와 실제 확인 여부를 기록하고, 임시 접근권한·샘플 배포·클라우드
리소스는 승인된 운영자가 조직의 보존 및 삭제 정책에 따라 정리합니다. 발송·스케줄
배포나 알림 연결은 이 데모를 실행한다는 이유만으로 허용되지 않습니다.

## 인계와 검증 기준

```text
TRACK2_WORKIQ_HANDOFF_PACKAGE
  → TRACK3_WEBIQ_HANDOFF_PACKAGE
    → TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE
      → 응답 + 평가 + 리더십 브리핑
```

- Track1은 Ontology 식별 정보, 모델 요약, 매핑 근거, 검색 키, 구현 제한과 의미 경로를 인계합니다.
- Track2는 네 소스의 검색, 엔터티 매핑, 내부 링크 5개 이상과 재현 질의 3개를 보여줍니다.
  품질 게이트는 **8개 항목 중 6개 이상 75점 이상**입니다.
- Track3은 Q1~Q3 각각 공개 citation 2개와 출처 품질 6개 중 5개 이상을 확인합니다.
- Track4 normal은 FabricIQ·WorkIQ·WebIQ·FoundryIQ trace를 확인합니다. 한 소스 실패는
  명시적 부분응답, 두 내부 소스 실패는 `blocked`입니다. 재시도는 **5초→10초→20초,
  최대 3회 재시도(총 최대 4회 시도)**입니다.
