import { useCallback, useEffect, useRef, useState } from "react"
import type { FormEvent, RefObject } from "react"
import {
  Award,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  Globe2,
  Info,
  Link2,
  LockKeyhole,
  Moon,
  Network,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  Target,
  Trophy,
  X,
} from "lucide-react"
import { FlowGraph } from "@/components/FlowGraph"
import { workshopData } from "@/data/generated"
import {
  fallbackDefinitions,
  industryQuests,
  iqDefinitions,
  quests,
  representativeQuests,
  type ExplorerTab,
  type FallbackMode,
  type IqDefinition,
  type IqId,
  type Quest,
} from "@/data/model"

const COMPLETED_QUESTS_KEY = "microsoft-iq-playground-quests"
const PANEL_GUIDE_AUTO_KEY = "microsoft-iq-playground-panel-guide-auto"

const PANEL_GUIDE_STEPS = [
  {
    selector: "#missions",
    eyebrow: "PANEL 1 · 학습 선택",
    title: "학습 미션 패널",
    description:
      "권장 학습 순서 또는 산업별 실습을 선택하고, 현재 미션의 목표와 완료 기준을 확인하는 공간입니다.",
    details: [
      "미션 카드를 선택하면 관련 시나리오, IQ 포커스, 학습 탭이 함께 이동합니다.",
      "난이도·역할·점수를 확인하고 해볼 일과 완료 확인을 수행하세요.",
      "완료 표시는 선택한 미션에서만 활성화되며, 선택 전에는 흐림 상태로 유지됩니다.",
    ],
  },
  {
    selector: "#flow",
    eyebrow: "PANEL 2 · 근거 흐름",
    title: "근거 흐름 패널",
    description:
      "한 질문이 FabricIQ, WorkIQ, WebIQ, FoundryIQ를 거쳐 근거 기반 브리핑이 되는 순서를 시각화합니다.",
    details: [
      "상단에서 대표 Q1~Q3 또는 여섯 산업 시나리오를 선택할 수 있습니다.",
      "IQ 노드를 선택하면 해당 경로가 강조되고 오른쪽 상세 학습도 같은 IQ로 이동합니다.",
      "하단 sourceTrace에서 각 IQ의 사용 가능 여부와 PASS·PARTIAL·BLOCKED 상태를 확인하세요.",
    ],
  },
  {
    selector: "#explorer",
    eyebrow: "PANEL 3 · 상세 검증",
    title: "IQ 상세 학습 패널",
    description:
      "선택한 IQ의 책임과 금지 경계, 시나리오별 근거, 장애 시 안전 동작을 자세히 확인하는 공간입니다.",
    details: [
      "IQ 역할에서 입력·출력 계약과 금지 경계를 먼저 확인하세요.",
      "근거 보기에서 정형 수치, ACL 적용 내부 근거, 교육용 WebIQ citation을 비교하세요.",
      "장애 대응에서 정상 결론이 언제 부분응답으로 제한되거나 완전히 차단되는지 실험하세요.",
    ],
  },
] as const

interface PanelGuideTarget {
  top: number
  left: number
  width: number
  height: number
  right: number
}

function getInitialParam(name: string) {
  return new URLSearchParams(window.location.search).get(name)
}

function getInitialIq(): IqId {
  const value = getInitialParam("iq")
  return iqDefinitions.some((definition) => definition.id === value)
    ? (value as IqId)
    : "fabric"
}

function getInitialScenarioId() {
  const value = getInitialParam("scenario")
  return workshopData.scenarios.some((scenario) => scenario.id === value)
    ? value!
    : "Q1"
}

function getInitialMode(): FallbackMode {
  const value = getInitialParam("mode")
  return fallbackDefinitions.some((definition) => definition.id === value)
    ? (value as FallbackMode)
    : "normal"
}

function getInitialIndustryScenarioId() {
  const value = getInitialParam("industry")
  return workshopData.industryScenarios.some((scenario) => scenario.id === value)
    ? value!
    : ""
}

function getInitialExplorerTab(): ExplorerTab {
  const value = getInitialParam("tab")
  const tabs: ExplorerTab[] = ["inspector", "scenario", "fallback"]
  if (tabs.includes(value as ExplorerTab)) {
    return value as ExplorerTab
  }
  return "inspector"
}

function getInitialQuestId() {
  const industryScenarioId = getInitialIndustryScenarioId()
  return (
    industryQuests.find((quest) => quest.industryScenarioId === industryScenarioId)?.id ??
    representativeQuests[0]?.id ??
    quests[0].id
  )
}

function getCompletedQuests() {
  const stored = window.localStorage.getItem(COMPLETED_QUESTS_KEY)
  if (!stored) {
    return new Set<string>()
  }

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
      throw new Error("Quest progress must be a string array")
    }
    return new Set(parsed)
  } catch (error) {
    console.warn("Microsoft IQ Playground quest progress was reset.", error)
    window.localStorage.removeItem(COMPLETED_QUESTS_KEY)
    return new Set<string>()
  }
}

function getPanelGuideAutoShow() {
  const stored = window.localStorage.getItem(PANEL_GUIDE_AUTO_KEY)
  if (stored === null || stored === "true") return true
  if (stored === "false") return false

  console.warn("Microsoft IQ Playground panel guide preference was reset.")
  window.localStorage.removeItem(PANEL_GUIDE_AUTO_KEY)
  return true
}

function statusLabel(status: "pass" | "partial" | "blocked") {
  if (status === "pass") return "PASS"
  if (status === "partial") return "PARTIAL"
  return "BLOCKED"
}

function iqStatus(
  id: IqId,
  unavailable: readonly IqId[],
  overallStatus: "pass" | "partial" | "blocked",
) {
  if (unavailable.includes(id)) return "unavailable"
  if (id === "foundry" && overallStatus === "blocked") return "blocked"
  return "available"
}

function sourceStatusLabel(status: "available" | "unavailable" | "blocked") {
  if (status === "available") return "사용 가능"
  if (status === "unavailable") return "사용 불가"
  return "응답 차단"
}

function responseStatusLabel(status: "pass" | "partial" | "blocked") {
  if (status === "pass") return "정상 응답"
  if (status === "partial") return "부분 응답"
  return "응답 차단"
}

function FallbackResultNotice({
  fallback,
}: {
  fallback: (typeof fallbackDefinitions)[number]
}) {
  const blocked = fallback.status === "blocked"

  return (
    <section
      className={`foundry-result-box fallback-result-notice status-${fallback.status}`}
      aria-live="polite"
    >
      <div className="result-section-title">
        <ShieldAlert aria-hidden="true" />
        <span>{blocked ? "FoundryIQ 응답 차단" : "FoundryIQ 부분 응답 경계"}</span>
      </div>
      <div className="briefing-block">
        <span className="box-label">{responseStatusLabel(fallback.status)}</span>
        <p>{fallback.summary}</p>
      </div>
      <div className="warning-block">
        <CircleAlert aria-hidden="true" />
        <div>
          <strong>{blocked ? "답변과 조치를 표시하지 않음" : "정상 상태 결론을 재사용하지 않음"}</strong>
          <p>
            {blocked
              ? "내부 근거가 복구될 때까지 근거 기반 답변과 제안 조치를 생성하지 않습니다."
              : "사용 불가 근거에 의존한 수치·원인·담당자·외부 최신 사실은 제외합니다. 장애 대응 탭에서 남은 근거와 제한을 확인하세요."}
          </p>
        </div>
      </div>
    </section>
  )
}

function getQuestGuidance(quest: Quest) {
  const representativeGuidance: Record<string, { task: string; check: string }> = {
    "meet-iq": {
      task: "그래프의 FabricIQ, WorkIQ, WebIQ, FoundryIQ 노드를 차례로 선택해 주 소스와 금지 경계를 비교하세요.",
      check: "네 IQ가 각각 수치, 내부 맥락, 외부 사실, 결합·평가를 맡는다고 설명할 수 있으면 완료입니다.",
    },
    "evidence-trail": {
      task: "Q2 근거 보기에서 정형 수치 → 내부 업무 근거 → 외부 citation 순서로 읽으세요.",
      check: "세 근거가 같은 질문을 서로 다른 책임으로 뒷받침한다는 점을 확인하면 완료입니다.",
    },
    "citation-guard": {
      task: "Q1의 WebIQ citation에서 fact status와 limitation을 확인하세요.",
      check: "외부 근거만으로 내부 KPI 원인을 단정할 수 없다고 설명하면 완료입니다.",
    },
    "fallback-lab": {
      task: "정상, WebIQ 장애, 내부 근거 장애를 차례로 선택해 PASS·PARTIAL·BLOCKED를 비교하세요.",
      check: "내부 두 근거가 모두 실패하면 공개 웹만으로 답하지 않는 이유를 이해하면 완료입니다.",
    },
    "trace-auditor": {
      task: "Q3에서 네 IQ의 상태와 출처 추적(sourceTrace)이 분리되어 있는지 확인하세요.",
      check: "최종 답변의 수치와 링크가 어느 IQ에서 왔는지 추적할 수 있으면 완료입니다.",
    },
  }

  return representativeGuidance[quest.id] ?? {
    task: "산업 시나리오의 질문 3개를 바꿔 보고, 각 질문을 네 IQ가 어떻게 처리하는지 비교하세요.",
    check: "자동 판단이 아닌 사람 승인이 필요한 지점을 찾으면 완료입니다.",
  }
}

function scrollToSection(id: string) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  })
}

function Header({
  points,
  badges,
  theme,
  onThemeToggle,
  onShare,
  onSummary,
  summaryButtonRef,
}: {
  points: number
  badges: number
  theme: string
  onThemeToggle: () => void
  onShare: () => void
  onSummary: () => void
  summaryButtonRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>
          <strong>Microsoft IQ Playground</strong>
          <small>근거 흐름 학습 도구 · simulation</small>
        </span>
      </div>

      <div className="progress-summary" aria-label="학습 진행">
        <span><Trophy aria-hidden="true" /><strong>{points}</strong> 점</span>
        <span><Award aria-hidden="true" /><strong>{badges}</strong> 미션 완료</span>
      </div>

      <nav className="header-actions" aria-label="Playground 작업">
        <button
          type="button"
          className="header-button"
          aria-label="공유"
          onClick={onShare}
        >
          <Copy aria-hidden="true" />
          <span>공유</span>
        </button>
        <button
          ref={summaryButtonRef}
          type="button"
          className="header-button"
          aria-label="처음 시작"
          onClick={onSummary}
        >
          <BookOpen aria-hidden="true" />
          <span>처음 시작</span>
        </button>
        <a
          className="header-button"
          href="https://github.com/trentkim-ms-ats/microsoft-iq-workshop"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub 저장소 열기"
        >
          <ExternalLink aria-hidden="true" />
          <span>저장소</span>
        </a>
        <button
          type="button"
          className="icon-button header-theme"
          aria-label={theme === "dark" ? "라이트 테마" : "다크 테마"}
          onClick={onThemeToggle}
        >
          {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
      </nav>
    </header>
  )
}

function QuickNavigation() {
  return (
    <nav className="quick-navigation" aria-label="화면 빠른 이동">
      <a href="#missions">1. 학습 미션</a>
      <a href="#flow">2. 근거 흐름</a>
      <a href="#explorer">3. 상세 학습</a>
    </nav>
  )
}

function QuestPanel({
  activeQuestId,
  completedQuests,
  onActivate,
  onComplete,
}: {
  activeQuestId: string
  completedQuests: Set<string>
  onActivate: (quest: Quest) => void
  onComplete: (quest: Quest) => void
}) {
  const [questCategory, setQuestCategory] = useState<"industry" | "representative">(
    industryQuests.some((quest) => quest.id === activeQuestId) ? "industry" : "representative",
  )

  useEffect(() => {
    setQuestCategory(
      industryQuests.some((quest) => quest.id === activeQuestId)
        ? "industry"
        : "representative",
    )
  }, [activeQuestId])

  const currentQuests =
    questCategory === "industry" ? industryQuests : representativeQuests

  return (
    <aside id="missions" className="quest-panel" aria-label="학습 미션">
      <div className="panel-heading">
        <Target aria-hidden="true" />
        <div>
          <h2>학습 미션</h2>
          <p>처음이라면 대표 시나리오를 순서대로 진행하세요.</p>
        </div>
      </div>

      <div className="quest-category-toggle" role="tablist" aria-label="미션 카테고리 선택">
        <button
          type="button"
          role="tab"
          aria-selected={questCategory === "representative"}
          className={questCategory === "representative" ? "is-active" : ""}
          onClick={() => setQuestCategory("representative")}
        >
          권장 학습 순서
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={questCategory === "industry"}
          className={questCategory === "industry" ? "is-active" : ""}
          onClick={() => setQuestCategory("industry")}
        >
          산업별 실습
        </button>
      </div>

      <p className="quest-swipe-hint">미션 카드를 가로로 넘겨 선택할 수 있습니다.</p>

      <div className="quest-list" role="tabpanel">
        {currentQuests.map((quest, index) => {
          const active = activeQuestId === quest.id
          const completed = completedQuests.has(quest.id)
          const guidance = getQuestGuidance(quest)
          return (
            <article
              key={quest.id}
              className={`quest-card ${active ? "is-active" : ""} ${completed ? "is-complete" : ""}`}
            >
              <button
                type="button"
                className="quest-main"
                onClick={() => onActivate(quest)}
                aria-pressed={active}
              >
                <span className="quest-number">
                  {completed ? <Check aria-hidden="true" /> : index + 1}
                </span>
                <span className="quest-copy">
                  <span className="quest-title-row">
                    <strong>{quest.title}</strong>
                    <em data-level={quest.level}>{quest.level}</em>
                  </span>
                  <span className="quest-summary">{quest.summary}</span>
                </span>
                <ChevronRight aria-hidden="true" className="quest-chevron" />
              </button>

              <div className="quest-action-row">
                <span className="quest-reward">
                  <Award aria-hidden="true" />
                  <span className="quest-reward-label" title={quest.reward}>
                    {quest.reward}
                  </span>
                  <b>+{quest.points}점</b>
                </span>
                <button
                  type="button"
                  className={[
                    "quest-complete-button",
                    completed ? "is-complete" : "",
                    !active && !completed ? "is-inactive" : "",
                  ].join(" ")}
                  onClick={() => onComplete(quest)}
                  disabled={!active || completed}
                  aria-label={`${quest.title}: ${
                    completed
                      ? "학습 완료"
                      : active
                        ? "이해했어요 · 완료 표시"
                        : "미션을 먼저 선택하면 완료 표시가 활성화됩니다"
                  }`}
                  title={!active && !completed ? "미션을 먼저 선택하세요." : undefined}
                >
                  {completed ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : active ? (
                    <BadgeCheck aria-hidden="true" />
                  ) : (
                    <LockKeyhole aria-hidden="true" />
                  )}
                  {completed ? "완료됨" : "완료 표시"}
                </button>
              </div>

              {active && (
                <div className="quest-guide">
                  <strong>해볼 일</strong>
                  <p>{guidance.task}</p>
                  <strong>완료 확인</strong>
                  <p>{guidance.check}</p>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="panel-footnote">
        <LockKeyhole aria-hidden="true" />
        <span>
          모든 데이터는 교육용 simulation입니다. live 서비스나 현재 웹 사실을
          증명하지 않습니다.
        </span>
      </div>
    </aside>
  )
}

function InspectorContent({
  iq,
  scenario,
  industryScenario,
  isIndustryActive,
  industryQuestionIndex,
  fallback,
}: {
  iq: IqDefinition
  scenario: (typeof workshopData.scenarios)[number]
  industryScenario: (typeof workshopData.industryScenarios)[number]
  isIndustryActive: boolean
  industryQuestionIndex: number
  fallback: (typeof fallbackDefinitions)[number]
}) {
  const activeScenarioTitle = isIndustryActive
    ? `${industryScenario.id} · ${industryScenario.title} (${industryScenario.industry})`
    : `${scenario.id} · ${scenario.question}`

  const industryIqSpec = industryScenario.iq.find((item) => item.id === iq.id)
  const selectedFlow =
    industryScenario.exampleQuestionFlows[industryQuestionIndex] ??
    industryScenario.exampleQuestionFlows[0]
  const selectedIqUnavailable = fallback.unavailable.includes(iq.id)

  return (
    <div className="tab-section inspector-content-section">
      <div className="inspector-title">
        <span className={`iq-orb iq-${iq.id}`} aria-hidden="true" />
        <div>
          <span>{iq.track}</span>
          <h3>{iq.name}</h3>
          <p>{iq.shortName}</p>
        </div>
      </div>

      <section className={`scenario-iq-analysis-card iq-theme-${iq.id}`}>
        <div className="analysis-card-header">
          <Sparkles aria-hidden="true" />
          <div>
            <span className="card-badge">
              {isIndustryActive ? "산업 시나리오 IQ 분석" : "대표 시나리오 IQ 분석"}
            </span>
            <strong className="card-scenario-title">{activeScenarioTitle}</strong>
          </div>
        </div>

        <div className="analysis-card-body">
          {selectedIqUnavailable ? (
            <p className="unavailable-message">
              {iq.name} 사용 불가 — 이 소스에 의존한 결과를 표시하지 않습니다.
            </p>
          ) : (
            <>
          {iq.id === "fabric" && (
            <div className="iq-result-content">
              <div className="result-section-title">
                <Database aria-hidden="true" />
                <span>FabricIQ 정형 지표 분석 (Structured Metrics)</span>
              </div>
              {isIndustryActive ? (
                <>
                  <div className="metric-primary-box">
                    <span className="box-label">실측 데이터 수치</span>
                    <p>{selectedFlow.fabric.metric}</p>
                  </div>
                  <div className="highlights-sub-box">
                    <span className="box-label">정형 분석 하이라이트</span>
                    <ul>
                      {selectedFlow.fabric.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="metric-primary-box">
                    <span className="box-label">분석 수치 요약</span>
                    <p>{scenario.metrics.title}</p>
                  </div>
                  <div className="highlights-sub-box">
                    <span className="box-label">실측 하이라이트</span>
                    <ul>
                      {scenario.metrics.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {iq.id === "work" && (
            <div className="iq-result-content">
              <div className="result-section-title">
                <FileSearch aria-hidden="true" />
                <span>WorkIQ M365 비정형 업무 근거 (Evidence Links)</span>
              </div>
              {isIndustryActive ? (
                <div className="work-evidence-card">
                  <div className="evidence-header-row">
                    <span className="source-tag">{selectedFlow.work.source}</span>
                    <strong className="evidence-title">{selectedFlow.work.evidenceTitle}</strong>
                  </div>
                  <p className="evidence-owner">소유자/담당: {selectedFlow.work.owner}</p>
                  <p className="evidence-detail-text">{selectedFlow.work.details}</p>
                </div>
              ) : (
                <div className="work-evidence-list-small">
                  {scenario.workEvidence.slice(0, 3).map((item) => (
                    <div key={item.id} className="evidence-item-compact">
                      <span className="source-tag">{item.source}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.owner} · {new Date(item.businessDate).toLocaleDateString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {iq.id === "web" && (
            <div className="iq-result-content">
              <div className="result-section-title">
                <Globe2 aria-hidden="true" />
                <span>WebIQ 외부 출처 citation fixture</span>
              </div>
              {isIndustryActive ? (
                <div className="web-citation-card">
                  <div className="citation-header-row">
                    <span className="fact-status-tag">{selectedFlow.web.factStatus}</span>
                    <strong className="citation-title">{selectedFlow.web.citationTitle}</strong>
                  </div>
                  <p className="citation-meta">
                    출처 도메인: {selectedFlow.web.domain} (확인시각: {selectedFlow.web.observedAt})
                  </p>
                  <p className="fixture-limitations">{selectedFlow.web.limitations}</p>
                </div>
              ) : (
                <div className="web-citation-list-small">
                  {scenario.webEvidence.map((item) => (
                    <div key={item.id} className="citation-item-compact">
                      <span className="fact-status-tag">{item.factStatus}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.domain}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {iq.id === "foundry" && fallback.status === "pass" && (
            <div className="iq-result-content">
              <div className="result-section-title">
                <Award aria-hidden="true" />
                <span>FoundryIQ 세 근거 결합 & Grounded Briefing</span>
              </div>
              {isIndustryActive ? (
                <div className="foundry-result-box">
                  <div className="briefing-block">
                    <span className="box-label">교육용 검토 가설</span>
                    <p>{selectedFlow.foundry.briefingAnswer}</p>
                  </div>
                  <div className="action-block">
                    <BadgeCheck aria-hidden="true" />
                    <div>
                      <strong>사람 승인이 필요한 검토안</strong>
                      <p>{selectedFlow.foundry.proposedAction}</p>
                    </div>
                  </div>
                  <div className="warning-block">
                    <CircleAlert aria-hidden="true" />
                    <div>
                      <strong>해석 경계 및 주의사항</strong>
                      <p>{selectedFlow.foundry.warningNotice}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="foundry-result-box">
                  <div className="briefing-block">
                    <span className="box-label">대표 시나리오 simulation</span>
                    <p>FabricIQ 정형 지표, WorkIQ M365 fixture, WebIQ citation fixture를 상호 대조하는 교육용 답변 패키지입니다. 실제 운영 판단에는 원본 근거 재확인이 필요합니다.</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {iq.id === "foundry" && fallback.status !== "pass" && (
            <FallbackResultNotice fallback={fallback} />
          )}
            </>
          )}
        </div>

        {isIndustryActive && industryIqSpec && (
          <div className="analysis-card-footer">
            <details className="iq-spec-details">
              <summary>⚙️ {industryScenario.id} {iq.name} 데이터 처리 스펙</summary>
              <dl className="spec-dl">
                <div>
                  <dt>입력 범주</dt>
                  <dd>{industryIqSpec.inputScope}</dd>
                </div>
                <div>
                  <dt>처리/검증</dt>
                  <dd>{industryIqSpec.processing}</dd>
                </div>
                <div>
                  <dt>출력 계약</dt>
                  <dd>{industryIqSpec.output}</dd>
                </div>
                <div>
                  <dt>해석 한계</dt>
                  <dd>{industryIqSpec.limits}</dd>
                </div>
              </dl>
            </details>
          </div>
        )}
      </section>

      <p className="lead-copy">{iq.description}</p>

      <dl className="definition-list">
        <div>
          <dt>주 소스</dt>
          <dd>{iq.source}</dd>
        </div>
        <div>
          <dt>한 문장 책임</dt>
          <dd>{iq.responsibility}</dd>
        </div>
      </dl>

      <section className="detail-block">
        <h4><Database aria-hidden="true" />입력</h4>
        <div className="chip-list">
          {iq.inputs.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="detail-block">
        <h4><Link2 aria-hidden="true" />출력 계약</h4>
        <div className="chip-list">
          {iq.outputs.map((item) => <code key={item}>{item}</code>)}
        </div>
      </section>

      <section className="boundary-box">
        <h4><ShieldAlert aria-hidden="true" />금지 경계</h4>
        <ul>
          {iq.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}
        </ul>
      </section>

      <a className="document-link" href={iq.document} target="_blank" rel="noreferrer">
        Quick Start 열기
        <ExternalLink aria-hidden="true" />
      </a>
    </div>
  )
}

function StructuredMetricDetails({
  scenario,
}: {
  scenario: (typeof workshopData.scenarios)[number]
}) {
  if (scenario.id === "Q1") {
    return (
      <div className="metric-table-wrap">
        <table className="metric-table metric-table--campaigns">
          <caption>캠페인별 결제 전환율 비교</caption>
          <colgroup>
            <col className="campaign-column" />
            <col className="order-column" />
            <col className="success-column" />
            <col className="failure-column" />
            <col className="conversion-column" />
          </colgroup>
          <thead>
            <tr>
              <th>캠페인</th>
              <th>주문</th>
              <th>성공</th>
              <th>실패/미확정</th>
              <th>전환율</th>
            </tr>
          </thead>
          <tbody>
            {scenario.metrics.perCampaign.map((campaign) => (
              <tr key={campaign.campaignId}>
                <td>{campaign.campaignName}</td>
                <td>{campaign.orders}</td>
                <td>{campaign.paymentSuccessOrders}</td>
                <td>{campaign.paymentFailedOrUnknownOrders}</td>
                <td>{campaign.conversionRatePct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (scenario.id === "Q2") {
    return (
      <dl className="metric-summary-grid">
        <div><dt>지연 주문</dt><dd>{scenario.metrics.delayedOrderCount}건</dd></div>
        <div><dt>지연군 반품률</dt><dd>{scenario.metrics.delayedReturnRatePct}%</dd></div>
        <div><dt>불만 티켓 비율</dt><dd>{scenario.metrics.delayedComplaintRatePct}%</dd></div>
      </dl>
    )
  }

  return (
    <div className="metric-table-wrap">
      <table className="metric-table">
        <caption>핵심 상품 3종 성과 비교</caption>
        <thead>
          <tr>
            <th>상품</th>
            <th>주문</th>
            <th>수량</th>
            <th>매출</th>
            <th>반품률</th>
          </tr>
        </thead>
        <tbody>
          {scenario.metrics.perProduct.map((product) => (
            <tr key={product.productName}>
              <td>{product.productName}</td>
              <td>{product.orderCount}</td>
              <td>{product.units}</td>
              <td>{product.salesAmount}</td>
              <td>{product.returnRatePct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScenarioContent({
  scenario,
  industryScenario,
  isIndustryActive,
  fallback,
  industryQuestionIndex,
  onIndustryQuestionSelect,
}: {
  scenario: (typeof workshopData.scenarios)[number]
  industryScenario: (typeof workshopData.industryScenarios)[number]
  isIndustryActive: boolean
  fallback: (typeof fallbackDefinitions)[number]
  industryQuestionIndex: number
  onIndustryQuestionSelect: (index: number) => void
}) {
  const selectedFlow =
    industryScenario.exampleQuestionFlows[industryQuestionIndex] ??
    industryScenario.exampleQuestionFlows[0]

  if (isIndustryActive) {
    return (
      <div className="tab-section scenario-content">
        <div className="scenario-heading">
          <span>{industryScenario.id}</span>
          <div>
            <h3>{industryScenario.title}</h3>
            <p>{industryScenario.industry} · 시나리오 맥락 및 데이터 구성</p>
          </div>
        </div>

        <section className="detail-block">
          <h4><Target aria-hidden="true" />목적과 범위</h4>
          <p>{industryScenario.purpose}</p>
        </section>

        <section className="detail-block">
          <h4><Search aria-hidden="true" />관점별 예시 질문 3개</h4>
          <p className="section-helper">
            질문을 선택하면 아래 네 IQ의 입력 근거와 결과가 함께 바뀝니다.
          </p>
          <div className="example-questions-grid">
            {industryScenario.exampleQuestionFlows.map((flow, index) => (
              <button
                key={flow.question}
                type="button"
                className={`example-q-card ${industryQuestionIndex === index ? "is-selected" : ""}`}
                aria-pressed={industryQuestionIndex === index}
                onClick={() => onIndustryQuestionSelect(index)}
              >
                <span className="example-q-badge">{index + 1}. {flow.perspective}</span>
                <span className="example-q-text">{flow.question}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="flow-path-visualizer" aria-label="선택 질문의 Microsoft IQ 처리 순서">
          <div className="flow-path-header">
            <Network aria-hidden="true" />
            선택 질문 처리 순서
          </div>
          <div className="flow-nodes-container">
            {iqDefinitions.map((iq, index) => (
              <div key={iq.id} className={`flow-node-step node-${iq.id}`}>
                <span className="flow-node-title">{iq.name}</span>
                <span className="flow-node-sub">{iq.shortName}</span>
                {index < iqDefinitions.length - 1 && <span className="flow-arrow">→</span>}
              </div>
            ))}
          </div>
        </div>

        <section className="detail-block">
          <h4><Database aria-hidden="true" />FabricIQ 정형 데이터 수치</h4>
          {fallback.unavailable.includes("fabric") ? (
            <p className="unavailable-message">FabricIQ 사용 불가 — 수치를 표시하지 않습니다.</p>
          ) : (
            <div className="metric-primary-box metric-result-spacing">
              <p>{selectedFlow.fabric.metric}</p>
              <ul className="finding-list compact-finding-list">
                {selectedFlow.fabric.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <details className="evidence-group" open>
          <summary>
            <span><FileSearch aria-hidden="true" />WorkIQ 업무 근거</span>
            <b>1</b>
          </summary>
          {fallback.unavailable.includes("work") ? (
            <p className="unavailable-message">WorkIQ 사용 불가 — 내부 논의를 추정하지 않습니다.</p>
          ) : (
            <div className="evidence-list">
              <article>
                <span>{selectedFlow.work.source}</span>
                <strong>{selectedFlow.work.evidenceTitle}</strong>
                <small>{selectedFlow.work.owner}</small>
                <p className="evidence-detail-inline">{selectedFlow.work.details}</p>
              </article>
            </div>
          )}
        </details>

        <details className="evidence-group" open>
          <summary>
            <span><Globe2 aria-hidden="true" />WebIQ Citation</span>
            <b>1</b>
          </summary>
          {fallback.unavailable.includes("web") ? (
            <p className="unavailable-message">외부 최신 근거 없음</p>
          ) : (
            <div className="citation-list">
              <div className="citation-item-compact citation-item-spacious">
                <span className="fact-status-tag">{selectedFlow.web.factStatus}</span>
                <div>
                  <strong>{selectedFlow.web.citationTitle}</strong>
                  <small>{selectedFlow.web.domain} · {selectedFlow.web.observedAt}</small>
                  <p className="fixture-limitations">{selectedFlow.web.limitations}</p>
                </div>
              </div>
            </div>
          )}
        </details>

        {fallback.status === "pass" ? (
          <section className="foundry-result-box">
            <div className="result-section-title">
              <Award aria-hidden="true" />
              <span>FoundryIQ 근거 결합 결과</span>
            </div>
            <div className="briefing-block">
              <span className="box-label">교육용 검토 가설</span>
              <p>{selectedFlow.foundry.briefingAnswer}</p>
            </div>
            <div className="action-block">
              <CheckCircle2 aria-hidden="true" />
              <div>
                <strong>사람 승인이 필요한 검토안</strong>
                <p>{selectedFlow.foundry.proposedAction}</p>
              </div>
            </div>
            <div className="warning-block">
              <ShieldAlert aria-hidden="true" />
              <div>
                <strong>주의사항</strong>
                <p>{selectedFlow.foundry.warningNotice}</p>
              </div>
            </div>
          </section>
        ) : (
          <FallbackResultNotice fallback={fallback} />
        )}

        <details className="learning-details">
          <summary>확인할 질문과 IQ별 상세 처리 보기</summary>
          <div className="learning-details-body">
            <section>
              <h4>확인할 질문</h4>
              <ul>
                {industryScenario.verificationQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </section>
            <section className="industry-iq-grid">
              {industryScenario.iq.map((item) => (
                <details key={item.id} className={`industry-iq-card iq-${item.id}`}>
                  <summary>
                    <span className={`iq-orb iq-${item.id}`} aria-hidden="true" />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.label}</small>
                    </span>
                  </summary>
                  <dl className="industry-iq-detail">
                    <div><dt>입력/범위</dt><dd>{item.inputScope}</dd></div>
                    <div><dt>처리·검증</dt><dd>{item.processing}</dd></div>
                    <div><dt>출력/인계</dt><dd>{item.output}</dd></div>
                    <div><dt>한계/비목표</dt><dd>{item.limits}</dd></div>
                  </dl>
                </details>
              ))}
            </section>
            <section>
              <h4>전체 처리 흐름</h4>
              <pre className="industry-diagram">{industryScenario.diagram}</pre>
            </section>
          </div>
        </details>

        <section className="boundary-box">
          <h4><CircleAlert aria-hidden="true" />해석 경계 및 완료 승인 조건</h4>
          <p>{industryScenario.approval}</p>
        </section>
      </div>
    )
  }

  return (
    <div className="tab-section scenario-content">
      <div className="scenario-heading">
        <span>{scenario.id}</span>
        <div>
          <h3>{scenario.question}</h3>
          <p>{scenario.goal}</p>
        </div>
      </div>

      <section className="detail-block">
        <h4><Database aria-hidden="true" />FabricIQ 정형 신호</h4>
        {fallback.unavailable.includes("fabric") ? (
          <p className="unavailable-message">FabricIQ 사용 불가 — 수치를 표시하지 않습니다.</p>
        ) : (
          <>
            <ul className="finding-list">
              {scenario.metrics.highlights.map((finding) => <li key={finding}>{finding}</li>)}
            </ul>
            <StructuredMetricDetails scenario={scenario} />
          </>
        )}
      </section>

      <details className="evidence-group" open>
        <summary>
          <span><FileSearch aria-hidden="true" />WorkIQ 내부 근거</span>
          <b>{scenario.workEvidence.length}</b>
        </summary>
        {fallback.unavailable.includes("work") ? (
          <p className="unavailable-message">WorkIQ 사용 불가 — 내부 논의와 담당자를 추정하지 않습니다.</p>
        ) : (
          <div className="evidence-list">
            {scenario.workEvidence.slice(0, 5).map((evidence) => (
              <article key={evidence.id}>
                <span>{evidence.source}</span>
                <strong>{evidence.title}</strong>
                <small>{evidence.owner} · {evidence.businessDate}</small>
              </article>
            ))}
          </div>
        )}
      </details>

      <details className="evidence-group" open>
        <summary>
          <span><Globe2 aria-hidden="true" />WebIQ citation fixture</span>
          <b>{scenario.webEvidence.length}</b>
        </summary>
        {fallback.unavailable.includes("web") ? (
          <p className="unavailable-message">외부 최신 근거 없음</p>
        ) : (
          <div className="citation-list">
            {scenario.webEvidence.map((citation) => (
              <a key={citation.id} href={citation.url} target="_blank" rel="noreferrer">
                <span>{citation.factStatus}</span>
                <strong>{citation.title}</strong>
                <small>{citation.domain}</small>
                <ExternalLink aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </details>

      <section className="boundary-box">
        <h4><CircleAlert aria-hidden="true" />해석 경계</h4>
        <p>{scenario.interpretationBoundary}</p>
      </section>
    </div>
  )
}

function FallbackContent({
  fallback,
  onSelect,
}: {
  fallback: (typeof fallbackDefinitions)[number]
  onSelect: (mode: FallbackMode) => void
}) {
  const retryLabels = ["첫 시도", "+5초", "+10초", "+20초"]
  return (
    <div className="tab-section">
      <div className="learning-callout">
        <Info aria-hidden="true" />
        <div>
          <strong>Fallback은 근거가 일부 없을 때의 안전 규칙입니다.</strong>
          <p>장애 모드를 바꿔 어떤 근거가 사라지고, 답변이 부분 제공되거나 차단되는지 비교하세요.</p>
        </div>
      </div>

      <div className="fallback-selector" aria-label="Fallback 모드">
        {fallbackDefinitions.map((definition) => (
          <button
            key={definition.id}
            type="button"
            className={fallback.id === definition.id ? "is-active" : ""}
            aria-pressed={fallback.id === definition.id}
            onClick={() => onSelect(definition.id)}
          >
            {definition.label}
          </button>
        ))}
      </div>

      <section className={`status-card status-${fallback.status}`}>
        <div>
          {fallback.status === "pass" ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <ShieldAlert aria-hidden="true" />
          )}
          <span>{statusLabel(fallback.status)}</span>
        </div>
        <strong className="response-status-label">{responseStatusLabel(fallback.status)}</strong>
        <h3>{fallback.summary}</h3>
        <p>{fallback.warning}</p>
      </section>

      <section className="detail-block">
        <h4><Network aria-hidden="true" />소스 상태</h4>
        <div className="source-status-list">
          {iqDefinitions.map((iq) => {
            const status = iqStatus(iq.id, fallback.unavailable, fallback.status)
            return (
              <div key={iq.id}>
                <span className={`source-status-dot ${status}`} />
                <strong>{iq.name}</strong>
                <small>{sourceStatusLabel(status)}</small>
              </div>
            )
          })}
        </div>
      </section>

      <section className="detail-block">
        <h4><CircleAlert aria-hidden="true" />재시도 정책</h4>
        <p className="retry-policy">5초 → 10초 → 20초, 최대 3회 재시도 (총 최대 4회 시도)</p>
        <div className="retry-track">
          {retryLabels.map((label, index) => {
            const attempted = index < fallback.attempts
            return (
              <div key={label} className={attempted ? "attempted" : ""}>
                <i>{index + 1}</i>
                <span>{label}</span>
              </div>
            )
          })}
        </div>
        <p className="simulation-note">
          이 화면은 정책을 학습하는 simulation이며 실제 대기나 endpoint 호출은 실행하지 않습니다.
        </p>
      </section>
    </div>
  )
}

function useDialogFocusTrap<
  TDialog extends HTMLElement,
  TInitial extends HTMLElement,
  TReturn extends HTMLElement,
>(
  dialogRef: RefObject<TDialog | null>,
  initialFocusRef: RefObject<TInitial | null>,
  onClose: () => void,
  returnFocusRef: RefObject<TReturn | null>,
) {
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const fallbackFocusTarget = returnFocusRef.current
    const backgroundElements = [
      document.querySelector<HTMLElement>(".app-header"),
      document.querySelector<HTMLElement>(".quick-navigation"),
      document.querySelector<HTMLElement>(".app-shell"),
    ].filter((element): element is HTMLElement => element !== null)

    backgroundElements.forEach((element) => {
      element.inert = true
    })
    initialFocusRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== "Tab" || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        event.preventDefault()
        return
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      backgroundElements.forEach((element) => {
        element.inert = false
      })
      const focusTarget =
        previouslyFocused && previouslyFocused !== document.body
          ? previouslyFocused
          : fallbackFocusTarget
      focusTarget?.focus()
    }
  }, [dialogRef, initialFocusRef, onClose, returnFocusRef])
}

function getPanelGuideCardPosition(target: PanelGuideTarget, stepIndex: number) {
  const cardWidth = 380
  const edge = 16
  const gap = 16
  const maximumLeft = Math.max(edge, window.innerWidth - cardWidth - edge)
  const preferredLeft =
    stepIndex === 0
      ? target.right + gap
      : stepIndex === PANEL_GUIDE_STEPS.length - 1
        ? target.left - cardWidth - gap
        : target.left + (target.width - cardWidth) / 2

  return {
    left: Math.min(Math.max(preferredLeft, edge), maximumLeft),
    top: Math.min(
      Math.max(target.top + 24, 88),
      Math.max(88, window.innerHeight - 480),
    ),
  }
}

function PanelGuide({
  autoShow,
  onAutoShowChange,
  onClose,
  returnFocusRef,
}: {
  autoShow: boolean
  onAutoShowChange: (next: boolean) => void
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [target, setTarget] = useState<PanelGuideTarget | null>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const step = PANEL_GUIDE_STEPS[stepIndex]
  const isLastStep = stepIndex === PANEL_GUIDE_STEPS.length - 1

  useDialogFocusTrap(dialogRef, closeButtonRef, onClose, returnFocusRef)

  useEffect(() => {
    const targetElement = document.querySelector<HTMLElement>(step.selector)
    if (!targetElement) {
      console.error(`Panel guide target was not found: ${step.selector}`)
      onClose()
      return
    }
    const guideTarget = targetElement

    if (window.matchMedia("(max-width: 1120px)").matches) {
      guideTarget.scrollIntoView({ block: "start" })
    }

    function updateTarget() {
      const rect = guideTarget.getBoundingClientRect()
      const top = Math.max(rect.top, 8)
      const bottom = Math.min(rect.bottom, window.innerHeight - 8)
      setTarget({
        top,
        left: Math.max(rect.left, 8),
        width: Math.max(0, Math.min(rect.right, window.innerWidth - 8) - Math.max(rect.left, 8)),
        height: Math.max(0, bottom - top),
        right: Math.min(rect.right, window.innerWidth - 8),
      })
    }

    updateTarget()
    const observer = new ResizeObserver(updateTarget)
    observer.observe(guideTarget)
    window.addEventListener("resize", updateTarget)
    window.addEventListener("scroll", updateTarget, true)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateTarget)
      window.removeEventListener("scroll", updateTarget, true)
    }
  }, [onClose, step.selector])

  const cardPosition = target
    ? getPanelGuideCardPosition(target, stepIndex)
    : { left: 16, top: 88 }

  return (
    <div className="panel-guide-layer">
      {target && (
        <div
          className="panel-guide-spotlight"
          aria-hidden="true"
          style={{
            top: target.top,
            left: target.left,
            width: target.width,
            height: target.height,
          }}
        />
      )}
      <section
        ref={dialogRef}
        className="panel-guide-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-guide-title"
        style={cardPosition}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="패널 안내 닫기"
        >
          <X aria-hidden="true" />
        </button>

        <div className="panel-guide-progress" aria-label={`패널 안내 ${stepIndex + 1}/${PANEL_GUIDE_STEPS.length}`}>
          <span>{step.eyebrow}</span>
          <strong>{stepIndex + 1} / {PANEL_GUIDE_STEPS.length}</strong>
        </div>
        <div className="panel-guide-content" aria-live="polite">
          <h2 id="panel-guide-title">{step.title}</h2>
          <p>{step.description}</p>
          <ul>
            {step.details.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        </div>

        <label className="panel-guide-autoshow">
          <input
            type="checkbox"
            checked={autoShow}
            onChange={(event) => onAutoShowChange(event.target.checked)}
          />
          <span>
            <strong>새로 로드할 때 자동 표시</strong>
            <small>체크를 끄면 다음 방문부터 자동으로 열리지 않습니다.</small>
          </span>
        </label>

        <div className="panel-guide-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => {
              onAutoShowChange(false)
              onClose()
            }}
          >
            다시 표시하지 않기
          </button>
          <span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
            >
              이전
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (isLastStep) {
                  onClose()
                } else {
                  setStepIndex((current) => current + 1)
                }
              }}
            >
              {isLastStep ? "안내 완료" : "다음 패널"}
            </button>
          </span>
        </div>
      </section>
    </div>
  )
}

function SummaryDialog({
  completed,
  onClose,
  returnFocusRef,
}: {
  completed: number
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useDialogFocusTrap(dialogRef, closeButtonRef, onClose, returnFocusRef)

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="summary-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="닫기"
        >
          <X aria-hidden="true" />
        </button>
        <span className="eyebrow">BEGINNER GUIDE</span>
        <h2 id="summary-title">처음 시작하는 Microsoft IQ</h2>
        <p>
          한 질문을 네 가지 책임으로 나누면 수치·문서·외부 사실을 섞지 않고
          출처가 분명한 답변을 만들 수 있습니다.
        </p>

        <ol className="beginner-steps">
          <li><strong>미션 선택</strong><span>왼쪽의 권장 학습 순서에서 첫 미션을 엽니다.</span></li>
          <li><strong>IQ 역할 확인</strong><span>그래프 노드를 눌러 각 IQ의 소스·입력·출력·금지 경계를 봅니다.</span></li>
          <li><strong>근거 비교</strong><span>근거 보기에서 정형 수치, 내부 업무 근거, 외부 citation을 비교합니다.</span></li>
          <li><strong>장애 실험</strong><span>장애 대응에서 PASS·PARTIAL·BLOCKED의 차이를 확인합니다.</span></li>
        </ol>

        <div className="summary-stats">
          <div><strong>{workshopData.stats.entityCount}</strong><span>Ontology entities</span></div>
          <div><strong>{workshopData.stats.m365ItemCount}</strong><span>M365 evidence items</span></div>
          <div><strong>{workshopData.stats.webCitationCount}</strong><span>Web citations</span></div>
          <div><strong>{workshopData.stats.strictGateCount}</strong><span>Strict gates</span></div>
        </div>

        <div className="summary-progress">
          <span>학습 미션</span>
          <strong>{completed} / {quests.length}</strong>
          <div><i style={{ width: `${(completed / quests.length) * 100}%` }} /></div>
        </div>

        <section className="glossary-section" aria-labelledby="glossary-title">
          <h3 id="glossary-title">초보자 핵심 용어</h3>
          <dl className="glossary-grid">
            <div><dt>기준선</dt><dd>현재 수치를 정상 기간·목표·정책 임계값과 비교하기 위한 기준값입니다.</dd></div>
            <div><dt>ACL</dt><dd>사용자가 열람 권한을 가진 M365 근거만 검색·노출하도록 하는 접근 제어입니다.</dd></div>
            <div><dt>Citation</dt><dd>외부 사실을 확인할 수 있는 URL, 출처, 확인 시각이 포함된 인용 정보입니다.</dd></div>
            <div><dt>Fixture</dt><dd>live 데이터 대신 simulation과 회귀 테스트에 사용하는 고정 샘플입니다.</dd></div>
            <div><dt>권위 SOP</dt><dd>조직이 공식 승인해 판단 기준으로 사용하는 표준 운영 절차입니다.</dd></div>
            <div><dt>sourceTrace</dt><dd>최종 답변의 근거가 어느 IQ와 원본에서 왔는지 보여주는 출처 추적입니다.</dd></div>
            <div><dt>Fallback</dt><dd>일부 근거가 실패했을 때 부분응답 또는 차단으로 안전하게 전환하는 규칙입니다.</dd></div>
          </dl>
        </section>

        <div className="summary-rule">
          <Info aria-hidden="true" />
          <p>{workshopData.fixtureNotice}</p>
        </div>

        <button type="button" className="primary-button guide-close-button" onClick={onClose}>
          가이드 닫고 첫 미션 시작하기
        </button>
      </section>
    </div>
  )
}

function App() {
  const [selectedIq, setSelectedIq] = useState<IqId>(getInitialIq)
  const [scenarioId, setScenarioId] = useState(getInitialScenarioId)
  const [industryScenarioId, setIndustryScenarioId] = useState<string>(
    getInitialIndustryScenarioId,
  )
  const [industryQuestionIndex, setIndustryQuestionIndex] = useState(0)
  const [mode, setMode] = useState<FallbackMode>(getInitialMode)
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>(getInitialExplorerTab)
  const [activeQuestId, setActiveQuestId] = useState(getInitialQuestId)
  const [completedQuests, setCompletedQuests] = useState(getCompletedQuests)
  const [naturalQuery, setNaturalQuery] = useState("")
  const [zoom, setZoom] = useState(1)
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") ?? "light",
  )
  const [panelGuideAutoShow, setPanelGuideAutoShow] = useState(getPanelGuideAutoShow)
  const [showPanelGuide, setShowPanelGuide] = useState(panelGuideAutoShow)
  const [showSummary, setShowSummary] = useState(false)
  const [toast, setToast] = useState("")
  const summaryButtonRef = useRef<HTMLButtonElement>(null)
  const closePanelGuide = useCallback(() => setShowPanelGuide(false), [])
  const closeSummary = useCallback(() => setShowSummary(false), [])

  const selectedDefinition =
    iqDefinitions.find((definition) => definition.id === selectedIq) ??
    iqDefinitions[0]
  const selectedScenario =
    workshopData.scenarios.find((scenario) => scenario.id === scenarioId) ??
    workshopData.scenarios[0]
  const selectedFallback =
    fallbackDefinitions.find((definition) => definition.id === mode) ??
    fallbackDefinitions[0]
  const selectedIndustryScenario =
    workshopData.industryScenarios.find((scenario) => scenario.id === industryScenarioId) ??
    workshopData.industryScenarios[0]
  const isIndustryActive = Boolean(
    industryScenarioId &&
      workshopData.industryScenarios.some((scenario) => scenario.id === industryScenarioId),
  )

  if (!selectedDefinition || !selectedScenario || !selectedFallback || !selectedIndustryScenario) {
    throw new Error("Microsoft IQ Playground data is incomplete")
  }

  const points = quests
    .filter((quest) => completedQuests.has(quest.id))
    .reduce((total, quest) => total + quest.points, 0)
  const selectedPathByIq: Record<IqId, string[]> = {
    fabric: ["lakehouse", "fabric", "foundry", "briefing"],
    work: ["m365", "work", "foundry", "briefing"],
    web: ["public-web", "web", "foundry", "briefing"],
    foundry: ["knowledge", "foundry", "briefing"],
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set("iq", selectedIq)
    params.set("scenario", scenarioId)
    params.set("mode", mode)
    if (isIndustryActive) {
      params.set("industry", industryScenarioId)
    } else {
      params.delete("industry")
    }
    params.set("tab", explorerTab)
    params.set("scoutTheme", theme)
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`)
  }, [explorerTab, industryScenarioId, isIndustryActive, mode, scenarioId, selectedIq, theme])

  useEffect(() => {
    setIndustryQuestionIndex(0)
  }, [industryScenarioId])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 2400)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function activateQuest(quest: Quest) {
    setActiveQuestId(quest.id)
    setSelectedIq(quest.focus)
    setExplorerTab(quest.tab)
    if (quest.category === "representative") {
      setIndustryScenarioId("")
    }
    if (quest.scenarioId) {
      setScenarioId(quest.scenarioId)
    }
    if (quest.industryScenarioId) {
      setIndustryScenarioId(quest.industryScenarioId)
    }
    if (quest.mode) setMode(quest.mode)

    if (window.matchMedia("(max-width: 720px)").matches) {
      scrollToSection("flow")
    }
  }

  function completeQuest(quest: Quest) {
    if (completedQuests.has(quest.id)) return
    const next = new Set(completedQuests)
    next.add(quest.id)
    setCompletedQuests(next)
    window.localStorage.setItem(COMPLETED_QUESTS_KEY, JSON.stringify([...next]))
    setToast(`${quest.title} 미션을 완료했습니다. +${quest.points}점`)
  }

  function updatePanelGuideAutoShow(next: boolean) {
    setPanelGuideAutoShow(next)
    try {
      window.localStorage.setItem(PANEL_GUIDE_AUTO_KEY, String(next))
    } catch (error) {
      console.error("Failed to save the panel guide preference.", error)
      setToast("패널 안내 표시 설정을 저장하지 못했습니다.")
    }
  }

  function handleNodeSelect(id: IqId) {
    setSelectedIq(id)
    setExplorerTab("inspector")
    if (window.matchMedia("(max-width: 1120px)").matches) {
      scrollToSection("explorer")
    }
  }

  function handleNaturalQuery(event: FormEvent) {
    event.preventDefault()
    const normalized = naturalQuery.trim().toLocaleLowerCase()
    if (!normalized) {
      setToast("질문을 입력하세요.")
      return
    }

    const industryMatch = workshopData.industryScenarios.find((industry) => {
      const searchable = [
        industry.id,
        industry.industry,
        industry.title,
        industry.purpose,
        ...industry.exampleQuestions.flatMap((question) => [
          question.perspective,
          question.question,
        ]),
      ].join(" ").toLocaleLowerCase()
      return (
        normalized.includes(industry.id.toLocaleLowerCase()) ||
        normalized.includes(industry.industry.toLocaleLowerCase()) ||
        searchable.includes(normalized)
      )
    })

    if (industryMatch) {
      setIndustryScenarioId(industryMatch.id)
      setIndustryQuestionIndex(0)
      const matchingQuest = industryQuests.find(
        (quest) => quest.industryScenarioId === industryMatch.id,
      )
      if (matchingQuest) setActiveQuestId(matchingQuest.id)
      setSelectedIq("foundry")
      setExplorerTab("scenario")
      setNaturalQuery("")
      setToast(`${industryMatch.id} 산업 시나리오를 열었습니다.`)
      if (window.matchMedia("(max-width: 1120px)").matches) {
        scrollToSection("explorer")
      }
      return
    }

    const match =
      normalized.includes("q1") ||
      normalized.includes("결제") ||
      normalized.includes("캠페인")
        ? "Q1"
        : normalized.includes("q2") ||
            normalized.includes("배송") ||
            normalized.includes("지연")
          ? "Q2"
          : normalized.includes("q3") ||
              normalized.includes("상품") ||
              normalized.includes("재고")
            ? "Q3"
            : null

    if (!match) {
      setToast("결제, 배송, 핵심 상품 또는 제조·물류·금융·헬스케어·통신·리테일을 입력해 보세요.")
      return
    }

    setScenarioId(match)
    setIndustryScenarioId("")
    const matchingQuest = representativeQuests.find((quest) => quest.scenarioId === match)
    if (matchingQuest) setActiveQuestId(matchingQuest.id)
    setSelectedIq("foundry")
    setExplorerTab("scenario")
    setNaturalQuery("")
    setToast(`${match} 근거 패키지를 열었습니다.`)
    if (window.matchMedia("(max-width: 1120px)").matches) {
      scrollToSection("explorer")
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast("현재 탐색 상태의 링크를 복사했습니다.")
    } catch (error) {
      console.error("Failed to copy the Playground URL.", error)
      setToast("링크 복사에 실패했습니다. 브라우저 권한을 확인하세요.")
    }
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark"
    document.documentElement.setAttribute("data-theme", nextTheme)
    setTheme(nextTheme)
  }

  return (
    <div className="app">
      <Header
        points={points}
        badges={completedQuests.size}
        theme={theme}
        onThemeToggle={toggleTheme}
        onShare={handleShare}
        onSummary={() => setShowPanelGuide(true)}
        summaryButtonRef={summaryButtonRef}
      />
      <QuickNavigation />

      <div className="app-shell">
        <QuestPanel
          activeQuestId={activeQuestId}
          completedQuests={completedQuests}
          onActivate={activateQuest}
          onComplete={completeQuest}
        />

        <main id="flow" className="workspace">
          <div className="workspace-toolbar">
            <div className="workspace-intro">
              <span className="eyebrow">한 질문, 네 가지 책임</span>
              <h1>FabricIQ → WorkIQ → WebIQ → FoundryIQ</h1>
              <p>수치 → 내부 업무 맥락 → 외부 최신 사실 → 결합·평가 순서로 읽으세요.</p>
              <button type="button" className="inline-guide-button" onClick={() => setShowSummary(true)}>
                <Info aria-hidden="true" />
                용어와 시작 방법 보기
              </button>
            </div>
            <label>
              <span>학습할 시나리오</span>
              <select
                value={industryScenarioId ? industryScenarioId : scenarioId}
                onChange={(event) => {
                  const val = event.target.value
                  const isInd = workshopData.industryScenarios.some((i) => i.id === val)
                  if (isInd) {
                    setIndustryScenarioId(val)
                    setIndustryQuestionIndex(0)
                    const matchingQuest = industryQuests.find(
                      (quest) => quest.industryScenarioId === val,
                    )
                    if (matchingQuest) setActiveQuestId(matchingQuest.id)
                    setSelectedIq(matchingQuest?.focus ?? "fabric")
                    setExplorerTab("inspector")
                  } else {
                    setScenarioId(val)
                    setIndustryScenarioId("")
                    const matchingQuest = representativeQuests.find(
                      (quest) => quest.scenarioId === val,
                    )
                    if (matchingQuest) setActiveQuestId(matchingQuest.id)
                    setSelectedIq(matchingQuest?.focus ?? "fabric")
                    setExplorerTab("scenario")
                  }
                }}
              >
                <optgroup label="대표 시나리오 (Q1~Q3)">
                  {workshopData.scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.id} · {scenario.question}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="산업별 시나리오">
                  {workshopData.industryScenarios.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.id} · {ind.title} ({ind.industry})
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
          </div>

          <FlowGraph
            selectedIq={selectedIq}
            path={selectedPathByIq[selectedIq]}
            fallback={selectedFallback}
            zoom={zoom}
            onZoomChange={setZoom}
            onSelectIq={handleNodeSelect}
          />

          <section className="trace-dock" aria-label="현재 응답 source trace">
            <div className="trace-heading">
              <Sparkles aria-hidden="true" />
              <span>
                <strong>
                  {isIndustryActive ? selectedIndustryScenario.id : selectedScenario.id} 출처 추적
                </strong>
                <small>{selectedFallback.label} · simulation</small>
              </span>
            </div>
            <div className="trace-items">
              {iqDefinitions.map((iq) => {
                const status = iqStatus(
                  iq.id,
                  selectedFallback.unavailable,
                  selectedFallback.status,
                )
                return (
                  <button
                    key={iq.id}
                    type="button"
                    className={`trace-item trace-${status}`}
                    onClick={() => handleNodeSelect(iq.id)}
                  >
                    <span className={`iq-orb iq-${iq.id}`} />
                    <span><strong>{iq.name}</strong><small>{sourceStatusLabel(status)}</small></span>
                  </button>
                )
              })}
            </div>
            <span className={`overall-status status-${selectedFallback.status}`}>
              {statusLabel(selectedFallback.status)}
            </span>
          </section>
        </main>

        <aside id="explorer" className="explorer-panel" aria-label="IQ 상세 학습">
          <div className="explorer-tabs" role="tablist" aria-label="탐색 보기">
            {([
              ["inspector", "IQ 역할"],
              ["scenario", "근거 보기"],
              ["fallback", "장애 대응"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={explorerTab === id}
                className={explorerTab === id ? "is-active" : ""}
                onClick={() => setExplorerTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="explorer-content" role="tabpanel">
            {explorerTab === "inspector" && (
              <InspectorContent
                iq={selectedDefinition}
                scenario={selectedScenario}
                industryScenario={selectedIndustryScenario}
                isIndustryActive={isIndustryActive}
                industryQuestionIndex={industryQuestionIndex}
                fallback={selectedFallback}
              />
            )}
            {explorerTab === "scenario" && (
              <ScenarioContent
                scenario={selectedScenario}
                industryScenario={selectedIndustryScenario}
                isIndustryActive={isIndustryActive}
                fallback={selectedFallback}
                industryQuestionIndex={industryQuestionIndex}
                onIndustryQuestionSelect={setIndustryQuestionIndex}
              />
            )}
            {explorerTab === "fallback" && (
              <FallbackContent fallback={selectedFallback} onSelect={setMode} />
            )}
          </div>

          <form className="natural-query" onSubmit={handleNaturalQuery}>
            <label htmlFor="natural-query-input">
              <Search aria-hidden="true" />
              시나리오 빠른 찾기
            </label>
            <div>
              <input
                id="natural-query-input"
                value={naturalQuery}
                onChange={(event) => setNaturalQuery(event.target.value)}
                placeholder="예: 배송, 제조, FIN-01"
              />
              <button type="submit" aria-label="질문 실행"><Search aria-hidden="true" /></button>
            </div>
            <small>AI 호출 없이 입력한 키워드와 가장 가까운 학습 화면으로 이동합니다.</small>
          </form>
        </aside>
      </div>

      {showSummary && (
        <SummaryDialog
          completed={completedQuests.size}
          onClose={closeSummary}
          returnFocusRef={summaryButtonRef}
        />
      )}
      {showPanelGuide && (
        <PanelGuide
          autoShow={panelGuideAutoShow}
          onAutoShowChange={updatePanelGuideAutoShow}
          onClose={closePanelGuide}
          returnFocusRef={summaryButtonRef}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

export default App
