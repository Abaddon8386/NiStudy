"use client";

import { useId } from "react";

type Option<T extends string> = { value: T; label: string };

const smallInput =
  "h-11 rounded-[14px] border-2 border-ink bg-paper px-3 text-[18px] font-medium text-ink " +
  "aria-[invalid=true]:border-bad";

function Below({
  id,
  hint,
  error,
  status,
}: {
  id: string;
  hint?: string;
  error?: string;
  status?: React.ReactNode;
}) {
  return (
    <>
      {(hint || status) && (
        <div className="mt-1 flex items-start justify-between gap-3">
          {hint ? (
            <p id={`${id}-hint`} className="min-w-0 text-[14px] leading-[1.4] text-ink-2">
              {hint}
            </p>
          ) : (
            <span />
          )}
          {status && <div className="ml-auto shrink-0">{status}</div>}
        </div>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-[14px] leading-[1.4] font-medium text-bad">
          {error}
        </p>
      )}
    </>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return [error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
}

/** Dòng cài đặt: nhãn trái, nhóm pill nhỏ phải (radiogroup thật, vùng bấm 44px). */
export function ChipRow<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
  hint,
  status,
}: {
  label: string;
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  hint?: string;
  status?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span id={`${id}-l`} className="text-base font-medium">
          {label}
        </span>
        <div role="radiogroup" aria-labelledby={`${id}-l`} aria-describedby={hint ? `${id}-hint` : undefined} className="flex gap-2">
          {options.map((o) => (
            <label
              key={o.value}
              className="press flex min-h-11 min-w-14 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper px-4 text-base font-bold hover:bg-hair has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>
      <Below id={id} hint={hint} status={status} />
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  status?: React.ReactNode;
  children?: React.ReactNode;
}

/** Dòng cài đặt: nhãn trái, ô số nhỏ căn phải cùng dòng. */
export function NumberRow({ label, value, onChange, onBlur, error, hint, status }: RowProps) {
  const id = useId();
  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-base font-medium">
          {label}
        </label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={`${smallInput} w-24 shrink-0 text-center`}
        />
      </div>
      <Below id={id} hint={hint} error={error} status={status} />
    </div>
  );
}

/** Dòng ngày thi: nhãn, ô ngày và nút xóa (children) cùng hàng, tự xuống dòng khi hẹp. */
export function DateRow({ label, value, onChange, onBlur, error, hint, status, children }: RowProps) {
  const id = useId();
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label htmlFor={id} className="text-base font-medium">
          {label}
        </label>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <input
            id={id}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, hint, error)}
            className={`${smallInput} w-[11rem]`}
          />
          {children}
        </div>
      </div>
      <Below id={id} hint={hint} error={error} status={status} />
    </div>
  );
}
