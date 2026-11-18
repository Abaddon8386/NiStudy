"use client";

import { useState, useSyncExternalStore } from "react";
import { AUTH_MESSAGES, classifyAuthError } from "@/lib/auth/errors";
import { getPendingEmail, setPendingEmail } from "@/lib/auth/pending-email";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, SubmitButton, TextLink } from "./ui";

const subscribeNone = () => () => {};

export function CheckInbox() {
  // Email lấy từ sessionStorage (getServerSnapshot rỗng nên không lệch hydration); không có thì hiện ô nhập.
  const saved = useSyncExternalStore(subscribeNone, getPendingEmail, () => "");
  const [typed, setTyped] = useState("");
  const known = saved !== "";
  const email = known ? saved : typed;
  const setEmail = setTyped;
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
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
    <form onSubmit={onSubmit}>
      <p className="text-base">
        Chúng tôi đã gửi liên kết xác nhận tới email của bạn. Liên kết hết hạn sau 1 giờ.
      </p>
      {known ? (
        <p className="mt-3 text-base font-medium break-all">{email}</p>
      ) : (
        <Field label="Email" name="email" value={email} onChange={setEmail} autoComplete="email" />
      )}
      {message && <Notice kind={message.kind}>{message.text}</Notice>}
      <SubmitButton pending={pending} variant="secondary">
        Gửi lại email
      </SubmitButton>
      <p className="mt-4">
        <TextLink href="/dang-nhap">Quay lại đăng nhập</TextLink>
      </p>
    </form>
  );
}
