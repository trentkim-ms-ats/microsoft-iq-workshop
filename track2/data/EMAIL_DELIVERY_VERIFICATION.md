# Track2 Outlook sample delivery: conditional live-verification procedure

This document does **not** record a completed M365 deployment or delivery result.
It is a procedure for a human-approved, isolated sample-tenant deployment. Do not
include tenant names, account names, addresses, message IDs, access tokens, or mail
content in this document or in public evidence.

## What local evidence means

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| Generated Outlook EML, `messages.json`, or catalog row | Static sample content and intended send payload | A Graph request, mailbox placement, or recipient delivery |
| Deployment dry-run output | Planned mail-send operations; no M365 change | A live Graph call or delivery |
| HTTP `202 Accepted` from `sendMail` | The service accepted an asynchronous send request | Sent Items placement, recipient delivery, or policy acceptance |
| Simulation/fixture output | The local contract or regression behavior | Current M365 or mail-service behavior |
| Participant mailbox view or tenant message trace | Conditional live evidence when collected after an approved operation | Evidence for a different tenant, account, time, or message set |

Historical log excerpts or generated assets that may exist in a workspace are static
or historical evidence only. They must not be presented as completed live M365
delivery.

## Preconditions for a live check

Perform this procedure only after a separately approved deployment to an isolated
sample tenant.

1. The operator has recorded the deployment window, selected source, and expected
   sample-message count in an approved evidence system.
2. The participant and restricted test accounts are approved sample accounts.
3. The operator has retained the deployment result securely; no credential or
   sensitive tenant/account data is copied into the workshop repository.
4. The intended mailbox and message-trace retention windows are known to the tenant
   mail administrator.

## Live verification steps

### 1. Classify the deployment response correctly

If the approved deployment returned HTTP `202 Accepted`, record it as **send request
accepted**. Keep the status conditional; do not mark a message as delivered from
this response alone.

### 2. Verify a participant-visible mailbox result

Using an approved sample participant account:

1. Open the expected sample mailbox through the organization’s approved mail client.
2. Locate the expected sample message using the deployment window and an approved
   non-sensitive matching attribute.
3. Open it and confirm that it is the expected sample content.
4. Record the result, timestamp, and evidence reference in the approved evidence
   system. Record `not observed` rather than inferring success if it is absent.

An operator may also check Sent Items for the configured sample sender when tenant
policy allows. Sent Items is supporting evidence, not a substitute for a recipient
or trace result.

### 3. Verify message trace when administrator access is approved

In the organization’s approved Exchange/message-trace interface:

1. Search the approved deployment window and approved sample scope.
2. Match each expected sample message using the approved evidence reference.
3. Record the trace state exactly as returned (for example, delivered, pending, or
   failed) and any administrator-visible diagnostic reference.
4. Reconcile the observed count with the expected count from the deployed Outlook
   catalog. Do not use the package’s fixed count as proof that the same number was
   deployed.

Only the tenant administrator should retain detailed identifiers or diagnostics.

## Result classification

| Result | Meaning | Next action |
| --- | --- | --- |
| `VERIFIED` | Participant mailbox or approved trace confirms the expected message in the approved scope | Attach the approved evidence reference; keep it tenant-scoped and time-scoped. |
| `PENDING` | Request accepted, but mailbox/trace evidence is not yet available | Wait according to tenant operational guidance, then repeat the observation. |
| `NOT VERIFIED` | No participant or trace evidence was collected | Do not claim delivery; use only static/dry-run wording. |
| `FAILED` | Trace or mailbox evidence identifies a failure | Escalate to the tenant mail administrator and record the failure reference. |

## Recovery and fallback

- If a message is not visible immediately, do not resend blindly. Check the approved
  trace window and tenant mail-flow policy with the administrator.
- If the request was accepted but trace evidence is missing, keep the result
  `PENDING` or `NOT VERIFIED`; HTTP 202 is not a delivery result.
- If recipient or routing policy blocks a message, correct the approved sample-tenant
  configuration and repeat the approved verification procedure.
- If live verification cannot be approved or performed, continue the workshop with
  generated/static content or simulation and label it accordingly. Do not describe
  that fallback as live service proof.

See the [Track2 safe deployment guide](TRACK2_M365_Complete_Deployment_Guide.md) for
the generator, dry-run boundary, and participant/ACL evidence requirements.

Canonical handoff: Track2 WorkIQ -> Track3 WebIQ -> Track4 FoundryIQ.

---

## 참고: 검증 워크스루 예시 (실시간 상태 주장 아님)

> **This section is preserved for scenario and formatting detail only.** It is an
> **illustrative example** of what a completed,
> multi-method verification walkthrough can look like once a real, human-approved
> sample-tenant deployment and its trace evidence exist — it is **not** a record of
> any deployment performed in, or claimed by, this repository, and it must not be
> read as current live-service proof. Per the primary procedure above, an HTTP `202`
> response and a "sent" log line establish only that a send request was accepted;
> they never by themselves establish mailbox placement or recipient delivery. Any
> conclusion language below (for example "배포 성공 확인됨" / "deployment success
> confirmed") describes the **illustrative scenario's own internal narrative**, not
> a verified fact about this workshop repository.
>
> The tenant domain (`M365DS060811.onmicrosoft.com`) and role-mapped sample account
> names (`AdeleV`, `AlexW`, `PradeepG`, etc.) are the same fictitious, non-real
> Microsoft demo-tenant placeholders already used as defaults/examples in
> `bootstrap_m365_prereqs.py` and `run_track2_oneclick.py`. They are illustrative
> placeholders, not real employee, account, or tenant identifiers, and not a live
> credential or secret. Do not perform any `--execute` or tenant-mutating action
> from this section; live operations remain a separate, human-operated path per
> `AGENTS.md`.

## Track2 배포된 메일 발송/수신 검증 가이드

### 📊 배포 현황 요약

| 소스 | 발송 | 상태 | 검증 방법 |
|------|------|------|----------|
| **Outlook** | 15개 메일 | HTTP 202 수락 | 3가지 방법 |

**배포 시점**: 2026-07-12 20:XX (UTC+9)  
**발신자 역할**: 12개 (CEO, CFO, CDO, Marketing, Growth, Payments, Inventory, Logistics, CS, CRM, Data, Finance)

---

### ✅ 방법 1: 배포 로그 분석 (이미 완료)

**근거:**
```
[Outlook] sent EM01 as ceo: [리더십] 5월 매출 급락 이슈 공유
[Outlook] sent EM02 as payments: RE: [리더십] 5월 매출 급락 이슈 공유
[Outlook] sent EM03 as payments: 결제 실패 급증 관련 결제팀 1차 회신
...
[Outlook] sent EM15 as marketing: 비전자 카테고리 보조 소재 및 재고 확인 요청
```

**✓ 확인 사항:**
- ✅ 15개 메일 모두 "sent" 로그
- ✅ HTTP 202 응답 (메일 발송 수락)
- ✅ saveToSentItems=True (자동 Sent Items 저장)

**결론:** **배포 성공 (프로그래매틱 증거)**

---

### 🔍 방법 2: 개별 사용자 로그인 (Outlook 웹)

#### 단계 1: Outlook 접속
```
https://outlook.office.com
```

#### 단계 2: 발신자 계정 로그인
```
사용자: AdeleV@M365DS060811.OnMicrosoft.com (CEO)
```

#### 단계 3: Sent Items 폴더 확인
```
좌측 메뉴 → Sent Items
또는: More → Sent Items
```

#### 단계 4: 메일 확인
```
제목: [리더십] 5월 매출 급락 이슈 공유
발신일: 2026-07-12
수신자: AlexW, DiegoS, MeganB, PradeepG
```

#### 단계 5: 수신자 계정으로 로그인 후 Inbox 확인
```
사용자: AlexW@M365DS060811.OnMicrosoft.com (CFO)
좌측 메뉴 → Inbox
제목에 "리더십" 또는 "매출" 검색
```

**예상 결과:**
```
✓ Sent Items에 15개 메일 표시
✓ 각 수신자의 Inbox에 해당 메일 표시
```

---

### 🎯 방법 3: M365 관리 센터 메일 추적 (권장)

#### 단계 1: M365 관리 센터 접속
```
https://admin.microsoft.com
```

#### 단계 2: Exchange 메일 흐름 메뉴
```
좌측 메뉴 → Exchange
또는: 좌측 메뉴 → Exchange → 메일 흐름
```

#### 단계 3: "메시지 추적" 또는 "메일 추적" 클릭
```
메뉴 위치:
  Exchange 관리 센터 → 메일 흐름 → 메시지 추적 (또는 Message Trace)
```

#### 단계 4: 검색 조건 설정

##### 검색 1: CEO 발신 메일
```
발신자:        AdeleV@M365DS060811.OnMicrosoft.com
제목 (포함):   리더십
시작 시간:     2026-07-12 00:00
종료 시간:     2026-07-12 23:59
상태:          모든 상태
```

**예상 결과:**
```
Status: Delivered
Messages: 3개 (EM01, EM02, EM10, EM12)
- [리더십] 5월 매출 급락 이슈 공유
- RE: [리더십] 5월 매출 급락 이슈 공유
- BackToSchool 캠페인 조건부 승인 요청
```

##### 검색 2: Payments 역할 발신
```
발신자:        PradeepG@M365DS060811.OnMicrosoft.com
시작 시간:     2026-07-12 00:00
종료 시간:     2026-07-12 23:59
```

**예상 결과:**
```
Status: Delivered
Messages: 2-3개 (EM02, EM03, EM06)
```

##### 검색 3: 특정 키워드 추적
```
제목 (포함):   매출, 결제, 재고, 반품, 캠페인, 분석
시작 시간:     2026-07-12 00:00
종료 시간:     2026-07-12 23:59
```

**예상 결과:**
```
15개 메일 모두 표시 (각 발신자별)
Status: Delivered (모두)
Delivery Time: 2026-07-12 20:XX ~ 20:XX (밀집)
```

---

### 📋 메일 추적 검색 팁

#### 고급 필터 사용

**방법 1: 여러 발신자 동시 추적**
```
발신자: 
  AdeleV@M365DS060811.OnMicrosoft.com;
  PradeepG@M365DS060811.OnMicrosoft.com;
  LynneR@M365DS060811.OnMicrosoft.com
```

**방법 2: 특정 도메인의 모든 메일**
```
발신자 도메인: M365DS060811.onmicrosoft.com
수신자 도메인: M365DS060811.onmicrosoft.com
```

**방법 3: 메시지 ID로 추적** (고급)
```
Internet Message ID: (배포 로그에서 추출한 Message-ID 헤더)
```

---

### ✅ 종합 검증 체크리스트

#### ✓ 배포 로그 검증 (완료)
- [x] 15개 메일 모두 "sent" 메시지
- [x] HTTP 202 응답
- [x] 발신자/수신자 올바르게 매핑

#### ✓ M365 관리 센터 메일 추적 (진행 예정)
- [ ] 메시지 추적 페이지 열기
- [ ] CEO 발신 메일 검색 → 3개 확인
- [ ] Payments 발신 메일 검색 → 2-3개 확인
- [ ] 특정 키워드 검색 → 15개 모두 확인
- [ ] 모든 메일 Status = "Delivered" 확인

#### ✓ Outlook 웹 직접 확인 (선택)
- [ ] AdeleV 계정 로그인 → Sent Items 확인 (5개 이상)
- [ ] AlexW 계정 로그인 → Inbox에서 수신 메일 확인 (5개 이상)
- [ ] CRM 계정 로그인 → 반품/VIPRetention 메일 확인

---

### 🎓 배포 메일 목록

#### 발신자별 메일

| # | 발신자 | 제목 | 수신자 |
|---|--------|------|--------|
| EM01 | CEO | [리더십] 5월 매출 급락 이슈 공유 | CFO, CDO, Marketing, Payments |
| EM02 | Payments | RE: [리더십] 5월 매출 급락 이슈 공유 | CEO, CFO, CDO |
| EM03 | Payments | 결제 실패 급증 관련 결제팀 1차 회신 | Marketing, Growth, Data |
| EM04 | CRM | VIPRetention 대상 Platinum 고객 이탈 경고 | CS, Marketing, Data |
| EM05 | Inventory | [긴급] 핵심 상품 재고 부족 및 캠페인 노출 조정 요청 | Logistics, CS, Marketing |
| EM06 | Logistics | RE: [긴급] 핵심 상품 재고 부족 및 캠페인 노출 조정 요청 | Inventory, CS, Marketing |
| EM07 | CS | 반품 사유 월간 요약 - 채널 및 고객등급 검토 | CRM, Growth, Data |
| EM08 | Finance | FlashWeek 프로모션 마진 검토 요청 | Marketing, Growth, CFO |
| EM09 | Data | [데이터 품질] Track1 차단 이슈 및 Track2 인용 주의 | CDO, Payments, Inventory, Logistics, CS |
| EM10 | Marketing | BackToSchool 캠페인 조건부 승인 요청 | CEO, CFO, CDO |
| EM11 | Inventory | UltraBook 15 공급 일정 및 고객 공지 기준 | Logistics, Marketing, CS |
| EM12 | CEO | RE: BackToSchool 캠페인 조건부 승인 요청 | Marketing, CFO, CDO |
| EM13 | Growth | 채널·고객등급별 반품 심층 분석 공유 | CRM, CS, Marketing |
| EM14 | CRM | RE: 채널·고객등급별 반품 심층 분석 공유 | Growth, CS, Marketing |
| EM15 | Marketing | 비전자 카테고리 보조 소재 및 재고 확인 요청 | Inventory, CS |

---

### 📞 문제 해결

#### 문제: M365 관리 센터 메일 추적에 메일이 안 보임

**원인:**
- 배포 시간으로 검색 범위가 잘못됨
- 발신자 이메일 형식 오류 (도메인 대소문자)
- 아직 배포 중

**해결책:**
```
1. 검색 범위 확대: 2026-07-12 ~ 2026-07-13
2. 발신자: AdeleV@m365ds060811.onmicrosoft.com (소문자 확인)
3. 제목 검색 없이 발신자만으로 검색
```

#### 문제: 메일이 Delivery 실패로 표시

**원인:**
- 수신자 이메일 주소 오류
- 테넌트 내부 메일 정책 제한

**확인:**
- M365 관리 센터 → Exchange → 메일 흐름 규칙 → Track2로 필터링된 규칙 있는지 확인

---

### 🏁 결론

✅ **배포 성공 확인됨:**
- HTTP 202 응답 (프로그래매틱)
- Outlook Sent Items에 자동 저장 (API 옵션)
- M365 관리 센터 메일 추적으로 Delivered 상태 재확인 권장

**다음 단계:** M365 관리 센터 메일 추적에서 15개 메일 모두 "Delivered" 상태 확인 후 검증 완료
