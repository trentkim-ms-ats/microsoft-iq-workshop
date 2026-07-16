# Track3 Quick Start

1. Read [PREREQUISITES.md](./PREREQUISITES.md) and choose `simulation` or `live`.
2. Run workbook steps in [WORKBOOK.md](./WORKBOOK.md).
3. Run local simulation/evaluation assets from [data/](./data/).
4. Confirm every normal response traces both `FabricIQ` and `WorkIQ`.
5. Optionally configure Azure AI Foundry Responses API for the final briefing.

```bash
cd track3/data
python generate_track3_samples.py
python run_track3_simulation.py --all --mode normal
python evaluate_track3_outputs.py --strict
```

Foundry finalization uses:
- `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`
- `AZURE_AI_FOUNDRY_MODEL`
- `AZURE_AI_FOUNDRY_API_KEY` or `AZURE_AI_FOUNDRY_BEARER_TOKEN`

Core references:
- [docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md](./docs/Track3_FoundryIQ_Introduction_and_Technical_Guide.md)
- [docs/Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md](./docs/Track3_Appendix_WorkIQ_Integration_and_M365_Search_API_Guide.md)
- [data/Track3_Mission_Workbench.ipynb](./data/Track3_Mission_Workbench.ipynb)
