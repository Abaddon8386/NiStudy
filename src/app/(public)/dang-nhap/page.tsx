import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/ui";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function Page() {
  return (
    <AuthShell title="Đăng nhập">
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
