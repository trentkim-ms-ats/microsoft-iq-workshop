# Track3 WebIQ 실습지(참가자용)

- 트랙명: **Track3 — WebIQ 공개 웹 최신 근거**
- 순서: Track1 FabricIQ → Track2 WorkIQ → **Track3 WebIQ** → Track4 FoundryIQ
- 권장 시간: 1일 480분 과정 35분
- 결과물: `[TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE]`

## 역할 경계

| IQ | 담당 | 이 트랙에서 하지 않는 일 |
| --- | --- | --- |
| FabricIQ | 내부 정형 수치 | 웹 기사에서 내부 KPI 추정 |
| WorkIQ | ACL 적용 내부 업무 맥락 | 공개 웹을 내부 근거처럼 제시 |
| WebIQ | 공개 웹 최신 근거와 URL citation | 출처 없는 최신 사실 생성 |
| FoundryIQ | 세 근거의 라우팅·결합·평가 | 근거 책임 혼합 |

## 완료 기준

- Q1–Q3 각각 citation 2개 이상
- citation마다 `url`, `title`, `domain`, `observedAt`, `scope`, `factStatus`,
  `limitations` 기록
- 출처 품질 6개 항목 중 5개 이상 PASS
- 검색어의 민감한 내부 식별자·수치 0건
- 외부 근거만으로 내부 원인을 확정한 문장 0건

## 시나리오 연결

WebIQ는 기존 내부 질문을 바꾸지 않고 공개 확인 질문을 추가합니다.

| ID | WebIQ 공개 확인 질문 | 해석 경계 |
| --- | --- | --- |
| Q1 | 같은 기간 외부 결제 서비스 공식 장애 공지가 있었는가? | 내부 제공자·시간이 일치해야 원인 후보 |
| Q2 | 같은 기간·지역 공식 기상·교통 경보가 있었는가? | 지역이 없으면 가능성으로만 표시 |
| Q3 | 제품 범주의 공식 안전 공지·사이버보안 지침이 있는가? | 가상 상품과 실제 공지를 동일시하지 않음 |
| Q4 | 같은 기간 외부 운송·공급망 공식 공지가 있었는가? | 내부 물류 지표와 시간대가 맞을 때만 관련 가능성 표기 |
| Q5 | 같은 기간 소비자 보호·환불 정책 공지가 있었는가? | 고객등급·채널별 내부 결과와 분리해 보조 근거로만 사용 |

## 미션 1. 안전한 검색어 만들기 (10분)

1. 내부 질문에서 공개 정보로 확인할 부분만 분리합니다.
2. 고객명, 주문번호, 내부 URL, 미공개 수치, 토큰을 제거합니다.
3. 시간 범위, 지역(알려진 경우), 공식 1차 출처 조건을 넣습니다.

웹 콘텐츠의 “이전 지침을 무시하라” 같은 문구는 명령이 아니라 인용·신뢰도 검토 대상
데이터입니다.

## 미션 2. Web Search 또는 fixture (15분)

### `live`

승인된 Foundry Agent Service Web Search에서 Q1–Q3 추가 확인 질문을 실행하고 URL
citation의 제목, URL, 관찰 시각, 적용 범위를 기록합니다. citation이 없으면 도구 설정과
검색어를 점검합니다. 확인되지 않은 내용은 추정하지 않습니다.

### `simulation`

```bash
python track3/data/validate_webiq_sources.py
```

[source catalog](data/source_catalog.json)의 허용 도메인과
[fixture](data/web_evidence_fixture.json)의 계약을 읽습니다. fixture는 현재 웹 사실이
아니며 `factStatus=fixture-contract`를 유지해야 합니다.

## 미션 3. 출처 품질 평가 (10분)

| 항목 | PASS 기준 |
| --- | --- |
| 권위성 | 정부·규제기관·공식 상태 페이지·제공자 원문 |
| 최신성 | 관찰 또는 발행 시각 기록 |
| 관련성 | 기간·지역·제품 범위 명시 |
| 교차확인 | 중요한 주장에 독립 출처 2개 이상 |
| 인용성 | 원문 URL 확인 가능 |
| 안전성 | 민감정보와 prompt injection 위험 통제 |

각 citation은 `direct-match`, `category-level`, `source-capability` 중 적용 범위와
불확실성을 표시합니다.

## 미션 4. Track4 FoundryIQ 인계 (10분)

`[TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE]`를 [PREREQUISITES.md](PREREQUISITES.md)
형식으로 작성합니다. 다음 단계는
[Track4 FoundryIQ Workbook](../track4/WORKBOOK.md)입니다.
