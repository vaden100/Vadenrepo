'use client';

import { useState, type ReactNode } from 'react';
import { CASE_STATUSES, type CaseStatus } from '@rmmm/api';
import {
  Button,
  Checkbox,
  Dialog,
  SelectField,
  Stamp,
  TextArea,
  TextField,
  useToast,
} from '@rmmm/ui/web';

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

/** Interactive states that need client state: dialog, toast, field states. */
export function InteractiveDemos() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <div
      style={{
        display: 'grid',
        gap: 24,
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <TextField label="Empty" placeholder="Type here" />
        <TextField label="Filled and valid" defaultValue="dee@example.demo" valid />
        <TextField
          label="Invalid"
          defaultValue="dee@"
          error="Enter an email address we can reply to."
        />
        <TextField label="Disabled" defaultValue="Not editable" disabled />
        <TextField label="Optional field" optional description="Help text sits under the label." />
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        <SelectField
          label="Select"
          defaultValue=""
          placeholder="Choose one"
          options={[
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ]}
        />
        <TextArea label="Text area with count" maxLength={200} showCount defaultValue="" />
        <Checkbox
          label="Checkbox (never preselected)"
          description="Consent boxes start unchecked."
        />
        <Checkbox label="Checkbox with error" error="Tick the box to confirm." />
      </div>
      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Dialog"
          description="Focus is trapped, Escape closes, focus returns to the button."
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <TextField label="A field inside" />
            <Button onClick={() => setOpen(false)}>Done</Button>
          </div>
        </Dialog>
        <Button
          variant="secondary"
          onClick={() =>
            toast.show({
              tone: 'success',
              title: 'Saved',
              body: 'Shown only after the server confirms.',
            })
          }
        >
          Show success toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.show({ tone: 'error', title: 'Not sent', body: 'Errors stay until dismissed.' })
          }
        >
          Show error toast
        </Button>
      </div>
    </div>
  );
}
