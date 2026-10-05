import type { ComponentType } from 'react';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { iconShapes, type IconName, type IconShape } from '../icons/generated';

const tags = {
  path: Path,
  circle: Circle,
  rect: Rect,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  ellipse: Ellipse,
} as const satisfies Record<IconShape['tag'], unknown>;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** Accessible label. Omit for decorative icons. */
  label?: string;
}

export function Icon({ name, size = 24, color = 'currentColor', label }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      {iconShapes[name].map((s, i) => {
        const Shape = tags[s.tag] as unknown as ComponentType<Record<string, string>>;
        return <Shape key={String(i)} {...(s.attrs as Record<string, string>)} />;
      })}
    </Svg>
  );
}
