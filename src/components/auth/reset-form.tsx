"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_MESSAGES, MIN_PASSWORD_LENGTH } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { PasswordField } from "@/ui/PasswordField";

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

  if (hasSession === null)
    return (
      <p aria-busy="true" className="text-base text-ink-2">
        Đang kiểm tra liên kết...
      </p>
    );

  if (!hasSession) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="error">Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.</Notice>
        <Button href="/quen-mat-khau" size="lg" variant="secondary" className="w-full">
          Gửi lại liên kết đặt lại mật khẩu
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <PasswordField
        label="Mật khẩu mới"
        name="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="Tối thiểu 8 ký tự"
        error={pwError}
      />
      <PasswordField
        label="Nhập lại mật khẩu mới"
        name="password-again"
        value={again}
        onChange={setAgain}
        autoComplete="new-password"
        error={againError}
      />
      {formError && <Notice tone="error">{formError}</Notice>}
      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        Đặt mật khẩu mới
      </Button>
    </form>
  );
}
