# Microsoft IQ Playground

Track1 FabricIQ, Track2 WorkIQ, Track3 WebIQ, Track4 FoundryIQ의 역할과 근거
흐름을 한 화면에서 탐색하는 정적 React 애플리케이션입니다.

Ontology Playground의 학습 미션·관계 그래프·검색·인스펙터 패턴을 참고하되,
Microsoft IQ 워크숍의 canonical 계약에 맞게 다음 기능을 제공합니다.

- Track1 → Track2 → Track3 → Track4 근거 흐름 그래프
- Q1~Q3 정형 지표, M365 근거, WebIQ citation 탐색
- `normal`, `fabric-down`, `work-down`, `web-down`, `internal-down`,
  `all-down` fallback 실험
- `sourceTrace`, 해석 경계, 재시도 정책 확인
- 학습 미션, 진행 점수, 검색, path finder, 공유 가능한 URL 상태
- 라이트/다크 Clawpilot 테마와 반응형 레이아웃

## 로컬 실행

저장소 루트에서 실행합니다.

```bash
corepack enable
pnpm --dir playground install --frozen-lockfile
pnpm --dir playground dev
```

Vite가 안내하는 `/microsoft-iq-workshop/` 경로를 브라우저에서 엽니다.

## 검증

```bash
pnpm --dir playground check
```

`predev`와 `prebuild`가
[`scripts/generate-data.mjs`](scripts/generate-data.mjs)를 실행해 다음 실제 저장소
산출물을 [`src/data/generated.ts`](src/data/generated.ts)로 동기화합니다.

| Playground 데이터 | 권위 원본 |
| --- | --- |
| Ontology 엔터티·관계 | `track1/data/generated/workbench/mission4_*.json` |
| M365 항목·출처 범위 | `track2/data/generated/manifests/content_catalog.json` |
| 공개 확인 질문·citation | `track3/data/source_catalog.json`, `web_evidence_fixture.json` |
| Q1~Q3 지표·내부 근거 | `track4/data/generated/tool_a_metrics.json`, `tool_b_evidence.json` |

## 실행 경계

- Playground는 **simulation 학습 도구**이며 외부 endpoint나 테넌트를 호출하지
  않습니다.
- WebIQ fixture는 현재 장애·경보·리콜을 증명하지 않습니다.
- 브라우저의 자연어 입력은 Q1~Q3 로컬 탐색만 수행하며 AI 또는 live 검색을
  호출하지 않습니다.
- live 검증은 각 트랙 `PREREQUISITES.md`의 승인·권한·privacy 계약을 따릅니다.

## 배포

[`playground-pages.yml`](../.github/workflows/playground-pages.yml)이 `main`의 관련
데이터 또는 Playground 변경을 감지해 GitHub Pages artifact를 빌드·배포합니다.
