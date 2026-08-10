# Track3 WebIQ Quick Start

`track3/` is the canonical WebIQ module. Complete it after Track2 WorkIQ and before
Track4 FoundryIQ.

1. Read [PREREQUISITES.md](PREREQUISITES.md) and choose `simulation` or `live`.
2. Validate the offline source contract:

   ```bash
   python track3/data/validate_webiq_sources.py
   ```

3. Complete Q1–Q3 in [WORKBOOK.md](WORKBOOK.md).
4. Submit `[TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE]`.
5. Continue to [Track4 FoundryIQ](../track4/QUICKSTART.md).

`simulation` reads the fixture and does not make a web request or prove a current
web fact. `live` requires a human-approved Foundry Web Search environment and records
URL citations; it must not receive private or internal data.

Key references:

- [WebIQ source governance](docs/WebIQ_Introduction_and_Source_Governance.md)
- [WebIQ data package](data/README.md)
- [Microsoft IQ workshop integrated plan](../common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md)
