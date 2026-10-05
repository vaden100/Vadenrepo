import { colors } from '@rmmm/tokens';
import { stampMeta, type StampKind } from '../shared/status';

export interface StampProps {
  kind: StampKind;
  size?: 'sm' | 'md' | 'lg';
  /** Slam when `kind` changes (status updates). Respects prefers-reduced-motion. */
  animate?: boolean;
  /** Slight tilt like a hand stamp. */
  tilt?: number;
  className?: string;
}

export function Stamp({ kind, size = 'md', animate = false, tilt = -3, className }: StampProps) {
  const meta = stampMeta[kind];
  return (
    <span
      // Remount on change so the slam replays for each new status.
      key={animate ? kind : undefined}
      className={['rmmm-stamp', `rmmm-stamp--${size}`, animate && 'rmmm-stamp--slam', className]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: colors[meta.color],
        color: colors[meta.text],
        ['--rmmm-stamp-tilt' as string]: `${tilt}deg`,
      }}
    >
      {meta.label}
    </span>
  );
}
