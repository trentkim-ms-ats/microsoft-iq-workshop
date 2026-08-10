# Track4 Appendix — WorkIQ integration and M365 search API

> Filename retained as a legacy Track3 FoundryIQ identifier. This is active Track4
> FoundryIQ guidance.

## WorkIQ responsibility

WorkIQ returns ACL-trimmed M365 evidence. FoundryIQ preserves links and
`sourceCoverage`; it must not turn a missing permission, Graph error, or empty search
into a successful evidence response.

Microsoft Graph Search commonly uses `POST /search/query` with selected entity types,
query string, paging, and requested fields. Actual tenant access, permission consent,
and result links require a human-approved live validation and are outside local
simulation.

## Workshop adapter contract

The `WORKIQ_ENDPOINT` used by Track4 live orchestration is a workshop POST JSON
adapter, not a raw Graph or product URL:

```json
{
  "scenarioId": "Q1",
  "question": "결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?",
  "semanticKeys": ["CampaignId", "OrderId", "PaymentStatus"]
}
```

It returns `evidenceLinks`, `sourceCoverage`, and optional `sourceTrace`. Authentication,
ACL, HTTP, and schema errors are explicit failures. In `simulation`, the corresponding
source is the Track2 generated manifest, not an M365 connection.

## Integration controls

- Keep FabricIQ metrics, WorkIQ internal context, and Track3 WebIQ public citations
  in separate response fields and traces.
- Verify link validity and ACL behavior in approved live testing; fixture/simulation
  output is not ACL proof.
- Retry transient errors with the fixed 5/10/20-second, 3-retry policy.
- On persistent WorkIQ failure show `업무 문서 근거 없음`; do not replace it with WebIQ.
- Track2 hands off WorkIQ evidence through `[TRACK3_WEBIQ_HANDOFF_PACKAGE]`; Track3
  then composes `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE` for Track4 FoundryIQ.
