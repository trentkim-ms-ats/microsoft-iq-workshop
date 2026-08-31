# LOG-01 물류 — 배송 지연 사전 예측 및 대응

## 목적과 범위

주문·출고 노드·재고·운송사·노선·배송권역·ETA와 분석 기간을 정해 지연 위험 주문을
우선순위화하고 고객 영향이 커지기 전 승인된 대응안을 준비합니다.

## 예시 질문

1. **성과 분석 관점:** 지난 7일간 정시배송률과 ETA 편차가 어느 노드·운송사·권역에서 기준선보다 악화됐는가?
2. **고객 영향 관점:** 지연 위험 주문 중 고객 영향 규모와 예상 반품·문의 부담이 가장 큰 상품·구간은 어디인가?
3. **대응 의사결정 관점:** 날씨·재고·운송 용량·내부 작업 중 확인된 근거는 무엇이며 재배차나 고객 안내를 누구에게 승인받아야 하는가?

## 확인할 질문

- 정시배송률과 ETA 편차가 기준선에서 악화됐는가?
- 특정 노드·운송사·노선·상품·권역에 지연이 집중되는가?
- 재고·날씨·용량·변경 작업 중 어떤 요인이 시간적으로 겹치는가?
- 재배차, 대체 운송, 고객 안내 또는 보상 검토가 필요한가?

## IQ별 처리

### FabricIQ — 정형 지표

- **입력/범위:** 주문·출고 노드·재고·운송사·노선·배송권역·ETA·분석 기간과
  주문→출고→운송→배송 이벤트 Ontology 관계 경로.
- **처리·검증 단계:** 정시배송률, ETA 편차, backlog를 계산하고 정상 기간
  기준선과 비교합니다. 지연군에 속한 주문의 고객 영향 규모(건수·상품·구간)를
  집계해 우선순위를 매깁니다.
- **출력/인계:** `structuredMetrics`(정시배송률·ETA 편차·backlog),
  `highlights`(가장 악화된 노드·운송사·권역), `sourceTrace`(사용한 테이블·관계
  경로)를 WorkIQ 검색 범위와 FoundryIQ 대조 단계로 전달합니다.
- **한계/비목표:** 지연 원인을 단정하지 않고 위험 신호와 영향 규모만 제시합니다.
  재배차·보상 등 조치를 직접 제안하지 않습니다. 정형 데이터 접근 실패 시
  `정형 수치 미검증` partial로 표시됩니다.

### WorkIQ — ACL 근거

- **입력/범위:** ACL이 적용된 M365 문서·대화 중 물류 회의록, 운송사 협의
  기록, 재배차 승인, 고객 안내 초안, 담당자 처리 상태.
- **처리·검증 단계:** 요청자 권한으로 필터링된 검색을 수행하고, FabricIQ가
  표시한 지연 구간(노드·운송사·시점)에 맞춰 관련 문서를 좁힙니다. 승인
  상태(초안/승인완료)와 담당자 배정 여부를 확인합니다.
- **출력/인계:** `evidenceLinks`(문서 제목·링크·작성자/승인자·시점),
  `sourceCoverage`(검색 범위 대비 커버리지), 필요 시 `sourceTrace`를
  FoundryIQ로 전달합니다.
- **한계/비목표:** FabricIQ 수치를 문서 근거로 역산하지 않습니다. 요청자 권한
  밖 문서는 조회하지 않습니다. 관련 문서가 없으면 `업무 문서 근거 없음`
  partial로 표시됩니다.

### WebIQ — 공개 웹 인용

- **입력/범위:** 내부 식별자·미공개 수치를 포함하지 않은 공개 웹 검색만
  사용하며, 공식 기상·재난·항만·도로·운송사 공지 도메인을 대상으로 합니다.
- **처리·검증 단계:** 공식 도메인 여부를 확인하고 관측 시각을 기록하며,
  분석 기간·배송권역(scope)과 일치하는지 맞춥니다. simulation에서는 각
  인용에 `factStatus: fixture-contract`와 현재 실제 사건을 증명하지 않는
  한계(limitations)를 표기합니다.
- **출력/인계:** `webCitations` 목록(`title`, `url`, `domain`, `observedAt`,
  `scope`, `factStatus`, `limitations`)만 내부 식별자 없이 FoundryIQ로
  전달합니다.
- **한계/비목표:** 공개 정보만으로 내부 지연 원인을 확정하지 않습니다. 내부
  주문번호·운송사 계약 조건 등 민감정보를 웹 질의에 넣지 않습니다. 관련 공지가
  없거나 조회에 실패하면 `외부 최신 근거 없음` partial로 표시됩니다.

### FoundryIQ — 권위 대조 및 최종 문장화

- **입력/범위:** FabricIQ `structuredMetrics`, WorkIQ `evidenceLinks`, WebIQ
  `webCitations`와 배송 SOP·보상 정책·에스컬레이션 기준(권위 지식).
- **처리·검증 단계:** 질문 의도에 맞게 세 근거를 라우팅·결합하고 SOP·정책
  기준과 대조합니다. 각 소스 호출 실패 시 5초→10초→20초 간격으로 최대 3회
  재시도(총 최대 4회 시도)한 뒤 아래 fallback 표에 따라 판정합니다.
- **출력/인계:** 재배차·대체 운송·고객 안내·보상 검토 후보와 미확인 사항을
  분리한 브리핑을 문장화하고, `sourceTrace`에 `FabricIQ`, `WorkIQ`, `WebIQ`,
  `FoundryIQ`를 명시합니다.
- **한계/비목표:** 근거 없는 수치나 링크를 생성하지 않습니다. 최종 결론이
  아닌 후보만 제시하며, 재배차·가격·보상·대량 고객 안내는 운영 책임자의 명시적
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
order->fulfillment node       logistics meeting notes,          official weather/disaster
->carrier->delivery event     carrier negotiation, redispatch    notice, port/road notice,
(on-time rate, ETA gap,       approval, customer notice draft    carrier service notice
 backlog, impact cohort)      (ACL-scoped M365)                  (public web only)
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
     delivery SOP / compensation policy / escalation criteria match
     route + combine + evaluate; retry 5s/10s/20s (up to 3, total 4 tries)
     sourceTrace: FabricIQ, WorkIQ, WebIQ, FoundryIQ
                       |
                       v
     briefing: candidate actions + unresolved items + approval needed
                       |
                       v
        [Human approval: Operations Lead]
   redispatch / alternate carrier / customer notice / compensation review
```

## 승인 경계와 완료 기준

운영 책임자가 재배차, 가격·보상·대량 안내를 승인합니다. 위험 구간, 계산 기준,
내부 결정 근거, 외부 공지의 범위, 제안 조치와 승인자를 구분하면 완료입니다.
