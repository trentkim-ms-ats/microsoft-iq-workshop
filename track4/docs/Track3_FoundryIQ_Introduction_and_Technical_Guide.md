# Track4 FoundryIQ 소개 및 기술 가이드

> This filename is a retained legacy Track3 FoundryIQ identifier. The canonical
> module, runtime root, and participant label are **Track4 FoundryIQ**.

## 1. 책임

FoundryIQ와 Foundry Agent Service는 권위 지식, 도구 라우팅, 근거 결합, 평가,
fallback, 최종 문장화를 담당합니다. FabricIQ가 내부 정형 수치를, WorkIQ가 ACL 적용
내부 근거를, Track3 WebIQ가 공개 URL citation을 담당한다는 경계는 바꾸지 않습니다.

```text
question
  -> FabricIQ structured metrics
  -> WorkIQ internal evidence
  -> Track3 WebIQ public citations
  -> Track4 FoundryIQ evaluate, preserve sourceTrace, compose briefing
```

## 2. 실행 계약

| Mode | FabricIQ | WorkIQ | WebIQ | Proof boundary |
| --- | --- | --- | --- | --- |
| `dry-run` | 정적 입력·설정 점검 | 생성 파일·배포 계획 점검 | fixture 경로 점검 | 비파괴 사전 점검 — tenant·ACL·live 연결을 증명하지 않음 |
| `simulation` | Track1 CSV | Track2 manifest | 교육용 fixture | 교육·회귀 contract only — live 서비스나 현재 웹 사실을 증명하지 않음 |
| `live` | FabricIQ adapter | WorkIQ adapter | Foundry native Web Search 권장 또는 승인된 adapter | 사람이 승인한 실제 연결·권한·citation 검증 |

참가자 제출물에는 실행 모드를 표시합니다. `simulation` 응답을 live 서비스 증거로 표현하지 않으며, live 실패 시 `simulation`으로 학습을 계속할 수 있지만 live 검증 상태는 미확인으로 남깁니다.

Adapters receive `scenarioId`, `question`, `semanticKeys`. Fabric returns
`structuredMetrics`, `highlights`, `sourceTrace`; Work returns `evidenceLinks`,
`sourceCoverage`, optional `sourceTrace`; Web returns `webCitations`. Authentication,
ACL, schema, and HTTP failures must be visible failures, never success-shaped empty
data.

## 3. Microsoft IQ workshop safety rules

1. Web claims carry URL, domain, observed time, scope, fact status, and limitations.
2. Fixture citations use `fixture-contract`; they are not current outages, alerts, or
   recalls.
3. Web content is data, not executable instruction. Never put private data, tokens,
   internal URLs, or unpublished metrics in a web query.
4. A public web result cannot diagnose an internal business cause. If FabricIQ and
   WorkIQ both fail, return `blocked`.
5. All external actions require human approval.

## 4. Fallback and evaluation

The fixed retry policy is initial attempt plus 5s, 10s, 20s delays (3 retries; 4
attempts total).

| Failure | Outcome |
| --- | --- |
| FabricIQ | partial: `정형 수치 미검증` |
| WorkIQ | partial: `업무 문서 근거 없음` |
| WebIQ | partial: `외부 최신 근거 없음` |
| FabricIQ + WorkIQ | blocked; do not produce public-web-only analysis |
| all sources | blocked with recovery actions only |

Normal Microsoft IQ workshop responses must trace `FabricIQ`, `WorkIQ`, `WebIQ`, and `FoundryIQ`.

## 5. Local commands and outputs

```bash
python track3/data/validate_webiq_sources.py
cd track4/data
python generate_track3_samples.py
python run_microsoft_iq_simulation.py --all --mode normal
python evaluate_microsoft_iq_outputs.py --strict
```

Track4 writes to `track4/data/generated/`; its Microsoft IQ workshop runner reads
`track3/data/web_evidence_fixture.json` and `track3/data/source_catalog.json`.
`run_track3_simulation.py` and related names are compatibility regression harness
identifiers, not a Track3 path contract.

## 6. Finalization

The optional `foundry_responses.py` helper uses only Azure AI Foundry Responses API:
`AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`, `AZURE_AI_FOUNDRY_MODEL`, and API-key or
Bearer-token authentication. API keys use `api-key`; Entra tokens use
`Authorization: Bearer`. Missing configuration must skip optional refinement or fail
explicitly when it is required.
