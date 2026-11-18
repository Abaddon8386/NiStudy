"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearLocalData } from "@/lib/offline/clear-local-data";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      // scope local: xóa phiên ở thiết bị này, chạy được cả khi offline.
      await createClient().auth.signOut({ scope: "local" });
    } catch {
      /* vẫn xóa dữ liệu cục bộ và rời trang */
    }
    await clearLocalData();
    router.replace("/dang-nhap");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-busy={pending}
      className="mt-8 min-h-11 rounded-full border-2 border-ink bg-paper px-6 text-base font-bold disabled:opacity-60"
    >
      Đăng xuất
    </button>
  );
}
