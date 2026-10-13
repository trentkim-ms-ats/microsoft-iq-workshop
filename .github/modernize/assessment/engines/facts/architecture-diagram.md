# Architecture Diagram

이 문서는 Microsoft IQ Workshop 저장소의 네 트랙, 근거 소스, 실행 모드, 자동화, 학습 UI를 하나의 구조로 설명합니다. 첫 번째 다이어그램은 전체 시스템 경계를, 두 번째 다이어그램은 실제 저장소 컴포넌트의 실행 흐름을 보여줍니다.

## Application Architecture

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart TD
    subgraph AExperience["사용자 및 학습 경험"]
        AUser["참가자, 강사, 운영자"]
        ADocs["워크북, 노트북, 운영 문서"]
        APlayground["React 학습 Playground"]
    end

    subgraph AEvidence["근거 소스"]
        ATrack1Data[("Track1 CSV 14종")]
        AFabric["Fabric Lakehouse와 Ontology"]
        AM365["Microsoft 365 업무 소스"]
        ATrack2Manifest[("Track2 ACL 매니페스트")]
        APublicWeb["승인된 공개 웹"]
        AWebFixture[("Track3 WebIQ fixture")]
    end

    subgraph AIQ["Microsoft IQ 파이프라인"]
        AFabricIQ["Track1 FabricIQ"]
        AWorkIQ["Track2 WorkIQ"]
        AWebIQ["Track3 WebIQ"]
        ALiveAdapters["Workshop POST adapters"]
        AFoundryIQ["Track4 FoundryIQ"]
        AGuardrails["정책, retry, fallback, sourceTrace"]
        AResponsesApi["Azure AI Foundry Responses API"]
    end

    subgraph AAutomation["자동화 및 검증"]
        AInputGen["Track4 입력 생성기"]
        ASimRunner["Microsoft IQ simulation runner"]
        AEvaluator["Strict evaluator"]
        ADailyRunner["Daily briefing runner"]
        AScheduler["GitHub Actions, cron, Logic Apps"]
        APagesBuild["Playground data build"]
    end

    subgraph AOutputs["산출물 및 전달"]
        AResponseJson[("Microsoft IQ 응답 JSON")]
        AReports[("평가 리포트")]
        ABriefing["리더십 브리핑"]
        ANotify["Teams와 Outlook 알림"]
        APages["GitHub Pages"]
    end

    AUser -->|"학습하고 운영"| ADocs
    AUser -->|"브라우저에서 탐색"| APages
    APages -->|"정적 앱 제공"| APlayground
    ADocs -->|"트랙별 절차 안내"| AFabricIQ
    ADocs -->|"트랙별 절차 안내"| AWorkIQ
    ADocs -->|"트랙별 절차 안내"| AWebIQ
    ADocs -->|"통합 절차 안내"| AFoundryIQ

    ATrack1Data -->|"적재"| AFabric
    AFabric -->|"정형 사실과 관계"| AFabricIQ
    AM365 -->|"ACL 적용 업무 맥락"| AWorkIQ
    ATrack2Manifest -->|"simulation 업무 근거"| AWorkIQ
    APublicWeb -->|"최신 공개 사실"| AWebIQ
    AWebFixture -->|"offline citation 계약"| AWebIQ

    AFabricIQ -->|"structured metrics"| AFoundryIQ
    AWorkIQ -->|"evidence links"| AFoundryIQ
    AWebIQ -->|"web citations"| AFoundryIQ
    AFabricIQ -.->|"live adapter contract"| ALiveAdapters
    AWorkIQ -.->|"live adapter contract"| ALiveAdapters
    AWebIQ -.->|"선택 adapter contract"| ALiveAdapters
    ALiveAdapters -->|"POST JSON 응답"| AFoundryIQ
    AFoundryIQ -->|"응답 정책 적용"| AGuardrails
    AGuardrails -->|"검증된 통합 응답"| AResponseJson
    AFoundryIQ -.->|"선택 최종 문장화"| AResponsesApi
    AResponsesApi -->|"근거 제한 문장"| ABriefing

    ATrack1Data -->|"정형 입력"| AInputGen
    ATrack2Manifest -->|"업무 입력"| AInputGen
    AInputGen -->|"Q1 to Q3 입력"| ASimRunner
    AWebFixture -->|"citation 입력"| ASimRunner
    ASimRunner -->|"normal과 fallback 결과"| AResponseJson
    AResponseJson -->|"strict 평가"| AEvaluator
    AEvaluator -->|"품질 결과"| AReports
    AEvaluator -->|"규칙 기반 요약"| ABriefing

    AScheduler -->|"승인된 실행 트리거"| ADailyRunner
    ADailyRunner -->|"입력 생성 지시"| AInputGen
    ADailyRunner -->|"simulation 실행 지시"| ASimRunner
    ADailyRunner -->|"평가 실행 지시"| AEvaluator
    ADailyRunner -.->|"설정 시 문장화 요청"| AResponsesApi
    AReports -->|"실행 상태"| ANotify
    ABriefing -->|"전달 콘텐츠"| ANotify

    ADocs -.->|"산업 시나리오"| APagesBuild
    AInputGen -.->|"생성 데이터"| APagesBuild
    AWebFixture -.->|"citation 데이터"| APagesBuild
    APagesBuild -->|"TypeScript 데이터 모듈"| APlayground
```

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
| --- | --- | --- | --- |
| Structured intelligence | Microsoft Fabric Lakehouse, Fabric Ontology | Service managed | Track1 CSV를 적재하고 엔터티 관계와 정형 KPI를 계산합니다. |
| Work context | Microsoft 365, Microsoft Graph | Service managed | SharePoint, Outlook, Teams, OneDrive의 ACL 적용 업무 근거를 제공합니다. |
| Public evidence | Foundry Agent Service Web Search 또는 WebIQ adapter | Service managed | 공개 웹의 최신 사실을 URL citation과 관찰 시각으로 제공합니다. |
| Orchestration | Python | 3.11 in GitHub Actions | simulation, retry, fallback, strict 평가, 브리핑 생성을 수행합니다. |
| Final wording | Azure AI Foundry Responses API | Repository contract v1 | 근거가 제한된 초안을 최종 리더십 문장으로 다듬습니다. |
| Sample generation | Node.js, docx | Node.js 20, docx 9.5.1 | Track2의 M365 샘플 문서, 메일, 대화, 매니페스트를 재현합니다. |
| Learning UI | React, TypeScript, Vite | React 19.2.8, TypeScript 6.0.2, Vite 8.2.0 | 네 IQ의 역할, sourceTrace, fallback을 브라우저에서 탐색합니다. |
| UI styling and components | Tailwind CSS, Radix UI | Tailwind CSS 3.4.1 | 반응형 학습 UI와 접근 가능한 인터랙션을 구성합니다. |
| Package management | pnpm | 10.32.1 | Playground 의존성과 재현 가능한 빌드를 관리합니다. |
| Automation | GitHub Actions, cron, Azure Logic Apps templates | Repository managed | 수동 또는 승인된 일정 실행, 리포트 보관, Pages 배포를 지원합니다. |
| Delivery | GitHub Pages, Teams webhook, SMTP | Service managed | 정적 Playground와 승인된 브리핑 알림을 전달합니다. |

### Data Storage & External Services

영속 데이터베이스 대신 버전 관리되는 CSV, JSON, Markdown, DOCX, EML과 생성 매니페스트를 사용합니다. Track1의 CSV와 Fabric Ontology가 정형 사실을, Track2의 Microsoft 365 원본과 ACL 매니페스트가 내부 업무 맥락을, Track3의 공개 웹 또는 교육용 fixture가 외부 citation을 담당합니다. Track4는 이 입력을 JSON 응답과 평가 리포트로 저장하며, live 모드에서는 원시 제품 URL이 아닌 승인된 workshop POST adapter와 Azure AI Foundry Responses API를 사용합니다.

### Key Architectural Decisions

- 정형 수치, 내부 업무 맥락, 공개 웹 citation, 최종 결합 책임을 FabricIQ, WorkIQ, WebIQ, FoundryIQ로 분리하고 `sourceTrace`에서 출처를 보존합니다.
- `simulation`은 Track1 CSV, Track2 매니페스트, Track3 fixture를 사용하는 교육 및 회귀 경로이며, `live` 성공으로 표현하지 않습니다.
- retry는 5초, 10초, 20초로 최대 3회 재시도하며, 일부 소스 실패는 명시적 부분응답, 두 내부 근거 실패는 `blocked`로 처리합니다.

## Component Relationships

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart LR
    subgraph CCanonical["Canonical source generation"]
        CTrack1Gen["generate_track1_samples.py"]
        CTrack1Artifacts[("CSV와 ontology artifacts")]
        CTrack2Gen["generate_samples.js"]
        CTrack2Artifacts[("M365 content manifests")]
        CWebValidator["validate_webiq_sources.py"]
        CWebArtifacts[("source catalog과 fixture")]
        CIndustryDocs[("산업 시나리오 문서")]
    end

    subgraph CIntegration["Track4 integration"]
        CInputBuilder["generate_track3_samples.py"]
        CScenarioInputs[("scenarios와 tool inputs")]
        COrchestrator["run_microsoft_iq_simulation.py"]
        CComposer["compose_response"]
        CPolicy["retry와 fallback policy"]
        CResponses[("mode별 response JSON")]
        CEvaluator["evaluate_microsoft_iq_outputs.py"]
        CFoundryClient["foundry_responses.py"]
        CDailyRunner["run_track3_daily_briefing.py"]
    end

    subgraph CPresentation["Playground presentation"]
        CDataBuilder["generate-data.mjs"]
        CGeneratedData[("generated.ts")]
        CReactApp["App.tsx"]
        CFlowGraph["FlowGraph.tsx"]
    end

    subgraph CInfrastructure["Automation and delivery"]
        CWorkflow["GitHub Actions workflows"]
        CNotifier["send_track3_notifications.py"]
        CReports[("reports와 briefing")]
        CPages["GitHub Pages artifact"]
    end

    CTrack1Gen -->|"재현 가능한 샘플 생성"| CTrack1Artifacts
    CTrack2Gen -->|"문서와 manifest 생성"| CTrack2Artifacts
    CWebValidator -->|"schema와 domain 검증"| CWebArtifacts

    CTrack1Artifacts -->|"정형 입력"| CInputBuilder
    CTrack2Artifacts -->|"업무 근거 입력"| CInputBuilder
    CInputBuilder -->|"Q1 to Q3 변환"| CScenarioInputs
    CScenarioInputs -->|"metrics와 evidence"| COrchestrator
    CWebArtifacts -->|"citation fixture"| COrchestrator
    CPolicy -.->|"실행 규칙 제공"| COrchestrator
    COrchestrator -->|"도구 결과 전달"| CComposer
    CComposer -->|"상태와 sourceTrace 작성"| CResponses
    CResponses -->|"strict gate 입력"| CEvaluator
    CEvaluator -->|"평가와 규칙 기반 브리핑"| CReports

    CWorkflow -->|"파이프라인 시작"| CDailyRunner
    CDailyRunner -->|"입력 재생성"| CInputBuilder
    CDailyRunner -->|"normal과 fallback 실행"| COrchestrator
    CDailyRunner -->|"strict 평가"| CEvaluator
    CDailyRunner -.->|"설정 시 최종 문장화"| CFoundryClient
    CFoundryClient -->|"refined briefing"| CReports
    CReports -->|"전달 요약"| CNotifier

    CTrack1Artifacts -->|"엔터티와 관계"| CDataBuilder
    CTrack2Artifacts -->|"업무 근거 카탈로그"| CDataBuilder
    CWebArtifacts -->|"공개 근거 계약"| CDataBuilder
    CScenarioInputs -->|"질문과 정형 지표"| CDataBuilder
    CIndustryDocs -->|"산업별 학습 데이터"| CDataBuilder
    CDataBuilder -->|"TypeScript 모듈 생성"| CGeneratedData
    CGeneratedData -->|"정적 데이터 import"| CReactApp
    CReactApp -->|"근거 흐름 렌더링"| CFlowGraph
    CWorkflow -->|"pnpm build"| CReactApp
    CReactApp -->|"정적 번들"| CPages
```

### Component Inventory

| Component | Layer | Type | Responsibility |
| --- | --- | --- | --- |
| `track1/data/generate_track1_samples.py` | Canonical source | Python generator | 고정 seed로 14개 CSV와 Q1에서 Q5까지의 정형 신호를 재현합니다. |
| `track1/ontology_bundle/` | Canonical source | Fabric definition bundle | 엔터티, 관계, 데이터 바인딩을 Fabric Ontology 계약으로 제공합니다. |
| `track2/data/generate_samples.js` | Canonical source | Node.js generator | SharePoint, Outlook, Teams, OneDrive 샘플과 배포 매니페스트를 생성합니다. |
| `track2/data/deploy_m365_samples.py` | Canonical source | Python deployment adapter | 기본 dry-run으로 M365 작업을 계획하고 승인된 `--execute`에서만 격리 테넌트에 씁니다. |
| `track3/data/validate_webiq_sources.py` | Canonical source | Python validator | WebIQ fixture의 schema, 허용 도메인, Q1에서 Q3 coverage를 검증합니다. |
| `track3/data/source_catalog.json` | Canonical source | JSON policy store | 시나리오별 검색 의도, 허용 도메인, 최소 citation 정책을 정의합니다. |
| `track3/data/web_evidence_fixture.json` | Canonical source | JSON fixture store | 현재 웹 사실이 아닌 offline citation 계약을 제공합니다. |
| `track4/data/generate_track3_samples.py` | Integration | Python input builder | Track1 CSV와 Track2 매니페스트를 Q1에서 Q3 시나리오와 도구 입력으로 변환합니다. |
| `track4/data/run_microsoft_iq_simulation.py` | Integration | Python orchestrator | FabricIQ, WorkIQ, WebIQ 결과를 실행하고 normal 및 장애 모드 응답을 생성합니다. |
| `compose_response` | Integration | Response composer | 근거를 결합하고 `pass`, `partial`, `blocked`, 경고, guardrail, `sourceTrace`를 작성합니다. |
| `execute_tool` | Integration | Retry and fault policy | 고정 retry 정책과 permanent 또는 transient failure simulation을 적용합니다. |
| `track4/data/evaluate_microsoft_iq_outputs.py` | Quality | Python evaluator | citation, sourceTrace, fallback, 개인정보 및 사람 승인 guardrail을 strict 평가합니다. |
| `track4/data/foundry_responses.py` | Integration | Responses API client | 환경 변수 기반 인증으로 선택적 최종 문장화를 수행하고 오류를 명시적으로 전달합니다. |
| `tools/run_track3_daily_briefing.py` | Automation | Python pipeline runner | 입력 생성, 실행, strict 평가, 브리핑, 선택적 LLM refinement를 순서대로 실행합니다. |
| `tools/send_track3_notifications.py` | Delivery | Python notifier | 평가 상태와 브리핑 위치를 Teams webhook 또는 SMTP로 전달합니다. |
| `industry_playground/playground/scripts/generate-data.mjs` | Presentation | Node.js build step | canonical 산출물과 산업 시나리오를 검증하고 `generated.ts`로 변환합니다. |
| `industry_playground/playground/src/App.tsx` | Presentation | React application | 미션, 근거, citation, fallback, sourceTrace 학습 경험을 구성합니다. |
| `industry_playground/playground/src/components/FlowGraph.tsx` | Presentation | React SVG component | 데이터 소스에서 네 IQ와 브리핑으로 이어지는 인터랙티브 경로를 렌더링합니다. |
| `.github/workflows/playground-pages.yml` | Infrastructure | GitHub Actions workflow | Node.js 20에서 Playground를 빌드하고 GitHub Pages artifact를 배포합니다. |
| `.github/workflows/track3-daily-briefing-with-notify.yml` | Infrastructure | GitHub Actions workflow | 수동 승인 경로에서 Python 3.11 브리핑 파이프라인과 알림을 실행합니다. |
