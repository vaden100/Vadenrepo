'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { en } from '@rmmm/ui';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

/** WBS 46, 149: tell people when the connection drops; never pretend actions succeeded. */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const [showBack, setShowBack] = useState(false);

  // "Back online" only after a real reconnect, set from the event (not during render/effect body).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const onOnline = () => {
      setShowBack(true);
      clearTimeout(t);
      t = setTimeout(() => setShowBack(false), 4000);
    };
    const onOffline = () => setShowBack(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      clearTimeout(t);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online && !showBack)
    return <div role="status" aria-live="polite" className="rmmm-visually-hidden" />;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`net-banner${online ? ' net-banner--ok' : ''}`}
    >
      {online ? en.network.backOnline : en.network.offline}
    </div>
  );
}
