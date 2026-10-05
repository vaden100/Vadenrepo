'use client';

import { useState, type ReactNode } from 'react';
import { CASE_STATUSES, type CaseStatus } from '@rmmm/api';
import { Button, Stamp } from '@rmmm/ui/web';

/** Renders children on both themes side by side. */
export function ThemeFrame({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  return (
    <div
      data-theme={theme}
      style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}
    >
      <div style={{ display: 'flex', gap: 8, padding: '16px 0' }} role="group" aria-label="Theme">
        <Button
          variant={theme === 'dark' ? 'primary' : 'secondary'}
          aria-pressed={theme === 'dark'}
          onClick={() => setTheme('dark')}
        >
          Dark
        </Button>
        <Button
          variant={theme === 'light' ? 'primary' : 'secondary'}
          aria-pressed={theme === 'light'}
          onClick={() => setTheme('light')}
        >
          Light
        </Button>
      </div>
      {children}
    </div>
  );
}

/** Advances the case status so the stamp slam can be seen. */
export function StampSlamDemo() {
  const [i, setI] = useState(0);
  const status = CASE_STATUSES[i % CASE_STATUSES.length] as CaseStatus;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 260 }} aria-live="polite">
        <Stamp kind={status} size="lg" animate />
      </div>
      <Button variant="secondary" onClick={() => setI((n) => n + 1)}>
        Next status
      </Button>
    </div>
  );
}
