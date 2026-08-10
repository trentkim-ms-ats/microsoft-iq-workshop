# 트랙2 실습지(참가자용) v1.0

> M365 샘플과 품질 게이트를 기준대로 적용합니다. 완료 후
> [Track3 WebIQ](../track3/QUICKSTART.md)를 거쳐
> [Track4 FoundryIQ](../track4/QUICKSTART.md)로 이동합니다.

- 트랙명: Track 2 — WorkIQ 업무 컨텍스트 연결 + 크로스 소스 품질 검증
- four-component Microsoft IQ flow 통합 스택 내 위치: **WorkIQ 구축 단계**. Track 1의 Ontology 인계 패키지를 입력으로 받아 M365(Outlook/Teams/SharePoint/OneDrive) 업무 컨텍스트를 색인·검증하고, Track3 WebIQ가 먼저 사용할 인덱스·품질 리포트를 만듭니다. Track3의 `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE`를 통해 해당 WorkIQ 근거가 Track4 FoundryIQ로 이어집니다.
- 총 시간: 110분 (휴식 없이 연속 진행)
- 현재 1일 운영 시간대: 12:35-14:25.
  [canonical 통합 계획](../common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md#current-480-minute-schedule)의
  순서를 따릅니다.
- 대상: Track 1을 이수했거나 Track1 인계 패키지를 전달받은 참가자

## 참고 자료
- Track2 실습 준비물 상세: [PREREQUISITES.md](PREREQUISITES.md)
- WorkIQ 매칭용 샘플 M365 콘텐츠 시드 명세(키워드 프로브 포함): [Track1_WorkIQ_Seed_Content_Specification.md](../track1/docs/Track1_WorkIQ_Seed_Content_Specification.md)
- 실행 가능한 샘플 데이터(생성·배포·검증): [track2/data/README.md](./data/README.md)
- 미션1~2 실행 워크벤치 노트북: [track2/data/Track2_Mission1_2_Workbench.ipynb](./data/Track2_Mission1_2_Workbench.ipynb)
- Track1 인계 패키지 출처(`TRACK2_WORKIQ_HANDOFF_PACKAGE` 템플릿): [WORKBOOK.md](../track1/WORKBOOK.md)
- Track3 WebIQ 실습지(공개 확인 질문): [WORKBOOK.md](../track3/WORKBOOK.md)
- Track4 FoundryIQ 시작 입력 계약: [PREREQUISITES.md](../track4/PREREQUISITES.md)
- Track4 FoundryIQ 참가자 실습지(인계 이후 실행 경로): [WORKBOOK.md](../track4/WORKBOOK.md)
- WorkIQ 연동 방식 및 M365 검색 API 기술 안내(선택 경로): [Track4 Appendix](../track4/docs/Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md)
- 강사용 당일 운영 체크리스트: [Microsoft IQ Instructor Day-of Operations Checklist](../common/docs/Microsoft_IQ_Instructor_Day_of_Operations_Checklist.md)
- 통합 계획(트랙별 시간/DoD 근거): [Microsoft IQ Workshop Integrated Plan](../common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md)


## 실습 목표
1. Track1 인계 패키지를 5분 내 검수하고, 고정 키워드 5종 프로브로 WorkIQ 검색 가용성을 확인한다.
2. Outlook/Teams/SharePoint/OneDrive 4대 M365 소스를 WorkIQ로 색인·검색해 소스 인벤토리(인덱스 카탈로그)를 작성한다.
3. Ontology 엔터티(캠페인/상품/고객등급)와 M365 문서를 교차 매핑해 크로스 소스 근거를 확보한다.
4. 정형+비정형 크로스 소스 품질 8대 항목을 `0/25/50/75/100` 루브릭으로 채점하고, Track3 WebIQ가 먼저 소비할 WorkIQ 인계 패키지를 완성한다.

## 완료 기준(DoD)
1. `TRACK2_KICKOFF_CHECK` 작성 완료 — 키워드 5개 중 **4개 이상** 검색 성공(실패 키워드 정규화 재시도 로그 포함).
2. M365 4대 소스(Outlook/Teams/SharePoint/OneDrive) **각각 최소 1건** 검색 성공한 인덱스 카탈로그 작성.
3. Ontology 엔터티(캠페인/상품/고객등급)별 M365 문서 **최소 1건** 매핑 — Q3 핵심 상품 3종(AeroPhone X, SmartWatch Pro, UltraBook 15)은 **각 2건 이상**.
4. 품질 8대 항목 각각 점수화(`0/25/50/75/100`) + 근거(쿼리 결과/검색 결과/유효 링크 중 1개 이상) 첨부.
5. 품질 게이트 통과: 8개 항목 중 **6개 이상**이 75점 이상(PASS).
6. `TRACK3_WEBIQ_HANDOFF_PACKAGE` 제출 — **먼저 Track3 WebIQ가 소비**하는 WorkIQ 입력 패키지다. 유효 내부 근거 링크 5건 이상·재현 질의 3개를 포함하고, Track3가 WebIQ citation을 더해 `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE`를 Track4 FoundryIQ에 전달한다.

## 실습 준비물
| 항목 | 설명 |
|---|---|
| Microsoft Graph API 접근 권한 | WorkIQ가 M365 콘텐츠를 색인하는 데 필요한 위임/앱 권한(예: Mail.Read, Files.Read.All, ChannelMessage.Read.All, Sites.Read.All) |
| 대상 SharePoint 사이트 | 캠페인 기획서·성과 리포트가 저장된 샘플 사이트 |
| 대상 Outlook 메일함 | 리더십 이슈 논의 메일이 담긴 공유 메일함 또는 샘플 사용자 계정 |
| 대상 Teams 채널 | CS 티어2 대응 채널(샘플) |
| 대상 OneDrive 폴더 | 미팅 노트가 담긴 공유 폴더 |
| 검색/검증 도구 | 제공 WorkIQ 커넥터 화면(기본) 또는 Microsoft Graph Explorer/API 클라이언트(선택, Appendix A 참조) |
| 샘플 콘텐츠 시드셋 | 기준 시드 19건: SharePoint 6/Outlook 5/Teams 5/OneDrive 3 ([준비 계약 및 배치 완료 검수](../track1/docs/Track1_WorkIQ_Seed_Content_Specification.md#3-소스별-샘플-데이터-준비-계약)) |
| 확장 샘플 데이터 | 총 60개 업무 항목: SharePoint 15/Outlook 15/Teams 18 스레드/OneDrive 12 ([생성·배포 방법](./data/README.md)) |
| Track1 인계 패키지 | `TRACK2_WORKIQ_HANDOFF_PACKAGE` (Ontology 식별정보/모델요약/매핑근거/구현 제한/WorkIQ 키워드/의미 경로 로그) |

준비물 상세는 [PREREQUISITES.md](PREREQUISITES.md)를 참조.

## 사용 데이터/콘텐츠 원칙
- **샘플/격리 테넌트 콘텐츠만 사용**한다. 실제 임직원 메일함/채널/사이트/문서를 색인 대상으로 삼지 않는다.
- 제목만 있는 빈 콘텐츠는 사용하지 않는다. 본문에 상황, 영향, 결정 또는 후속 조치 중 최소 2개와 지정 엔터티명을 포함한다.
- 문서 본문의 상품명/캠페인명 표기는 정형 데이터(Track1 Ontology)와 **정확히 일치**해야 매칭이 성립한다. 오탈자·별칭은 표기 정규화 실습 소재로 활용한다.
- 권한 최소화 원칙을 적용하고, 검색 결과가 **권한 기반 노출(ACL/Security trimming)**을 따르는지 확인한다(Appendix C).
- Track1에서 넘어온 실제 구현 제한은 무시하지 않고, 검색·매핑 품질 해석에 반영한다. P1 데이터 오류 탐지 결과는 Track2 입력으로 요구하지 않는다.

## 중간 점검 타임마커
- **T+15 (미션1 초반)**
  - Track1 인계 패키지 6개 필드 검수 완료
  - 고정 키워드 5종 프로브 실행 완료(정규화 재시도 포함)
- **T+25 (미션1 종료)**
  - 4대 M365 소스(Outlook/Teams/SharePoint/OneDrive) 각 최소 1건 검색 성공
  - 인덱스 카탈로그 초안 확정
- **T+50 (미션2 종료)**
  - 엔터티-문서 교차 매핑표 완성(엔터티별 최소 1건, Q3 핵심 3상품 각 2건 이상)
- **T+85 (미션3 종료)**
  - 품질 8대 항목 각각 최소 1개 증적 확보
- **T+110 (미션4 종료)**
  - 스코어링 워크시트 완성 + Track3 WebIQ 입력용 `TRACK3_WEBIQ_HANDOFF_PACKAGE` 제출

## 단계별 미션

### 미션 1. 킥오프 검수 + M365 소스 인벤토리 (25분)

#### 1-1. Track1 인계 패키지 검수 (0-5분)
`TRACK2_WORKIQ_HANDOFF_PACKAGE`에서 아래 6개 필수 필드를 확인한다.

| # | 검수 필드 | 확인 내용 | 완료(Y/N) |
|---|---|---|---|
| 1 | Ontology 식별 정보 | `WORKSPACE_ID`, `ONTOLOGY_ID`, Ontology 이름 존재 |  |
| 2 | 모델 요약 | 엔터티/관계 개수, 핵심 경로 3개(예: Campaign→Order→Payment) |  |
| 3 | 매핑 근거 | `Entity -> table.column` 핵심 매핑 5개 이상 |  |
| 4 | WorkIQ 검색 키 | 캠페인명/상품명/고객등급 키워드 표기 확인 |  |
| 5 | 구현 제한 | 실제 제한과 우회안 또는 `none-known` |  |
| 6 | 의미 경로 로그 | 매핑 검토, SQL baseline, 선택 Graph 비교 링크 |  |

> 필드 누락 시 즉시 Track1 담당 팀에 보정 요청하고, 미보정 필드는 `blockingIssue`로 기록한다.

#### 1-2. 고정 키워드 5종 프로브 (5-15분)
아래 **고정 키워드 5개**로 검색 가용성을 점검한다. 5-12분은 최초 검색, 12-15분은 실패 키워드의 표기 정규화(공백/대소문자/별칭) 후 재시도에 사용한다.

| 분류 | 키워드 | 기대 소스 | 결과 건수 | 성공(Y/N) | 재시도 표기 | 최종 성공(Y/N) |
|---|---|---|---|---|---|---|
| 캠페인 | `SummerPush` | SharePoint, Outlook |  |  |  |  |
| 캠페인 | `VIPRetention` | Outlook, SharePoint |  |  |  |  |
| 상품 | `AeroPhone X` | Teams, Outlook |  |  |  |  |
| 상품 | `SmartWatch Pro` | Teams |  |  |  |  |
| 고객 맥락 | `Platinum` | Outlook, OneDrive |  |  |  |  |

- **기본 경로(제공 커넥터/UI)**: WorkIQ 검색 화면에 키워드를 입력하고, 반환된 항목의 소스 유형·제목·수정일을 기록한다.
- **선택 경로(Microsoft Graph Search API)**: 커스텀 검증이 필요할 때만 사용한다. 요청 구조는 임의로 확장하지 않고 [Track4 Appendix](../track4/docs/Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md)에 정의된 workshop adapter 경계를 따른다.
  ```json
  {
    "requests": [
      {
        "entityTypes": ["driveItem", "message"],
        "query": { "queryString": "AeroPhone X" },
        "from": 0,
        "size": 10
      }
    ]
  }
  ```

합격 기준: **5개 중 4개 이상 최종 성공**. 실행 후 아래 로그를 남긴다.

```text
[TRACK2_KICKOFF_CHECK]
team=<팀명>
ontologyId=<GUID>
keywordProbe=<5개 중 성공 n개>
failedKeywords=<키워드 목록 또는 ->
immediateAction=<정규화/권한/범위 조치>
[/TRACK2_KICKOFF_CHECK]
```

#### 1-3. M365 소스 인덱스 범위 확인 (15-25분)
4대 소스별로 접근/검색 가능 여부를 확인하고 인덱스 카탈로그를 작성한다.

강사가 제공한 `TRACK2_SEED_READINESS`에서 정상 운영 기준(SharePoint 6/Outlook 5/Teams 5/OneDrive 3)과 fallback 사용 여부를 먼저 확인한다. 참가자는 시드 전체를 직접 생성하지 않지만, 검색 결과의 제목·본문·작성자·시각·원본 링크/ID가 실제로 조회되는지 표본 검수한다.

확장 패키지를 사용한 경우 [content_manifest.csv](./data/generated/manifests/content_manifest.csv)의 60개 업무 항목을 인덱스 모집단으로 사용한다. Teams는 스레드 18개와 내부 메시지 55개를 구분해 기록한다.

| 소스 | 확인 대상(샘플) | 접속/검색 방식 | 최소 1건 성공(Y/N) | 필터/범위 | 비고 |
|---|---|---|---|---|---|
| Outlook | 리더십 배포 리스트 메일함 | 제공 커넥터 검색 |  |  |  |
| Teams | CS 티어2 대응 채널 | 제공 커넥터 검색 |  |  |  |
| SharePoint | 캠페인 기획서/성과 리포트 사이트 | 제공 커넥터 검색 |  |  |  |
| OneDrive | 고객사 미팅 노트 폴더 | 제공 커넥터 검색 |  |  |  |

**인덱스 카탈로그 템플릿(제출용)**

| 소스 | 범위(사이트/폴더/채널/메일함) | 필터 조건 | 마지막 갱신 시각(KST) | 색인 문서 수(추정) |
|---|---|---|---|---|
| SharePoint |  |  |  |  |
| Outlook |  |  |  |  |
| Teams |  |  |  |  |
| OneDrive |  |  |  |  |

#### 체크
- `TRACK2_KICKOFF_CHECK` 작성 완료
- 키워드 5개 중 4개 이상 최종 성공
- 4대 소스 각 최소 1건 검색 성공
- 인덱스 카탈로그 초안 작성 완료

### 미션 2. 크로스 소스 Entity-to-Document 매핑 (25분)
1. Track1 Ontology 엔터티(캠페인/상품/고객등급)마다 M365 문서를 **최소 1건** 연결한다.
2. Q3 핵심 3개 상품(AeroPhone X, SmartWatch Pro, UltraBook 15)은 재고/배송/CS 관련 문서를 **각 2건 이상** 연결한다.
3. 표기 불일치(오탈자/별칭)가 발견되면 정규화 방법과 함께 기록한다.

**교차 매핑표 템플릿**

| 엔터티 유형 | 엔터티 값 | 매칭 문서 제목 | 소스 | 문서 링크/ID | 매칭 상태 | 비고 |
|---|---|---|---|---|---|---|
| 캠페인 | SummerPush | SummerPush 캠페인 킥오프 기획서 | SharePoint |  | 정확 |  |
| 캠페인 | SummerPush | SummerPush 중간 성과 리포트 | SharePoint |  | 정확 |  |
| 캠페인 | VIPRetention | VIPRetention 대상 고객 이탈 경고 | Outlook |  | 정확 |  |
| 캠페인 | FlashWeek | FlashWeek 프로모션 정산 검토 | SharePoint |  | 정확 |  |
| 캠페인 | BackToSchool | BackToSchool 캠페인 사전 준비 체크리스트 | SharePoint |  | 정확 |  |
| 상품 | AeroPhone X | CS 티어2 - AeroPhone X 배송 지연 클레임 | Teams |  | 정확 |  |
| 상품 | AeroPhone X | 결제 실패 급증 관련 결제팀 회신 | Outlook |  | 정확 |  |
| 상품 | SmartWatch Pro | CS 티어2 - SmartWatch Pro 재고 문의 폭증 | Teams |  | 정확 |  |
| 상품 | SmartWatch Pro | 재고팀 - AeroPhone X/SmartWatch Pro 품절 임박 | Teams |  | 정확 |  |
| 상품 | UltraBook 15 | 물류 - UltraBook 15 배송 지연 공지 | Teams |  | 정확 |  |
| 상품 | UltraBook 15 | UltraBook 15 재고 부족 대응 플레이북 | SharePoint |  | 정확 |  |
| 상품 | DailyTee Cotton | 고객사 미팅 노트 - 반품 급증 상품군 | OneDrive |  | 정확 |  |
| 고객등급 | Platinum | VIPRetention 대상 고객 이탈 경고 | Outlook |  | 정확 |  |

> 위 예시는 [Track1_WorkIQ_Seed_Content_Specification.md](../track1/docs/Track1_WorkIQ_Seed_Content_Specification.md) 시드 콘텐츠를 기준으로 한 출발점입니다. 실제 검색 결과의 문서 링크/ID와 매칭 상태(정확/부분/실패)를 팀별로 채워 넣으세요.

#### 체크
- 캠페인 4개, 상품 5개, 고객등급 1개 — 엔터티별 최소 1건 매핑(총 10건 이상)
- Q3 핵심 상품 3종(AeroPhone X, SmartWatch Pro, UltraBook 15) 각 2건 이상
- 표기 불일치 사례 최소 1건 기록(정규화 방법 포함)

#### 자동 검증(선택)
교차 매핑표를 CSV로 저장했다면 아래 스크립트로 체크 조건을 자동 판정할 수 있다.

```bash
python track2/data/verify_entity_document_mapping.py \
  --mapping-csv ./mapping_result.csv \
  --manifest-csv ./track2/data/generated/manifests/content_manifest.csv
```

- FAIL 시 누락된 조건(엔터티 커버리지, 핵심 상품 건수, 정규화 사례)이 출력된다.
- `--json-output` 옵션으로 검증 리포트를 파일로 저장할 수 있다.

### 미션 3. 품질 8대 항목 규칙 실행 (35분)
정형(Fabric) + 비정형(WorkIQ) 확장판 품질 8대 항목을 실행하고 항목별 증적을 확보한다. 상세 점검 절차와 예시는 [Appendix A](#appendix-a-quality-checks)를 참조한다.

| # | 항목 | Fabric 측면 | WorkIQ 측면 |
|---|---|---|---|
| 1 | 정확성 | 지표 값 계산 정확성 | 문서 인용의 사실 정확성 |
| 2 | 완전성 | 필수 엔터티 값 완결성 | 관련 M365 문서 커버리지 |
| 3 | 일관성 | 코드셋 일관성 | 용어(캠페인명/상품명) 표기 일관성 |
| 4 | 유효성 | 값 유효 범위 | 문서 유형/상태 유효성 |
| 5 | 중복성 | 레코드 중복 | 문서 버전·중복 인덱싱 |
| 6 | 참조무결성 | FK 참조 | 링크된 문서 유효성(broken link) |
| 7 | 적시성 | 데이터 최신성 | 문서 최신성/보존 정책 |
| 8 | 추적성 | Fabric lineage | WorkIQ 원본 링크 보존 |

**증적 수집표(35분, 항목당 약 4분 + 버퍼 3분)**

| # | 항목 | 점검 방법(기본: 제공 커넥터/UI) | 증적(캡처/링크/검색결과 수) | 잠정 이슈 |
|---|---|---|---|---|
| 1 | 정확성 |  |  |  |
| 2 | 완전성 |  |  |  |
| 3 | 일관성 |  |  |  |
| 4 | 유효성 |  |  |  |
| 5 | 중복성 |  |  |  |
| 6 | 참조무결성 |  |  |  |
| 7 | 적시성 |  |  |  |
| 8 | 추적성 |  |  |  |

#### 체크
- 8대 항목 각각 최소 1개 증적 확보
- 항목별 잠정 이슈(있다면) 기록

### 미션 4. 점수화 및 리포트 + Track3 WebIQ 인계 (25분)
1. **스코어링 워크시트** 작성: 항목별 `0/25/50/75/100` 점수 부여, PASS(≥75) 여부 판정.
2. 8개 항목 평균 점수 계산, PASS 개수 확인, DoD(8개 중 6개 이상 PASS) 충족 여부 판정.
3. 미달 항목(75점 미만)에 대해 우선 조치안을 작성한다.
4. `TRACK3_WEBIQ_HANDOFF_PACKAGE`를 작성해 Track3 WebIQ에 제출한다. Track3는 이 WorkIQ 패키지와 공개 citation을 분리해 검토한 뒤 `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE`를 Track4 FoundryIQ에 전달한다.

**품질 스코어링 워크시트**

| # | 항목 | 점수(0/25/50/75/100) | PASS(≥75) Y/N | 근거(쿼리/검색결과/링크) | 조치안(미달 시) |
|---|---|---|---|---|---|
| 1 | 정확성 |  |  |  |  |
| 2 | 완전성 |  |  |  |  |
| 3 | 일관성 |  |  |  |  |
| 4 | 유효성 |  |  |  |  |
| 5 | 중복성 |  |  |  |  |
| 6 | 참조무결성 |  |  |  |  |
| 7 | 적시성 |  |  |  |  |
| 8 | 추적성 |  |  |  |  |
| — | **평균 점수** | `=SUM(점수)/8` | — | — | — |
| — | **PASS 개수** |  | `__/8` (DoD: ≥6) | — | — |

> 판정 기준: 100=오류 없음·근거 재현 가능 / 75=경미한 오류 있으나 분석·인용 가능(PASS) / 50=부분 사용 가능(보정·경고 필요) / 25=중대한 결함(제한적 사용) / 0=검증 불가·사용 불가.

#### 체크
- 스코어링 워크시트 8개 항목 모두 채점 완료
- PASS 개수 ≥ 6/8 확인 (미충족 시 조치안 최소 2건 작성)
- `TRACK3_WEBIQ_HANDOFF_PACKAGE` 제출 완료(Track3 WebIQ 입력용 내부 근거 링크 5건, 재현 질의 3개 포함)

## 제출물
1. `TRACK2_KICKOFF_CHECK` 로그
2. M365 소스 인덱스 카탈로그
3. 엔터티-문서 교차 매핑표
4. 품질 8대 항목 증적 수집표
5. 품질 스코어링 워크시트
6. `TRACK3_WEBIQ_HANDOFF_PACKAGE`(아래 템플릿)

## Track3 WebIQ 시작 입력 패키지 (필수, 10분 이내 작성)

Track2 산출물을 **먼저 Track3 WebIQ가 사용**하도록 아래 항목을 한 번에 정리해 전달합니다. `[TRACK3_WEBIQ_HANDOFF_PACKAGE]` marker는 Track3 WebIQ 입력용 WorkIQ 인계 계약입니다. Track3는 이 내부 근거와 별도로 공개 URL citation을 검토하고, 둘을 섞지 않은 `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE`를 Track4 FoundryIQ에 전달합니다.

| 인계 항목 | 필수 내용 |
|---|---|
| 인덱스 카탈로그 | 소스별 범위/필터/갱신 시각 |
| 품질 점수 리포트 | 8대 항목 점수 + 미달 항목 |
| 근거 링크 샘플 | 유효 링크 최소 5건 |
| 우선 조치 이슈 | 이후 WebIQ/FoundryIQ 결합 품질에 영향 주는 WorkIQ 이슈 Top3 |
| 검색 재현 세트 | 동일 결과를 재현할 수 있는 질의 3개 |

복붙 템플릿:
```text
[TRACK3_WEBIQ_HANDOFF_PACKAGE]
team=<팀명>
handoffAtKst=<YYYY-MM-DD HH:MM>
indexCatalogRef=<경로/문서>
qualityScoreSummary=<정확성:점수, ...>
failedQualityItems=<항목1;항목2 또는 ->
evidenceLinks=<URL1;URL2;URL3;URL4;URL5>
priorityIssues=<이슈1|영향|임시조치; 이슈2|영향|임시조치; 이슈3|영향|임시조치>
reproQueries=<질의1;질의2;질의3>
[/TRACK3_WEBIQ_HANDOFF_PACKAGE]
```

## 참가자 자가점검표
| 항목 | 완료(Y/N) |
|---|---|
| Track1 인계 패키지 6개 필드 검수 완료 |  |
| 고정 키워드 5종 프로브 실행(4개 이상 성공) |  |
| 4대 M365 소스 각 최소 1건 검색 성공 |  |
| 인덱스 카탈로그 작성 완료 |  |
| 엔터티-문서 교차 매핑표 100% 작성(Q3 핵심 3상품 각 2건 이상) |  |
| 품질 8대 항목 증적 수집 완료 |  |
| 품질 스코어링 워크시트 완성, PASS ≥6/8 확인 |  |
| `TRACK3_WEBIQ_HANDOFF_PACKAGE` 작성/제출 완료 (Track3 WebIQ 입력) |  |

---

<a id="appendix-a-quality-checks"></a>
## Appendix A. 품질 8대 항목 상세 점검 절차

각 항목은 **기본 경로(제공 WorkIQ 커넥터/UI 검색)** 로 먼저 수행하고, 정밀 검증이 필요할 때만 **선택 경로(Microsoft Graph Search API)** 를 사용합니다. 두 경로는 명확히 분리해서 기록하며, 문서에 정의되지 않은 CLI 명령이나 API 엔드포인트를 임의로 가정하지 않습니다. Graph Search API와 Track4 adapter의 역할 경계는 [Track4 Appendix](../track4/docs/Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md)를 따릅니다.

### A-1. 정확성
- 기본 경로: 매칭된 문서 본문의 날짜/채널/수치 언급이 Track1 정형 데이터(Ontology 매핑 근거)와 일치하는지 대조한다.
- 선택 경로: Graph Search API 응답의 `summary`/`fields` 값을 Fabric 조회 결과와 프로그램적으로 비교한다.
- 증적: 문서 캡처 + 대조한 정형 값(테이블.컬럼)을 나란히 기록.

### A-2. 완전성
- 기본 경로: 미션2 교차 매핑표에서 엔터티별 매칭 문서 수를 집계한다.
- 증적: 매핑 커버리지(엔터티 수 대비 매칭 성공 수) 비율.

### A-3. 일관성
- 기본 경로: 동일 엔터티가 문서마다 다른 표기(대소문자/공백/별칭)로 나타나는 사례를 수집한다.
- 증적: 표기 불일치 사례 캡처 + 정규화 규칙(예: 공백 제거, 소문자 통일).

### A-4. 유효성
- 기본 경로: 검색 결과 문서의 유형(정식본/초안), 상태(게시/보관)가 활용 목적에 유효한지 확인한다.
- 증적: 문서 메타데이터(유형/상태) 캡처.

### A-5. 중복성
- 기본 경로: 동일 주제의 문서가 여러 버전/사본으로 중복 색인되었는지 검색 결과 목록에서 확인한다.
- 증적: 중복 문서 목록(제목/링크 2건 이상).

### A-6. 참조무결성
- 기본 경로: 문서 내부에 포함된 링크(다른 SharePoint 페이지/문서 참조)를 열어 broken link 여부를 확인한다.
- 증적: 클릭 테스트 결과(성공/실패) + 실패 링크 URL.

### A-7. 적시성
- 기본 경로: 문서의 마지막 수정일이 이슈 발생 시점(2026-05 중순)과 정합하는지, 보존 정책상 최신 상태인지 확인한다.
- 증적: 마지막 수정일 캡처.

### A-8. 추적성
- 기본 경로: 검색 결과에서 원본 문서로 이동하는 링크가 보존되어 있는지 확인한다.
- 선택 경로: Graph Search API 응답의 원본 리소스 URL 필드가 유효한지 확인한다.
- 증적: 원본 링크 URL 캡처.

## Appendix B. 트러블슈팅

| 증상 | 원인 후보 | 우선 조치 | 전환 기준 |
|---|---|---|---|
| WorkIQ 검색 0건 | 권한 미승인 / 인덱스 범위 밖 / 표기 불일치 | 권한 → 범위 → 표기 순으로 점검 | 10분 초과 시 시드 검색 결과(사전 캡처본) 사용 |
| Track1 인계 패키지 필드 누락 | Track1 마감 지연 | Track1 담당 팀에 즉시 보정 요청 | 5분 내 미보정 시 임시값으로 진행하고 `blockingIssue`에 기록 |
| 키워드 프로브 5개 중 4개 미달 | 오탈자/별칭/권한 범위 문제 | 표기 정규화 후 재시도(공백/대소문자/별칭) | 재시도 후에도 미달 시 시드 콘텐츠 명세 기준 결과로 대체하고 이슈 기록 |
| 특정 소스(예: Teams)만 검색 실패 | 해당 커넥터 권한/스코프 누락 | 관리자 동의 상태 확인, 앱 권한 재확인 | 10분 초과 시 해당 소스는 "제한적 사용" 표기 후 진행 |
| 품질 항목 점수 판단 곤란 | 증적 부족 | 동일 항목에 대해 문서 2건 이상 재검색 | 시간 초과 시 50점(부분 사용 가능)으로 잠정 처리 후 조치안에 재검증 예정 명시 |
| Graph Search API 401/429 | 토큰 만료/스로틀링 | 토큰 재발급, `Retry-After` 준수 후 재시도 | 3회 실패 시 기본 경로(UI 커넥터)로 전환 |

## Appendix C. 프라이버시 및 ACL 가이드
1. **샘플/격리 테넌트만 사용**한다. 실제 임직원 메일·채팅·문서를 색인하거나 검색 대상으로 삼지 않는다.
2. **권한 최소화**: WorkIQ/Graph 접근 권한은 실습에 필요한 범위(Mail.Read, Files.Read.All, ChannelMessage.Read.All, Sites.Read.All 등)로 제한한다.
3. **ACL 기반 노출(Security trimming) 확인(간이)**: 가능하다면 동일 키워드를 서로 다른 팀 계정으로 검색해 결과 차이가 권한에 따라 발생하는지 관찰하고, 참조무결성/유효성 항목의 근거로 활용한다. 정식 ACL 회귀 점검은 승인된 테넌트에서 Track2 참가자·제한 테스트 계정으로 수행하고, 결과를 WorkIQ 증적으로 기록한다.
4. **불필요한 민감 정보 미수집**: 증적 캡처 시 실제 개인정보가 포함되지 않도록 샘플 콘텐츠 범위 내에서만 캡처한다.
5. **데이터 보존 정책 연계**: 적시성 항목 점검 시, 문서 보존/폐기 정책 대상 여부를 함께 확인한다.
