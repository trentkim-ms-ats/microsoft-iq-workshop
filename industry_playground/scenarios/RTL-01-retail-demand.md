# RTL-01 리테일 — 수요 변화 조기 감지 및 매장·상품 대응 최적화

## 목적과 범위

상품·매장·채널·지역·재고·프로모션·분석 기간을 정해 수요 변화가 매출·재고·반품에
미치는 영향을 파악하고 매장·상품 대응의 우선순위를 정합니다.

## 예시 질문

1. **매출·재고 관점:** 상품·매장·채널별 판매량, 매출, 재고회전과 품절률이 정상 기간 또는 계획 대비 어떻게 달라졌는가?
2. **고객·상품 관점:** 수요가 증가하거나 감소한 상품에서 반품률과 프로모션 성과는 어떤 패턴을 보이는가?
3. **실행 승인 관점:** 공급 이슈·가격·프로모션·지역 이벤트 중 내부 근거와 공개 맥락이 각각 무엇이며 보충·재배치·프로모션 조정 중 무엇을 승인받아야 하는가?

## 확인할 질문

- 판매량, 매출, 품절, 재고회전, 반품률 또는 프로모션 성과가 기준선과 다른가?
- 특정 상품·매장·채널·지역에 변화가 집중되는가?
- 공급·가격·프로모션·지역 이벤트와 변화가 시간적으로 겹치는가?
- 보충, 재배치, 프로모션 조정 또는 상품 대체를 승인할 것인가?

## IQ별 처리

### FabricIQ — 정형 지표

- **입력/범위:** 상품·매장·채널·지역·재고·프로모션·분석 기간과
  상품→매장→재고·판매·반품·프로모션 Ontology 관계 경로.
- **처리·검증 단계:** 판매량, 매출, 재고회전, 품절률, 반품률, 프로모션
  성과를 계산하고 정상 기간 또는 계획 대비 비교합니다. 변화가 특정
  상품·매장·채널·지역에 집중되는지 관계 경로를 따라 확인합니다.
- **출력/인계:** `structuredMetrics`(판매량·매출·품절률·재고회전·반품률),
  `highlights`(가장 벗어난 상품·매장·채널·지역), `sourceTrace`(사용한
  테이블·관계 경로)를 WorkIQ 검색 범위와 FoundryIQ 대조 단계로 전달합니다.
- **한계/비목표:** 수요 변화의 원인을 단정하지 않고 신호와 편차만 제시합니다.
  보충·재배치·프로모션 조정을 직접 제안하지 않습니다. 정형 데이터 접근 실패
  시 `정형 수치 미검증` partial로 표시됩니다.

### WorkIQ — ACL 근거

- **입력/범위:** ACL이 적용된 M365 문서·대화 중 상품기획·재고·매장 운영
  회의 기록, 가격 승인, 공급 이슈 보고, 고객 대응 결정.
- **처리·검증 단계:** 요청자 권한으로 필터링된 검색을 수행하고, FabricIQ가
  표시한 변화 구간(상품·매장·채널·시점)에 맞춰 관련 문서를 좁힙니다. 승인
  상태와 후속 조치 여부를 확인합니다.
- **출력/인계:** `evidenceLinks`(문서 제목·링크·승인자·시점),
  `sourceCoverage`(검색 범위 대비 커버리지), 필요 시 `sourceTrace`를
  FoundryIQ로 전달합니다.
- **한계/비목표:** FabricIQ 수치를 문서 근거로 역산하지 않습니다. 요청자
  권한 밖 문서는 조회하지 않습니다. 관련 문서가 없으면 `업무 문서 근거
  없음` partial로 표시됩니다.

### WebIQ — 공개 웹 인용

- **입력/범위:** 내부 식별자·미공개 수치를 포함하지 않은 공개 웹 검색만
  사용하며, 공식 행사·기상·공급·규제 공지 도메인을 대상으로 합니다.
- **처리·검증 단계:** 공식 도메인 여부를 확인하고 관측 시각을 기록하며,
  분석 기간·지역(scope)과 일치하는지 맞춥니다. simulation에서는 각 인용에
  `factStatus: fixture-contract`와 현재 실제 사건을 증명하지 않는
  한계(limitations)를 표기합니다.
- **출력/인계:** `webCitations` 목록(`title`, `url`, `domain`, `observedAt`,
  `scope`, `factStatus`, `limitations`)만 내부 식별자 없이 FoundryIQ로
  전달합니다.
- **한계/비목표:** 공개 정보만으로 내부 수요 원인을 확정하지 않습니다.
  내부 재고 수치·매장 매출을 웹 질의에 넣지 않습니다. 관련 공지가 없거나
  조회에 실패하면 `외부 최신 근거 없음` partial로 표시됩니다.

### FoundryIQ — 권위 대조 및 최종 문장화

- **입력/범위:** FabricIQ `structuredMetrics`, WorkIQ `evidenceLinks`, WebIQ
  `webCitations`와 재고·가격·프로모션 SOP(권위 지식).
- **처리·검증 단계:** 질문 의도에 맞게 세 근거를 라우팅·결합하고 재고·가격·
  프로모션 SOP와 대조합니다. 각 소스 호출 실패 시 5초→10초→20초 간격으로
  최대 3회 재시도(총 최대 4회 시도)한 뒤 아래 fallback 표에 따라 판정합니다.
- **출력/인계:** 보충·재배치·프로모션 조정·상품 대체 후보와 미확인 사항을
  분리한 브리핑을 문장화하고, `sourceTrace`에 `FabricIQ`, `WorkIQ`, `WebIQ`,
  `FoundryIQ`를 명시합니다.
- **한계/비목표:** 근거 없는 수치나 링크를 생성하지 않습니다. 최종 결론이
  아닌 후보만 제시하며, 가격·프로모션·재배치·대량 고객 안내는 상품·영업
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
product->store->channel        merchandising/inventory/store     official event/weather/
->inventory/sales/returns/      ops meeting notes, price          supply/regulatory notice
 promotion relationship         approval, supply issue,
(sales, revenue, stockout,      customer response decision
 inventory turn, return rate)   (ACL-scoped M365)                 (public web only)
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
     inventory / pricing / promotion SOP match
     route + combine + evaluate; retry 5s/10s/20s (up to 3, total 4 tries)
     sourceTrace: FabricIQ, WorkIQ, WebIQ, FoundryIQ
                       |
                       v
     briefing: candidate actions + unresolved items + approval needed
                       |
                       v
        [Human approval: Merchandising/Sales Lead]
   replenishment / reallocation / promotion adjustment / product substitution
```

## 승인 경계와 완료 기준

상품·영업 책임자가 가격, 프로모션, 재배치와 대량 고객 안내를 승인합니다. 상품 범위,
기준선, 내부 결정 근거, 외부 맥락과 승인 지점을 브리핑에 명시하면 완료입니다.
