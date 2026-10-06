import { en } from '@rmmm/ui/web';

export interface GraphNode {
  id: string;
  name: string;
  isPublic: boolean;
}
export interface GraphEdge {
  other: string;
  reason: string;
  confidence: number;
  confirmed: boolean;
}

/**
 * Rebrand / alias graph (SPEC 5 admin "link graph view"): this entity in the middle, linked
 * entities around it. Solid lines are confirmed links, dashed ones still need a person.
 * Server-rendered SVG with a text list next to it for screen readers.
 */
export function LinkGraph({
  center,
  nodes,
  edges,
}: {
  center: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const size = 360;
  const c = size / 2;
  const r = nodes.length ? 130 : 0;
  const pos = new Map(
    nodes.map((n, i) => [
      n.id,
      {
        x: c + r * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
        y: c + r * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
      },
    ]),
  );
  const short = (s: string) => (s.length > 18 ? `${s.slice(0, 17)}.` : s);
  return (
    <figure className="link-graph">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={en.admin.entity.graphLabel(nodes.length)}
        className="link-graph__svg"
      >
        {edges.map((e) => {
          const p = pos.get(e.other);
          if (!p) return null;
          return (
            <g key={`${e.other}-${e.reason}`}>
              <line
                x1={c}
                y1={c}
                x2={p.x}
                y2={p.y}
                className="link-graph__edge"
                strokeDasharray={e.confirmed ? undefined : '6 4'}
              />
              <text
                x={(c + p.x) / 2}
                y={(c + p.y) / 2 - 4}
                className="link-graph__label"
                textAnchor="middle"
              >
                {Math.round(e.confidence * 100)}%
              </text>
            </g>
          );
        })}
        {[
          { ...center, x: c, y: c, main: true },
          ...nodes.map((n) => ({ ...n, ...pos.get(n.id)!, main: false })),
        ].map((n) => (
          <g key={n.id}>
            <rect
              x={n.x - 56}
              y={n.y - 16}
              width={112}
              height={32}
              rx={2}
              className={n.main ? 'link-graph__node link-graph__node--main' : 'link-graph__node'}
            />
            <text x={n.x} y={n.y + 5} textAnchor="middle" className="link-graph__text">
              {short(n.name)}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
