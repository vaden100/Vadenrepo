'use client';

import { useState } from 'react';
import { en } from '@rmmm/ui';
import { THEME_COOKIE, type ThemeChoice } from '@/lib/theme';
import { track } from './analytics';

const ORDER: ThemeChoice[] = ['system', 'dark', 'light'];

/** Applies a theme choice now and remembers it (cookie read server-side: no flash on reload). */
export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    choice === 'system'
      ? `${THEME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
      : `${THEME_COOKIE}=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function ThemeGlyph({ choice }: { choice: ThemeChoice }) {
  // Same family as brand/icons: 24px grid, 2px stroke, square caps.
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      {choice === 'light' ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
        </>
      ) : choice === 'dark' ? (
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
      ) : (
        <>
          <rect x="3" y="4" width="18" height="13" />
          <path d="M8 21h8M12 17v4" />
        </>
      )}
    </svg>
  );
}

const label = (c: ThemeChoice) => en.theme[c];

export function ThemeToggle({
  initial,
  showLabel = false,
}: {
  initial: ThemeChoice;
  showLabel?: boolean;
}) {
  const [choice, setChoice] = useState<ThemeChoice>(initial);
  return (
    <button
      type="button"
      className={showLabel ? 'rmmm-btn rmmm-btn--secondary' : 'rmmm-btn rmmm-btn--icon'}
      aria-label={en.theme.change(label(choice))}
      title={en.theme.change(label(choice))}
      onClick={() => {
        const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length]!;
        setChoice(next);
        applyTheme(next);
        track('theme_changed', { theme: next });
      }}
    >
      <ThemeGlyph choice={choice} />
      {showLabel && (
        <span>
          {en.theme.label}: {label(choice)}
        </span>
      )}
    </button>
  );
}
