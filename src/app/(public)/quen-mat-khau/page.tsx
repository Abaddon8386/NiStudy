import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/ui";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return (
    <AuthShell title="Quên mật khẩu">
      <ForgotForm />
    </AuthShell>
  );
}
