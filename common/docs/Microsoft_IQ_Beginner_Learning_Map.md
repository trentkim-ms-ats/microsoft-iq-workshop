# Microsoft IQ 워크숍 입문자 학습 지도

## 1. 오늘 만드는 것

```text
내부 수치          내부 업무 맥락        외부 최신 상황
FabricIQ          WorkIQ              WebIQ
    \                |                  /
     \               |                 /
      +---------- FoundryIQ -----------+
                   |
             근거 있는 브리핑
```

최종 답변은 다음 네 칸으로 읽습니다.

1. **내부 수치** — FabricIQ
2. **내부에서 확인된 이유·논의** — WorkIQ
3. **외부에서 확인된 최신 상황** — WebIQ
4. **권위 지식·결론·조치·경고** — FoundryIQ + Foundry Agent Service

Foundry IQ는 조직의 권위 지식 계층(authoritative knowledge layer)이고, Foundry Agent Service가 실제 도구 라우팅과 실행을 담당합니다.

## 2. 처음 읽는 순서

| 순서 | 문서 | 읽고 답할 질문 |
|---:|---|---|
| 1 | [Microsoft IQ Playground](../../playground/README.md) | Microsoft IQ가 어떤 근거 흐름으로 연결되는가? |
| 2 | [저장소 README](../../README.md) | 전체 결과가 무엇인가? |
| 3 | [Microsoft IQ 워크숍 통합 계획](Microsoft_IQ_Workshop_Integrated_Plan.md) | Microsoft IQ 구성요소의 책임은 어떻게 다른가? |
| 4 | [Track1 FabricIQ Quick Start](../../track1/QUICKSTART.md) | 내부 수치는 어디서 오는가? |
| 5 | [Track2 WorkIQ Quick Start](../../track2/QUICKSTART.md) | 내부 문서는 어떻게 연결되는가? |
| 6 | [Track3 WebIQ Quick Start](../../track3/QUICKSTART.md) | 공개 웹을 어떻게 안전하게 쓰는가? |
| 7 | [Track4 FoundryIQ Quick Start](../../track4/QUICKSTART.md) | 세 근거를 어떻게 결합하는가? |

처음에는 Appendix와 자동 배포 문서를 읽지 않아도 됩니다. 각 Quick Start에서 트러블슈팅이 필요할 때만 세부 문서로 이동합니다.

## 3. 질문을 네 조각으로 나누는 예

질문: `배송 지연은 반품률과 고객 불만에 어떤 영향을 미치는가?`

| 단계 | 담당 부분 | 확인 내용 | 잘못된 접근 |
|---|---|---|---|
| FabricIQ | 정형 지표 계산·검증 | 지연 주문 수, 반품률, 불만 티켓율 | 이메일 본문에서 비율 계산 |
| WorkIQ | 내부 업무 근거 확인 | 물류팀 회의, CS 대응, 내부 결정 | 웹 기사로 담당자를 추정 |
| WebIQ | 외부 사실 citation 수집 | 같은 기간·지역의 공식 기상·교통 경보 | 지역이 없는데 외부 사건을 원인으로 단정 |
| FoundryIQ | 근거 결합·평가·조치 제안 | 세 근거의 일치·불일치, 다음 조치 | 없는 숫자·링크 생성 |

## 4. simulation과 live

| 질문 | simulation | live |
|---|---|---|
| 실제 서비스에 연결되는가? | 아니요 | 예 |
| 키·토큰이 필요한가? | 아니요 | 환경에 따라 필요 |
| 현재 웹 사실인가? | 아니요, fixture | 실행 시점 검색 결과 |
| 무엇을 배우는가? | 계약·역할·fallback | 실제 연결·권한·비용·인용 |

입문자는 simulation PASS 후 live로 이동합니다.

## 5. 트러블슈팅

| 증상 | 먼저 볼 곳 |
|---|---|
| 수치가 이상함 | Track1 데이터·Ontology·FabricIQ |
| M365 문서가 안 보임 | Track2 인덱스 범위·ACL·WorkIQ |
| 웹 citation이 없음 | Web Search 도구 설정·강제 사용·출처 지침 |
| 외부 결과가 질문과 안 맞음 | 시간·지역·도메인이 포함된 검색어 |
| 답변이 근거를 섞음 | FoundryIQ 프롬프트와 `sourceTrace` |
| public web만 남음 | 답변을 차단하고 내부 도구를 복구 |

## 6. 완료 후 설명할 수 있어야 하는 문장

> 이 브리핑의 수치는 FabricIQ, 내부 업무 근거는 WorkIQ, 최신 외부 근거는 WebIQ에서 왔고, FoundryIQ가 이 셋을 결합·평가했습니다. simulation의 웹 fixture는 현재 사실이 아니며, live에서는 URL citation과 확인 시각을 다시 검증합니다.
