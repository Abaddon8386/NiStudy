"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { flushOutbox, hydrateOutbox, pendingNow } from "@/lib/learning/outbox";
import { clearLocalData } from "@/lib/offline/clear-local-data";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [unsent, setUnsent] = useState<number | null>(null);

  async function signOut() {
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

  async function onClick() {
    // Đếm cả lượt còn trong IndexedDB của người dùng hiện tại (FR-30), kể cả khi app vừa mở.
    await hydrateOutbox();
    if (pendingNow() > 0 && navigator.onLine) {
      setPending(true);
      try {
        await flushOutbox();
      } finally {
        setPending(false);
      }
    }
    const n = pendingNow();
    if (n > 0) {
      setUnsent(n);
      return;
    }
    await signOut();
  }

  if (unsent !== null) {
    return (
      <div role="alertdialog" aria-labelledby="signout-warn" className="mt-8 rounded-[22px] border-2 border-ink bg-paper p-4">
        <p id="signout-warn" className="text-base">
          Còn {unsent} lượt ôn chưa gửi. Đăng xuất bây giờ sẽ mất các lượt này.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setUnsent(null)}
            autoFocus
            className="min-h-11 rounded-full bg-ink px-6 text-base font-bold text-paper"
          >
            Ở lại
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={pending}
            className="min-h-11 rounded-full border-2 border-bad bg-paper px-6 text-base font-bold text-bad disabled:opacity-60"
          >
            Vẫn đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={pending}
      aria-busy={pending}
      className="mt-8 min-h-11 rounded-full border-2 border-ink bg-paper px-6 text-base font-bold disabled:opacity-60"
    >
      Đăng xuất
    </button>
  );
}
