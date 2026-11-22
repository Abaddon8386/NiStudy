"use client";

import { Seal } from "@/ui/Seal";

export interface Choice<T extends string> {
  value: T;
  label: string;
  description: string;
  /** Chữ Nhật minh họa lớn (あ/ア). */
  glyph?: string;
  /** Nhãn cỡ lớn (cấp N5/N4). */
  big?: boolean;
}

/** Một bước khởi đầu: fieldset (legend có dấu triện số bước) + radio thật hiện thành thẻ chọn. */
export function ChoiceCards<T extends string>({
  seal,
  legend,
  name,
  value,
  options,
  onChange,
}: {
  seal: string;
  legend: string;
  name: string;
  value: T;
  options: Choice<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="flex items-center gap-3 p-0 text-[20px] leading-[1.25] font-bold">
        <Seal char={seal} size={36} />
        {legend}
      </legend>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {options.map((o) => (
          <label
            key={o.value}
            className="press group flex min-h-14 cursor-pointer flex-col rounded-[22px] border-2 border-ink bg-paper p-4 hover:bg-sand has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.glyph && (
              <span aria-hidden="true" lang="ja" className="font-kanji text-[48px] leading-none font-semibold">
                {o.glyph}
              </span>
            )}
            <span className={o.big ? "text-[32px] leading-[1.1] font-extrabold" : "mt-2 text-[18px] leading-[1.2] font-extrabold"}>
              {o.label}
            </span>
            <span className="mt-2 text-[14px] leading-[1.4] text-ink-2 group-has-[:checked]:text-paper">{o.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
