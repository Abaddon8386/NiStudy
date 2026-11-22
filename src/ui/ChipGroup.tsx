"use client";

import { useId } from "react";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/** Chọn một trong vài mục: fieldset/legend + radio thật, hiện thành pill (cao 44px). */
export function ChipGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  hint,
}: {
  legend: string;
  name: string;
  value: T;
  options: ChipOption<T>[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  const hintId = useId();
  return (
    <fieldset className="min-w-0" aria-describedby={hint ? hintId : undefined}>
      <legend className="p-0 text-[14px] leading-[1.4] font-medium">{legend}</legend>
      {hint && (
        <p id={hintId} className="mt-1 text-[14px] leading-[1.4] text-ink-2">
          {hint}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper px-5 text-base font-bold hover:bg-sand has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
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
    </fieldset>
  );
}
