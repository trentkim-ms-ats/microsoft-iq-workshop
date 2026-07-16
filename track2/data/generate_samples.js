"use strict";

const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const ROOT = __dirname;
const OUT = path.join(ROOT, "generated");
const TABLE_WIDTH = 9026;
const COLORS = {
  navy: "17365D",
  blue: "2F75B5",
  lightBlue: "D9EAF7",
  gray: "F2F2F2",
  border: "B7C9DA",
  red: "C00000",
};

const people = {
  ceo: ["김서연", "CEO"],
  cfo: ["박준호", "CFO"],
  cdo: ["이현지", "CDO"],
  marketing: ["최민석", "마케팅 리드"],
  growth: ["한유진", "그로스 분석가"],
  payments: ["정도윤", "결제 플랫폼 리드"],
  inventory: ["오지훈", "재고 운영 리드"],
  logistics: ["윤가영", "물류 운영 리드"],
  cs: ["배수민", "CS 티어2 리드"],
  crm: ["송하늘", "CRM 리드"],
  data: ["임채원", "데이터 품질 리드"],
  finance: ["서지민", "재무 분석 리드"],
};

const facts = {
  campaign:
    "Track1 캠페인 기준: SummerPush(CA00001, Social, 2026-04-15~06-15), BackToSchool(CA00002, OnlineMall, 2026-07-15~08-31), VIPRetention(CA00003, MobileApp, 2026-05-01~05-31), FlashWeek(CA00004, OfflineStore, 2026-05-10~05-17).",
  inventory:
    "2026-05-16 재고 스냅샷: AeroPhone X 4/예약 30(S09001), SmartWatch Pro 3/예약 25(S09002), UltraBook 15 6/예약 40(S09003).",
  fulfillment:
    "연결 주문/배송/CS: AeroPhone X O09001-SH09001 Delayed-T09001 NoTrackingUpdate, SmartWatch Pro O09002-SH09002 Delayed-T09002 LateDelivery, UltraBook 15 O09003-SH09003 InTransit-T09003 NoTrackingUpdate.",
  payments:
    "Track1 결제 2,004건: Success 670, Failed 667, RetrySuccess 666, 상태 결측 1건(PAY00019). RetrySuccess는 상태와 재시도 여부가 섞인 비표준 코드다.",
  attribution:
    "현재 귀속 추출에서 BackToSchool은 5개 귀속행/3,987.76 귀속매출(실패 2, 재시도성공 2, 성공 1), FlashWeek는 4개 귀속행/2,450.26 귀속매출(실패 2, 재시도성공 1, 성공 1)이다.",
  returns:
    "반품 1,000건은 LateDelivery/NotAsDescribed/ChangedMind/Damaged 각 200건, SizeIssue 199건, 사유 결측 1건(R00011)이며 MobileApp과 OfflineStore에 각 500건 집중됐다.",
  promotions:
    "프로모션 1,000건은 Amount/Bundle/BOGO/Percent 각 250건이다. Percent 마진 프록시는 0.6521로 다른 유형(약 0.9815~0.9824)보다 낮다.",
  quality:
    "Track1 의도 이슈: FK 고아 PAY90001->O99999, T90001->C99999; SH00001 중복; 결측 5건; 이상값 P00050/PR00050/S00050/O00033; 금액 불일치 O00007(+10), O00600(-25).",
  products:
    "Track1 명명 상품: UltraBook 15(P00001, Electronics, 13.70), DailyTee Cotton(P00002, Fashion, 17.40), ComfyChair Home(P00003, Home, 21.10), AeroPhone X(P00005, Electronics, 28.50), SmartWatch Pro(P00006, Electronics, 32.20). P00050은 unit_price=0 이상값으로 카탈로그 검증에서 제외한다.",
  tiers:
    "고객 1,200명은 Bronze/Silver/Gold/Platinum 각 300명이다. 대표 고객: C00002 Silver, C00003 Platinum, C00004 Gold, C00005 Bronze. C00007은 customer_segment 결측으로 등급 집계에서 별도 표시한다.",
  channelReturns:
    "반품 1,000건은 MobileApp과 OfflineStore에 각 500건 집중됐고 Gold와 Bronze 등급이 각 500건을 차지한다. Silver/Platinum 사례는 소량이지만 VIPRetention 여정 근거와 함께 검토한다.",
  orders:
    "주문 2,003건은 완료 상태가 대부분이며 취소·환불 흐름과 배송 지연이 겹치는 구간을 별도로 표시한다. 이상 주문: O00013 order_date 결측, O00007 금액 +10, O00600 금액 -25, O00033 음수 수량이다.",
  tickets:
    "CS 티켓은 Shipping/Inquiry/Complaint/Payment/Return 유형으로 분포하며 Q3 명명 티켓 T09001~T09003이 배송·추적 지연과 연결된다. 이상: T90001 고아 고객(C99999), T00005 사유 결측이다.",
};

const sharePointDocs = [
  {
    id: "SP01",
    file: "01_SummerPush_Campaign_Kickoff_Plan.docx",
    folder: "Campaigns",
    title: "SummerPush 캠페인 킥오프 기획서",
    type: "Campaign Plan",
    date: "2026-04-15",
    owner: people.marketing,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["SummerPush", "Social", "CA00001", "전환율"],
    summary: "Social 채널 SummerPush의 목표, 측정 체계, 결제 실패 리스크와 운영 역할을 정의한다.",
    sections: [
      ["캠페인 범위", [facts.campaign, "목표는 신규 유입의 주문 전환과 반복 구매 신호를 함께 측정하는 것이다."]],
      ["핵심 KPI", ["노출 대비 주문 전환율, 결제 승인율, RetrySuccess 비중, 순매출, 캠페인 귀속매출을 주간 단위로 점검한다."]],
      ["의존성과 리스크", [facts.payments, "결제 실패는 Campaign -> CampaignAttribution -> Order -> Payment 경로로 검증한다."]],
      ["운영 결정", ["마케팅은 캠페인 문구를, 결제팀은 실패/재시도 원인을, 데이터팀은 정의와 코드셋을 담당한다."]],
    ],
  },
  {
    id: "SP02",
    file: "02_SummerPush_Mid_Campaign_Performance_Report.docx",
    folder: "Campaigns",
    title: "SummerPush 중간 성과 리포트",
    type: "Performance Report",
    date: "2026-05-20",
    owner: people.growth,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["SummerPush", "결제 실패", "RetrySuccess", "전환율"],
    summary: "SummerPush 중간 성과와 결제 실패가 전환 손실에 미치는 영향을 리더십 검토용으로 정리한다.",
    sections: [
      ["관측 결과", [facts.payments, "실패와 재시도 성공을 단일 성공률로 합치지 않고 최초 승인과 회복 전환을 분리한다."]],
      ["해석 제한", ["현재 귀속 추출에서 SummerPush 직접 귀속행이 보이지 않으므로 결과를 0으로 단정하지 않고 범위/매핑 누락을 우선 확인한다."]],
      ["조치", ["PAY00019 상태 결측을 보정하고, RetrySuccess를 AUTHORIZED + is_retry=true 구조로 분리한 뒤 지표를 재산출한다."]],
      ["리더십 요청", ["캠페인 증액 전에 결제 실패 원인과 귀속 데이터 완전성 검증 결과를 함께 승인받는다."]],
    ],
  },
  {
    id: "SP03",
    file: "03_BackToSchool_Prelaunch_Checklist.docx",
    folder: "Campaigns",
    title: "BackToSchool 캠페인 사전 준비 체크리스트",
    type: "Launch Readiness",
    date: "2026-07-10",
    owner: people.marketing,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["BackToSchool", "OnlineMall", "CA00002", "AeroPhone X"],
    summary: "BackToSchool 시작 전 결제, 재고, 물류, CS, 데이터 품질의 Go/No-Go 조건을 점검한다.",
    sections: [
      ["캠페인 조건", [facts.campaign, facts.attribution]],
      ["재고/배송 준비", [facts.inventory, facts.fulfillment]],
      ["Go/No-Go 기준", ["핵심 상품 예약수량이 가용재고를 초과하면 노출을 제한하고 배송 약속 문구를 조정한다.", "결제 Failed 비중과 RetrySuccess 회복률을 분리해 보고한다."]],
      ["승인", ["마케팅, 결제, 재고, 물류, CS, 데이터 품질 책임자가 각 근거 링크를 확인한 후 최종 승인한다."]],
    ],
  },
  {
    id: "SP04",
    file: "04_VIPRetention_Platinum_Churn_Prevention_Playbook.docx",
    folder: "Campaigns",
    title: "VIPRetention Platinum 고객 이탈 방지 플레이북",
    type: "Retention Playbook",
    date: "2026-05-12",
    owner: people.crm,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["VIPRetention", "Platinum", "MobileApp", "CA00003"],
    summary: "Platinum 고객의 결제·배송·반품 이상 신호를 묶어 VIPRetention 대응 우선순위를 정한다.",
    sections: [
      ["대상 정의", ["VIPRetention(CA00003)은 MobileApp 채널의 Retention 캠페인이다.", "대표 확인 대상은 C00003(New/Platinum)이며 C00007은 Platinum이지만 customer_segment가 결측이다."]],
      ["위험 신호", [facts.returns, "결제 실패, 배송 지연, NotAsDescribed 반품, 반복 CS 문의를 복합 위험 신호로 본다."]],
      ["대응 원칙", ["개별 고객 조치 전 원본 주문·결제·배송·반품 링크를 확인하고, 결측 세그먼트는 임의 추정하지 않는다."]],
      ["측정", ["7일 내 재구매, 문의 재발, 보상 수락, 캠페인 반응을 분리해 기록한다."]],
    ],
  },
  {
    id: "SP05",
    file: "05_FlashWeek_Promotion_Settlement_Review.docx",
    folder: "Campaigns",
    title: "FlashWeek 프로모션 정산 검토",
    type: "Finance Review",
    date: "2026-05-18",
    owner: people.finance,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["FlashWeek", "Percent", "마진", "CA00004"],
    summary: "FlashWeek의 귀속매출, 결제 상태, 프로모션 유형별 마진 프록시를 검토한다.",
    sections: [
      ["대상", [facts.campaign, facts.attribution]],
      ["프로모션 관측", [facts.promotions, "PR00050의 discount_amount=-5.00은 유효성 위반이므로 정산에서 격리한다."]],
      ["정산 원칙", ["Failed 결제는 실현매출로 보지 않고 RetrySuccess는 승인 성공과 재시도 여부를 분리한다.", "O00007과 O00600의 금액 불일치는 원장 대조 후 확정한다."]],
      ["결정", ["Percent 유형은 증분매출뿐 아니라 마진 훼손과 재구매 신호를 함께 검토한다."]],
    ],
  },
  {
    id: "SP06",
    file: "06_Delivery_Delay_Root_Cause_and_Customer_Impact.docx",
    folder: "Operations",
    title: "배송 지연 원인 분석 및 고객 영향",
    type: "Root Cause Analysis",
    date: "2026-05-23",
    owner: people.logistics,
    status: "Draft",
    acl: "Workshop-Participants",
    keywords: ["배송 지연", "VIPRetention", "Platinum", "반품률"],
    summary: "재고 부족에서 배송 지연, CS 문의, 반품으로 이어지는 경로와 VIP 고객 영향을 분석한다.",
    sections: [
      ["사건 연결", [facts.inventory, facts.fulfillment]],
      ["고객 영향", [facts.returns, "VIPRetention 대상 Platinum 고객은 배송 약속 위반 시 우선 연락 대상으로 분류한다."]],
      ["원인 가설", ["예약수량이 가용재고를 초과한 상태에서 캠페인 노출이 유지됐고, 배송 예정일 변경 공지가 늦었다."]],
      ["후속 조치", ["상품별 약속일 재계산, CS 선제 공지, 재고-캠페인 노출 게이트를 적용한다."]],
    ],
  },
  {
    id: "SP07",
    file: "07_UltraBook15_Stockout_Response_Playbook.docx",
    folder: "Operations",
    title: "UltraBook 15 재고 부족 대응 플레이북",
    type: "Operations Playbook",
    date: "2026-05-16",
    owner: people.inventory,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["UltraBook 15", "S09003", "O09003", "SH09003"],
    summary: "UltraBook 15의 재고 부족과 배송/CS 대응 절차를 정의한다.",
    sections: [
      ["트리거", [facts.inventory, "UltraBook 15은 on_hand 6, reserved 40으로 가용 부족 상태다."]],
      ["영향 주문", [facts.fulfillment, "O09003은 SH09003 InTransit 및 T09003 NoTrackingUpdate와 연결된다."]],
      ["단계별 대응", ["신규 노출 제한, 공급 일정 확인, 배송 약속 재산정, 대상 고객 공지, CS 스크립트 갱신 순으로 처리한다."]],
      ["종료 기준", ["가용재고가 예약수량을 충족하고 영향 주문의 추적정보가 갱신되면 사건을 종료한다."]],
    ],
  },
  {
    id: "SP08",
    file: "08_Promotion_Type_Margin_Analysis.docx",
    folder: "Analytics",
    title: "프로모션 유형별 마진 분석",
    type: "Analysis",
    date: "2026-05-19",
    owner: people.finance,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["Percent", "Amount", "Bundle", "BOGO", "FlashWeek"],
    summary: "프로모션 유형별 마진 프록시와 데이터 유효성 이슈를 비교한다.",
    sections: [
      ["분포", [facts.promotions]],
      ["해석", ["Percent 유형은 다른 유형보다 마진 프록시가 크게 낮아 할인 상한과 대상 세그먼트 재검토가 필요하다."]],
      ["데이터 주의", ["PR00050 음수 할인과 주문-아이템 금액 불일치 2건을 제외/보정한 기준값도 병기한다."]],
      ["권고", ["FlashWeek 후속 캠페인은 Percent 일괄 할인 대신 Bundle/Amount 대안을 A/B 검증한다."]],
    ],
  },
  {
    id: "SP09",
    file: "09_Return_Analysis_by_Channel_and_Customer_Tier.docx",
    folder: "Analytics",
    title: "채널 및 고객등급별 반품 분석",
    type: "Analysis",
    date: "2026-05-26",
    owner: people.growth,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["Platinum", "MobileApp", "OfflineStore", "NotAsDescribed"],
    summary: "반품 사유, 채널, 고객등급을 교차 분석해 VIPRetention과 CS 개선 근거를 제공한다.",
    sections: [
      ["전체 분포", [facts.returns]],
      ["고객등급 해석", ["Gold와 Bronze가 각각 500건으로 관측됐으며, Platinum 사례는 별도 고객 여정 근거와 함께 검토한다."]],
      ["품질 주의", ["R00011의 return_reason 결측은 Unknown으로 임의 치환하지 않고 원본 확인 상태를 표시한다."]],
      ["조치", ["NotAsDescribed는 상품 상세 설명 개선, LateDelivery는 배송 약속/추적 공지 개선으로 분리한다."]],
    ],
  },
  {
    id: "SP10",
    file: "10_Payment_Failure_and_Retry_Postmortem.docx",
    folder: "Operations",
    title: "결제 실패 및 재시도 사후 분석",
    type: "Incident Review",
    date: "2026-05-21",
    owner: people.payments,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["결제 실패", "RetrySuccess", "PAY00019", "AeroPhone X"],
    summary: "결제 실패와 재시도 회복을 분리하고 캠페인 전환 지표에 미치는 영향을 정리한다.",
    sections: [
      ["현황", [facts.payments, facts.attribution]],
      ["코드 의미", ["RetrySuccess는 AUTHORIZED 결과와 is_retry=true 속성으로 분리해야 최초 성공률과 회복률을 계산할 수 있다."]],
      ["품질 차단", ["PAY00019 상태 결측과 PAY90001 고아 주문 참조를 격리하고 영향 지표를 다시 계산한다."]],
      ["예방", ["결제 이벤트 스키마에 attempt_count, failure_reason, gateway_code를 추가하고 캠페인 귀속과 동일 시간대를 사용한다."]],
    ],
  },
  {
    id: "SP11",
    file: "11_Track1_Data_Quality_Improvement_Register.docx",
    folder: "DataQuality",
    title: "Track1 데이터 품질 개선 등록부",
    type: "Data Quality Register",
    date: "2026-05-27",
    owner: people.data,
    status: "Restricted",
    acl: "Workshop-Data-Stewards",
    keywords: ["PAY90001", "T90001", "SH00001", "O00007", "O00600"],
    summary: "Track1에서 발견된 무결성, 결측, 이상값, 코드셋, 금액 정합성 이슈의 처리 상태를 기록한다.",
    sections: [
      ["요약", [facts.quality]],
      ["우선순위", ["P0: FK 고아와 PK 중복, P1: 금액 불일치와 음수/0 이상값, P2: 결측과 코드셋 표준화로 분류한다."]],
      ["처리 원칙", ["원천값을 덮어쓰지 않고 정제 계층에서 표준값과 보정 사유를 기록한다.", "이슈별 원본 행, 규칙 ID, 담당자, 상태, 검증 결과를 추적한다."]],
      ["Track2 영향", ["검색 문서가 잘못된 수치를 단정하지 않도록 품질 경고와 근거 링크를 함께 전달한다."]],
    ],
  },
  {
    id: "SP12",
    file: "12_Q3_Leadership_Operational_Risk_Briefing.docx",
    folder: "Leadership",
    title: "Q3 리더십 운영 리스크 브리핑",
    type: "Leadership Briefing",
    date: "2026-07-11",
    owner: people.cdo,
    status: "Final",
    acl: "Workshop-Leaders",
    keywords: ["BackToSchool", "AeroPhone X", "SmartWatch Pro", "UltraBook 15"],
    summary: "BackToSchool 시작 전 결제·재고·배송·CS·데이터 품질의 주요 리스크와 결정을 한 페이지로 정리한다.",
    sections: [
      ["핵심 위험", [facts.attribution, facts.inventory, facts.fulfillment]],
      ["품질 경고", [facts.quality, "귀속 추출 범위와 비표준 결제 상태를 보정하기 전 캠페인 성과를 확정하지 않는다."]],
      ["결정 요청", ["핵심 상품 노출 제한, 배송 약속 변경, RetrySuccess 지표 분리, 제한 문서 ACL 확인을 승인한다."]],
      ["다음 점검", ["2026-07-14 16:00 KST Go/No-Go 회의에서 원본 근거 링크와 담당자별 완료 상태를 확인한다."]],
    ],
  },
  {
    id: "SP13",
    file: "13_Deep_Dive_Return_Analysis_by_Channel_and_Tier.docx",
    folder: "Analytics",
    title: "채널 및 고객등급별 반품 심층 분석",
    type: "Analysis",
    date: "2026-06-02",
    owner: people.growth,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["ChangedMind", "Damaged", "SizeIssue", "Gold", "Silver", "Bronze"],
    summary: "반품 사유 5종을 채널과 고객등급(Bronze/Silver/Gold/Platinum) 축으로 세분화해 CS·상품·물류 개선 우선순위를 도출한다.",
    sections: [
      ["표본 정의", [facts.returns, facts.tiers]],
      ["채널·등급 교차", [facts.channelReturns, "MobileApp 반품은 SizeIssue/NotAsDescribed 비중이 높고, OfflineStore는 Damaged/LateDelivery 비중이 높은 것으로 관측된다."]],
      ["사유별 조치", ["NotAsDescribed는 상품 상세 개선, SizeIssue는 사이즈 가이드 보강, Damaged는 포장·물류 점검, ChangedMind는 반품 정책 커뮤니케이션으로 분리한다."]],
      ["품질 주의", ["R00011 사유 결측은 Unknown 치환 없이 원본 확인 상태로 표시하고 등급 결측 고객(C00007)은 별도 버킷으로 집계한다."]],
    ],
  },
  {
    id: "SP14",
    file: "14_Non_Electronics_Demand_and_Inventory_Review.docx",
    folder: "Operations",
    title: "비전자 카테고리 수요 및 재고 리뷰",
    type: "Operations Review",
    date: "2026-06-04",
    owner: people.inventory,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["ComfyChair Home", "DailyTee Cotton", "BackToSchool", "SummerPush"],
    summary: "Home/Fashion 카테고리(ComfyChair Home, DailyTee Cotton)의 수요와 재고를 검토해 캠페인 노출 계획을 보완한다.",
    sections: [
      ["대상 상품", [facts.products]],
      ["수요 신호", ["ComfyChair Home(P00003)은 SummerPush 기간 홈 카테고리 유입이 완만히 증가했고, DailyTee Cotton(P00002)은 BackToSchool 번들 후보로 검토된다."]],
      ["재고 상태", ["전자 핵심 상품(AeroPhone X/SmartWatch Pro/UltraBook 15)과 달리 비전자 카테고리는 재고 여유가 있어 노출 확대 여지가 있다."]],
      ["권고", ["ComfyChair Home과 DailyTee Cotton을 BackToSchool 보조 소재로 배치하되 P00050 이상값(price 0)은 카탈로그 노출에서 제외한다."]],
    ],
  },
  {
    id: "SP15",
    file: "15_DailyTeeCotton_Product_Description_Improvement_Report.docx",
    folder: "Campaigns",
    title: "DailyTee Cotton 상세 설명 개선 리포트",
    type: "Content Review",
    date: "2026-06-06",
    owner: people.marketing,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["DailyTee Cotton", "NotAsDescribed", "SizeIssue", "Silver"],
    summary: "DailyTee Cotton의 NotAsDescribed/SizeIssue 반품을 줄이기 위한 상세 페이지·사이즈 가이드 개선안을 정리한다.",
    sections: [
      ["문제 정의", ["DailyTee Cotton(P00002)은 설명 불일치와 사이즈 이슈 반품이 반복되며 Silver·Gold 등급 고객 문의가 함께 증가한다.", facts.channelReturns]],
      ["원인", ["상세 페이지 소재(색상/핏/원단)와 실제 배송 상품 간 표현 차이, 사이즈표 부재가 주요 원인으로 추정된다."]],
      ["개선안", ["색상·핏 실측 사진 추가, 사이즈 가이드 표 삽입, 리뷰 요약을 상세 상단에 배치한다."]],
      ["검증", ["개선 후 NotAsDescribed/SizeIssue 반품률과 Silver 등급 재구매율을 4주 관찰하고 VIPRetention 접촉과 중복되지 않게 한다."]],
    ],
  },
];

const oneDriveDocs = [
  {
    id: "OD01",
    file: "01_Platinum_Customer_DailyTeeCotton_Return_Meeting_Notes.docx",
    folder: "MeetingNotes",
    title: "Platinum 고객 DailyTee Cotton 반품 미팅 노트",
    type: "Meeting Notes",
    date: "2026-05-22",
    owner: people.crm,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["Platinum", "DailyTee Cotton", "NotAsDescribed", "VIPRetention"],
    summary: "Platinum 고객의 DailyTee Cotton 반품 사례를 VIPRetention 관점에서 검토한다.",
    sections: [
      ["참석자", ["CRM, CS, 상품, 데이터 품질 담당자가 참석했다."]],
      ["논의", [facts.returns, "DailyTee Cotton의 설명 불일치와 배송 경험을 분리해 확인한다."]],
      ["결정", ["고객 보상 전에 주문/배송/반품 원본을 확인하고 VIPRetention 접촉 이력과 중복되지 않게 한다."]],
      ["후속 조치", ["CS는 VOC 원문, 상품팀은 상세 페이지 변경안, 데이터팀은 R00011 결측 영향도를 공유한다."]],
    ],
  },
  {
    id: "OD02",
    file: "02_Payment_Incident_War_Room_Notes.docx",
    folder: "MeetingNotes",
    title: "결제 장애 워룸 회의록",
    type: "Incident Meeting",
    date: "2026-05-19",
    owner: people.payments,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["AeroPhone X", "RetrySuccess", "SummerPush", "PAY00019"],
    summary: "결제 실패 급증과 재시도 회복, 캠페인 전환 영향의 조사 항목을 확정한다.",
    sections: [
      ["현황", [facts.payments]],
      ["결정", ["Failed와 RetrySuccess를 별도 KPI로 보고하고 PAY00019는 결측 상태로 명시한다."]],
      ["조사", ["AeroPhone X 주문과 SummerPush 유입 주문을 Campaign -> Order -> Payment 경로로 재현한다."]],
      ["담당/기한", ["결제팀은 게이트웨이 코드, 데이터팀은 귀속 범위, 마케팅은 전환 지표를 2026-05-20까지 공유한다."]],
    ],
  },
  {
    id: "OD03",
    file: "03_Inventory_Logistics_CS_Joint_Meeting_Notes.docx",
    folder: "MeetingNotes",
    title: "재고·물류·CS 합동 회의록",
    type: "Operations Meeting",
    date: "2026-05-17",
    owner: people.inventory,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["AeroPhone X", "SmartWatch Pro", "UltraBook 15", "배송 지연"],
    summary: "세 핵심 상품의 재고 부족, 배송 상태, CS 티켓을 연결해 선제 대응을 합의한다.",
    sections: [
      ["사실", [facts.inventory, facts.fulfillment]],
      ["결정", ["AeroPhone X와 SmartWatch Pro는 신규 약속일을 재계산하고 UltraBook 15은 추적정보 갱신을 우선한다."]],
      ["고객 공지", ["NoTrackingUpdate와 LateDelivery를 구분한 안내문을 사용하고 캠페인 노출을 재고 상태와 연동한다."]],
      ["후속 조치", ["재고 10:00, 물류 14:00, CS 17:00 KST 기준으로 동일 상품 키를 사용해 상황을 갱신한다."]],
    ],
  },
  {
    id: "OD04",
    file: "04_Weekly_Campaign_Performance_Review_Notes.docx",
    folder: "MeetingNotes",
    title: "캠페인 주간 성과 리뷰 노트",
    type: "Weekly Review",
    date: "2026-05-21",
    owner: people.growth,
    status: "Draft",
    acl: "Workshop-Participants",
    keywords: ["SummerPush", "FlashWeek", "BackToSchool", "전환율"],
    summary: "캠페인별 데이터 범위, 결제 상태, 귀속 결과와 다음 실험을 검토한다.",
    sections: [
      ["범위", [facts.campaign, facts.attribution]],
      ["제약", ["SummerPush와 VIPRetention 직접 귀속행 부재는 성과 0이 아니라 추출/매핑 검증 과제로 기록한다."]],
      ["실험", ["FlashWeek Percent 할인과 대체 유형의 마진 차이를 비교하고 BackToSchool에 사전 적용한다."]],
      ["액션", ["동일 쿼리와 기준 시각을 Track3 재현 질의에 포함한다."]],
    ],
  },
  {
    id: "OD05",
    file: "05_Return_VOC_Classification_Workshop_Notes.docx",
    folder: "MeetingNotes",
    title: "반품 VOC 분류 워크숍 노트",
    type: "Workshop Notes",
    date: "2026-05-25",
    owner: people.cs,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["NotAsDescribed", "LateDelivery", "MobileApp", "OfflineStore"],
    summary: "반품 사유 코드와 VOC 표현을 정렬해 WorkIQ 검색 및 Ontology 매핑 기준을 정의한다.",
    sections: [
      ["기준 분포", [facts.returns]],
      ["용어 정렬", ["배송 늦음/지연 배송은 LateDelivery, 설명과 다름/상품 설명 불일치는 NotAsDescribed로 매핑한다."]],
      ["예외", ["R00011처럼 사유가 비어 있는 경우 Unknown으로 확정하지 않고 원본 확인 필요 상태로 둔다."]],
      ["산출물", ["표준 용어, 별칭, 제외어, 예시 문장을 검색 재현 세트에 포함한다."]],
    ],
  },
  {
    id: "OD06",
    file: "06_Data_Quality_Improvement_Meeting_Notes.docx",
    folder: "MeetingNotes",
    title: "Track1 데이터 품질 개선 회의록",
    type: "Data Quality Meeting",
    date: "2026-05-27",
    owner: people.data,
    status: "Restricted",
    acl: "Workshop-Data-Stewards",
    keywords: ["PAY90001", "T90001", "SH00001", "RetrySuccess"],
    summary: "Track1 품질 이슈의 수정 순서와 Track2 문서 인용 정책을 결정한다.",
    sections: [
      ["발견", [facts.quality]],
      ["결정", ["고아 FK와 중복 PK를 먼저 격리하고 원천/정제 값을 모두 보존한다.", "RetrySuccess는 AUTHORIZED와 is_retry로 분리한다."]],
      ["Track2 정책", ["미보정 수치를 인용할 때는 품질 경고, 기준 시각, 원본 검증 상태를 표시한다."]],
      ["담당", ["데이터 품질 리드는 규칙 결과, 도메인 리드는 보정 승인, 강사는 워크숍 정답 범위를 관리한다."]],
    ],
  },
  {
    id: "OD07",
    file: "07_Leadership_Breakfast_Briefing_Template.docx",
    folder: "Briefings",
    title: "리더십 조식 브리핑 템플릿",
    type: "Briefing Template",
    date: "2026-05-01",
    owner: people.cdo,
    status: "Template",
    acl: "Workshop-Participants",
    keywords: ["정형 지표", "M365 근거", "원본 링크", "조치안"],
    summary: "Track3에서 정형 지표와 M365 근거를 결합하는 브리핑 구조를 제공한다.",
    sections: [
      ["한 줄 결론", ["무엇이 발생했고 왜 중요한지 한 문장으로 작성한다."]],
      ["정형 근거", ["FabricIQ 지표, 기준 시각, 엔터티/관계 경로, 품질 경고를 기록한다."]],
      ["업무 근거", ["WorkIQ 문서 제목, 소스, 작성자, 날짜, 원본 링크를 기록한다."]],
      ["결정/조치", ["담당자, 기한, 기대 효과, 재검증 조건을 명시한다."]],
    ],
  },
  {
    id: "OD08",
    file: "08_BackToSchool_Go_No_Go_Meeting_Notes.docx",
    folder: "MeetingNotes",
    title: "BackToSchool Go/No-Go 회의록",
    type: "Decision Meeting",
    date: "2026-07-11",
    owner: people.marketing,
    status: "Final",
    acl: "Workshop-Leaders",
    keywords: ["BackToSchool", "OnlineMall", "AeroPhone X", "Go/No-Go"],
    summary: "BackToSchool 시작 전 핵심 상품과 결제 리스크의 조건부 승인 결정을 기록한다.",
    sections: [
      ["근거", [facts.attribution, facts.inventory]],
      ["결정", ["캠페인은 조건부 Go로 하되 재고 부족 상품의 노출과 배송 약속을 제한한다."]],
      ["조건", ["결제 Failed/RetrySuccess 분리 보고, 핵심 상품 재고 갱신, CS 안내문 승인, ACL 점검 완료가 필요하다."]],
      ["재점검", ["2026-07-14 16:00 KST에 근거 링크 5개와 재현 질의 3개를 확인한다."]],
    ],
  },
  {
    id: "OD09",
    file: "09_FlashWeek_Margin_Decision_Notes.docx",
    folder: "MeetingNotes",
    title: "FlashWeek 마진 의사결정 노트",
    type: "Decision Notes",
    date: "2026-05-19",
    owner: people.finance,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["FlashWeek", "Percent", "Bundle", "마진"],
    summary: "FlashWeek 이후 프로모션 유형별 마진과 데이터 예외를 검토한 의사결정을 기록한다.",
    sections: [
      ["관측", [facts.promotions, facts.attribution]],
      ["예외", ["PR00050 음수 할인, O00007/O00600 금액 불일치를 제외한 보정 결과를 함께 본다."]],
      ["결정", ["Percent 일괄 할인 상한을 낮추고 Bundle 대안을 다음 실험의 기본안으로 한다."]],
      ["검증", ["재구매율은 고객등급과 채널을 통제해 비교하고 결과에 원본 쿼리를 첨부한다."]],
    ],
  },
  {
    id: "OD10",
    file: "10_Track3_Grounded_Briefing_Draft.docx",
    folder: "Briefings",
    title: "Track3 근거 통합 브리핑 초안",
    type: "Briefing Draft",
    date: "2026-07-12",
    owner: people.cdo,
    status: "Draft",
    acl: "Workshop-Participants",
    keywords: ["FabricIQ", "WorkIQ", "BackToSchool", "원본 링크"],
    summary: "정형 사실과 M365 업무 맥락을 결합해 Track3 에이전트가 생성할 브리핑의 기준 예시를 제공한다.",
    sections: [
      ["정형 사실", [facts.inventory, facts.payments]],
      ["업무 맥락", ["재고·물류·CS 합동 회의는 노출 제한과 선제 공지를 결정했고 BackToSchool 회의는 조건부 Go를 승인했다."]],
      ["품질 경고", [facts.quality, "귀속 범위가 확인되지 않은 캠페인은 성과 0으로 표현하지 않는다."]],
      ["권고", ["핵심 상품 노출 제한, 결제 회복률 분리, 근거 링크 유지, 24시간 후 재검증을 제안한다."]],
    ],
  },
  {
    id: "OD11",
    file: "11_Retention_Segment_Notes_by_Customer_Tier.docx",
    folder: "MeetingNotes",
    title: "고객등급별 리텐션 세그먼트 노트",
    type: "Meeting Notes",
    date: "2026-06-09",
    owner: people.crm,
    status: "Final",
    acl: "Workshop-Participants",
    keywords: ["Platinum", "Gold", "Silver", "Bronze", "VIPRetention"],
    summary: "Bronze/Silver/Gold/Platinum 등급별 이탈·반품·재구매 신호를 정리해 VIPRetention 후속 세그먼트를 설계한다.",
    sections: [
      ["참석자", ["CRM, 그로스, CS, 데이터 품질 담당자가 참석했다."]],
      ["등급 분포", [facts.tiers, "등급 결측 고객(C00007)은 별도 세그먼트로 분리해 임의 등급 부여를 금지한다."]],
      ["신호 해석", [facts.channelReturns, "Silver 등급은 반품 후 이탈 위험이 높고 Gold 등급은 문의 대비 재구매율이 높은 패턴이 관측된다."]],
      ["결정", ["Platinum은 VIPRetention 접촉 유지, Silver는 반품 사후 케어 캠페인, Bronze는 배송 경험 개선을 우선한다."]],
      ["후속 조치", ["CRM은 세그먼트 정의서, 그로스는 재구매율 지표, 데이터팀은 등급 결측 영향도를 공유한다."]],
    ],
  },
  {
    id: "OD12",
    file: "12_Non_Electronics_Campaign_Support_Materials_Notes.docx",
    folder: "MeetingNotes",
    title: "비전자 카테고리 캠페인 보조 소재 노트",
    type: "Meeting Notes",
    date: "2026-06-11",
    owner: people.marketing,
    status: "Draft",
    acl: "Workshop-Participants",
    keywords: ["ComfyChair Home", "DailyTee Cotton", "BackToSchool", "번들"],
    summary: "전자 핵심 상품 재고 부족을 보완할 ComfyChair Home/DailyTee Cotton 보조 소재 구성을 검토한다.",
    sections: [
      ["참석자", ["마케팅, 상품, 재고 운영, CS 담당자가 참석했다."]],
      ["배경", [facts.products, "전자 핵심 상품 노출 제한 기간에 홈·패션 카테고리로 유입을 분산한다."]],
      ["논의", ["ComfyChair Home(P00003) 단독 소재와 DailyTee Cotton(P00002) 번들 소재를 BackToSchool 보조로 배치하는 안을 검토했다."]],
      ["결정", ["초안 단계로 노출 확정 전 상세 설명 개선(SP15)과 재고 여유를 확인하고 P00050 이상값은 제외한다."]],
      ["후속 조치", ["상품팀은 상세 개선안, 재고팀은 가용 수량, 마케팅은 소재 초안을 다음 회의 전까지 공유한다."]],
    ],
  },
];

const outlookMessages = [
  {
    id: "EM01",
    thread: "sales-drop",
    sender: "ceo",
    to: ["cfo", "cdo", "marketing", "payments"],
    cc: ["growth"],
    date: "2026-05-18T08:40:00+09:00",
    subject: "[리더십] 5월 매출 급락 이슈 공유",
    keywords: ["SummerPush", "결제 실패", "전환율"],
    body: [
      "SummerPush 기간 중 매출과 주문 전환이 계획보다 낮다는 보고를 받았습니다.",
      facts.payments,
      "결제 실패가 실제 전환 손실인지, 귀속 데이터 누락인지 구분해 내일 리더십 회의 전까지 근거 링크와 함께 회신해 주세요.",
      "AeroPhone X 등 핵심 상품의 재고·배송 이슈가 동시에 영향을 주었는지도 확인 바랍니다.",
    ],
  },
  {
    id: "EM02",
    thread: "sales-drop",
    replyTo: "EM01",
    sender: "payments",
    to: ["ceo", "cfo", "cdo"],
    cc: ["marketing", "growth"],
    date: "2026-05-18T11:05:00+09:00",
    subject: "RE: [리더십] 5월 매출 급락 이슈 공유",
    keywords: ["SummerPush", "RetrySuccess", "PAY00019"],
    body: [
      "결제 원천을 확인한 결과 Failed와 RetrySuccess가 거의 같은 규모로 관측됩니다.",
      "RetrySuccess를 단순 성공으로 합치면 최초 승인율 저하가 가려집니다. AUTHORIZED + is_retry=true로 분리해 다시 보고하겠습니다.",
      "PAY00019 상태 결측과 PAY90001 고아 주문 참조는 품질 검증 대상에서 별도 표시하겠습니다.",
    ],
  },
  {
    id: "EM03",
    thread: "payment-incident",
    sender: "payments",
    to: ["marketing", "growth", "data"],
    cc: ["cfo"],
    date: "2026-05-19T09:20:00+09:00",
    subject: "결제 실패 급증 관련 결제팀 1차 회신",
    keywords: ["AeroPhone X", "결제 실패", "RetrySuccess"],
    body: [
      "AeroPhone X 주문을 포함한 결제 실패 증가 건을 점검했습니다.",
      facts.payments,
      "캠페인 전환 분석에서는 Failed, 최초 Success, RetrySuccess를 분리하고 주문 O09001의 배송/CS 영향도 함께 확인해 주세요.",
    ],
  },
  {
    id: "EM04",
    thread: "vip-churn",
    sender: "crm",
    to: ["cs", "marketing", "data"],
    cc: ["cdo"],
    date: "2026-05-15T10:10:00+09:00",
    subject: "VIPRetention 대상 Platinum 고객 이탈 경고",
    keywords: ["VIPRetention", "Platinum", "DailyTee Cotton"],
    body: [
      "VIPRetention 대상 중 Platinum 고객의 반품 및 문의 신호를 검토해 주세요.",
      "C00003은 New/Platinum이며, C00007은 Platinum이지만 customer_segment가 비어 있어 자동 세그먼트 판단에서 제외해야 합니다.",
      "DailyTee Cotton 반품 미팅 노트와 원본 주문·배송·반품 링크를 확인한 후 고객 접촉안을 제안해 주세요.",
    ],
  },
  {
    id: "EM05",
    thread: "stockout",
    sender: "inventory",
    to: ["logistics", "cs", "marketing"],
    cc: ["cdo"],
    date: "2026-05-16T09:15:00+09:00",
    subject: "[긴급] 핵심 상품 재고 부족 및 캠페인 노출 조정 요청",
    keywords: ["AeroPhone X", "SmartWatch Pro", "UltraBook 15"],
    body: [
      facts.inventory,
      "예약수량이 가용재고를 크게 초과합니다. 신규 캠페인 노출과 배송 약속을 즉시 재검토해 주세요.",
      "상품별 영향 주문은 O09001, O09002, O09003이며 물류/CS 상태를 같은 스레드에 회신 바랍니다.",
    ],
  },
  {
    id: "EM06",
    thread: "stockout",
    replyTo: "EM05",
    sender: "logistics",
    to: ["inventory", "cs", "marketing"],
    cc: ["cdo"],
    date: "2026-05-17T08:50:00+09:00",
    subject: "RE: [긴급] 핵심 상품 재고 부족 및 캠페인 노출 조정 요청",
    keywords: ["SH09001", "SH09002", "SH09003", "배송 지연"],
    body: [
      facts.fulfillment,
      "AeroPhone X와 SmartWatch Pro는 지연 상태이며 UltraBook 15은 운송 중이지만 추적정보 문의가 발생했습니다.",
      "오늘 14시까지 약속일 재산정과 고객 공지 대상 목록을 공유하겠습니다.",
    ],
  },
  {
    id: "EM07",
    thread: "returns",
    sender: "cs",
    to: ["crm", "growth", "data"],
    cc: ["cdo"],
    date: "2026-05-25T16:30:00+09:00",
    subject: "반품 사유 월간 요약 - 채널 및 고객등급 검토",
    keywords: ["NotAsDescribed", "LateDelivery", "MobileApp", "OfflineStore"],
    body: [
      facts.returns,
      "R00011은 반품 사유가 비어 있어 임의 분류하지 않았습니다.",
      "VIPRetention과 연결할 때 반품 사유, 배송 상태, 고객등급을 함께 보고 원본 링크를 유지해 주세요.",
    ],
  },
  {
    id: "EM08",
    thread: "flashweek-margin",
    sender: "finance",
    to: ["marketing", "growth", "cfo"],
    cc: ["data"],
    date: "2026-05-18T14:40:00+09:00",
    subject: "FlashWeek 프로모션 마진 검토 요청",
    keywords: ["FlashWeek", "Percent", "PR00050"],
    body: [
      facts.promotions,
      facts.attribution,
      "PR00050 음수 할인과 O00007/O00600 금액 불일치를 제외한 보정 기준도 함께 제출해 주세요.",
    ],
  },
  {
    id: "EM09",
    thread: "data-quality",
    sender: "data",
    to: ["cdo", "payments", "inventory", "logistics", "cs"],
    cc: ["marketing"],
    date: "2026-05-27T09:00:00+09:00",
    subject: "[데이터 품질] Track1 차단 이슈 및 Track2 인용 주의",
    keywords: ["PAY90001", "T90001", "SH00001", "O00007"],
    body: [
      facts.quality,
      "미보정 수치를 M365 문서에서 확정값처럼 인용하지 말고 품질 경고와 기준 시각을 표시해 주세요.",
      "제한 문서인 데이터 품질 개선 등록부는 Data-Stewards 그룹만 접근하도록 유지합니다.",
    ],
  },
  {
    id: "EM10",
    thread: "backtoschool",
    sender: "marketing",
    to: ["ceo", "cfo", "cdo"],
    cc: ["payments", "inventory", "logistics", "cs"],
    date: "2026-07-10T15:20:00+09:00",
    subject: "BackToSchool 캠페인 조건부 승인 요청",
    keywords: ["BackToSchool", "OnlineMall", "Go/No-Go"],
    body: [
      "BackToSchool(CA00002)은 2026-07-15 시작 예정입니다.",
      facts.attribution,
      "핵심 상품 재고와 배송 약속, 결제 실패/재시도 지표를 조건으로 캠페인 조건부 Go 승인을 요청합니다.",
    ],
  },
  {
    id: "EM11",
    thread: "ultrabook-vendor",
    sender: "inventory",
    to: ["logistics", "marketing", "cs"],
    cc: ["cdo"],
    date: "2026-05-16T13:45:00+09:00",
    subject: "UltraBook 15 공급 일정 및 고객 공지 기준",
    keywords: ["UltraBook 15", "S09003", "O09003"],
    body: [
      "UltraBook 15은 on_hand 6, reserved 40으로 부족 상태입니다.",
      "O09003/SH09003은 InTransit이며 T09003 NoTrackingUpdate가 연결됩니다.",
      "입고 확정 전 신규 약속일을 단정하지 말고 추적정보 갱신과 선제 공지를 우선해 주세요.",
    ],
  },
  {
    id: "EM12",
    thread: "backtoschool",
    replyTo: "EM10",
    sender: "ceo",
    to: ["marketing", "cfo", "cdo"],
    cc: ["payments", "inventory", "logistics", "cs"],
    date: "2026-07-11T09:30:00+09:00",
    subject: "RE: BackToSchool 캠페인 조건부 승인 요청",
    keywords: ["BackToSchool", "AeroPhone X", "SmartWatch Pro", "UltraBook 15"],
    body: [
      "조건부 Go로 승인합니다.",
      "AeroPhone X, SmartWatch Pro, UltraBook 15의 노출 제한과 배송 약속 변경을 적용하고 결제 Failed/RetrySuccess를 분리 보고해 주세요.",
      "최종 브리핑에는 FabricIQ 지표, WorkIQ 원본 링크, 품질 경고, 담당자와 기한을 포함해야 합니다.",
    ],
  },
  {
    id: "EM13",
    thread: "returns-review",
    sender: "growth",
    to: ["crm", "cs", "marketing"],
    cc: ["data"],
    date: "2026-06-02T10:15:00+09:00",
    subject: "채널·고객등급별 반품 심층 분석 공유",
    keywords: ["ChangedMind", "Damaged", "SizeIssue", "Gold", "Silver", "Bronze"],
    body: [
      "반품 1,000건을 채널과 고객등급 축으로 다시 분해했습니다.",
      facts.channelReturns,
      "Silver 등급은 반품 후 이탈 위험이 높고 Bronze는 배송 사유 반품이 많습니다. 사유별로 상품 상세/사이즈 가이드/포장 개선을 분리해 주세요.",
      "R00011 사유 결측과 C00007 등급 결측은 임의 치환 없이 별도 표시했습니다.",
    ],
  },
  {
    id: "EM14",
    thread: "returns-review",
    replyTo: "EM13",
    sender: "crm",
    to: ["growth", "cs", "marketing"],
    cc: ["data"],
    date: "2026-06-02T13:40:00+09:00",
    subject: "RE: 채널·고객등급별 반품 심층 분석 공유",
    keywords: ["Silver", "Platinum", "VIPRetention", "NotAsDescribed"],
    body: [
      "등급별 해석에 동의합니다. Silver 반품 고객에는 사후 케어 캠페인을 준비하겠습니다.",
      "Platinum 반품 사례는 VIPRetention 접촉 이력과 중복되지 않도록 CRM에서 필터링하겠습니다.",
      "DailyTee Cotton의 NotAsDescribed는 상품 상세 개선 리포트와 연결해 후속하겠습니다.",
    ],
  },
  {
    id: "EM15",
    thread: "nonelectronics-plan",
    sender: "marketing",
    to: ["inventory", "cs"],
    cc: ["growth"],
    date: "2026-06-05T09:10:00+09:00",
    subject: "비전자 카테고리 보조 소재 및 재고 확인 요청",
    keywords: ["ComfyChair Home", "DailyTee Cotton", "BackToSchool", "번들"],
    body: [
      "전자 핵심 상품 노출 제한 기간을 보완하기 위해 홈·패션 카테고리 보조 소재를 검토 중입니다.",
      facts.products,
      "ComfyChair Home 단독 소재와 DailyTee Cotton 번들 소재의 가용 재고를 확인해 주세요. P00050 이상값(price 0)은 노출에서 제외합니다.",
      "상세 설명 개선(NotAsDescribed/SizeIssue 대응) 완료 후 BackToSchool 보조로 배치하겠습니다.",
    ],
  },
];

const teamsThreads = [
  {
    id: "TM01",
    channel: "cs-tier2",
    title: "AeroPhone X 배송 지연 클레임",
    keywords: ["AeroPhone X", "O09001", "SH09001", "T09001"],
    messages: [
      ["cs", "2026-05-20T09:05:00+09:00", "AeroPhone X 관련 NoTrackingUpdate 문의가 증가했습니다. T09001과 O09001 원본을 확인해 주세요."],
      ["logistics", "2026-05-20T09:18:00+09:00", "SH09001은 Delayed입니다. 현재 약속일을 재계산 중이며 14시까지 공지 문구를 공유하겠습니다."],
      ["inventory", "2026-05-20T09:26:00+09:00", "S09001 기준 on_hand 4, reserved 30입니다. 신규 노출 제한을 요청했습니다."],
    ],
  },
  {
    id: "TM02",
    channel: "cs-tier2",
    title: "SmartWatch Pro 재고 문의 폭증",
    keywords: ["SmartWatch Pro", "O09002", "SH09002", "T09002"],
    messages: [
      ["cs", "2026-05-16T11:10:00+09:00", "SmartWatch Pro 재고 및 배송 문의가 급증했습니다. T09002 사유는 LateDelivery입니다."],
      ["inventory", "2026-05-16T11:20:00+09:00", "S09002는 on_hand 3, reserved 25입니다. 판매 가능 수량을 0으로 전환하는 중입니다."],
      ["logistics", "2026-05-16T11:34:00+09:00", "O09002의 SH09002는 Delayed입니다. 고객별 변경 약속일을 전달하겠습니다."],
    ],
  },
  {
    id: "TM03",
    channel: "logistics",
    title: "UltraBook 15 배송 추적 갱신",
    keywords: ["UltraBook 15", "O09003", "SH09003", "T09003"],
    messages: [
      ["logistics", "2026-05-17T08:35:00+09:00", "UltraBook 15 O09003의 SH09003은 InTransit입니다. 배송 지연 확정이 아니라 추적 갱신 지연 상태입니다."],
      ["cs", "2026-05-17T08:48:00+09:00", "T09003은 NoTrackingUpdate입니다. 고객 안내에서 Delayed로 단정하지 않겠습니다."],
      ["inventory", "2026-05-17T09:02:00+09:00", "S09003 기준 on_hand 6, reserved 40입니다. 신규 주문 약속은 제한해야 합니다."],
    ],
  },
  {
    id: "TM04",
    channel: "inventory",
    title: "핵심 상품 품절 임박 공동 대응",
    keywords: ["AeroPhone X", "SmartWatch Pro", "UltraBook 15"],
    messages: [
      ["inventory", "2026-05-16T09:00:00+09:00", facts.inventory],
      ["marketing", "2026-05-16T09:12:00+09:00", "세 상품의 캠페인 노출을 축소하고 BackToSchool 소재에서는 배송 약속 문구를 보수적으로 변경하겠습니다."],
      ["cs", "2026-05-16T09:20:00+09:00", "상품별 FAQ와 보상 기준을 분리해 준비하겠습니다."],
    ],
  },
  {
    id: "TM05",
    channel: "payments",
    title: "결제 실패와 RetrySuccess 지표 분리",
    keywords: ["RetrySuccess", "Failed", "PAY00019"],
    messages: [
      ["payments", "2026-05-19T10:00:00+09:00", facts.payments],
      ["data", "2026-05-19T10:14:00+09:00", "RetrySuccess는 AUTHORIZED + is_retry=true로 분리하고 PAY00019는 결측으로 유지하겠습니다."],
      ["growth", "2026-05-19T10:25:00+09:00", "최초 승인율과 재시도 회복률을 캠페인별로 별도 계산하겠습니다."],
    ],
  },
  {
    id: "TM06",
    channel: "campaign-ops",
    title: "SummerPush 중간 성과 해석",
    keywords: ["SummerPush", "전환율", "결제 실패"],
    messages: [
      ["growth", "2026-05-20T15:00:00+09:00", "SummerPush 직접 귀속행이 현재 추출에 보이지 않습니다. 성과 0으로 해석하지 않고 매핑 범위를 확인하겠습니다."],
      ["marketing", "2026-05-20T15:12:00+09:00", "결제 실패와 재시도 회복을 분리한 리포트가 나올 때까지 예산 증액 결정을 보류합니다."],
      ["data", "2026-05-20T15:25:00+09:00", "Campaign -> CampaignAttribution -> Order -> Payment 경로와 SQL 기준값을 비교하겠습니다."],
    ],
  },
  {
    id: "TM07",
    channel: "campaign-ops",
    title: "BackToSchool Go/No-Go 준비",
    keywords: ["BackToSchool", "OnlineMall", "Go/No-Go"],
    messages: [
      ["marketing", "2026-07-10T13:00:00+09:00", "BackToSchool은 7월 15일 시작 예정입니다. 결제/재고/물류/CS 근거를 오늘까지 모읍니다."],
      ["inventory", "2026-07-10T13:14:00+09:00", "핵심 상품 재고 기준과 노출 제한안을 공유했습니다."],
      ["payments", "2026-07-10T13:21:00+09:00", "Failed와 RetrySuccess 분리 지표를 Go/No-Go 자료에 포함하겠습니다."],
      ["cs", "2026-07-10T13:30:00+09:00", "배송 약속 변경 FAQ와 에스컬레이션 경로를 준비했습니다."],
    ],
  },
  {
    id: "TM08",
    channel: "campaign-ops",
    title: "FlashWeek Percent 할인 마진 검토",
    keywords: ["FlashWeek", "Percent", "Bundle", "PR00050"],
    messages: [
      ["finance", "2026-05-18T14:00:00+09:00", facts.promotions],
      ["marketing", "2026-05-18T14:16:00+09:00", "다음 실험은 Percent 상한을 낮추고 Bundle 대안을 포함하겠습니다."],
      ["data", "2026-05-18T14:30:00+09:00", "PR00050 음수 할인과 O00007/O00600 금액 불일치를 별도 품질 경고로 표시합니다."],
    ],
  },
  {
    id: "TM09",
    channel: "cs-tier2",
    title: "NotAsDescribed 반품 클러스터",
    keywords: ["NotAsDescribed", "DailyTee Cotton", "Platinum"],
    messages: [
      ["cs", "2026-05-24T10:20:00+09:00", "NotAsDescribed 반품 표현이 여러 형태로 들어옵니다. DailyTee Cotton 사례와 Platinum 고객 메모를 확인해 주세요."],
      ["crm", "2026-05-24T10:34:00+09:00", "VIPRetention 접촉 전 주문·배송·반품 근거를 확인하고 중복 보상을 방지하겠습니다."],
      ["data", "2026-05-24T10:45:00+09:00", "별칭을 표준 사유에 매핑하되 R00011 결측은 임의 치환하지 않겠습니다."],
    ],
  },
  {
    id: "TM10",
    channel: "data-quality",
    title: "Track1 FK/PK 차단 이슈",
    keywords: ["PAY90001", "T90001", "SH00001"],
    messages: [
      ["data", "2026-05-27T09:10:00+09:00", "PAY90001->O99999와 T90001->C99999 고아 참조, SH00001 중복을 P0로 등록했습니다."],
      ["payments", "2026-05-27T09:24:00+09:00", "PAY90001은 캠페인 전환 집계에서 격리하고 원본 이벤트를 조사하겠습니다."],
      ["logistics", "2026-05-27T09:31:00+09:00", "SH00001 중복은 삭제 대신 정제 계층에서 중복 플래그를 남기겠습니다."],
    ],
  },
  {
    id: "TM11",
    channel: "data-quality",
    title: "금액 정합성 불일치 조사",
    keywords: ["O00007", "O00600", "gross_amount"],
    messages: [
      ["data", "2026-05-27T11:00:00+09:00", "O00007은 item 합계보다 +10, O00600은 -25 차이가 있습니다."],
      ["finance", "2026-05-27T11:12:00+09:00", "프로모션 마진 분석에서 두 주문을 제외한 값과 포함한 값을 함께 제시해 주세요."],
      ["growth", "2026-05-27T11:20:00+09:00", "Track3 브리핑에는 품질 경고와 영향 범위를 명시하겠습니다."],
    ],
  },
  {
    id: "TM12",
    channel: "data-quality",
    title: "비표준 상태 코드 정렬",
    keywords: ["Completed", "Cancelled", "RetrySuccess", "InTransit"],
    messages: [
      ["data", "2026-05-28T10:00:00+09:00", "주문/결제/배송 상태를 표준 코드로 매핑하되 원천값을 보존합니다."],
      ["payments", "2026-05-28T10:13:00+09:00", "RetrySuccess는 AUTHORIZED와 is_retry=true로 분리하는 안에 동의합니다."],
      ["logistics", "2026-05-28T10:25:00+09:00", "InTransit은 IN_TRANSIT로 표준화하고 원본 CamelCase를 lineage에 남기겠습니다."],
    ],
  },
  {
    id: "TM13",
    channel: "leadership-briefing",
    title: "리더십 브리핑 근거 점검",
    keywords: ["FabricIQ", "WorkIQ", "원본 링크"],
    messages: [
      ["cdo", "2026-07-11T15:00:00+09:00", "최종 브리핑은 정형 지표, M365 업무 근거, 원본 링크, 품질 경고, 조치안을 포함해야 합니다."],
      ["data", "2026-07-11T15:12:00+09:00", "FabricIQ 기준값과 품질 이슈 Top3를 전달하겠습니다."],
      ["marketing", "2026-07-11T15:18:00+09:00", "WorkIQ 캠페인 문서와 Go/No-Go 결정 링크를 제공하겠습니다."],
    ],
  },
  {
    id: "TM14",
    channel: "leadership-briefing",
    title: "BackToSchool 조건부 Go 후속",
    keywords: ["BackToSchool", "AeroPhone X", "조건부 Go"],
    messages: [
      ["ceo", "2026-07-11T09:40:00+09:00", "BackToSchool은 조건부 Go입니다. 핵심 상품 노출 제한과 결제 지표 분리를 적용해 주세요."],
      ["marketing", "2026-07-11T09:52:00+09:00", "AeroPhone X, SmartWatch Pro, UltraBook 15 소재와 배송 문구를 조정하겠습니다."],
      ["cdo", "2026-07-11T10:05:00+09:00", "24시간 후 동일 재현 질의로 결과를 다시 검증하겠습니다."],
    ],
  },
  {
    id: "TM15",
    channel: "cs-tier2",
    title: "의도된 표기 불일치 점검",
    keywords: ["Aero Phone X", "AeroPhone X", "표기 정규화"],
    qualityFlags: ["intentional-alias"],
    messages: [
      ["cs", "2026-05-20T16:00:00+09:00", "일부 상담 메모에서 Aero Phone X로 띄어 쓴 사례가 있습니다."],
      ["data", "2026-05-20T16:12:00+09:00", "정식 엔터티명은 AeroPhone X입니다. 별칭 사전에 Aero Phone X를 추가하고 원문은 보존하겠습니다."],
      ["growth", "2026-05-20T16:20:00+09:00", "정확 검색과 정규화 검색 결과 차이를 Track2 품질 증적으로 남기겠습니다."],
    ],
  },
  {
    id: "TM16",
    channel: "cs-tier2",
    title: "고객등급별 반품 패턴 공유",
    keywords: ["Silver", "Gold", "Bronze", "SizeIssue", "NotAsDescribed"],
    messages: [
      ["cs", "2026-06-02T10:30:00+09:00", "Silver·Gold 등급의 DailyTee Cotton 반품 문의가 늘었습니다. 사유는 SizeIssue와 NotAsDescribed가 다수입니다."],
      ["crm", "2026-06-02T10:42:00+09:00", "Silver 반품 고객은 이탈 위험이 높아 사후 케어 대상으로 태깅하겠습니다. Platinum은 VIPRetention과 중복 확인합니다."],
      ["growth", "2026-06-02T10:55:00+09:00", "채널·등급 교차표를 공유했습니다. Bronze는 배송 사유 반품이 많아 물류와 분리해 봐야 합니다."],
    ],
  },
  {
    id: "TM17",
    channel: "inventory",
    title: "비전자 카테고리 재고 및 보조 소재",
    keywords: ["ComfyChair Home", "DailyTee Cotton", "BackToSchool"],
    messages: [
      ["marketing", "2026-06-05T09:30:00+09:00", "전자 핵심 상품 노출 제한 기간에 ComfyChair Home과 DailyTee Cotton을 BackToSchool 보조 소재로 검토합니다."],
      ["inventory", "2026-06-05T09:41:00+09:00", "ComfyChair Home(P00003)과 DailyTee Cotton(P00002)은 재고 여유가 있습니다. P00050 이상값은 노출 목록에서 제외했습니다."],
      ["cs", "2026-06-05T09:52:00+09:00", "DailyTee Cotton은 상세 설명 개선 후 노출하면 NotAsDescribed 문의를 줄일 수 있습니다."],
    ],
  },
  {
    id: "TM18",
    channel: "campaign-ops",
    title: "주문 취소율과 배송 지연 상관 점검",
    keywords: ["O00013", "LateDelivery", "취소", "배송 지연"],
    messages: [
      ["growth", "2026-05-24T14:00:00+09:00", "배송 지연 구간과 주문 취소·환불이 겹치는지 상관을 보고 있습니다. Q3 명명 주문 O09001~O09003 주변을 확인 중입니다."],
      ["logistics", "2026-05-24T14:13:00+09:00", "Delayed 배송이 몰린 날짜에 취소 문의가 함께 증가했습니다. SH 상태 변경 로그를 붙이겠습니다."],
      ["data", "2026-05-24T14:25:00+09:00", "O00013 order_date 결측과 O00007/O00600 금액 불일치는 상관 분석에서 제외 표시하고 원본 확인 상태를 남기겠습니다."],
    ],
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanOutput() {
  fs.rmSync(OUT, { recursive: true, force: true });
  [
    "sharepoint/Campaigns",
    "sharepoint/Operations",
    "sharepoint/Analytics",
    "sharepoint/DataQuality",
    "sharepoint/Leadership",
    "outlook",
    "teams",
    "onedrive/MeetingNotes",
    "onedrive/Briefings",
    "manifests",
  ].forEach((subdir) => ensureDir(path.join(OUT, subdir)));
}

function border() {
  return { style: BorderStyle.SINGLE, size: 1, color: COLORS.border };
}

function cell(text, width, options = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: border(), bottom: border(), left: border(), right: border() },
    shading: options.header ? { fill: COLORS.lightBlue, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            bold: Boolean(options.header),
            color: options.header ? COLORS.navy : "000000",
            font: "Arial",
            size: 19,
          }),
        ],
      }),
    ],
  });
}

function twoColumnTable(rows) {
  const widths = [2300, TABLE_WIDTH - 2300];
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      ([key, value], index) =>
        new TableRow({
          children: [cell(key, widths[0], { header: index === 0 }), cell(value, widths[1], { header: index === 0 })],
        }),
    ),
  });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, font: "Arial", color: level === HeadingLevel.HEADING_1 ? COLORS.navy : COLORS.blue })],
  });
}

function paragraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 320 },
    numbering: options.bullet ? { reference: "bullets", level: 0 } : undefined,
    children: [new TextRun({ text, font: "Arial", size: 21, color: options.warning ? COLORS.red : "000000" })],
  });
}

async function writeBusinessDoc(item, source) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: COLORS.blue, space: 1 } },
      children: [new TextRun({ text: item.title, bold: true, size: 36, font: "Arial", color: COLORS.navy })],
    }),
    paragraph(item.summary),
    twoColumnTable([
      ["항목", "값"],
      ["콘텐츠 ID", item.id],
      ["소스", source],
      ["문서 유형", item.type],
      ["업무 기준일", `${item.date} KST`],
      ["작성자", `${item.owner[0]} / ${item.owner[1]}`],
      ["상태", item.status],
      ["권한 대상", item.acl],
      ["검색 키워드", item.keywords.join(", ")],
    ]),
  ];

  for (const [sectionTitle, entries] of item.sections) {
    children.push(heading(sectionTitle, HeadingLevel.HEADING_2));
    entries.forEach((entry) => children.push(paragraph(entry, { bullet: true })));
  }

  children.push(heading("근거 및 사용 주의", HeadingLevel.HEADING_2));
  children.push(
    paragraph("본 문서는 Track1 샘플 데이터와 연결되는 가상 워크숍 콘텐츠다. 실제 고객, 임직원 또는 운영 사실을 포함하지 않는다.", { warning: true }),
    paragraph("정형 수치는 FabricIQ 기준값과 원본 행을 다시 확인하고, 미해결 품질 이슈가 있으면 경고와 함께 인용한다.", { bullet: true }),
  );

  const createdAt = new Date(`${item.date}T09:00:00+09:00`);
  const doc = new Document({
    creator: item.owner[0],
    title: item.title,
    subject: item.type,
    description: item.summary,
    keywords: item.keywords.join(", "),
    lastModifiedBy: item.owner[0],
    revision: 1,
    createdAt,
    modifiedAt: createdAt,
    styles: {
      default: { document: { run: { font: "Arial", size: 21 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Arial", size: 32, bold: true, color: COLORS.navy },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Arial", size: 26, bold: true, color: COLORS.blue },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1100, right: 1440, bottom: 1100, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Track2 Sample | ${item.id} | Page `, size: 17, color: "666666" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 17, color: "666666" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  const target = path.join(OUT, source.toLowerCase(), item.folder, item.file);
  fs.writeFileSync(target, await Packer.toBuffer(doc));
  return path.relative(OUT, target);
}

function encodedHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function emlDate(value) {
  return new Date(value).toUTCString();
}

function messageId(id) {
  return `<${id.toLowerCase()}.track2@contoso-workshop.example>`;
}

function writeEml(message) {
  const sender = people[message.sender];
  const to = message.to.map((key) => `${people[key][0]} <${key}@contoso-workshop.example>`).join(", ");
  const cc = message.cc.map((key) => `${people[key][0]} <${key}@contoso-workshop.example>`).join(", ");
  const headers = [
    `From: ${encodedHeader(sender[0])} <${message.sender}@contoso-workshop.example>`,
    `To: ${to}`,
    `Cc: ${cc}`,
    `Date: ${emlDate(message.date)}`,
    `Subject: ${encodedHeader(message.subject)}`,
    `Message-ID: ${messageId(message.id)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "X-Track2-Sample: true",
    `X-Track2-Thread: ${message.thread}`,
    `X-Track2-Keywords: ${message.keywords.join(";")}`,
  ];
  if (message.replyTo) {
    headers.push(`In-Reply-To: ${messageId(message.replyTo)}`, `References: ${messageId(message.replyTo)}`);
  }
  const signature = `${sender[0]}\n${sender[1]} | Contoso Commerce (가상)\n본 메일은 Track2 워크숍용 가상 콘텐츠입니다.`;
  const body = [...message.body, "", "감사합니다.", signature].join("\r\n\r\n");
  const content = `${headers.join("\r\n")}\r\n\r\n${body}\r\n`;
  const threadSlug = message.thread
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const file = `${message.id}_${threadSlug}_${message.replyTo ? "reply" : "message"}.eml`;
  fs.writeFileSync(path.join(OUT, "outlook", file), content, "utf8");
  return `outlook/${file}`;
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join(";") : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(file, headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((row) => lines.push(headers.map((header) => csvEscape(row[header])).join(",")));
  fs.writeFileSync(file, `\uFEFF${lines.join("\n")}\n`, "utf8");
}

async function main() {
  cleanOutput();
  const manifest = [];

  for (const item of sharePointDocs) {
    const relativePath = await writeBusinessDoc(item, "sharepoint");
    manifest.push({
      id: item.id,
      source: "SharePoint",
      title: item.title,
      businessDate: item.date,
      owner: item.owner[0],
      location: relativePath,
      target: `/Track2-Sample/${item.folder}/${item.file}`,
      keywords: item.keywords,
      acl: item.acl,
      status: item.status,
      qualityFlags: item.status === "Draft" ? ["draft"] : item.status === "Restricted" ? ["restricted"] : [],
    });
  }

  for (const item of oneDriveDocs) {
    const relativePath = await writeBusinessDoc(item, "onedrive");
    manifest.push({
      id: item.id,
      source: "OneDrive",
      title: item.title,
      businessDate: item.date,
      owner: item.owner[0],
      location: relativePath,
      target: `/Track2-Sample/${item.folder}/${item.file}`,
      keywords: item.keywords,
      acl: item.acl,
      status: item.status,
      qualityFlags: item.status === "Draft" ? ["draft"] : item.status === "Restricted" ? ["restricted"] : [],
    });
  }

  const deploymentMessages = [];
  for (const message of outlookMessages) {
    const relativePath = writeEml(message);
    deploymentMessages.push(message);
    manifest.push({
      id: message.id,
      source: "Outlook",
      title: message.subject,
      businessDate: message.date,
      owner: people[message.sender][0],
      location: relativePath,
      target: "Configured sample recipients",
      keywords: message.keywords,
      acl: "Message recipients",
      status: message.replyTo ? "Reply" : "Original",
      qualityFlags: [],
    });
  }
  fs.writeFileSync(path.join(OUT, "outlook", "messages.json"), JSON.stringify(deploymentMessages, null, 2), "utf8");

  fs.writeFileSync(path.join(OUT, "teams", "threads.json"), JSON.stringify(teamsThreads, null, 2), "utf8");
  for (const thread of teamsThreads) {
    manifest.push({
      id: thread.id,
      source: "Teams",
      title: thread.title,
      businessDate: thread.messages[0][1],
      owner: people[thread.messages[0][0]][0],
      location: "teams/threads.json",
      target: thread.channel,
      keywords: thread.keywords,
      acl: `Team channel: ${thread.channel}`,
      status: `${thread.messages.length} messages`,
      qualityFlags: thread.qualityFlags || [],
    });
  }

  fs.writeFileSync(path.join(OUT, "manifests", "content_catalog.json"), JSON.stringify(manifest, null, 2), "utf8");
  writeCsv(
    path.join(OUT, "manifests", "content_manifest.csv"),
    ["id", "source", "title", "businessDate", "owner", "location", "target", "keywords", "acl", "status", "qualityFlags"],
    manifest,
  );

  const teamsMessageCount = teamsThreads.reduce((sum, thread) => sum + thread.messages.length, 0);
  const summary = {
    packageVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    fictionalDataOnly: true,
    primaryContentCount: manifest.length,
    sourceCounts: {
      SharePoint: sharePointDocs.length,
      Outlook: outlookMessages.length,
      TeamsThreads: teamsThreads.length,
      TeamsMessages: teamsMessageCount,
      OneDrive: oneDriveDocs.length,
    },
    requiredKeywordCoverage: {
      SummerPush: ["SharePoint", "Outlook", "Teams"],
      VIPRetention: ["SharePoint", "Outlook", "OneDrive"],
      "AeroPhone X": ["SharePoint", "Outlook", "Teams"],
      "SmartWatch Pro": ["SharePoint", "Outlook", "Teams"],
      "UltraBook 15": ["SharePoint", "Outlook", "Teams"],
      "DailyTee Cotton": ["SharePoint", "Outlook", "Teams", "OneDrive"],
      "ComfyChair Home": ["SharePoint", "Outlook", "Teams", "OneDrive"],
      Platinum: ["SharePoint", "Outlook", "Teams", "OneDrive"],
      Silver: ["SharePoint", "Outlook", "Teams", "OneDrive"],
      BackToSchool: ["SharePoint", "Outlook", "Teams", "OneDrive"],
      FlashWeek: ["SharePoint", "Outlook", "Teams", "OneDrive"],
    },
    intentionalTrack2QualityCases: [
      "Draft documents",
      "Restricted ACL documents",
      "Aero Phone X alias in Teams",
      "Track1 data-quality warnings",
      "Campaign attribution coverage limitation",
      "Missing customer segment (C00007) kept separate",
      "P00050 zero-price outlier excluded from catalog",
    ],
  };
  fs.writeFileSync(path.join(OUT, "manifests", "readiness_expected.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log(`Generated ${manifest.length} primary content items.`);
  console.log(`SharePoint DOCX: ${sharePointDocs.length}`);
  console.log(`Outlook EML: ${outlookMessages.length}`);
  console.log(`Teams threads/messages: ${teamsThreads.length}/${teamsMessageCount}`);
  console.log(`OneDrive DOCX: ${oneDriveDocs.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
