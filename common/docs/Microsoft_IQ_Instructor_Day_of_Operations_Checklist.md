# Microsoft IQ 워크숍 강사용 운영 체크리스트

> **현재 canonical Microsoft IQ 워크숍 운영 기준:** 이 체크리스트를 당일 운영 기준으로 사용합니다.
> 1일 운영 480분의 시간표·산출물 기준은
> [Microsoft IQ 워크숍 통합 계획](Microsoft_IQ_Workshop_Integrated_Plan.md)을 함께 따릅니다.

## D-1

- [ ] [Track3 WebIQ source fixture 검증](../../track3/data/README.md) PASS
- [ ] legacy 두 소스 compatibility normal Q1~Q3 strict PASS
- [ ] Microsoft IQ workshop normal Q1~Q3 strict PASS
- [ ] Microsoft IQ workshop fallback 5종 strict PASS
- [ ] live 사용 시 Foundry Web Search가 관리자 정책에서 허용됨
- [ ] live Q2 테스트에서 URL citation 2개 이상 반환
- [ ] 비용·데이터 경계·외부 전송 금지 정보 안내 슬라이드 준비
- [ ] 네트워크/권한 실패 시 simulation 전환 준비
- [ ] Track1 P1은 설명 전용이며 참가자 탐지·수정·제출·Track2 게이트에서 제외됨을 안내

## T-30

```bash
python3 track3/data/validate_webiq_sources.py
cd track4/data
python3 generate_track3_samples.py
python3 run_microsoft_iq_simulation.py --all --mode normal
python3 run_microsoft_iq_simulation.py --scenario-id Q1 --mode fabric-down
python3 run_microsoft_iq_simulation.py --scenario-id Q1 --mode work-down
python3 run_microsoft_iq_simulation.py --scenario-id Q1 --mode web-down
python3 run_microsoft_iq_simulation.py --scenario-id Q1 --mode internal-down
python3 run_microsoft_iq_simulation.py --scenario-id Q1 --mode all-down
python3 evaluate_microsoft_iq_outputs.py --strict
```

- [ ] `microsoft_iq_leadership_briefing.md` 생성
- [ ] Q1~Q3의 WebIQ citation 각 2개 확인
- [ ] fixture 경고 문구 확인
- [ ] 강사 데모 검색어에 내부 식별자·수치가 없는지 확인

## 통합 480분 운영

다음 순서를 유지해 하루 일정으로 운영합니다. 자세한 분 배치는
[canonical 통합 계획](Microsoft_IQ_Workshop_Integrated_Plan.md#current-480-minute-schedule)을 따릅니다.

| 순서 | 세션 | 분 | 강사 게이트 |
|---:|---|---:|---|
| 1 | 오프닝·Microsoft IQ 개념 | 35 | 책임 경계와 simulation/live 차이 설명 |
| 2 | Track1 FabricIQ | 140 | P1 설명 전용, `TRACK2_WORKIQ_HANDOFF_PACKAGE` 제출 |
| 3 | Track2 WorkIQ | 110 | 8개 중 6개 이상 PASS |
| 4 | Track3 WebIQ | 45 | 안전한 검색어, citation 품질 5/6, `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE` |
| 5 | Track4 FoundryIQ | 145 | core 100분 + WebIQ 결합·fallback 45분 |
| 6 | 통합 프로젝트·비교 | 50 | Microsoft IQ trace, 과잉 인과 제거 |
| 7 | 리뷰·복습·클로징 | 20 | 사람 승인과 실행 모드 설명 |
| — | 점심·휴식 | 55 | 트랙 순서를 바꾸지 않음 |

- [ ] Track3 전에 Track2의 내부 근거와 품질 게이트를 확인
- [ ] Track3 citation을 WorkIQ evidence와 별도 필드로 유지
- [ ] Track4에서 Q1~Q3 normal과 fallback 5종을 평가
- [ ] public-web-only 상태가 `blocked`인지 확인
- [ ] simulation fixture가 현재 웹 사실이나 live 서비스 증거가 아님을 발표에 표시

## 1일 압축형 운영

- [ ] Track1/2 사전 산출물을 제공해 설정 시간을 줄임
- [ ] WebIQ는 Q2 하나를 강사와 함께 실행
- [ ] 참가자는 Q1 또는 Q3 중 하나를 팀별 선택
- [ ] Foundry 고급 배포 대신 simulation 정상·fallback에 집중

## 장애 결정표

| 상황 | 즉시 조치 | 판정 |
|---|---|---|
| Web Search 관리자 차단 | fixture로 전환 | simulation으로 계속 |
| citation 0건 | 도구 설정→`tool_choice`→검색어 점검 | 10분 뒤 fixture |
| 출처 품질 낮음 | 공식 도메인·시간·지역 조건 추가 | 미확인으로 표시 |
| WebIQ만 실패 | 내부 브리핑 + 외부 근거 없음 경고 | partial |
| FabricIQ+WorkIQ 실패 | 공개 웹 결과가 있어도 내부 분석 중단 | blocked |
| 민감정보가 검색어에 포함됨 | 즉시 중단·기록·검색어 폐기 | 재작성 후 재개 |

## 종료 전

- [ ] 기존 Track1/2 시나리오·데이터와 Track4 compatibility 산출물이 삭제·대체되지 않음
- [ ] `TRACK4_FOUNDRYIQ_HANDOFF_PACKAGE` 제출
- [ ] Microsoft IQ workshop evaluation failed=0
- [ ] 최종 브리핑에 내부 수치·내부 근거·외부 citation·조치·경고 포함
- [ ] simulation과 live 결과를 명확히 표시
