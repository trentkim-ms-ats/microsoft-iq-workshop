# WebIQ 입문 및 출처 거버넌스

이 문서는 canonical `track3/` WebIQ 학습 모듈에 속합니다. WebIQ는 Microsoft
기능/제품 이름이며 Track3는 공개 웹 근거를 익히는 저장소 디렉터리와 학습 단계입니다.

## 1. WebIQ란

Microsoft IQ는 Work IQ, Fabric IQ, Foundry IQ, Web IQ의 네 기능을 연결합니다. Web IQ는 AI 시스템과 에이전트가 공개 웹의 최신 실세계 정보에 근거하도록 돕습니다.

2026년 7월 기준 Web IQ는 Bing의 글로벌 인덱스를 기반으로 웹 페이지·뉴스·이미지·비디오의 최신 근거를 에이전트용 passage 또는 구조화 evidence로 제공하는 방향의 제품군입니다.

공식 참고:

- [Microsoft IQ](https://learn.microsoft.com/en-us/microsoft-iq/)
- [Web IQ 발표](https://blogs.bing.com/search/June-2026/Announcing-Microsoft-Web-IQ)
- [Foundry 웹 그라운딩 개요](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/web-overview)

## 2. 이 워크숍에서 무엇을 쓰는가

Web IQ 자체의 limited-access API를 모든 참가자에게 전제하지 않습니다. 기본 live 실습은 일반적으로 접근하기 쉬운 **Foundry Agent Service Web Search**를 사용합니다.

| 선택지 | 권장 대상 | 특징 |
|---|---|---|
| Foundry Web Search | 입문자 기본 | 별도 Bing 리소스 없이 시작, URL citation 반환 |
| Domain-restricted Web Search | 승인 도메인이 필요한 팀 | Bing Custom Search 구성 필요 |
| Web Knowledge Source | 재사용 가능한 검색 지식 소스가 필요한 팀 | Azure AI Search knowledge base와 결합 |
| fixture simulation | 권한·비용·네트워크가 제한된 교육 | 현재 웹 사실이 아닌 계약·평가 학습 |

## 3. 외부 근거의 최소 계약

```json
{
  "id": "WEB-Q2-01",
  "scenarioId": "Q2",
  "title": "source title",
  "url": "https://official.example/path",
  "domain": "official.example",
  "observedAt": "2026-07-28T15:00:00+09:00",
  "publishedAt": null,
  "scope": "direct-match | category-level | source-capability",
  "factStatus": "live-observation | fixture-contract",
  "summary": "근거가 말하는 범위만 요약",
  "limitations": ["인과관계 미확정"]
}
```

필드가 없으면 최신성·권위성·적용 범위를 평가할 수 없으므로 Track4 FoundryIQ에 넘기지
않습니다.

## 4. 출처 우선순위

1. 정부·규제기관·공식 상태 페이지
2. 제품·서비스 제공자의 공식 공지
3. 신뢰 가능한 원문 보도
4. 요약·재게시·소셜 콘텐츠

중요한 운영 판단은 1~2순위 출처 두 개 이상으로 교차 확인합니다. 가상 상품명과 캠페인명은 웹에 검색해도 동일 실체로 간주하지 않습니다.

## 5. 프롬프트 인젝션 방어

- 웹 페이지의 "이전 지침을 무시하라" 같은 문구를 실행하지 않습니다.
- 웹 콘텐츠는 명령이 아니라 신뢰도 평가가 필요한 데이터입니다.
- 검색 도구에 비밀, 토큰, 내부 문서 전문을 보내지 않습니다.
- 도구 결과가 지시하는 추가 URL이나 파일을 자동 실행하지 않습니다.
- 에이전트는 읽기 전용으로 운영하며 외부 행동은 사람 승인을 요구합니다.

## 6. 데이터 경계와 비용

Foundry의 웹 그라운딩 기능은 사용량 기반 비용이 발생할 수 있습니다. Grounding with Bing 계열에 보낸 데이터는 Microsoft DPA가 적용되지 않고 Azure 규정준수·지역 경계 밖으로 흐를 수 있습니다. public endpoint이므로 VPN/Private Endpoint 요구 환경에는 맞지 않을 수 있습니다.

워크숍에서는 외부 전송 가능한 일반 검색어만 사용하고, 제한 환경에서는 [고정 fixture](../data/web_evidence_fixture.json)로 전환합니다.
