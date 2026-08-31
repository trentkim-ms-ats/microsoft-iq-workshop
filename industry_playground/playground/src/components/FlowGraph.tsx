import { Minus, Plus, RotateCcw } from "lucide-react"
import {
  graphEdges,
  graphNodes,
  iqDefinitions,
  type FallbackDefinition,
  type IqId,
} from "@/data/model"

interface FlowGraphProps {
  selectedIq: IqId
  path: string[]
  fallback: FallbackDefinition
  zoom: number
  onZoomChange: (zoom: number) => void
  onSelectIq: (id: IqId) => void
}

function edgeCoordinates(fromId: string, toId: string) {
  const from = graphNodes.find((node) => node.id === fromId)
  const to = graphNodes.find((node) => node.id === toId)

  if (!from || !to) {
    throw new Error(`Unknown graph edge: ${fromId} -> ${toId}`)
  }

  const fromX = from.x + from.width / 2
  const toX = to.x - to.width / 2
  const curve = Math.max(46, (toX - fromX) * 0.45)

  return {
    path: `M ${fromX} ${from.y} C ${fromX + curve} ${from.y}, ${toX - curve} ${to.y}, ${toX} ${to.y}`,
    from,
    to,
  }
}

function isPathEdge(path: string[], from: string, to: string) {
  return path.some((nodeId, index) => nodeId === from && path[index + 1] === to)
}

export function FlowGraph({
  selectedIq,
  path,
  fallback,
  zoom,
  onZoomChange,
  onSelectIq,
}: FlowGraphProps) {
  const unavailable = new Set(fallback.unavailable)
  const pathSet = new Set(path)
  const transformX = 460 - 460 * zoom
  const transformY = 260 - 260 * zoom

  return (
    <section className="graph-stage" aria-label="Microsoft IQ 근거 흐름 그래프">
      <div className="graph-canvas">
        <div className="graph-hint">
          <strong>그래프 읽는 법</strong>
          <span>왼쪽 소스에서 시작해 IQ별 책임을 거쳐 근거 기반 브리핑을 만듭니다. 노드를 선택해 역할을 확인하세요.</span>
        </div>
        <svg
          viewBox="0 0 920 520"
          role="img"
          aria-labelledby="graph-title graph-description"
          preserveAspectRatio="xMidYMid meet"
        >
          <title id="graph-title">Microsoft IQ 근거 흐름</title>
          <desc id="graph-description">
            FabricIQ, WorkIQ, WebIQ가 FoundryIQ로 연결되고 근거 있는 브리핑을
            만드는 흐름입니다.
          </desc>
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" className="arrow-head" />
            </marker>
          </defs>

          <g transform={`translate(${transformX} ${transformY}) scale(${zoom})`}>
            {graphEdges.map(([fromId, toId]) => {
              const edge = edgeCoordinates(fromId, toId)
              const sourceUnavailable =
                edge.from.kind === "iq" && unavailable.has(edge.from.inspectId)
              const active = isPathEdge(path, fromId, toId)

              return (
                <path
                  key={`${fromId}-${toId}`}
                  d={edge.path}
                  className={[
                    "graph-edge",
                    active ? "is-active" : "",
                    sourceUnavailable ? "is-unavailable" : "",
                  ].join(" ")}
                  markerEnd="url(#arrow)"
                />
              )
            })}

            {graphNodes.map((node) => {
              const isSelected = node.inspectId === selectedIq && node.kind === "iq"
              const isUnavailable =
                node.kind === "iq" && unavailable.has(node.inspectId)
              const isOnPath = pathSet.has(node.id)
              const nodeHeight = node.kind === "source" ? 68 : 82

              return (
                <g
                  key={node.id}
                  className={[
                    "graph-node",
                    `graph-node-${node.kind}`,
                    isSelected ? "is-selected" : "",
                    isUnavailable ? "is-unavailable" : "",
                    isOnPath ? "is-on-path" : "",
                  ].join(" ")}
                  transform={`translate(${node.x - node.width / 2} ${node.y - nodeHeight / 2})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.label}: ${node.subtitle}`}
                  onClick={() => onSelectIq(node.inspectId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onSelectIq(node.inspectId)
                    }
                  }}
                >
                  <rect width={node.width} height={nodeHeight} rx="12" />
                  <text
                    x={node.width / 2}
                    y={node.kind === "source" ? 29 : 34}
                    textAnchor="middle"
                    className="graph-node-label"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.width / 2}
                    y={node.kind === "source" ? 49 : 57}
                    textAnchor="middle"
                    className="graph-node-subtitle"
                  >
                    {node.subtitle}
                  </text>
                  {isUnavailable && (
                    <text
                      x={node.width - 12}
                      y={16}
                      textAnchor="end"
                      className="graph-node-status"
                    >
                      사용 불가
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        <ol className="mobile-flow-list" aria-label="모바일 Microsoft IQ 근거 흐름">
          {iqDefinitions.map((iq, index) => {
            const isUnavailable = unavailable.has(iq.id)
            return (
              <li key={iq.id}>
                <button
                  type="button"
                  className={[
                    selectedIq === iq.id ? "is-selected" : "",
                    isUnavailable ? "is-unavailable" : "",
                  ].join(" ")}
                  onClick={() => onSelectIq(iq.id)}
                >
                  <span className="mobile-flow-step">{index + 1}</span>
                  <span>
                    <strong>{iq.name}</strong>
                    <small>{iq.shortName} · {iq.source}</small>
                  </span>
                  <em>{isUnavailable ? "사용 불가" : "역할 보기"}</em>
                </button>
              </li>
            )
          })}
          <li className="mobile-flow-output">
            <span>결과</span>
            <strong>근거 기반 브리핑</strong>
            <small>답변 · 제안 조치 · 경고 · sourceTrace</small>
          </li>
        </ol>

        <div className="graph-legend" aria-label="그래프 범례">
          <span><i className="legend-swatch source" />데이터 소스</span>
          <span><i className="legend-swatch iq" />Microsoft IQ</span>
          <span><i className="legend-swatch output" />최종 산출물</span>
        </div>

        <div className="graph-controls" aria-label="그래프 확대/축소">
          <button
            type="button"
            className="icon-button"
            aria-label="축소"
            onClick={() => onZoomChange(Math.max(0.75, zoom - 0.1))}
            disabled={zoom <= 0.75}
          >
            <Minus aria-hidden="true" />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="icon-button"
            aria-label="확대"
            onClick={() => onZoomChange(Math.min(1.35, zoom + 0.1))}
            disabled={zoom >= 1.35}
          >
            <Plus aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="배율 초기화"
            onClick={() => onZoomChange(1)}
          >
            <RotateCcw aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
