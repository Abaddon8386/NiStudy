import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/ui";
import { CheckInbox } from "@/components/auth/check-inbox";

export const metadata: Metadata = { title: "Kiểm tra hộp thư" };

export default function Page() {
  return (
    <AuthShell title="Kiểm tra hộp thư" mark="hộp thư" lead="Chúng tôi đã gửi liên kết xác nhận tới email của bạn. Liên kết hết hạn sau 1 giờ.">
      <CheckInbox />
    </AuthShell>
  );
}
