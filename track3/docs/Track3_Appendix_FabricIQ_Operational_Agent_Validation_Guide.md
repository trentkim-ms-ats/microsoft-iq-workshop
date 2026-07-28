# Track3 Appendix — FabricIQ 기술 상세 및 운영형 에이전트 검증 구현 가이드

이 문서는 Track3에서 말하는 "운영형 에이전트"가 기술적으로 무엇을 구현한 상태인지, 특히 Tool A인 FabricIQ를 중심으로 설명합니다.

본 문서는 다음 문서의 확장 Appendix 문서입니다.

- 기본 안내: [Track3_FoundryIQ_Introduction_and_Technical_Guide.md](./Track3_FoundryIQ_Introduction_and_Technical_Guide.md)
- 실습 운영 기준: [WORKBOOK.md](../WORKBOOK.md)
- 자동 검증 패키지: [track3/data/README.md](../data/README.md)

## 1) 문서 목적

Track3 실습은 단순 데모를 넘어서 아래 항목을 갖춘 운영형 검증 프레임을 목표로 합니다.

1. 반복 가능한 입력 생성
2. 장애를 포함한 실행 시뮬레이션
3. 재시도와 부분응답 정책의 코드화
4. 자동 품질 게이트와 결과 리포트

즉, "좋아 보이는 답변"이 아니라 "실패를 포함한 실제 운영 상황에서도 규칙대로 동작하는 응답 시스템"을 검증합니다.

## 2) FabricIQ의 역할과 기술 정의

### 2-1. FabricIQ의 역할

Track3에서 FabricIQ는 Tool A(정형 데이터 분석 도구)로서 다음 책임을 가집니다.

- 질문과 연관된 핵심 KPI 계산
- 캠페인/상품/배송/반품 등 구조화된 지표 반환
- 요약 응답의 정량 근거 제공

WorkIQ가 문서 근거를 제공한다면, FabricIQ는 수치 근거를 제공합니다.

### 2-2. FabricIQ 입력/출력 계약(개념)

실습 기준에서 FabricIQ 출력은 최소한 아래를 만족해야 합니다.

- scenarioId: 질문 식별자(Q1/Q2/Q3)
- title: 분석 제목
- highlights: 핵심 수치 해석 2개 이상
- 도메인별 상세 지표: 예) perCampaign, perProduct, delayedReturnRatePct

이 구조는 Track3 시뮬레이션에서 Tool A payload로 사용되며, 통합 응답의 keyFindings 구성에 직접 반영됩니다.

### 2-3. FabricIQ 지표 생성 로직(실습 구현)

Track3 샘플 생성 스크립트는 Track1 CSV를 읽어 질문별 정형 지표를 구성합니다.

- Q1: 캠페인별 전환율/결제 실패 영향
- Q2: 배송 지연군의 반품률/불만율
- Q3: 핵심 상품 3종의 주문/매출/반품률

관련 구현 위치:

- [track3/data/generate_track3_samples.py](../data/generate_track3_samples.py)

핵심 함수:

- build_q1_metrics
- build_q2_metrics
- build_q3_metrics

이 단계가 운영적으로 중요한 이유는 "질문-지표 매핑"을 명시적으로 코드화해, 모델 프롬프트 변경과 무관하게 기초 정량 근거를 재현 가능하게 유지하기 때문입니다.

## 3) 운영형 에이전트로 간주하는 구현 조건

Track3에서는 아래 요소가 구현되어야 운영형 검증이 가능하다고 봅니다.

### 3-1. 시나리오 기반 실행 제어

- 정상 모드: normal
- 영구 장애 모드: tool-a-down, tool-b-down, both-down
- 일시 장애 모드: tool-a-transient, tool-b-transient

관련 구현 위치:

- [track3/data/run_track3_simulation.py](../data/run_track3_simulation.py)

핵심 함수:

- should_tool_fail
- execute_tool

### 3-2. 재시도 정책

정책 기준:

- 지연: 5초, 10초, 20초
- 최대 시도: 3회

실습 스크립트는 지연/시도 횟수를 파라미터로 받으며, 실행 결과에 retryPolicy를 기록합니다. 따라서 실험 이력과 정책 일치 여부를 후속 감사에서 확인할 수 있습니다.

### 3-3. 응답 등급화(정상/부분/차단)

응답 정책은 다음처럼 코드로 분기됩니다.

1. Tool A/B 모두 성공: pass
2. Tool A 실패: partial + "정형 수치 미검증"
3. Tool B 실패: partial + "업무 문서 근거 없음"
4. Tool A/B 모두 실패: blocked + 복구조치 반환

관련 구현 위치:

- [track3/data/run_track3_simulation.py](../data/run_track3_simulation.py)

핵심 함수:

- compose_response

이 방식의 의미는 사용자에게 실패를 숨기지 않고, 현재 답변의 품질 경계를 명시한다는 점입니다.

### 3-4. 실행 컨텍스트와 감사 로그

각 실행 산출물은 아래 정보를 포함합니다.

- runContext: scenarioId, mode, runAt, retryPolicy
- toolStatus: toolA/toolB의 시도 수, 실패 로그
- response: 요약, 근거, 경고, 조치

결과 파일은 아래 패턴으로 저장됩니다.

- generated/responses/{scenarioId}__{mode}.json

이 구조는 운영 중 장애 분석, 회귀 비교, 품질 감사의 기본 데이터가 됩니다.

## 4) 품질 게이트 자동 평가 구현

Track3에서는 결과 JSON을 규칙 기반으로 자동 평가합니다.

관련 구현 위치:

- [track3/data/evaluate_track3_outputs.py](../data/evaluate_track3_outputs.py)

평가 규칙 요약:

1. normal/tool-*-transient는 overallStatus=pass여야 함
2. pass 모드에서 정형 지표 존재 여부 확인
3. pass 모드에서 evidence 링크 2개 이상 확인
4. tool-a-down은 partial + "정형 수치 미검증" 경고 필요
5. tool-b-down은 partial + "업무 문서 근거 없음" 경고 필요
6. both-down은 blocked이며 evidence 링크가 없어야 함

출력:

- JSON 리포트
- Markdown 리포트
- strict 옵션 사용 시 실패가 있으면 비정상 종료(자동 게이트 용도)

## 5) FabricIQ 관점 운영 체크리스트

아래는 Track3를 실제 운영형 점검으로 사용할 때의 FabricIQ 체크 항목입니다.

### 5-1. 데이터/모델 신뢰성

- KPI 계산에 사용한 원천 테이블/CSV가 명시되어 있는가
- 지표 정의(분자/분모/필터)가 문서화되어 있는가
- 결측/미확정 상태를 실패로 볼지 별도 상태로 볼지 정책이 고정되어 있는가

### 5-2. 신선도/일관성

- 지표 기준 시각이 응답 또는 로그에 남는가
- 동일 질문을 재실행했을 때 비정상적 변동이 없는가
- WorkIQ 근거와 지표가 시간적으로 크게 어긋나지 않는가

### 5-3. 장애 대응

- FabricIQ 연결 실패 시 partial 경고가 정확히 노출되는가
- 복구 이후 동일 질문 재실행 경로가 문서화되어 있는가
- both-down 시 차단 응답이 생성되고 근거 링크가 차단되는가

## 6) 운영 확장 시 권장 구현

현재 Track3는 로컬 시뮬레이션 기반 검증 프레임이므로, 실서비스 확장 시 아래를 추가하는 것을 권장합니다.

1. 실시간 Fabric 데이터 소스 연결
2. 지표 버전 관리(semantic model version, metric contract version)
3. 요청 단위 Trace ID 전파(Foundry 호출, Tool 호출, 리포트 파일 연계)
4. 모델/프롬프트 변경 시 회귀 스위트 자동 실행
5. SLA/SLO(응답시간, 실패율, partial 비율) 모니터링

## 7) 실행 명령 예시

Track3 운영형 검증을 로컬에서 재현하는 표준 명령:

```bash
cd track3/data
python generate_track3_samples.py
python run_track3_simulation.py --all --mode normal
python run_track3_simulation.py --scenario-id Q1 --mode tool-a-down
python run_track3_simulation.py --scenario-id Q1 --mode tool-b-down
python run_track3_simulation.py --scenario-id Q1 --mode both-down
python evaluate_track3_outputs.py --strict
```

노트북 기반 실행:

- [track3/data/Track3_Mission_Workbench.ipynb](../data/Track3_Mission_Workbench.ipynb)
- [track3/data/Track3_EndToEnd_Learner_Notebook.ipynb](../data/Track3_EndToEnd_Learner_Notebook.ipynb)

## 8) 결론

Track3에서 "운영형 에이전트"라는 표현은 아래가 구현되었음을 의미합니다.

1. FabricIQ/WorkIQ 역할 분리
2. 실패를 포함한 실행 모드 시뮬레이션
3. 재시도/부분응답/차단 정책의 코드화
4. 실행 로그 표준화(runContext/toolStatus/response)
5. 자동 품질 게이트와 strict 판정

즉, Track3는 단순한 모델 응답 품질 확인을 넘어서, 운영 환경에서 발생하는 실패와 복구까지 검증 가능한 기술 프레임을 구현한 상태입니다.
