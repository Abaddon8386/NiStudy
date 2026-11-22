"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AUTH_MESSAGES, MIN_PASSWORD_LENGTH, classifyAuthError } from "@/lib/auth/errors";
import { setPendingEmail } from "@/lib/auth/pending-email";
import { createClient } from "@/lib/supabase/client";
import { emailProblem } from "@/lib/auth/validate";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { PasswordField } from "@/ui/PasswordField";
import { TextField } from "@/ui/TextField";
import { SourceLink } from "./ui";

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const eProblem = emailProblem(email);
    const tooShort = password.length < MIN_PASSWORD_LENGTH;
    setEmailError(eProblem);
    setPwError(tooShort ? AUTH_MESSAGES.passwordTooShort : "");
    if (eProblem || tooShort) return;
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
      <PasswordField
        label="Mật khẩu"
        name="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="Tối thiểu 8 ký tự"
        error={pwError}
      />
      {formError && <Notice tone="error">{formError}</Notice>}
      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        Tạo tài khoản
      </Button>
      <Button href="/dang-nhap" size="lg" variant="secondary" className="w-full">
        Đã có tài khoản? Đăng nhập
      </Button>
      <SourceLink />
    </form>
  );
}
