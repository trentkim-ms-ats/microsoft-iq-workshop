# 트랙3 실습지(참가자용) v1.0

- 트랙명: Track 3 — FoundryIQ 에이전트 오케스트레이션 + 통합 응답 평가
- 3-IQ 통합 스택 내 위치: **FoundryIQ 구축 단계**. Track1(FabricIQ 정형 지표) + Track2(WorkIQ 비정형 근거)를 결합해 운영형 리더십 브리핑 응답을 만든다.
- 총 시간: 100분 (휴식 없이 연속 진행)
- 권장 시간대: 14:40-16:20
- 대상: Track2 인계 패키지를 전달받은 참가자

## 참고 자료
- Track3 실습 준비물 상세: [PREREQUISITES.md](PREREQUISITES.md)
- FoundryIQ 기술 가이드: [Track3_FoundryIQ_Introduction_and_Technical_Guide.md](./docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)
- FabricIQ 운영형 검증 부록: [Track3_Appendix_FabricIQ_Operational_Agent_Validation_Guide.md](./docs/Track3_Appendix_FabricIQ_Operational_Agent_Validation_Guide.md)
- 발표용 1장 요약 슬라이드 원고: [Track3_OneSlide_Executive_Summary.md](./docs/Track3_OneSlide_Executive_Summary.md)
- WorkIQ/Graph 검색 API 부록: [Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md](./docs/Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md)
- Track2 인계 계약(입력 패키지 기준): [PREREQUISITES.md](../track2/PREREQUISITES.md)
- Track3 자동 실행 샘플(데이터/스크립트/노트북): [track3/data/README.md](./data/README.md)
- Track3 미션 워크벤치 노트북: [track3/data/Track3_Mission_Workbench.ipynb](./data/Track3_Mission_Workbench.ipynb)
- Track3 학습자용 End-to-End 노트북(스크립트 로직을 셀로 이식): [track3/data/Track3_EndToEnd_Learner_Notebook.ipynb](./data/Track3_EndToEnd_Learner_Notebook.ipynb)
- 통합 계획(전체 시간/트랙 목적): [Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](../common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)

## 실습 목표
1. Track2 인계 패키지를 15분 내 검수하고 Tool A/B 단독 헬스체크를 완료한다.
2. FoundryIQ 에이전트 라우팅 정책(정형 우선 + 비정형 결합)을 구성한다.
3. 표준 질문(Q1~Q3)에 대해 정형 수치 + 비정형 근거 링크를 결합한 통합 응답을 생성한다.
4. fallback/부분응답 정책을 검증하고 Track3 운영 로그를 완성한다.

### 3-IQ 역할을 먼저 고정하기

| 계층 | 이 실습에서의 책임 | 결과가 잘못될 때 먼저 볼 곳 |
|---|---|---|
| FabricIQ | Ontology 경로를 따라 정형 지표 계산 | 지표 정의, 엔터티 키, 관계 매핑 |
| WorkIQ | ACL이 적용된 M365 업무 근거 검색 | 인덱스 범위, 권한, 최신성 |
| FoundryIQ | 두 결과 라우팅·결합·평가·최종 문장화 | 프롬프트, 도구 라우팅, fallback, Responses API |

FoundryIQ가 WorkIQ 문서에서 정형값을 역산하거나, 원문에 없는 링크를 만들어서는 안 됩니다.

## 완료 기준(DoD)
1. `TRACK3_KICKOFF_CHECK` 작성 완료 — Tool A/B 단독 실행 모두 성공.
2. 표준 질문 3개(Q1~Q3) 통합 실행 완료 — 각 질문 응답에 **정형 핵심 지표 1개 이상 + 근거 링크 2개 이상** 포함.
3. fallback 시나리오 3종(`tool-a-down`, `tool-b-down`, `both-down`) 실행 및 정책 일치 확인.
4. `TRACK3_RUN_RESULT` 제출 — 시나리오별 결과 상태(pass/partial/blocked)와 조치 로그 포함.
5. 최종 브리핑 1건 제출 — 요약 + 조치안 + 출처 링크.

> 로컬 자동 실행 경로(아래)를 사용하면 이 브리핑의 **초안**(`generated/reports/leadership_briefing.md`)을 규칙 기반으로 먼저 만들어보고, 이를 바탕으로 FoundryIQ 에이전트에서 최종 문장을 다듬어 제출할 수 있습니다.

## 실습 준비물
| 항목 | 설명 |
|---|---|
| Azure AI Foundry 프로젝트 | 팀별 또는 공용 프로젝트 (모델 배포 권한 포함) |
| Tool A(FabricIQ) 연결 정보 | SQL endpoint 또는 Fabric AI skill URL |
| Tool B(WorkIQ) 연결 정보 | WorkIQ 커넥터 또는 Graph Search 호출 경로 |
| Track2 인계 패키지 | 인덱스 카탈로그, 품질 점수, 링크 샘플, 재현 질의 |
| 프롬프트 템플릿 | 검색/질의/생성 3종 템플릿 |
| 평가 루브릭 | 정확도/근거성/환각률/실행가능성 채점표 |
| 로컬 자동검증 경로(권장) | [track3/data/README.md](./data/README.md)의 스크립트 + 노트북 |

> 실습 준비물 상세는 [PREREQUISITES.md](PREREQUISITES.md)를 따른다.

## 중간 점검 타임마커
- **T+15 (미션1 종료)**
  - Track2 인계 패키지 검수 완료
  - Tool A/B 단독 헬스체크 완료
- **T+60 (미션2 종료)**
  - 에이전트 라우팅/출력 형식 v0.1 고정
  - Q1 통합 응답 초안 생성
- **T+85 (미션3 종료)**
  - Q1~Q3 통합 응답 완료
  - fallback 시나리오 최소 2종 실행
- **T+100 (미션4 종료)**
  - 최종 브리핑 + 실행 로그 제출

## 실행용 샘플 질문 세트

Track3에서는 아래 질문을 **실제로 Tool A/B에 넣어보는 실행 질문 세트**로 사용한다.  
운영 기준 질문은 **표준 질문 Q1~Q3**이고, 시간이 남거나 비교 평가가 필요하면 확장 질문을 추가로 실행한다.

### 1) 표준 질문 Q1~Q3

| ID | 질문 | 목적 |
|---|---|---|
| Q1 | 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가? | 캠페인별 전환율과 결제 실패 패턴 비교 |
| Q2 | 배송 지연은 반품률과 고객 불만 티켓에 어떤 영향을 미치는가? | 배송 지연군의 반품/불만 신호 확인 |
| Q3 | Q3 핵심 상품 3종의 매출/반품 신호를 어떻게 해석할 것인가? | AeroPhone X, SmartWatch Pro, UltraBook 15 비교 |

### 2) 확장 질의 질문 세트

| 분류 | 질문 | 사용 목적 |
|---|---|---|
| 프로모션 | 어떤 프로모션 전략이 매출 상승과 반품 리스크를 동시에 유발하는가? | 성과-리스크 동시 비교 |
| 재고/취소 | 품절 경험이 많은 상품군에서 주문 취소와 문의가 동시에 증가했는가? | 재고 이슈와 고객 영향 연결 |
| 재고/캠페인 | 재고 이슈가 캠페인 성과 저하와 연결되는가? | 캠페인 성과 저하 원인 탐색 |
| 고객등급 | Platinum 고객과 일반 고객의 반품 사유 패턴은 어떻게 다른가? | 고객등급별 행동 차이 분석 |
| 채널/재구매 | 어떤 채널에서 특정 반품 사유가 반복되며, 이후 재구매율은 어떻게 변하는가? | 채널별 재구매 영향 확인 |

### 3) 검색(Search) 시나리오용 질문 예시

- SummerPush 관련 메일, 회의노트, Teams 대화를 찾아줘.
- AeroPhone X 관련 문서와 이슈 스레드를 소스별로 보여줘.
- 배송 지연 또는 `LateDelivery` 관련 근거 링크를 최신순으로 찾아줘.
- Platinum 고객 맥락이 포함된 Outlook/OneDrive 문서를 찾아줘.

### 4) 생성(Generation) 시나리오용 질문 예시

- 오늘 아침 리더십 브리핑 형식으로 매출 하락 원인과 대응안을 요약해줘.
- Q3 핵심 상품 3종의 리스크와 즉시 조치안을 1페이지 브리핑으로 작성해줘.
- 배송 지연·반품·고객 불만 이슈를 묶어서 운영진 업데이트 문안으로 정리해줘.

## 단계별 미션

### 미션 1. 킥오프 검수 + Tool A/B 헬스체크 (15분)
1. Track2 인계 패키지 5개 항목을 확인한다.
2. Tool A(FabricIQ) 단독 질의, Tool B(WorkIQ) 단독 검색을 각각 실행한다.
3. 표준 질문 Q1을 A/B 각각 실행해 기본 응답과 링크 유효성을 확인한다.

#### 킥오프 체크 템플릿
```text
[TRACK3_KICKOFF_CHECK]
team=<팀명>
toolAStatus=<ok/fail>
toolBStatus=<ok/fail>
aclCheck=<PASS/FAIL>
probeQuestion=결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?
probeResult=<pass/fail>
blockingIssue=<없음 또는 사유>
actionTaken=<재시도/권한요청/범위수정/라우팅변경 또는 ->
[/TRACK3_KICKOFF_CHECK]
```

> 권장: Track2 단계에서 생성한 ACL 점검 리포트는 `track2/data/validate_acl_setup.py`로 자동 판정하고, 그 결과를 `aclCheck`에 기록한다.

---

### 미션 2. 에이전트 정책/프롬프트 구성 (45분)
1. 시스템 프롬프트에 아래 고정 정책을 반영한다.
   - Tool A 우선 실행 후 Tool B 근거 결합
   - 근거 링크 누락 시 경고 문구 포함
   - 근거 없는 단정 금지
2. 출력 형식을 고정한다.
   - `핵심요약`, `수치근거`, `문서근거`, `조치안`, `주의사항`
3. Q1 기준으로 초안 응답을 만든 뒤, 수치/링크 누락 여부를 자체 점검한다.

#### 권장 출력 형식
```text
[TRACK3_RESPONSE]
question=<질문>
summary=<한 문단 요약>
structuredMetrics=<핵심 수치 1개 이상>
evidenceLinks=<유효 링크 2개 이상>
sourceTrace=<FabricIQ structured + WorkIQ unstructured>
actions=<즉시조치 2개 이상>
warnings=<없음 또는 경고>
[/TRACK3_RESPONSE]
```

---

### 미션 3. 통합 질의 + fallback 정책 검증 (25분)
1. Q1~Q3를 통합 실행한다.
2. 아래 fallback 시나리오를 재현해 정책 일치 여부를 확인한다.
   - `tool-a-down`: Tool A 실패, Tool B만 응답
   - `tool-b-down`: Tool B 실패, Tool A만 응답
   - `both-down`: 두 Tool 모두 실패

#### fallback 정책(고정)
| 상황 | 동작 | 사용자 표시 |
|---|---|---|
| 429/5xx/일시 오류 | 초기 호출 후 5초→10초→20초 간격 최대 3회 재시도(총 최대 4회 시도) | 재시도 중 |
| Tool A만 실패 | WorkIQ 근거만 제한 제공 | `정형 수치 미검증` |
| Tool B만 실패 | FabricIQ 수치만 제한 제공 | `업무 문서 근거 없음` |
| 두 Tool 모두 실패 | 답변 생성 중단 | 차단 원인/복구 조치 반환 |

---

### 미션 4. 생성/평가 + 제출 패키지 정리 (15분)
1. 리더십 브리핑 최종본 1건을 생성한다.
2. 시나리오별 실행 결과를 `pass/partial/blocked`로 분류한다.
3. 아래 운영 로그를 제출한다.

#### 실행 결과 로그 템플릿
```text
[TRACK3_RUN_RESULT]
team=<팀명>
scenarioQ1=<pass/partial/blocked>
scenarioQ2=<pass/partial/blocked>
scenarioQ3=<pass/partial/blocked>
fallbackToolADown=<pass/fail>
fallbackToolBDown=<pass/fail>
fallbackBothDown=<pass/fail>
finalBlockingIssue=<없음 또는 사유>
nextAction=<운영 반영할 개선안>
[/TRACK3_RUN_RESULT]
```

## 실습 검증 체크리스트
- [ ] Tool A/B 단독 헬스체크 성공
- [ ] Q1~Q3 통합 응답 생성
- [ ] 각 응답에 정형 수치 1개 이상 포함
- [ ] 각 응답에 유효 링크 2개 이상 포함
- [ ] fallback 3종 정책 일치
- [ ] 최종 브리핑 + 실행 로그 제출

## simulation reference 실행 경로(권장)
키/토큰 입력 없이 로컬에서 Track3 미션 흐름을 재현하려면 아래를 사용한다. 이 경로는 Track1 CSV와 Track2 manifest를 사용하는 **교육·회귀 테스트용 simulation**이며 실제 FabricIQ/WorkIQ 연결 성공을 의미하지 않는다.

```bash
cd track3/data
python generate_track3_samples.py
python run_track3_simulation.py --all --mode normal
python run_track3_simulation.py --scenario-id Q1 --mode tool-a-down
python run_track3_simulation.py --scenario-id Q1 --mode tool-b-down
python run_track3_simulation.py --scenario-id Q1 --mode both-down
python evaluate_track3_outputs.py --strict
```

매일 아침 reference 리포트를 자동 생성하려면 위 simulation 체인을 스케줄러에 등록할 수 있다. 실제 live 운영 배포는 [Track3_Mission_Workbench.ipynb](./data/Track3_Mission_Workbench.ipynb)의 `TRACK3_EXECUTION_MODE=live` 계약처럼 정형값을 `FABRICIQ_ENDPOINT`, 비정형 근거를 `WORKIQ_ENDPOINT`에서 조회하는 실행 서비스를 별도로 구성해야 한다.

권장 운영 스크립트: [run_track3_daily_briefing.py](../tools/run_track3_daily_briefing.py).  
예시:

```bash
python tools/run_track3_daily_briefing.py \
  --pipeline-version prod-2026-07 \
  --prompt-version p3.2 \
  --model-version foundry-responses-v1 \
  --toolset-version fabriciq-1.4+workiq-2.1
```

스케줄러 템플릿:
- cron: [track3-daily-briefing.cron](../tools/templates/cron/track3-daily-briefing.cron)
- GitHub Actions: [track3-daily-briefing.yml](../.github/workflows/track3-daily-briefing.yml)
- Logic Apps: [track3-daily-briefing.logicapp.template.json](../tools/templates/logicapps/track3-daily-briefing.logicapp.template.json)

알림 확장 템플릿(Teams/메일 포함):
- cron: [track3-daily-briefing-with-notify.cron](../tools/templates/cron/track3-daily-briefing-with-notify.cron)
- GitHub Actions: [track3-daily-briefing-with-notify.yml](../.github/workflows/track3-daily-briefing-with-notify.yml)
- Logic Apps: [track3-daily-briefing-with-notify.logicapp.template.json](../tools/templates/logicapps/track3-daily-briefing-with-notify.logicapp.template.json)

알림 스크립트: [send_track3_notifications.py](../tools/send_track3_notifications.py)

최종 리포트: `evaluate_track3_outputs.py`는 JSON(`generated/reports/evaluation_report.json`)을 먼저 저장한 뒤, 동일 내용을 사람이 읽기 쉬운 Markdown(`generated/reports/evaluation_report.md`)으로도 저장합니다.

임원용 리더십 브리핑 초안: 위 명령 실행 후 노트북에서 Q1~Q3 정상 응답을 결합해 `generated/reports/leadership_briefing.md`(Executive Summary + 수치근거 + 문서근거 + 조치안 + `[TRACK3_RESPONSE]` 제출 블록)를 자동 생성합니다.

FoundryIQ LLM 최종본(선택): `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`, `AZURE_AI_FOUNDRY_MODEL`, 그리고 `AZURE_AI_FOUNDRY_API_KEY` 또는 `AZURE_AI_FOUNDRY_BEARER_TOKEN`을 설정하면 두 노트북과 일일 배치가 Azure AI Foundry Responses API로 `generated/reports/leadership_briefing_llm.md`를 추가 생성합니다. API key는 `api-key`, Entra 액세스 토큰은 `Authorization: Bearer` 헤더에 사용하며 서로 바꾸어 넣지 않습니다. 환경변수가 없으면 rules-only 초안을 유지합니다.

운영 확장성(버전 관리): `run_track3_simulation.py` 실행 시 `--pipeline-version`, `--prompt-version`, `--model-version`, `--toolset-version`을 함께 지정하면 `generated/responses/*.json`의 `runContext.release`에 기록되어 회귀 점검에 활용할 수 있습니다.

노트북 경로: [Track3_Mission_Workbench.ipynb](./data/Track3_Mission_Workbench.ipynb)

> 스크립트 대신 노트북 하나만으로 처음부터 끝까지 실행해보고 싶다면 [Track3_EndToEnd_Learner_Notebook.ipynb](./data/Track3_EndToEnd_Learner_Notebook.ipynb)를 사용하세요. 위 4개 명령의 로직이 모두 셀로 포함되어 있습니다.
