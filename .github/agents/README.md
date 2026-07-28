# GitHub Copilot Multi-Agent Workshop Environment

이 폴더는 GitHub Copilot CLI가 자동 탐색하는 저장소 범위 Custom Agent 프로필을 제공합니다. 참가자와 운영자는 역할별 Subagent와 `/fleet`을 사용해 3-IQ 워크숍을 병렬 리뷰하고, 안전하게 시뮬레이션·테스트할 수 있습니다.

## 1. 제공 에이전트

| 에이전트 | 역할 | 파일 변경 | 라이브 쓰기 |
|---|---|---:|---:|
| `workshop-fleet-coordinator` | 작업 분해, 의존성·파일 소유권 조정 | 없음 | 금지 |
| `workshop-planner` | 영향 분석, 계획, 완료 기준 | 없음 | 금지 |
| `workshop-coder` | 승인된 코드·설정 구현 | 가능 | 금지 |
| `workshop-tester` | 생성, 문법, dry-run, simulation, 평가 | 생성 산출물만 | 금지 |
| `security-auditor` | 시크릿, 인증, ACL, 권한, 공급망 감사 | 없음 | 금지 |
| `documentation-reviewer` | 문서 동기화, 링크, 명령 검증 | 문서만 | 금지 |
| `workshop-runner` | 참가자 흐름과 당일 운영 리허설 검토 | 없음 | 금지 |

GitHub Copilot CLI 내장 `/review`, `/research`, `/rubber-duck`도 필요에 따라 함께 사용할 수 있습니다.

## 2. 요구 사항과 로드

저장소 루트에서 실행합니다.

```bash
cd "/path/to/Data Platform Workshop"
copilot version
copilot
```

이 환경은 GitHub Copilot CLI `1.0.71-0`에서 확인했습니다. CLI를 이미 실행 중이었다면 새 agent 파일을 로드하도록 종료 후 다시 시작합니다.

대화형 CLI에서 `/agent`를 입력하면 이 폴더의 `*.agent.md` 프로필을 선택할 수 있습니다. 사용자 홈의 `~/.copilot/agents/`에 같은 이름이 있으면 사용자 범위 프로필이 우선합니다.

단일 에이전트는 비대화형으로도 실행할 수 있습니다.

```bash
copilot --agent workshop-planner --prompt "Track3 질문 변경의 영향 범위와 검증 계획을 작성해줘"
copilot --agent security-auditor --prompt "현재 브랜치 diff의 시크릿과 라이브 실행 위험을 감사해줘"
```

## 3. Fleet Mode 기본 원칙

`/fleet`은 독립 작업을 여러 Subagent에 병렬 배정합니다. 각 Subagent는 별도 컨텍스트와 GitHub AI Credits를 사용합니다.

- 병렬화: 서로 다른 파일·모듈의 리뷰, 테스트, 보안감사, 문서 점검
- 순차화: 계획 승인 → 구현 → 구현 완료 후 테스트·감사
- 금지: 같은 파일을 여러 쓰기 에이전트에 동시 배정
- 금지: Fleet 또는 Autopilot에서 M365 `--execute`, 라이브 adapter 호출, secret 생성
- 보호: `generated/`에 기존 변경이 있으면 Tester는 덮어쓰지 않고 BLOCKED 처리
- 권장: `/tasks`로 실행 중인 Subagent와 실패 상태 확인
- 권장: `--allow-all` 대신 필요한 도구만 승인

## 4. 권장 3단계 Fleet 흐름

### 4.1 병렬 계획과 현황 분석

Copilot CLI에서 Plan Mode로 전환하려면 `Shift+Tab`을 사용합니다. 계획을 확정한 뒤 다음과 같이 실행합니다.

```text
/fleet 이 저장소의 변경 요청을 구현 전에 병렬 분석해줘.
@workshop-planner는 영향 범위, 의존성, 완료 기준을 작성하고,
@workshop-tester는 관련 기존 검증 경로와 현재 기준선을 확인하고,
@security-auditor는 시크릿, ACL, 라이브 실행 위험을 감사하고,
@documentation-reviewer는 AGENTS.md 동기화 규칙과 영향 문서를 식별해줘.
이 단계에서는 파일을 수정하지 말고 결과를 하나의 우선순위 계획으로 통합해줘.
```

### 4.2 승인된 구현

분석 결과를 확인한 후, 쓰기 범위를 겹치지 않게 지정합니다.

```text
/fleet 승인된 계획을 구현해줘.
@workshop-coder는 track3/data의 코드 변경만 담당하고,
@documentation-reviewer는 common/docs와 track3 문서 동기화만 담당해줘.
서로 같은 파일을 수정하지 말고, --execute와 라이브 endpoint 호출은 금지해줘.
```

코드와 문서가 같은 계약을 순차적으로 참조해야 한다면 `/fleet`으로 동시에 수정하지 말고 먼저 코드를 완료한 뒤 문서를 갱신합니다.

### 4.3 의존성 포함 최종 게이트

구현이 모두 끝난 뒤 실행합니다.

```text
/fleet 최종 배포 준비도를 병렬 검증해줘.
먼저 @workshop-tester가 AGENTS.md의 비파괴 검증과 Track3 normal/fallback 회귀를 완료하게 해줘.
테스트가 생성 파일 쓰기를 모두 마친 후에만,
@security-auditor는 diff와 완성된 생성 산출물의 시크릿·권한 위험을 감사하고,
@documentation-reviewer는 로컬 링크와 교차 문서 정책 일관성을 병렬 검사해줘.
PASS, FAIL, BLOCKED, NOT RUN을 구분하고 라이브 검증이 필요한 항목을 별도로 정리해줘.
```

## 5. 참가자용 워크숍 리허설

### 전체 워크숍 안전 리허설

```text
/fleet 참가자가 Track1에서 Track3까지 워크숍을 실행할 수 있는지 비파괴 방식으로 리허설해줘.
먼저 @workshop-tester가 Track2 생성·배포 dry-run과 Track3 normal·fallback·strict 평가를 실행하게 해줘.
테스트 완료 후 @workshop-runner는 QUICKSTART와 강사 체크리스트 기준으로 결과, 단계별 준비도, handoff를 점검하고,
@security-auditor는 샘플/격리 원칙, 시크릿, ACL 증적의 충분성을 감사하고,
@documentation-reviewer는 참가자 명령과 링크를 병렬 확인하게 해줘.
M365 --execute, live endpoint, 실제 사용자 데이터는 사용하지 말고 최종 READY/CONDITIONAL/BLOCKED 표를 만들어줘.
```

### Track2 집중 리허설

```text
/fleet Track2 참가자 흐름을 점검해줘.
먼저 @workshop-tester가 60개 샘플 분포와 deployment_config.json dry-run을 검증하게 해줘.
검증 완료 후 @workshop-runner는 Track1 handoff → 키워드 프로브 → 4대 소스 → 품질 8항목 → Track3 handoff 순서와 결과를 검토하고,
@security-auditor는 ACL probe가 실제 security trimming을 과장하지 않는지 감사하게 해줘.
라이브 배포는 하지 마.
```

### Track3 장애 훈련

```text
/fleet Track3 Q1 장애 훈련을 실행해줘.
먼저 @workshop-tester가 normal, tool-a-down, tool-b-down, both-down simulation과 strict 평가를 실행하게 해줘.
실행 완료 후 @workshop-runner는 5초→10초→20초 재시도 및 부분응답 정책을 참가자 관점에서 판정하고,
@security-auditor는 오류가 성공 형태의 빈 응답으로 숨겨지지 않는지 감사하게 해줘.
simulation 결과를 live 결과로 표현하지 마.
```

## 6. 검증 기준

Subagent는 루트 `AGENTS.md`를 최우선으로 적용해야 합니다. 최소 게이트는 다음과 같습니다.

1. Markdown 로컬 링크 깨짐 0건
2. Python 문법 검사 통과
3. Track2 60개 샘플 생성과 배포 dry-run 통과
4. Track1 handoff 및 ACL 보고서가 제공된 경우 strict 검증
5. Track3 샘플 생성, normal simulation, strict 평가 통과
6. 필요 시 Tool A/B 장애와 양쪽 장애 fallback 검증
7. 노트북 JSON·코드 셀, Actions YAML, Logic Apps JSON 구문 확인
8. 소스·노트북·문서·생성 산출물의 하드코딩 시크릿 0건

dry-run과 simulation은 라이브 서비스 또는 ACL을 증명하지 않습니다. 실제 워크숍 GO 판정에는 참가자 계정과 제한 계정의 원본 접근 결과가 별도로 필요합니다.

## 7. 문제 해결

| 증상 | 조치 |
|---|---|
| `/agent`에 프로필이 없음 | 저장소 루트에서 실행했는지 확인하고 Copilot CLI 재시작 |
| 다른 지침이 적용됨 | `~/.copilot/agents/`의 동일 이름 프로필 확인 |
| `/fleet`을 사용할 수 없음 | `copilot version` 확인 후 `copilot update` |
| Subagent 상태를 알 수 없음 | 대화형 CLI에서 `/tasks` 실행 |
| 파일 충돌 발생 | 작업 중단 후 쓰기 소유권을 파일 단위로 다시 분리 |
| 라이브 권한이 필요함 | Fleet를 중단하고 운영자 승인·격리 테넌트·ACL 체크 후 사람이 별도 실행 |

## 8. 공식 참고 자료

- [About custom agents](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-custom-agents)
- [Create custom agents for Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli)
- [Running tasks with `/fleet`](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/fleet)
- [Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
