# Track3 FoundryIQ 소개 및 기술 상세 가이드

이 문서는 워크숍 Track 3에서 사용하는 **FoundryIQ**의 개념, 기술 구성, 그리고 본 프로젝트에서 FoundryIQ를 사용하는 이유를 정리합니다.

실습 실행은 [WORKBOOK.md](../WORKBOOK.md)를 기준으로 진행하고, 로컬 자동 검증은 [track3/data/README.md](../data/README.md) 및 [track3/data/Track3_Mission_Workbench.ipynb](../data/Track3_Mission_Workbench.ipynb)를 사용합니다.
FabricIQ 상세 구현과 운영형 검증 체크는 [Track3_Appendix_FabricIQ_Operational_Agent_Validation_Guide.md](./Track3_Appendix_FabricIQ_Operational_Agent_Validation_Guide.md) 부록을 참고합니다.

## 0) Track3 시작 입력 계약 (Track2 인계 검수)

Track3 시작 전에 아래 입력이 준비되어야 합니다.

- WorkIQ 인덱스 카탈로그(소스/범위/갱신 시각)
- 크로스 소스 품질 점수(8항목) + 미달 항목
- 근거 링크 샘플 5건
- 재현 질의 3건

실무 체크는 [PREREQUISITES.md](../PREREQUISITES.md)의 `TRACK3_KICKOFF_CHECK` 형식을 따릅니다.

## 1) FoundryIQ란?

FoundryIQ는 Azure AI Foundry 기반의 에이전트 오케스트레이션 계층으로, 다음을 수행합니다.

- 여러 데이터 소스(FabricIQ, WorkIQ) 라우팅
- 프롬프트/도구 실행 제어
- 근거 결합(수치 + 문서 인용)
- 응답 품질 평가(정확도, 환각률, 근거성)

즉, 단일 LLM 호출이 아니라 **운영형 AI 에이전트 실행 환경**입니다.

---

## 2) 이 프로젝트에서 FoundryIQ를 쓰는 이유

요구사항:
- 리더십이 매일 아침 "매출 하락 원인 요약 + 대응안"을 자동 수신
- 답변에 근거(정형 지표 + 업무 문서 출처) 포함
- 반복 실행/품질 측정/개선 가능해야 함

FoundryIQ가 적합한 이유:
1. **자동화**: 스케줄 기반 브리핑 생성 가능
2. **멀티 소스 결합**: FabricIQ(정형) + WorkIQ(비정형) 동시 활용
3. **근거 기반 응답**: 문서 링크와 수치 근거를 함께 제시
4. **평가 가능성**: 루브릭 기반 품질 측정/회귀 점검 가능
5. **운영 확장성**: 프롬프트/도구/모델 버전 관리 용이

---

## 3) 기술 아키텍처

```text
사용자 질문
   │
   ▼
FoundryIQ 에이전트 (오케스트레이션/라우팅)
   │                      │
   ├─ Tool A: FabricIQ 질의 ──► Ontology 경로 기반 수치 집계
   └─ Tool B: WorkIQ 검색 ──► M365 문서/메일/채팅 근거 검색
            │
            ▼
     근거 결합 및 응답 생성
 (요약 + 대응안 + 출처 링크)
```

---

## 4) 핵심 기술 구성요소

### 4.1 모델 계층
- Responses API 지원 Chat/Reasoning 모델: 보고서 초안 생성, 설명, 요약
- Embedding 모델: 별도 벡터 인덱스를 직접 구성하는 확장 시나리오에서만 사용

### 4.2 Tool/Connector 계층
- FabricIQ 커넥터: SQL endpoint 또는 시맨틱 질의 API
- WorkIQ 커넥터: M365 인덱스 검색 API

### 4.3 Prompt/Policy 계층
- 시스템 프롬프트: 역할/출력 형식/근거 요구사항 고정
- 라우팅 규칙: 정형 먼저 조회 후 비정형 근거 결합
- 안전장치: 근거 없는 단정 금지, 출처 누락 시 경고

### 4.4 Evaluation 계층
- 정답률(핵심 수치 정확성)
- 근거 링크 유효성
- 환각률
- 실행가능성(의사결정 가치)

---

## 5) 실행 플로우(권장)

0. Track2 인계 검수  
   - 인덱스 범위/품질 미달 항목/근거 링크 유효성 확인
1. 질문 분해  
   - 예: "캠페인 A 유입 주문에서 반품 급증 원인"
2. FabricIQ 질의  
   - 캠페인/주문/결제/배송/반품 지표 집계
3. WorkIQ 검색  
   - 관련 메일/회의노트/Teams 이슈 검색
4. 결합 추론  
   - 지표 변화 + 업무 맥락 연결
5. 출력 생성  
   - 요약, 대응안, 근거 링크
6. 평가/로그  
   - 품질 지표 기록, 프롬프트 개선

### 5-1) Track3 킥오프 15분 권장 순서

1. Tool A(FabricIQ) 단독 질의 성공 확인
2. Tool B(WorkIQ) 단독 검색 성공 확인
3. 표준 질문 Q1 "결제 실패가 캠페인 전환율에 미치는 영향은?"을 A/B 각각 실행해 결과 비교
4. 근거 링크 클릭 가능 여부(권한/만료) 확인
5. 실패 원인 분류: 권한/범위/라우팅/프롬프트

### 5-1-a) 실습용 권장 질문 세트

실습에서 직접 실행할 질문은 [WORKBOOK.md](../WORKBOOK.md)의 **실행용 샘플 질문 세트**를 기준으로 합니다.

- 표준 질문
  - `결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?`
  - `배송 지연은 반품률과 고객 불만 티켓에 어떤 영향을 미치는가?`
  - `Q3 핵심 상품 3종의 매출/반품 신호를 어떻게 해석할 것인가?`
- 확장 질문
  - `어떤 프로모션 전략이 매출 상승과 반품 리스크를 동시에 유발하는가?`
  - `품절 경험이 많은 상품군에서 주문 취소와 문의가 동시에 증가했는가?`
  - `재고 이슈가 캠페인 성과 저하와 연결되는가?`
  - `Platinum 고객과 일반 고객의 반품 사유 패턴은 어떻게 다른가?`
  - `어떤 채널에서 특정 반품 사유가 반복되며, 이후 재구매율은 어떻게 변하는가?`

### 5-2) 실패 및 부분응답 정책

| 상황 | 동작 | 사용자 표시 |
|---|---|---|
| 429/5xx/일시 오류 | 초기 호출 후 5초→10초→20초 간격 최대 3회 재시도(총 최대 4회 시도) | 재시도 중 |
| FabricIQ만 실패 | WorkIQ 근거만 제한 제공 | `정형 수치 미검증` |
| WorkIQ만 실패 | FabricIQ 수치만 제한 제공 | `업무 문서 근거 없음` |
| 두 Tool 모두 실패 | 답변 생성 중단 | 차단 원인과 복구 조치 |

부분응답은 최종 PASS가 아니며, 복구 후 표준 질문으로 다시 평가합니다.

### 5-3) simulation과 live 실행 계약

| 모드 | FabricIQ | WorkIQ | 목적 |
|---|---|---|---|
| `simulation` | Track1 CSV에서 생성한 Tool A fixture | Track2 manifest에서 생성한 Tool B fixture | 교육, 오프라인 재현, 회귀 테스트 |
| `live` | `FABRICIQ_ENDPOINT` adapter | `WORKIQ_ENDPOINT` adapter | 실제 연결 검증·운영 |

`simulation` PASS는 로직과 fallback 계약의 재현성을 증명하지만 실제 서비스 권한·네트워크·인덱스 상태를 증명하지 않습니다. live adapter는 `scenarioId`, `question`, `semanticKeys`를 받아 각 계층의 결과와 source trace를 반환하며 오류를 성공 형태의 빈 값으로 숨기지 않습니다.

최종 문장화는 Azure AI Foundry Responses API를 사용합니다. endpoint는 `/openai/v1/responses`까지 포함하고 API key(`api-key`) 또는 Entra access token(`Authorization: Bearer`) 중 하나를 선택합니다.

### 5-4) simulation reference 자동화(매일 아침 자동 수신)

리더십 자동 수신 요구사항을 운영에서 구현할 때는 아래 구성을 권장합니다.

1. 트리거 계층: 평일 08:30 KST 스케줄 트리거
2. 실행 계층: `generate_track3_samples.py` → `run_track3_simulation.py --all --mode normal` → `evaluate_track3_outputs.py --strict`
3. 문서 계층: `leadership_briefing_llm.md`(LLM 가능 시) 또는 `leadership_briefing.md`(fallback) 생성
4. 전달 계층: Teams/Outlook 자동 발송
5. 감사 계층: `generated/responses/*.json`, `generated/reports/*` 아카이브

엄격 모드(`--strict`) 실패 시에는 발송을 중단하고 운영 알림을 먼저 보낸 뒤 복구 후 재실행합니다.

리허설·reference 운영에서는 [run_track3_daily_briefing.py](../../tools/run_track3_daily_briefing.py)로 위 simulation 체인을 단일 배치로 묶습니다. 실제 live 운영은 FabricIQ/WorkIQ adapter 호출 실행기를 배포하고 동일한 strict 평가·발송 중단 정책을 적용합니다.

스케줄러 템플릿:
- cron: [track3-daily-briefing.cron](../../tools/templates/cron/track3-daily-briefing.cron)
- GitHub Actions: [track3-daily-briefing.yml](../../.github/workflows/track3-daily-briefing.yml)
- Logic Apps: [track3-daily-briefing.logicapp.template.json](../../tools/templates/logicapps/track3-daily-briefing.logicapp.template.json)
- 알림 확장: [track3-daily-briefing-with-notify.cron](../../tools/templates/cron/track3-daily-briefing-with-notify.cron), [track3-daily-briefing-with-notify.yml](../../.github/workflows/track3-daily-briefing-with-notify.yml), [track3-daily-briefing-with-notify.logicapp.template.json](../../tools/templates/logicapps/track3-daily-briefing-with-notify.logicapp.template.json)
- 알림 스크립트: [send_track3_notifications.py](../../tools/send_track3_notifications.py)

### 5-5) 운영 확장성 상세(버전 관리 계약)

회귀 점검 가능성을 높이기 위해 실행 산출물에 다음 버전 정보를 항상 기록합니다.

- 파이프라인 버전(`pipelineVersion`)
- 프롬프트 버전(`promptVersion`)
- 모델 버전(`modelVersion`)
- 도구 버전(`toolsetVersion`)

`run_track3_simulation.py`는 위 값을 `runContext.release`에 저장하며, 배포 파이프라인에서 아래처럼 명시적으로 주입합니다.

```bash
python run_track3_simulation.py --all --mode normal \
  --pipeline-version prod-2026-07 \
  --prompt-version p3.2 \
  --model-version foundry-responses-v1 \
  --toolset-version fabriciq-1.4+workiq-2.1
```

---

## 6) Track3 산출물 권장 형태

1. 에이전트 정의서
   - 목표, 입력, 출력 형식, 사용 도구
2. 프롬프트 세트
   - 검색/질의/생성 템플릿
3. 평가 리포트
   - 정확도/근거성/환각률
4. 최종 브리핑 샘플
   - "매출 하락 원인 + 대응안 + 근거 링크"
5. 킥오프 점검 로그
   - `TRACK3_KICKOFF_CHECK` 결과

---

## 7) 운영 시 주의사항

- 실사용 M365 데이터 대신 샘플/격리 환경 사용
- Graph 권한 최소화 원칙 적용
- 모델/프롬프트 변경 시 회귀 평가 필수
- 쿼터/지연 대비 대체 모델 준비
- 위 5-2의 fallback 규칙(재시도/부분응답 정책) 적용

---

## 8) 요약

FoundryIQ는 이 프로젝트에서:
- **자동화 엔진**이고,
- **FabricIQ + WorkIQ 결합기**이며,
- **근거 기반 리더십 브리핑 생산기**입니다.

따라서 Track 3의 목적은 단순 데모가 아니라, **FabricIQ의 정형 의미, WorkIQ의 업무 맥락, FoundryIQ의 결합 책임을 구분해 설명하고 반복 검증 가능한 에이전트를 만드는 것**입니다.
