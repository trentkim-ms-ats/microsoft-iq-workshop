# Microsoft 3-IQ 통합 (WorkIQ + FabricIQ + FoundryIQ) AI 데이터 준비 워크숍 통합 계획 (v2.0)

- 문서 버전: v2.0 (WorkIQ + FabricIQ + FoundryIQ 통합 시나리오)
- 작성일: 2026-07-09
- 준비 인원: 2명 (기술 리드 1, 콘텐츠/운영 리드 1)
- 워크숍 운영 시간: 1일 8시간 (480분, 점심/휴식 포함)
- 대상 수준: 데이터/SQL 기초 보유자 + AI 활용 관심자 (초·중급)

## 0. 3-IQ 통합 스택 개요

이 워크숍은 Microsoft의 세 가지 지능형 데이터 계층(3-IQ)을 하나의 실무 시나리오로 연결합니다.

| 계층 | 이름 | 주 소스 | 역할 |
|---|---|---|---|
| 정형 시맨틱 | **FabricIQ** | Microsoft Fabric + Ontology(Preview) | 매출/주문/CS 등 정형 비즈니스 데이터를 엔터티/관계로 의미화하고 질의 |
| 업무 컨텍스트 | **WorkIQ** | Microsoft 365 (Outlook, Teams, OneDrive/SharePoint) | 이메일·미팅·문서·채팅에 흩어진 업무 맥락을 색인하고 검색 |
| AI 오케스트레이션 | **FoundryIQ** | Azure AI Foundry (모델·에이전트·평가) | FabricIQ + WorkIQ를 그라운딩 소스로 연결한 커스텀 AI 에이전트 구축·평가 |

**3-IQ가 함께 작동해야 하는 이유**  
정형 지표만으로는 "왜 매출이 떨어졌는가"에 답할 수 없고(맥락 부재), 업무 문서만으로는 근거 있는 수치를 제시할 수 없습니다. **FabricIQ의 정형 시맨틱**과 **WorkIQ의 업무 맥락**을 **FoundryIQ 에이전트**가 통합·근거화(grounding)해야 실행 가능한 인사이트가 만들어집니다.

이때 Ontology(Preview)는 세 계층을 잇는 **공통 어휘(shared vocabulary)** 로 작동합니다 — FabricIQ가 이 온톨로지로 정형 데이터를 의미화하고, WorkIQ는 같은 엔터티 태그로 M365 문서를 색인하며, FoundryIQ는 그 공통 어휘 위에서 두 소스를 결합합니다.

## 1. 워크숍 목적 및 성과 목표

### 목적
- Ontology(Preview)로 FabricIQ가 이해 가능한 시맨틱 데이터 구조를 설계·검증한다.
- WorkIQ로 M365의 업무 문맥을 색인·연결해 정형 데이터에 컨텍스트를 결합한다.
- FoundryIQ 에이전트를 구축해 FabricIQ + WorkIQ를 근거로 하는 AI 답변을 생성·평가한다.
- 참가자가 “수치=FabricIQ, 업무 근거=WorkIQ, 결합·평가=FoundryIQ” 책임을 설명하고 `sourceTrace`로 증명한다.

### KPI (측정 기준: 각 트랙 DoD 항목 충족 여부)
- 참가자 80% 이상: FabricIQ용 Ontology 모델(엔터티 10-16 / 관계 15-25) 검증 완료 (Track 1 DoD)
- 참가자 80% 이상: WorkIQ 인덱스 연결 + 크로스 소스 품질 8개 중 6개 이상 통과 (Track 2 DoD)
- 참가자 70% 이상: FoundryIQ 에이전트가 시나리오 3종(검색/질의/생성)에서 근거 링크 포함 응답 성공 (Track 3 DoD)
- 참가자 80% 이상: 3-IQ 역할 확인 질문 4개 중 3개 이상을 실행 증거와 함께 설명

## 2. 워크숍 전체 시나리오

### 비즈니스 배경
유통 기업 A는 최근 30일 매출이 급락했다.
- 정형 데이터(주문/결제/배송/반품/재고)는 Fabric Lakehouse에 있으나 엔터티·관계가 표준화되지 않아 **FabricIQ가 안정적으로 답변하지 못함**.
- 캠페인 기획서, 리더십 이메일, CS 대응 Teams 채널, 고객사 미팅 노트는 M365(SharePoint/Outlook/Teams)에 흩어져 있어 **WorkIQ 색인 대상이지만 아직 연결되지 않음**.
- 리더십은 "매출 하락 원인 요약 + 대응안"을 근거와 함께 매일 아침 자동으로 받길 원함 → **FoundryIQ 에이전트로 자동화 필요**.

### 해결 목표
`FabricIQ 시맨틱 구축 → WorkIQ 컨텍스트 연결 → FoundryIQ 에이전트화`를 end-to-end로 완료해, 근거 있는 리더십 브리핑 자동화 파이프라인을 만든다.

### 공통 비즈니스 질문 (전 트랙 관통)
1. 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?
2. 배송 지연은 반품률과 고객 만족도에 어떤 영향을 미치는가?
3. 프로모션 유형별 할인 전략이 매출총이익과 재구매율에 미치는 영향은 무엇인가?
4. 재고 부족/품절 경험은 주문 취소율과 고객센터 문의량에 어떤 영향을 미치는가?
5. 채널·고객등급별 반품 사유 패턴은 재구매율에 어떤 차이를 만드는가?

### 최종 팀 산출물
- **Track 1 (FabricIQ)**: Ontology 스냅샷(엔터티/관계/속성), FabricIQ 시맨틱 매핑표
- **Track 2 (WorkIQ)**: WorkIQ 인덱스 카탈로그(M365 소스 인벤토리), 크로스 소스 품질 점수 리포트(8대 항목)
- **Track 3 (FoundryIQ)**: FoundryIQ 에이전트 정의(그라운딩·프롬프트·평가), AI 결과 3종 + 근거 링크

### 트랙 간 입력 계약 (Handoff Contract)

| 구간 | 필수 입력 | 검수 기준 |
|---|---|---|
| Track1 → Track2 | `WORKSPACE_ID`, `ONTOLOGY_ID`, 엔터티/관계 수량, 핵심 경로 3개, `Entity→table.column` 매핑 5개, WorkIQ 검색 키워드, 미해결 이슈 Top3, 검증 로그 | Track2 첫 5분에 필드 검수 완료 |
| Track2 → Track3 | WorkIQ 인덱스 카탈로그, 크로스 소스 품질 점수(8항목), 우선 조치 이슈, 유효 근거 링크 5건, 재현 질의 3개 | Track3 첫 15분에 Tool A/B 테스트 통과 |

## 3. 1일(8시간) 상세 어젠다

| 시간 | 세션 | 내용 | 방식 | 산출물 |
|---|---|---|---|---|
| 09:00-09:15 (15분) | 오프닝/환경체크 | 목표 공유, Fabric/M365/Foundry 접근 확인 | 안내+점검 | 접속 완료 체크 |
| 09:15-09:35 (20분) | 개념 세션 | 3-IQ(FabricIQ/WorkIQ/FoundryIQ) 개념, Ontology의 역할, 실습 흐름 | 강의 | 실습 맵 이해 |
| 09:35-11:05 (90분) | Track 1-1 FabricIQ 데이터 준비 | 원천 탐색, 스키마 정리, 엔터티 후보 도출 | 실습 | 엔터티 후보표 |
| 11:05-11:15 (10분) | 휴식 | Break | 휴식 | - |
| 11:15-12:05 (50분) | Track 1-2 FabricIQ Ontology 설계 | 엔터티/관계/속성 정의, 매핑 규칙 작성 | 실습 | Ontology 초안 |
| 12:05-12:40 (35분) | 점심 | Lunch | 휴식 | - |
| 12:40-13:30 (50분) | Track 2-1 WorkIQ 컨텍스트 연결 | **Track1 인계 패키지 검수 후** M365 소스 인벤토리, WorkIQ 인덱스/커넥터 구성, 검색 검증 | 실습 | WorkIQ 인덱스 카탈로그 |
| 13:30-14:30 (60분) | Track 2-2 크로스 소스 품질 검증 | 정형+비정형 8대 품질 규칙 실행, 점수화 | 실습 | 크로스 품질 리포트 |
| 14:30-14:40 (10분) | 휴식 | Break | 휴식 | - |
| 14:40-15:40 (60분) | Track 3-1 FoundryIQ 에이전트 구축 | Foundry 프로젝트, 그라운딩(Fabric+WorkIQ), 프롬프트/툴 정의 | 실습 | 에이전트 v0.1 |
| 15:40-16:20 (40분) | Track 3-2 시나리오 실행/평가 | 검색·질의·생성 3종 실행, 근거 링크·환각율 평가 | 실습 | 시나리오 결과+평가표 |
| 16:20-16:50 (30분) | 통합 미니 프로젝트 | 3-IQ end-to-end 리더십 브리핑 에이전트 완성 | 팀 실습 | 최종 브리핑 |
| 16:50-17:00 (10분) | 리뷰/클로징 | 발표, 피드백, 다음 액션 | 발표+Q&A | 개선 포인트 |

### 트랙별 시간 합계
- Track 1 (FabricIQ / Ontology): 140분
- Track 2 (WorkIQ + 크로스 품질): 110분
- Track 3 (FoundryIQ 에이전트): 100분
- 통합 프로젝트: 30분
- 오프닝/개념/클로징: 45분
- 휴식/점심: 55분
- **총합: 480분 (8시간, 09:00-17:00)**

## 4. 트랙별 상세 운영 시나리오

### 트랙별 실습 준비물 상세 문서
- Track 1: [PREREQUISITES.md](../../track1/PREREQUISITES.md)
- Track 2: [WORKBOOK.md](../../track2/WORKBOOK.md), [PREREQUISITES.md](../../track2/PREREQUISITES.md)
- Track 3: [PREREQUISITES.md](../../track3/PREREQUISITES.md)
- 강사용 당일 운영: [Instructor_Day_of_Operations_Checklist.md](Instructor_Day_of_Operations_Checklist.md)

### Track 1 실습 배치 안내
- Track 1은 총 실습 140분 + 휴식 10분 = 벽시간 150분(09:35-12:05)으로 구성됩니다.
- 어젠다상 90/50 분할은 브레이크를 기준으로 한 블록이며, 실제 미션 시간표는 [Track1_Instructor_Script_v1.0.md](../../track1/docs/Track1_Instructor_Script_v1.0.md) 분단위 표를 따릅니다.
- Track 1의 "1차 검증"은 **구조 무결성**(참조/코드/중복)에 초점을 두며, **크로스 소스 품질 게이트/점수화는 Track 2**에서 수행합니다.

### 4.1 Track 1. FabricIQ 시맨틱 레이어: Fabric + Ontology(Preview) 데이터 준비 (140분)

#### 목표
Lakehouse 정형 데이터를 **FabricIQ가 이해 가능한 AI 친화적 시맨틱 구조**로 정제하고 Ontology 엔터티/관계/속성을 설계한다. 비정형 업무 컨텍스트는 Track2에서 연결하며, Track1에서는 복잡 관계와 검증 가능한 정형 기준값을 준비해 Track3의 FoundryIQ 에이전트가 신뢰할 만한 그라운딩 소스로 사용할 수 있게 한다.

#### 사전 준비물
- 샘플 데이터 (고객/주문/주문상세/상품/반품/채널 + 결제/배송/재고/프로모션/캠페인/CS)
- Fabric Lakehouse, Notebook, Ontology(Preview) 활성화
- 권한 템플릿

#### 단계별 진행
| 단계 | 시간 | 준비 내용 | 실습/개발 내용 | 완료 기준 |
|---|---|---|---|---|
| 1) 요구사항 정리 | 10분 | 핵심 비즈니스 질문 도출 | 도메인 질문 5개 정리 | 질문-데이터 연결표 작성 |
| 2) 데이터 탐색/프로파일링 | 30분 | 결측/중복/이상 탐지 기준 | Notebook 프로파일링 | 이슈 목록 도출 |
| 3) 표준 스키마 설계 | 30분 | 키/타입/코드 규칙 | 표준화 로직 반영 | 공통 스키마 확정 |
| 4) Ontology 엔터티/관계 설계 | 40분 | 엔터티/관계 템플릿 | 모델링 및 매핑 | 엔터티 10-16, 관계 15-25 |
| 5) 1차 검증(구조 무결성) | 30분 | 무결성 체크리스트 | 관계/참조 무결성 검증 | 매핑 오류 수정 완료 (품질 점수화는 Track 2) |

세부 실습 절차는 [WORKBOOK.md](../../track1/WORKBOOK.md), 데이터 스펙은 [Track1_Data_Structure_Detailed_Guide.md](../../track1/docs/Track1_Data_Structure_Detailed_Guide.md)를 참조.

#### Track2 진입 게이트 (Track1 마지막 5분에 수행)
- `TRACK2_HANDOFF_PACKAGE` 제출 여부 확인
- Ontology 핵심 경로 3개가 Track2 검색 질문과 매칭되는지 확인
- WorkIQ 키워드 오탈자/표기 불일치 사전 정리
- 미해결 이슈 Top3의 임시 우회안을 Track2 팀에 공유

### 4.2 Track 2. WorkIQ 업무 컨텍스트 연결 + 크로스 소스 품질 검증 (110분)

#### 목표
M365(Outlook/Teams/SharePoint/OneDrive)에 흩어진 업무 컨텍스트를 **WorkIQ로 색인**하고, Track 1의 FabricIQ 시맨틱과 결합한 **크로스 소스 품질 게이트**를 통과시킨다.

#### 사전 준비물
- WorkIQ 접근 권한 (Microsoft Graph API 스코프 포함)
- 대상 M365 컬렉션: 캠페인 기획 SharePoint 사이트, 리더십 배포 리스트 메일함, CS 대응 Teams 채널, 미팅 노트 OneDrive 폴더
- 품질 체크 규칙표 (정형+비정형 확장판)
- 검증 쿼리·검색 템플릿

#### WorkIQ 인덱스 대상 (예시)
| 소스 | 콘텐츠 유형 | 활용 예 |
|---|---|---|
| Outlook | 리더십 이슈 논의 메일 | 매출 하락 이슈 인지 시점·논조 파악 |
| Teams | CS 티어2 대응 채널 | 특정 상품/캠페인 관련 클레임 클러스터 |
| SharePoint | 캠페인 기획서·성과 리포트 | 프로모션 의도와 실제 결과 대조 |
| OneDrive | 고객사 미팅 노트 | 반품 급증 상품군에 대한 현장 피드백 |

#### 품질 8대 항목 (크로스 소스 확장)
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

#### 품질 점수 및 통과 기준
- 항목별 점수: `0 / 25 / 50 / 75 / 100`
- 항목 통과: **75점 이상**
- Track2 DoD: **8개 항목 중 6개 이상 통과**
- 전체 점수: 8개 항목 단순 평균(가중치가 필요하면 팀별로 별도 명시)
- 점수 근거: 각 항목에 쿼리 결과, 검색 결과 또는 유효 링크를 최소 1개 첨부

#### 단계별 진행
| 단계 | 시간 | 실습 내용 | 산출물 | 완료 기준 |
|---|---|---|---|---|
| 1) 킥오프 검수 + M365 소스 인벤토리 | 25분 | 인계 패키지 5분 검수, 키워드 프로브 10분, 인덱스 범위 확인 10분 | 킥오프 로그+인덱스 카탈로그 | 키워드 5개 중 4개 이상 검색 |
| 2) 크로스 소스 매핑 | 25분 | Ontology 엔터티(캠페인/상품/고객) ↔ WorkIQ 문서 태그 연결 | 매핑표 v2 | 엔터티당 M365 문서 최소 1건 매핑 |
| 3) 품질 규칙 실행 | 35분 | 8대 항목 규칙 및 임계치 실행 (정형+비정형) | 오류/결함 목록 | 오류 유형 분류 완료 |
| 4) 점수화 및 리포트 | 25분 | 품질 점수 계산, 우선순위 결정 | 크로스 품질 리포트 | 미달 항목 2개 이상 조치안 |

#### Track2 시작 시나리오 (첫 15분)
1. 0-5분: Track1 인계 패키지 필수 필드 검수
2. 5-12분: 키워드 5개 검색 후 "검색 가능/불가" 분류
3. 12-15분: 실패 키워드 표기 정규화 후 재시도 및 성공률 기록

### 4.3 Track 3. FoundryIQ 에이전트: 3-IQ 통합 AI 시나리오 (100분)

Track 3 상세 문서:
- [WORKBOOK.md](../../track3/WORKBOOK.md)
- [Track3_FoundryIQ_Introduction_and_Technical_Guide.md](../../track3/docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)

#### 목표
Azure AI Foundry에서 **FabricIQ와 WorkIQ를 그라운딩 소스로 연결한 커스텀 AI 에이전트**를 구축하고, 리더십 브리핑 자동화 시나리오(검색/질의/생성)를 실행·평가한다.

#### simulation reference와 live 운영 전환
- 드라이런/리허설에서는 Track1 CSV와 Track2 manifest를 사용하는 Track3 simulation 체인을 실행한다.
- [run_track3_daily_briefing.py](../../tools/run_track3_daily_briefing.py)는 이 simulation reference를 평일 아침 자동 생성·평가하는 배치다.
- live 운영 전환 시에는 정형값을 `FABRICIQ_ENDPOINT`, 비정형 근거를 `WORKIQ_ENDPOINT` adapter에서 조회하는 실행 서비스를 별도로 배포하고 같은 strict 평가·발송 정책을 적용한다.
- 최종 문장화는 `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`와 `AZURE_AI_FOUNDRY_MODEL`을 사용하는 Responses API로 통일한다.
- 배포 시 `pipeline/prompt/model/toolset` 버전을 함께 주입해 `runContext.release`로 회귀 추적 가능 상태를 유지한다.
- 템플릿: [track3-daily-briefing.cron](../../tools/templates/cron/track3-daily-briefing.cron), [track3-daily-briefing.yml](../../.github/workflows/track3-daily-briefing.yml), [track3-daily-briefing.logicapp.template.json](../../tools/templates/logicapps/track3-daily-briefing.logicapp.template.json)
- 알림 확장 템플릿: [track3-daily-briefing-with-notify.cron](../../tools/templates/cron/track3-daily-briefing-with-notify.cron), [track3-daily-briefing-with-notify.yml](../../.github/workflows/track3-daily-briefing-with-notify.yml), [track3-daily-briefing-with-notify.logicapp.template.json](../../tools/templates/logicapps/track3-daily-briefing-with-notify.logicapp.template.json)

#### 사전 준비물
- Azure AI Foundry 프로젝트 및 모델 배포 권한
- FabricIQ 시맨틱 결과를 Track3 JSON 계약으로 변환하는 adapter endpoint
- WorkIQ 인덱스 검색 결과를 Track3 JSON 계약으로 변환하는 adapter endpoint
- Azure AI Foundry Responses API endpoint/model 및 API key 또는 Entra Bearer token
- 프롬프트 템플릿·평가 루브릭

#### 에이전트 아키텍처 (권장)

```
                사용자 질문
                    │
                    ▼
         FoundryIQ 에이전트
         (오케스트레이션 + 라우팅)
              │             │
    ┌─────────┘             └─────────┐
    ▼                                 ▼
Tool A: FabricIQ 시맨틱 질의    Tool B: WorkIQ 검색
(Ontology 관계 경로 → 지표)    (M365 원본 인용 → 컨텍스트)
    │                                 │
    └─────────┬─────────────┬─────────┘
              ▼             ▼
          근거 결합 → 최종 응답
       (수치 + 인용 링크 + 요약)
```

#### 시나리오별 운영
| 단계 | 시간 | 목표 | 실습 내용 | 평가 기준 |
|---|---|---|---|---|
| 킥오프/Tool 헬스체크 | 15분 | Track2 인계와 연결 확인 | Tool A/B 단독 실행, 표준 질문 확인 | 두 Tool 모두 성공 |
| 에이전트 구축 | 45분 | 라우팅/프롬프트/출력 형식 완성 | FabricIQ+WorkIQ 도구 및 정책 연결 | 에이전트 v0.1 저장 |
| 검색 (Tool A/B 개별) | 10분 | 각 IQ의 응답 확인 | 동일 표준 질문 개별 실행 | 양쪽 근거 획득 |
| 질의 (Tool A+B 통합) | 15분 | 정형+비정형 결합 | 수치 + 문서 인용 결합 | 수치/링크 유효 |
| 생성/평가 | 15분 | 브리핑 생성 및 빠른 평가 | 요약/조치안/출처 생성 | 근거 누락 0건 |

#### Track3 시작 시나리오 (첫 15분)
1. Track2 인계 산출물(인덱스 카탈로그/품질점수/근거 링크 5건) 로드
2. Foundry에서 Tool A(FabricIQ) / Tool B(WorkIQ) 단독 헬스체크
3. 표준 질문 Q1 "결제 실패가 캠페인 전환율에 미치는 영향은?"을 Tool A/B 각각 실행
4. 실패 시 우선순위: 권한 → 인덱스 범위 → 프롬프트/라우팅 순으로 복구

## 5. 통합 미니 프로젝트 시나리오 (30분)

### 과제
팀별로 `매출 하락 원인 + 리더십 조식 브리핑`을 **3-IQ 통합 에이전트 결과**로 제출한다.

### 제출 구성
- FabricIQ Ontology 스냅샷 (Track 1)
- WorkIQ 인덱스 & 크로스 품질 점수 요약 (Track 2)
- FoundryIQ 에이전트 정의 + 최종 브리핑 결과 (근거/출처 포함)

### 평가 루브릭
- **데이터 정합성**: FabricIQ 시맨틱 결과의 정확도
- **크로스 소스 근거성**: WorkIQ 인용의 관련성/최신성
- **AI 답변 실행가능성**: FoundryIQ 결과의 의사결정 가치

## 6. 준비/개발 WBS (2인 기준)

| Task | 준비/개발 내용 | 담당 | 공수(인시) | 완료 기준 |
|---|---|---|---|---|
| 목표/범위 확정 | 학습목표, 대상수준, KPI 정의 | 공동 | 16 | 승인된 커리큘럼 1차안 |
| 환경/권한 설계 | Fabric/M365/Foundry 워크스페이스·권한·라이선스 | A | 32 | 3-스택 계정 점검표 |
| Track 1 개발 (FabricIQ) | Ontology 실습 데이터/노트북/가이드 | A | 40 | 드라이런 통과 |
| Track 2 개발 (WorkIQ) | M365 샘플 콘텐츠, 인덱스 세팅, 크로스 품질 규칙 | A+B | 40 | 크로스 점수 산출 확인 |
| Track 3 개발 (FoundryIQ) | 에이전트 템플릿·그라운딩 스크립트·평가표 | A+B | 44 | 시나리오 3종 성공 |
| 교안/랩가이드 | 슬라이드, 단계별 실습서, FAQ | B | 32 | 수강생 리뷰 통과 |
| 자동화/리셋 | 환경 초기화, 데이터/인덱스 리셋 스크립트 | A | 20 | 재실행 30분 내 복구 |
| 드라이런 2회 | 시간측정, 난이도 보정, 이슈 수정 | 공동 | 24 | 8시간(480분) 타임박스 준수 |
| 운영체계/백업 | 운영 R&R, 장애 대응 시나리오 (3-스택) | B | 16 | 운영 체크리스트 확정 |
| 버퍼 | Preview·Foundry 기능 변경 대응 | 공동 | 24 | 대체 실습 경로 확보 |

### 총 준비 공수
- 총 준비 공수: 약 288 인시 (±20%)
- 2명 기준 예상 캘린더: 약 5~6주 (버퍼 포함)

## 7. 역할 분담 및 당일 운영 시나리오

### 역할
- **기술 리드(A)**: Fabric/Foundry 환경, Track 1·3 기술 진행, 실습 난이도 조절
- **운영 리드(B)**: 시간관리/질의 대응, Track 2 WorkIQ 색인/품질 리포트 가이드

### 운영 규칙
- 실습 막힘 10분 초과 시 보조 트랙으로 즉시 전환
- 시간 지연 시 선택 미션 축소, 필수 미션 우선 완료
- 공유는 30분 단위로 진도 체크
- 각 트랙 종료 시 다음 트랙 입력 산출물 인계 확인 (온톨로지 → WorkIQ 매핑 시드 → FoundryIQ 그라운딩)

### 당일 체크리스트
- **D-1**: Fabric/M365/Foundry 계정·권한·데이터·인덱스 리셋 최종 점검
- **T-30분**: 샘플 쿼리·WorkIQ 검색·Foundry 프롬프트 사전 실행
- **진행 중**: 30분 단위 진도/이탈자 점검
- **종료 전**: KPI 설문/산출물 제출 확인
- **종료 후**: 이슈 로그/차수 개선안 업데이트

## 8. 리스크 및 대응

- **Ontology(Preview) 기능 변경**: 대체 실습 스텝 + 사전 캡처본 확보
- **WorkIQ 권한/스코프 오류**: D-3 사전 인덱싱, 대체 샘플 콘텐츠셋 준비
- **Foundry 모델 쿼터/속도 제한**: 사전 배포 검증, 모델 대체안 명시
- **크로스 소스 시간 초과**: 필수(70%) + 선택(30%) 모듈화
- **AI 결과 편차**: 평가 루브릭 + 정답 예시(근거 포함) 제공
- **데이터 프라이버시(M365)**: 샘플 테넌트/샘플 콘텐츠만 사용, 실 사용자 콘텐츠 색인 금지

## 9. 워크숍 종료 기준 (Definition of Done)

- 모든 팀이 3개 트랙 산출물(FabricIQ / WorkIQ / FoundryIQ)을 제출
- 통합 미니 프로젝트 브리핑 결과 제출 완료 (근거 링크 포함)
- KPI 측정 결과 수집 및 회고 로그 작성
- 다음 차수 개선 백로그 우선순위 확정
