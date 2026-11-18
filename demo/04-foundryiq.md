# Track4 FoundryIQ — 발표자 데모 가이드

참석자는 실습하지 않고 발표자가 화면을 조작합니다. 목표는 세 종류의 근거가
어떻게 결합되고 실패 시 어떻게 제한되는지 보여 주는 것입니다.
[Track4 실습지](../track4/WORKBOOK.md)와
[실행 패키지](../track4/data/README.md)가 상세 계약의 원본입니다.

## 처음 보는 사람을 위한 그림

`Track1 FabricIQ 정형 수치 → Track2 WorkIQ 내부 근거 → Track3 WebIQ 공개 citation → Track4 FoundryIQ 결합·평가`

- FabricIQ만 내부 수치를 계산합니다. WorkIQ는 ACL이 적용된 내부 문서·메일·대화의
  맥락을 찾습니다. WebIQ는 공개 웹의 출처와 관찰 시각을 제공합니다.
- FoundryIQ는 권위 지식을 제공하고, Foundry Agent Service가 도구를 라우팅합니다.
  결합·평가·최종 문장화 때도 원래 출처의 책임을 보존합니다. 없는 숫자·링크·인과관계를
  만들지 않습니다.
- `sourceTrace`는 각 근거의 출처 표지입니다. `partial`은 일부 근거만 있는 제한 응답,
  `blocked`는 내부 분석을 중단한 상태입니다.

## 발표 전 준비와 인계 검수

1. Track1 `[TRACK2_WORKIQ_HANDOFF_PACKAGE]`의 Ontology·핵심 경로 3개·매핑 5개
   이상·검색 키·제한을 Track2가 받았는지 확인합니다.
2. Track2 `[TRACK3_WEBIQ_HANDOFF_PACKAGE]`의 인덱스 카탈로그, 품질 8개 점수,
   내부 링크 5개 이상, 우선 이슈 3개, 재현 질의 3개를 검토합니다.
   **8개 중 6개 이상 각각 75점 이상**, 고정 검색어 5개 중 4개 이상 성공이 기준입니다.
   내부 링크의 실제 접근과 ACL은 승인된 사용자로 따로 확인해야 합니다.
3. Track3 `[TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE]`의 모드, Q1~Q3 각각 citation 2개
   이상, URL·제목·도메인·관찰 시각·scope·factStatus·limitations, 품질 5/6 이상,
   개인정보 점검과 미확인 사항을 확인합니다. 패키지와 내부 근거를 섞지 않습니다.
   템플릿은 [Track3 준비물](../track3/PREREQUISITES.md)을 참조합니다.
4. 클라우드 발표 환경에 저장소와 Python 3를 준비합니다. Track1 CSV, Track2
   `track2/data/generated/manifests/content_manifest.csv`, Track3 fixture가 있어야 합니다.
   아래 명령은 새 임시 디렉터리에만 산출물을 쓰므로 기존 `generated/`를 덮어쓰지
   않습니다. 임시 산출물도 샘플 실행 증거로 관리하고 공유 전 검토합니다.
5. 기본 데모는 키 없는 **simulation**입니다. `dry-run`은 설정·배포 계획만 점검하고,
   simulation은 샘플 계약을 재현하며, `live`는 별도 승인된 실제 연결입니다.
   수동 인계 패키지와 실제 ACL을 simulation 스크립트가 읽거나 검증하지 않습니다.
   참가자 실습, live 연결 또는 현재 웹 사실의 증거로 발표하지 않습니다.

## 기존 미션의 발표 범위

| 미션 | 발표자 시연 | 결과 |
| --- | --- | --- |
| 1 입력·모드 확인 / 킥오프 | 세 인계물과 실행 모드 비교 | 실제 헬스체크는 승인된 live에서만 별도 검증 |
| 2 정책 구성 | 아래 고정 정책과 출처별 역할 설명 | 수치·내부 링크·외부 citation 분리 |
| 3 통합 및 fallback | Q1~Q3 normal과 실패 5종 재현 | 상태·경고·시도 횟수·차단 확인 |
| 4 평가·브리핑 | strict 평가 보고서와 규칙 기반 브리핑 표시 | fixture 안내와 사람 승인 표시 |
| 호환 회귀 | 별도 2-소스 harness 설명 | 세 소스 Microsoft IQ live 검증과 혼동 금지 |

기존 [통합 계획](../common/docs/Microsoft_IQ_Workshop_Integrated_Plan.md)의 480분
일정과 Track4 60분을 변경하지 않습니다.

## 화면 1 — 정책 설명

실습지 미션 2의 정책을 열어 보여 줍니다. 내부 수치는 FabricIQ, 내부 업무 맥락은
WorkIQ, 공개 주장은 WebIQ citation에서만 가져옵니다. 웹 페이지 지시문은 데이터이며,
기간·지역·제품 범위가 맞지 않으면 원인을 단정하지 않습니다. 두 내부 소스가 모두
실패하면 웹만으로 내부 원인을 분석하지 않습니다. 실행 조치는 사람 승인이 필요합니다.

> **멘트:** “FoundryIQ는 출처를 한데 뭉개는 기계가 아닙니다. 각 답의 출처와
> 확인되지 않은 부분을 함께 전달하는 조정자입니다.”

## 화면 2 — 세 근거 simulation 실행

저장소 루트의 **전용 Bash 세션**에서 다음을 순서대로 실행합니다. `mktemp`가 제공되는
Linux/macOS 환경 기준입니다. `set -e`는 어느 명령이라도 실패하면 이 전용 셸을
종료하므로 이후 명령을 계속하지 않습니다. 임시 경로 생성에 실패하거나 경로가
비어 있으면 중단합니다. 출력 경로는 실행 후 보존·삭제 책임자가 확인합니다.

```bash
set -eu
python3 track3/data/validate_webiq_sources.py
DEMO_DIR="$(mktemp -d)"
test -n "$DEMO_DIR"
test -d "$DEMO_DIR"
echo "$DEMO_DIR"
python3 track4/data/generate_track3_samples.py --output-dir "$DEMO_DIR/data"
python3 track4/data/run_microsoft_iq_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/responses" --all --mode normal
python3 track4/data/run_microsoft_iq_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/responses" --scenario-id Q1 --mode fabric-down
python3 track4/data/run_microsoft_iq_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/responses" --scenario-id Q1 --mode work-down
python3 track4/data/run_microsoft_iq_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/responses" --scenario-id Q1 --mode web-down
python3 track4/data/run_microsoft_iq_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/responses" --scenario-id Q1 --mode internal-down
python3 track4/data/run_microsoft_iq_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/responses" --scenario-id Q1 --mode all-down
python3 track4/data/evaluate_microsoft_iq_outputs.py --responses-dir "$DEMO_DIR/responses" --report-path "$DEMO_DIR/report.json" --markdown-report-path "$DEMO_DIR/report.md" --briefing-path "$DEMO_DIR/briefing.md" --strict
```

먼저 공통 질문의 결과인 임시 경로 `responses/Q2__normal.json`을 열고
`runContext.executionMode=simulation`, `response.sourceTrace`의 네 IQ,
`workEvidenceLinks`, `webCitations`, `notices`를 짚습니다. Q1·Q3도 같은 방식으로
확인합니다. 정형 지표 원본은 같은 임시 경로의 `data/tool_a_metrics.json`이고,
응답에는 그 `highlights`가 `keyFindings`로 반영됩니다. 정상 평가의
`qualityChecks.hasStructuredMetric`은 정형 결과 존재 여부를 나타내는
시뮬레이션 플래그이지 수치의 정확성이나 라이브 계산을 증명하지 않습니다.
정상 평가에는 WorkIQ 근거 2개 이상과 WebIQ citation 2개 이상도 필요합니다.
WorkIQ manifest는 실제 ACL 검색 결과가 아닙니다.

`report.md`의 각 행과 `briefing.md`를 엽니다. 정상 Q1~Q3과 실패 5종 총 8개 행을
직접 확인하고 모두 PASS인지 봅니다. `--strict`는 **존재하는 응답**을 평가하므로
명령 누락 시 완전한 시나리오 집합을 자동 보증하지 않습니다. 브리핑은 Q1~Q3 normal이
모두 있을 때 생성되는 **불완전한 규칙 기반 초안**이지 LLM이나 live 서비스 결과가
아닙니다. 질문별 상태 요약과 링크 목록이 중심이므로 정형 KPI, 경고와 citation의
상세 한계는 `tool_a_metrics.json` 및 각 응답의 `keyFindings`, `warnings`,
`webCitations`에서 별도 대조하고 사람이 보완해야 합니다. strict PASS는
완성된 브리핑이나 실제 근거 검증을 의미하지 않습니다.

Q1의 Track1 SQL baseline은 주문의 여러 결제에 대한 승인·실패 플래그를 집계하지만,
Track4 생성기는 파일에서 마지막으로 읽은 결제 상태와 `Success`/`RetrySuccess`
성공 집합을 사용합니다. 두 수치를 같은 정의의 baseline으로 비교하지 않습니다.
Q2에서도 Track1은 전체 주문을 지연·비지연으로 나눠 소수 비율을 출력하는 반면,
Track4 simulation은 지연 배송으로 식별된 주문 집합만 퍼센트로 출력합니다.
지연 상태 판정도 각각 `DELAYED` 정확 일치와 `delay` 포함으로 다르므로
단위와 모집단을 대조하고 동일하다고 가정하지 않습니다.

> **멘트:** “이 결과의 PASS는 시뮬레이션 계약에 대한 판정입니다. 실제 권한이나 현재
> 웹 상태가 통과했다는 뜻은 아닙니다.”

### 별도 화면 — 두 소스 호환 회귀

같은 Bash 세션의 `$DEMO_DIR`와 위에서 만든 `$DEMO_DIR/data`를 사용합니다.
이 경로는 **FabricIQ와 WorkIQ만** 확인하며 WebIQ 근거나 실제 연결의 증거가 아닙니다.
기존 응답과 보고서를 덮어쓰지 않도록 별도 임시 경로를 지정합니다.

```bash
python3 track4/data/run_track3_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/compat" --all --mode normal
python3 track4/data/run_track3_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/compat" --scenario-id Q1 --mode tool-a-down
python3 track4/data/run_track3_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/compat" --scenario-id Q1 --mode tool-b-down
python3 track4/data/run_track3_simulation.py --data-dir "$DEMO_DIR/data" --output-dir "$DEMO_DIR/compat" --scenario-id Q1 --mode both-down
python3 track4/data/evaluate_track3_outputs.py --responses-dir "$DEMO_DIR/compat" --report-path "$DEMO_DIR/compat-report.json" --markdown-report-path "$DEMO_DIR/compat-report.md" --strict
```

`compat-report.md`에서 normal Q1~Q3과 Q1 실패 3종의 **6개 행**을 확인합니다.
이 평가도 존재하는 결과만 판정하므로 누락된 명령이 없는지 함께 확인합니다.

## 화면 3 — 실패와 복구

실패별 JSON에서 `response.overallStatus`, `warnings`, `toolStatus`의 `attempts`를
보여 줍니다. 정책상 일시 오류·429·5xx는 초기 호출 뒤 **5초→10초→20초**, 최대
3회 재시도, 총 최대 4회 시도입니다. 기본 simulation은 대기 시간을 기록하지만 실제로
잠들지 않습니다. 이는 실제 HTTP 재시도를 검증한 것이 아닙니다.

| 모드 | 예상 화면 | 발표자가 설명할 복구 |
| --- | --- | --- |
| `fabric-down` | `partial`, `정형 수치 미검증` | Fabric adapter 연결·권한·지표 schema 점검 후 재실행 |
| `work-down` | `partial`, `업무 문서 근거 없음` | Work adapter·인덱스·ACL·링크 점검 후 재실행 |
| `web-down` | `partial`, `외부 최신 근거 없음` | Web Search 설정·검색어·citation 점검 후 재실행 |
| `internal-down` | `blocked`, 내부 근거 없음 | 두 내부 소스 복구. 웹 citation은 비즈니스 원인 분석에 사용하지 않음 |
| `all-down` | `blocked`, 근거 링크 없음 | 세 소스 복구 후 재실행 |

각 down 소스는 4회 시도 기록을 가집니다. `internal-down`은 WebIQ fixture citation을
비즈니스 외 맥락으로 보존하지만 내부 분석은 차단합니다. 부분응답이 **예상 정책과
일치**하면 테스트 행은 PASS일 수 있어도, 정상적인 전체 근거 응답이 성공했다는 뜻은
아닙니다. `fabric-transient`, `work-transient`, `web-transient`는 첫 시도 실패 후
두 번째 성공을 모의하는 선택 모드입니다. `--simulate-wait`를 지정한 경우에만 실제로
대기합니다. CLI에서 재시도 값을 변경할 수 있어도 고정 정책을 바꾸지 않습니다.

> **멘트:** “문서가 없을 때 숫자를 지어내지 않고 경고합니다. 내부 근거 둘 다 없으면
> 인터넷 결과가 남아도 기업의 원인을 답하지 않습니다.”

## live 구성은 별도 프로젝트

이 저장소의 `run_microsoft_iq_simulation.py`는 endpoint를 호출하지 않습니다.
이 저장소에 FabricIQ·WorkIQ·WebIQ workshop adapter 서버나 세 소스를 실제로 연결하는
완성된 live 실행 서비스가 제공된다고 가정하지 마세요. 운영자가 별도로 구현·배포·승인하고
연결해야 합니다. 원시 제품 URL을 adapter endpoint로 넣어서는 안 됩니다.

승인된 환경이 **이미 준비된 경우에만** 발표자는 다음 순서로 시연합니다.
각 단계에서 미준비·실패가 있으면 중단하고 simulation으로 전환합니다.

1. Foundry 포털에서 승인된 프로젝트와 배포된 모델을 열고, 사전에 운영자가 준비한
   권위 지식과 에이전트의 정책·도구 연결 화면을 확인합니다. UI의 세부 명칭과 도구
   연결 방법은 환경에 따라 다르므로 운영자와 리허설합니다.
2. 준비된 서비스의 FabricIQ와 WorkIQ adapter를 각각 공통 Q2로 확인합니다. FabricIQ의
   수치·trace와 WorkIQ의 내부 링크·접근 권한을 승인된 테스트 사용자로 검토합니다.
   실패를 빈 성공 응답으로 표시하지 않습니다.
3. 승인된 Web Search로 공개용 Q2 질문을 실행하고 실제 citation과 관찰 시각을
   확인합니다. [Track3 live 절차](03-webiq.md)를 따릅니다. 그다음 별도로 구현된
   통합 서비스에서 Q1~Q3을 실행하고 세 출처와 네 IQ의 trace를 확인합니다.
   실제 도구 연결·통합 서비스가 없다면 이 단계는 미구현으로 표시합니다.
4. 응답의 수치와 링크를 원본과 대조하고 제한·오류·사람 승인 여부를 기록합니다.
   외부 실행 조치는 승인 전 수행하지 않습니다. 장애 주입은 별도 승인된 격리 환경에서만
   실행하며, 그렇지 않으면 위 simulation으로 정책을 설명합니다.

| adapter | 공통 POST JSON 요청 | 응답 계약 |
| --- | --- | --- |
| `FABRICIQ_ENDPOINT` | `scenarioId`, `question`, `semanticKeys` | `structuredMetrics`, `highlights`, `sourceTrace` |
| `WORKIQ_ENDPOINT` | 동일 | `evidenceLinks`, `sourceCoverage`, 필요 시 `sourceTrace` |
| 선택 `WEBIQ_ENDPOINT` | 동일 | `webCitations`: `title`, `url`, `domain`, `observedAt`, `scope`, `factStatus`, `limitations` |

권장 live WebIQ 경로는 승인된 Foundry Agent Service의 native Web Search이며 선택
adapter도 가능합니다. 인증·ACL·schema·HTTP 실패를 성공처럼 보이는 빈 결과로 감추지
않습니다. 운영자는 테스트 사용자와 권한, 실제 원문, 출처별 trace 및 오류 복구를 별도
검증해야 합니다.

[Mission Workbench 노트북](../track4/data/Track3_Mission_Workbench.ipynb)의
`TRACK3_EXECUTION_MODE=live`는 **FabricIQ/WorkIQ 두 adapter만** 호출하는 호환 경로입니다.
WebIQ native 검색이나 `WEBIQ_ENDPOINT`를 연결하지 않으며 세 소스 live 통합의 증거가
아닙니다. 노트북은 생성 파일을 덮어쓰고 응답 JSON을 삭제할 수 있으므로 공유·기존
산출물 대신 격리 복사본에서 사용합니다. live 설정 셀은 endpoint를 출력하므로
화면 공유를 중지하고 실행하거나 승인된 방식으로 표시를 가립니다. `FABRICIQ_API_KEY`/
`FABRICIQ_BEARER_TOKEN`, `WORKIQ_API_KEY`/`WORKIQ_BEARER_TOKEN` 등은 해당
adapter의 선택 인증 설정이며 값은 승인된 비밀 관리 경로로만 제공합니다.
별도 승인 없이 live 셀을 실행하지 않습니다.

### 선택: Responses API 문장화

[공용 helper](../track4/data/foundry_responses.py)는 Azure AI Foundry **Responses API**를
호출하는 코드이지 배포된 서버가 아닙니다. 호환 노트북의 선택 셀은
`AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT`, `AZURE_AI_FOUNDRY_MODEL`, 그리고
`AZURE_AI_FOUNDRY_API_KEY` 또는 `AZURE_AI_FOUNDRY_BEARER_TOKEN`을 사용합니다.
API key는 `api-key`, Entra 토큰은 `Authorization: Bearer` 헤더이고 둘 다 있으면
토큰을 우선합니다. 설정이 없으면 노트북의 선택 문장화는 건너뜁니다.
설정이 있으면 simulation 입력이어도 이 셀은 **실제 API를 호출**할 수 있으므로
승인 없이 실행하거나 Run all을 누르지 않습니다.
설정 셀도 Foundry endpoint를 출력할 수 있으므로 화면 공유를 중지하거나 출력을
가립니다. 식별자가 기록된 로그·노트북 출력은 조직 정책에 따라 접근을 제한하고
정리합니다.

이 helper의 기본 프롬프트와 노트북은 2-소스 브리핑 기준입니다. WebIQ 통합 최종화,
외부 citation 보존 및 결과의 사실성은 별도 구현·사람 검토가 필요하며,
LLM 호출 성공만으로 입력 근거가 live임을 증명하지 않습니다.

## 검증 실패와 종료

- 파일/manifest 누락: 경로와 입력을 확인하고 담당자에게 샘플 복원을 요청합니다.
  Track2 생성기는 기존 생성물을 지울 수 있으므로 임의 재생성하지 않습니다.
- strict FAIL: `report.md`의 해당 행과 JSON의 경고·citation·시도 횟수를 비교하고
  원인을 기록한 뒤 새 임시 디렉터리에서 전체 체인을 재실행합니다.
- live 접근 거부·도구 미구성: 운영자에게 권한/설정 보정을 요청하고 simulation으로
  전환합니다. live 상태는 미검증으로 남깁니다. 비밀이나 토큰 값은 화면·문서·로그에
  남기지 않습니다.
- 참고로 [2-소스 호환 harness](../track4/data/README.md)는 별도의 회귀 경로이며
  WebIQ를 포함하지 않습니다. 이름에 `track3`가 있어도 현 Track4의 호환 식별자입니다.

발표 기록에는 실행 모드, 확인한 행, 미검증 항목과 복구 담당자를 남깁니다. live
Web Search 절차는 [Track3 발표자 가이드](03-webiq.md)를 참조합니다.
