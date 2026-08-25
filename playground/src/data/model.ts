export type IqId = "fabric" | "work" | "web" | "foundry"
export type ExplorerTab = "inspector" | "scenario" | "fallback"
export type FallbackMode =
  | "normal"
  | "fabric-down"
  | "work-down"
  | "web-down"
  | "internal-down"
  | "all-down"

export interface IqDefinition {
  id: IqId
  track: string
  name: string
  shortName: string
  source: string
  responsibility: string
  description: string
  inputs: string[]
  outputs: string[]
  boundaries: string[]
  document: string
}

export const iqDefinitions: IqDefinition[] = [
  {
    id: "fabric",
    track: "Track1",
    name: "FabricIQ",
    shortName: "정형 사실",
    source: "Fabric Lakehouse · Ontology",
    responsibility: "내부 비즈니스의 정형 지표를 계산하고 관계 경로를 검증합니다.",
    description:
      "14개 샘플 테이블을 공통 엔터티와 관계로 연결해 결제, 배송, 반품, 재고 신호를 재현 가능한 수치로 만듭니다.",
    inputs: ["CSV 14종", "Ontology 엔터티 15개", "핵심 의미 경로"],
    outputs: ["structuredMetrics", "highlights", "sourceTrace"],
    boundaries: [
      "M365 문서에서 비율을 역산하지 않습니다.",
      "외부 웹 사건을 내부 KPI의 원인으로 단정하지 않습니다.",
    ],
    document: "https://github.com/trentkim-ms-ats/microsoft-iq-workshop/blob/main/track1/QUICKSTART.md",
  },
  {
    id: "work",
    track: "Track2",
    name: "WorkIQ",
    shortName: "업무 맥락",
    source: "Outlook · Teams · SharePoint · OneDrive",
    responsibility: "ACL을 적용한 Microsoft 365 근거에서 내부 논의와 결정을 찾습니다.",
    description:
      "60개 샘플 업무 항목을 검색하고, 출처·소유자·업무 날짜·ACL 품질을 보존한 evidence link를 제공합니다.",
    inputs: ["Track1 의미 키", "M365 샘플 60건", "재현 검색어"],
    outputs: ["evidenceLinks", "sourceCoverage", "sourceTrace"],
    boundaries: [
      "사용자가 접근할 수 없는 문서를 노출하지 않습니다.",
      "FabricIQ 계산 결과를 비정형 문서 근거처럼 사용하지 않습니다.",
    ],
    document: "https://github.com/trentkim-ms-ats/microsoft-iq-workshop/blob/main/track2/QUICKSTART.md",
  },
  {
    id: "web",
    track: "Track3",
    name: "WebIQ",
    shortName: "외부 최신 근거",
    source: "공개 웹 · 공식 상태/정부/표준 출처",
    responsibility: "공개 웹의 최신 외부 사실을 URL citation과 확인 시각으로 제공합니다.",
    description:
      "내부 질문을 개인정보 없는 공개 확인 질문으로 분리하고, Q1~Q3마다 공식 출처 citation을 평가합니다.",
    inputs: ["공개 확인 질문", "허용 도메인", "시간·지역 범위"],
    outputs: ["webCitations", "factStatus", "limitations"],
    boundaries: [
      "고객 ID, 주문 ID, 내부 URL, 미공개 수치를 웹 질의에 넣지 않습니다.",
      "fixture를 현재 장애·경보·리콜의 증거로 표현하지 않습니다.",
    ],
    document: "https://github.com/trentkim-ms-ats/microsoft-iq-workshop/blob/main/track3/QUICKSTART.md",
  },
  {
    id: "foundry",
    track: "Track4",
    name: "FoundryIQ",
    shortName: "결합·평가",
    source: "권위 지식 · Foundry Agent Service",
    responsibility: "세 근거를 라우팅·결합·평가하고 근거 있는 최종 응답을 만듭니다.",
    description:
      "FabricIQ, WorkIQ, WebIQ의 책임을 sourceTrace로 분리하고, 일부 소스 실패 시 부분응답 또는 차단 정책을 적용합니다.",
    inputs: ["structuredMetrics", "evidenceLinks", "webCitations"],
    outputs: ["Microsoft IQ 응답", "평가 리포트", "리더십 브리핑"],
    boundaries: [
      "없는 숫자·링크·인과관계를 만들지 않습니다.",
      "두 내부 근거가 모두 실패하면 공개 웹만으로 답하지 않고 차단합니다.",
    ],
    document: "https://github.com/trentkim-ms-ats/microsoft-iq-workshop/blob/main/track4/QUICKSTART.md",
  },
]

export interface Quest {
  id: string
  title: string
  level: "입문" | "중급" | "고급"
  summary: string
  reward: string
  points: number
  focus: IqId
  tab: ExplorerTab
  scenarioId?: "Q1" | "Q2" | "Q3"
  mode?: FallbackMode
}

export const quests: Quest[] = [
  {
    id: "meet-iq",
    title: "Microsoft IQ 만나기",
    level: "입문",
    summary: "각 IQ 노드를 선택해 소스, 책임, 금지 경계를 비교합니다.",
    reward: "역할 설계자",
    points: 100,
    focus: "fabric",
    tab: "inspector",
  },
  {
    id: "evidence-trail",
    title: "배송 지연 근거 추적",
    level: "중급",
    summary: "Q2를 따라 정형 지표, 내부 문서, 외부 확인 질문을 연결합니다.",
    reward: "근거 추적자",
    points: 200,
    focus: "foundry",
    tab: "scenario",
    scenarioId: "Q2",
  },
  {
    id: "citation-guard",
    title: "Citation 경계 지키기",
    level: "중급",
    summary: "WebIQ fixture의 fact status와 limitation을 확인합니다.",
    reward: "출처 수호자",
    points: 200,
    focus: "web",
    tab: "scenario",
    scenarioId: "Q1",
  },
  {
    id: "fallback-lab",
    title: "Fallback 실험실",
    level: "고급",
    summary: "소스 실패 모드를 바꿔 partial과 blocked의 차이를 확인합니다.",
    reward: "복원력 설계자",
    points: 300,
    focus: "foundry",
    tab: "fallback",
    scenarioId: "Q1",
    mode: "web-down",
  },
  {
    id: "trace-auditor",
    title: "SourceTrace 감사",
    level: "고급",
    summary: "Q3 응답에서 Microsoft IQ 구성요소의 역할과 출처가 분리되는지 검토합니다.",
    reward: "트레이스 감사자",
    points: 350,
    focus: "foundry",
    tab: "scenario",
    scenarioId: "Q3",
  },
]

export interface FallbackDefinition {
  id: FallbackMode
  label: string
  status: "pass" | "partial" | "blocked"
  unavailable: IqId[]
  attempts: number
  summary: string
  warning: string
}

export const fallbackDefinitions: FallbackDefinition[] = [
  {
    id: "normal",
    label: "Normal",
    status: "pass",
    unavailable: [],
    attempts: 1,
    summary: "세 근거를 결합하고 Microsoft IQ 구성요소가 분리된 sourceTrace를 반환합니다.",
    warning: "simulation 결과를 실제 운영 호출 결과처럼 표현하지 않습니다.",
  },
  {
    id: "fabric-down",
    label: "Fabric ↓",
    status: "partial",
    unavailable: ["fabric"],
    attempts: 4,
    summary: "정형 지표 없이 WorkIQ와 WebIQ 근거만 제한적으로 제공합니다.",
    warning: "수치를 추정하거나 M365 문서에서 역산하지 않습니다.",
  },
  {
    id: "work-down",
    label: "Work ↓",
    status: "partial",
    unavailable: ["work"],
    attempts: 4,
    summary: "정형 지표와 외부 citation은 유지하지만 내부 논의 근거는 제외합니다.",
    warning: "담당자, 내부 결정, 원인을 추정하지 않습니다.",
  },
  {
    id: "web-down",
    label: "Web ↓",
    status: "partial",
    unavailable: ["web"],
    attempts: 4,
    summary: "두 내부 근거로 부분응답을 만들고 외부 최신 근거 없음을 명시합니다.",
    warning: "외부 최신 근거 없음",
  },
  {
    id: "internal-down",
    label: "Internal ↓",
    status: "blocked",
    unavailable: ["fabric", "work"],
    attempts: 4,
    summary: "공개 웹만 남았으므로 내부 비즈니스 질문에 답하지 않습니다.",
    warning: "내부 근거 복구 후 재실행해야 합니다.",
  },
  {
    id: "all-down",
    label: "All ↓",
    status: "blocked",
    unavailable: ["fabric", "work", "web"],
    attempts: 4,
    summary: "사용 가능한 근거가 없어 응답 생성을 차단합니다.",
    warning: "세 adapter와 권한·schema를 점검해야 합니다.",
  },
]

export interface GraphNodeDefinition {
  id: string
  label: string
  subtitle: string
  kind: "source" | "iq" | "output"
  x: number
  y: number
  width: number
  inspectId: IqId
}

export const graphNodes: GraphNodeDefinition[] = [
  { id: "lakehouse", label: "Lakehouse", subtitle: "14 tables", kind: "source", x: 100, y: 92, width: 142, inspectId: "fabric" },
  { id: "fabric", label: "FabricIQ", subtitle: "structured facts", kind: "iq", x: 310, y: 92, width: 154, inspectId: "fabric" },
  { id: "m365", label: "Microsoft 365", subtitle: "60 work items", kind: "source", x: 100, y: 258, width: 142, inspectId: "work" },
  { id: "work", label: "WorkIQ", subtitle: "ACL evidence", kind: "iq", x: 310, y: 258, width: 154, inspectId: "work" },
  { id: "public-web", label: "Public web", subtitle: "official sources", kind: "source", x: 100, y: 424, width: 142, inspectId: "web" },
  { id: "web", label: "WebIQ", subtitle: "URL citations", kind: "iq", x: 310, y: 424, width: 154, inspectId: "web" },
  { id: "knowledge", label: "Authority", subtitle: "policies · knowledge", kind: "source", x: 586, y: 92, width: 154, inspectId: "foundry" },
  { id: "foundry", label: "FoundryIQ", subtitle: "route · combine · evaluate", kind: "iq", x: 586, y: 258, width: 178, inspectId: "foundry" },
  { id: "briefing", label: "Grounded briefing", subtitle: "answer · actions · warnings", kind: "output", x: 826, y: 258, width: 178, inspectId: "foundry" },
]

export const graphEdges = [
  ["lakehouse", "fabric"],
  ["fabric", "foundry"],
  ["m365", "work"],
  ["work", "foundry"],
  ["public-web", "web"],
  ["web", "foundry"],
  ["knowledge", "foundry"],
  ["foundry", "briefing"],
] as const
