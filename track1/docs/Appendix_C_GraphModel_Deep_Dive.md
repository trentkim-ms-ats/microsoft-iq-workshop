## Appendix C. (심화) GraphModel — 그래프 쿼리를 원하는 경우

**본 Track1 기본 실습은 GraphModel을 필수로 다루지 않습니다.** 미션 4의 목표는 Ontology(엔터티/관계/속성 의미 모델)를 정의해 Microsoft IQ workshop의 공통 어휘를 만드는 것입니다. 다만 위 ⑦ 선택 심화처럼 GraphModel 가능 환경에서는 의미 질의 검증을 수행할 수 있으며, 더 확장된 그래프 질의가 필요하면 아래 경로를 따릅니다.

### C-1. Ontology와 GraphModel의 차이

- **Ontology 아이템**: 엔터티/관계/속성의 **의미 스키마**(무엇이 무엇과 어떻게 연결되는가). Track1의 산출물.
- **GraphModel 아이템**: 그 스키마를 실제 Lakehouse Delta 테이블에서 **노드/엣지로 물질화(materialize)**한 뒤 그래프 쿼리(MATCH … RETURN)를 실행할 수 있는 **별도 아이템**.

즉 GraphModel은 Ontology와 **별개의 Fabric 아이템**(`.platform` metadata `type: "GraphModel"`)으로 추가 생성해야 합니다.

### C-2. GraphModel을 원할 때의 구성

GraphModel 정의는 4개 파트 + `.platform`으로 구성됩니다.

| 파트 | 역할 |
|---|---|
| `graphType.json` | `nodeTypes` / `edgeTypes` — 노드·엣지 타입과 속성 타입 정의 |
| `dataSources.json` | 각 Delta 테이블을 `DeltaTable` 데이터 소스로 등록 (OneLake abfss 경로) |
| `graphDefinition.json` | `nodeTables` / `edgeTables` — 테이블 컬럼을 노드/엣지 속성에 매핑하고, 엣지의 `sourceNodeKeyColumns` / `destinationNodeKeyColumns`로 연결 |
| `stylingConfiguration.json` | 그래프 시각화 레이아웃(노드 위치/크기) |

```python
# 노드 타입: 엔터티 = 노드
node_types = [{
    "alias": entity_id, "labels": ["Customer"],
    "primaryKeyProperties": ["CustomerId"],
    "properties": [{"name": "CustomerId", "type": "STRING"}, ...],
}]
# 엣지 타입: 관계 = 엣지 (source/destination 노드 타입 연결)
edge_types = [{
    "alias": rel_id, "labels": ["Customer_places_Order"],
    "sourceNodeType": {"alias": entity_ids["Customer"]},
    "destinationNodeType": {"alias": entity_ids["Order"]},
}]
```

### C-3. 생성 → 새로고침 → 질의 흐름

먼저 Fabric UI에서 GraphModel item을 생성한 뒤, 항목 URL의 item ID를 복사합니다.

```python
GRAPH_MODEL_ID = "your-graph-model-item-id"

# 1) GraphModel 정의 배포
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/updateDefinition",
              headers=headers, json={"definition": {"parts": [...]}})

# 2) Delta 테이블에서 그래프 인덱스 빌드(새로고침) - 비동기 LRO
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/jobs/refreshGraph/instances",
              headers=headers)   # 202 → Location 헤더로 완료까지 폴링

# 3) 그래프 쿼리 실행 (Cypher 유사 문법, beta)
requests.post(f"{FABRIC_API_BASE}/workspaces/{WORKSPACE_ID}/graphModels/{GRAPH_MODEL_ID}/executeQuery?beta=True",
              headers=headers,
              json={"query": "MATCH (c:`Customer`)-[:`Customer_places_Order`]->(o:`Order`) RETURN c, o LIMIT 5;"})
```

### C-4. 언제 GraphModel을 고려하나

- **필요 없음(Track1 기본)**: 엔터티/관계 의미 모델 정의, Microsoft IQ 흐름 공통 어휘, WorkIQ/WebIQ/FoundryIQ 그라운딩 → **Ontology만으로 충분**.
- **고려할 만함**: 다중 홉 경로 탐색(예: 캠페인→주문→결제→반품 경로를 그래프 순회), 커뮤니티/중심성 등 그래프 분석, MATCH 패턴 질의를 직접 실행하고 싶을 때.

> ⚠️ GraphModel의 `executeQuery`는 현재 `beta` 파라미터가 필요한 Preview 기능입니다. 테넌트/리전에 따라 미지원일 수 있으므로, 사용 전 Fabric 공개 미리보기 제한 사항과 워크숍 환경을 먼저 확인하세요.
