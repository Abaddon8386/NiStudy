import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/ui";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function Page() {
  return (
    <AuthShell title="Đăng ký" mark="ký" lead="Học tiếng Nhật trọn vẹn, từ kana đến hội thoại. Tài khoản miễn phí, lưu tiến độ trên mọi thiết bị.">
      <SignUpForm />
    </AuthShell>
  );
}
