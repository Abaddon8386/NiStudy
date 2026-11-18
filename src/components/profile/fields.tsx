"use client";

import { useId } from "react";
import { inputClass } from "@/components/auth/ui";

type Option<T extends string> = { value: T; label: string };

/** Nhóm chọn một: fieldset/legend + radio thật, nhìn như nút lớn (vùng bấm 56px). */
export function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  hint,
  status,
}: {
  legend: string;
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  hint?: string;
  status?: React.ReactNode;
}) {
  const hintId = useId();
  return (
    <fieldset className="mt-6 min-w-0" aria-describedby={hint ? hintId : undefined}>
      <legend className="p-0 text-base font-bold">{legend}</legend>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-2">
          {hint}
        </p>
      )}
      <div className="mt-2 grid grid-cols-2 gap-3">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-14 cursor-pointer items-center justify-center rounded-[14px] border-2 border-ink bg-paper px-3 text-center text-[18px] font-bold has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
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
      {status && <div className="mt-1">{status}</div>}
    </fieldset>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  status?: React.ReactNode;
  children?: React.ReactNode;
};

function BaseField({
  type,
  inputMode,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  status,
  children,
}: InputProps & { type: "text" | "date"; inputMode?: "numeric" }) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-base font-bold">
          {label}
        </label>
        {status}
      </div>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClass} mt-1`}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1 text-base font-medium text-bad">
          {error}
        </p>
      )}
      {children}
    </div>
  );
}

export function NumberField(props: InputProps) {
  return <BaseField type="text" inputMode="numeric" {...props} />;
}

export function DateField(props: InputProps) {
  return <BaseField type="date" {...props} />;
}
