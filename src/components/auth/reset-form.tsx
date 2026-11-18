"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_MESSAGES, MIN_PASSWORD_LENGTH } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, SubmitButton, TextLink } from "./ui";

export function ResetForm() {
  const router = useRouter();
  // Cần phiên từ liên kết trong email (/auth/confirm?type=recovery).
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [pwError, setPwError] = useState("");
  const [againError, setAgainError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setHasSession(!!data.session))
      .catch(() => setHasSession(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const short = password.length < MIN_PASSWORD_LENGTH;
    const mismatch = !short && password !== again;
    setPwError(short ? AUTH_MESSAGES.passwordTooShort : "");
    setAgainError(mismatch ? AUTH_MESSAGES.passwordMismatch : "");
    if (short || mismatch) return;
    setPending(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (!error) {
        router.replace("/");
        return;
      }
      setFormError(AUTH_MESSAGES.generic);
    } catch {
      setFormError(AUTH_MESSAGES.generic);
    }
    setPending(false);
  }

  if (hasSession === null) return <p aria-busy="true" className="text-base text-ink-2">Đang kiểm tra liên kết...</p>;

  if (!hasSession) {
    return (
      <div>
        <Notice kind="error">Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.</Notice>
        <p className="mt-4">
          <TextLink href="/quen-mat-khau">Gửi lại liên kết đặt lại mật khẩu</TextLink>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Field
        label="Mật khẩu mới"
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="Tối thiểu 8 ký tự"
        error={pwError}
      />
      <Field
        label="Nhập lại mật khẩu mới"
        name="password-again"
        type="password"
        value={again}
        onChange={setAgain}
        autoComplete="new-password"
        error={againError}
      />
      {formError && <Notice kind="error">{formError}</Notice>}
      <SubmitButton pending={pending}>Đặt mật khẩu mới</SubmitButton>
    </form>
  );
}
