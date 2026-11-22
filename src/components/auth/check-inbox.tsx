"use client";

import { useState, useSyncExternalStore } from "react";
import { AUTH_MESSAGES, classifyAuthError } from "@/lib/auth/errors";
import { getPendingEmail, setPendingEmail } from "@/lib/auth/pending-email";
import { createClient } from "@/lib/supabase/client";
import { emailProblem } from "@/lib/auth/validate";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { TextField } from "@/ui/TextField";

const subscribeNone = () => () => {};

export function CheckInbox() {
  // Email lấy từ sessionStorage (getServerSnapshot rỗng nên không lệch hydration); không có thì hiện ô nhập.
  const saved = useSyncExternalStore(subscribeNone, getPendingEmail, () => "");
  const [typed, setTyped] = useState("");
  const known = saved !== "";
  const email = known ? saved : typed;
  const setEmail = setTyped;
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
      const { error } = await createClient().auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${location.origin}/auth/confirm` },
      });
      setPendingEmail(email);
      // Luôn cùng một thông báo trung tính, trừ rate limit (FR-02).
      setMessage(
        classifyAuthError(error) === "rate_limit"
          ? { kind: "error", text: AUTH_MESSAGES.rateLimit }
          : { kind: "info", text: AUTH_MESSAGES.resent },
      );
    } catch {
      setMessage({ kind: "info", text: AUTH_MESSAGES.resent });
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {known ? (
        <p className="rounded-[16px] bg-sand px-4 py-3 text-base font-medium break-all">{email}</p>
      ) : (
        <TextField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          error={emailError}
        />
      )}
      {message && <Notice tone={message.kind === "error" ? "error" : "info"}>{message.text}</Notice>}
      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        Gửi lại email
      </Button>
      <Button href="/dang-nhap" variant="ghost" className="self-center">
        Quay lại đăng nhập
      </Button>
    </form>
  );
}
