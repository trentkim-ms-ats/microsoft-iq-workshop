# Integrated Workshop on Fabric, WorkIQ, and FoundryIQ

> **Fabric·WorkIQ·FoundryIQ 통합 실습 워크숍**  
> 데이터에서 근거 기반 AI 에이전트까지 end-to-end로 연결하는 1일 워크숍 저장소

이 저장소는 **Track1(FabricIQ) → Track2(WorkIQ) → Track3(FoundryIQ)** 흐름으로 진행되는 전체 워크숍의 문서, 샘플 데이터, 자동화 스크립트, 검증 경로를 담고 있습니다.

---

## 1) 이 워크숍에서 만드는 것

이 워크숍의 목표는 다음 3단계를 하나로 연결하는 것입니다.

1. **FabricIQ**  
   - 정형 데이터를 Ontology 기반 시맨틱 구조로 정리
2. **WorkIQ**  
   - M365 문서/메일/채팅의 업무 컨텍스트를 색인·검색
3. **FoundryIQ**  
   - FabricIQ + WorkIQ를 그라운딩 소스로 결합하는 AI 에이전트 구축·평가

최종적으로 참가자는 **근거 있는 리더십 브리핑**을 생성하고, “정형 수치는 FabricIQ, M365 업무 근거는 WorkIQ, 결합·평가는 FoundryIQ”라는 책임을 실행 결과의 `sourceTrace`로 설명합니다.

---

## 2) 워크숍 한눈에 보기

| 항목 | 내용 |
|---|---|
| 공식 제목 | **Integrated Workshop on Fabric, WorkIQ, and FoundryIQ** |
| 운영 시간 | **09:00-17:00, 총 480분** |
| 대상 | 데이터/SQL 기초 보유자 + AI 활용 실습 참가자 |
| 운영 방식 | 1일 집중형, Track1 → Track2 → Track3 → 통합 미니 프로젝트 |
| 최종 결과 | Ontology 스냅샷 + WorkIQ 인덱스/품질 리포트 + FoundryIQ 브리핑 결과 |

기준 문서: [common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)

---

## 3) 저장소 구조

```text
Data Platform Workshop/
  README.md
  AGENTS.md
  common/
    docs/
  track1/
    docs/
    data/
    ontology_bundle/
  track2/
    docs/
    data/
  track3/
    docs/
    data/
  tools/
  archive/
```

### 핵심 진입점

- 통합 계획: [common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)
- 운영 체크리스트: [common/docs/Instructor_Day_of_Operations_Checklist.md](common/docs/Instructor_Day_of_Operations_Checklist.md)
- 실행 계획 템플릿: [common/docs/PLANS.md](common/docs/PLANS.md)

### 트랙별 문서

- Track1 실습지: [track1/WORKBOOK.md](track1/WORKBOOK.md)
- Track2 실습지: [track2/WORKBOOK.md](track2/WORKBOOK.md)
- Track3 실습지: [track3/WORKBOOK.md](track3/WORKBOOK.md)

### 트랙별 Quickstart

- Track1 빠른 시작: [track1/QUICKSTART.md](track1/QUICKSTART.md)
- Track2 빠른 시작: [track2/QUICKSTART.md](track2/QUICKSTART.md)
- Track3 빠른 시작: [track3/QUICKSTART.md](track3/QUICKSTART.md)

### 트랙별 샘플/자동화

- Track1 데이터셋: [track1/data/README.md](track1/data/README.md)
- Track1 온톨로지 번들: [track1/ontology_bundle/README.md](track1/ontology_bundle/README.md)
- Track2 샘플 패키지: [track2/data/README.md](track2/data/README.md)
- Track3 샘플 패키지: [track3/data/README.md](track3/data/README.md)

---

## 4) 이 저장소를 어떻게 읽으면 되는가

### 참가자 관점
1. [통합 계획](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)으로 전체 흐름 파악
2. 각 트랙 [QUICKSTART](track1/QUICKSTART.md)로 즉시 진입 후 실습지 순서대로 진행
   - [Track1](track1/WORKBOOK.md)
   - [Track2](track2/WORKBOOK.md)
   - [Track3](track3/WORKBOOK.md)

### 강사/운영자 관점
1. [강사용 당일 운영 체크리스트](common/docs/Instructor_Day_of_Operations_Checklist.md)
2. Track1/2/3 준비물 상세 문서
3. Track2/Track3 자동화 패키지 실행 검증

### 저장소 유지보수 관점
1. [AGENTS.md](./AGENTS.md)
2. [common/docs/PLANS.md](common/docs/PLANS.md)

---

## 5) 준비(Preparation)

워크숍을 실제로 진행하려면 아래 준비가 필요합니다.

### 공통 준비물

- Fabric Workspace / Lakehouse / Notebook 접근 권한
- Microsoft 365 샘플/격리 테넌트
- Azure AI Foundry 프로젝트 및 모델 배포 권한
- 강사용 운영 계정 2종 이상(기술 리드 / 운영 리드)

### Track1 준비

- 정형 CSV 14종 준비  
  → [track1/data/README.md](track1/data/README.md)
- Ontology 배포 경로 준비  
  → [track1/ontology_bundle/README.md](track1/ontology_bundle/README.md)

### Track2 준비

- WorkIQ 대상 M365 소스 준비(Outlook / Teams / SharePoint / OneDrive)
- 샘플 콘텐츠 생성/배포 경로 준비  
  → [track2/data/README.md](track2/data/README.md)
- 배포 상세 가이드  
  → [track2/data/TRACK2_M365_Complete_Deployment_Guide.md](track2/data/TRACK2_M365_Complete_Deployment_Guide.md)

### Track3 준비

- Foundry Tool A(FabricIQ), Tool B(WorkIQ) 연결 정보
- 평가 루브릭 및 프롬프트 템플릿
- 로컬 리허설 경로  
  → [track3/data/README.md](track3/data/README.md)

### 운영 리허설 권장 순서

1. D-1: 계정/권한/샘플 데이터/모델 배포 최종 확인
2. T-30: Track2 키워드 검색, Track3 Q1 사전 실행
3. 당일: 트랙 인계 패키지와 표준 질문 세트 기준으로 진행

운영 상세는 [common/docs/Instructor_Day_of_Operations_Checklist.md](common/docs/Instructor_Day_of_Operations_Checklist.md)를 따릅니다.

---

## 6) 과정(Process)

### 6-1) 전체 진행 흐름

```text
Track1(FabricIQ)
  → Track2_HANDOFF_PACKAGE
  → Track2(WorkIQ)
  → Track3_HANDOFF_PACKAGE
  → Track3(FoundryIQ)
  → 최종 리더십 브리핑
```

### 6-2) 트랙별 역할과 산출물

| 트랙 | 핵심 역할 | 주요 산출물 |
|---|---|---|
| Track1 | 정형 데이터 시맨틱 정리, Ontology 설계 | Ontology 스냅샷, 매핑표, 검증 로그 |
| Track2 | M365 업무 컨텍스트 색인, 크로스 소스 품질 검증 | 인덱스 카탈로그, 품질 점수 리포트, 근거 링크 |
| Track3 | FabricIQ + WorkIQ 결합 에이전트 구축/평가 | 검색/질의/생성 결과, 최종 브리핑 |

### 6-3) 트랙별 실습 흐름

### Track1 — FabricIQ
- 원천 데이터 탐색/프로파일링
- 표준 스키마 설계
- Ontology 엔터티/관계/속성 정의
- 구조 무결성 검증
- `TRACK2_HANDOFF_PACKAGE` 작성

문서:
- [track1/WORKBOOK.md](track1/WORKBOOK.md)
- [track1/PREREQUISITES.md](track1/PREREQUISITES.md)

### Track2 — WorkIQ
- Track1 인계 패키지 검수
- 키워드 프로브 및 M365 인덱스 카탈로그 작성
- 엔터티-문서 매핑
- 품질 8항목 점수화
- `TRACK3_HANDOFF_PACKAGE` 작성

문서:
- [track2/WORKBOOK.md](track2/WORKBOOK.md)
- [track2/PREREQUISITES.md](track2/PREREQUISITES.md)

### Track3 — FoundryIQ
- Tool A/B 헬스체크
- 표준 질문 Q1~Q3 실행
- 검색 / 질의 / 생성 시나리오 평가
- fallback 정책 검증
- FabricIQ/WorkIQ source trace 분리 확인
- 최종 브리핑 제출

실행 프로필:
- `simulation`: Track1 CSV + Track2 manifest 기반 교육·회귀 테스트
- `live`: `FABRICIQ_ENDPOINT` + `WORKIQ_ENDPOINT` adapter 기반 실제 연결 검증
- 최종 문장화: Azure AI Foundry Responses API

문서:
- [track3/WORKBOOK.md](track3/WORKBOOK.md)
- [track3/PREREQUISITES.md](track3/PREREQUISITES.md)
- [track3/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md](track3/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)

---

## 7) 자동화/검증 빠른 시작

### Track1

Track1의 데이터 구조/이슈 확인:

```bash
cd track1/data
```

Ontology 번들 생성/배포 준비:

```bash
cd track1/ontology_bundle
python3 generate_definition.py
```

### Track2

샘플 생성:

```bash
cd track2/data
npm install
npm run generate
```

원클릭 배포(샘플/격리 테넌트 전용):

```bash
python run_track2_oneclick.py \
  --tenant-domain <tenant> \
  --sharepoint-hostname <host> \
  --generate \
  --execute
```

### Track3

로컬 시뮬레이션/평가:

```bash
cd track3/data
python generate_track3_samples.py
python run_track3_simulation.py --all --mode normal
python run_track3_simulation.py --scenario-id Q1 --mode tool-a-down
python run_track3_simulation.py --scenario-id Q1 --mode tool-b-down
python run_track3_simulation.py --scenario-id Q1 --mode both-down
python evaluate_track3_outputs.py --strict
```

---

## 8) 완료(Completion)

워크숍은 아래 산출물이 모두 갖춰지면 완료로 봅니다.

### Track1 완료
- Ontology 모델 정의 완료
- 매핑표 작성 완료
- 구조 무결성 검증 로그 확보
- Track2 인계 패키지 제출

### Track2 완료
- M365 4대 소스 검색 성공
- 크로스 소스 매핑표 작성 완료
- 품질 8항목 점수화 완료
- Track3 인계 패키지 제출

### Track3 완료
- Tool A/B 헬스체크 성공
- 표준 질문 실행 결과 확보
- 검색/질의/생성 시나리오 결과 확보
- 최종 브리핑 제출

### 최종 완료 판단

- Track1 산출물 + Track2 산출물 + Track3 산출물이 서로 연결됨
- 최종 브리핑에 **정형 수치 + 비정형 근거 링크 + 조치안** 포함
- 부분응답/실패 사유는 운영 로그에 기록됨

---

## 9) 검증(Validation)

이 저장소는 문서뿐 아니라 **재실행 가능한 상태**를 유지하는 것을 목표로 합니다.

### 최소 검증 항목

1. Markdown 링크 깨짐 0건
2. Python 문법 검사 통과
3. Track2 생성/배포 경로 확인 (기본 dry-run, 실제 반영은 `--execute`)
4. Track3 생성/시뮬레이션/평가 경로 확인
5. 두 Track3 노트북 실행 경로 및 Responses API 계약 최신 상태 유지
6. simulation/live source trace와 fallback 정책 검증

유지보수 기준 문서:
- [AGENTS.md](./AGENTS.md)
- [common/docs/PLANS.md](common/docs/PLANS.md)

---

## 10) 보안 및 운영 원칙

- 반드시 **샘플/격리 환경**에서만 실행합니다.
- 실제 임직원 데이터/메일함/채널/사이트를 전제로 하지 않습니다.
- 토큰, 시크릿, 관리자 권한 정보는 문서에 하드코딩하지 않습니다.
- API key와 Entra Bearer token을 구분하고, 노출된 토큰은 즉시 폐기·재발급합니다.
- 장애가 나면 우회 경로와 검증 방법을 함께 기록합니다.

---

## 11) 추천 시작 순서

처음 보는 사람은 아래 순서로 읽는 것을 권장합니다.

1. [README.md](./README.md)
2. [common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](common/docs/Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)
3. [common/docs/Instructor_Day_of_Operations_Checklist.md](common/docs/Instructor_Day_of_Operations_Checklist.md)
4. [track1/WORKBOOK.md](track1/WORKBOOK.md)
5. [track2/WORKBOOK.md](track2/WORKBOOK.md)
6. [track3/WORKBOOK.md](track3/WORKBOOK.md)

이 README는 전체 워크숍의 **설명서이자 출발점**입니다.
