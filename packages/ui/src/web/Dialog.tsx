'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Hide the title visually but keep it as the accessible name. */
  hideTitle?: boolean;
  description?: ReactNode;
  children: ReactNode;
  closeLabel?: string;
  size?: 'sm' | 'md' | 'full';
  /** Where the dialog sits: centered card or a full-height sheet (mobile nav). */
  placement?: 'center' | 'sheet';
  className?: string;
}

/**
 * Native <dialog> + showModal(): the browser traps focus, makes the page inert and handles
 * Escape. We add: focus restore, backdrop click to close, and scroll lock (WBS 21).
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle,
  description,
  children,
  closeLabel = 'Close',
  size = 'md',
  placement = 'center',
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = `dlg-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      d.showModal();
      document.documentElement.dataset.scrollLock = '';
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      delete document.documentElement.dataset.scrollLock;
      returnTo.current?.focus?.();
      if (open) onClose();
    };
    d.addEventListener('close', onDialogClose);
    return () => d.removeEventListener('close', onDialogClose);
  }, [open, onClose]);

  useEffect(() => () => void delete document.documentElement.dataset.scrollLock, []);

  return (
    <dialog
      ref={ref}
      className={['rmmm-dialog', `rmmm-dialog--${size}`, `rmmm-dialog--${placement}`, className]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="rmmm-dialog__panel">
        <header className="rmmm-dialog__head">
          <h2 id={titleId} className={hideTitle ? 'rmmm-visually-hidden' : 'rmmm-dialog__title'}>
            {title}
          </h2>
          <button
            type="button"
            className="rmmm-btn rmmm-btn--icon"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        {description && <p className="rmmm-dialog__desc">{description}</p>}
        <div className="rmmm-dialog__body">{children}</div>
      </div>
    </dialog>
  );
}

export { Icon as DialogIcon };
