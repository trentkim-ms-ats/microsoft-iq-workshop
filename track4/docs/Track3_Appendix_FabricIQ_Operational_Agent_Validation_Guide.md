# Track4 Appendix — FabricIQ 운영형 검증 가이드

> Filename retained as a legacy Track3 FoundryIQ identifier. The active orchestration
> module is Track4.

## FabricIQ input boundary

FabricIQ supplies the internal quantitative basis: scenario IDs, KPI calculations,
highlights, and structured source trace. It does not derive metrics from WorkIQ
documents or WebIQ pages.

`track4/data/generate_track3_samples.py` creates deterministic Q1–Q3 inputs from
Track1 CSV files. Its retained `track3` filename and `track3_seed_summary.json`
basename are compatibility identifiers; its defaults write under `track4/data/generated/`.

| Scenario | FabricIQ simulation check |
| --- | --- |
| Q1 | campaign conversion and payment status |
| Q2 | delayed-order return and complaint rate |
| Q3 | target-product orders, sales, and returns |

## Track4 orchestration checks

The compatibility harness supports `normal`, `tool-a-down`, `tool-b-down`,
`both-down`, and transient modes. The Microsoft IQ workshop harness adds `fabric-down`, `work-down`,
`web-down`, `internal-down`, and `all-down`.

- retry policy must record 3 retries at 5/10/20 seconds after the initial call;
- failures retain explicit `partial` warnings or `blocked` status;
- `runContext`, `toolStatus`, `response`, and `sourceTrace` remain auditable;
- strict evaluation rejects missing structured metrics or mixed source responsibility.

Run from the canonical Foundry root:

```bash
cd track4/data
python generate_track3_samples.py
python run_track3_simulation.py --all --mode normal
python evaluate_track3_outputs.py --strict
```

For the four-component Microsoft IQ flow, validate the Track3 WebIQ fixture first and use
`run_microsoft_iq_simulation.py`; the output still belongs under `track4/data/generated/`.
