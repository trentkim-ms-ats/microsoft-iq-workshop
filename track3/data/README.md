# Track3 FoundryIQ 자동 검증 샘플 패키지

Track3 실습(에이전트 헬스체크 → 통합 응답 → fallback 검증)을 **키 입력 없이 로컬에서 재현**할 수 있도록 만든 샘플 패키지입니다.

## 1) 목적

- Track1 정형 데이터(CSV)와 Track2 비정형 콘텐츠 매니페스트를 결합해 Track3 질문(Q1~Q3) 실행 입력을 자동 생성
- Tool A/FabricIQ, Tool B/WorkIQ 응답을 시뮬레이션하고 fallback 정책을 자동 검증
- 참가자가 실습 중 막히면 노트북으로 동일 흐름을 재현해 결과 비교

## 2) 구성

```text
track3/data/
  README.md
  generate_track3_samples.py
  run_track3_simulation.py
  evaluate_track3_outputs.py
  foundry_responses.py
  Track3_Mission_Workbench.ipynb
  Track3_EndToEnd_Learner_Notebook.ipynb
  generated/
    scenarios.json
    tool_a_metrics.json
    tool_b_evidence.json
    track3_seed_summary.json
    responses/
    reports/
      evaluation_report.json
      evaluation_report.md
      track3_answers.md
      leadership_briefing.md
```

## 3) 빠른 실행

저장소 루트에서:

```bash
cd track3/data
python generate_track3_samples.py
python run_track3_simulation.py --all --mode normal
python run_track3_simulation.py --scenario-id Q1 --mode tool-a-down
python run_track3_simulation.py --scenario-id Q1 --mode tool-b-down
python run_track3_simulation.py --scenario-id Q1 --mode both-down
python evaluate_track3_outputs.py --strict
```

## 3-1) simulation reference 자동화 (매일 아침 자동 수신)

리더십 브리핑 생성·평가·발송 체인을 키 없이 리허설하거나 기준 결과를 매일 만들 때 아래 4단계를 사용합니다.

1. 스케줄 트리거: 평일 08:30(KST) 배치 실행
2. 파이프라인 실행: 샘플 생성 → 시뮬레이션 → 평가(strict) → 브리핑 파일 생성
3. 전달 채널 발송: Teams/Outlook으로 `leadership_briefing_llm.md` 또는 `leadership_briefing.md` 전송
4. 실행 로그 보관: `generated/reports/` 산출물 + `generated/responses/*.json` 장기 보관

예시(크론):

```bash
30 8 * * 1-5 cd /path/to/repo/track3/data && \
python generate_track3_samples.py && \
python run_track3_simulation.py --all --mode normal --pipeline-version prod-2026-07 --prompt-version p3.2 --model-version foundry-responses-v1 --toolset-version fabriciq-1.4+workiq-2.1 && \
python evaluate_track3_outputs.py --strict
```

> 이 체인은 Track1 CSV와 Track2 manifest를 사용하는 simulation reference입니다. 실제 live 운영에서는 아래 adapter 계약으로 FabricIQ/WorkIQ를 호출하는 실행 서비스를 배포한 뒤 동일한 평가·발송 정책을 적용하세요.

운영 배치용 통합 스크립트(권장):

```bash
python ../../tools/run_track3_daily_briefing.py \
  --pipeline-version prod-2026-07 \
  --prompt-version p3.2 \
  --model-version foundry-responses-v1 \
  --toolset-version fabriciq-1.4+workiq-2.1
```

추가 검증이 필요하면 `--run-fallback-check`를 붙여 fallback 3종까지 함께 실행할 수 있습니다.

스케줄러별 템플릿:

- cron: [track3-daily-briefing.cron](../../tools/templates/cron/track3-daily-briefing.cron)
- GitHub Actions: [track3-daily-briefing.yml](../../.github/workflows/track3-daily-briefing.yml)
- Azure Logic Apps(ARM 템플릿): [track3-daily-briefing.logicapp.template.json](../../tools/templates/logicapps/track3-daily-briefing.logicapp.template.json)

Teams/메일 알림 포함 확장 템플릿:

- cron: [track3-daily-briefing-with-notify.cron](../../tools/templates/cron/track3-daily-briefing-with-notify.cron)
- GitHub Actions: [track3-daily-briefing-with-notify.yml](../../.github/workflows/track3-daily-briefing-with-notify.yml)
- Azure Logic Apps(ARM 템플릿): [track3-daily-briefing-with-notify.logicapp.template.json](../../tools/templates/logicapps/track3-daily-briefing-with-notify.logicapp.template.json)

GitHub Actions 알림 확장 워크플로우용 권장 Secrets:
- `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`, `AZURE_AI_FOUNDRY_MODEL`
- `AZURE_AI_FOUNDRY_API_KEY` 또는 `AZURE_AI_FOUNDRY_BEARER_TOKEN`
- `TEAMS_WEBHOOK_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_TO`

알림 전송 스크립트:

```bash
python ../../tools/send_track3_notifications.py \
  --reports-dir generated/reports \
  --teams-webhook-url "<teams-webhook-url>" \
  --email-enabled \
  --smtp-host "<smtp-host>" \
  --smtp-port 587 \
  --smtp-user "<smtp-user>" \
  --smtp-password "<smtp-password>" \
  --email-from "noreply@company.com" \
  --email-to "leadership@company.com"
```

## 4) 입력 데이터 원천

- simulation 정형(Track1): `../../track1/data/*.csv`
- simulation 비정형(Track2): `../../track2/data/generated/manifests/content_manifest.csv`

### 4-1) Dual Mode와 live adapter 계약

[Track3_Mission_Workbench.ipynb](Track3_Mission_Workbench.ipynb)는 `TRACK3_EXECUTION_MODE=simulation|live`를 지원합니다.

| 책임 | simulation | live |
|---|---|---|
| 정형 지표 | Track1 CSV 기반 Tool A fixture | `FABRICIQ_ENDPOINT` adapter |
| 비정형 근거 | Track2 manifest 기반 Tool B fixture | `WORKIQ_ENDPOINT` adapter |
| 결합/평가 | 로컬 응답 계약 + evaluator | 같은 응답 계약 + evaluator |

`FABRICIQ_ENDPOINT`와 `WORKIQ_ENDPOINT`는 원시 제품 URL이 아니라 아래 공통 요청을 받는 워크숍 adapter입니다.

```json
{
  "scenarioId": "Q1",
  "question": "결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?",
  "semanticKeys": ["CampaignId", "OrderId", "PaymentStatus"]
}
```

FabricIQ adapter 응답 예:

```json
{
  "scenarioId": "Q1",
  "structuredMetrics": {
    "conversionRate": 0.182,
    "paymentFailureRate": 0.074
  },
  "highlights": ["결제 실패율 상승 구간에서 전환율이 하락했습니다."],
  "sourceTrace": [
    {
      "iq": "FabricIQ",
      "role": "structured",
      "origin": "FabricIQ:Campaign->Order->Payment"
    }
  ]
}
```

WorkIQ adapter 응답 예:

```json
{
  "scenarioId": "Q1",
  "evidenceLinks": [
    {
      "title": "결제 실패 및 재시도 사후 분석",
      "source": "SharePoint",
      "location": "sharepoint/Operations/10_Payment_Failure_and_Retry_Postmortem.docx"
    }
  ],
  "sourceCoverage": {"SharePoint": 1},
  "sourceTrace": [
    {
      "iq": "WorkIQ",
      "role": "unstructured",
      "origin": "WorkIQ:SharePoint"
    }
  ]
}
```

인증·ACL·schema 오류는 HTTP 오류 또는 명시적 실패 상태로 반환하고, 성공 모양의 빈 배열로 숨기지 않습니다.

## 5) 검증 포인트

- `normal`: 정형 수치 + 비정형 근거 링크 모두 포함되어야 PASS
- `tool-a-down`: `정형 수치 미검증` 경고와 함께 partial 처리
- `tool-b-down`: `업무 문서 근거 없음` 경고와 함께 partial 처리
- `both-down`: 응답 생성 중단(blocked) 처리

## 5-1) 최종 리포트

`evaluate_track3_outputs.py`(`--strict`)는 판정이 끝나면 아래 두 파일을 **같은 내용으로** 저장합니다(JSON을 먼저 쓰고, 그 JSON을 그대로 Markdown 표로 변환해 이어서 저장):

- [generated/reports/evaluation_report.json](./generated/reports/evaluation_report.json): 자동화/후속 처리를 위한 원본 JSON
- [generated/reports/evaluation_report.md](./generated/reports/evaluation_report.md): 사람이 바로 읽을 수 있는 Markdown 표(시나리오/모드별 PASS·FAIL과 사유)

`--report-path`, `--markdown-report-path` 인자로 저장 경로를 각각 재지정할 수 있습니다.

## 5-2) 질문에 대한 실제 답변 (Markdown)

`generated/responses/*.json`의 `response` 객체(질문 원문, `overallStatus`, `keyFindings`, `warnings`, `recommendedActions`, `evidenceLinks`)가 각 시나리오에 대한 **실제 답변**입니다. CLI 스크립트에는 별도 렌더링 기능이 없고, 두 노트북에서 사람이 읽기 쉬운 Markdown으로 변환해 [generated/reports/track3_answers.md](./generated/reports/track3_answers.md)에 저장하고 바로 렌더링해 보여줍니다:

- [Track3_Mission_Workbench.ipynb](Track3_Mission_Workbench.ipynb): "질문에 대한 실제 답변 (Markdown)" 섹션
- [Track3_EndToEnd_Learner_Notebook.ipynb](Track3_EndToEnd_Learner_Notebook.ipynb): "2-6. 질문에 대한 실제 답변을 Markdown으로 렌더링" 섹션

## 5-3) 임원용 리더십 브리핑 초안

[track3/WORKBOOK.md](../WORKBOOK.md)의 미션 4(생성/평가 + 제출)에서 요구하는 **최종 브리핑**(요약 + 조치안 + 출처 링크,
`[TRACK3_RESPONSE]` 형식)의 초안을, Q1~Q3 정상(normal) 응답을 규칙 기반으로 결합해 자동 생성합니다. 실제 LLM 문장 다듬기는
FoundryIQ 에이전트/참가자가 이어서 완성해야 합니다.

- 저장 위치: [generated/reports/leadership_briefing.md](./generated/reports/leadership_briefing.md)
- 두 노트북 모두 "임원용 리더십 브리핑 초안" 섹션에서 생성 및 렌더링을 확인할 수 있습니다.

## 5-4) FoundryIQ 에이전트(LLM)로 최종 브리핑 문서 생성 (선택)

규칙 기반 초안(`leadership_briefing.md`)을 실제 **Azure AI Foundry Responses API**로 다듬어 최종 문장을 생성하는 셀을
두 노트북 모두에 추가했습니다.

| 환경변수 | 설명 | 필수 여부 |
|---|---|---|
| `AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT` | Responses API 엔드포인트 (예: `https://<resource>.services.ai.azure.com/openai/v1/responses`) | 필수 |
| `AZURE_AI_FOUNDRY_MODEL` | 호출할 모델/배포 이름 (예: `gpt-5.6`, `gpt-4o-mini`) | 필수 |
| `AZURE_AI_FOUNDRY_API_KEY` | 키 인증 사용 시 API 키 (`api-key` 헤더) | 선택 |
| `AZURE_AI_FOUNDRY_BEARER_TOKEN` | Bearer 토큰 인증 사용 시 토큰 (`Authorization` 헤더) | 선택 |

- `AZURE_AI_FOUNDRY_API_KEY`와 `AZURE_AI_FOUNDRY_BEARER_TOKEN` 중 하나 이상이 있어야 호출 가능합니다.
- API key는 `api-key` 헤더, Entra 액세스 토큰은 `Authorization: Bearer` 헤더에 사용합니다. JWT 토큰을 API key 변수에 넣지 않습니다.
- 환경변수가 없으면 이 섹션은 **자동으로 건너뛰며** 노트북 전체 실행은 계속 키 없이 성공합니다(보안 원칙 준수).
- 환경변수가 설정되면 `generated/reports/leadership_briefing_llm.md`에 LLM 최종본을 저장하고 노트북에 렌더링합니다.
- 공용 호출 구현은 [foundry_responses.py](foundry_responses.py)를 사용하며 두 노트북과 일일 배치가 같은 계약을 공유합니다.
- 시스템 프롬프트는 [WORKBOOK.md](../WORKBOOK.md) 미션 2의 고정 정책(정형 우선 + 근거 결합, 근거 없는 단정 금지,
  `핵심요약/수치근거/문서근거/조치안/주의사항` 출력 형식)을 그대로 반영합니다.

## 5-5) 운영 버전 관리(회귀 점검용)

`run_track3_simulation.py`는 실행 결과 JSON의 `runContext.release`에 아래 버전 태그를 기록합니다.

- `pipelineVersion`: 파이프라인/워크플로 버전
- `promptVersion`: 프롬프트 템플릿 버전
- `modelVersion`: Foundry 모델 배포 버전
- `toolsetVersion`: FabricIQ/WorkIQ 커넥터 버전

CLI 인자:

- `--pipeline-version` (기본: `track3-sim-v1`)
- `--prompt-version` (기본: `track3-prompt-v1`)
- `--model-version` (기본: `foundry-responses-v1`)
- `--toolset-version` (기본: `fabriciq-v1+workiq-v1`)

이 값들을 배포 파이프라인에서 고정해 두면, 실패/회귀 발생 시 어떤 변경(프롬프트·모델·도구)에서 품질이 달라졌는지 역추적할 수 있습니다.

## 6) 노트북 사용

- [Track3_Mission_Workbench.ipynb](Track3_Mission_Workbench.ipynb): Dual Mode(`simulation`/`live`) 지원 노트북입니다. `live` 모드에서는 **정형값은 FabricIQ**, **비정형 근거는 WorkIQ**에서만 가져오도록 분리되어 있으며(`TRACK3_EXECUTION_MODE=live`), `simulation` 모드에서는 기존 로컬 재현 경로를 사용합니다.
- [Track3_EndToEnd_Learner_Notebook.ipynb](Track3_EndToEnd_Learner_Notebook.ipynb): 학습자용 simulation 노트북. 3개 스크립트의 **로직 자체를 셀로 이식**해 샘플 생성 → 통합응답(정상+fallback) → 품질 게이트 평가를 순서대로 수정·학습하고, 마지막에 같은 Responses API 공용 모듈로 최종 문장을 생성합니다.
