# TEL-01 통신 — 네트워크 장애 예측 및 고객 영향 최소화

## 목적과 범위

권역·사이트/셀·네트워크 요소·서비스·변경창·분석 기간을 정해 장애 징후와 집계 고객
영향을 우선순위화하고 검증·복구·커뮤니케이션을 준비합니다.

## 예시 질문

1. **성능 분석 관점:** 최근 가용성·지연·패킷 손실·alarm burst가 지역·사이트·셀별 기준선에서 얼마나 벗어났는가?
2. **원인 후보 관점:** 장애 징후가 계획된 변경, 현장 작업, 특정 네트워크 요소 또는 지역 이벤트와 어떤 시간적 관계를 보이는가?
3. **고객 대응 관점:** 집계 고객 영향이 큰 구간에 대해 runbook상 검증·완화·현장 출동·대외 공지 중 무엇을 승인 요청해야 하는가?

## 확인할 질문

- 가용성, 혼잡, 지연, 패킷 손실, handover·통화절단, alarm burst가 기준선에서 벗어났는가?
- 계획된 변경·현장 작업·네트워크 요소·지역 이벤트와 시간적으로 겹치는가?
- 현장 출동, 완화 변경 또는 고객 안내를 누구에게 승인 요청할 것인가?

## IQ별 처리

### FabricIQ — 정형 지표

- **입력/범위:** 권역·사이트/셀·네트워크 요소·서비스·변경창·분석 기간과
  권역→사이트/셀→네트워크 요소→성능·경보, 변경→작업→서비스 영향 Ontology
  관계 경로.
- **처리·검증 단계:** 가용성, 혼잡, 지연, 패킷 손실, handover·통화절단,
  alarm burst를 계산하고 지역·사이트·셀별 기준선과 비교합니다. 계획된
  변경·현장 작업·네트워크 요소·지역 이벤트와 시간적으로 겹치는지 관계
  경로를 따라 검증합니다.
- **출력/인계:** `structuredMetrics`(가용성·지연·패킷손실·alarm burst),
  `highlights`(가장 벗어난 권역·사이트·셀), `sourceTrace`(사용한 테이블·관계
  경로)를 WorkIQ 검색 범위와 FoundryIQ 대조 단계로 전달합니다.
- **한계/비목표:** 장애 원인을 단정하지 않고 후보 신호만 제시합니다.
  현장 출동·완화 변경·대외 공지를 직접 제안하지 않습니다. 정형 데이터
  접근 실패 시 `정형 수치 미검증` partial로 표시됩니다.

### WorkIQ — ACL 근거

- **입력/범위:** ACL이 적용된 M365 문서·대화 중 NOC bridge 기록, 변경 승인,
  현장 보고, runbook, 장애 커뮤니케이션 승인 기록.
- **처리·검증 단계:** 요청자 권한으로 필터링된 검색을 수행하고, FabricIQ가
  표시한 이상 구간(권역·사이트·시점)에 맞춰 관련 문서를 좁힙니다. 변경
  승인·현장 보고의 시점과 승인 상태를 확인합니다.
- **출력/인계:** `evidenceLinks`(문서 제목·링크·작성자/승인자·시점),
  `sourceCoverage`(검색 범위 대비 커버리지), 필요 시 `sourceTrace`를
  FoundryIQ로 전달합니다.
- **한계/비목표:** FabricIQ 수치를 문서 근거로 역산하지 않습니다. 요청자
  권한 밖 문서는 조회하지 않습니다. 관련 문서가 없으면 `업무 문서 근거
  없음` partial로 표시됩니다.

### WebIQ — 공개 웹 인용

- **입력/범위:** 내부 식별자·미공개 수치를 포함하지 않은 공개 웹 검색만
  사용하며, 공식 기상·재난·전력·규제 공지 도메인을 대상으로 합니다.
- **처리·검증 단계:** 공식 도메인 여부를 확인하고 관측 시각을 기록하며,
  분석 기간·권역(scope)과 일치하는지 맞춥니다. simulation에서는 각 인용에
  `factStatus: fixture-contract`와 현재 실제 사건을 증명하지 않는
  한계(limitations)를 표기합니다.
- **출력/인계:** `webCitations` 목록(`title`, `url`, `domain`, `observedAt`,
  `scope`, `factStatus`, `limitations`)만 내부 식별자 없이 FoundryIQ로
  전달합니다.
- **한계/비목표:** 공개 정보만으로 자사 장애 원인을 단정하지 않습니다.
  내부 사이트/셀 식별자·경보 내용을 웹 질의에 넣지 않습니다. 관련 공지가
  없거나 조회에 실패하면 `외부 최신 근거 없음` partial로 표시됩니다.

### FoundryIQ — 권위 대조 및 최종 문장화

- **입력/범위:** FabricIQ `structuredMetrics`, WorkIQ `evidenceLinks`, WebIQ
  `webCitations`와 장애 runbook·변경 정책·공지 기준(권위 지식).
- **처리·검증 단계:** 질문 의도에 맞게 세 근거를 라우팅·결합하고 runbook·
  변경 정책·공지 기준과 대조합니다. 각 소스 호출 실패 시 5초→10초→20초
  간격으로 최대 3회 재시도(총 최대 4회 시도)한 뒤 아래 fallback 표에 따라
  판정합니다.
- **출력/인계:** 검증·완화·현장 출동·대외 공지 후보와 미확인 사항을 분리한
  브리핑을 문장화하고, `sourceTrace`에 `FabricIQ`, `WorkIQ`, `WebIQ`,
  `FoundryIQ`를 명시합니다.
- **한계/비목표:** 근거 없는 수치나 링크를 생성하지 않습니다. 최종 결론이
  아닌 후보만 제시하며, 네트워크 설정 변경·현장 출동·대외 공지는 NOC·서비스
  책임자의 명시적 승인 없이 진행되지 않습니다.

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
region->site/cell              NOC bridge notes, change          official weather/disaster/
->network element               approval, field report, runbook,  power/regulatory notice
->performance/alarm             incident comms approval
change->work->service impact   (ACL-scoped M365)                  (public web only)
(availability, latency,
 packet loss, alarm burst)
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
     incident runbook / change policy / notice criteria match
     route + combine + evaluate; retry 5s/10s/20s (up to 3, total 4 tries)
     sourceTrace: FabricIQ, WorkIQ, WebIQ, FoundryIQ
                       |
                       v
     briefing: candidate actions + unresolved items + approval needed
                       |
                       v
        [Human approval: NOC/Service Lead]
   verification / mitigation change / field dispatch / external notice
```

## 승인 경계와 완료 기준

NOC·서비스 책임자가 네트워크 설정 변경, 현장 출동과 대외 공지를 승인합니다. 영향 범위,
복구 근거, 외부 공지의 한계와 승인자를 분리하면 완료입니다.
