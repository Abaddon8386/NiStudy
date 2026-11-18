import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/ui";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function Page() {
  return (
    <AuthShell title="Đăng ký">
      <SignUpForm />
    </AuthShell>
  );
}
