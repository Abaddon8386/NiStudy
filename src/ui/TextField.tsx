"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export const fieldInputClass =
  "h-12 w-full rounded-[14px] border-2 border-control bg-paper px-3 text-[18px] font-medium text-ink " +
  "hover:border-ink focus-visible:border-ink aria-[invalid=true]:border-bad " +
  "disabled:cursor-default disabled:border-ring disabled:bg-sand disabled:text-ink-2";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Gợi ý ngắn dưới ô (14px). */
  hint?: string;
  /** Lỗi dưới ô: màu bad, `aria-invalid` + `aria-describedby`, `role="alert"`. */
  error?: string;
  /** Phần tử nhỏ căn phải cạnh nhãn (ví dụ liên kết "Quên mật khẩu?"). */
  labelAside?: ReactNode;
  /** Phần tử nằm trong ô ở mép phải (ví dụ nút Hiện/Ẩn); ô tự chừa chỗ. */
  trailing?: ReactNode;
}

/**
 * Ô nhập có nhãn. Form dùng nó nên đặt `noValidate` và tự kiểm tra rồi truyền `error`
 * (không dùng bong bóng của trình duyệt).
 */
export function TextField({ label, value, onChange, hint, error, labelAside, trailing, className, id, ...rest }: TextFieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const errId = `${inputId}-err`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <div className={`flex items-center justify-between gap-3 ${labelAside ? "min-h-11" : ""}`}>
        <label htmlFor={inputId} className="block text-[14px] leading-[1.4] font-medium">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative mt-1">
        <input
          {...rest}
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${fieldInputClass} ${trailing ? "pr-[84px]" : ""}`}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>}
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-[14px] leading-[1.4] text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1 text-[14px] leading-[1.4] font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
