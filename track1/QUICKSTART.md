# Track1 Quick Start

Microsoft IQ 워크숍에서도 기존 FabricIQ 데이터와 절차를 그대로 사용합니다. 처음 참가자는 [Microsoft IQ 입문자 학습 지도](../common/docs/Microsoft_IQ_Beginner_Learning_Map.md)를 먼저 읽으세요.

1. Read [PREREQUISITES.md](./PREREQUISITES.md)
2. Run workbook steps in [WORKBOOK.md](./WORKBOOK.md)
3. Run end-to-end learner notebook [Track1_EndToEnd_Learner_Notebook.ipynb](./Track1_EndToEnd_Learner_Notebook.ipynb)
4. Use sample data in [data/](./data/)
5. Use ontology deployment assets in [ontology_bundle/](./ontology_bundle/)

Fabric에서 learner notebook을 실행할 때는 CSV 14개를 default Lakehouse의 `Files`
루트에 업로드하고 Lakehouse 연결 후 세션을 재시작합니다. 다른 폴더를 사용하면 첫
코드 셀의 `TRACK1_DATA_ROOT` 변수로 CSV 폴더를 지정합니다. 같은 이름의 환경 변수도
초기값으로 사용할 수 있습니다.

> P1 데이터 품질(참조 무결성·중복·결측·이상값)은 개념과 영향만 학습합니다.
> 참가자 실습에서는 오류 위치·건수를 찾거나 수정하지 않습니다.

Key references:
- [Track1_Data_Structure_Detailed_Guide.md](./docs/Track1_Data_Structure_Detailed_Guide.md)
- [Track1_Ontology_Concepts_and_Graph_Design_Guide.md](./docs/Track1_Ontology_Concepts_and_Graph_Design_Guide.md)
