import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/ui";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return (
    <AuthShell title="Quên mật khẩu" mark="mật khẩu" lead="Nhập email, chúng tôi gửi liên kết đặt lại mật khẩu (hết hạn sau 1 giờ).">
      <ForgotForm />
    </AuthShell>
  );
}
