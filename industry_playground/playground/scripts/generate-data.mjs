import { readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const playgroundRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repositoryRoot = resolve(playgroundRoot, "..", "..")
const industryScenariosDir = resolve(playgroundRoot, "..", "scenarios")
const EXPECTED_INDUSTRY_SCENARIO_COUNT = 6

async function readJson(relativePath) {
  const content = await readFile(resolve(repositoryRoot, relativePath), "utf8")
  return JSON.parse(content)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim()
}

// Extracts the body of a "#"-repeated heading section up to the next heading
// at the same level (or end of the given markdown). Throws when the heading
// is missing or its body is empty so malformed scenario docs fail loudly
// instead of silently producing incomplete Playground data.
function extractSection(markdown, heading, level, sourceLabel) {
  const marker = "#".repeat(level)
  const headingPattern = new RegExp(`^${marker} ${escapeRegExp(heading)}\\s*$`, "m")
  const match = headingPattern.exec(markdown)
  assert(match, `${sourceLabel}: missing required "${marker} ${heading}" section`)

  const start = match.index + match[0].length
  const rest = markdown.slice(start)
  const nextHeadingPattern = new RegExp(`^${marker} `, "m")
  const nextMatch = nextHeadingPattern.exec(rest)
  const end = nextMatch ? nextMatch.index : rest.length
  const body = rest.slice(0, end).trim()
  assert(body.length > 0, `${sourceLabel}: "${heading}" section is empty`)
  return body
}

function extractLabeledBullets(text, expectedLabels, sourceLabel) {
  const bulletPattern = /^- \*\*(.+?):\*\*/gm
  const matches = [...text.matchAll(bulletPattern)]
  assert(matches.length > 0, `${sourceLabel}: no labeled bullets found`)

  const values = {}
  matches.forEach((bulletMatch, index) => {
    const label = bulletMatch[1].trim()
    const start = bulletMatch.index + bulletMatch[0].length
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length
    values[label] = collapseWhitespace(text.slice(start, end))
  })

  for (const label of expectedLabels) {
    assert(values[label], `${sourceLabel}: missing "${label}" bullet`)
  }
  return values
}

function parseExampleQuestions(text, sourceLabel) {
  const matches = [...text.matchAll(/^\d+\.\s+\*\*(.+?):\*\*\s*(.+)$/gm)]
  assert(
    matches.length === 3,
    `${sourceLabel}: expected exactly 3 example questions, found ${matches.length}`,
  )
  return matches.map((match) => ({
    perspective: match[1].trim(),
    question: match[2].trim(),
  }))
}

function parseVerificationQuestions(text, sourceLabel) {
  const matches = [...text.matchAll(/^- (.+)$/gm)]
  assert(matches.length > 0, `${sourceLabel}: no verification questions found`)
  return matches.map((match) => match[1].trim())
}

function parseFallbackTable(text, sourceLabel) {
  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*-+\s*\|/.test(line))
  assert(rows.length > 1, `${sourceLabel}: fallback table is missing data rows`)

  const [, ...dataRows] = rows
  const parsed = dataRows.map((row) => {
    const cells = row
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim())
    assert(cells.length === 2, `${sourceLabel}: malformed fallback row "${row}"`)
    return { condition: cells[0], result: cells[1] }
  })
  assert(
    parsed.length === 4,
    `${sourceLabel}: expected 4 fallback rows, found ${parsed.length}`,
  )
  return parsed
}

function parseDiagram(text, sourceLabel) {
  const match = /```text\n([\s\S]*?)```/.exec(text)
  assert(match, `${sourceLabel}: missing ascii diagram code block`)
  const diagram = match[1].replace(/\n$/, "")
  assert(diagram.trim().length > 0, `${sourceLabel}: ascii diagram is empty`)
  return diagram
}

const IQ_SUBSECTIONS = [
  { heading: "FabricIQ — 정형 지표", id: "fabric", name: "FabricIQ", label: "정형 지표" },
  { heading: "WorkIQ — ACL 근거", id: "work", name: "WorkIQ", label: "ACL 근거" },
  { heading: "WebIQ — 공개 웹 인용", id: "web", name: "WebIQ", label: "공개 웹 인용" },
  {
    heading: "FoundryIQ — 권위 대조 및 최종 문장화",
    id: "foundry",
    name: "FoundryIQ",
    label: "권위 대조 및 최종 문장화",
  },
]

const IQ_BULLET_LABELS = ["입력/범위", "처리·검증 단계", "출력/인계", "한계/비목표"]

const INDUSTRY_QUESTION_FLOWS = {
  "MFG-01": [
    {
      fabric: {
        metric: "불량률 4.2% (기준선 1.5% 초과), 연관 생산 수량 12,000개, 손실 추정액 $85,000",
        highlights: ["B3 생산 라인 결함 신호 12건 감지", "전압 변동 오차율 3.8% 기록"],
      },
      work: {
        evidenceTitle: "[SharePoint] '2026-Q3 B3 라인 설비 점검 일지.docx'",
        owner: "박품질 팀장 (품질관리팀)",
        source: "SharePoint · 품질점검문서",
        details: "센서 전압 불안정 및 측정 오작동 발생 기록 확인됨",
      },
      web: {
        citationTitle: "[공식 공지] A사 정밀 전압 센서 펌웨어 오류 및 리콜 안내",
        domain: "supplier-a.com",
        observedAt: "2026-08-25",
        factStatus: "live-observation",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 불량률 수치, 설비 일지, WebIQ fixture를 함께 검토해 B3 센서 결함을 원인 후보로 제시합니다. 실제 인과관계는 현장 점검과 원본 데이터로 확정해야 합니다.",
        proposedAction: "[사람 승인 필요] B3 라인 센서 정밀 점검 및 A사 대체 센서 모듈 임시 할당 승인 요청",
        warningNotice: "공개 웹 출처는 보조 인용이며, 내부 원인은 센서 현장 점검 후 최종 확정해야 함.",
      },
    },
    {
      fabric: {
        metric: "설비 ID #EQ-884 누적 가동시간 4,200시간 (권장 정비 주기 4,000시간 초과)",
        highlights: ["정비 지연 횟수 3회 발생", "가공 정밀도 측정 오차 +0.12mm"],
      },
      work: {
        evidenceTitle: "[Teams] '생산기술팀 채널 대화 스레드'",
        owner: "김생산 수석 (생산기술팀)",
        source: "Teams · 채널메시지",
        details: "EQ-884 부품 수급 지연으로 이번 주 정기 점검 연기 요청 내용 존재",
      },
      web: {
        citationTitle: "[표준 규격] 산업용 가공 설비 안전 가이드라인 v3.2",
        domain: "iso-standards.org",
        observedAt: "2026-08-24",
        factStatus: "official-standard",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 가동시간 초과 수치, 작업팀 대화, WebIQ 표준 fixture를 정비 지연 위험의 검토 신호로 연결합니다. 실제 위험도는 설비 진단으로 다시 평가해야 합니다.",
        proposedAction: "[사람 승인 필요] EQ-884 라인 일시 중단 및 긴급 정비 수송 승인",
        warningNotice: "부품 수급 상황을 재확인하고 수동 교체 여부를 결정하세요.",
      },
    },
    {
      fabric: {
        metric: "공급사 C 부품 입고 불합격률 8.5% (전월 대비 +5.2%p 급증)",
        highlights: ["경도 측정 시험 미달 14건", "입고 수량 5,000개 영향"],
      },
      work: {
        evidenceTitle: "[Outlook] '공급사 C 품질 개선 요청 및 반품 경고 서신.eml'",
        owner: "이수석 (구매팀)",
        source: "Outlook · 메일",
        details: "공급사 C 담당자에게 경도 미달 건에 대한 원인 분석서 및 반품 요청 발송",
      },
      web: {
        citationTitle: "[정부 공시] 원자재 C 규격 안전성 재평가 및 검사 강화 발표",
        domain: "safety.gov",
        observedAt: "2026-08-26",
        factStatus: "official-notice",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 부품 불합격률, 구매팀 서신, WebIQ 공시 fixture를 공급사 C 검수 기준 격상 여부를 검토할 근거 후보로 제시합니다.",
        proposedAction: "[사람 승인 필요] 공급사 C 부품 입고 시 전수 검사 로직 적용 승인",
        warningNotice: "공급계약 조건 변경 시 법무팀 사전 검토가 필요합니다.",
      },
    },
  ],
  "RTL-01": [
    {
      fabric: {
        metric: "신선식품 카테고리 주간 매출 +34% 급증, 재고 순환일수 1.2일로 감소 (품절 임계치 2.0일 미달)",
        highlights: ["수도권 주요 매장 품절률 12.4%", "일별 수요 예측량 상향 필요"],
      },
      work: {
        evidenceTitle: "[SharePoint] '2026-Q3 수도권 물류센터 운영 계획.pptx'",
        owner: "최물류 팀장 (SCM운영팀)",
        source: "SharePoint · 프레젠테이션",
        details: "수도권 2센터 물동량 처리 용량 90% 소진 및 재고 한도 도달",
      },
      web: {
        citationTitle: "[기상청 공지] 주말 수도권 폭염 특보 및 신선식품 수요 폭증 예상",
        domain: "kma.go.kr",
        observedAt: "2026-08-26",
        factStatus: "official-notice",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 매출·재고 신호와 내부 요청, WebIQ 기상 fixture를 긴급 발주와 물동량 배정 검토에 필요한 가설로 제시합니다.",
        proposedAction: "[사람 승인 필요] 수도권 2센터 신선식품 긴급 재고 20% 증대 발주 승인",
        warningNotice: "센터별 보관 온도 한도를 확인 후 순차 입고를 진행해야 합니다.",
      },
    },
    {
      fabric: {
        metric: "강남점 재고 15개(품절 위기), 분당점 재고 240개(과다 보유, 이체 가능 수량)",
        highlights: ["지점 간 재고 편차 16배", "오늘 저녁 소진 예상시간 18:30"],
      },
      work: {
        evidenceTitle: "[Teams] '영업점 재고 조정 요청 스레드'",
        owner: "강남점 점장 (영업 1팀)",
        source: "Teams · 채널메시지",
        details: "강남점 오늘 저녁 수량 소진 예정에 따라 분당점 긴급 수송 요청",
      },
      web: {
        citationTitle: "[도로교통공사] 경부고속도로 오후 차선 통제 및 우회도로 공지",
        domain: "utic.go.kr",
        observedAt: "2026-08-26",
        factStatus: "traffic-info",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 재고 불균형 수치, 영업점 요청, WebIQ 교통 fixture를 대조해 우회 이체 경로 후보를 제시합니다. 실제 경로는 현재 교통 정보로 재확인해야 합니다.",
        proposedAction: "[사람 승인 필요] 분당점 -> 강남점 50개 재고 차량 이체 승인",
        warningNotice: "우회 도로 통행 시간을 고려해 15시 이전 출차해야 합니다.",
      },
    },
    {
      fabric: {
        metric: "여름 프로모션 의류 반품률 18.2% (평시 6.5%), 주요 반품 사유: 치수 표기 오차",
        highlights: ["특정 품목 반품 건수 320건", "손실 비용 약 1,200만원"],
      },
      work: {
        evidenceTitle: "[OneDrive] 'CS센터 8월 고객 피드백 분석.xlsx'",
        owner: "한고객 팀장 (CS운영팀)",
        source: "OneDrive · 스프레드시트",
        details: "실제 사이즈가 표기보다 작음 관련 고객 불만 피드백 140건 집계",
      },
      web: {
        citationTitle: "[소비자원] 의류 치수 표시 표준 가이드라인 및 모니터링",
        domain: "kca.go.kr",
        observedAt: "2026-08-20",
        factStatus: "official-guideline",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 반품률, CS 피드백, WebIQ 지침 fixture를 상품 페이지 표기 오차 가능성을 검토할 근거 후보로 연결합니다.",
        proposedAction: "[사람 승인 필요] 상품 상세페이지 사이즈 가이드 수정 및 CS 보상 쿠폰 발송 승인",
        warningNotice: "기존 구매 고객 대상 안내 문구 사전 승인이 필요합니다.",
      },
    },
  ],
  "LOG-01": [
    {
      fabric: {
        metric: "부산항 물동량 체류시간 4.8일 (평시 1.5일), 전체 국제 배송 지연율 24.5%",
        highlights: ["컨테이너 1,200개 하역 정체", "고객 납기 지연 리스크 증가"],
      },
      work: {
        evidenceTitle: "[Outlook] '해운물류팀 항만 적체 대응 긴급 회의록.eml'",
        owner: "김물류 팀장 (해운운송팀)",
        source: "Outlook · 메일",
        details: "부산항 하역 지연에 따른 대체 터미널 및 광양항 우회 선적 안건 논의",
      },
      web: {
        citationTitle: "[부산항만공사] 북항 컨테이너 터미널 게이트 하역시설 정기 점검 공지",
        domain: "busanpa.com",
        observedAt: "2026-08-25",
        factStatus: "port-notice",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 체류시간 지표, 대응 회의록, WebIQ 항만 공지 fixture를 대조해 대체 항만 선적 계획의 검토안을 제시합니다.",
        proposedAction: "[사람 승인 필요] 광양항 우회 선적 배정 및 화주 안내문 발송 승인",
        warningNotice: "우회 선적에 따른 추가 운임 발생 비용을 재무팀과 확인하세요.",
      },
    },
    {
      fabric: {
        metric: "운송 노선 L-12 평균 소요시간 8.5시간 (기준 5.0시간 대비 +70% 지연)",
        highlights: ["지연 화물차 45대", "연료 소비 및 기사 과로 리스크"],
      },
      work: {
        evidenceTitle: "[SharePoint] '화물차 기사 배차 및 도로 지연 사유 집계.xlsx'",
        owner: "박배차 대리 (육상운송팀)",
        source: "SharePoint · 스프레드시트",
        details: "영동고속도로 구간 전면 정체로 인한 화물 기사 출발 연기 및 우회 요청",
      },
      web: {
        citationTitle: "[국토교통부] 영동고속도로 터널 공사 및 1차선 전면 통제 공시",
        domain: "molit.go.kr",
        observedAt: "2026-08-26",
        factStatus: "official-notice",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 운송 지연 수치, 배차 집계, WebIQ 도로 통제 fixture를 결합해 우회 배차 경로 후보를 제시합니다. 실제 통제 상태로 다시 확인해야 합니다.",
        proposedAction: "[사람 승인 필요] 노선 L-12 차량 대상 국도 우회 경로 지침 전달 승인",
        warningNotice: "국도 통행 제한 차종 및 과적 기준을 반드시 준수하세요.",
      },
    },
    {
      fabric: {
        metric: "수하물 지연 문의 420건/주, SLA 준수율 78% (목표 95% 미달)",
        highlights: ["고객 불만 지수 4.2점 도출", "손해 배상 청구 가능성"],
      },
      work: {
        evidenceTitle: "[Teams] '고객만족팀 대응 매뉴얼 및 지연 보상안 스레드'",
        owner: "이CS 팀장 (고객지원팀)",
        source: "Teams · 채널메시지",
        details: "수하물 지연 시 보상 쿠폰 발급 및 정기 알림 서비스 규정 검토",
      },
      web: {
        citationTitle: "[국제항공운송협회(IATA)] 수하물 추적 서비스 규정 v2.1",
        domain: "iata.org",
        observedAt: "2026-08-21",
        factStatus: "international-standard",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 SLA 수치, 보상 매뉴얼, WebIQ 규정 fixture를 수하물 지연 보상과 알림 일정 검토안에 연결합니다.",
        proposedAction: "[사람 승인 필요] SLA 지연 대상 고객 보상 쿠폰 자동 발급 시스템 승인",
        warningNotice: "보상 한도액 초과 건은 원무/고객팀 개별 심사를 거쳐야 합니다.",
      },
    },
  ],
  "FIN-01": [
    {
      fabric: {
        metric: "임계치($100,000) 초과 분할 입출금 패턴 28건 감지, 총 이상 자금 $3,400,000",
        highlights: ["단기 계좌 간 복수 송금 패턴", "위험도 점수 92점 도출"],
      },
      work: {
        evidenceTitle: "[SharePoint] 'AML 준법감시위원회 고위험 거래 검토 보고서.pdf'",
        owner: "정준법 이사 (준법감시실)",
        source: "SharePoint · 보안문서",
        details: "가상자산 거래소 연계 의심 패턴에 대한 정밀 심사 안건 기록",
      },
      web: {
        citationTitle: "[금융정보분석원(FIU)] 고위험 가상자산 연계 의심거래 보고 가이드라인",
        domain: "kfiu.go.kr",
        observedAt: "2026-08-25",
        factStatus: "regulatory-guideline",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 분할 거래 지표, AML 보고서, WebIQ 규정 fixture를 의심거래보고(STR) 검토 후보로 묶습니다. 실제 보고 여부는 준법 담당자가 원본 근거로 판단해야 합니다.",
        proposedAction: "[사람 승인 필요] FIU 제출용 의심거래보고서(STR) 안건 결재 승인",
        warningNotice: "보고서 제출 전 관련 계좌의 추가 거래 내역 재검증이 필요합니다.",
      },
    },
    {
      fabric: {
        metric: "단기 신설 계좌 중 24시간 내 이체 한도 소진 비율 14.5% (평시 1.1%)",
        highlights: ["명의 도용 의심 계좌 14건", "비대면 계좌 개설 포함"],
      },
      work: {
        evidenceTitle: "[OneDrive] 'KYC 서류 심사 및 비대면 명의 확인 결과 가이드.docx'",
        owner: "송리동 팀장 (KYC심사팀)",
        source: "OneDrive · 실무가이드",
        details: "신분증 진위확인 및 대포통장 의심 신호 분류 기준 공유",
      },
      web: {
        citationTitle: "[경찰청 Cyber] 최근 신종 명의도용 대포통장 수법 주의 경보",
        domain: "police.go.kr",
        observedAt: "2026-08-26",
        factStatus: "police-warning",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 한도 소진 비율, KYC 가이드, WebIQ 경보 fixture를 추가 본인 확인이 필요한 계좌 검토 후보를 찾는 예시로 사용합니다.",
        proposedAction: "[사람 승인 필요] 고위험 14개 계좌 한도 임시 동결 조치 승인",
        warningNotice: "실제 정상 고객 불이익 최소화를 위해 2차 확인 콜센터 연동을 병행하세요.",
      },
    },
    {
      fabric: {
        metric: "국제 제재 리스트(Sanctions List) 매칭 가능성 계좌 3건 감지",
        highlights: ["성명 및 생년월일 유사도 95%", "해외 송금 대기 중"],
      },
      work: {
        evidenceTitle: "[Outlook] '외환 컴플라이언스팀 제재 대상자 정밀 심사 요청.eml'",
        owner: "김외환 수석 (외환운영팀)",
        source: "Outlook · 메일",
        details: "OFAC 제재 대상자와의 동명이인 검증 및 거래 정지 여부 문의",
      },
      web: {
        citationTitle: "[OFAC / UN] 최신 국제 금융 제재 지정 목록",
        domain: "treasury.gov",
        observedAt: "2026-08-26",
        factStatus: "global-sanction",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 계좌 매칭 데이터, 컴플라이언스 서신, WebIQ 제재 목록 fixture를 준법 검토가 필요한 잠재 일치 후보로 제시합니다. 동결 여부를 판정하지 않습니다.",
        proposedAction: "[사람 승인 필요] 해당 3개 계좌 외환 입출금 일시 정지 승인",
        warningNotice: "제재 대상자동명이인 여부를 법무/준법팀에서 최종 확인해야 합니다.",
      },
    },
  ],
  "HC-01": [
    {
      fabric: {
        metric: "응급실 병상 가동률 96.5%, 평균 입원 대기시간 4.2시간 (기준 2.0시간 초과)",
        highlights: ["응급 병상 잔여 2개", "환자 과밀화 지수 심각 단계"],
      },
      work: {
        evidenceTitle: "[SharePoint] '병동 병상 회전율 개선 및 인계장.docx'",
        owner: "이수간호사 (응급간호팀)",
        source: "SharePoint · 간호문서",
        details: "입원 대기 환자 수용을 위한 일반 병동 예비 병상 전환 안건 기록",
      },
      web: {
        citationTitle: "[질병관리청] 계절성 호흡기 감염병 유행 주의보 발표",
        domain: "kdca.go.kr",
        observedAt: "2026-08-26",
        factStatus: "official-advisory",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 병상 가동률, 간호 인계장, WebIQ 주의보 fixture를 일반 병동의 응급 전환 시나리오를 검토할 신호로 제시합니다. 실제 전환은 임상·운영 책임자가 결정해야 합니다.",
        proposedAction: "[사람 승인 필요] 일반 병동 예비 병상 10개 응급실 전용 전환 승인",
        warningNotice: "원내 감염 관리 지침 및 병동 간호 인력 배치를 동시 점검하세요.",
      },
    },
    {
      fabric: {
        metric: "필수 항생제 A 재고 잔여일수 1.5일 (안전재고 임계치 5.0일 미달)",
        highlights: ["일별 소진량 180병", "수급 불균형 심화"],
      },
      work: {
        evidenceTitle: "[Teams] '약제부 수급 비상 채널'",
        owner: "박약사 (약제부)",
        source: "Teams · 채널메시지",
        details: "항생제 A 재고 고갈 대비 대체 약제 B 처방 전환 가이드 공유",
      },
      web: {
        citationTitle: "[식약처] 의약품 수급 불안정 모니터링 및 우선 공급 공지",
        domain: "mfds.go.kr",
        observedAt: "2026-08-25",
        factStatus: "official-notice",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 약제 재고 수치, 약제부 대화, WebIQ 수급 공지 fixture를 대체 약제 검토안의 입력으로 제시합니다. 임상 적합성은 약제·진료 담당자가 확인해야 합니다.",
        proposedAction: "[사람 승인 필요] EMR 처방 시스템 내 대체 약제 B 우선 추천 팝업 적용 승인",
        warningNotice: "대체 약제 B의 환자 알레르기 교차 반응 여부를 EMR에서 자동 체크해야 합니다.",
      },
    },
    {
      fabric: {
        metric: "퇴원 수속 대기건 38건, 결제 및 구비서류 수령 평균 1.8시간 소요",
        highlights: ["창구 혼잡도 최고치", "환자 만족도 저하"],
      },
      work: {
        evidenceTitle: "[OneDrive] '원무과 퇴원 프로세스 모바일화 매뉴얼.pptx'",
        owner: "최원무 파트장 (원무팀)",
        source: "OneDrive · 업무매뉴얼",
        details: "모바일 결제 및 전자 제증명 발급 도입 시 소요시간 70% 단축 예상",
      },
      web: {
        citationTitle: "[보건복지부] 요양급여 제증명서 발급 전자화 지침",
        domain: "mohw.go.kr",
        observedAt: "2026-08-20",
        factStatus: "governmental-guideline",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 대기 수속 수치, 원무과 매뉴얼, WebIQ 전자화 지침 fixture를 모바일 퇴원 수속 개선안 검토에 연결합니다.",
        proposedAction: "[사람 승인 필요] 퇴원 대기 환자 대상 모바일 알림톡 및 전자 결제 발송 승인",
        warningNotice: "고령 환자 및 보호자 대상 현장 원무 창구 안내 요원을 병행 배치하세요.",
      },
    },
  ],
  "TEL-01": [
    {
      fabric: {
        metric: "서울 B구 기지국 패킷 손실률 5.8% (정상 <0.5%), 음성 통화 성공률 91.2%로 저하",
        highlights: ["접속 집중 트래픽 평시 대비 450% 증가", "품질 경보 발생"],
      },
      work: {
        evidenceTitle: "[SharePoint] '네트워크 운용센터(NOC) 8월 장애 보고서.pdf'",
        owner: "강네트워크 팀장 (NOC운영팀)",
        source: "SharePoint · 보고서",
        details: "서울 B구 행사지역 트래픽 폭주로 인한 기지국 자원 부족 기록",
      },
      web: {
        citationTitle: "[공공 데이터] B구 대형 야외 음악 페스티벌 개최 공지",
        domain: "seoul.go.kr",
        observedAt: "2026-08-26",
        factStatus: "public-event",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 패킷 손실 수치, NOC 보고서, WebIQ 행사 공지 fixture를 트래픽 증가의 원인 후보로 검토하고 이동기지국 배치안을 비교합니다.",
        proposedAction: "[사람 승인 필요] B구 행사장에 이동기지국 차량 2대 긴급 출동 승인",
        warningNotice: "행사장 주변 전력 공급 상태 및 주차 공간 확보를 사전에 확인하세요.",
      },
    },
    {
      fabric: {
        metric: "광케이블 구간 L-3 단선 감지, 정전/통신 장애 고객 4,200가구, 예상 복구시간 3시간",
        highlights: ["광회로 절단 신호 감지", "자동 경보 발령"],
      },
      work: {
        evidenceTitle: "[Teams] '현장 복구반 긴급 채널'",
        owner: "임복구 반장 (선로유지보수팀)",
        source: "Teams · 채널메시지",
        details: "타사 굴착 공사 작업 중 케이블 파손 현장 도착 및 우회 회로 절체 요청",
      },
      web: {
        citationTitle: "[지자체 도로과] 도시가스 배관 굴착 공사 도로 점용 승인 내역",
        domain: "city.go.kr",
        observedAt: "2026-08-26",
        factStatus: "construction-approval",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 단선 신호, 현장 보고, WebIQ 공사 내역 fixture를 손상 원인 후보로 연결하고 우회 회로 전환 검토안을 제시합니다.",
        proposedAction: "[사람 승인 필요] 백본 우회 회로 절체 및 긴급 복구반 작업 승인",
        warningNotice: "우회 회로 전환 시 인근 기지국 대역폭 여유분을 모니터링하세요.",
      },
    },
    {
      fabric: {
        metric: "장애 관련 VOC 접수 850건/시간, 평시 대비 12배 폭증",
        highlights: ["고객센터 상담원 연결 대기시간 12분", "SNS 불만 확산"],
      },
      work: {
        evidenceTitle: "[Outlook] '고객보호팀 장애 발생에 따른 보상 가이드라인 공유.eml'",
        owner: "윤고객 팀장 (고객케어팀)",
        source: "Outlook · 메일",
        details: "3시간 이상 장애 지속 시 요금 감면 및 보상 SMS 발송 가이드 공유",
      },
      web: {
        citationTitle: "[방송통신위원회] 통신서비스 장애 발생 시 이용자 피해보상 기준 약관",
        domain: "kcc.go.kr",
        observedAt: "2026-08-22",
        factStatus: "governmental-regulation",
      },
      foundry: {
        briefingAnswer: "교육용 simulation에서는 VOC 수치, 고객보호팀 회의록, WebIQ 보상 약관 fixture를 장애 알림과 보상안 검토에 연결합니다.",
        proposedAction: "[사람 승인 필요] 장애 지역 영향 고객 대상 사과 SMS 및 요금 감면 승인",
        warningNotice: "중복 발송 방지를 위해 고객 수신 목록을 일괄 검증하세요.",
      },
    },
  ],
}

function getExampleQuestionFlows(id, exampleQuestions) {
  const flows = INDUSTRY_QUESTION_FLOWS[id]
  assert(flows, `${id}: missing example question flow fixtures`)
  assert(
    flows.length === exampleQuestions.length,
    `${id}: expected ${exampleQuestions.length} example question flows, found ${flows.length}`,
  )

  return exampleQuestions.map((q, idx) => {
    const flow = flows[idx]
    return {
      questionIndex: idx,
      perspective: q.perspective,
      question: q.question,
      ...flow,
      web: {
        ...flow.web,
        citationTitle: `[교육용 fixture] ${flow.web.citationTitle}`,
        factStatus: "fixture-contract",
        limitations:
          "현재의 실제 경보·리콜·규제 변경·교통·기상·장애를 증명하지 않는 교육용 고정 샘플입니다.",
      },
      foundry: {
        ...flow.foundry,
        proposedAction: flow.foundry.proposedAction.replace(
          "[사람 승인 필요]",
          "[교육용 검토안 · 사람 승인 필요]",
        ),
        warningNotice:
          `수치·내부 근거·웹 인용은 모두 교육용 fixture이며 실제 조치에 사용할 수 없습니다. ${flow.foundry.warningNotice}`,
      },
    }
  })
}

// Parses one authoritative industry_playground/scenarios/*.md document into a
// structured object the Playground UI can render directly. Every required
// section and item is validated; missing or malformed content throws instead
// of producing a silently incomplete scenario.
function parseIndustryScenario(markdown, fileName) {
  const sourceLabel = `industry_playground/scenarios/${fileName}`

  const titleMatch = /^# ([A-Z]+-\d+) (\S+) — (.+)$/m.exec(markdown)
  assert(titleMatch, `${sourceLabel}: missing "# ID INDUSTRY — TITLE" heading`)
  const [headingLine, id, industry, title] = titleMatch

  const expectedId = fileName.split("-").slice(0, 2).join("-")
  assert(
    id === expectedId,
    `${sourceLabel}: heading id "${id}" does not match filename id "${expectedId}"`,
  )

  const purpose = collapseWhitespace(extractSection(markdown, "목적과 범위", 2, sourceLabel))
  const exampleQuestions = parseExampleQuestions(
    extractSection(markdown, "예시 질문", 2, sourceLabel),
    sourceLabel,
  )
  const verificationQuestions = parseVerificationQuestions(
    extractSection(markdown, "확인할 질문", 2, sourceLabel),
    sourceLabel,
  )

  const processingBody = extractSection(markdown, "IQ별 처리", 2, sourceLabel)

  const iq = IQ_SUBSECTIONS.map(({ heading, id: iqId, name, label }) => {
    const body = extractSection(processingBody, heading, 3, sourceLabel)
    const bullets = extractLabeledBullets(body, IQ_BULLET_LABELS, `${sourceLabel} (${heading})`)
    return {
      id: iqId,
      name,
      label,
      inputScope: bullets["입력/범위"],
      processing: bullets["처리·검증 단계"],
      output: bullets["출력/인계"],
      limits: bullets["한계/비목표"],
    }
  })

  const fallback = parseFallbackTable(
    extractSection(processingBody, "Fallback 및 완료 판단", 3, sourceLabel),
    sourceLabel,
  )

  const diagram = parseDiagram(
    extractSection(processingBody, "처리 흐름 다이어그램", 3, sourceLabel),
    sourceLabel,
  )

  const approval = collapseWhitespace(
    extractSection(markdown, "승인 경계와 완료 기준", 2, sourceLabel),
  )

  const exampleQuestionFlows = getExampleQuestionFlows(id, exampleQuestions)

  return {
    id,
    industry,
    title: title.trim(),
    heading: headingLine.replace(/^# /, "").trim(),
    purpose,
    exampleQuestions,
    exampleQuestionFlows,
    verificationQuestions,
    iq,
    fallback,
    diagram,
    approval,
    sourceDocument: {
      path: `industry_playground/scenarios/${fileName}`,
      url: `https://github.com/trentkim-ms-ats/microsoft-iq-workshop/blob/main/industry_playground/scenarios/${fileName}`,
    },
  }
}

async function loadIndustryScenarios() {
  const fileNames = (await readdir(industryScenariosDir))
    .filter((name) => name.endsWith(".md"))
    .sort()

  assert(
    fileNames.length === EXPECTED_INDUSTRY_SCENARIO_COUNT,
    `industry_playground/scenarios: expected ${EXPECTED_INDUSTRY_SCENARIO_COUNT} scenario files, found ${fileNames.length}`,
  )

  const scenarios = await Promise.all(
    fileNames.map(async (fileName) => {
      const markdown = await readFile(resolve(industryScenariosDir, fileName), "utf8")
      return parseIndustryScenario(markdown, fileName)
    }),
  )

  const ids = new Set(scenarios.map((scenario) => scenario.id))
  assert(
    ids.size === scenarios.length,
    "industry_playground/scenarios: duplicate scenario ids detected",
  )

  return scenarios
}

const [
  entities,
  coreRelationships,
  extensionRelationships,
  contentCatalog,
  sourceCatalog,
  webEvidence,
  scenariosPayload,
  structuredMetrics,
  workEvidence,
  industryScenarios,
] = await Promise.all([
  readJson("track1/data/generated/workbench/mission4_entities.json"),
  readJson("track1/data/generated/workbench/mission4_relationships_core.json"),
  readJson("track1/data/generated/workbench/mission4_relationships_extension.json"),
  readJson("track2/data/generated/manifests/content_catalog.json"),
  readJson("track3/data/source_catalog.json"),
  readJson("track3/data/web_evidence_fixture.json"),
  readJson("track4/data/generated/scenarios.json"),
  readJson("track4/data/generated/tool_a_metrics.json"),
  readJson("track4/data/generated/tool_b_evidence.json"),
  loadIndustryScenarios(),
])

const relationships = [...coreRelationships, ...extensionRelationships].map((label) => {
  const cleaned = label.replace(/\s+\(logical(?: path)?\)$/, "")
  const [from, relation, to] = cleaned.split(" ")
  return {
    from,
    relation,
    to,
    logical: label.includes("(logical"),
  }
})

const m365SourceCounts = contentCatalog.reduce((counts, item) => {
  counts[item.source] = (counts[item.source] ?? 0) + 1
  return counts
}, {})

function validateStructuredMetrics(scenarioId, metricEntry) {
  assert(
    Array.isArray(metricEntry.highlights) && metricEntry.highlights.length > 0,
    `Incomplete structured metrics for ${scenarioId}: highlights are required`,
  )

  if (scenarioId === "Q1") {
    assert(
      Array.isArray(metricEntry.perCampaign) && metricEntry.perCampaign.length > 0,
      "Incomplete structured metrics for Q1: perCampaign must contain campaign comparisons",
    )
  } else if (scenarioId === "Q2") {
    assert(
      Number(metricEntry.delayedOrderCount) > 0,
      "Incomplete structured metrics for Q2: delayedOrderCount must be greater than zero",
    )
  } else if (scenarioId === "Q3") {
    assert(
      Array.isArray(metricEntry.perProduct) && metricEntry.perProduct.length === 3,
      "Incomplete structured metrics for Q3: perProduct must contain exactly three products",
    )
  }
}

const scenarios = scenariosPayload.scenarios.map((scenario) => {
  const catalogEntry = sourceCatalog.scenarios.find(
    (entry) => entry.scenarioId === scenario.id,
  )
  const webEntry = webEvidence.scenarios[scenario.id]
  const metricEntry = structuredMetrics[scenario.id]
  const workEntry = workEvidence[scenario.id]

  if (!catalogEntry || !webEntry || !metricEntry || !workEntry) {
    throw new Error(`Incomplete generated data for ${scenario.id}`)
  }
  validateStructuredMetrics(scenario.id, metricEntry)

  return {
    ...scenario,
    metrics: metricEntry,
    workEvidence: workEntry.evidence,
    sourceCoverage: workEntry.sourceCoverage,
    webQuestion: catalogEntry.webQuestion,
    queryTemplate: catalogEntry.queryTemplate,
    interpretationBoundary: catalogEntry.interpretationBoundary,
    webEvidence: webEntry.evidence,
  }
})

const output = {
  sourceAsOf: {
    webCatalog: sourceCatalog.catalogAsOf,
    webFixture: webEvidence.fixtureAsOf,
  },
  stats: {
    iqCount: 4,
    entityCount: entities.length,
    relationshipCount: relationships.length,
    m365ItemCount: contentCatalog.length,
    webCitationCount: Object.values(webEvidence.scenarios).reduce(
      (total, entry) => total + entry.evidence.length,
      0,
    ),
    scenarioCount: scenarios.length,
    strictGateCount: 8,
    industryScenarioCount: industryScenarios.length,
  },
  ontology: {
    entities,
    relationships,
  },
  m365SourceCounts,
  fixtureNotice: webEvidence.fixtureNotice,
  scenarios,
  industryScenarios,
}

const generatedModule = `// Generated by scripts/generate-data.mjs. Do not edit manually.
export const workshopData = ${JSON.stringify(output, null, 2)} as const
`

await writeFile(
  resolve(playgroundRoot, "src/data/generated.ts"),
  generatedModule,
  "utf8",
)

console.log(
  `[Microsoft IQ Playground] Generated ${entities.length} entities, ${relationships.length} relationships, ${contentCatalog.length} M365 items, ${output.stats.webCitationCount} citations, and ${industryScenarios.length} industry scenarios.`,
)
