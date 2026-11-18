"use client";

import { useState } from "react";
import { AUTH_MESSAGES, classifyAuthError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, SubmitButton, TextLink } from "./ui";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/confirm?luong=dat-lai`,
      });
      // Luôn cùng một thông báo trung tính, trừ rate limit (FR-04).
      setMessage(
        classifyAuthError(error) === "rate_limit"
          ? { kind: "error", text: AUTH_MESSAGES.rateLimit }
          : { kind: "info", text: AUTH_MESSAGES.resetSent },
      );
    } catch {
      setMessage({ kind: "info", text: AUTH_MESSAGES.resetSent });
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit}>
      <p className="text-base">Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu (hết hạn sau 1 giờ).</p>
      <Field label="Email" name="email" value={email} onChange={setEmail} autoComplete="email" />
      {message && <Notice kind={message.kind}>{message.text}</Notice>}
      <SubmitButton pending={pending}>Gửi liên kết</SubmitButton>
      <p className="mt-4">
        <TextLink href="/dang-nhap">Quay lại đăng nhập</TextLink>
      </p>
    </form>
  );
}
