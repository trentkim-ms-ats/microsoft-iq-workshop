# Track3 실습 준비물 상세 설명 (FoundryIQ)

이 문서는 Track 3(FoundryIQ: 에이전트 구축/평가) 실습 준비물을 정리합니다.

관련 자료:
- [WORKBOOK.md](WORKBOOK.md)
- [Track3_FoundryIQ_Introduction_and_Technical_Guide.md](./docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)
- [Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md](./docs/Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md)
- [track3/data/README.md](./data/README.md)
- [track3/data/Track3_Mission_Workbench.ipynb](./data/Track3_Mission_Workbench.ipynb)
- [track3/data/Track3_EndToEnd_Learner_Notebook.ipynb](./data/Track3_EndToEnd_Learner_Notebook.ipynb)
- [Instructor_Day_of_Operations_Checklist.md](../common/docs/Instructor_Day_of_Operations_Checklist.md)

## 0) Track3 시작 입력 계약 (Track2 인계)

Track3는 아래 인계 패키지가 준비되어야 시작합니다.

| 필수 입력 | 내용 |
|---|---|
| WorkIQ 인덱스 카탈로그 | 소스 범위/필터/갱신 시각 |
| 품질 점수 리포트 | 8대 항목 점수 + 미달 항목 |
| 근거 링크 샘플 | 유효 링크 5건 이상 |
| 우선 조치 이슈 | Track3 응답 정확도에 영향 주는 이슈 Top3 |
| 재현 질의 세트 | 동일 결과 재현용 질의 3개 |

참조:
- [PREREQUISITES.md](../track2/PREREQUISITES.md) (`TRACK3_HANDOFF_PACKAGE`)
- [WORKBOOK.md](../track1/WORKBOOK.md) (Ontology 경로/질문 정의)

## 1) 핵심 준비물

| 항목 | 설명 |
|---|---|
| Azure AI Foundry 프로젝트 | 팀별 또는 공용 프로젝트, 모델 배포 권한 포함 |
| 모델 배포 | Responses API를 지원하는 chat/reasoning 모델 최소 1개. embedding 모델은 별도 벡터 인덱스를 직접 구성할 때만 필요 |
| FabricIQ 연결 정보 | Track 1 정형 질의를 워크숍 JSON 계약으로 변환하는 adapter endpoint |
| WorkIQ 인덱스 연결 | Track 2 M365 검색 결과를 워크숍 JSON 계약으로 변환하는 adapter endpoint |
| 프롬프트 템플릿 | 시나리오 3종(검색/질의/생성) 기본 프롬프트 세트 |
| 평가 루브릭 시트 | 근거성/환각율/실행가능성 채점 표 |

## 2) Track3 시작 시나리오 (첫 15분)

1. Track2 인계 패키지 로드  
2. Foundry에서 Tool A(FabricIQ) 단독 헬스체크  
3. Foundry에서 Tool B(WorkIQ) 단독 헬스체크  
4. 표준 질문 Q1을 A/B 각각 실행해 근거 링크 유효성 확인  
   - `결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?`
5. 시작 로그 기록

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

`aclCheck` 값은 Track2의 ACL 점검 결과를 기준으로 기록합니다. 권장 자동 검증 스크립트: `track2/data/validate_acl_setup.py`.

## 2-1) 권장 실행 질문 세트

실습 중에는 [WORKBOOK.md](WORKBOOK.md)의 **실행용 샘플 질문 세트**를 사용합니다.  
운영 기준은 아래 표준 질문 3개이며, 확장 질문은 비교/심화 실습용입니다.

### 표준 질문
- Q1: `결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?`
- Q2: `배송 지연은 반품률과 고객 불만 티켓에 어떤 영향을 미치는가?`
- Q3: `Q3 핵심 상품 3종의 매출/반품 신호를 어떻게 해석할 것인가?`

### 확장 질문 예시
- `어떤 프로모션 전략이 매출 상승과 반품 리스크를 동시에 유발하는가?`
- `품절 경험이 많은 상품군에서 주문 취소와 문의가 동시에 증가했는가?`
- `재고 이슈가 캠페인 성과 저하와 연결되는가?`
- `Platinum 고객과 일반 고객의 반품 사유 패턴은 어떻게 다른가?`
- `어떤 채널에서 특정 반품 사유가 반복되며, 이후 재구매율은 어떻게 변하는가?`

## 3) 사전 점검 체크리스트

- [ ] Azure AI Foundry 프로젝트에 모델 최소 1개 배포 성공
- [ ] Foundry Responses API endpoint/model/auth 테스트 호출 성공
- [ ] FabricIQ adapter 테스트 쿼리와 source trace 확인
- [ ] WorkIQ adapter 검색과 ACL 적용 링크 확인
- [ ] 팀별 프롬프트 템플릿·평가표 배포 완료
- [ ] 결과 응답에 근거 링크(정형/비정형) 포함 확인
- [ ] Track2 인계 패키지 검수 완료

## 4) 운영 주의사항

- 모델 쿼터/속도 제한 대비 대체 모델 준비
- 프롬프트/모델 변경 시 회귀 평가 실행
- 근거 없는 단정 응답 방지를 위한 출력 가드레일 적용
- Track2 품질 미달 항목을 프롬프트에 경고 컨텍스트로 반영(예: 링크 신뢰도 낮음)

### 실행 모드와 live adapter 계약

| 모드 | 용도 | 정형/비정형 소스 |
|---|---|---|
| `simulation` | 오프라인 교육·재현·회귀 테스트 | Track1 CSV / Track2 manifest |
| `live` | 실제 연결 검증 | `FABRICIQ_ENDPOINT` / `WORKIQ_ENDPOINT` |

두 endpoint는 원시 Fabric/WorkIQ URL이 아니라 `scenarioId`, `question`, `semanticKeys`를 받는 POST JSON adapter입니다. FabricIQ 응답은 `structuredMetrics`, `highlights`, `sourceTrace`를, WorkIQ 응답은 `evidenceLinks`, `sourceCoverage`, `sourceTrace`를 반환해야 합니다. 인증·ACL·schema 오류는 빈 성공 응답으로 숨기지 않습니다.

Foundry Responses API 환경변수:

- `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`
- `AZURE_AI_FOUNDRY_MODEL`
- `AZURE_AI_FOUNDRY_API_KEY` 또는 `AZURE_AI_FOUNDRY_BEARER_TOKEN`

JWT 액세스 토큰은 Bearer 변수에만 넣고, 노트북/문서/리포트에 값을 저장하지 않습니다.

### simulation reference 자동화 체크(매일 아침 브리핑)

| 항목 | 권장 기준 |
|---|---|
| 스케줄 | 평일 08:30 KST |
| 실행 체인 | generate → simulate(normal) → evaluate(strict) → briefing 전달 |
| 전달 채널 | Teams 또는 Outlook (리더십 배포 목록 고정) |
| 실패 처리 | strict 실패 시 발송 중단 + 운영 채널 알림 |
| 보관 | `generated/reports/` + `generated/responses/` 30일 이상 |

권장 실행 스크립트: [run_track3_daily_briefing.py](../tools/run_track3_daily_briefing.py)

> 이 스크립트는 simulation reference 체인입니다. live 운영은 FabricIQ/WorkIQ adapter를 호출하는 실행 서비스를 별도로 배포한 뒤 같은 평가·발송 정책을 적용합니다.

스케줄러 템플릿:
- cron: [track3-daily-briefing.cron](../tools/templates/cron/track3-daily-briefing.cron)
- GitHub Actions: [track3-daily-briefing.yml](../.github/workflows/track3-daily-briefing.yml)
- Logic Apps: [track3-daily-briefing.logicapp.template.json](../tools/templates/logicapps/track3-daily-briefing.logicapp.template.json)

알림 확장 템플릿:
- cron: [track3-daily-briefing-with-notify.cron](../tools/templates/cron/track3-daily-briefing-with-notify.cron)
- GitHub Actions: [track3-daily-briefing-with-notify.yml](../.github/workflows/track3-daily-briefing-with-notify.yml)
- Logic Apps: [track3-daily-briefing-with-notify.logicapp.template.json](../tools/templates/logicapps/track3-daily-briefing-with-notify.logicapp.template.json)

알림 스크립트: [send_track3_notifications.py](../tools/send_track3_notifications.py)

### 버전 관리 체크(회귀 추적 필수)

`run_track3_simulation.py` 실행 시 아래 버전을 반드시 지정해 실행 로그에 남깁니다.

- `--pipeline-version`
- `--prompt-version`
- `--model-version`
- `--toolset-version`

이 값은 응답 JSON의 `runContext.release`에 저장되며, 품질 저하 시 변경 지점(모델/프롬프트/도구/파이프라인)을 빠르게 식별하는 기준이 됩니다.

### 공통 fallback 정책
1. 일시 오류/429/5xx: 초기 호출 후 5초, 10초, 20초 간격으로 최대 3회 재시도(총 최대 4회 시도)
2. Tool A만 실패: WorkIQ 근거만 제공하되 `정형 수치 미검증` 경고 표시
3. Tool B만 실패: FabricIQ 수치만 제공하되 `업무 문서 근거 없음` 경고 표시
4. 둘 다 실패: 답변 생성을 중단하고 차단 원인/조치만 반환
5. 부분응답은 최종 평가에서 PASS로 처리하지 않으며, 복구 후 재실행

## 5) Track3 종료 시 제출 품질 기준(요약)

| 항목 | 최소 기준 |
|---|---|
| 검색 시나리오 | Tool A/B 각각 1건 이상 재현 성공 |
| 질의 시나리오 | 정형 수치 + 비정형 근거 링크 동시 포함 |
| 생성 시나리오 | 리더십 브리핑 문단 + 조치안 + 출처 링크 |
| 평가 결과 | 환각/근거 누락 사유를 로그로 남김 |

## 6) 키 입력 없는 로컬 자동 검증 경로(권장)

실습 환경 권한 이슈가 있거나 참가자 사전 리허설이 필요하면 아래 로컬 경로를 사용합니다.

```bash
cd track3/data
python generate_track3_samples.py
python run_track3_simulation.py --all --mode normal
python run_track3_simulation.py --scenario-id Q1 --mode tool-a-down
python run_track3_simulation.py --scenario-id Q1 --mode tool-b-down
python run_track3_simulation.py --scenario-id Q1 --mode both-down
python evaluate_track3_outputs.py --strict
```

최종 리포트: JSON(`generated/reports/evaluation_report.json`) 저장 직후 동일 내용의 Markdown(`generated/reports/evaluation_report.md`)이 함께 생성됩니다.

노트북 경로: [Track3_Mission_Workbench.ipynb](./data/Track3_Mission_Workbench.ipynb)

> 학습자용 end-to-end 노트북(스크립트 로직을 셀로 이식): [Track3_EndToEnd_Learner_Notebook.ipynb](./data/Track3_EndToEnd_Learner_Notebook.ipynb)
