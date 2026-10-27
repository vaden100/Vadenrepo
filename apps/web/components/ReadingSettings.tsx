'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { strings } from '@ns1/i18n';
import { Button, Checkbox, Icon } from '@ns1/ui';
import {
  applyReading,
  defaultReading,
  READING_KEY,
  readReading,
  type ReadingSettings,
} from '@/lib/reading';

const t = strings().reading;

function save(s: ReadingSettings) {
  applyReading(document.documentElement, s);
  try {
    localStorage.setItem(READING_KEY, JSON.stringify(s));
  } catch {
    // Private mode or blocked storage: the setting still applies for this page view.
  }
}

/** The settings form itself, used in the dialog and on the style guide. */
export function ReadingSettingsForm() {
  const id = useId();
  const [s, setS] = useState<ReadingSettings>(defaultReading);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Storage is only readable in the browser; sync once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS(readReading(window.localStorage));
  }, []);

  const update = (patch: Partial<ReadingSettings>) => {
    const next = { ...s, ...patch };
    setS(next);
    save(next);
    setStatus(t.saved);
  };

  const radios = <K extends 'textSize' | 'theme'>(
    key: K,
    legend: string,
    options: Array<[ReadingSettings[K], string]>,
  ) => (
    <fieldset className="choice">
      <legend>{legend}</legend>
      <div className="choice__options">
        {options.map(([value, label]) => (
          <label key={value} className="choice__option">
            <input
              type="radio"
              name={`${id}-${key}`}
              value={value}
              checked={s[key] === value}
              onChange={() => update({ [key]: value } as Partial<ReadingSettings>)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="stack">
      <p>{t.prose}</p>
      {radios('textSize', t.textSize, [
        ['normal', t.textSizeNormal],
        ['large', t.textSizeLarge],
        ['larger', t.textSizeLarger],
      ])}
      <Checkbox
        id={`${id}-spacing`}
        label={t.spacing}
        checked={s.spacing}
        onChange={(e) => update({ spacing: e.currentTarget.checked })}
      />
      <Checkbox
        id={`${id}-motion`}
        label={t.motion}
        checked={s.motion}
        onChange={(e) => update({ motion: e.currentTarget.checked })}
      />
      <Checkbox
        id={`${id}-contrast`}
        label={t.contrast}
        checked={s.contrast}
        onChange={(e) => update({ contrast: e.currentTarget.checked })}
      />
      {radios('theme', t.theme, [
        ['system', t.themeSystem],
        ['light', t.themeLight],
        ['dark', t.themeDark],
      ])}
      <div className="cluster">
        <Button variant="secondary" onClick={() => update(defaultReading)}>
          {t.actions.reset}
        </Button>
        <p role="status" className="field__hint">
          {status}
        </p>
      </div>
    </div>
  );
}

/** Button that opens the settings in a native <dialog> (focus trap and Escape for free). */
export function ReadingSettingsButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  /** Compact header version: the icon carries the accessible name. */
  iconOnly?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          className={['icon-link', className].filter(Boolean).join(' ')}
          aria-haspopup="dialog"
          onClick={() => ref.current?.showModal()}
        >
          <Icon name="settings" label={t.open} />
        </button>
      ) : (
        <Button
          variant="quiet"
          icon="settings"
          className={className}
          aria-haspopup="dialog"
          onClick={() => ref.current?.showModal()}
        >
          {t.open}
        </Button>
      )}
      <dialog ref={ref} className="dialog" aria-labelledby={titleId}>
        <div className="dialog__head">
          <h2 id={titleId}>{t.heading}</h2>
          <button type="button" className="dialog__close" onClick={() => ref.current?.close()}>
            <Icon name="close" label={t.actions.close} />
          </button>
        </div>
        <ReadingSettingsForm />
      </dialog>
    </>
  );
}
