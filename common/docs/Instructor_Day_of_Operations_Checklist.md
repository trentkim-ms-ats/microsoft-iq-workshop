# 3-IQ 워크숍 강사용 당일 운영 체크리스트

- 운영 시간: 09:00-17:00, 총 480분(점심/휴식 포함)
- 기준 문서: [Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md](Fabric_Ontology_AI_Workshop_Integrated_Plan_v2.0.md)
- 강사 역할: 기술 리드(A: Fabric/Foundry), 운영 리드(B: 시간/WorkIQ/제출)

## D-1: 전일 점검

- [ ] Fabric/M365/Foundry 계정·라이선스·권한 최종 확인
- [ ] Fabric Workspace/Lakehouse/Notebook/Ontology 접근 확인
- [ ] [track1/data/](../../track1/data/) 14개 CSV 적재 또는 배포 준비
- [ ] Ontology bundle full/core 배포 경로 사전 실행
- [ ] M365 기준 시드 19건 배치: SharePoint 6/Outlook 5/Teams 5/OneDrive 3
- [ ] 권장: [확장 샘플 패키지](../../track2/data/README.md) 60개 업무 항목 생성·배포
- [ ] 확장 패키지 검수: SharePoint 15/Outlook 15/Teams 18 스레드·55 메시지/OneDrive 12
- [ ] 19건의 제목·본문·작성자/발신자·시각·원본 링크 또는 ID 확인
- [ ] 참가자 계정 원본 열기 및 ACL 검증 계정 차단 확인
- [ ] `TRACK2_SEED_READINESS` 로그 작성 ([시드 콘텐츠 준비 계약](../../track1/docs/Track1_WorkIQ_Seed_Content_Specification.md#3-소스별-샘플-데이터-준비-계약))
- [ ] Foundry chat 모델, Tool A(FabricIQ), Tool B(WorkIQ) 연결 확인
- [ ] 대체 모델·사전 캡처·UI 수동 경로 확보

## T-30분: 직전 점검

- [ ] 팀별 `WORKSPACE_ID`, `ONTOLOGY_ID` 확인
- [ ] Track2 키워드 5개 사전 검색
  - `SummerPush`, `VIPRetention`, `AeroPhone X`, `SmartWatch Pro`, `Platinum`
- [ ] SharePoint/Outlook/Teams/OneDrive 각 1건 원본 링크 열기
- [ ] Track3 표준 질문 Q1 사전 실행
  - `결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?`
- [ ] Tool A/B 근거 링크 열림 확인
- [ ] 강사 A/B 역할 및 장애 지원 채널 재확인

## 시간대별 운영

### 09:00-09:35 오프닝/개념

- [ ] 09:20까지 3개 환경 접속 완료
- [ ] 3-IQ 공통 시나리오와 질문 Q1-Q5 설명
- [ ] Ontology는 공통 어휘, 실제 값은 Lakehouse에 있음을 설명

### 09:35-12:05 Track1

- [ ] 09:55: 14개 테이블 접근/프로파일링 시작 확인
- [ ] 10:35: 표준 키·타입·코드 규칙 초안 확인
- [ ] 11:05-11:15: 휴식
- [ ] 11:35: Ontology 권장 모델 14 엔터티/20 관계 진행 확인
- [ ] `/items`로 Ontology item 14개를 생성하지 않도록 확인
- [ ] 자동화 시 Definition API 또는 bundle notebook만 사용
- [ ] 11:55: SQL 검증 결과(FK 2, PK 중복 1, 금액 불일치 2) 확인
- [ ] 12:00: `TRACK2_HANDOFF_PACKAGE` 작성 시작
- [ ] 12:05: 인계 패키지 필수 필드/키워드/이슈 Top3 제출 확인

### 12:40-14:30 Track2

- [ ] 12:40-12:45: Track1 인계 패키지 6개 필드 검수
- [ ] 12:45-12:55: 키워드 5개 검색, 4개 이상 성공 확인
- [ ] 13:30까지 인덱스 카탈로그/크로스 소스 매핑 완료
- [ ] 13:30-14:05: 품질 8항목 실행
- [ ] 14:05-14:30: 항목별 점수/근거/조치안 작성
- [ ] 항목별 75점 이상을 PASS로 판정
- [ ] 8개 중 6개 이상 PASS 확인
- [ ] `TRACK3_HANDOFF_PACKAGE`와 유효 근거 링크 5건 제출 확인

### 14:40-16:20 Track3

- [ ] 14:40-14:55: `TRACK3_KICKOFF_CHECK` 작성
- [ ] Tool A(FabricIQ)/Tool B(WorkIQ) 단독 헬스체크
- [ ] 표준 질문 Q1을 양쪽 Tool로 실행
- [ ] 15:40까지 에이전트 v0.1 저장
- [ ] 15:40-15:50: Tool A/B 개별 검색
- [ ] 15:50-16:05: 통합 질의
- [ ] 16:05-16:20: 브리핑 생성/빠른 평가
- [ ] 최종 응답에 정형 수치, 문서 근거, 출처 링크, 조치안 포함

### 16:20-17:00 통합 프로젝트/클로징

- [ ] 16:50까지 리더십 조식 브리핑 제출
- [ ] Ontology/WorkIQ/Foundry 산출물 3종 연결 확인
- [ ] 16:50-16:55 팀 발표/피드백
- [ ] 16:55-17:00 KPI/이슈 로그/다음 액션 확인

## 장애 대응 결정표

| 상황 | 즉시 조치 | 전환 기준 |
|---|---|---|
| Ontology full 배포 실패 | core fallback 실행 | 10분 초과 시 UI/사전 캡처 |
| Ontology API 401 | 토큰 재발급 | 재발급 2회 실패 시 UI |
| WorkIQ 검색 0건 | 권한→범위→표기 순 점검 | 10분 초과 시 시드 검색 결과 사용 |
| Foundry 429/5xx | 5초→10초→20초 재시도 | 3회 실패 시 대체 모델 |
| Tool A만 실패 | WorkIQ 부분응답 + 경고 | 최종 PASS 불가 |
| Tool B만 실패 | FabricIQ 부분응답 + 경고 | 최종 PASS 불가 |
| Tool A/B 모두 실패 | 생성 중단, 원인/조치 기록 | 사전 결과로 평가 절차만 수행 |

## 종료 전 산출물 확인

- [ ] Track1: Ontology 스냅샷, 매핑표, 검증 로그, Track2 인계 패키지
- [ ] Track2: 인덱스 카탈로그, 품질 점수, 근거 링크 5건, Track3 인계 패키지
- [ ] Track3: 에이전트 정의, 검색/질의/생성 결과, 평가표, 최종 브리핑
- [ ] 팀별 미완료/부분응답 사유 기록

## 종료 후

- [ ] 실제 단계별 소요시간 기록
- [ ] Preview/API/권한 장애 로그 정리
- [ ] 미완료 원인과 우회 경로 효과 기록
- [ ] 다음 차수 개선 백로그 우선순위 확정
