import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * Form fields (SPEC 11): visible label, hint and error tied with aria-describedby,
 * aria-invalid on error. Pass autoComplete on personal fields.
 */
export function TextField({
  id,
  label,
  hint,
  error,
  optionalLabel,
  ...input
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Shown after the label when the field is optional, e.g. "(optional)". */
  optionalLabel?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={['field', error && 'field--error'].filter(Boolean).join(' ')}>
      <label htmlFor={id} className="field__label">
        {label}
        {optionalLabel && <span className="field__optional"> {optionalLabel}</span>}
      </label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error">
          <Icon name="alert" size={20} />
          <span>{error}</span>
        </p>
      )}
      <input
        id={id}
        className="field__input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...input}
      />
    </div>
  );
}

export function Checkbox({
  id,
  label,
  hint,
  ...input
}: { id: string; label: ReactNode; hint?: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type'
>) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="check">
      <input
        id={id}
        type="checkbox"
        className="check__input"
        aria-describedby={hintId}
        {...input}
      />
      <label htmlFor={id} className="check__label">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="field__hint check__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
