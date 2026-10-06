'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Tone } from './Status';
import { StatusMessage } from './Status';

interface Toast {
  id: number;
  tone: Tone;
  title: ReactNode;
  body?: ReactNode;
}

interface ToastApi {
  show: (t: Omit<Toast, 'id'>, opts?: { durationMs?: number }) => void;
}

const Ctx = createContext<ToastApi>({ show: () => {} });

/** Toasts for confirmations that happen off-screen. Errors stay until dismissed. */
export function ToastProvider({
  children,
  dismissLabel = 'Dismiss',
}: {
  children: ReactNode;
  dismissLabel?: string;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback<ToastApi['show']>(
    (t, opts) => {
      const id = ++seq.current;
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      const ms = opts?.durationMs ?? (t.tone === 'error' ? 0 : 6000);
      if (ms > 0) setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );
  const api = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="rmmm-toasts" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className="rmmm-toast">
            <StatusMessage
              tone={t.tone}
              title={t.title}
              action={
                <button
                  type="button"
                  className="rmmm-btn rmmm-btn--text"
                  onClick={() => dismiss(t.id)}
                >
                  {dismissLabel}
                </button>
              }
            >
              {t.body}
            </StatusMessage>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
