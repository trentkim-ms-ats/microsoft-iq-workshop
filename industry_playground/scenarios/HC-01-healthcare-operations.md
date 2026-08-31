# HC-01 헬스케어 — 집계 운영 안전 리스크 조기 감지

## 목적과 범위

시설·서비스 라인·병동·교대·분석 기간의 집계 데이터만 사용해 병상 운영과 안전 리스크를
조기에 감지합니다. 개별 환자의 진단·트리아지·처방·치료 결정에는 사용하지 않습니다.

## 예시 질문

1. **운영 지표 관점:** 병동·교대별 병상 점유율, boarding, 대기시간과 인력 커버리지가 정상 기간 대비 어떻게 변했는가?
2. **집중도 분석 관점:** 운영 부담과 비식별 안전사건 집계가 특정 서비스 라인이나 교대에 집중되는가?
3. **에스컬레이션 관점:** 안전 huddle·감염관리·용량 프로토콜에 따라 추가 인력이나 병상 조정을 누구에게 제안해야 하며 임상 판단으로 남겨야 할 사항은 무엇인가?

## 확인할 질문

- 병상 점유, boarding, 대기시간, 입·퇴원 흐름, 재입원 추세와 인력 커버리지가 기준선에서 벗어났는가?
- 특정 병동·교대·서비스 라인에 운영 부담이 집중되는가?
- 안전 huddle, 용량 에스컬레이션, 감염관리 프로토콜상 확인할 조치는 무엇인가?

## IQ별 처리

### FabricIQ — 정형 지표

- **입력/범위:** 시설·서비스 라인·병동·교대·분석 기간의 집계 데이터와
  시설→서비스 라인→병동→교대→용량·안전사건 집계 Ontology 관계 경로. 개별
  환자 식별자는 사용하지 않습니다.
- **처리·검증 단계:** 병상 점유율, boarding, 대기시간, 인력 커버리지, 비식별
  안전사건 집계를 계산하고 정상 기간 기준선과 비교합니다. 운영 부담이 특정
  병동·교대·서비스 라인에 집중되는지 확인합니다.
- **출력/인계:** `structuredMetrics`(병상 점유율·boarding·대기시간·인력
  커버리지), `highlights`(가장 벗어난 병동·교대·서비스 라인),
  `sourceTrace`(사용한 테이블·관계 경로)를 WorkIQ 검색 범위와 FoundryIQ 대조
  단계로 전달합니다.
- **한계/비목표:** 개별 환자의 진단·트리아지·처방·치료 결정에는 사용하지
  않습니다. 임상적 원인을 단정하지 않고 운영 신호만 제시합니다. 정형 데이터
  접근 실패 시 `정형 수치 미검증` partial로 표시됩니다.

### WorkIQ — ACL 근거

- **입력/범위:** ACL이 적용된 M365 문서·대화 중 안전 huddle 기록, 병상·인력
  에스컬레이션, 감염관리 공지, 책임자 승인 기록.
- **처리·검증 단계:** 요청자 권한으로 필터링된 검색을 수행하고, FabricIQ가
  표시한 운영 부담 구간(병동·교대·시점)에 맞춰 관련 문서를 좁힙니다. 승인
  상태와 후속 조치 여부를 확인합니다.
- **출력/인계:** `evidenceLinks`(문서 제목·링크·승인자·시점),
  `sourceCoverage`(검색 범위 대비 커버리지), 필요 시 `sourceTrace`를
  FoundryIQ로 전달합니다.
- **한계/비목표:** FabricIQ 수치를 문서 근거로 역산하지 않습니다. 요청자 권한
  밖 문서나 개별 환자 기록은 조회하지 않습니다. 관련 문서가 없으면 `업무
  문서 근거 없음` partial로 표시됩니다.

### WebIQ — 공개 웹 인용

- **입력/범위:** 내부 식별자·환자 정보를 포함하지 않은 공개 웹 검색만
  사용하며, 보건 당국의 감염병·재난·기상·규제 공지 도메인을 기간·지역
  범위에 맞춰 대상으로 합니다.
- **처리·검증 단계:** 공식 도메인 여부를 확인하고 관측 시각을 기록하며,
  분석 기간·지역(scope)과 일치하는지 맞춥니다. simulation에서는 각 인용에
  `factStatus: fixture-contract`와 현재 실제 사건을 증명하지 않는
  한계(limitations)를 표기합니다.
- **출력/인계:** `webCitations` 목록(`title`, `url`, `domain`, `observedAt`,
  `scope`, `factStatus`, `limitations`)만 내부 식별자 없이 FoundryIQ로
  전달합니다.
- **한계/비목표:** 공개 정보만으로 내부 운영 부담의 원인을 확정하지
  않습니다. 환자 정보나 병상·인력 내부 수치를 웹 질의에 넣지 않습니다.
  관련 공지가 없거나 조회에 실패하면 `외부 최신 근거 없음` partial로
  표시됩니다.

### FoundryIQ — 권위 대조 및 최종 문장화

- **입력/범위:** FabricIQ `structuredMetrics`, WorkIQ `evidenceLinks`, WebIQ
  `webCitations`와 환자 안전·용량·인력 프로토콜(권위 지식).
- **처리·검증 단계:** 질문 의도에 맞게 세 근거를 라우팅·결합하고 안전
  huddle·용량 에스컬레이션·감염관리 프로토콜과 대조합니다. 각 소스 호출 실패
  시 5초→10초→20초 간격으로 최대 3회 재시도(총 최대 4회 시도)한 뒤 아래
  fallback 표에 따라 판정합니다.
- **출력/인계:** 추가 인력·병상 조정·안전 검토 후보와 임상 판단으로 남겨야
  할 사항을 분리한 브리핑을 문장화하고, `sourceTrace`에 `FabricIQ`,
  `WorkIQ`, `WebIQ`, `FoundryIQ`를 명시합니다.
- **한계/비목표:** 근거 없는 수치나 링크를 생성하지 않습니다. 임상적 결정을
  대신하지 않으며, 추가 인력·병상 조정·안전 검토 실행은 운영·임상 책임자의
  명시적 승인 없이 진행되지 않습니다.

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
facility->service line        safety huddle notes, bed/staff    health authority outbreak/
->ward->shift->capacity/       escalation, infection control     disaster/weather/regulatory
 safety-event aggregate        notice, approval record           notice
(aggregate only, no PHI)       (ACL-scoped M365)                 (public web only)
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
     patient-safety / capacity / staffing protocol match
     route + combine + evaluate; retry 5s/10s/20s (up to 3, total 4 tries)
     sourceTrace: FabricIQ, WorkIQ, WebIQ, FoundryIQ
                       |
                       v
     briefing: candidate actions + clinical-judgment-excluded items + approval needed
                       |
                       v
        [Human approval: Operations/Clinical Lead]
   additional staffing / bed reallocation / safety review (clinical decisions excluded)
```

## 승인 경계와 완료 기준

운영·임상 책임자가 추가 인력, 병상 조정과 안전 검토를 승인합니다. 비식별·집계 범위,
운영 지표, 프로토콜 근거와 임상 판단의 제외 경계가 명확해야 합니다.
