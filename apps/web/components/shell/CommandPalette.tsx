'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, en } from '@rmmm/ui/web';
import type { NavItem } from '@/lib/site';
import { track } from './analytics';

function score(item: NavItem, q: string): number {
  if (!q) return 1;
  const hay = `${item.label} ${item.href} ${item.keywords ?? ''}`.toLowerCase();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.every((w) => hay.includes(w))) return 0;
  return item.label.toLowerCase().startsWith(words[0]!) ? 2 : 1;
}

/**
 * Command palette (WBS 66): Ctrl/Cmd+K anywhere, or "/" when not typing. ARIA combobox +
 * listbox: arrows move, Enter opens, Escape closes (native dialog). Optional: every
 * destination is also in the menu and footer.
 */
export function CommandPalette({
  items,
  open,
  onOpenChange,
}: {
  items: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const listId = `pal-${useId().replace(/:/g, '')}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () =>
      items
        .map((i) => ({ i, s: score(i, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.i),
    [items, q],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      track('palette_opened');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const go = (item: NavItem | undefined) => {
    if (!item) return;
    onOpenChange(false);
    setQ('');
    setActive(0);
    router.push(item.href);
  };

  const optionId = (n: number) => `${listId}-o${n}`;

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={en.palette.title}
      size="md"
      className="palette"
    >
      <input
        ref={inputRef}
        className="rmmm-input"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          results.length ? optionId(Math.min(active, results.length - 1)) : undefined
        }
        aria-label={en.palette.placeholder}
        placeholder={en.palette.placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => (results.length ? (a + 1) % results.length : 0));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
          } else if (e.key === 'Home') {
            setActive(0);
          } else if (e.key === 'End') {
            setActive(Math.max(0, results.length - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            go(results[Math.min(active, results.length - 1)]);
          }
        }}
      />
      <p className="rmmm-visually-hidden" role="status" aria-live="polite">
        {en.palette.results(results.length)}
      </p>
      {results.length === 0 ? (
        <p className="palette__empty">{en.palette.empty}</p>
      ) : (
        <ul id={listId} role="listbox" aria-label={en.palette.groupPages} className="palette__list">
          {results.map((item, n) => (
            <li
              key={item.href}
              id={optionId(n)}
              role="option"
              aria-selected={n === active}
              className="palette__option"
              onMouseMove={() => setActive(n)}
              onClick={() => go(item)}
            >
              <span>{item.label}</span>
              <span className="palette__path">{item.href}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="palette__keys" aria-hidden="true">
        <kbd>↑</kbd> <kbd>↓</kbd> {en.palette.keys.move} · <kbd>Enter</kbd> {en.palette.keys.open} ·{' '}
        <kbd>Esc</kbd> {en.palette.keys.close} · <kbd>/</kbd> <kbd>Ctrl K</kbd>{' '}
        {en.palette.keys.anywhere}
      </p>
    </Dialog>
  );
}
