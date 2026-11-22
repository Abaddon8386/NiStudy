"use client";

import { useId } from "react";

/** Công tắc bật/tắt: checkbox thật `role="switch"`, cả hàng nhãn là vùng bấm (cao ≥44px). */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const descId = useId();
  return (
    <label className={`flex min-h-11 items-center justify-between gap-4 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span className="min-w-0">
        <span className="block text-base font-medium">{label}</span>
        {description && (
          <span id={descId} className="block text-[14px] leading-[1.4] text-ink-2">
            {description}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={description ? descId : undefined}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className="ui-switch-track relative h-7 w-12 shrink-0 rounded-full border-2 border-ink bg-paper"
      >
        <span className="ui-switch-thumb absolute top-0.5 left-0.5 size-5 rounded-full bg-ink" />
      </span>
    </label>
  );
}
