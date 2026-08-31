# Microsoft IQ Industry Playground

Microsoft IQ의 canonical 근거 흐름과 여섯 산업별 대표 활용 시나리오를 한 화면에서
탐색하는 정적 React(Vite) 애플리케이션입니다. 브라우저에서만 동작하는
**simulation 학습 도구**이며, live endpoint나 테넌트를 호출하지 않습니다.

## 목적과 canonical 흐름

이 Playground는 다음 canonical 순서를 하나의 그래프·인스펙터로 재현합니다.

```
Track1 FabricIQ → Track2 WorkIQ → Track3 WebIQ → Track4 FoundryIQ
```

| 순서 | IQ | 책임 |
| --- | --- | --- |
| Track1 | FabricIQ | 정형 지표 계산, Ontology 관계 경로 검증 |
| Track2 | WorkIQ | ACL을 적용한 M365 근거 검색 |
| Track3 | WebIQ | 공개 웹의 최신 외부 근거와 URL citation |
| Track4 | FoundryIQ | 세 근거의 라우팅·결합·평가·fallback·최종 문장화 |

산업별 요약 카탈로그는 상위 폴더의
[`Microsoft_IQ_Industry_Scenarios.md`](../Microsoft_IQ_Industry_Scenarios.md)에서,
상세 시나리오 원문은 [`scenarios/`](../scenarios/)에서 확인할 수 있습니다.
Playground는 이 원문 Markdown을 빌드 시점에 파싱해 렌더링하며, 별도 사실을
추가하지 않습니다.

## 현재 기능

### 근거 흐름 그래프 (`FlowGraph`)

- 데이터 소스(Lakehouse, Microsoft 365, Public web, Authority) → 4개 IQ →
  `Grounded briefing` 최종 산출물을 SVG 그래프로 표시합니다.
- 선택한 IQ의 데이터 소스 → IQ → FoundryIQ → 브리핑 경로를 자동 강조합니다.
- 노드를 클릭하면 `IQ 역할` 탭이 해당 IQ로 전환됩니다.
- 확대/축소 75%~135% 버튼과 배율 초기화 버튼을 제공합니다.
- 선택한 fallback 모드에서 실패한 IQ 노드는 `사용 불가` 표시와 함께 흐리게
  처리됩니다.
- 720px 이하에서는 작은 SVG 대신 같은 흐름을 네 단계 카드로 바꿔 표시하고,
  IQ 카드를 선택하면 상세 학습 영역으로 자동 이동합니다.

### 3개 학습 탭 (IQ 역할 / 근거 보기 / 장애 대응)

우측 `IQ 상세 학습` 패널은 3개 탭으로 전환됩니다(`explorerTab` 상태,
`ExplorerTab` 타입: `inspector` | `scenario` | `fallback`).

- **IQ 역할**: 선택한 IQ(FabricIQ/WorkIQ/WebIQ/FoundryIQ)의 트랙, 주 소스,
  한 문장 책임, 입력, 출력 계약(`structuredMetrics`/`evidenceLinks`/
  `webCitations` 등), 금지 경계, Quick Start 문서 링크를 보여줍니다.
- **근거 보기**: 선택한 Q1~Q3 질문의 FabricIQ 정형 신호와 세부 비교표,
  WorkIQ 내부 근거
  목록, WebIQ citation 목록, 해석 경계를 보여주며, 활성 fallback 모드에 따라
  해당 근거 영역을 `사용 불가` 메시지로 대체합니다. 산업 시나리오에서는
  관점별 질문 3개를 선택해 FabricIQ·WorkIQ·WebIQ·FoundryIQ 결과를 함께
  비교하고, 확인 질문·IQ 상세 처리·ASCII 흐름·사람 승인 경계를 펼쳐 볼 수
  있습니다.
- **장애 대응**: 6개 fallback 모드 선택기, PASS/PARTIAL/BLOCKED와 한글 설명,
  IQ별 소스 상태, 재시도 정책 타임라인을 보여줍니다. 부분 응답에서는 실패한
  근거에 의존한 정상 결론을 재사용하지 않고, 차단 상태에서는 답변과 제안 조치를
  표시하지 않습니다.

### Q1~Q3 시나리오

`track4/data/generated/scenarios.json` 기반 3개 질문을 다룹니다.

| ID | 질문 | 목표 |
| --- | --- | --- |
| Q1 | 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가? | 캠페인별 전환율과 결제 실패 패턴 비교 |
| Q2 | 배송 지연은 반품률과 고객 불만 티켓에 어떤 영향을 미치는가? | 배송 지연군의 반품/불만율 확인 |
| Q3 | 핵심 상품 3종(AeroPhone X/SmartWatch Pro/UltraBook 15)의 매출/반품 신호를 어떻게 해석할 것인가? | 세 상품의 성과 비교 |

각 질문은 검색 대상 키워드(예: `SummerPush`, `LateDelivery`,
`AeroPhone X`)와 semantic key(예: `CampaignId`, `OrderId`, `PaymentStatus`)를
가지고 있으며, `src/data/generated.ts`의 `scenarios` 배열에서 확인할 수
있습니다.

### 6개 fallback 모드와 PASS/PARTIAL/BLOCKED 동작

Fallback 탭과 그래프 fallback 강조는 `src/data/model.ts`의
`fallbackDefinitions`를 사용합니다.

| 모드 | 상태 | 사용 불가 IQ | 시도 횟수 | 동작 |
| --- | --- | --- | --- | --- |
| `normal` | PASS | 없음 | 1 | 세 근거를 결합하고 IQ별 sourceTrace를 반환 |
| `fabric-down` | PARTIAL | FabricIQ | 4 | 정형 지표 없이 WorkIQ·WebIQ 근거만 제한 제공 |
| `work-down` | PARTIAL | WorkIQ | 4 | 정형 지표·외부 citation은 유지, 내부 논의 근거는 제외 |
| `web-down` | PARTIAL | WebIQ | 4 | 두 내부 근거로 부분응답, "외부 최신 근거 없음" 명시 |
| `internal-down` | BLOCKED | FabricIQ, WorkIQ | 4 | 공개 웹만 남아 내부 비즈니스 질문에 답하지 않음 |
| `all-down` | BLOCKED | FabricIQ, WorkIQ, WebIQ | 4 | 사용 가능한 근거가 없어 응답 생성을 차단 |

`시도 횟수`는 첫 시도 포함 총 시도 수이며, Fallback 탭의 재시도 타임라인은
`첫 시도 → +5초 → +10초 → +20초`(최대 3회 재시도, 총 최대 4회 시도) 4칸 중
`attempts`만큼을 강조합니다. `normal` 모드는 재시도 없이 1회 성공을
의미합니다.

### 6개 산업 시나리오

`industry_playground/scenarios/*.md` 6개 파일을 빌드 시점에 파싱합니다
(개수가 6이 아니면 생성이 실패합니다).

| ID | 산업 | 제목 |
| --- | --- | --- |
| FIN-01 | 금융 | AML/KYC 컴플라이언스 검토 우선순위화 |
| HC-01 | 헬스케어 | 집계 운영 안전 리스크 조기 감지 |
| LOG-01 | 물류 | 배송 지연 사전 예측 및 대응 |
| MFG-01 | 제조 | 품질 이상 조기 감지 및 원인 후보 검증 |
| RTL-01 | 리테일 | 수요 변화 조기 감지 및 매장·상품 대응 최적화 |
| TEL-01 | 통신 | 네트워크 장애 예측 및 고객 영향 최소화 |

각 시나리오 문서는 다음 고정 구조를 가지며, `scripts/generate-data.mjs`가 이
구조를 그대로 검증·추출합니다.

1. `목적과 범위` — 1개 단락
2. `예시 질문` — 정확히 3개(`N. **관점:** 질문` 형식)
3. `확인할 질문` — 1개 이상 bullet
4. `IQ별 처리` — `FabricIQ`, `WorkIQ`, `WebIQ`, `FoundryIQ` 4개 하위 섹션,
   각각 `입력/범위`, `처리·검증 단계`, `출력/인계`, `한계/비목표` 4개 bullet
5. `Fallback 및 완료 판단` — 정확히 4행 표(실패 상황 / 결과)
6. `처리 흐름 다이어그램` — ` ```text ` 코드블록 ASCII 다이어그램
7. `승인 경계와 완료 기준` — 사람 승인 경계와 완료 판단 기준 1개 단락

산업 시나리오의 `근거 보기` 탭은 질문 3개의 IQ별 예시 결과와 이 구조의 확인
질문·IQ 상세 처리·ASCII 다이어그램·승인 경계를 렌더링합니다.

### 미션과 진행 저장 (localStorage)

- `src/data/model.ts`의 대표 미션 5개(입문 1·중급 2·고급 2)와 산업별 미션
  6개를 좌측 `학습 미션` 패널에 분리해 표시합니다. 첫 방문에서는 대표 미션의
  권장 학습 순서를 먼저 보여줍니다.
- 미션을 열면 `해볼 일`과 `완료 확인`이 표시되며, 사용자가
  `이해했어요 · 완료 표시`를 선택해야 완료됩니다. 화면을 열기만 해서는
  점수가 올라가지 않습니다. 선택하지 않은 미션에도 `완료 표시`가 흐림 상태로
  보이지만 비활성화되어 있어 먼저 미션을 선택해야 합니다.
- 완료 표시는 브라우저 `localStorage` 키 `microsoft-iq-playground-quests`에
  문자열 배열(JSON)로 저장됩니다. 저장된 값이 배열이 아니거나 파싱에
  실패하면 자동으로 초기화되고 콘솔 경고만 출력합니다.
- 완료한 미션의 포인트 합계와 배지 수가 헤더에 표시됩니다.

### 빠른 찾기 / 시작 가이드 / 공유 / 테마 / 반응형

- **시나리오 빠른 찾기**: "결제", "배송", "상품", `q1`~`q3` 또는
  제조·물류·금융·헬스케어·통신·리테일과 산업 시나리오 ID를 입력하면 관련
  학습 화면으로 이동합니다. AI 호출이나 live 검색이 아닌 로컬 키워드
  매칭입니다.
- **처음 시작**: 헤더 버튼은 학습 미션 → 근거 흐름 → IQ 상세 학습을 차례로
  강조하는 3단계 layered 패널 안내를 엽니다. 안내에서 `새로 로드할 때 자동
  표시`를 선택하거나 `다시 표시하지 않기`로 이후 자동 실행을 끌 수 있습니다.
  작업 영역의 `용어와 시작 방법 보기`는 4단계 권장 흐름과 기준선, ACL,
  citation, fixture, 권위 SOP, sourceTrace, fallback 용어를 설명합니다.
- **공유**: `공유` 버튼은 현재 URL(아래 쿼리 파라미터 포함)을
  `navigator.clipboard`로 복사합니다. 클립보드 권한이 없으면 실패 토스트를
  보여줍니다.
- **테마**: 라이트/다크 토글은 `<html data-theme>` 속성과 `scoutTheme` URL
  파라미터를 갱신합니다. 페이지 최초 로드시 `index.html`의 인라인 스크립트가
  `scoutTheme` 값 또는 `prefers-color-scheme`을 읽어 React 렌더 이전에 테마를
  적용해 깜빡임을 줄입니다.
- **반응형**: 1260px, 1120px, 720px 3단계 breakpoint로 3열(미션·워크스페이스·
  상세 학습) 레이아웃이 2열 → 1열로 재배치됩니다. 1120px 이하에서는
  `학습 미션 / 근거 흐름 / 상세 학습` 빠른 이동 메뉴를 제공하고, 720px
  이하에서는 단계형 모바일 흐름을 사용합니다. `prefers-reduced-motion`
  사용자에게는 애니메이션을 축소합니다.
- **Neutral-dominant Clawpilot 테마**: 배경·표면·테두리는 베이지/그레이 계열
  중립색(`--cp-bg`, `--cp-surface`, `--cp-border` 등)이 지배적이며, rose 계열
  강조색(`--cp-accent`, 라이트 `#b11f4b` / 다크 `#fd8ea1`)은 선택된 노드,
  활성 탭, 포커스 링, 활성 경로 등 **활성 상태 마커에만** 제한적으로
  사용됩니다.

## 화면 구성

```
┌───────────────────────────── Header ──────────────────────────────┐
│ 로고/브랜드   점수/완료 요약   공유 · 처음 시작 · 저장소 · 테마 토글 │
├───────────────┬─────────────────────────────┬─────────────────────┤
│  학습 미션      │        근거 흐름              │   IQ 상세 학습        │
│  대표 5개       │  - 시나리오 선택               │  - IQ 역할           │
│  산업 6개       │  - FlowGraph / 모바일 단계형    │  - 근거 보기          │
│  해볼 일·완료 확인│  - 출처 추적과 fallback 상태    │  - 장애 대응          │
│  명시적 완료 표시 │  - 선택 경로 자동 강조          │  - 시나리오 빠른 찾기   │
└───────────────┴─────────────────────────────┴─────────────────────┘
```

`처음 시작` 버튼은 포커스 트랩이 적용된 layered 안내(`PanelGuide`)를 열고,
현재 설명 중인 패널만 spotlight로 강조합니다. 자동 표시 설정은 브라우저
`localStorage` 키 `microsoft-iq-playground-panel-guide-auto`에 저장됩니다.
별도의 `SummaryDialog`는 권장 4단계, 초보자 핵심 용어, Ontology 엔터티 수,
M365 근거 수, Web citation 수, strict gate 수, 미션 진행률, fixture 고지문을
보여줍니다. 완료/실패 알림은 화면 하단 토스트로 표시됩니다.

## 사전 준비

- Node.js 20 이상 (GitHub Actions 워크플로 기준)
- Corepack으로 활성화하는 pnpm (저장소가 `package.json`의
  `packageManager: "pnpm@10.32.1"`로 버전을 고정합니다)
- 저장소 루트 clone (Playground는 빌드 시점에 `track1`~`track4`의 생성된
  JSON을 상위 경로에서 읽습니다)

## 로컬 실행

저장소 루트에서 실행합니다.

```bash
corepack enable
pnpm --dir industry_playground/playground install --frozen-lockfile
pnpm --dir industry_playground/playground dev
```

Vite dev 서버는 `http://localhost:5173/microsoft-iq-workshop/industry_playground/playground/`
경로로 안내합니다. 이는 `vite.config.ts`의 `base:
"/microsoft-iq-workshop/industry_playground/playground/"` 설정과 동일하며,
GitHub Pages 배포 경로(`https://<owner>.github.io/microsoft-iq-workshop/industry_playground/playground/`)와
일치시키기 위한 값입니다.

## 명령어

모든 명령은 `industry_playground/playground` 디렉터리 기준입니다
(저장소 루트에서는 `pnpm --dir industry_playground/playground <script>` 형식
사용).

| 명령 | 정의 (`package.json`) | 설명 |
| --- | --- | --- |
| `pnpm generate:data` | `node scripts/generate-data.mjs` | Track1~4 산출물과 산업 시나리오 원문을 파싱해 `src/data/generated.ts`를 재생성합니다. |
| `pnpm dev` | `vite` (predev로 `generate:data` 자동 실행) | 로컬 개발 서버를 시작합니다. |
| `pnpm lint` | `oxlint` | `.oxlintrc.json` 설정으로 정적 분석을 수행합니다. |
| `pnpm build` | `tsc -b && vite build` (prebuild로 `generate:data` 자동 실행) | 타입 검사 후 `dist/`에 정적 산출물을 빌드합니다. |
| `pnpm preview` | `vite preview` | 빌드된 `dist/`를 로컬에서 미리 봅니다. |
| `pnpm check` | `pnpm lint && pnpm build` | lint와 build를 순서대로 실행하는 통합 검증 명령입니다. |

## 데이터 원본과 생성 파이프라인

`predev`/`prebuild`가 [`scripts/generate-data.mjs`](scripts/generate-data.mjs)를
실행해 다음 저장소 산출물을 [`src/data/generated.ts`](src/data/generated.ts)로
동기화합니다.

| Playground 데이터 | 권위 원본 |
| --- | --- |
| Ontology 엔터티·관계 | [`track1/data/generated/workbench/mission4_entities.json`](../../track1/data/generated/workbench/mission4_entities.json), [`mission4_relationships_core.json`](../../track1/data/generated/workbench/mission4_relationships_core.json), [`mission4_relationships_extension.json`](../../track1/data/generated/workbench/mission4_relationships_extension.json) |
| M365 항목·출처 범위 | [`track2/data/generated/manifests/content_catalog.json`](../../track2/data/generated/manifests/content_catalog.json) |
| 공개 확인 질문·citation | [`track3/data/source_catalog.json`](../../track3/data/source_catalog.json), [`web_evidence_fixture.json`](../../track3/data/web_evidence_fixture.json) |
| Q1~Q3 시나리오 정의 | [`track4/data/generated/scenarios.json`](../../track4/data/generated/scenarios.json) |
| Q1~Q3 정형 지표 | [`track4/data/generated/tool_a_metrics.json`](../../track4/data/generated/tool_a_metrics.json) |
| Q1~Q3 내부 근거 | [`track4/data/generated/tool_b_evidence.json`](../../track4/data/generated/tool_b_evidence.json) |
| 산업 시나리오 상세 | [`industry_playground/scenarios/*.md`](../scenarios/)(6개 산업별 상세 문서, 요약 카탈로그가 아님) |

> **경고**: [`src/data/generated.ts`](src/data/generated.ts)는
> `scripts/generate-data.mjs`가 매 `predev`/`prebuild`마다 덮어씁니다. 파일
> 상단에 `// Generated by scripts/generate-data.mjs. Do not edit manually.`
> 주석이 있으며, 직접 수정한 내용은 다음 실행에서 사라집니다. 데이터를
> 바꾸려면 위 표의 권위 원본이나 `industry_playground/scenarios/*.md`
> 원문을 수정하십시오.

### 생성 스크립트 fail-fast 조건

`generate-data.mjs`는 다음 조건을 만족하지 않으면 예외를 던지고 생성을
중단합니다(자세한 내용은 스크립트 본문 참조).

- `industry_playground/scenarios/*.md` 파일 수가 정확히 6개가 아니면 실패
- 시나리오 ID 중복 시 실패
- 각 산업 시나리오 문서에 위 "6개 산업 시나리오" 절에서 설명한 7개 섹션과
  하위 항목(예시 질문 3개, IQ별 처리 4개 하위 섹션 × 4개 bullet, fallback
  표 4행, ASCII 다이어그램 코드블록)이 모두 없으면 실패
- 파일명의 ID 접두어(`FIN-01` 등)와 문서 제목의 ID가 다르면 실패
- Q1~Q3 각각에 대해 `source_catalog.json`, `web_evidence_fixture.json`,
  `tool_a_metrics.json`, `tool_b_evidence.json`에 대응 항목이 없으면
  "Incomplete generated data" 오류로 실패
- Q1 캠페인 비교가 0건이거나, Q2 지연 주문이 0건이거나, Q3 핵심 상품 비교가
  정확히 3건이 아니면 불완전한 정형 지표로 판단해 실패
- 산업별 질문 3개의 IQ 처리 fixture가 누락되거나 질문 수와 일치하지 않으면
  성공 모양의 임시 데이터로 대체하지 않고 실패
- 산업 WebIQ 예시는 제목에 `[교육용 fixture]`, 상태에 `fixture-contract`,
  현재 실제 사건을 증명하지 않는 한계 설명을 일관되게 표시
- 산업 FoundryIQ 결과는 `교육용 검토 가설`과 `사람 승인이 필요한 검토안`으로
  표시하며, 실제 인과관계·규제·임상·운영 결정을 확정하지 않음

## URL 파라미터

Playground 상태는 URL 쿼리 파라미터와 양방향으로 동기화됩니다
(`window.history.replaceState`로 갱신, 페이지 새로고침 시 복원).

| 파라미터 | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `iq` | `fabric` \| `work` \| `web` \| `foundry` | `fabric` | `IQ 역할` 탭에서 선택된 IQ |
| `scenario` | `Q1` \| `Q2` \| `Q3` | `Q1` | 대표 시나리오에서 선택된 질문 |
| `mode` | `normal` \| `fabric-down` \| `work-down` \| `web-down` \| `internal-down` \| `all-down` | `normal` | `장애 대응` 탭/그래프에 적용되는 fallback 모드 |
| `industry` | `FIN-01` \| `HC-01` \| `LOG-01` \| `MFG-01` \| `RTL-01` \| `TEL-01` | 없음 | 값이 있을 때 활성화되는 산업 시나리오 |
| `tab` | `inspector` \| `scenario` \| `fallback` | `inspector` | 활성 학습 탭 |
| `scoutTheme` | `light` \| `dark` | 시스템 `prefers-color-scheme` | 라이트/다크 테마(초기 로드 시 화면 깜빡임 방지용 인라인 스크립트에서도 읽음) |

유효하지 않거나 없는 값은 모두 위 기본값으로 대체되며 오류를 발생시키지
않습니다.

전체 예시:

```
https://<owner>.github.io/microsoft-iq-workshop/industry_playground/playground/?iq=foundry&scenario=Q2&mode=web-down&industry=LOG-01&tab=fallback&scoutTheme=dark
```

## 데이터/상태 동작

- 모든 콘텐츠는 빌드 시점에 생성된 정적 `generated.ts`에서 나오며, 런타임에
  외부 API를 호출하지 않는 **simulation** 데이터입니다.
- fallback 모드 전환은 클라이언트 상태(`mode`)만 바꿀 뿐, 실제 근거 재계산이
  나 재시도를 실행하지 않습니다. 화면에 표시되는 재시도 타임라인은 정책을
  설명하기 위한 시각 자료입니다.
- 유지되는 브라우저 상태는 URL 쿼리 파라미터(탐색 상태), `localStorage`의 완료
  미션 목록, layered 패널 안내 자동 표시 설정입니다. 모두 브라우저별로 저장되며
  서버로 전송되지 않습니다.

## Fallback 정책

- 재시도 간격: **5초 → 10초 → 20초, 최대 3회 재시도(총 최대 4회 시도)**.
  `normal` 모드는 1회 시도로 PASS하며, 다른 5개 모드는 4회 시도 모두
  소진된 이후의 최종 상태를 보여줍니다.
- `fabric-down`/`work-down`/`web-down`은 나머지 두 근거로 PARTIAL 응답을
  구성합니다.
- `internal-down`(FabricIQ + WorkIQ 동시 실패)과 `all-down`(세 근거 모두
  실패)은 BLOCKED이며, 공개 웹 근거만으로 내부 비즈니스 질문에 답하지
  않습니다. 이때 정상 상태의 답변과 제안 조치도 화면에서 숨깁니다.
- PARTIAL 상태에서도 사용할 수 없는 근거에 의존한 정상 상태 결론을 재사용하지
  않고, 남은 근거 범위와 제외해야 할 주장만 안내합니다.
- 이 정책은 `industry_playground/scenarios/*.md`의 산업별 "Fallback 및 완료
  판단" 표와 동일한 원칙(단일 실패 → partial, 내부 두 근거 동시 실패 →
  blocked)을 따릅니다.

## 검증

```bash
pnpm --dir industry_playground/playground check
```

`check`는 `lint`(oxlint) → `build`(`tsc -b && vite build`, 빌드 전
`generate:data` 자동 실행) 순서로 실행됩니다. 정상 실행 시 다음과 유사한
출력을 볼 수 있습니다.

```
[Microsoft IQ Playground] Generated 14 entities, 23 relationships, 60 M365 items, 6 citations, and 6 industry scenarios.
vite vX.X.X building client environment for production...
✓ NNNN modules transformed.
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
✓ built in Nms
```

수치(엔터티/관계/M365 항목/citation/산업 시나리오 개수)는 위 데이터 원본이
바뀌면 함께 변합니다.

## 배포 (GitHub Pages)

[`playground-pages.yml`](../../.github/workflows/playground-pages.yml)이 다음
조건에서 실행됩니다.

- `workflow_dispatch` (수동 실행)
- `main` 브랜치로의 push 중 다음 경로 변경 시:
  - `industry_playground/**`
  - `track1/data/generated/workbench/mission4_*.json`
  - `track2/data/generated/manifests/content_catalog.json`
  - `track3/data/source_catalog.json`
  - `track3/data/web_evidence_fixture.json`
  - `track4/data/generated/scenarios.json`
  - `track4/data/generated/tool_a_metrics.json`
  - `track4/data/generated/tool_b_evidence.json`
  - `.github/workflows/playground-pages.yml`

`build` job은 Node 20 + Corepack + `pnpm install --frozen-lockfile` +
`pnpm build`로 `industry_playground/playground/dist`를 만든 뒤,
`pages-artifact/industry_playground/playground/` 하위에 배치해 Vite의 중첩
`base` 경로와 일치시킵니다. 이후 `deploy` job이 GitHub Pages에 배포합니다.

## 실행 경계와 보안

- Playground는 **simulation 학습 도구**이며, 브라우저에서 외부 endpoint나
  M365/Foundry 테넌트를 호출하지 않습니다.
- WebIQ fixture는 현재의 실제 장애·경보·리콜을 증명하지 않으며, `처음 시작`
  모달의 fixture 고지문과 각 산업 citation의 `[교육용 fixture]`,
  `fixture-contract`, 한계 설명에서도 이를 명시합니다.
- 브라우저의 "자연어로 시나리오 열기" 입력은 로컬 키워드 매칭으로 Q1~Q3를
  여는 것뿐이며, AI 또는 live 검색을 호출하지 않습니다.
- fallback 탭의 재시도/차단 표시는 정책 시각화이며, 실제 adapter 호출을
  수행하지 않습니다.
- live 검증(실제 FabricIQ/WorkIQ/WebIQ adapter, Foundry Responses API 등)은
  이 Playground 밖에서 각 트랙 `PREREQUISITES.md`([`track1`](../../track1/PREREQUISITES.md),
  [`track2`](../../track2/PREREQUISITES.md), [`track3`](../../track3/PREREQUISITES.md),
  [`track4`](../../track4/PREREQUISITES.md))의 승인·권한·privacy 계약을
  따릅니다. 이 README나 Playground UI의 어떤 화면도 live 서비스 호출의
  증거로 취급하지 않습니다.

## 문제 해결

**`pnpm generate:data`가 "expected 6 scenario files" 또는 특정 섹션 누락
오류로 실패한다**
- `industry_playground/scenarios/`에 정확히 6개의 `.md` 파일이 있는지, 각
  파일이 "6개 산업 시나리오" 절의 7개 섹션(목적과 범위 / 예시 질문 3개 /
  확인할 질문 / IQ별 처리 4개 하위 섹션 / Fallback 표 4행 / ASCII 다이어그램
  / 승인 경계와 완료 기준)을 모두 포함하는지 확인하십시오.
- 오류 메시지에 포함된 파일명과 섹션 이름을 그대로 사용해 어떤 문서의 어떤
  섹션이 문제인지 특정할 수 있습니다.

**`pnpm generate:data`가 "Incomplete generated data for QN"으로 실패한다**
- `track3/data/source_catalog.json`, `web_evidence_fixture.json`,
  `track4/data/generated/tool_a_metrics.json`, `tool_b_evidence.json`에 해당
  `scenarioId`(Q1/Q2/Q3) 항목이 모두 존재하는지 확인하십시오.

**`pnpm build`가 타입 오류로 실패한다**
- `tsc -b`가 먼저 실행되므로, `src/data/generated.ts`의 타입과 `src/App.tsx`
  등에서 참조하는 필드 이름이 일치하는지 확인하십시오. `generated.ts`는 직접
  고치지 말고 원본 데이터나 파서(`scripts/generate-data.mjs`)를 수정한 뒤
  `pnpm generate:data`로 다시 생성하십시오.

**화면에 데이터가 비어 보인다(그래프/시나리오/산업 탭이 빈 상태)**
- `pnpm dev` 또는 `pnpm build`를 실행하지 않고 `vite`/`tsc`만 단독 실행하면
  `predev`/`prebuild` 훅이 건너뛰어져 `src/data/generated.ts`가 오래된 상태로
  남을 수 있습니다. `pnpm generate:data`를 먼저 수동 실행한 뒤 다시
  시도하십시오.
- 브라우저 캐시에 이전 `dist` 자산이 남아 있을 수 있으므로 강력 새로고침을
  시도하십시오.

**테마가 요청과 다르게 표시된다**
- URL의 `scoutTheme` 값(`light`/`dark`)이 잘못되었거나 없으면 시스템의
  `prefers-color-scheme`을 따릅니다. 헤더의 테마 토글 버튼으로도 전환할 수
  있으며, 토글은 URL의 `scoutTheme` 값을 갱신합니다.

**URL 파라미터로 원하는 화면이 열리지 않는다**
- `iq`/`scenario`/`mode`/`industry`/`tab` 값이 위 "URL 파라미터" 표의
  허용값과 정확히 일치하는지(대소문자 포함) 확인하십시오. 값이 유효하지
  않으면 조용히 기본값으로 대체되며 오류는 표시되지 않습니다.
- 공유된 링크가 오래된 산업 시나리오 ID(예: 이름이 바뀐 경우)를 가리키면
  산업 선택을 해제하고 기본 대표 시나리오 Q1 화면으로 이동합니다.
