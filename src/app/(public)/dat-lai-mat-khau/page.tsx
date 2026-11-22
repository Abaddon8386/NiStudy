import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/ui";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default function Page() {
  return (
    <AuthShell title="Đặt lại mật khẩu" mark="mật khẩu" lead="Chọn mật khẩu mới cho tài khoản của bạn.">
      <ResetForm />
    </AuthShell>
  );
}
