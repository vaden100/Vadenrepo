'use client';

import { useEffect, useRef, useState } from 'react';
import { Stamp } from '@rmmm/ui/web';
import type { reviewSteps } from '@/content/about';

/**
 * "How a report becomes a case" (WBS 13, 115, 116). Server-rendered as an ordered list, so it
 * reads fine without JS or with reduced motion. With JS, an IntersectionObserver marks the step
 * in view and the sticky stamp slams to that status. No scroll handlers, transforms only.
 */
export function StorySequence({ steps }: { steps: typeof reviewSteps }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const current = steps[active] ?? steps[0]!;
  return (
    <div className="story">
      <div className="story__stamp" aria-hidden="true">
        <Stamp kind={current.stamp} size="lg" animate tilt={-5} />
        <p className="story__count mono">
          {String(active + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </p>
      </div>
      <ol className="story__steps">
        {steps.map((s, i) => (
          <li
            key={s.stamp}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-step={i}
            data-active={i === active ? '' : undefined}
            className="story__step"
          >
            <span className="story__inline-stamp">
              <Stamp kind={s.stamp} size="sm" tilt={-3} />
            </span>
            <h3 className="h3">{s.title}</h3>
            <p className="muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
