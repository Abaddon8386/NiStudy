"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AUTH_MESSAGES, classifyAuthError } from "@/lib/auth/errors";
import { setPendingEmail } from "@/lib/auth/pending-email";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, SourceLink, SubmitButton, TextLink } from "./ui";

export function SignInForm() {
  const router = useRouter();
  const expired = useSearchParams().get("loi") === "lien-ket-het-han";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const { error: err } = await createClient().auth.signInWithPassword({ email, password });
      if (!err) {
        router.replace("/");
        return;
      }
      // Mọi lỗi xác thực (gồm email chưa xác nhận) dùng cùng một câu (FR-02).
      setPendingEmail(email);
      setError(classifyAuthError(err) === "rate_limit" ? AUTH_MESSAGES.rateLimit : AUTH_MESSAGES.invalidLogin);
    } catch {
      setError(AUTH_MESSAGES.generic);
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit}>
      {expired && (
        <Notice kind="error">
          Liên kết đã hết hạn hoặc không hợp lệ. Hãy mở liên kết trong email bằng cùng trình duyệt đã dùng để đăng ký,
          hoặc gửi lại email xác nhận, hoặc đặt lại mật khẩu bên dưới.
        </Notice>
      )}
      <Field label="Email" name="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field
        label="Mật khẩu"
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
      {error && <Notice kind="error">{error}</Notice>}
      <SubmitButton pending={pending}>Đăng nhập</SubmitButton>
      <ul className="mt-4 list-none p-0">
        <li>
          <TextLink href="/quen-mat-khau">Quên mật khẩu?</TextLink>
        </li>
        <li>
          <TextLink href="/kiem-tra-hop-thu">Chưa nhận email xác nhận?</TextLink>
        </li>
        <li>
          <TextLink href="/dang-ky">Chưa có tài khoản? Đăng ký</TextLink>
        </li>
      </ul>
      <SourceLink />
    </form>
  );
}
