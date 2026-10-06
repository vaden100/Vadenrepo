'use client';

import { useEffect, useState } from 'react';
import { en } from '@rmmm/ui/web';

/** Live SLA clock (SPEC 10.7): "Due in 3h 12m" or "Overdue by 1h 4m". Updates every 30 s. */
export function Deadline({ due, now: initialNow }: { due: string; now: number }) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const diff = new Date(due).getTime() - now;
  const mins = Math.floor(Math.abs(diff) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const overdue = diff < 0;
  return (
    <time
      dateTime={due}
      className="deadline"
      data-overdue={overdue ? '' : undefined}
      title={new Date(due).toUTCString()}
    >
      {overdue ? en.admin.flags.overdue(h, m) : en.admin.flags.dueIn(h, m)}
    </time>
  );
}
