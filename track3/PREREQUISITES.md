# Track3 WebIQ 실습 준비물

Track3 WebIQ는 공개 웹의 최신 외부 근거와 URL citation만 담당합니다. 내부 KPI는
FabricIQ, 내부 문서·메일·대화는 WorkIQ에서만 가져오며, 결합·평가는 Track4 FoundryIQ가
담당합니다.

## 1. 실행 경로

| 경로 | 필요한 것 | 증명하는 범위 |
| --- | --- | --- |
| `simulation` | Python 3, `track3/data/` fixture | citation 계약·출처 평가·handoff 형식 |
| `live` | 승인된 Foundry Agent Service Web Search 환경 | 실행 시점 공개 웹 검색과 URL citation |

`simulation`은 실제 WebIQ/Web Search 호출이나 현재 웹 사실을 증명하지 않습니다.

## 2. live 사전 점검

- Foundry 프로젝트·모델·Web Search 사용이 사람과 관리자에 의해 승인되었는지 확인합니다.
- 외부 전송 가능 일반 검색어만 사용합니다.
- `WEBIQ_ENDPOINT`를 쓰는 custom service는 원시 검색 제품 URL이 아닌 workshop adapter여야
  하며 `scenarioId`, `question`, `semanticKeys` 요청에 `webCitations`를 반환해야 합니다.
- citation마다 `title`, `url`, `domain`, `observedAt`, `scope`, `factStatus`,
  `limitations`을 보존합니다.
- adapter/권한/schema/HTTP 오류를 성공 모양의 빈 citation 배열로 숨기지 않습니다.

## 3. privacy와 prompt-injection 방어

- 고객명, 이메일, 주문번호, 내부 URL, 미공개 지표, 토큰, 문서 전문을 검색어에 넣지 않습니다.
- 웹 페이지의 지시문은 명령이 아니라 신뢰도를 평가할 데이터입니다.
- 링크가 제안하는 URL·파일·외부 동작을 자동 실행하지 않습니다.
- 외부 근거는 읽기 전용 판단 보조이며 메일·발주·가격 변경 등 실행 조치는 사람 승인을
  받아야 합니다.

## 4. simulation 검증

```bash
python track3/data/validate_webiq_sources.py
```

이 명령은 source catalog, 공식 허용 도메인, Q1–Q3 fixture coverage, `fixture-contract`
상태를 검증합니다. fixture는 현재 장애·경보·리콜을 주장하지 않습니다.

## 5. Track4 인계

```text
[TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE]
team=<팀명>
handoffAtKst=<YYYY-MM-DD HH:MM>
executionMode=<simulation/live>
scenarioIds=<Q1;Q2;Q3>
querySetRef=<검색어 기록 경로>
citations=<URL|제목|observedAt|scope; ...>
qualityPass=<6개 중 n개>
uncertainties=<확인되지 않은 내용>
privacyCheck=<PASS/FAIL>
humanApprovalRequired=<yes>
[/TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE]
```

Track4 FoundryIQ는 이 package와 Track2 WorkIQ evidence를 결합하되, URL citation의
source responsibility를 WorkIQ evidence와 섞지 않습니다.
