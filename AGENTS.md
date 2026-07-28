# AGENTS.md

이 문서는 에이전트 운영용 **핵심 계약 요약본**입니다.  
상세 규칙/예시/절차는 각 트랙 문서에서 관리하며, AGENTS에는 변경 판단에 필요한 최소 기준만 유지합니다.

## 0) 최우선 원칙: 3-IQ 역할 분리

모든 변경은 아래 역할 경계를 깨지 않는지 먼저 확인합니다.

| 계층 | 책임 | 금지 |
| --- | --- | --- |
| FabricIQ | 정형 지표, Ontology 관계 경로 계산/검증 | WorkIQ 문서에서 정형 수치 역산 |
| WorkIQ | ACL 적용된 M365 근거 검색(문서/메일/대화) | FabricIQ 결과를 비정형 근거처럼 사용 |
| FoundryIQ | 라우팅/결합/평가/fallback/최종 문장화 | 근거 없는 수치·링크 생성 |

## 1) 고정 정책 (변경 금지)

- 총 운영 시간: **480분 (09:00-17:00)**
- Track2 미션 시간: **110분 (25+25+35+25)**
- Track2 품질 게이트: **8개 중 6개 이상 PASS(75점 이상)**
- Track3 fallback: **5초→10초→20초, 최대 3회 재시도(총 최대 4회 시도)** + 부분응답 정책 유지
- Track3 실행 모드:
  - `simulation`: Track1 CSV + Track2 manifest 기반 재현/회귀
  - `live`: `FABRICIQ_ENDPOINT` + `WORKIQ_ENDPOINT` adapter 호출
- `simulation` 결과를 실제 운영 호출 결과처럼 표현하지 않음

## 2) 우선 참조 문서

- [Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)
- [Track1 WORKBOOK.md](track1/WORKBOOK.md)
- [Track2 WORKBOOK.md](track2/WORKBOOK.md)
- [Track3 WORKBOOK.md](track3/WORKBOOK.md)
- [Track1 PREREQUISITES.md](track1/PREREQUISITES.md)
- [Track2 PREREQUISITES.md](track2/PREREQUISITES.md)
- [Track3 PREREQUISITES.md](track3/PREREQUISITES.md)
- [track2/data/README.md](track2/data/README.md)
- [track2/data/TRACK2_M365_Complete_Deployment_Guide.md](track2/data/TRACK2_M365_Complete_Deployment_Guide.md)
- [track3/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md](track3/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)
- [track3/data/README.md](track3/data/README.md)
- [Instructor_Day_of_Operations_Checklist.md](common/docs/Instructor_Day_of_Operations_Checklist.md)

## 3) 변경 유형별 동기화 대상 (핵심)

| 변경 유형 | 반드시 함께 점검할 문서 |
| --- | --- |
| 시간/DoD/평가 기준 변경 | [Integrated Plan](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md), [track2/WORKBOOK.md](track2/WORKBOOK.md), [track2/PREREQUISITES.md](track2/PREREQUISITES.md), [Instructor Checklist](common/docs/Instructor_Day_of_Operations_Checklist.md) |
| Track2 샘플 건수/키워드/배포 경로 변경 | [Track1 seed spec](track1/docs/Track1_WorkIQ_Seed_Content_Specification.md), [track2/WORKBOOK.md](track2/WORKBOOK.md), [track2/data/README.md](track2/data/README.md), [TRACK2 guide](track2/data/TRACK2_M365_Complete_Deployment_Guide.md) |
| Track3 질문/정책/실행 경로 변경 | [track3/WORKBOOK.md](track3/WORKBOOK.md), [track3/PREREQUISITES.md](track3/PREREQUISITES.md), [Track3 guide](track3/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md), [track3/data/README.md](track3/data/README.md), [Integrated Plan](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md) |
| Track3 노트북/Foundry 호출 계약 변경 | [Track3_Mission_Workbench.ipynb](track3/data/Track3_Mission_Workbench.ipynb), [Track3_EndToEnd_Learner_Notebook.ipynb](track3/data/Track3_EndToEnd_Learner_Notebook.ipynb), [foundry_responses.py](track3/data/foundry_responses.py), [run_track3_daily_briefing.py](tools/run_track3_daily_briefing.py), [track3/data/README.md](track3/data/README.md), [.github/workflows/track3-daily-briefing.yml](.github/workflows/track3-daily-briefing.yml), [.github/workflows/track3-daily-briefing-with-notify.yml](.github/workflows/track3-daily-briefing-with-notify.yml), [cron templates](tools/templates/cron), [logicapps templates](tools/templates/logicapps) |

## 4) Track3 호출 계약 핵심 (요약)

- `FABRICIQ_ENDPOINT`, `WORKIQ_ENDPOINT`는 원시 제품 URL이 아닌 워크숍용 POST JSON adapter 계약
- 공통 요청 키: `scenarioId`, `question`, `semanticKeys`
- FabricIQ 응답 핵심: `structuredMetrics`, `highlights`, `sourceTrace`
- WorkIQ 응답 핵심: `evidenceLinks`, `sourceCoverage`(필요 시 `sourceTrace`)
- 오류/권한 실패를 성공 모양 빈 응답으로 숨기지 않음
- 최종 문장화는 Azure AI Foundry **Responses API**만 사용:
  - `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`
  - `AZURE_AI_FOUNDRY_MODEL`
  - `AZURE_AI_FOUNDRY_API_KEY` 또는 `AZURE_AI_FOUNDRY_BEARER_TOKEN`
  - API key는 `api-key`, Entra 토큰은 `Authorization: Bearer`

상세 스키마/예시는 [track3/data/README.md](track3/data/README.md)와 [Track3_FoundryIQ_Introduction_and_Technical_Guide.md](track3/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)에서 관리합니다.

## 5) 완료 전 최소 검증 게이트

1. 로컬 Markdown 링크 깨짐 0건
2. Python 문법 검사 통과
3. Track2 생성 가능: `npm run generate`
4. Track2 배포 dry-run 통과: `python deploy_m365_samples.py --config ...`
5. Track3 생성/시뮬레이션/엄격평가 통과:
   - `python track3/data/generate_track3_samples.py`
   - `python track3/data/run_track3_simulation.py --all --mode normal`
   - `python track3/data/evaluate_track3_outputs.py --strict`
6. Track3 일일 브리핑: Responses 미설정 시 rules-only, 설정 시 `leadership_briefing_llm.md` 생성
7. YAML/JSON 구문 검사 통과 (GitHub Actions, Logic Apps 템플릿)
8. 소스/문서/노트북에 토큰·키 하드코딩 0건

## 6) 보안/운영 원칙

- 샘플/격리 테넌트만 사용
- 실제 임직원 데이터 전제 금지
- 시크릿은 코드/문서/산출물에 하드코딩하지 않음
- 노출된 토큰은 즉시 폐기·재발급
- 실패 시 우회 경로와 재검증 방법을 기록

---

운영 규칙 추가가 필요하면 AGENTS에는 **핵심 계약만** 반영하고, 상세 절차는 각 트랙 문서에 기록한 뒤 링크로 연결합니다.
