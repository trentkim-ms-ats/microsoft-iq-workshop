# Track2 M365 가상 샘플 데이터 패키지

Track1의 Ontology와 샘플 CSV 컨텍스트를 바탕으로 Track2 WorkIQ 실습을 직접 실행할 수 있도록 만든 **완전한 가상 데이터**입니다. 실제 고객, 임직원, 회사 운영정보는 포함하지 않습니다.

> **📘 전체 배포 가이드:** [TRACK2_M365_Complete_Deployment_Guide.md](TRACK2_M365_Complete_Deployment_Guide.md)  
> 샘플 생성 → 사전 검증 → 배포 준비 → 실제 배포 → 배포 후 검증의 **5단계 엔드-투-엔드 프로세스**를 제공합니다. 이메일 배송 검증의 3가지 방법도 포함되어 있습니다.

## 1. 제공 규모

| 소스 | 기본 콘텐츠 | 실제 생성 파일/메시지 |
|---|---:|---|
| SharePoint | 15개 | 업로드 가능한 DOCX 15개 |
| Outlook | 15개 | EML 15개 + Graph 배포용 JSON |
| Teams | 18개 스레드 | 루트/답글 총 55개 메시지 |
| OneDrive | 12개 | 업로드 가능한 DOCX 12개 |
| **합계** | **60개 업무 항목** | **DOCX 27 + EML 15 + Teams 메시지 55** |

기존 [Track1_WorkIQ_Seed_Content_Specification.md](../../track1/docs/Track1_WorkIQ_Seed_Content_Specification.md)의 19건은 최소 기준입니다. 이 패키지는 검색·교차 매핑·품질 검증·Track3 인계를 더 풍부하게 실행할 수 있도록 60개 업무 항목으로 확장했습니다.

## 2. Track1 연결 범위

- 캠페인: SummerPush, BackToSchool, VIPRetention, FlashWeek
- 상품: AeroPhone X, SmartWatch Pro, UltraBook 15, DailyTee Cotton
- 고객 맥락: Platinum, C00003, C00007
- 결제: Success/Failed/RetrySuccess, PAY00019, PAY90001
- 재고/배송/CS: S09001~S09003, O09001~O09003, SH09001~SH09003, T09001~T09003
- 반품: LateDelivery, NotAsDescribed, R00011
- 프로모션: Percent/Amount/Bundle/BOGO, PR00050
- 품질 이슈: T90001, SH00001, O00007, O00600, P00050, S00050, O00033

콘텐츠는 같은 사건을 문서, 메일, 채널 대화, 회의록에서 서로 다른 관점으로 다룹니다. 따라서 Track2에서 동일 엔터티를 여러 소스로 검색하고, 근거 일치/불일치와 원본 링크를 검증할 수 있습니다.

## 3. 폴더 구조

```text
track2/data/
  generate_samples.js
  bootstrap_m365_prereqs.py
  run_track2_oneclick.py
  deploy_m365_samples.py
  Track2_Mission1_2_Workbench.ipynb
  verify_entity_document_mapping.py
  validate_acl_setup.py
  validate_track1_handoff.py
  deployment_config.example.json
  package.json
  generated/
    sharepoint/
    outlook/
    teams/
    onedrive/
    manifests/
```

주요 manifest:

- `generated/manifests/content_manifest.csv`: 소스, 제목, 날짜, 키워드, 대상 위치, ACL, 품질 플래그
- `generated/manifests/content_catalog.json`: 배포 도구용 전체 카탈로그
- `generated/manifests/readiness_expected.json`: 기대 건수와 키워드-소스 커버리지

## 4. 로컬에서 다시 생성

```bash
cd track2/data
npm install
npm run generate
```

생성기는 `generated/`를 지우고 같은 내용으로 다시 만듭니다. `package-lock.json`을 사용하므로 같은 의존성 버전으로 재현됩니다.

## 5. M365 배포 전 준비

**⚠️ 중요:** 반드시 **샘플/격리 테넌트**를 사용합니다.

배포 전 필수 준비사항은 [TRACK2_M365_Complete_Deployment_Guide.md - 3단계](TRACK2_M365_Complete_Deployment_Guide.md#3단계-배포-준비)를 참고하세요. 아래는 간략한 체크리스트입니다:

1. SharePoint 샘플 사이트와 문서 라이브러리 준비
2. OneDrive 샘플 사용자 준비
3. Outlook 샘플 발신/수신 계정 또는 공유 메일함 준비
4. Teams와 아래 채널 준비
   - `cs-tier2`
   - `inventory`
   - `logistics`
   - `payments`
   - `campaign-ops`
   - `data-quality`
   - `leadership-briefing`
5. 사용하는 경로에 맞는 Microsoft Graph 권한 승인
   - 파일: `Sites.ReadWrite.All`, `Files.ReadWrite.All`
   - 메일: `Mail.Send`
   - Teams: `ChannelMessage.Send`

권한 유형과 관리자 동의 여부는 조직 정책 및 실행 방식(위임/앱)에 따라 달라집니다. 최소 권한을 적용하고 실습 종료 후 회수합니다.

## 6. 배포 설정 및 실행

**📘 전체 가이드:** [TRACK2_M365_Complete_Deployment_Guide.md - 3단계, 4단계, 5단계](TRACK2_M365_Complete_Deployment_Guide.md) 참고

### 원클릭 실행 (권장)

사전 준비(앱/권한/Teams/config) + 실제 배포를 한 번에 실행합니다.

```bash
python run_track2_oneclick.py \
  --tenant-domain M365DS060811.onmicrosoft.com \
  --sharepoint-hostname m365ds060811.sharepoint.com \
  --sharepoint-site-path /sites/Track2WorkshopSample \
  --generate \
  --execute
```

동작 방식:
- `--generate`를 주면 `npm run generate`를 먼저 실행해 샘플 데이터를 재생성
- `GRAPH_ADMIN_TOKEN`이 없으면 관리자 디바이스 로그인(코드 입력)으로 자동 획득
- `GRAPH_ACCESS_TOKEN`이 이미 있으면 그대로 사용
- 없으면 bootstrap 단계에서 새 클라이언트 시크릿을 만들고 앱 토큰을 자동 발급해 배포까지 진행

### 사전 준비 자동화 (권장)

앱 등록, 권한(관리자 동의), Teams 팀/채널 프로비저닝, `deployment_config.json` 생성까지 자동화할 수 있습니다.

```bash
python bootstrap_m365_prereqs.py \
  --tenant-domain M365DS060811.onmicrosoft.com \
  --sharepoint-hostname m365ds060811.sharepoint.com \
  --sharepoint-site-path /sites/Track2WorkshopSample \
  --execute \
  --create-client-secret
```

`GRAPH_ADMIN_TOKEN`은 선택사항입니다. 미설정 시 관리자 디바이스 로그인으로 토큰을 자동 획득합니다.

### 빠른 시작

```bash
cp deployment_config.example.json deployment_config.json
```

`deployment_config.json`의 placeholder를 샘플 테넌트의 실제 ID/UPN으로 바꿉니다. 이 파일에는 비밀값을 넣지 않습니다.

토큰은 파일에 저장하지 않고 환경 변수로 전달합니다.

```bash
export GRAPH_ACCESS_TOKEN="<ACCESS_TOKEN>"
```

먼저 dry-run으로 설정과 작업 목록을 확인합니다.

```bash
python deploy_m365_samples.py --config deployment_config.json
```

소스 하나만 확인할 수도 있습니다.

```bash
python deploy_m365_samples.py \
  --config deployment_config.json \
  --sources sharepoint onedrive
```

실제 배포는 명시적으로 `--execute`를 추가해야 합니다.

```bash
python deploy_m365_samples.py \
  --config deployment_config.json \
  --sources sharepoint onedrive outlook teams \
  --execute
```

## 7. 배포 동작

- SharePoint: `/Track2-Sample/<분류>/` 폴더를 만들고 DOCX 업로드
- OneDrive: `/Track2-Sample/MeetingNotes/`, `/Track2-Sample/Briefings/`에 DOCX 업로드
- Outlook: 역할별 샘플 발신 계정에서 지정된 샘플 수신 계정으로 메일 전송
- Teams: 지정 채널에 루트 메시지와 답글 게시
- 429/5xx: 5초, 10초, 20초 간격으로 최대 3회 재시도

### M365 시스템 메타데이터 제한

DOCX/EML 본문과 파일 속성에는 2026년 업무 기준일이 들어 있습니다. 일반 Graph 업로드/발송/게시 API를 사용하면 SharePoint 수정일, Outlook 수신일, Teams 게시일과 실제 작성자는 **배포 실행 시각/실행 계정**으로 기록됩니다. 역사적 시스템 메타데이터를 위조하지 않습니다.

Track2에서는 다음을 구분해 기록합니다.

- `businessDate`: 콘텐츠가 설명하는 업무 기준일
- M365 생성/수정/게시 시각: 샘플 테넌트에 실제 배포된 시각

## 8. 의도된 Track2 품질 사례

- Draft와 Final 상태 문서
- Data-Stewards/Leaders 전용 Restricted 문서
- `AeroPhone X`와 `Aero Phone X` 표기 불일치
- Track1 품질 이슈가 경고와 함께 인용된 콘텐츠
- SummerPush/VIPRetention 귀속 범위 부재를 0으로 오해하지 않는 해석 사례

이 사례는 삭제하지 않고 정확성, 완전성, 일관성, 유효성, 중복성, 참조무결성, 적시성, 추적성 점검에 사용합니다.

## 9. 배포 후 검수

**📘 상세 검증 가이드:** [TRACK2_M365_Complete_Deployment_Guide.md - 5단계](TRACK2_M365_Complete_Deployment_Guide.md#5단계-배포-후-검증) 참고

### 검증 체크리스트

1. `content_manifest.csv` 기준으로 소스별 건수를 확인합니다.
2. WorkIQ에서 `SummerPush`, `VIPRetention`, `AeroPhone X`, `SmartWatch Pro`, `Platinum`을 검색합니다.
3. SharePoint/Outlook/Teams/OneDrive 각각 원본 1건 이상을 엽니다.
4. Restricted 콘텐츠가 일반 참가자에게 노출되지 않는지 확인합니다.
5. [Track1_WorkIQ_Seed_Content_Specification.md](../../track1/docs/Track1_WorkIQ_Seed_Content_Specification.md)의 `TRACK2_SEED_READINESS`를 작성합니다.

### 이메일 배송 검증

배포된 15개 Outlook 이메일 검증의 3가지 방법:

- **방법 1 (권장):** 배포 로그 분석 — 가장 빠르고 추가 권한 불필요
- **방법 2:** Outlook 웹 인터페이스 직접 확인 — 종단간 검증
- **방법 3:** M365 관리 센터 메시지 추적 — 공식 배포 로그

자세한 방법은 [EMAIL_DELIVERY_VERIFICATION.md](EMAIL_DELIVERY_VERIFICATION.md) 참고.

### 크로스 소스 Entity-to-Document 매핑 자동 검증

참가자가 작성한 매핑표(CSV/TSV)를 자동 검증할 수 있습니다.

```bash
python verify_entity_document_mapping.py \
  --mapping-csv ./mapping_result.csv \
  --manifest-csv ./generated/manifests/content_manifest.csv
```

검증 항목:
- 캠페인 4개/상품 5개/고객등급 1개 + 유효 매핑 10건 이상
- 핵심 상품 3종(AeroPhone X, SmartWatch Pro, UltraBook 15) 각 2건 이상
- 표기 불일치 + 정규화 방법 사례 1건 이상
- (선택) 매핑 문서가 `content_manifest.csv`에 실제 존재하는지 일치 검증

필수 컬럼(헤더명은 한글/영문 별칭 허용):
- 엔터티 유형, 엔터티 값, 매칭 문서 제목, 소스, 문서 링크/ID, 매칭 상태, 비고

### Track1 인계 패키지 자동 검증

Track1에서 전달받은 `TRACK2_HANDOFF_PACKAGE` 블록이 필수 필드/형식을 충족하는지 자동 검증할 수 있습니다.

```bash
python validate_track1_handoff.py \
  --input ../track1_handoff_package.txt \
  --strict
```

검증 항목:
- 필수 필드 12개 존재 여부
- placeholder(`<...>`) 미치환 항목 여부
- GUID/숫자 형식 검증(`workspaceId`, `ontologyId`, `entityCount`, `relationshipCount`)
- 최소 개수 권고(`corePaths>=3`, `mappingHighlights>=5`, `openIssues>=3`)

### ACL 검증 결과 자동 판정

참가자/제한 계정으로 수동 점검한 ACL 결과를 CSV/TSV로 저장하면 `aclCheck=PASS/FAIL`을 자동 판정할 수 있습니다.

```bash
python validate_acl_setup.py \
  --acl-report-csv ./acl_probe_report.csv \
  --require-all-sources \
  --strict
```

기본 기대값:
- 참가자 계정: `allow`
- 제한(ACL) 계정: `deny`

필수 컬럼(헤더는 한글/영문 별칭 허용):
- `source`, `resource`, `participant_access`, `restricted_access`

선택 컬럼:
- `expected_participant`, `expected_restricted` (기본 기대값을 행 단위로 재정의)

### 미션 1~2 실행 워크벤치 노트북

실습자가 미션 1(킥오프/키워드 프로브/인벤토리)부터 미션 2(교차 매핑/자동 판정)까지 직접 실행해볼 수 있는 노트북입니다.

```bash
jupyter notebook Track2_Mission1_2_Workbench.ipynb
```

노트북은 `generated/manifests/content_manifest.csv`를 읽어:
- 키워드 5종 프로브 결과 계산
- 소스 인벤토리 샘플 출력
- 미션2 매핑 CSV 템플릿 생성
- `verify_entity_document_mapping.py`로 PASS/FAIL 자동 판정

생성 결과물은 `generated/workbench/`에 저장됩니다.

배포 스크립트는 M365 객체에 ACL을 자동 변경하지 않습니다. 사이트, 폴더, 메일함, Team/채널 멤버십을 테넌트 관리자가 사전에 구성해야 합니다.
