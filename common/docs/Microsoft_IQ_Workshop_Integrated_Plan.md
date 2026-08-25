# Microsoft IQ 워크숍 통합 계획

> **현재 canonical plan of record:** 참가자·강사·에이전트는 전체 구조, 일정,
> 완료 기준, 인계, 실행 모드를 이 문서에서 확인합니다.

- 구성: **FabricIQ + WorkIQ + WebIQ + FoundryIQ**
- 기준일: 2026-07-30
- 대상: 데이터·AI 도구를 처음 연결해 보는 입문자
- 운영 기준: **480분 (1일)**
- 산업별 PoC 확장 템플릿: [Microsoft IQ 산업별 대표 활용 시나리오](../../industry_playground/Microsoft_IQ_Industry_Scenarios.md)

## 0. 운영 원칙

1. 참가자 순서와 인계 계약은 **Track1 FabricIQ → Track2 WorkIQ → Track3 WebIQ → Track4 FoundryIQ**를 따른다.
2. WebIQ는 외부 근거를 URL citation으로 제공하며 내부 KPI 계산은 하지 않는다.
3. 입문자는 `simulation`으로 계약을 익힌 뒤 권한이 있을 때만 `live`를 실행한다.
4. Track1 P1 데이터 품질 사례는 설명 전용이며 참가자 제출·진입 게이트에 포함하지 않는다.

## 1. Microsoft IQ의 책임

| IQ | 주 소스 | 한 문장 책임 | 최종 브리핑 예 |
|---|---|---|---|
| FabricIQ | Fabric Lakehouse, Ontology | 내부 비즈니스의 정형 사실 | 배송 지연군 반품률 |
| WorkIQ | Outlook, Teams, SharePoint, OneDrive | 권한이 적용된 내부 업무 맥락 | 물류팀 회의·CS 대응 근거 |
| WebIQ | 공개 웹 | 최신 외부 상황과 URL citation | 공식 기상·교통·서비스 상태 |
| FoundryIQ + Foundry Agent Service | 지식 기반, agent, model, evaluation | 권위 지식 제공 + 세 근거를 라우팅·결합·평가 | 수치+내부 근거+외부 근거+조치 |

Microsoft 제품 경계에서 Foundry IQ는 정책·권위 문서·재사용 지식 기반을 제공하고 Foundry Agent Service가 도구를 오케스트레이션합니다. 수업에서는 두 책임을 구분해 설명합니다.

### 책임 분리 규칙

- 수치는 FabricIQ에서만 계산합니다.
- 내부 의사결정·담당자·문서는 WorkIQ에서만 인용합니다.
- 외부 최신 주장은 WebIQ URL citation과 확인 시각을 가집니다.
- FoundryIQ는 없는 숫자·링크·인과관계를 만들지 않습니다.
- 외부 웹만 남은 경우 내부 원인을 분석하지 않고 차단합니다.

## 2. 전체 시나리오

### 비즈니스 배경

유통 기업 A는 최근 30일 매출이 급락했습니다.

- 주문·결제·배송·반품·재고 데이터는 Fabric Lakehouse에 있습니다.
- 캠페인 문서, 리더십 이메일, CS Teams 대화, 고객 미팅 노트는 M365에 흩어져 있습니다.
- 리더십은 원인과 대응안을 근거와 함께 매일 아침 받으려 합니다.

### 공통 질문

| ID | 질문 |
|---|---|
| Q1 | 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가? |
| Q2 | 배송 지연은 반품률과 고객 만족도에 어떤 영향을 미치는가? |
| Q3 (기초 질문) | 프로모션 유형별 전략이 매출총이익과 재구매율에 미치는 영향은? |
| Q3 (통합 자동검증) | 핵심 상품 3종의 매출·반품 신호를 어떻게 해석할 것인가? |
| Q4 | 재고 부족 경험이 취소율과 문의량에 미치는 영향은? |
| Q5 | 채널·고객등급별 반품 사유가 재구매율에 만드는 차이는? |

공통 질문의 트랙별 수행 위치는 아래 기준을 따릅니다.

| 트랙 | 수행 내용 | 기준 문서 |
|---|---|---|
| Track1 FabricIQ | 질문별 정형 지표·Ontology 경로 준비 | [Track1 실습지](../../track1/WORKBOOK.md) |
| Track2 WorkIQ | 질문별 내부 문서 근거·품질 게이트 점검 | [Track2 실습지](../../track2/WORKBOOK.md) |
| Track3 WebIQ | 질문별 공개 웹 확인 포인트(citation) 기록 | [Track3 실습지](../../track3/WORKBOOK.md)의 `시나리오 연결` |
| Track4 FoundryIQ | 세 근거 결합·fallback·최종 응답 평가 | [Track4 실습지](../../track4/WORKBOOK.md) |

## 3. 학습 목표

이 워크숍은 "정답을 빠르게 내는 것"이 아니라 **Microsoft IQ 구성요소가 각각 무엇을 하고, 왜 이 순서로 연결되는지를 직접 경험하는 것**을 목표로 합니다.

1. FabricIQ·WorkIQ·WebIQ·FoundryIQ가 각각 어떤 데이터 소스를 사용하고 무엇을 책임지는지 설명할 수 있다.
2. 동일한 비즈니스 질문이 IQ마다 어떻게 다르게 처리되는지 비교할 수 있다.
3. 하나의 IQ만으로 답할 수 없는 이유, 그리고 Track1→2→3→4 순서가 만들어지는 이유를 설명할 수 있다.
4. 실제 시나리오에서 어떤 IQ가 어떤 역할을 맡는지 스스로 판단할 수 있다.

<a id="recommended-600-minute-schedule"></a>
<a id="current-480-minute-schedule"></a>
## 4. 운영 일정: 480분

| 시간 | 세션 | 분 | 간단 설명 | 참고 |
|---|---|---:|---|---|
| 09:00-09:30 | 오프닝·Microsoft IQ 개념 | 30 | Microsoft IQ 역할 경계와 실습 흐름 소개 | [통합 아키텍처](Microsoft_IQ_Workshop_Full_Architecture.pptx) |
| 09:30-12:00 | Track1 FabricIQ(휴식 포함) | 150 | 정형 데이터·Ontology 준비 후 Track2 인계 생성 | [Track1 실습지](../../track1/WORKBOOK.md) · [Track1 개요](Track1_Overview.pptx) · [QUICKSTART](../../track1/QUICKSTART.md) |
| 12:00-12:35 | 점심 | 35 | 중간 휴식 및 팀별 진행 상태 정리 | — |
| 12:35-14:25 | Track2 WorkIQ | 110 | M365 근거 수집·품질 게이트·Track3 입력 패키지 작성 | [Track2 실습지](../../track2/WORKBOOK.md) · [Track2 개요](Track2_Overview.pptx) · [QUICKSTART](../../track2/QUICKSTART.md) |
| 14:25-14:35 | 휴식 | 10 | 다음 트랙 전환 준비 | — |
| 14:35-15:10 | Track3 WebIQ 브리지 압축 실습 | 35 | 공개 웹 citation 추가 후 Track4 인계 패키지 작성 | [Track3 실습지](../../track3/WORKBOOK.md) · [Track3 개요](Track3_Overview.pptx) · [QUICKSTART](../../track3/QUICKSTART.md) |
| 15:10-16:10 | Track4 FoundryIQ 통합 | 60 | 세 근거 결합·fallback 정책으로 통합 응답 생성 | [Track4 실습지](../../track4/WORKBOOK.md) · [Track4 개요](Track4_Overview.pptx) · [QUICKSTART](../../track4/QUICKSTART.md) |
| 16:10-16:45 | 통합 미니 프로젝트 | 35 | Q1~Q3 통합 실행과 결과 비교·토의 | [학습 맵](Microsoft_IQ_Beginner_Learning_Map.md) |
| 16:45-17:00 | 리뷰·클로징 | 15 | 산출물 점검 및 다음 실행 가이드 정리 | [강사 체크리스트](Microsoft_IQ_Instructor_Day_of_Operations_Checklist.md) |

압축형은 사전 생성된 Track1/2 산출물을 제공하고 FoundryIQ 고급 설정은 데모로
전환합니다. Track2 110분과 Track1 → Track2 → Track3 → Track4 순서는 유지합니다.

## 5. 트랙 간 인계 계약

```text
Track1 FabricIQ
  -> TRACK2_WORKIQ_HANDOFF_PACKAGE
Track2 WorkIQ
  -> TRACK3_WEBIQ_HANDOFF_PACKAGE
Track3 WebIQ
  -> TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE
Track4 FoundryIQ
  -> Microsoft IQ response + evaluation output + leadership briefing
```

| 구간 | 필수 입력 | 게이트 |
|---|---|---|
| FabricIQ→WorkIQ | Workspace/Ontology 식별 정보, 엔터티·관계 수, 핵심 경로 3개, 핵심 매핑 5개 이상, 구현 제한 또는 `none-known`, WorkIQ 키, 의미 경로 로그 | Track2 첫 5분에 6개 범주 검수 |
| WorkIQ→WebIQ | 인덱스 카탈로그, 품질 8개 점수, 내부 근거 링크 5개 이상, 우선 이슈 3개, 재현 질의 3개 | 6/8 게이트 통과, 내부 질문과 공개 확인 질문 분리 |
| WebIQ→FoundryIQ | URL·제목·관찰 시각·scope·fact status·한계, 실행 모드, privacy 점검 | Q1~Q3 각 citation 2개, 출처 품질 5/6 이상 |
| FoundryIQ→최종 | 세 근거와 Microsoft IQ sourceTrace | normal Q1~Q3와 fallback 5종 strict PASS |

## 6. 실행 프로필과 완료 기준

실행 모드(`dry-run` / `simulation` / `live`) 정의와 명령어는 [Track4 FoundryIQ 기술 가이드](../../track4/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)를 참조합니다.

## 7. 완료 기준

| 기준 | 확인 방법 |
|---|---|
| Track1~4 각 트랙 실습 완료 및 인계 패키지 생성 | 각 트랙 WORKBOOK 체크리스트 |
| Q1~Q3 통합 시나리오 end-to-end 실행 완료 | Track4 통합 미니 프로젝트 결과 |
| 참가자가 Microsoft IQ의 역할과 순서를 설명할 수 있음 | 리뷰·클로징 세션 확인 |
| 각 응답에 사용된 IQ 근거 출처가 명시됨 | 최종 산출물 점검 |

기술 검증 기준(fixture schema 검증, simulation evaluation, fallback 테스트)은 [Track4 FoundryIQ 기술 가이드](../../track4/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)를 참조합니다.

## 8. 입문자·강사 진입점

- 참가자: [Microsoft IQ 워크숍 입문 학습 지도](Microsoft_IQ_Beginner_Learning_Map.md)
- Track3 WebIQ: [Quick Start](../../track3/QUICKSTART.md), [Workbook](../../track3/WORKBOOK.md)
- Track4 FoundryIQ: [Quick Start](../../track4/QUICKSTART.md), [Workbook](../../track4/WORKBOOK.md)
- 강사: [Microsoft IQ 워크숍 당일 운영 체크리스트](Microsoft_IQ_Instructor_Day_of_Operations_Checklist.md)
