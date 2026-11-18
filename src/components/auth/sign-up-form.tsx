"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AUTH_MESSAGES, MIN_PASSWORD_LENGTH, classifyAuthError } from "@/lib/auth/errors";
import { setPendingEmail } from "@/lib/auth/pending-email";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, SourceLink, SubmitButton, TextLink } from "./ui";

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPwError(AUTH_MESSAGES.passwordTooShort);
      return;
    }
    setPwError("");
    setPending(true);
    try {
      const { error } = await createClient().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/confirm` },
      });
      const kind = classifyAuthError(error);
      if (!error || kind === "already_exists") {
        // Cùng một kết quả dù email đã tồn tại (FR-01).
        setPendingEmail(email);
        router.push("/kiem-tra-hop-thu");
        return;
      }
      setFormError(kind === "rate_limit" ? AUTH_MESSAGES.rateLimit : AUTH_MESSAGES.generic);
    } catch {
      setFormError(AUTH_MESSAGES.generic);
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="Email" name="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field
        label="Mật khẩu"
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="Tối thiểu 8 ký tự"
        error={pwError}
      />
      {formError && <Notice kind="error">{formError}</Notice>}
      <SubmitButton pending={pending}>Tạo tài khoản</SubmitButton>
      <p className="mt-4">
        <TextLink href="/dang-nhap">Đã có tài khoản? Đăng nhập</TextLink>
      </p>
      <SourceLink />
    </form>
  );
}
