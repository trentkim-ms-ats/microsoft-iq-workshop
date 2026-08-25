import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  graphEdges,
  graphNodes,
  iqDefinitions,
  quests,
  type ExplorerTab,
  type FallbackMode,
  type IqDefinition,
  type IqId,
  type Quest,
} from "@/data/model"

const COMPLETED_QUESTS_KEY = "microsoft-iq-playground-quests"

function getInitialParam(name: string) {
  return new URLSearchParams(window.location.search).get(name)
}

function getInitialIq(): IqId {
  const value = getInitialParam("iq")
  return iqDefinitions.some((definition) => definition.id === value)
    ? (value as IqId)
    : "foundry"
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

function findPath(start: string, end: string) {
  const queue: string[][] = [[start]]
  const visited = new Set([start])

  while (queue.length > 0) {
    const path = queue.shift()
    if (!path) {
      break
    }
    const current = path[path.length - 1]
    if (current === end) {
      return path
    }

    for (const [from, to] of graphEdges) {
      if (from === current && !visited.has(to)) {
        visited.add(to)
        queue.push([...path, to])
      }
    }
  }

  return []
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
          <small>Evidence flow explorer · simulation</small>
        </span>
      </div>

      <div className="progress-summary" aria-label="학습 진행">
        <span><Trophy aria-hidden="true" /><strong>{points}</strong> points</span>
        <span><Award aria-hidden="true" /><strong>{badges}</strong> badges</span>
      </div>

      <nav className="header-actions" aria-label="Playground 작업">
        <button type="button" className="header-button" onClick={onShare}>
          <Copy aria-hidden="true" />
          <span>공유</span>
        </button>
        <button
          ref={summaryButtonRef}
          type="button"
          className="header-button"
          onClick={onSummary}
        >
          <BookOpen aria-hidden="true" />
          <span>요약</span>
        </button>
        <a
          className="header-button"
          href="https://github.com/trentkim-ms-ats/microsoft-iq-workshop"
          target="_blank"
          rel="noreferrer"
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
  return (
    <aside className="quest-panel" aria-label="학습 미션">
      <div className="panel-heading">
        <Target aria-hidden="true" />
        <div>
          <h2>학습 미션</h2>
          <p>트랙 순서대로 근거 계약을 탐색하세요.</p>
        </div>
      </div>

      <div className="quest-list">
        {quests.map((quest, index) => {
          const active = activeQuestId === quest.id
          const completed = completedQuests.has(quest.id)
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
                <span className="quest-number">{completed ? <Check aria-hidden="true" /> : index + 1}</span>
                <span className="quest-copy">
                  <span className="quest-title-row">
                    <strong>{quest.title}</strong>
                    <em data-level={quest.level}>{quest.level}</em>
                  </span>
                  <span className="quest-summary">{quest.summary}</span>
                  <span className="quest-reward">
                    <Award aria-hidden="true" />
                    {quest.reward}
                    <b>+{quest.points} pts</b>
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="quest-chevron" />
              </button>

              {active && (
                <button
                  type="button"
                  className={`quest-complete-button ${completed ? "is-complete" : ""}`}
                  onClick={() => onComplete(quest)}
                  disabled={completed}
                >
                  {completed ? <CheckCircle2 aria-hidden="true" /> : <BadgeCheck aria-hidden="true" />}
                  {completed ? "완료됨" : "학습 완료 표시"}
                </button>
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

function InspectorContent({ iq }: { iq: IqDefinition }) {
  return (
    <div className="tab-section">
      <div className="inspector-title">
        <span className={`iq-orb iq-${iq.id}`} aria-hidden="true" />
        <div>
          <span>{iq.track}</span>
          <h3>{iq.name}</h3>
          <p>{iq.shortName}</p>
        </div>
      </div>

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

function ScenarioContent({
  scenario,
  fallback,
}: {
  scenario: (typeof workshopData.scenarios)[number]
  fallback: (typeof fallbackDefinitions)[number]
}) {
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
          <p className="unavailable-message">FabricIQ unavailable — 수치를 표시하지 않습니다.</p>
        ) : (
          <ul className="finding-list">
            {scenario.metrics.highlights.map((finding) => <li key={finding}>{finding}</li>)}
          </ul>
        )}
      </section>

      <details className="evidence-group" open>
        <summary>
          <span><FileSearch aria-hidden="true" />WorkIQ 내부 근거</span>
          <b>{scenario.workEvidence.length}</b>
        </summary>
        {fallback.unavailable.includes("work") ? (
          <p className="unavailable-message">WorkIQ unavailable — 내부 논의와 담당자를 추정하지 않습니다.</p>
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
          <span><Globe2 aria-hidden="true" />WebIQ citation</span>
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
      <div className="fallback-selector" aria-label="Fallback 모드">
        {fallbackDefinitions.map((definition) => (
          <button
            key={definition.id}
            type="button"
            className={fallback.id === definition.id ? "is-active" : ""}
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
                <small>{status}</small>
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

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const fallbackFocusTarget = returnFocusRef.current
    const backgroundElements = [
      document.querySelector<HTMLElement>(".app-header"),
      document.querySelector<HTMLElement>(".app-shell"),
    ].filter((element): element is HTMLElement => element !== null)

    backgroundElements.forEach((element) => {
      element.inert = true
    })
    closeButtonRef.current?.focus()

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
  }, [onClose, returnFocusRef])

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
        <span className="eyebrow">WORKSHOP SUMMARY</span>
        <h2 id="summary-title">하나의 질문, 네 가지 책임</h2>
        <p>
          수치는 FabricIQ, 내부 업무 근거는 WorkIQ, 최신 외부 근거는 WebIQ에서
          오고 FoundryIQ가 책임 경계를 보존해 결합·평가합니다.
        </p>

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

        <div className="summary-rule">
          <Info aria-hidden="true" />
          <p>{workshopData.fixtureNotice}</p>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [selectedIq, setSelectedIq] = useState<IqId>(getInitialIq)
  const [scenarioId, setScenarioId] = useState(getInitialScenarioId)
  const [mode, setMode] = useState<FallbackMode>(getInitialMode)
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>("inspector")
  const [activeQuestId, setActiveQuestId] = useState(quests[0].id)
  const [completedQuests, setCompletedQuests] = useState(getCompletedQuests)
  const [search, setSearch] = useState("")
  const [naturalQuery, setNaturalQuery] = useState("")
  const [pathStart, setPathStart] = useState("fabric")
  const [pathEnd, setPathEnd] = useState("briefing")
  const [path, setPath] = useState<string[]>([])
  const [zoom, setZoom] = useState(1)
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") ?? "light",
  )
  const [showSummary, setShowSummary] = useState(false)
  const [toast, setToast] = useState("")
  const summaryButtonRef = useRef<HTMLButtonElement>(null)
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

  if (!selectedDefinition || !selectedScenario || !selectedFallback) {
    throw new Error("Microsoft IQ Playground data is incomplete")
  }

  const points = quests
    .filter((quest) => completedQuests.has(quest.id))
    .reduce((total, quest) => total + quest.points, 0)

  const searchResults = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    if (!needle) return []

    const iqResults = iqDefinitions
      .filter((iq) =>
        [iq.name, iq.track, iq.source, iq.responsibility]
          .join(" ")
          .toLocaleLowerCase()
          .includes(needle),
      )
      .map((iq) => ({ id: iq.id, type: "IQ", title: iq.name, subtitle: iq.source }))

    const scenarioResults = workshopData.scenarios
      .filter((scenario) =>
        [scenario.id, scenario.question, scenario.goal, ...scenario.keywords]
          .join(" ")
          .toLocaleLowerCase()
          .includes(needle),
      )
      .map((scenario) => ({
        id: scenario.id,
        type: "질문",
        title: scenario.question,
        subtitle: scenario.goal,
      }))

    return [...iqResults, ...scenarioResults]
  }, [search])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set("iq", selectedIq)
    params.set("scenario", scenarioId)
    params.set("mode", mode)
    params.set("scoutTheme", theme)
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`)
  }, [mode, scenarioId, selectedIq, theme])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 2400)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function activateQuest(quest: Quest) {
    setActiveQuestId(quest.id)
    setSelectedIq(quest.focus)
    setExplorerTab(quest.tab)
    if (quest.scenarioId) setScenarioId(quest.scenarioId)
    if (quest.mode) setMode(quest.mode)
  }

  function completeQuest(quest: Quest) {
    const next = new Set(completedQuests)
    next.add(quest.id)
    setCompletedQuests(next)
    window.localStorage.setItem(COMPLETED_QUESTS_KEY, JSON.stringify([...next]))
    setToast(`${quest.reward} 배지를 획득했습니다.`)
  }

  function handleNodeSelect(id: IqId) {
    setSelectedIq(id)
    setExplorerTab("inspector")
  }

  function handlePathFind() {
    const nextPath = findPath(pathStart, pathEnd)
    setPath(nextPath)
    setToast(
      nextPath.length > 0
        ? `${nextPath.length}개 노드의 근거 경로를 표시했습니다.`
        : "연결 가능한 방향 경로가 없습니다.",
    )
  }

  function handleSearchResult(id: string, type: string) {
    if (type === "IQ") {
      setSelectedIq(id as IqId)
      setExplorerTab("inspector")
    } else {
      setScenarioId(id)
      setExplorerTab("scenario")
    }
    setSearch("")
  }

  function handleNaturalQuery(event: FormEvent) {
    event.preventDefault()
    const normalized = naturalQuery.trim().toLocaleLowerCase()
    if (!normalized) {
      setToast("질문을 입력하세요.")
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
      setToast("결제, 배송, 핵심 상품 질문 중 하나를 입력해 보세요.")
      return
    }

    setScenarioId(match)
    setSelectedIq("foundry")
    setExplorerTab("scenario")
    setNaturalQuery("")
    setToast(`${match} 근거 패키지를 열었습니다.`)
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

  const pathOptions = graphNodes.filter(
    (node) => node.kind === "iq" || node.kind === "output",
  )

  return (
    <div className="app">
      <Header
        points={points}
        badges={completedQuests.size}
        theme={theme}
        onThemeToggle={toggleTheme}
        onShare={handleShare}
        onSummary={() => setShowSummary(true)}
        summaryButtonRef={summaryButtonRef}
      />

      <div className="app-shell">
        <QuestPanel
          activeQuestId={activeQuestId}
          completedQuests={completedQuests}
          onActivate={activateQuest}
          onComplete={completeQuest}
        />

        <main className="workspace">
          <div className="workspace-toolbar">
            <div>
              <span className="eyebrow">CANONICAL FLOW</span>
              <h1>Track1 → Track2 → Track3 → Track4</h1>
            </div>
            <label>
              <span>시나리오</span>
              <select value={scenarioId} onChange={(event) => {
                setScenarioId(event.target.value)
                setExplorerTab("scenario")
              }}>
                {workshopData.scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.id} · {scenario.goal}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <FlowGraph
            selectedIq={selectedIq}
            path={path}
            fallback={selectedFallback}
            zoom={zoom}
            onZoomChange={setZoom}
            onSelectIq={handleNodeSelect}
          />

          <section className="trace-dock" aria-label="현재 응답 source trace">
            <div className="trace-heading">
              <Sparkles aria-hidden="true" />
              <span>
                <strong>{selectedScenario.id} sourceTrace</strong>
                <small>{selectedFallback.label} simulation</small>
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
                    <span><strong>{iq.name}</strong><small>{status}</small></span>
                  </button>
                )
              })}
            </div>
            <span className={`overall-status status-${selectedFallback.status}`}>
              {statusLabel(selectedFallback.status)}
            </span>
          </section>
        </main>

        <aside className="explorer-panel" aria-label="IQ 탐색기">
          <section className="insight-strip">
            <div><Network aria-hidden="true" /><strong>{workshopData.stats.iqCount}</strong><span>IQ</span></div>
            <div><Database aria-hidden="true" /><strong>{workshopData.stats.entityCount}</strong><span>Entities</span></div>
            <div><Link2 aria-hidden="true" /><strong>{workshopData.stats.webCitationCount}</strong><span>Citations</span></div>
          </section>

          <details className="tool-section" open>
            <summary><Search aria-hidden="true" />검색 & 필터</summary>
            <div className="search-box">
              <Search aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="IQ, 질문, 데이터 소스 검색"
                aria-label="IQ, 질문, 데이터 소스 검색"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="검색어 지우기">
                  <X aria-hidden="true" />
                </button>
              )}
            </div>
            {search && (
              <div className="search-results">
                {searchResults.length > 0 ? searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => handleSearchResult(result.id, result.type)}
                  >
                    <span>{result.type}</span>
                    <strong>{result.title}</strong>
                    <small>{result.subtitle}</small>
                  </button>
                )) : <p>일치하는 항목이 없습니다.</p>}
              </div>
            )}
          </details>

          <details className="tool-section">
            <summary><Network aria-hidden="true" />Path finder</summary>
            <div className="path-finder">
              <label>
                <span>시작</span>
                <select value={pathStart} onChange={(event) => setPathStart(event.target.value)}>
                  {pathOptions.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
                </select>
              </label>
              <ChevronRight aria-hidden="true" />
              <label>
                <span>도착</span>
                <select value={pathEnd} onChange={(event) => setPathEnd(event.target.value)}>
                  {pathOptions.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
                </select>
              </label>
              <button type="button" className="primary-button" onClick={handlePathFind}>경로 찾기</button>
            </div>
            {path.length > 0 && (
              <div className="path-result">
                {path.map((id, index) => (
                  <span key={id}>
                    {graphNodes.find((node) => node.id === id)?.label ?? id}
                    {index < path.length - 1 && <ChevronRight aria-hidden="true" />}
                  </span>
                ))}
              </div>
            )}
          </details>

          <div className="explorer-tabs" role="tablist" aria-label="탐색 보기">
            {([
              ["inspector", "Inspector"],
              ["scenario", "Scenario"],
              ["fallback", "Fallback"],
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

          <div className="explorer-content">
            {explorerTab === "inspector" && <InspectorContent iq={selectedDefinition} />}
            {explorerTab === "scenario" && (
              <ScenarioContent scenario={selectedScenario} fallback={selectedFallback} />
            )}
            {explorerTab === "fallback" && (
              <FallbackContent fallback={selectedFallback} onSelect={setMode} />
            )}
          </div>

          <form className="natural-query" onSubmit={handleNaturalQuery}>
            <label htmlFor="natural-query-input">
              <Sparkles aria-hidden="true" />
              자연어로 시나리오 열기
            </label>
            <div>
              <input
                id="natural-query-input"
                value={naturalQuery}
                onChange={(event) => setNaturalQuery(event.target.value)}
                placeholder="예: 배송 지연 근거 보여줘"
              />
              <button type="submit" aria-label="질문 실행"><Search aria-hidden="true" /></button>
            </div>
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
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

export default App
