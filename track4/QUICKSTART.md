# Track4 FoundryIQ Quick Start

`track4/` is the canonical FoundryIQ module and follows Track3 WebIQ.

1. Read [PREREQUISITES.md](PREREQUISITES.md).
2. Receive Track2 WorkIQ evidence and the Track3 `[TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE]`.
3. Run the local, key-free `simulation` contract:

   ```bash
   python track3/data/validate_webiq_sources.py
   cd track4/data
   python generate_track3_samples.py
   python run_microsoft_iq_simulation.py --all --mode normal
   python evaluate_microsoft_iq_outputs.py --strict
   ```

4. Confirm each normal response traces `FabricIQ`, `WorkIQ`, `WebIQ`, and
   `FoundryIQ`.

The `generate_track3_*` and `run_track3_*` file names are compatibility names.
They run from `track4/data` and write only to
`track4/data/generated/`.

For a separately approved `live` validation, use the adapter and Azure AI Foundry
Responses API contract in [PREREQUISITES.md](PREREQUISITES.md); do not treat
`simulation` as live proof.

Key references:

- [FoundryIQ technical guide](docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)
- [Foundry data package](data/README.md)
- [Track3 WebIQ workbook](../track3/WORKBOOK.md)
- [Microsoft IQ workshop integrated plan](../common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md)
