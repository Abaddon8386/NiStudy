"use client";

import { useState } from "react";
import { TextField, type TextFieldProps } from "./TextField";

/** Ô mật khẩu có nút Hiện/Ẩn (vùng bấm 44px, `aria-pressed`). */
export function PasswordField(props: Omit<TextFieldProps, "type" | "trailing">) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      {...props}
      type={shown ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          className="min-h-11 min-w-[72px] rounded-full px-3 text-base font-bold hover:bg-hair"
        >
          {shown ? "Ẩn" : "Hiện"}
        </button>
      }
    />
  );
}
