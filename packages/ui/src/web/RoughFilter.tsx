/**
 * Render once per page (root layout). Gives stamps their inked, rough edge while their
 * text stays real, selectable, screen-reader-friendly text.
 */
export function RoughFilterDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <filter id="rmmm-rough" x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={2.2} />
      </filter>
    </svg>
  );
}
