"use client";

import { useState } from "react";
import { AUTH_MESSAGES, classifyAuthError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { emailProblem } from "@/lib/auth/validate";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { TextField } from "@/ui/TextField";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [emailError, setEmailError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const problem = emailProblem(email);
    setEmailError(problem);
    if (problem) return;
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        error={emailError}
      />
      {message && <Notice tone={message.kind === "error" ? "error" : "info"}>{message.text}</Notice>}
      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        Gửi liên kết
      </Button>
      <Button href="/dang-nhap" variant="ghost" className="self-center">
        Quay lại đăng nhập
      </Button>
    </form>
  );
}
