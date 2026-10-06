import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Icon } from './Icon';

interface FieldBase {
  label: ReactNode;
  /** Help text under the label. */
  description?: ReactNode;
  /** Error message. Sets aria-invalid and is announced with the field. */
  error?: string | null;
  /** Show a confirmed-valid marker (only after the value has been checked). */
  valid?: boolean;
  /** Shows "(optional)" next to the label instead of marking required fields. */
  optional?: boolean;
  optionalLabel?: string;
}

function useFieldIds(id?: string) {
  const auto = useId();
  const base = id ?? `f${auto.replace(/:/g, '')}`;
  return { id: base, desc: `${base}-desc`, err: `${base}-err` };
}

function describedBy(ids: ReturnType<typeof useFieldIds>, description: unknown, error: unknown) {
  return (
    [description ? ids.desc : null, error ? ids.err : null].filter(Boolean).join(' ') || undefined
  );
}

function FieldShell({
  ids,
  label,
  description,
  error,
  valid,
  optional,
  optionalLabel = 'optional',
  children,
}: FieldBase & { ids: ReturnType<typeof useFieldIds>; children: ReactNode }) {
  return (
    <div
      className="rmmm-field"
      data-invalid={error ? '' : undefined}
      data-valid={valid && !error ? '' : undefined}
    >
      <label className="rmmm-field__label" htmlFor={ids.id}>
        {label}
        {optional && <span className="rmmm-field__optional"> ({optionalLabel})</span>}
      </label>
      {description && (
        <p className="rmmm-field__desc" id={ids.desc}>
          {description}
        </p>
      )}
      <div className="rmmm-field__control">
        {children}
        {valid && !error && (
          <Icon name="verified" size={20} className="rmmm-field__valid" label="Looks good" />
        )}
      </div>
      {error && (
        <p className="rmmm-field__error" id={ids.err}>
          <Icon name="flag" size={16} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export type TextFieldProps = FieldBase & Omit<InputHTMLAttributes<HTMLInputElement>, 'children'>;

export function TextField({
  label,
  description,
  error,
  valid,
  optional,
  optionalLabel,
  id,
  className,
  ...input
}: TextFieldProps) {
  const ids = useFieldIds(id);
  return (
    <FieldShell {...{ ids, label, description, error, valid, optional, optionalLabel }}>
      <input
        id={ids.id}
        className={['rmmm-input', className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, description, error)}
        required={!optional && input.required !== false ? input.required : undefined}
        {...input}
      />
    </FieldShell>
  );
}

export type TextAreaProps = FieldBase &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> & {
    /** Shows a live character count when maxLength is set. */
    showCount?: boolean;
  };

export function TextArea({
  label,
  description,
  error,
  valid,
  optional,
  optionalLabel,
  id,
  className,
  showCount,
  ...area
}: TextAreaProps) {
  const ids = useFieldIds(id);
  const count = typeof area.value === 'string' ? area.value.length : 0;
  return (
    <FieldShell {...{ ids, label, description, error, valid, optional, optionalLabel }}>
      <textarea
        id={ids.id}
        className={['rmmm-input', 'rmmm-input--area', className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, description, error)}
        {...area}
      />
      {showCount && area.maxLength ? (
        <span className="rmmm-field__count" aria-live="polite" aria-atomic="true">
          {count} / {area.maxLength}
        </span>
      ) : null}
    </FieldShell>
  );
}

export type SelectFieldProps = FieldBase &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: readonly { value: string; label: string }[];
    placeholder?: string;
  };

export function SelectField({
  label,
  description,
  error,
  valid,
  optional,
  optionalLabel,
  id,
  options,
  placeholder,
  className,
  ...select
}: SelectFieldProps) {
  const ids = useFieldIds(id);
  return (
    <FieldShell {...{ ids, label, description, error, valid, optional, optionalLabel }}>
      <select
        id={ids.id}
        className={['rmmm-input', 'rmmm-input--select', className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, description, error)}
        {...select}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string | null;
};

/** Native checkbox, always unchecked unless the caller says otherwise (no preselected consent). */
export function Checkbox({ label, description, error, id, className, ...input }: CheckboxProps) {
  const ids = useFieldIds(id);
  return (
    <div
      className={['rmmm-check', className].filter(Boolean).join(' ')}
      data-invalid={error ? '' : undefined}
    >
      <input
        id={ids.id}
        type="checkbox"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, description, error)}
        {...input}
      />
      <div>
        <label htmlFor={ids.id}>{label}</label>
        {description && (
          <p className="rmmm-field__desc" id={ids.desc}>
            {description}
          </p>
        )}
        {error && (
          <p className="rmmm-field__error" id={ids.err}>
            <Icon name="flag" size={16} />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export interface RadioGroupProps {
  legend: ReactNode;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: ReactNode; description?: ReactNode }[];
  error?: string | null;
  description?: ReactNode;
}

export function RadioGroup({
  legend,
  name,
  value,
  onChange,
  options,
  error,
  description,
}: RadioGroupProps) {
  const ids = useFieldIds();
  return (
    <fieldset
      className="rmmm-radios"
      aria-describedby={describedBy(ids, description, error)}
      aria-invalid={error ? true : undefined}
    >
      <legend className="rmmm-field__label">{legend}</legend>
      {description && (
        <p className="rmmm-field__desc" id={ids.desc}>
          {description}
        </p>
      )}
      <div className="rmmm-radios__options">
        {options.map((o) => {
          const oid = `${ids.id}-${o.value}`;
          return (
            <label
              key={o.value}
              className="rmmm-radio"
              htmlFor={oid}
              data-checked={value === o.value ? '' : undefined}
            >
              <input
                id={oid}
                type="radio"
                name={name}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
              />
              <span>
                <span className="rmmm-radio__label">{o.label}</span>
                {o.description && <span className="rmmm-radio__desc">{o.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="rmmm-field__error" id={ids.err}>
          <Icon name="flag" size={16} />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}
