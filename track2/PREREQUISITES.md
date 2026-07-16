# Track2 실습 준비물 상세 설명 (WorkIQ)

이 문서는 Track 2(WorkIQ: M365 컨텍스트 연결 + 크로스 소스 품질 검증) 실습 준비물을 정리합니다.

참가자 실습 절차는 [WORKBOOK.md](WORKBOOK.md)를 따릅니다.

## 0) Track2 시작 입력 계약 (Track1 인계)

Track2는 아래 인계 패키지가 있어야 지연 없이 시작할 수 있습니다.

| 필수 입력 | 내용 |
|---|---|
| Ontology 식별 정보 | `WORKSPACE_ID`, `ONTOLOGY_ID`, Ontology 이름 |
| 모델 요약 | 엔터티/관계 개수, 핵심 경로 3개 |
| 매핑 근거 | `Entity -> table.column` 핵심 매핑 5개 이상 |
| WorkIQ 검색 키 | 캠페인명/상품명/고객등급 키워드 |
| 품질 이슈 Top3 | 영향도 + 임시 우회안 |
| 검증 로그 | Track1 SQL 검증 결과 링크/캡처 |

참조:
- [WORKBOOK.md](../track1/WORKBOOK.md) (Track2 인계 패키지 템플릿)
- [Track1_WorkIQ_Seed_Content_Specification.md](../track1/docs/Track1_WorkIQ_Seed_Content_Specification.md)
- [track2/data/README.md](./data/README.md) (60개 업무 항목 생성·배포 패키지)
- [Instructor_Day_of_Operations_Checklist.md](../common/docs/Instructor_Day_of_Operations_Checklist.md)

## 1) 핵심 준비물

| 항목 | 설명 |
|---|---|
| Microsoft Graph API 접근 권한 | WorkIQ가 M365 콘텐츠를 색인하는 데 필요한 위임/앱 권한 (예: Mail.Read, Files.Read.All, ChannelMessage.Read.All, Sites.Read.All) |
| 대상 SharePoint 사이트 | 캠페인 기획서/성과 리포트가 저장된 샘플 사이트 |
| 대상 Outlook 메일함 | 리더십 이슈 논의 메일이 담긴 공유 메일함 또는 샘플 사용자 계정 |
| 대상 Teams 채널 | CS 티어2 대응 채널(샘플) |
| 대상 OneDrive 폴더 | 미팅 노트가 담긴 공유 폴더 |
| 검색/검증 도구 | 제공 WorkIQ 커넥터 화면 또는 Microsoft Graph Explorer/API 클라이언트 |
| 샘플 콘텐츠 시드셋 | Track1 Ontology 엔터티명이 실제로 언급된 기준 시드 19건(SharePoint 6/Outlook 5/Teams 5/OneDrive 3) |
| 확장 실행 패키지 | SharePoint DOCX 15개, Outlook EML 15개, Teams 18개 스레드/55개 메시지, OneDrive DOCX 12개 ([track2/data/](./data/)) |

## 2) 샘플 M365 콘텐츠 준비 기준

소스별 콘텐츠 본문, 메타데이터, 배치 위치, ACL 및 검수 로그의 상세 계약은 [Track1_WorkIQ_Seed_Content_Specification.md](../track1/docs/Track1_WorkIQ_Seed_Content_Specification.md#3-소스별-샘플-데이터-준비-계약)를 따릅니다.

| 소스 | 최소 건수 | 반드시 포함할 콘텐츠 | 필수 메타데이터 |
|---|---:|---|---|
| SharePoint | 6 | 캠페인 기획서, 성과 리포트, 운영 플레이북 | 제목, 본문, 작성/수정 시각, 작성자, 버전, 원본 URL |
| Outlook | 5 | 리더십 이슈 논의, 부서 회신, 운영 요약 | 제목, 본문, 발신/수신/참조, 발송 시각, message ID/링크 |
| Teams | 5 | CS, 재고, 물류 채널 대화와 답글 | 본문, 작성자, 채널, 게시 시각, message ID/링크 |
| OneDrive | 3 | 고객 미팅 노트, 정책 문서, 브리핑 템플릿 | 제목, 본문, 작성/수정 시각, 작성자, 원본 URL |

공통 준비 기준:

- 제목뿐 아니라 **본문에도** 지정 캠페인명/상품명/고객등급을 정확히 포함합니다.
- 각 콘텐츠에 상황, 영향, 결정 또는 후속 조치 중 최소 2개를 포함합니다.
- 참가자 계정은 읽을 수 있고 ACL 검증 계정은 지정 콘텐츠를 읽을 수 없도록 구성합니다.
- 정상 운영 기준은 19건입니다. 15건 축소본은 장애 시 fallback이며 정상 준비 완료로 판정하지 않습니다.
- 권장 경로는 [확장 실행 패키지](./data/README.md)를 생성·배포해 총 60개 업무 항목으로 실습하는 것입니다.

## 3) Track2 시작 시나리오 (첫 15분)

1. Track1 인계 패키지 열기  
2. 5분 안에 필수 필드 6개를 검수  
3. 키워드 5개(캠페인 2, 상품 2, 고객등급 1) 검색  
4. 검색 실패 키워드의 표기 정규화(공백/대소문자/별칭) 후 재실행  
5. 시작 로그 기록:

```text
[TRACK2_KICKOFF_CHECK]
team=<팀명>
ontologyId=<GUID>
keywordProbe=<5개 중 성공 n개>
failedKeywords=<키워드 목록 또는 ->
immediateAction=<정규화/권한/범위 조치>
[/TRACK2_KICKOFF_CHECK]
```

## 4) 사전 점검 체크리스트

- [ ] Graph 권한 승인 완료 (테넌트 관리자 동의 필요할 수 있음)
- [ ] 기준 시드 19건(SharePoint 6/Outlook 5/Teams 5/OneDrive 3) 검색 가능
- [ ] 19건 모두 제목/본문/작성자/시각/원본 링크 또는 ID 확인 가능
- [ ] SharePoint/Outlook/Teams/OneDrive 최소 1개 소스씩 검색 성공
- [ ] 엔터티명(캠페인/상품/고객) 기준 검색 결과 검증 완료
- [ ] 참가자 계정 원본 열기 및 ACL 검증 계정 차단 확인
- [ ] `TRACK2_SEED_READINESS` 로그 작성 완료
- [ ] Track1 인계 패키지 수신/검토 완료
- [ ] `Entity -> table.column` 매핑 근거 5개 이상 수신 확인

## 5) 크로스 소스 품질 점수 기준

항목별 점수는 `0 / 25 / 50 / 75 / 100`으로 기록합니다.

| 점수 | 판정 |
|---|---|
| 100 | 오류 없음, 근거가 재현 가능 |
| 75 | 경미한 오류가 있으나 분석/인용 가능 |
| 50 | 부분 사용 가능, 보정 또는 경고 필요 |
| 25 | 중대한 결함으로 제한적 사용만 가능 |
| 0 | 검증 불가 또는 사용 불가 |

- 항목 통과: **75점 이상**
- Track2 완료 기준: **8개 항목 중 6개 이상 통과**
- 전체 점수: 8개 항목 산술 평균
- 각 점수에는 쿼리 결과/검색 결과/유효 링크 중 하나를 근거로 첨부

품질 항목: 정확성, 완전성, 일관성, 유효성, 중복성, 참조무결성, 적시성, 추적성

## 6) 운영 주의사항

- 실제 임직원 콘텐츠 대신 샘플/격리된 테넌트 콘텐츠 사용
- 권한 최소화 원칙 적용
- 검색 결과의 권한 기반 노출(ACL)과 링크 유효성 확인
- Track1 이슈 Top3를 무시하지 말고 Track2 품질 점수 산정 시 감점/보정 근거로 반영

## 7) Track3 인계 패키지 (Track2 종료 시 필수)

| 인계 항목 | 필수 내용 |
|---|---|
| 인덱스 카탈로그 | 소스별 범위/필터/갱신 시각 |
| 품질 점수 리포트 | 8대 항목 점수 + 미달 항목 |
| 근거 링크 샘플 | 유효 링크 최소 5건 |
| 우선 조치 이슈 | Track3 응답 품질에 직접 영향 주는 이슈 Top3 |
| 검색 재현 세트 | 동일 결과를 재현할 수 있는 질의 3개 |

복붙 템플릿:
```text
[TRACK3_HANDOFF_PACKAGE]
team=<팀명>
handoffAtKst=<YYYY-MM-DD HH:MM>
indexCatalogRef=<경로/문서>
qualityScoreSummary=<정확성:점수, ...>
failedQualityItems=<항목1;항목2 또는 ->
evidenceLinks=<URL1;URL2;URL3;URL4;URL5>
priorityIssues=<이슈1|영향|임시조치; 이슈2|영향|임시조치; 이슈3|영향|임시조치>
reproQueries=<질의1;질의2;질의3>
[/TRACK3_HANDOFF_PACKAGE]
```
