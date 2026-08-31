# FIN-01 금융 — AML/KYC 컴플라이언스 검토 우선순위화

## 목적과 범위

승인된 관할·상품·가명화 고객 위험등급·분석 기간을 정해 거래·고객 위험 신호를
검토 우선순위로 정리하고 현행 AML/KYC 정책에 맞는 검토 패키지를 만듭니다.

## 예시 질문

1. **위험 지표 관점:** 관할·상품·위험등급별 이상 거래 빈도, 경보 발생률, 케이스 aging이 승인된 기준선과 어떻게 다른가?
2. **정책 준수 관점:** KYC 갱신 지연과 예외 승인 사례 중 현재 정책 버전과 검토·승인 기록이 일치하지 않는 것은 무엇인가?
3. **검토 우선순위 관점:** 가명화된 케이스 중 추가 증빙이나 준법·법무 에스컬레이션을 먼저 제안할 대상은 무엇이며 자동으로 결론 내릴 수 없는 항목은 무엇인가?

## 확인할 질문

- 이상 거래 빈도·규모, 경보 발생률 또는 케이스 적체가 기준선과 다른가?
- KYC 갱신 지연, 예외 승인 비율, 케이스 aging이 임계값을 넘었는가?
- 내부 승인·검토 기록이 현재 정책 버전과 일치하는가?
- 어떤 가명화 케이스를 추가 조사 또는 에스컬레이션 대상으로 제안할 것인가?

## IQ별 처리

### FabricIQ — 정형 지표

- **입력/범위:** 승인된 관할·상품·가명화 고객 위험등급·분석 기간과
  고객→계좌→거래→경보→케이스→승인 Ontology 관계 경로.
- **처리·검증 단계:** 관할·상품·위험등급별 이상 거래 빈도, 경보 발생률, 케이스
  aging을 계산하고 승인된 기준선·정책 임계값과 비교합니다. KYC 갱신 지연,
  예외 승인 비율이 임계값을 넘는지 확인합니다.
- **출력/인계:** `structuredMetrics`(경보 발생률·케이스 aging·임계값 초과
  여부), `highlights`(가장 벗어난 관할·상품·위험등급), `sourceTrace`(사용한
  테이블·관계 경로)를 WorkIQ 검색 범위와 FoundryIQ 대조 단계로 전달합니다.
  모든 식별은 가명화 상태로 유지합니다.
- **한계/비목표:** 법적 결론이나 계좌 동결 대상을 단정하지 않고 검토 우선순위
  신호만 제시합니다. 실제 고객·계좌 재식별을 시도하지 않습니다. 정형 데이터
  접근 실패 시 `정형 수치 미검증` partial로 표시됩니다.

### WorkIQ — ACL 근거

- **입력/범위:** ACL이 적용된 M365 문서·대화 중 사건 검토 노트, 준법·법무
  승인 기록, 정책 예외 승인, 감사 지적, 정책 버전 문서.
- **처리·검증 단계:** 요청자 권한으로 필터링된 검색을 수행하고, FabricIQ가
  표시한 가명화 케이스·관할·상품에 맞춰 관련 문서를 좁힙니다. 문서상 정책
  버전과 승인 이력이 현재 정책 버전과 일치하는지 확인합니다.
- **출력/인계:** `evidenceLinks`(문서 제목·링크·승인자·시점),
  `sourceCoverage`(검색 범위 대비 커버리지), 필요 시 `sourceTrace`를
  FoundryIQ로 전달합니다.
- **한계/비목표:** FabricIQ 수치를 문서 근거로 역산하지 않습니다. 요청자 권한
  밖 문서는 조회하지 않습니다. 관련 문서가 없으면 `업무 문서 근거 없음`
  partial로 표시됩니다.

### WebIQ — 공개 웹 인용

- **입력/범위:** 고객·거래 정보를 전송하지 않는 공개 웹 검색만 사용하며,
  규제기관·제재 당국의 공식 법령·가이드 변경 공지 도메인만 대상으로 합니다.
- **처리·검증 단계:** 공식 도메인 여부를 확인하고 관측 시각을 기록하며,
  분석 기간·관할(scope)과 일치하는지 맞춥니다. simulation에서는 각 인용에
  `factStatus: fixture-contract`와 현재 실제 사건을 증명하지 않는
  한계(limitations)를 표기합니다.
- **출력/인계:** `webCitations` 목록(`title`, `url`, `domain`, `observedAt`,
  `scope`, `factStatus`, `limitations`)만 내부 식별자 없이 FoundryIQ로
  전달합니다.
- **한계/비목표:** 공개 정보만으로 개별 케이스의 위법 여부를 판단하지
  않습니다. 고객명·계좌번호·거래내역 등 어떤 민감정보도 웹 질의에 넣지
  않습니다. 관련 공지가 없거나 조회에 실패하면 `외부 최신 근거 없음`
  partial로 표시됩니다.

### FoundryIQ — 권위 대조 및 최종 문장화

- **입력/범위:** FabricIQ `structuredMetrics`, WorkIQ `evidenceLinks`, WebIQ
  `webCitations`와 정책 버전·예외·에스컬레이션·보존 기준(권위 지식).
- **처리·검증 단계:** 질문 의도에 맞게 세 근거를 라우팅·결합하고 현재 정책
  버전과 대조합니다. 각 소스 호출 실패 시 5초→10초→20초 간격으로 최대 3회
  재시도(총 최대 4회 시도)한 뒤 아래 fallback 표에 따라 판정합니다.
- **출력/인계:** 추가 증빙 요청·준법/법무 에스컬레이션 후보와 자동으로
  결론 낼 수 없는 항목을 분리한 검토 패키지를 문장화하고, `sourceTrace`에
  `FabricIQ`, `WorkIQ`, `WebIQ`, `FoundryIQ`를 명시합니다.
- **한계/비목표:** 근거 없는 수치나 링크를 생성하지 않습니다. 법적 결론,
  계좌 동결, 거래 제한, 규제 신고는 제안하지 않으며 준법·법무 담당자의 명시적
  승인 없이 진행되지 않습니다.

### Fallback 및 완료 판단

| 실패 상황 | 결과 |
| --- | --- |
| FabricIQ만 실패 | partial: `정형 수치 미검증` |
| WorkIQ만 실패 | partial: `업무 문서 근거 없음` |
| WebIQ만 실패 | partial: `외부 최신 근거 없음` |
| FabricIQ + WorkIQ 동시 실패 | blocked — WebIQ 근거가 있어도 공개 웹만으로 결론을 내리지 않음 |

### 처리 흐름 다이어그램

```text
[FabricIQ]                    [WorkIQ]                        [WebIQ]
customer(pseudonymized)       case review notes, compliance/    regulator/sanctions body
->account->transaction        legal approval, policy            official law/guidance
->alert->case->approval       exception, audit finding           change notice
(alert rate, case aging,      (ACL-scoped M365)                  (public web only,
 threshold breach)                                                no customer/txn data)
        |                             |                                |
        v                             v                                v
 structuredMetrics             evidenceLinks                     webCitations
 highlights, sourceTrace        sourceCoverage                    title/url/domain/
        |                       (sourceTrace optional)             observedAt/scope/
        |                             |                             factStatus/limitations
        +--------------+--------------+---------------+----------------+
                       |
                       v
                 [FoundryIQ]
     AML/KYC policy version / exception / escalation / retention match
     route + combine + evaluate; retry 5s/10s/20s (up to 3, total 4 tries)
     sourceTrace: FabricIQ, WorkIQ, WebIQ, FoundryIQ
                       |
                       v
     review package: priority candidates + unresolved items + approval needed
                       |
                       v
        [Human approval: Compliance/Legal Officer]
   additional evidence request / escalation / legal conclusion (human-only)
```

## 승인 경계와 완료 기준

준법·법무 담당자만 법적 결론, 계좌 동결, 거래 제한과 신고를 결정합니다. 가명화 범위,
정책 버전, 우선 검토 근거와 법적 승인 지점이 명확해야 합니다.
