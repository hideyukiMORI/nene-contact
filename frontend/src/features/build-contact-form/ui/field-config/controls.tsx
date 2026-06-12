/**
 * Shared field-config controls (field-config UI §02). Reuses the .cf-* / .fc-* classes so the
 * panels for every field type are built from the same building blocks as the choice editor.
 */
import type { ReactNode } from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';

export function FieldText({
  label,
  optLabel,
  value,
  onChange,
  placeholder,
  mono,
  type,
}: {
  label?: string;
  optLabel?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: string;
}): ReactNode {
  return (
    <div className="fc-field">
      {label !== undefined ? (
        <label>
          {label}
          {optLabel !== undefined ? <span className="opt"> {optLabel}</span> : null}
        </label>
      ) : null}
      <input
        className="cf-input"
        type={type ?? 'text'}
        value={value}
        aria-label={label}
        style={mono === true ? { fontFamily: 'var(--ex-font-mono)', fontSize: 12.5 } : undefined}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Toggle({
  tl,
  td,
  on,
  onChange,
}: {
  tl: string;
  td?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}): ReactNode {
  return (
    <div className="cf-togglerow">
      <div className="tx">
        <div className="tl">{tl}</div>
        {td !== undefined ? <div className="td">{td}</div> : null}
      </div>
      <button
        type="button"
        className={'cf-switch' + (on ? '' : ' off')}
        role="switch"
        aria-checked={on}
        aria-label={tl}
        onClick={() => {
          onChange(!on);
        }}
      />
    </div>
  );
}

export interface SegOption<T> {
  v: T;
  label: string;
  icon?: IconName;
}

export function SegBlock<T extends string | number | boolean>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
}): ReactNode {
  return (
    <div className="cf-seg block">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          className={value === o.v ? 'on' : ''}
          aria-pressed={value === o.v}
          onClick={() => {
            onChange(o.v);
          }}
        >
          {o.icon !== undefined ? <Icon name={o.icon} size={14} /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CtrlRow({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="cf-ctrlrow">
      <span className="l">{label}</span>
      {children}
    </div>
  );
}

export function Stepper({
  value,
  set,
  min,
  max,
  disabled,
}: {
  value: number;
  set: (v: number) => void;
  min: number;
  max?: number;
  disabled?: boolean;
}): ReactNode {
  return (
    <div className={'cf-stepper' + (disabled === true ? ' dim' : '')}>
      <button
        type="button"
        aria-label="−"
        disabled={value <= min}
        onClick={() => {
          set(Math.max(min, value - 1));
        }}
      >
        −
      </button>
      <span className="val">{value}</span>
      <button
        type="button"
        aria-label="＋"
        disabled={max != null && value >= max}
        onClick={() => {
          set(max != null ? Math.min(max, value + 1) : value + 1);
        }}
      >
        ＋
      </button>
    </div>
  );
}

export interface ChipItem {
  key: string;
  label: string;
  sub?: string;
  icon?: IconName;
  on: boolean;
  toggle: () => void;
}

export function ChipGroup({ items }: { items: ChipItem[] }): ReactNode {
  return (
    <div className="fc-chips">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          className={'fc-chip' + (it.on ? ' on' : '')}
          aria-pressed={it.on}
          onClick={it.toggle}
        >
          <span className="ck">
            <Icon name="check" size={13} />
          </span>
          {it.icon !== undefined ? <Icon name={it.icon} size={14} /> : null}
          {it.label}
          {it.sub !== undefined ? <span className="sub">{it.sub}</span> : null}
        </button>
      ))}
    </div>
  );
}

export interface PickOption<T> {
  v: T;
  t: string;
  d?: string;
}

export function PickList<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: PickOption<T>[];
}): ReactNode {
  return (
    <div className="fc-picks">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          className={'fc-pick' + (value === o.v ? ' on' : '')}
          aria-pressed={value === o.v}
          onClick={() => {
            onChange(o.v);
          }}
        >
          <span className="dot" />
          <div>
            <div className="t">{o.t}</div>
            {o.d !== undefined ? <div className="d">{o.d}</div> : null}
          </div>
        </button>
      ))}
    </div>
  );
}

export function Note({ children, icon }: { children: ReactNode; icon?: IconName }): ReactNode {
  return (
    <div className="fc-hint">
      <Icon name={icon ?? 'info'} size={13} />
      <span>{children}</span>
    </div>
  );
}
