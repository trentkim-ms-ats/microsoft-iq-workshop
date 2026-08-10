# Track3 WebIQ 외부 근거 패키지

이 폴더는 Q1–Q3의 공개 웹 citation 계약을 제공합니다. Track1/2 내부 데이터와
`track4/` FoundryIQ 생성 산출물은 수정하지 않습니다.

| 파일 | 역할 |
| --- | --- |
| [source_catalog.json](source_catalog.json) | 검색 의도, 허용 공식 도메인, 해석 경계 |
| [web_evidence_fixture.json](web_evidence_fixture.json) | offline 교육용 citation 계약 |
| [validate_webiq_sources.py](validate_webiq_sources.py) | schema, 도메인, scenario coverage 검증 |

```bash
python track3/data/validate_webiq_sources.py
```

- `fixture-contract`는 현재 장애·경보·리콜을 주장하지 않습니다.
- live citation은 실행 시각과 실제 URL을 기록하고 `live-observation`을 사용합니다.
- 가상 상품과 공개 웹의 실제 상품을 같은 개체로 매칭하지 않습니다.
- `track4/data/run_microsoft_iq_simulation.py`는 이 fixture를 명시적으로 읽고 결과를
  `track4/data/generated/microsoft_iq_responses/`에 씁니다.
