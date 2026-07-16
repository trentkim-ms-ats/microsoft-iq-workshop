# Track1/2 WorkIQ 매칭용 샘플 M365 콘텐츠 시드 명세

Track 2(WorkIQ)에서 M365 문서를 검색할 때, 정형 데이터의 엔터티가 **사람이 부르는 이름**(상품명/캠페인명)으로 문서에 등장해야 크로스 소스 매칭이 성립합니다.
이 문서는 워크숍용으로 준비해야 할 **기준 시드 19건**의 콘텐츠·메타데이터·배치·검수 계약입니다. 실제 임직원 콘텐츠 대신 샘플/격리 테넌트에 생성합니다.

> 참조 데이터: [track1/data/](../data/), 명명 규칙은 [Track1_Instructor_Data_Answer_Key.md](Track1_Instructor_Data_Answer_Key.md) 참고.
>
> 바로 배포할 수 있는 확장 콘텐츠는 [track2/data/](../../track2/data/)에서 제공합니다. 최소 계약 19건을 포함해 SharePoint 15개, Outlook 15개, Teams 18개 스레드, OneDrive 12개 등 총 60개 업무 항목으로 확장한 패키지입니다.

## 1) 명명 엔터티 (문서에서 언급되어야 하는 이름)

### 상품 (products.product_name)
| product_id | product_name |
|---|---|
| P00001 | UltraBook 15 |
| P00005 | AeroPhone X |
| P00006 | SmartWatch Pro |
| P00002 | DailyTee Cotton |
| P00003 | ComfyChair Home |

### 캠페인 (campaigns.campaign_name)
| campaign_id | 이름 | 기간 | 채널 | 유형 |
|---|---|---|---|---|
| CA00001 | SummerPush | 2026-04-15 ~ 2026-06-15 | Social(CH0003) | Seasonal |
| CA00002 | BackToSchool | 2026-07-15 ~ 2026-08-31 | OnlineMall(CH0001) | Seasonal |
| CA00003 | VIPRetention | 2026-05-01 ~ 2026-05-31 | MobileApp(CH0002) | Retention |
| CA00004 | FlashWeek | 2026-05-10 ~ 2026-05-17 | OfflineStore(CH0004) | Flash |

## 2) 시드 콘텐츠 명세 (소스별)

| # | 소스 | 제목/주제 | 언급 엔터티 | 날짜 | 시나리오 연결 |
|---|---|---|---|---|---|
| 1 | SharePoint | SummerPush 캠페인 킥오프 기획서 | SummerPush, Social | 2026-04-15 | Q1 |
| 2 | SharePoint | SummerPush 중간 성과 리포트 | SummerPush, 전환율 | 2026-05-20 | Q1 |
| 3 | Outlook | [리더십] 5월 매출 급락 이슈 공유 | 매출, SummerPush | 2026-05-18 | 전체 |
| 4 | Outlook | 결제 실패 급증 관련 결제팀 회신 | 결제 실패, AeroPhone X | 2026-05-19 | Q1 |
| 5 | Teams | CS 티어2 - AeroPhone X 배송 지연 클레임 | AeroPhone X | 2026-05-20 | Q3 |
| 6 | Teams | CS 티어2 - SmartWatch Pro 재고 문의 폭증 | SmartWatch Pro | 2026-05-16 | Q3 |
| 7 | Teams | 물류 - UltraBook 15 배송 지연 공지 | UltraBook 15 | 2026-05-17 | Q3 |
| 8 | OneDrive | 고객사 미팅 노트 - 반품 급증 상품군 | DailyTee Cotton, 반품, Platinum | 2026-05-22 | Q2/Q5 |
| 9 | SharePoint | FlashWeek 프로모션 정산 검토 | FlashWeek, 마진 | 2026-05-18 | Q4 |
| 10 | Outlook | VIPRetention 대상 고객 이탈 경고 | VIPRetention, Platinum | 2026-05-15 | Q5 |
| 11 | Teams | 재고팀 - AeroPhone X/SmartWatch Pro 품절 임박 | AeroPhone X, SmartWatch Pro | 2026-05-16 | Q3 |
| 12 | SharePoint | 배송 지연 원인 분석 초안 | 배송 지연, 반품률, VIPRetention, Platinum | 2026-05-23 | Q2/Q5 |
| 13 | OneDrive | 프로모션별 할인율 정책 문서 | Percent/Amount/Bundle | 2026-05-10 | Q4 |
| 14 | Outlook | 반품 사유 월간 요약 (채널별) | 반품 사유, 채널 | 2026-05-25 | Q5 |
| 15 | Teams | CS - NotAsDescribed 반품 클러스터 | 반품, NotAsDescribed | 2026-05-24 | Q5 |
| 16 | SharePoint | UltraBook 15 재고 부족 대응 플레이북 | UltraBook 15, 재고, 품절, CS | 2026-05-16 | Q3 |
| 17 | Outlook | 결제 재시도(RetrySuccess) 처리 가이드 | 결제 재시도 | 2026-05-12 | Q1/미션3 |
| 18 | OneDrive | 리더십 조식 브리핑 템플릿 | 요약, 근거 링크 | 2026-05-01 | 통합 |
| 19 | SharePoint | BackToSchool 캠페인 사전 준비 체크리스트 | BackToSchool, OnlineMall | 2026-07-10 | Q1/Q3 |

## 3) 소스별 샘플 데이터 준비 계약

### 3-1. 정상 운영 기준과 축소 fallback

| 소스 | 정상 운영 최소 | 콘텐츠 유형 | 배치 대상 | 핵심 검증 목적 |
|---|---:|---|---|---|
| SharePoint | 6건 | 캠페인 기획서·성과 리포트·분석/정책 문서 | 전용 샘플 사이트의 문서 라이브러리 | 캠페인/상품 문맥과 문서 버전 검색 |
| Outlook | 5건 | 리더십 이슈 논의·부서 회신·운영 요약 메일 | 전용 공유 메일함 또는 샘플 사용자 메일함 | 발신자·수신자·제목·본문·시각 검색 |
| Teams | 5건 | CS·재고·물류 채널 대화와 답글 | 전용 Team의 샘플 채널 | 대화 흐름·작성자·채널·시각 검색 |
| OneDrive | 3건 | 미팅 노트·정책 문서·브리핑 템플릿 | 샘플 사용자의 공유 폴더 | 회의 맥락·참석자·결정·후속 조치 검색 |
| **합계** | **19건** |  |  |  |

- **정상 운영 기준은 19건**이며, Track2의 교차 매핑과 품질 검증은 이 기준으로 진행합니다.
- 제공 확장 패키지([track2/data/](../../track2/data/))를 사용하면 60개 업무 항목으로 더 다양한 교차 소스 검색과 품질 검증을 수행할 수 있습니다.
- **축소 fallback은 15건**입니다. 소스별 최소 1건, 고정 키워드 5개 중 4개 이상, Q3 핵심 상품 3종별 2건 이상을 유지해야 합니다.
- fallback 사용 시 강사는 누락 콘텐츠와 영향받는 품질 항목을 기록합니다. 축소본은 정상 준비 완료로 판정하지 않습니다.

### 3-2. 모든 콘텐츠의 필수 메타데이터

| 필드 | 필수 값/규칙 | 검수 방법 |
|---|---|---|
| `sourceType` | `SharePoint` / `Outlook` / `Teams` / `OneDrive` 중 하나 | 소스 필터 결과와 일치 확인 |
| 제목/주제 | 2절의 제목을 그대로 사용 | 정확 제목 검색 |
| 본문 | 2절의 언급 엔터티를 정확한 표기로 1회 이상 포함 | 엔터티명 본문 검색 |
| 작성자/발신자 | 샘플 계정의 표시 이름과 주소 | 결과 상세의 작성자 확인 |
| 작성/발송 시각 | 2절 날짜, KST 기준 시각 포함 | 결과 정렬 및 적시성 검증 |
| 수정 시각 | 작성 시각 이후 또는 동일 시각 | 최신성/버전 검증 |
| 원본 식별자 | 열 수 있는 URL 또는 message/channel/item ID | 원본 링크 재열기 |
| 접근 범위 | 참가자 계정은 읽기 가능, ACL 검증 계정은 지정 콘텐츠 제한 | 두 계정의 결과 차이 확인 |
| 상태/버전 | 문서는 Draft/Final 또는 버전, 메일·대화는 원본 상태 유지 | 유효성/중복성 검증 |

제목만 생성하고 본문을 비워 두면 키워드 검색과 근거 인용 검증이 불완전해집니다. 각 콘텐츠에는 **상황, 영향, 결정 또는 후속 조치** 중 최소 2개를 본문에 포함합니다.

### 3-3. 소스별 본문 및 배치 체크리스트

#### SharePoint — 캠페인 기획서/성과 리포트 6건

- [ ] 전용 샘플 사이트와 문서 라이브러리를 만들고 참가자에게 읽기 권한을 부여했다.
- [ ] 기획서에는 캠페인명, 기간, 채널, 목표 KPI, 담당자를 포함했다.
- [ ] 성과 리포트에는 캠페인명, 기준일, 전환율/매출 등 결과, 계획 대비 차이, 후속 조치를 포함했다.
- [ ] UltraBook 15 플레이북에는 재고 부족, 고객 영향, 대응 담당, 에스컬레이션 조건을 포함했다.
- [ ] 각 파일의 제목, 본문, 작성자, 수정일, 버전, 원본 URL이 검색 결과에서 확인된다.

권장 폴더 구조:

```text
/Track2-Sample/
  Campaigns/
  Operations/
  Policies/
```

#### Outlook — 리더십 이슈 논의 메일 5건

- [ ] 전용 공유 메일함 또는 샘플 사용자 메일함을 사용했다.
- [ ] `[리더십] 5월 매출 급락 이슈 공유` 메일에 SummerPush, 영향 지표, 의사결정 요청, 후속 담당자를 포함했다.
- [ ] 회신이 필요한 시나리오는 원본 메일과 같은 스레드에 배치해 대화 맥락을 확인할 수 있다.
- [ ] 발신자, 받는 사람, 참조, 제목, 본문, 발송 시각이 모두 샘플 값이다.
- [ ] 참가자 계정이 공유 메일함 또는 대상 폴더를 읽을 수 있고 원본 메일을 열 수 있다.

#### Teams — 채널 대화 5건

- [ ] 전용 Team에 `cs-tier2`, `inventory`, `logistics` 샘플 채널을 준비했다.
- [ ] 상품명, 증상/이슈, 고객 영향, 담당자, 다음 조치를 본문 또는 답글에 포함했다.
- [ ] 최소 2개 대화에는 1개 이상의 답글을 추가해 단일 메시지와 대화 스레드를 구분할 수 있다.
- [ ] 작성자, 채널명, 게시 시각, 대화 링크 또는 message ID를 기록했다.
- [ ] 참가자 계정이 Team/채널 구성원이며 원본 대화를 열 수 있다.

#### OneDrive — 미팅 노트/브리핑 문서 3건

- [ ] 샘플 사용자의 `/Track2-Sample/MeetingNotes/` 공유 폴더에 배치했다.
- [ ] 미팅 노트에 회의명, 일시, 참석자, 안건, 논의 내용, 결정, 후속 조치와 담당자를 포함했다.
- [ ] 고객사 미팅 노트 본문에 `DailyTee Cotton`, `Platinum`과 반품 증가 맥락을 포함했다.
- [ ] 리더십 브리핑 템플릿에 정형 지표와 M365 원본 링크를 함께 기록할 자리표시자를 포함했다.
- [ ] 참가자 계정으로 파일 검색과 원본 열기가 모두 가능하다.

### 3-4. 최소 본문 예시

아래는 형식 예시이며, 2절의 각 콘텐츠에도 같은 수준의 맥락을 작성합니다.

```text
[SharePoint 성과 리포트]
SummerPush 캠페인의 2026-05-20 기준 전환율은 계획 대비 낮다.
Social 채널 유입은 유지됐으나 결제 실패 증가가 전환 손실에 영향을 주었다.
결제팀은 실패 원인을 확인하고 2026-05-22까지 재시도 개선안을 공유한다.

[Outlook 리더십 메일]
제목: [리더십] 5월 매출 급락 이슈 공유
SummerPush 기간 중 매출과 전환율이 계획 대비 하락했다.
결제 실패와 AeroPhone X 주문 영향도를 확인해 리더십 회의 전에 회신해 달라.

[Teams 채널 대화]
CS 티어2에서 AeroPhone X 배송 지연 클레임이 증가했다.
물류팀은 지연 주문 범위를 확인하고 고객 공지와 보상 기준을 답글로 공유한다.

[OneDrive 미팅 노트]
안건: DailyTee Cotton 반품 증가
결정: NotAsDescribed 사유를 채널별로 재분류한다.
후속 조치: CS 담당자가 2026-05-25까지 원인과 개선안을 공유한다.
```

## 4) 배치 완료 검수

강사는 Track2 시작 전 아래 항목을 모두 확인합니다.

- [ ] SharePoint 6건, Outlook 5건, Teams 5건, OneDrive 3건이 생성됐다.
- [ ] 19건 모두 제목과 본문이 있고, 본문에서 지정 엔터티명이 검색된다.
- [ ] 19건 모두 작성자/발신자, 작성/발송 시각, 원본 링크 또는 ID를 확인할 수 있다.
- [ ] 고정 키워드 `SummerPush`, `VIPRetention`, `AeroPhone X`, `SmartWatch Pro`, `Platinum`을 사전 검색했다.
- [ ] 참가자 계정으로 4대 소스 각각 최소 1건의 원본을 열 수 있다.
- [ ] ACL 검증 계정은 제한 콘텐츠가 검색 결과와 원본 열기에서 모두 차단된다.
- [ ] 원본 URL/ID와 검색 결과 캡처를 강사용 증적 위치에 보관했다.

권장 검수 기록:

```text
[TRACK2_SEED_READINESS]
checkedAtKst=<YYYY-MM-DD HH:MM>
sharePoint=<검색 성공 n/6>
outlook=<검색 성공 n/5>
teams=<검색 성공 n/5>
oneDrive=<검색 성공 n/3>
keywordProbe=<성공 n/5>
sourceOpenCheck=<성공 n/4>
aclCheck=<PASS|FAIL>
fallbackUsed=<Y|N>
blockingIssue=<없음 또는 이슈/조치>
[/TRACK2_SEED_READINESS]
```

## 5) 매칭 검증 기준 (Track 2)

- 상품명/캠페인명 기준 검색 시, 정형 데이터의 해당 엔터티와 **최소 1건 이상** 문서가 연결되어야 함.
- Q3 핵심 3개 상품(AeroPhone X, SmartWatch Pro, UltraBook 15)은 각각 **2건 이상**의 M365 콘텐츠(재고/배송/CS)가 존재해야 함.
- 날짜 범위(2026-05 중순)에 이슈 콘텐츠가 집중되어, 정형 지표(재고 부족/배송 지연/CS 증가)와 시점 정합.

## 6) 운영 주의

- 실제 임직원 콘텐츠 금지 → 샘플/격리 테넌트만 사용
- 문서 본문에 상품명/캠페인명을 **정확한 표기**로 포함 (오탈자 시 매칭 실패 실습 소재로도 활용 가능)
- 정상 운영은 기준 시드 19건, 축소 fallback은 15건
- 콘텐츠 생성 직후 검색 결과에 나타나지 않을 수 있으므로 색인/검색 반영 시간을 고려해 D-1에 배치

## 7) Track2 시작용 키워드 프로브 세트 (권장)

Track2 첫 15분에는 아래 5개 키워드로 검색 가용성을 먼저 점검합니다.

| 분류 | 키워드 | 기대 소스 |
|---|---|---|
| 캠페인 | `SummerPush` | SharePoint, Outlook |
| 캠페인 | `VIPRetention` | Outlook, SharePoint |
| 상품 | `AeroPhone X` | Teams, Outlook |
| 상품 | `SmartWatch Pro` | Teams |
| 고객 맥락 | `Platinum` | Outlook, OneDrive |

합격 기준:
- 5개 중 4개 이상에서 유효 결과 1건 이상 확인
- 실패 키워드는 표기 정규화(공백/대소문자/별칭) 후 재시도 로그를 남김
