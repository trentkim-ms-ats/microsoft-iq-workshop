# Microsoft IQ Workshop

> FabricIQ, WorkIQ, WebIQ, FoundryIQ를 하나의 근거 기반 응답 흐름으로 연결하는 실습 저장소

Microsoft IQ Workshop은 내부 정형 지표, 권한이 적용된 Microsoft 365 업무 근거,
공개 웹 citation을 분리해 수집하고 Azure AI Foundry에서 결합·평가하는 과정을
학습합니다. 참가자는 각 근거의 책임과 한계를 `sourceTrace`로 설명하고, 일부 소스가
실패해도 과도한 추론 없이 부분응답 또는 차단 결과를 만드는 방법을 익힙니다.

```text
Track1 FabricIQ → Track2 WorkIQ → Track3 WebIQ → Track4 FoundryIQ
```

## 워크숍 구성

| 트랙 | 폴더 | 책임 | 학습 결과 |
| --- | --- | --- | --- |
| Track1 FabricIQ | [`track1/`](track1/) | Fabric Lakehouse와 Ontology를 이용한 내부 정형 지표 계산·검증 | 공통 엔터티·관계·지표와 `TRACK2_WORKIQ_HANDOFF_PACKAGE`를 준비합니다. |
| Track2 WorkIQ | [`track2/`](track2/) | ACL을 준수하는 Outlook, Teams, SharePoint, OneDrive 내부 근거 검색 | 인덱스 카탈로그, 엔터티-문서 매핑, 품질 점수와 내부 근거를 준비합니다. |
| Track3 WebIQ | [`track3/`](track3/) | 공개 웹의 최신 외부 근거와 URL citation 수집·평가 | 안전한 검색어, Q1~Q3 citation, `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE`를 준비합니다. |
| Track4 FoundryIQ | [`track4/`](track4/) | Foundry IQ의 권위 지식과 Foundry Agent Service를 이용한 라우팅·결합·평가·fallback·최종 응답 | 세 근거의 책임을 보존한 Microsoft IQ 응답, 평가 리포트, 리더십 브리핑을 만듭니다. |

## 권장 시작 순서

1. [Microsoft IQ Industry Playground](industry_playground/playground/README.md)에서 Microsoft IQ의 역할과 산업 시나리오 탐색
2. [Microsoft IQ 입문자 학습 지도](common/docs/Microsoft_IQ_Beginner_Learning_Map.md)
3. [Microsoft IQ 워크숍 통합 계획](common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md)
4. [Track1 FabricIQ 빠른 시작](track1/QUICKSTART.md)
5. [Track2 WorkIQ 빠른 시작](track2/QUICKSTART.md)
6. [Track3 WebIQ 빠른 시작](track3/QUICKSTART.md)
7. [Track4 FoundryIQ 빠른 시작](track4/QUICKSTART.md)
8. 강사·운영자용
   [Microsoft IQ 당일 운영 체크리스트](common/docs/Microsoft_IQ_Instructor_Day_of_Operations_Checklist.md)

각 트랙의 상세 실습 절차는
[Track1](track1/WORKBOOK.md),
[Track2](track2/WORKBOOK.md),
[Track3](track3/WORKBOOK.md),
[Track4](track4/WORKBOOK.md) 실습지를 따릅니다.

### 인터랙티브 Playground

[`industry_playground/`](industry_playground/)는 Ontology Playground와 유사한 학습 경험으로
FabricIQ·WorkIQ·WebIQ·FoundryIQ의 관계를 탐색합니다. 실제 저장소 산출물에서
데이터를 생성하며 Q1~Q3 근거, `sourceTrace`, 5개 fallback 모드를 브라우저에서
확인할 수 있습니다. 외부 endpoint를 호출하지 않는 simulation 도구이며 실행과
산업별 시나리오 원문과 함께 제공되며, 배포 방법은 [Playground 안내](industry_playground/playground/README.md)를 따릅니다.

## 준비 사항

### 키 없는 로컬 검증

- 저장소 루트에서 명령을 실행할 수 있는 Python 3가 필요합니다.
- WebIQ 검증기와 Microsoft IQ 실행기·평가기는 저장소에 포함된 데이터와 Python
  표준 라이브러리를 사용하며 API 키나 테넌트 연결이 필요하지 않습니다.
- Track2 샘플을 다시 생성할 때만 Node.js와 npm이 필요합니다. 현재 의존성과 실행
  명령은 [`track2/data/package.json`](track2/data/package.json) 및
  [Track2 데이터 패키지 안내](track2/data/README.md)를 따릅니다.
- 로컬 생성·평가 명령은 `track4/data/generated/`를 갱신하므로 보존할 개인 산출물이
  있다면 먼저 별도 위치에 복사합니다.

### 트랙별 실습 환경

| 범위 | 필요한 환경 | 준비 문서 |
| --- | --- | --- |
| FabricIQ | Microsoft Fabric Workspace, Lakehouse, Notebook, Ontology 사용 권한 | [Track1 준비 사항](track1/PREREQUISITES.md) |
| WorkIQ | 샘플·격리 M365 테넌트, 필요한 Microsoft Graph 권한, 네 가지 M365 소스 | [Track2 준비 사항](track2/PREREQUISITES.md) |
| WebIQ live | 사람이 승인한 Foundry Agent Service Web Search 환경 | [Track3 준비 사항](track3/PREREQUISITES.md) |
| FoundryIQ live | Azure AI Foundry 프로젝트·모델과 승인된 workshop adapter | [Track4 준비 사항](track4/PREREQUISITES.md) |

실습 데이터의 현재 기준은 다음과 같습니다.

- Track1: CSV 14종
- Track2: 시드 19건(SharePoint 6, Outlook 5, Teams 5, OneDrive 3), 샘플 패키지
  60개 업무 항목(SharePoint 15, Outlook 15, Teams 18개 스레드, OneDrive 12)
- Track2 고정 검색어:
  `SummerPush`, `VIPRetention`, `AeroPhone X`, `SmartWatch Pro`, `Platinum`
- Track3 fixture: Q1~Q3에 각 2개, 총 6개 citation

Track1의 P1 데이터 품질 사례는 참가자에게 개념과 영향만 설명합니다. 탐지·수정 실습,
결과 건수, 제출물, 완료 증거 또는 Track2 진입 조건으로 사용하지 않습니다.

## 참가자 여정과 일정

| 운영안 | 용도 | 고정 사항 | 상세 일정 |
| --- | --- | --- | --- |
| 통합 480분 | 09:00~17:00 하루 운영 | 사전 산출물을 활용하되 네 트랙 순서와 Track2 110분 유지 | [480분 일정](common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md#current-480-minute-schedule) |

트랙 간 인계는 다음 계약을 따릅니다.

```text
FabricIQ
  └─ TRACK2_WORKIQ_HANDOFF_PACKAGE
      → WorkIQ
        └─ TRACK3_WEBIQ_HANDOFF_PACKAGE
            → WebIQ
              └─ TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE
                  → FoundryIQ
                    └─ Microsoft IQ 응답·평가·리더십 브리핑
```

| 인계 | 필수 내용 | 통과 조건 |
| --- | --- | --- |
| FabricIQ → WorkIQ | Workspace/Ontology 식별 정보, 엔터티·관계 요약, 핵심 경로 3개, 핵심 매핑 5개 이상, 구현 제한, WorkIQ 검색 키, 의미 경로 로그 | Track2 시작 시 6개 범주 검수 |
| WorkIQ → WebIQ | 인덱스 카탈로그, 품질 8개 점수, 유효 내부 근거 링크 5개 이상, 우선 이슈 3개, 재현 질의 3개 | 8개 중 6개 이상이 75점 이상이고 고정 검색어 5개 중 4개 이상 성공 |
| WebIQ → FoundryIQ | `url`, `title`, `domain`, `observedAt`, `scope`, `factStatus`, `limitations`, 실행 모드, 개인정보 점검 | Q1~Q3 각각 citation 2개 이상, 출처 품질 6개 중 5개 이상 PASS |
| FoundryIQ → 최종 결과 | 세 근거와 `FabricIQ`, `WorkIQ`, `WebIQ`, `FoundryIQ`가 분리된 `sourceTrace` | normal Q1~Q3와 fallback 5종 strict PASS |

## 로컬 빠른 시작

다음 명령은 저장소 루트에서 실행하며 외부 endpoint나 테넌트를 호출하지 않습니다.

### 1. WebIQ fixture 검증

```bash
python3 track3/data/validate_webiq_sources.py
```

성공 시 Q1~Q3와 총 6개 citation에 대해 `PASS`가 출력됩니다. fixture는 현재 웹의
실제 장애·경보·리콜을 증명하지 않습니다.

### 2. Microsoft IQ simulation 입력 준비

```bash
python3 track4/data/generate_track3_samples.py
```

이 명령은 Track1 CSV와 Track2 매니페스트에서 현재 Q1~Q3 simulation 입력을 생성합니다.

### 3. normal 및 fallback 실행

```bash
# normal Q1~Q3
python3 track4/data/run_microsoft_iq_simulation.py --all --mode normal

# Q1 fallback 5종
python3 track4/data/run_microsoft_iq_simulation.py --scenario-id Q1 --mode fabric-down
python3 track4/data/run_microsoft_iq_simulation.py --scenario-id Q1 --mode work-down
python3 track4/data/run_microsoft_iq_simulation.py --scenario-id Q1 --mode web-down
python3 track4/data/run_microsoft_iq_simulation.py --scenario-id Q1 --mode internal-down
python3 track4/data/run_microsoft_iq_simulation.py --scenario-id Q1 --mode all-down
```

### 4. strict 평가

```bash
python3 track4/data/evaluate_microsoft_iq_outputs.py --strict
```

strict gate는 normal Q1~Q3 3개와 Q1 fallback 5개, 총 8개 출력을 평가합니다.
`failed: 0`이어야 통과합니다.

### 선택: Track2 배포 계획 dry-run

```bash
test -e track2/data/deployment_config.json || \
  cp track2/data/deployment_config.example.json track2/data/deployment_config.json
# deployment_config.json에는 승인된 샘플 테넌트의 비밀이 아닌 식별자만 입력합니다.
python3 track2/data/deploy_m365_samples.py \
  --config track2/data/deployment_config.json
```

`--execute`가 없으므로 이 명령은 설정과 작업 계획만 확인합니다. 테넌트 쓰기, 권한,
ACL, 메일 배송 또는 참가자 접근을 증명하지 않습니다.

## 산출물과 완료 증거

| 범위 | 주요 산출물 | 증명 범위 |
| --- | --- | --- |
| Track1 | Ontology 정의·매핑·의미 경로, `TRACK2_WORKIQ_HANDOFF_PACKAGE` | 정형 지표의 구조와 Track2 입력 계약 |
| Track2 | 인덱스 카탈로그, 매핑표, 8개 품질 점수, 내부 근거 링크 | 샘플 M365 콘텐츠의 검색·품질·ACL 검수 결과 |
| Track3 | Q1~Q3 citation과 `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE` | 외부 근거 스키마와 출처 평가 결과 |
| Track4 simulation | `microsoft_iq_responses/*.json`, strict 평가 리포트, 리더십 브리핑 | 결합 계약, 책임 분리, fallback 동작의 교육·회귀 결과 |
| 승인된 live 실행 | 실제 adapter 로그, M365 ACL 관찰, 실행 시점 URL citation | 해당 환경에서 별도로 수집한 연결·권한·검색 증거 |

결합 simulation의 기본 출력은 다음 이름을 사용합니다.

```text
track4/data/generated/
  microsoft_iq_responses/
    Q1__normal.json
    Q2__normal.json
    Q3__normal.json
    Q1__fabric-down.json
    Q1__work-down.json
    Q1__web-down.json
    Q1__internal-down.json
    Q1__all-down.json
  reports/
    microsoft_iq_evaluation_report.json
    microsoft_iq_evaluation_report.md
    microsoft_iq_leadership_briefing.md
```

제출물에는 반드시 실행 모드, 생성 시각, 사용한 입력, `sourceTrace`, 경고와 제한을
기록합니다. 정적 매니페스트, dry-run 출력, fixture 또는 simulation 리포트는 live
서비스·테넌트·ACL·현재 웹 사실의 증거가 아닙니다.

## 근거 책임과 실행 모드

### 근거 책임

- **FabricIQ**만 내부 정형 지표를 계산합니다.
- **WorkIQ**만 ACL이 적용된 내부 M365 문서·메일·대화 근거를 제공합니다.
- **WebIQ**만 공개 웹 주장과 URL citation, 관찰 시각, 적용 범위, 한계를 제공합니다.
- **Foundry IQ**는 권위 지식 계층(authoritative knowledge layer)을 제공하고 **Foundry Agent Service**는 세 근거를
  라우팅·결합·평가해 최종 응답을 만듭니다.
- FoundryIQ는 제공되지 않은 숫자·링크·인과관계를 만들지 않습니다.

### 실행 모드와 증거 경계

| 모드 | 동작 | 사용할 수 있는 증거 | 증명하지 않는 것 |
| --- | --- | --- | --- |
| `dry-run` | 설정과 예정 작업을 비파괴 점검 | 구성 유효성, 계획된 작업 | 테넌트 변경, ACL, 실제 배송 |
| `simulation` | Track1 CSV, Track2 매니페스트, Track3 fixture로 로컬 실행 | 스키마, 라우팅, 결합, fallback, 회귀 결과 | live 서비스 권한·네트워크·현재 웹 사실 |
| `live` | 승인된 adapter와 Web Search를 실제 호출 | 해당 실행의 연결, 권한, 실제 citation | 다른 테넌트나 다른 시점의 상태 |

live 실패 시 fixture 기반 `simulation`으로 학습을 계속할 수 있지만 live 상태는
`미확인`으로 남깁니다. Web Search가 차단되면 검색어·도구 설정·권한을 확인한 뒤
fixture로 전환하고, simulation 결과를 live 성공으로 표시하지 않습니다.
simulation citation의 `factStatus`는 `fixture-contract`, live citation은
`live-observation`이어야 합니다.

## live 연결 계약

live는 승인된 운영 환경에서만 별도로 검증합니다. `FABRICIQ_ENDPOINT`,
`WORKIQ_ENDPOINT`, 선택 사항인 `WEBIQ_ENDPOINT`는 원시 제품 URL이 아니라 다음 공통
요청을 받는 워크숍 POST JSON adapter입니다.

```json
{
  "scenarioId": "Q1",
  "question": "결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?",
  "semanticKeys": ["CampaignId", "OrderId", "PaymentStatus"]
}
```

| adapter | 필수 응답 |
| --- | --- |
| FabricIQ | `structuredMetrics`, `highlights`, `sourceTrace` |
| WorkIQ | `evidenceLinks`, `sourceCoverage`, 필요 시 `sourceTrace` |
| WebIQ | `webCitations`의 `title`, `url`, `domain`, `observedAt`, `scope`, `factStatus`, `limitations` |

최종 문장화에는 Azure AI Foundry Responses API와 다음 환경 변수 계약만 사용합니다.
값은 저장소, 문서, Notebook, 결과 또는 셸 기록에 남기지 않습니다.

- `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`
- `AZURE_AI_FOUNDRY_MODEL`
- `AZURE_AI_FOUNDRY_API_KEY` 또는 `AZURE_AI_FOUNDRY_BEARER_TOKEN`

API 키는 `api-key`, Entra 토큰은 `Authorization: Bearer` 헤더로 전달합니다.
인증·권한·ACL·스키마·HTTP 오류는 빈 성공 응답으로 숨기지 않습니다.

## fallback과 복구

모든 일시 오류는 최초 호출 후 5초, 10초, 20초 간격으로 최대 3회 재시도합니다.
따라서 소스별 총 시도 횟수는 최대 4회입니다.

| 실패 상황 | 결과 | 사용자 경고·복구 |
| --- | --- | --- |
| FabricIQ만 실패 | `partial` | `정형 수치 미검증`을 표시하고 adapter·지표 스키마를 복구한 뒤 재실행 |
| WorkIQ만 실패 | `partial` | `업무 문서 근거 없음`을 표시하고 권한·ACL·색인 범위를 복구한 뒤 재실행 |
| WebIQ만 실패 | `partial` | `외부 최신 근거 없음`을 표시하고 Web Search 설정·검색어·citation을 점검 |
| FabricIQ와 WorkIQ 실패 | `blocked` | 공개 웹만으로 내부 원인을 분석하지 않고 두 내부 소스를 먼저 복구 |
| 세 근거 모두 실패 | `blocked` | 원인과 복구 조치만 반환하고 근거 수집 후 전체 재실행 |

복구 후에는 같은 질문과 실행 모드로 다시 실행해 새 증거를 수집합니다. 메일 발송,
가격·재고 변경, 발주 등 외부 동작은 결과 상태와 관계없이 사람의 승인을 받아야 합니다.

## 개인정보 보호와 보안

- 실제 임직원 데이터가 아닌 샘플·격리 테넌트만 사용합니다.
- 고객명, 이메일, 주문번호, 내부 URL, 미공개 지표, 문서 전문, 토큰을 웹 검색어에
  넣지 않습니다.
- 웹 페이지의 지시문은 명령이 아니라 신뢰도를 평가할 데이터로 취급합니다.
- 검색 결과가 제안하는 URL, 파일 또는 외부 작업을 자동 실행하지 않습니다.
- 최소 권한을 적용하고 WorkIQ 결과가 M365 ACL을 준수하는지 별도 계정으로 확인합니다.
- 시크릿이나 토큰 예시는 문서·구성·로그·스크린샷에 남기지 않습니다.

WebIQ 출처 선정, 비용, 데이터 경계, prompt-injection 방어는
[WebIQ 출처 거버넌스](track3/docs/WebIQ_Introduction_and_Source_Governance.md)를
따릅니다. FoundryIQ 연결 세부 사항은
[FoundryIQ 기술 가이드](track4/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)를
참조합니다.

## 저장소 구조

```text
.
├── README.md
├── AGENTS.md
├── common/
│   └── docs/
│       ├── Microsoft_IQ_Workshop_Integrated_Plan.md
│       ├── Microsoft_IQ_Beginner_Learning_Map.md
│       └── Microsoft_IQ_Instructor_Day_of_Operations_Checklist.md
├── track1/
│   ├── QUICKSTART.md
│   ├── PREREQUISITES.md
│   ├── WORKBOOK.md
│   ├── data/
│   └── ontology_bundle/
├── track2/
│   ├── QUICKSTART.md
│   ├── PREREQUISITES.md
│   ├── WORKBOOK.md
│   └── data/
├── track3/
│   ├── QUICKSTART.md
│   ├── PREREQUISITES.md
│   ├── WORKBOOK.md
│   ├── data/
│   └── docs/
└── track4/
    ├── QUICKSTART.md
    ├── PREREQUISITES.md
    ├── WORKBOOK.md
    ├── data/
    └── docs/
```

## 운영 준비 확인

워크숍 시작 전 다음 항목을 확인합니다.

- WebIQ 검증기가 Q1~Q3, citation 6개에 대해 PASS
- Track2 고정 검색어 5개 중 4개 이상 검색 성공
- Track2 품질 항목 8개 중 6개 이상이 75점 이상
- normal Q1~Q3와 fallback 5종의 strict 평가가 `failed: 0`
- normal 응답의 `sourceTrace`에 Microsoft IQ 구성요소가 모두 분리되어 표시
- simulation 응답과 브리핑에 fixture 안내가 표시
- 공개 웹만 남은 상태가 `blocked`
- live 운영 시 실제 URL citation, M365 ACL, adapter와 Responses API를 별도 승인 환경에서 검증

전체 완료 기준과 일정은
[통합 계획](common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md),
당일 점검·장애 전환 절차는
[강사용 운영 체크리스트](common/docs/Microsoft_IQ_Instructor_Day_of_Operations_Checklist.md)를
기준으로 합니다.
