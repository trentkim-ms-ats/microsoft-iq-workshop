# PLANS.md

이 문서는 워크숍 운영을 위한 **실행 가능한 계획 템플릿**입니다.  
범위: 기획 → 제작 → 배포/리허설 → 운영 → 회고.

## 0) 운영 기준(고정값)

- 전체 일정: **480분 (09:00-17:00)**
- Track2: **110분 (25+25+35+25)**
- Track2 게이트: **품질 8항목 중 6개 이상 PASS(≥75점)**
- Track3 실패정책: **초기 호출 + 5/10/20초 간격 최대 3회 재시도(총 최대 4회 시도)** + 부분응답 규칙

### 워크숍 성공 정의

최종 산출물은 단순한 브리핑 문서가 아니라, 참가자가 **3-IQ의 역할과 연결 책임을 설명하고 실행 결과로 증명하는 것**입니다.

| 학습 성과 | 참가자가 할 수 있어야 하는 일 | 검증 증거 |
| --- | --- | --- |
| FabricIQ 이해 | 정형 KPI가 어떤 엔터티·관계·속성에서 계산되는지 설명 | Track1 기준값과 semantic/reasoning query 결과 |
| WorkIQ 이해 | 같은 비즈니스 키로 M365 근거를 찾고 ACL·최신성을 설명 | Track2 근거 링크, source coverage, 품질 점수 |
| FoundryIQ 이해 | 두 소스의 책임을 섞지 않고 결합·평가·fallback 적용 | Track3 `sourceTrace`, 응답 JSON, evaluation report |
| 3-IQ 연결 이해 | Ontology 공통 어휘가 Track1→2→3에서 유지되는 방식을 설명 | Q1~Q3 semantic key와 handoff package |

강사는 다음 질문으로 역할 혼동 여부를 확인합니다.

1. 수치가 틀렸을 때 어느 IQ 계층을 먼저 점검해야 하는가?
2. 근거 문서가 보이지 않을 때 WorkIQ/ACL 문제인지 어떻게 구분하는가?
3. FoundryIQ가 원문에 없는 숫자나 링크를 만들지 못하게 하는 계약은 무엇인가?
4. simulation PASS와 live 연결 성공의 차이는 무엇인가?

### Track3 실행 프로필

| 프로필 | 정형 소스 | 비정형 소스 | Foundry 최종 문장화 | 목적 |
| --- | --- | --- | --- | --- |
| `simulation` | Track1 CSV 기반 FabricIQ simulation | Track2 manifest 기반 WorkIQ simulation | 선택(Responses API) | 교육, 오프라인 재현, 회귀 테스트 |
| `live` | `FABRICIQ_ENDPOINT` adapter | `WORKIQ_ENDPOINT` adapter | Responses API | 실제 연결 검증과 데모 |

`simulation`은 reference harness이며 실제 FabricIQ/WorkIQ 연결 성공을 증명하지 않습니다. `live` adapter는 `scenarioId`, `question`, `semanticKeys`를 받아 각 IQ 계층의 응답 계약으로 변환합니다.

Foundry Responses API는 `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`, `AZURE_AI_FOUNDRY_MODEL`, 그리고 `AZURE_AI_FOUNDRY_API_KEY` 또는 `AZURE_AI_FOUNDRY_BEARER_TOKEN`을 사용합니다. API key와 Entra Bearer token은 교차 사용하지 않습니다.

기준 문서:
- [Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)
- [Instructor_Day_of_Operations_Checklist.md](Instructor_Day_of_Operations_Checklist.md)

---

## 1) 마일스톤 A — 커리큘럼/문서 준비

### 목표
- Track1/2/3 문서가 서로 충돌 없이 연결된 상태 확보

### 작업
1. 트랙별 목표/DoD/제출물 정합성 점검
2. 인계 계약 템플릿(`TRACK2_HANDOFF_PACKAGE`, `TRACK3_HANDOFF_PACKAGE`) 유지
3. 공통 체크리스트와 시간표 동기화
4. 3-IQ source-of-truth와 `simulation`/`live` 범위 동기화
5. Responses API endpoint/model/auth 계약 동기화

### 완료 기준
- 링크/템플릿 깨짐 없음
- 트랙 인계 입력/출력 필드가 문서마다 동일

---

## 2) 마일스톤 B — 데이터/도구 준비

### 목표
- 샘플 데이터 생성·배포·검증 경로를 재현 가능하게 확보

### 작업
1. Track1 샘플 CSV + Ontology 번들 최신화
2. Track2 샘플(60항목) 생성 검증
3. Track2 배포 자동화 스크립트(bootstrap/one-click) 점검
4. 미션1~2 워크벤치 노트북 실행 가능 상태 유지
5. Track3 샘플 생성/시뮬레이션/평가 스크립트 및 두 워크벤치 노트북 실행 가능 상태 유지
6. Foundry Responses API 공용 모듈과 일일 배치 실행 경로 정렬
7. live adapter 요청/응답 schema와 권한 오류 처리 점검

### 완료 기준
- `track2/data/` 기준 생성/검증 경로가 문서와 일치
- 매핑 자동 검증 스크립트 PASS 재현 가능
- `track3/data/` 기준 Q1~Q3 normal + fallback 검증 PASS 재현 가능
- 두 노트북에서 Responses API 환경변수/인증 계약 일치
- simulation 산출물과 live 산출물의 실행 모드가 명시됨

---

## 3) 마일스톤 C — 통합 검증

### 목표
- 문서 + 코드 + 데이터의 end-to-end 무결성 확보

### 작업
1. Markdown 링크 무결성 검사
2. Python 스크립트 컴파일 검증
3. Track2 생성(`npm run generate`) + 배포 dry-run 확인
4. 노트북 코드 셀 컴파일/스모크 실행
5. Track3 시뮬레이션 결과 평가(`evaluate_track3_outputs.py --strict`) 확인
6. 트랙 루트 진입 문서(`WORKBOOK.md`, `PREREQUISITES.md`, `QUICKSTART.md`) 링크 무결성 확인
7. Track3 GitHub Actions YAML과 Logic Apps JSON 구문 검사
8. 코드·노트북·문서의 하드코딩 토큰/키 검사

### 완료 기준
- 깨진 링크 0건
- 주요 스크립트 실행 경로 PASS
- 차단 이슈 발생 시 우회 절차 문서화

---

## 4) 마일스톤 D — D-1 / T-30 리허설

### 목표
- 당일 중단 없는 운영 가능 상태 확보

### 작업
1. 테넌트 접근/권한/토큰 준비
2. Track2 검색 가용성 점검(키워드 프로브)
3. Track3 Tool A/B 헬스체크
4. 장애 대응표 기반 복구 리허설
5. 참가자 설명 확인 질문 4개와 sourceTrace 판독 리허설

### 완료 기준
- 강사용 체크리스트 핵심 항목 통과
- 대체 경로 포함한 운영 절차 확정

---

## 5) 마일스톤 E — 실행 후 개선

### 목표
- 다음 차수 품질 향상 백로그 확정

### 작업
1. 계획시간 vs 실제시간 비교
2. 참가자 막힘 포인트/실패 패턴 분석
3. 문서/데이터/도구 개선안 우선순위화
4. 3-IQ 역할 혼동과 sourceTrace 누락 사례 기록

### 완료 기준
- 개선 항목별 담당/일정 확정

---

## 검증 매트릭스

| 범위 | 검증 | PASS 기준 |
| --- | --- | --- |
| 문서 | 전체 Markdown 상대 링크 검사 | 깨진 링크 0건 |
| Python | 저장소 Python 문법 검사 | 오류 0건 |
| Track2 | `npm run generate` + Graph dry-run | 60개 분포와 요청 검증 통과 |
| Track3 simulation | generate → normal/fallback → strict evaluator | Q1~Q3 normal PASS, fallback 정책 PASS |
| Track3 notebooks | 두 노트북 JSON/코드 셀 컴파일 및 simulation 실행 | 예외 0건, evaluation PASS |
| Track3 live | FabricIQ/WorkIQ adapter 각각 호출 후 결합 | 정형/비정형 source trace 분리, ACL 오류 표면화 |
| Foundry | Responses API 인증별 호출 | 선택한 인증 방식으로 최종본 생성 |
| 배치 | `run_track3_daily_briefing.py` | 미설정 시 rules-only, 설정 시 LLM 최종본 추가 생성 |
| 배포 템플릿 | GitHub Actions YAML, Logic Apps JSON | 구문 통과, 구형 Foundry 변수 0건 |
| 보안 | 토큰/키 패턴 검사 | 하드코딩 0건, 노출 값 폐기 확인 |

---

## 빠른 점검 명령(운영자용)

아래 명령은 **저장소 루트**에서 실행합니다.

```bash
# Track2 샘플 재생성
cd track2/data
npm run generate

# Track2 배포 점검 (기본 dry-run)
python deploy_m365_samples.py --config deployment_config.json

# 미션2 매핑 검증(예시)
python verify_entity_document_mapping.py --mapping-csv ./generated/workbench/mission2_mapping_result_template.csv

# Track3 샘플 생성 + 통합/부분응답 검증
cd ../../track3/data
python generate_track3_samples.py
python run_track3_simulation.py --all --mode normal
python run_track3_simulation.py --scenario-id Q1 --mode tool-a-down
python run_track3_simulation.py --scenario-id Q1 --mode tool-b-down
python run_track3_simulation.py --scenario-id Q1 --mode both-down
python evaluate_track3_outputs.py --strict

# 저장소 루트에서 Track3 일일 reference pipeline
cd ../..
python tools/run_track3_daily_briefing.py --run-fallback-check
```

---

## 6) 차수별 실행 로그 템플릿

실제 운영 이력을 남길 때 아래 템플릿을 사용합니다.  
원칙: **사실 기반(시간/증적/조치) + 다음 차수 액션 연결**.

### A. 차수 요약 로그

| 차수 | 실행일(KST) | 진행 상태 | 총 소요시간 | 핵심 결과 | 담당 |
|---|---|---|---:|---|---|
| 1차 | YYYY-MM-DD | 완료/부분완료/중단 | 480 | 예: Track2 품질게이트 7/8 PASS | 이름 |

### B. 트랙별 결과 로그

| 차수 | 트랙 | 목표 달성 여부 | 주요 산출물 | 차단 이슈 | 즉시 조치 |
|---|---|---|---|---|---|
| 1차 | Track1 | Y/N | Ontology 배포, 매핑 검증 로그 | 예: API 지연 | 재시도/우회 경로 적용 |
| 1차 | Track2 | Y/N | 인덱스 카탈로그, 품질 8항목 점수 | 예: Teams 검색 지연 | 범위 조정 + 재검증 |
| 1차 | Track3 | Y/N | Tool A/B 응답 근거 리포트 | 예: Tool B 오류 | 부분응답 정책 적용 |

### C. 품질/장애 로그

| 차수 | 발생 시각 | 구분(품질/장애) | 증상 | 원인 추정 | 조치 | 결과 |
|---|---|---|---|---|---|---|
| 1차 | HH:MM | 장애 | 예: Graph 429 | 일시적 스로틀링 | 5/10/20 재시도 | 복구 |

### D. 다음 차수 개선 백로그

| 우선순위 | 개선 항목 | 근거(로그 참조) | 담당 | 목표 완료일 | 상태 |
|---|---|---|---|---|---|
| P1 | 예: Track2 키워드 프로브 안내 문구 보강 | 1차 Track2 이슈 #2 | 이름 | YYYY-MM-DD | Open |
| P2 | 예: 리허설 체크리스트 자동화 스크립트 추가 | 1차 공통 이슈 #1 | 이름 | YYYY-MM-DD | Open |

### E. 권장 기록 포맷(복붙)

```text
[WORKSHOP_RUN_LOG]
cohort=<1차/2차/...>
runDateKst=<YYYY-MM-DD>
owner=<담당자>
overallStatus=<완료|부분완료|중단>
track1=<Y/N, 핵심결과, 이슈>
track2=<Y/N, 핵심결과, 이슈>
track3=<Y/N, 핵심결과, 이슈>
blockingIssues=<이슈1;이슈2 또는 ->
immediateActions=<조치1;조치2 또는 ->
nextBacklog=<P1:항목|담당|기한;P2:항목|담당|기한>
[/WORKSHOP_RUN_LOG]
```
