"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AUTH_MESSAGES, classifyAuthError } from "@/lib/auth/errors";
import { setPendingEmail } from "@/lib/auth/pending-email";
import { createClient } from "@/lib/supabase/client";
import { emailProblem, PASSWORD_REQUIRED_MESSAGE } from "@/lib/auth/validate";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { PasswordField } from "@/ui/PasswordField";
import { TextField } from "@/ui/TextField";
import { SourceLink } from "./ui";

export function SignInForm() {
  const router = useRouter();
  const loi = useSearchParams().get("loi");
  const expired = loi === "lien-ket-het-han";
  const confirmFailed = loi === "xac-nhan";
  const deleted = useSearchParams().get("da-xoa") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const eProblem = emailProblem(email);
    const pProblem = password ? "" : PASSWORD_REQUIRED_MESSAGE;
    setEmailError(eProblem);
    setPasswordError(pProblem);
    if (eProblem || pProblem) return;
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {deleted && <Notice tone="success">Tài khoản đã được xóa.</Notice>}
      {expired && (
        <Notice tone="error">
          Liên kết đã hết hạn hoặc không hợp lệ. Hãy yêu cầu liên kết mới.{" "}
          <Link className="underline underline-offset-4" href="/quen-mat-khau">
            Quên mật khẩu
          </Link>
        </Notice>
      )}
      {confirmFailed && (
        <Notice tone="error">
          Email của bạn có thể đã được xác nhận. Hãy đăng nhập bằng mật khẩu. Nếu chưa vào được, hãy gửi lại email xác
          nhận và mở liên kết bằng chính trình duyệt đã dùng để đăng ký.{" "}
          <Link className="underline underline-offset-4" href="/kiem-tra-hop-thu">
            Gửi lại email xác nhận
          </Link>
        </Notice>
      )}
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
        autoComplete="current-password"
        error={passwordError}
        labelAside={
          <Link
            href="/quen-mat-khau"
            className="inline-flex min-h-11 items-center text-[14px] font-medium underline underline-offset-4"
          >
            Quên mật khẩu?
          </Link>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        Đăng nhập
      </Button>
      <Button href="/dang-ky" size="lg" variant="secondary" className="w-full">
        Chưa có tài khoản? Đăng ký
      </Button>
      <Button href="/kiem-tra-hop-thu" variant="ghost" className="self-center text-[14px]">
        Chưa nhận email xác nhận?
      </Button>
      <SourceLink />
    </form>
  );
}
