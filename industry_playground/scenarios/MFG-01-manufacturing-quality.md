# MFG-01 제조 — 품질 이상 조기 감지 및 원인 후보 검증

## 목적과 범위

제품군·생산라인·교대·작업지시·공정·설비·원자재 lot와 분석 기간을 정해 불량 신호가
기준선에서 벗어났는지 확인합니다. 목표는 원인을 단정하지 않고 생산·설비·자재·검사
관점의 원인 후보를 검증하는 것입니다.

## 예시 질문

1. **품질 분석 관점:** 최근 4주간 라인·교대·공정별 불량률과 first-pass yield를 이전 정상 기간과 비교하면 어떤 편차가 가장 큰가?
2. **원인 검증 관점:** 불량 급증 시점과 설비 정지, 공정 변경, 원자재 lot 교체가 어떤 Ontology 관계 경로로 연결되는가?
3. **운영 승인 관점:** 현재 근거만으로 추가 검사·lot 격리·출하 보류·CAPA 중 무엇을 제안할 수 있으며 품질 책임자의 승인이 필요한 것은 무엇인가?

## 확인할 질문

- 불량률, first-pass yield, 재작업률 또는 결함 코드 분포가 기준선에서 벗어났는가?
- 공정·설비·교대·원자재 lot 변화가 신호와 시간적으로 겹치는가?
- 작업 SOP·검사 기준 편차를 뒷받침하는 내부 근거가 있는가?
- 추가 검사, lot 격리, 출하 보류 또는 CAPA 검토가 필요한가?

## IQ별 처리

### FabricIQ — 정형 지표

- **입력/범위:** 제품군·생산라인·교대·작업지시·공정·설비·원자재 lot·분석 기간과
  제품→작업지시→공정→설비→검사, 자재 lot→공급사 Ontology 관계 경로.
- **처리·검증 단계:** 불량률, first-pass yield, 재작업률, 결함 코드 분포를 계산하고
  정상 기간 기준선과 비교합니다. 설비 정지, 공정 변경, 원자재 lot 교체 이벤트가
  불량 신호와 시간적으로 겹치는지 관계 경로를 따라 검증합니다.
- **출력/인계:** `structuredMetrics`(불량률·FPY·재작업률·편차폭), `highlights`(가장
  벗어난 라인·교대·공정), `sourceTrace`(사용한 테이블·관계 경로)를 WorkIQ 검색
  범위와 FoundryIQ 대조 단계로 전달합니다.
- **한계/비목표:** 원인을 단정하지 않고 후보 신호만 제시합니다. CAPA·격리·출하
  보류를 직접 제안하지 않습니다. 정형 데이터 접근 실패 시 이후 단계는 `정형 수치
  미검증` partial로 표시됩니다.

### WorkIQ — ACL 근거

- **입력/범위:** ACL이 적용된 M365 문서·대화 중 인수인계 노트, 품질 회의록, CAPA
  문서, 작업지침 개정 이력, 변경 승인, 보전 기록.
- **처리·검증 단계:** 요청자 권한으로 필터링된 검색을 수행하고, FabricIQ가 표시한
  이상 구간(라인·교대·시점)에 맞춰 관련 문서를 좁힙니다. 문서의 최신성과 승인
  상태(초안/승인완료)를 확인합니다.
- **출력/인계:** `evidenceLinks`(문서 제목·링크·작성자/승인자·시점),
  `sourceCoverage`(검색 범위 대비 커버리지), 필요 시 `sourceTrace`를 FoundryIQ로
  전달합니다.
- **한계/비목표:** FabricIQ 수치를 문서 근거로 역산하지 않습니다. 요청자 권한
  밖 문서는 조회하지 않습니다. 관련 문서가 없으면 `업무 문서 근거 없음` partial로
  표시됩니다.

### WebIQ — 공개 웹 인용

- **입력/범위:** 내부 식별자·미공개 수치를 포함하지 않은 공개 웹 검색만
  사용하며, 규제기관 안전 공지, 공급사 품질 공지, 운송·기상 공지 도메인을
  대상으로 합니다.
- **처리·검증 단계:** 공식 도메인 여부를 확인하고 관측 시각을 기록하며, 분석
  기간·지역 범위(scope)와 일치하는지 맞춥니다. simulation에서는 각 인용에
  `factStatus: fixture-contract`와 현재 실제 사건을 증명하지 않는
  한계(limitations)를 표기합니다.
- **출력/인계:** `webCitations` 목록(`title`, `url`, `domain`, `observedAt`,
  `scope`, `factStatus`, `limitations`)만 내부 식별자 없이 FoundryIQ로
  전달합니다.
- **한계/비목표:** 공개 정보만으로 내부 불량의 원인을 확정하지 않습니다. 내부
  작업지시번호·lot 번호 등 민감정보를 웹 질의에 넣지 않습니다. 관련 공지가 없거나
  조회에 실패하면 `외부 최신 근거 없음` partial로 표시됩니다.

### FoundryIQ — 권위 대조 및 최종 문장화

- **입력/범위:** FabricIQ `structuredMetrics`, WorkIQ `evidenceLinks`, WebIQ
  `webCitations`와 현재 품질 SOP·검사 기준·출하 보류·CAPA 절차(권위 지식).
- **처리·검증 단계:** 질문 의도에 맞게 세 근거를 라우팅·결합하고 SOP·검사
  기준과 대조합니다. 각 소스 호출 실패 시 5초→10초→20초 간격으로 최대 3회
  재시도(총 최대 4회 시도)한 뒤 아래 fallback 표에 따라 판정합니다.
- **출력/인계:** 추가 검사·lot 격리·출하 보류·CAPA 후보와 미확인 사항을 분리한
  브리핑을 문장화하고, `sourceTrace`에 `FabricIQ`, `WorkIQ`, `WebIQ`, `FoundryIQ`를
  명시합니다.
- **한계/비목표:** 근거 없는 수치나 링크를 생성하지 않습니다. 최종 결론이 아닌
  후보만 제시하며, lot 격리·출하 보류·CAPA 실행은 품질 책임자의 명시적 승인 없이
  진행되지 않습니다.

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
product->WO->process          handoff notes, quality           regulator safety notice
->equipment->inspection       minutes, CAPA, SOP revision,      supplier quality notice
material lot->supplier        change approval, maintenance      logistics/weather notice
(structured KPI + baseline)   log (ACL-scoped M365)             (public web only)
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
     quality SOP / inspection criteria / hold / CAPA procedure match
     route + combine + evaluate; retry 5s/10s/20s (up to 3, total 4 tries)
     sourceTrace: FabricIQ, WorkIQ, WebIQ, FoundryIQ
                       |
                       v
     briefing: candidate actions + unresolved items + approval needed
                       |
                       v
        [Human approval: Quality Lead]
   extra inspection / lot isolation / shipment hold / CAPA execution
```

## 승인 경계와 완료 기준

품질 책임자가 lot 격리, 출하 보류, 추가 검사와 CAPA를 승인합니다. 브리핑에 분석 단위,
기준선, 근거 링크, 외부 근거의 범위, SOP 대조 결과와 승인 지점이 분리되어야 합니다.
