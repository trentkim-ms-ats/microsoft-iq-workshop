# Track3 질문별 실제 답변

## Q1 (mode=both-down)

**질문:** 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?

**상태:** blocked

**요약:** Q1 실행 결과: blocked

### 핵심 발견 (keyFindings)
- 정형·비정형 도구가 모두 실패해 분석을 지속할 수 없습니다.

### 경고 (warnings)
- ⚠️ Tool A/B 모두 실패: 답변 생성을 중단하고 차단 원인 및 복구 조치만 반환합니다.

### 권장 조치 (recommendedActions)
- 권한/토큰 상태를 먼저 복구합니다.
- 인덱스 범위와 커넥터 상태를 재점검합니다.
- 복구 후 표준 질문 Q1으로 재시도합니다.

### Microsoft IQ 소스 추적 (sourceTrace)
- (없음)

### 근거 링크 (evidenceLinks)
- (없음)

---

## Q1 (mode=normal)

**질문:** 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?

**상태:** pass

**요약:** Q1 실행 결과: pass

### 핵심 발견 (keyFindings)
- 핵심 캠페인 4개를 비교했고 최고 전환율은 BackToSchool, 최저 전환율은 VIPRetention이다.
- payment_status가 Success/RetrySuccess가 아닌 주문은 결제 실패/미확정으로 분류했다.

### 권장 조치 (recommendedActions)
- 근거 링크 접근 권한(ACL) 유효성을 교차 확인합니다.
- 응답 품질 점수(정확도/근거성/환각률)를 기록합니다.

### Microsoft IQ 소스 추적 (sourceTrace)
| iq | role | origin | semanticKeys |
| --- | --- | --- | --- |
| FabricIQ | structured | track1-csv-simulation | CampaignId, OrderId, PaymentStatus |
| WorkIQ | unstructured | track2-manifest-simulation | CampaignId, OrderId, PaymentStatus |

### 근거 링크 (evidenceLinks)
| source | title | businessDate | reference |
| --- | --- | --- | --- |
| Teams | SummerPush 중간 성과 해석 | 2026-05-20T15:00:00+09:00 | teams/threads.json |
| SharePoint | SummerPush 중간 성과 리포트 | 2026-05-20 | sharepoint/Campaigns/02_SummerPush_Mid_Campaign_Performance_Report.docx |
| Outlook | [리더십] 5월 매출 급락 이슈 공유 | 2026-05-18T08:40:00+09:00 | outlook/EM01_sales-drop_message.eml |
| OneDrive | 캠페인 주간 성과 리뷰 노트 | 2026-05-21 | onedrive/MeetingNotes/04_Weekly_Campaign_Performance_Review_Notes.docx |
| SharePoint | SummerPush 캠페인 킥오프 기획서 | 2026-04-15 | sharepoint/Campaigns/01_SummerPush_Campaign_Kickoff_Plan.docx |

---

## Q1 (mode=tool-a-down)

**질문:** 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?

**상태:** partial

**요약:** Q1 실행 결과: partial

### 핵심 발견 (keyFindings)
- (없음)

### 경고 (warnings)
- ⚠️ 정형 수치 미검증

### 권장 조치 (recommendedActions)
- Tool A(FabricIQ) 인증 또는 SQL endpoint 연결을 복구합니다.
- 복구 후 동일 질문으로 정형 지표를 재수집합니다.

### Microsoft IQ 소스 추적 (sourceTrace)
| iq | role | origin | semanticKeys |
| --- | --- | --- | --- |
| WorkIQ | unstructured | track2-manifest-simulation | CampaignId, OrderId, PaymentStatus |

### 근거 링크 (evidenceLinks)
| source | title | businessDate | reference |
| --- | --- | --- | --- |
| Teams | SummerPush 중간 성과 해석 | 2026-05-20T15:00:00+09:00 | teams/threads.json |
| SharePoint | SummerPush 중간 성과 리포트 | 2026-05-20 | sharepoint/Campaigns/02_SummerPush_Mid_Campaign_Performance_Report.docx |
| Outlook | [리더십] 5월 매출 급락 이슈 공유 | 2026-05-18T08:40:00+09:00 | outlook/EM01_sales-drop_message.eml |
| OneDrive | 캠페인 주간 성과 리뷰 노트 | 2026-05-21 | onedrive/MeetingNotes/04_Weekly_Campaign_Performance_Review_Notes.docx |
| SharePoint | SummerPush 캠페인 킥오프 기획서 | 2026-04-15 | sharepoint/Campaigns/01_SummerPush_Campaign_Kickoff_Plan.docx |

---

## Q1 (mode=tool-b-down)

**질문:** 결제 실패가 캠페인 전환율에 미치는 영향은 무엇인가?

**상태:** partial

**요약:** Q1 실행 결과: partial

### 핵심 발견 (keyFindings)
- 핵심 캠페인 4개를 비교했고 최고 전환율은 BackToSchool, 최저 전환율은 VIPRetention이다.
- payment_status가 Success/RetrySuccess가 아닌 주문은 결제 실패/미확정으로 분류했다.

### 경고 (warnings)
- ⚠️ 업무 문서 근거 없음

### 권장 조치 (recommendedActions)
- Tool B(WorkIQ) 권한/인덱스 최신성을 확인합니다.
- 복구 후 동일 질문으로 근거 링크를 재수집합니다.

### Microsoft IQ 소스 추적 (sourceTrace)
| iq | role | origin | semanticKeys |
| --- | --- | --- | --- |
| FabricIQ | structured | track1-csv-simulation | CampaignId, OrderId, PaymentStatus |

### 근거 링크 (evidenceLinks)
- (없음)

---

## Q2 (mode=normal)

**질문:** 배송 지연은 반품률과 고객 불만 티켓에 어떤 영향을 미치는가?

**상태:** pass

**요약:** Q2 실행 결과: pass

### 핵심 발견 (keyFindings)
- 배송 지연 주문 669건 중 반품 발생 비율은 49.78%이다.
- 배송 지연 주문의 COMPLAINT 티켓 비율은 16.14%이다.

### 권장 조치 (recommendedActions)
- 근거 링크 접근 권한(ACL) 유효성을 교차 확인합니다.
- 응답 품질 점수(정확도/근거성/환각률)를 기록합니다.

### Microsoft IQ 소스 추적 (sourceTrace)
| iq | role | origin | semanticKeys |
| --- | --- | --- | --- |
| FabricIQ | structured | track1-csv-simulation | OrderId, DeliveryStatus, ReturnId, TicketId |
| WorkIQ | unstructured | track2-manifest-simulation | OrderId, DeliveryStatus, ReturnId, TicketId |

### 근거 링크 (evidenceLinks)
| source | title | businessDate | reference |
| --- | --- | --- | --- |
| Teams | 주문 취소율과 배송 지연 상관 점검 | 2026-05-24T14:00:00+09:00 | teams/threads.json |
| SharePoint | 배송 지연 원인 분석 및 고객 영향 | 2026-05-23 | sharepoint/Operations/06_Delivery_Delay_Root_Cause_and_Customer_Impact.docx |
| Outlook | 반품 사유 월간 요약 - 채널 및 고객등급 검토 | 2026-05-25T16:30:00+09:00 | outlook/EM07_returns_message.eml |
| OneDrive | 반품 VOC 분류 워크숍 노트 | 2026-05-25 | onedrive/MeetingNotes/05_Return_VOC_Classification_Workshop_Notes.docx |
| Outlook | RE: [긴급] 핵심 상품 재고 부족 및 캠페인 노출 조정 요청 | 2026-05-17T08:50:00+09:00 | outlook/EM06_stockout_reply.eml |

---

## Q3 (mode=normal)

**질문:** Q3 핵심 상품 3종의 매출/반품 신호를 어떻게 해석할 것인가?

**상태:** pass

**요약:** Q3 실행 결과: pass

### 핵심 발견 (keyFindings)
- Q3 핵심 상품 3종(AeroPhone X, SmartWatch Pro, UltraBook 15)을 동일 기준으로 비교했다.
- 주문 수, 매출, 반품률을 함께 보고 대응 우선순위를 선정한다.

### 권장 조치 (recommendedActions)
- 근거 링크 접근 권한(ACL) 유효성을 교차 확인합니다.
- 응답 품질 점수(정확도/근거성/환각률)를 기록합니다.

### Microsoft IQ 소스 추적 (sourceTrace)
| iq | role | origin | semanticKeys |
| --- | --- | --- | --- |
| FabricIQ | structured | track1-csv-simulation | ProductId, OrderId, ReturnId |
| WorkIQ | unstructured | track2-manifest-simulation | ProductId, OrderId, ReturnId |

### 근거 링크 (evidenceLinks)
| source | title | businessDate | reference |
| --- | --- | --- | --- |
| SharePoint | Q3 리더십 운영 리스크 브리핑 | 2026-07-11 | sharepoint/Leadership/12_Q3_Leadership_Operational_Risk_Briefing.docx |
| Outlook | RE: BackToSchool 캠페인 조건부 승인 요청 | 2026-07-11T09:30:00+09:00 | outlook/EM12_backtoschool_reply.eml |
| OneDrive | 재고·물류·CS 합동 회의록 | 2026-05-17 | onedrive/MeetingNotes/03_Inventory_Logistics_CS_Joint_Meeting_Notes.docx |
| Teams | 핵심 상품 품절 임박 공동 대응 | 2026-05-16T09:00:00+09:00 | teams/threads.json |
| Outlook | [긴급] 핵심 상품 재고 부족 및 캠페인 노출 조정 요청 | 2026-05-16T09:15:00+09:00 | outlook/EM05_stockout_message.eml |

---
