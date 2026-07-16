# AGENTS.md

이 저장소에서 작업하는 에이전트를 위한 운영 기준입니다.  
목표는 **Track1 → Track2 → Track3 실습이 끊기지 않도록** 문서·데이터·도구를 일관되게 유지하는 것입니다.

## 0) 최우선 목표: 3-IQ를 설명하고 증명하는 워크숍

모든 변경은 참가자가 아래 세 질문에 답할 수 있게 하는지를 우선 판단합니다.

1. **FabricIQ는 무엇을 책임지는가?** 정형 지표와 Ontology 관계 경로를 계산·검증한다.
2. **WorkIQ는 무엇을 책임지는가?** 권한이 적용된 M365 업무 맥락과 원문 근거를 찾는다.
3. **FoundryIQ는 무엇을 책임지는가?** 두 소스를 라우팅·결합하고 품질·fallback 정책을 적용해 근거 있는 응답을 만든다.

핵심 계약:

| 계층 | 허용되는 기준 소스 | Track3에서 금지되는 대체 |
| --- | --- | --- |
| FabricIQ | 정형 수치, Ontology 엔터티/관계 | WorkIQ 문서에서 정형 수치를 역산 |
| WorkIQ | SharePoint/OneDrive/Outlook/Teams 근거와 ACL | FabricIQ 결과를 비정형 근거처럼 사용 |
| FoundryIQ | 오케스트레이션, Responses API 최종 문장화, 평가/fallback | 근거 없는 수치·링크 생성 |

Ontology는 세 계층이 동일한 캠페인·제품·고객·거래를 가리키게 하는 공통 어휘입니다.

## 1) 저장소 구조(현재 기준)

- 문서:
  - 공통: `common/docs/`
  - Track1: `track1/docs/`
  - Track2: `track2/docs/`
  - Track3: `track3/docs/`
- 샘플 데이터:
  - Track1: `track1/data/`
  - Track2: `track2/data/`
  - Track3: `track3/data/`
- Ontology 번들: `track1/ontology_bundle/`
- 유틸 스크립트: `tools/`
- 보관 자료: `archive/`

## 2) 기준 문서(우선 참조)

- [Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)
- [WORKBOOK.md](track1/WORKBOOK.md)
- [WORKBOOK.md](track2/WORKBOOK.md)
- [WORKBOOK.md](track3/WORKBOOK.md)
- [PREREQUISITES.md](track3/PREREQUISITES.md)
- [track3/data/README.md](track3/data/README.md)
- [Instructor_Day_of_Operations_Checklist.md](common/docs/Instructor_Day_of_Operations_Checklist.md)

## 3) 고정 정책(변경 금지 기준)

- 총 시간: **480분 (09:00-17:00)**
- Track2 미션 시간: **110분 (25+25+35+25)**
- Track2 품질 게이트: **8개 항목 중 6개 이상 PASS(75점 이상)**
- Track3 fallback: **초기 호출 후 5초→10초→20초 간격으로 최대 3회 재시도(총 최대 4회 시도)** + 부분응답 정책 유지
- Track3 실행 모드:
  - `simulation`: Track1 CSV와 Track2 manifest를 이용한 재현·교육·회귀 테스트
  - `live`: 정형값은 `FABRICIQ_ENDPOINT`, 비정형 근거는 `WORKIQ_ENDPOINT`에서 조회
- `simulation` 결과를 실제 FabricIQ/WorkIQ 운영 호출 결과로 표현하지 않습니다.

### Track3 live adapter 계약

`FABRICIQ_ENDPOINT`와 `WORKIQ_ENDPOINT`는 원시 제품 URL이 아니라 워크숍용 POST JSON adapter 계약입니다.

- 공통 요청: `scenarioId`, `question`, `semanticKeys`
- FabricIQ 응답: `structuredMetrics`, `highlights`, `sourceTrace`
- WorkIQ 응답: `evidenceLinks[]` (`title`, `source`, `location|target|url`), `sourceCoverage`
- 오류·권한 실패는 성공 형태의 빈 응답으로 숨기지 않고 HTTP 오류 또는 명시적 상태로 반환

Foundry 최종 문장화는 Azure AI Foundry **Responses API**만 사용합니다.

- `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`
- `AZURE_AI_FOUNDRY_MODEL`
- `AZURE_AI_FOUNDRY_API_KEY` 또는 `AZURE_AI_FOUNDRY_BEARER_TOKEN`

API key는 `api-key`, Entra 액세스 토큰은 `Authorization: Bearer` 헤더에 사용합니다. 두 값을 서로 바꾸어 사용하지 않습니다.

## 4) Track2 샘플 데이터 운영 기준

기준 문서:
- [Track1_WorkIQ_Seed_Content_Specification.md](track1/docs/Track1_WorkIQ_Seed_Content_Specification.md)
- [track2/data/README.md](track2/data/README.md)
- [TRACK2_M365_Complete_Deployment_Guide.md](track2/data/TRACK2_M365_Complete_Deployment_Guide.md)

확정 분포:
- 기준 시드 19건: SP6 / EM5 / TM5 / OD3
- 확장 60 업무항목: SP15 / EM15 / TM18(55 messages) / OD12

핵심 실행 경로:
```bash
cd track2/data
npm install
npm run generate
python run_track2_oneclick.py --tenant-domain <tenant> --sharepoint-hostname <host> --generate --execute
```

## 5) 문서 변경 시 동기화 규칙

### A. 시간/DoD/평가 기준 변경 시
동시에 점검:
- [Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)
- [WORKBOOK.md](track2/WORKBOOK.md)
- [PREREQUISITES.md](track2/PREREQUISITES.md)
- [Instructor_Day_of_Operations_Checklist.md](common/docs/Instructor_Day_of_Operations_Checklist.md)

### B. 샘플 건수/키워드/배포 경로 변경 시
동시에 점검:
- [Track1_WorkIQ_Seed_Content_Specification.md](track1/docs/Track1_WorkIQ_Seed_Content_Specification.md)
- [WORKBOOK.md](track2/WORKBOOK.md)
- [track2/data/README.md](track2/data/README.md)
- [TRACK2_M365_Complete_Deployment_Guide.md](track2/data/TRACK2_M365_Complete_Deployment_Guide.md)

### C. Track3 질문/정책/실행 경로 변경 시
동시에 점검:
- [WORKBOOK.md](track3/WORKBOOK.md)
- [PREREQUISITES.md](track3/PREREQUISITES.md)
- [Track3_FoundryIQ_Introduction_and_Technical_Guide.md](track3/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)
- [track3/data/README.md](track3/data/README.md)
- [common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)

### D. Track3 노트북/Foundry 호출 계약 변경 시

동시에 점검:

- [Track3_Mission_Workbench.ipynb](track3/data/Track3_Mission_Workbench.ipynb)
- [Track3_EndToEnd_Learner_Notebook.ipynb](track3/data/Track3_EndToEnd_Learner_Notebook.ipynb)
- [foundry_responses.py](track3/data/foundry_responses.py)
- [run_track3_daily_briefing.py](tools/run_track3_daily_briefing.py)
- [track3/WORKBOOK.md](track3/WORKBOOK.md)
- [track3/PREREQUISITES.md](track3/PREREQUISITES.md)
- [track3/data/README.md](track3/data/README.md)
- Track3 GitHub Actions와 cron/Logic Apps 템플릿

구형 `ChatCompletionsClient`, `/models`, `AZURE_AI_FOUNDRY_ENDPOINT`, `AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT` 예시를 다시 도입하지 않습니다.

## 6) 완료 전 필수 검증

1. Markdown 링크 깨짐 0건
2. Python 문법 검사 통과
3. Track2 생성 스크립트 실행 가능 (`npm run generate`)
4. 배포 dry-run 통과 (`python deploy_m365_samples.py --config ...`)
5. Track3 샘플 생성/시뮬레이션/평가 실행 가능
   - `python track3/data/generate_track3_samples.py`
   - `python track3/data/run_track3_simulation.py --all --mode normal`
   - `python track3/data/evaluate_track3_outputs.py --strict`
6. 노트북/검증 스크립트 실행 경로 최신 상태 유지
7. 두 Track3 노트북 JSON 파싱·코드 셀 컴파일 및 `simulation` 전체 실행 통과
8. Track3 일일 브리핑이 Responses API 미설정 시 rules-only, 설정 시 `leadership_briefing_llm.md` 생성
9. GitHub Actions YAML과 Logic Apps JSON 구문 검사 통과
10. 소스·노트북·문서에 토큰/키 하드코딩 0건

## 7) 보안/운영 원칙

- 샘플/격리 테넌트만 사용
- 실제 임직원 데이터 전제 금지
- 토큰/시크릿은 문서에 하드코딩 금지
- 시크릿은 셸·GitHub Secrets·관리형 비밀 저장소에서만 주입하고 생성 산출물/노트북 출력에 기록하지 않음
- 채팅·로그·문서에 노출된 토큰은 즉시 폐기·재발급하고 재사용하지 않음
- 실패 시 우회 경로와 검증 방법을 반드시 함께 기록

---

이 가이드의 목적은 “문서 정리”가 아니라,  
변경 후에도 워크숍이 **실행 가능하고 재검증 가능한 상태**를 유지하도록 하는 것입니다.
