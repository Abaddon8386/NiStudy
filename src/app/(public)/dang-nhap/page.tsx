import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/ui";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function Page() {
  return (
    <AuthShell title="Đăng nhập" mark="nhập" lead="Học tiếng Nhật trọn vẹn, từ kana đến hội thoại.">
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
