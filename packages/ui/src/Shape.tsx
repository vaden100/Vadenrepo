import { shapes, type ShapeName } from './generated/brand';
import { BrandSvgElement } from './svg';

/**
 * The visual-language primitives (SPEC 7.2), always decorative. Shapes come from the
 * sessions: the round table, the whiteboard marker line, the S.O.S (Stack Over Shine) star, a speech bubble.
 */
export function Shape({ name, className }: { name: ShapeName; className?: string }) {
  return (
    <BrandSvgElement
      asset={shapes[name]}
      className={['shape', `shape--${name}`, className].filter(Boolean).join(' ')}
    />
  );
}

/** Seat positions around a table, deterministic for a given count. */
export function seatPositions(seats: number, radius = 46, center = 60) {
  const n = Math.max(0, Math.floor(seats));
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      cx: Math.round((center + radius * Math.cos(a)) * 10) / 10,
      cy: Math.round((center + radius * Math.sin(a)) * 10) / 10,
    };
  });
}

/**
 * Generative round table (SPEC 7.2): one seat per unit of a real, sourced number. Decorative:
 * the number it encodes must also be stated in text next to it.
 */
export function Roundtable({ seats, className }: { seats: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      aria-hidden
      focusable="false"
      className={['shape', 'shape--roundtable', className].filter(Boolean).join(' ')}
    >
      <circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
      <g fill="currentColor">
        {seatPositions(seats).map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r="5" />
        ))}
      </g>
    </svg>
  );
}
