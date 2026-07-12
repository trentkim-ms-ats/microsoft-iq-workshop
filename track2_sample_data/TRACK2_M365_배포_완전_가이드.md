# Track2 M365 샘플 데이터 배포 완전 가이드

## 개요

이 문서는 Track2 워크숍을 위한 60개 샘플 아이템을 Microsoft 365 데모 테넌트에 배포하고 검증하는 **5단계 엔드-투-엔드 프로세스**를 설명합니다.

### 샘플 데이터 구성 (총 60개)

| 소스 | 항목 수 | 설명 |
|------|--------|------|
| SharePoint | 15 | 캠페인 문서 (DOCX) |
| OneDrive | 12 | 개인 분석 자료 (DOCX) |
| Outlook | 15 | 이메일 메시지 (배포 완료) |
| Teams | 18 | 채널 메시지 스레드 (55개 메시지) |
| **합계** | **60** | 모든 콘텐츠는 Track1 온톨로지 기반 |

### 필수 역할 ↔ Contoso 사용자 매핑

배포 전 다음 12명의 Contoso 데모 사용자와 역할을 매핑해야 합니다:

| 역할 | 샘플 사용자 | 이메일 |
|------|-----------|-------|
| CEO | AdeleV | adelev@contoso.onmicrosoft.com |
| CFO | AlexW | alexw@contoso.onmicrosoft.com |
| CDO | DiegoS | diegos@contoso.onmicrosoft.com |
| Marketing Manager | MeganB | meganb@contoso.onmicrosoft.com |
| Growth Lead | GradyA | gradya@contoso.onmicrosoft.com |
| Payments Manager | PradeepG | pradepg@contoso.onmicrosoft.com |
| Inventory Manager | NestorW | nestorw@contoso.onmicrosoft.com |
| Logistics Manager | IsaiahL | isaiahl@contoso.onmicrosoft.com |
| Customer Success | LynneR | lynner@contoso.onmicrosoft.com |
| CRM Manager | JohannaL | johannal@contoso.onmicrosoft.com |
| Data Analytics | IrvinS | irvins@contoso.onmicrosoft.com |
| Finance Manager | PattiF | pattif@contoso.onmicrosoft.com |

---

## 1단계: 샘플 데이터 생성

### 1.1 선수조건

```bash
Node.js 14+ 설치 확인:
$ node --version    # v14.0.0 이상
$ npm --version     # 6.0.0 이상
```

### 1.2 생성 명령 실행

```bash
cd track2_sample_data
npm install          # 의존성 설치 (최초 1회)
node generate_samples.js
```

**기대 결과:**

```
✓ Generated 15 SharePoint documents
✓ Generated 12 OneDrive documents  
✓ Generated 15 Outlook messages
✓ Generated 18 Teams threads (55 messages)
✓ All manifests validated
✓ Output: generated/ directory (60 items total)
```

### 1.3 생성된 파일 구조

```
generated/
├── sharepoint/          # 15 DOCX
│   ├── Campaign_Brief_SummerPush_001.docx
│   └── ...
├── onedrive/           # 12 DOCX
│   ├── PersonalAnalysis_001.docx
│   └── ...
├── outlook/            # 15 EML
│   ├── email_001.eml
│   └── ...
├── teams/              # 18 threads + 55 messages
│   ├── thread_001.json
│   └── ...
├── manifests/
│   ├── sharepoint_manifest.json
│   ├── onedrive_manifest.json
│   ├── outlook_manifest.json
│   ├── teams_manifest.json
│   └── complete_manifest.json
└── GENERATION_METADATA.json  # 생성 타임스탬프 및 체크섬
```

### 1.4 데이터 재생성 (필요시)

모든 생성 규칙은 `generate_samples.js`에서 결정적(deterministic)으로 정의됩니다. 같은 코드로 같은 데이터가 재생성됩니다:

```bash
rm -rf generated/
node generate_samples.js  # 동일한 60개 아이템 생성
```

**참고:** UUID는 고정 시드에 기반하여 생성되므로 재현 가능합니다.

---

## 2단계: 사전 검증

### 2.1 생성 완료 확인

```bash
ls -la generated/
```

필수 디렉토리 및 파일 존재 확인:

- [ ] `generated/sharepoint/` — 15 DOCX
- [ ] `generated/onedrive/` — 12 DOCX
- [ ] `generated/outlook/` — 15 EML
- [ ] `generated/teams/` — 18 JSON 파일
- [ ] `generated/manifests/` — 4개 manifest + complete_manifest.json
- [ ] `generated/GENERATION_METADATA.json`

### 2.2 매니페스트 검증

**complete_manifest.json 확인:**

```bash
python3 << 'EOF'
import json
with open('generated/manifests/complete_manifest.json', 'r') as f:
    manifest = json.load(f)
    
print(f"SharePoint items: {len(manifest.get('sharepoint', []))}")
print(f"OneDrive items: {len(manifest.get('onedrive', []))}")
print(f"Outlook items: {len(manifest.get('outlook', []))}")
print(f"Teams threads: {len(manifest.get('teams', []))}")
print(f"Total items: {manifest.get('totalItems', 0)}")
EOF
```

**기대 결과:**

```
SharePoint items: 15
OneDrive items: 12
Outlook items: 15
Teams threads: 18
Total items: 60
```

### 2.3 샘플 아이템 검증 체크리스트

각 소스별 샘플 아이템 확인:

| 소스 | 파일 수 | 검증 방법 |
|------|--------|---------|
| **SharePoint** | 15 | `ls generated/sharepoint/ \| wc -l` |
| **OneDrive** | 12 | `ls generated/onedrive/ \| wc -l` |
| **Outlook** | 15 | `ls generated/outlook/ \| wc -l` |
| **Teams** | 18 | `ls generated/teams/thread_*.json \| wc -l` |

---

## 3단계: 배포 준비

### 3.1 M365 테넌트 준비 사항

배포하기 전 M365 테넌트에서 다음을 확인하세요:

- [ ] 테넌트 관리자 권한 보유
- [ ] 12명의 Contoso 데모 사용자 계정 활성화 (위 매핑표 참고)
- [ ] Teams 환경 활성화
- [ ] SharePoint, OneDrive, Outlook 모두 사용 가능 상태

### 3.2 Azure 앱 등록

**앱 등록 생성:** Azure AD → 앱 등록 → 새 등록

- **이름:** Track2-Workshop-Deployer
- **지원되는 계정 유형:** 조직 디렉토리 내 계정만(단일 테넌트)
- **리디렉션 URI:** `http://localhost` (선택사항, Teams 기능용)

### 3.3 API 권한 설정

#### App-Only 권한 (SharePoint, OneDrive, Outlook 배포용)

Azure Portal → 앱 → API 권한 → 권한 추가 → Microsoft Graph → 애플리케이션 권한

```
✓ Sites.ReadWrite.All          (SharePoint 쓰기)
✓ Files.ReadWrite.All          (OneDrive 쓰기)
✓ Mail.Send                    (Outlook 메일 발송)
```

**관리자 동의:** "조직에 동의 부여" 클릭

#### Delegated 권한 (Teams 배포용, 관리자 계정)

```
✓ Group.ReadWrite.All          (팀 생성)
✓ Team.Create                  (팀 프로비저닝)
✓ Channel.Create               (채널 생성)
✓ ChannelMessage.Send          (메시지 발송)
```

**관리자 동의:** 위와 동일

### 3.4 클라이언트 시크릿 생성

Azure Portal → 앱 → 인증서 및 비밀 → 새 클라이언트 시크릿

- **설명:** Track2-Workshop-Deployer-Secret
- **만료:** 24개월

**생성 후 즉시 값 복사 (다시 표시 불가)**

필요한 값:
- `client_id` (앱 ID)
- `client_secret` (방금 생성한 값)
- `tenant_id` (조직 ID)

### 3.5 배포 설정 파일 생성

**파일:** `deployment_config.json`

```json
{
  "tenant": {
    "name": "M365DS060811",
    "domain": "M365DS060811.onmicrosoft.com",
    "tenantId": "YOUR_TENANT_ID"
  },
  "app": {
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "tenantId": "YOUR_TENANT_ID"
  },
  "roleMapping": {
    "ceo": "adelev@contoso.onmicrosoft.com",
    "cfo": "alexw@contoso.onmicrosoft.com",
    "cdo": "diegos@contoso.onmicrosoft.com",
    "marketingManager": "meganb@contoso.onmicrosoft.com",
    "growthLead": "gradya@contoso.onmicrosoft.com",
    "paymentsManager": "pradepg@contoso.onmicrosoft.com",
    "inventoryManager": "nestorw@contoso.onmicrosoft.com",
    "logisticsManager": "isaiahl@contoso.onmicrosoft.com",
    "customerSuccess": "lynner@contoso.onmicrosoft.com",
    "crmManager": "johannal@contoso.onmicrosoft.com",
    "dataAnalytics": "irvins@contoso.onmicrosoft.com",
    "financeManager": "pattif@contoso.onmicrosoft.com"
  },
  "sharepoint": {
    "siteId": "YOUR_SITE_ID",
    "documentLibrary": "Documents"
  },
  "teams": {
    "teamName": "Track2 Workshop (Sample)",
    "channels": [
      "SummerPush",
      "BackToSchool",
      "VIPRetention",
      "FlashWeek",
      "Announcements",
      "General",
      "Resources"
    ]
  }
}
```

### 3.6 선택사항: SSL 인증서 (프록시 환경용)

회사 네트워크에서 SSL 프록시를 사용하는 경우:

```bash
# CA 번들 다운로드
openssl s_client -connect graph.microsoft.com:443 -showcerts > ca_bundle.crt

# 배포 스크립트에 설정
export REQUESTS_CA_BUNDLE=$(pwd)/ca_bundle.crt
export CURL_CA_BUNDLE=$(pwd)/ca_bundle.crt
```

---

## 4단계: 실제 배포

### 4.1 건식 실행 (Dry-Run)

**권장:** 실제 배포 전 dry-run을 수행하여 문제를 미리 발견합니다.

```bash
python3 deploy_m365_samples.py --dry-run
```

**예상 출력:**

```
[DRY-RUN] Would deploy:
  SharePoint: 15 documents
  OneDrive: 12 documents
  Outlook: 15 emails
  Teams: 18 threads (55 messages)

No actual changes made.
```

### 4.2 실제 배포 실행

```bash
python3 deploy_m365_samples.py
```

**진행 상황 추적:**

| 단계 | 예상 메시지 |
|------|----------|
| **SharePoint** | `Uploading SharePoint documents... 15/15 ✓` |
| **OneDrive** | `Uploading OneDrive documents... 12/12 ✓` |
| **Outlook** | `Sending Outlook emails... 15/15 (202 Accepted) ✓` |
| **Teams** | `Posting Teams messages... 18 threads, 55 messages ✓` |

### 4.3 배포 로그 저장

```bash
python3 deploy_m365_samples.py 2>&1 | tee deployment_$(date +%Y%m%d_%H%M%S).log
```

로그는 향후 검증 및 문제 해결에 사용됩니다.

### 4.4 재시도 정책

배포 중 네트워크 문제 발생 시 자동 재시도됩니다:

| 상황 | 재시도 간격 | 최대 시도 횟수 |
|------|-----------|--------------|
| 429 (Rate Limit) | 5초 | 3회 |
| 5xx (Server Error) | 10초 (기하급수적 증가) | 3회 |

---

## 5단계: 배포 후 검증

### 5.1 Graph API 읽기 검증 (SharePoint & OneDrive)

#### SharePoint 확인

```bash
python3 << 'EOF'
import requests
import json

# App-only token 필요
# deployment_config.json에서 token 자동 로드

response = requests.get(
    f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/drive/root/children",
    headers={"Authorization": f"Bearer {token}"}
)

files = response.json()
sp_count = len([f for f in files['value'] if f['name'].endswith('.docx')])
print(f"SharePoint DOCX files: {sp_count}/15 ✓")
EOF
```

**기대 결과:** `SharePoint DOCX files: 15/15 ✓`

#### OneDrive 확인

```bash
python3 << 'EOF'
import requests

# 각 사용자(역할)의 OneDrive 확인
users = ["adelev", "alexw", "diegos", "meganb", ...]

for user in users:
    response = requests.get(
        f"https://graph.microsoft.com/v1.0/users/{user}@contoso.onmicrosoft.com/drive/root/children",
        headers={"Authorization": f"Bearer {token}"}
    )
    files = response.json()
    od_count = len([f for f in files['value'] if f['name'].endswith('.docx')])
    print(f"{user}: {od_count} DOCX files")
EOF
```

**기대 결과:** 각 사용자별 1-2개의 DOCX 파일 확인

### 5.2 이메일 배송 검증 (Outlook) — 3가지 방법

이메일 배포는 Graph API에서 HTTP 202 (Accepted, 비동기)로 반환되므로 직접 읽기 불가합니다. 다음 3가지 방법으로 검증하세요:

#### 방법 1: 배포 로그 분석 ⭐ (가장 간단)

```bash
grep "Email deployed:" deployment_*.log | wc -l
```

**기대 결과:** 15개 항목 확인

**장점:**
- 추가 권한 불필요
- 실시간 확인 가능
- 배포 직후 즉시 검증

**한계:**
- 로그 분실 시 재확인 불가

#### 방법 2: Outlook 웹 인터페이스 직접 확인

1. **브라우저에서 Outlook 접속:**
   ```
   https://outlook.office.com
   ```

2. **각 역할 계정으로 로인:**
   - adelev@contoso.onmicrosoft.com 로인
   - "보낸 편지함(Sent Items)" 확인
   - 15개 Track2 이메일 확인

3. **수신자별 확인:**
   - 각 역할의 받은편지함 접속
   - Track2 워크숍 이메일 도착 확인

**기대 결과:**
- 발신자별: 각자의 보낸편지함에 이메일 보이기
- 수신자별: 받은편지함에 이메일 도착

**장점:**
- 종단간(end-to-end) 검증
- 메일 콘텐츠 확인 가능
- 사용자 경험과 동일

**한계:**
- 시간이 걸림 (각 계정마다 로인)
- 자동화 어려움

#### 방법 3: M365 관리 센터 메시지 추적 (권장)

1. **Microsoft 365 관리 센터 접속:**
   ```
   https://admin.microsoft.com
   ```

2. **Exchange 관리 센터 이동:**
   - "Exchange" → "메일 흐름" → "메시지 추적"

3. **Track2 워크숍 발신자별 추적:**
   ```
   발신자: adelev@contoso.onmicrosoft.com
   수신자: (비워두기 - 모든 수신자 대상)
   상태: Delivered
   ```

4. **추적 결과 분석:**
   - 각 발신자별 **15개 메시지** 확인
   - 상태: **"Delivered"** 확인
   - 시간: 배포 시간과 일치 확인

**기대 결과:**

```
Sender: adelev@contoso.onmicrosoft.com
Status: Delivered (15 messages)
Recipients: meganb, diegos, gradya, ... (캠페인별 다름)
```

**장점:**
- 공식 배포 로그 (감사 추적)
- 모든 이메일 한눈에 확인
- 배송 실패 원인 파악 가능

**한계:**
- M365 관리 센터 접근 권한 필요
- 완전 배송까지 5-10분 대기 필요

### 5.3 Teams 메시지 검증

```bash
python3 << 'EOF'
import requests

# Teams API: 각 채널의 메시지 개수 확인
team_id = deployment_config['teams']['teamId']
channels = deployment_config['teams']['channels']

for channel in channels:
    response = requests.get(
        f"https://graph.microsoft.com/v1.0/teams/{team_id}/channels",
        headers={"Authorization": f"Bearer {delegated_token}"}
    )
    # 채널별 메시지 개수 확인
    print(f"Channel '{channel}': X messages")
EOF
```

**기대 결과:** 18개 스레드와 55개 메시지 배포 확인

### 5.4 전체 검증 체크리스트

| 항목 | 확인 사항 | 상태 |
|------|---------|------|
| **SharePoint** | 15/15 DOCX 업로드됨 | ☐ |
| **OneDrive** | 12/12 DOCX 업로드됨 | ☐ |
| **Outlook (로그)** | deployment_*.log에 15/15 배포 기록 | ☐ |
| **Outlook (웹)** | 각 역할 계정의 보낸편지함에 이메일 표시 | ☐ |
| **Outlook (추적)** | M365 관리 센터에서 15개 "Delivered" | ☐ |
| **Teams** | 18개 스레드 + 55개 메시지 확인 | ☐ |

---

## 주의사항 및 문제 해결

### SSL 프록시 오류

**증상:**
```
requests.exceptions.SSLError: HTTPSConnectionPool SSL: CERTIFICATE_VERIFY_FAILED
```

**해결:**
```bash
openssl s_client -connect graph.microsoft.com:443 -showcerts > ca_bundle.crt
export REQUESTS_CA_BUNDLE=$(pwd)/ca_bundle.crt
export CURL_CA_BUNDLE=$(pwd)/ca_bundle.crt
python3 deploy_m365_samples.py
```

### 토큰 만료 오류

**증상:**
```
401 Unauthorized: "Access token has expired"
```

**해결:**
```bash
# deployment_config.json의 토큰 갱신
python3 << 'EOF'
# TokenProvider에서 자동 갱신 (배포 스크립트 내부)
# 또는 수동으로 새 토큰 취득 후 배포_config.json 업데이트
EOF
```

### 권한 부족 오류

**증상:**
```
403 Forbidden: "Insufficient privileges"
```

**확인 사항:**
- [ ] App 권한: Sites.ReadWrite.All, Files.ReadWrite.All, Mail.Send
- [ ] Delegated 권한: Group.ReadWrite.All, Team.Create, Channel.Create, ChannelMessage.Send
- [ ] 관리자 동의: "조직에 동의 부여" 클릭됨
- [ ] 배포 계정: Teams 배포용 관리자 권한 보유 확인

### Rate Limit (429) 오류

**증상:**
```
429 Too Many Requests: Retry-After: 60
```

**자동 처리:**
배포 스크립트가 자동으로 재시도합니다 (5초 대기 후 최대 3회).

**수동 대기:**
```bash
sleep 60
python3 deploy_m365_samples.py
```

### Teams 프로비저닝 오류

**증상:**
```
404 Not Found: Team not found
```

**해결:**
```bash
# Teams 및 채널 수동 생성 후 team_id, channel_id 업데이트
# Azure Portal → Teams → 팀 생성 → 채널 생성 → ID 복사
```

### OneDrive 경로 오류

**증상:**
```
404 Not Found: Drive root not found
```

**해결:**
```bash
# 각 사용자의 OneDrive 확인
# Graph API: GET /users/{user_id}/drive
python3 << 'EOF'
import requests
user_principal = "adelev@contoso.onmicrosoft.com"
response = requests.get(
    f"https://graph.microsoft.com/v1.0/users/{user_principal}/drive",
    headers={"Authorization": f"Bearer {token}"}
)
print(response.json())
EOF
```

---

## 추가 자료

### 관련 문서

- [README.md](./README.md) — 샘플 패키지 개요
- [EMAIL_DELIVERY_VERIFICATION.md](./EMAIL_DELIVERY_VERIFICATION.md) — 이메일 배송 검증 상세 가이드

### 스크립트 파일

- **generate_samples.js** — 60개 샘플 아이템 생성
- **deploy_m365_samples.py** — M365로 배포 실행
- **verify_email_delivery.py** — 이메일 배송 자동 검증
- **deploy_with_tracking.py** — 배포 진행 상황 추적

### 데이터 구조

각 소스별 데이터 구조 상세는 [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) 참고.

---

## 버전 정보

| 항목 | 값 |
|------|-----|
| 문서 버전 | 1.0 |
| 샘플 데이터 항목 | 60 (SP 15, OD 12, EM 15, TM 18) |
| 마지막 업데이트 | 2025년 7월 |
| 대상 테넌트 | M365DS060811.onmicrosoft.com |

---

## 지원

배포 문제 발생 시:

1. **로그 확인:** `deployment_*.log` 파일에서 오류 메시지 검토
2. **재시도:** 자동 재시도 정책 참고 (4.4절)
3. **수동 검증:** 위 "주의사항 및 문제 해결" 섹션 참고
4. **관리자 확인:** M365 관리 센터에서 권한 및 설정 재확인
