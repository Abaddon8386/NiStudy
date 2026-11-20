"use client";

import { useEffect, useRef, useState } from "react";
import { deleteErrorMessage } from "@/lib/account/validate";
import { usePendingCount } from "@/lib/learning/outbox";
import { clearLocalData } from "@/lib/offline/clear-local-data";
import { createClient } from "@/lib/supabase/client";

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

/** Vùng nguy hiểm + hộp xác nhận xóa tài khoản (S-13, FR-05, US-15). */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const openerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsent = usePendingCount();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    if (pending) return;
    setOpen(false);
    setPassword("");
    setError("");
    // Trả focus sau khi hộp đóng.
    setTimeout(() => openerRef.current?.focus(), 0);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || password === "") return;
    setError("");
    if (!navigator.onLine) {
      setError("Cần kết nối mạng để xóa tài khoản. Hãy kết nối rồi thử lại.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(deleteErrorMessage(data?.error));
        setPending(false);
        return;
      }
    } catch {
      setError(deleteErrorMessage(undefined));
      setPending(false);
      return;
    }
    await clearLocalData();
    try {
      await createClient().auth.signOut({ scope: "local" });
    } catch {
      /* phiên đã bị thu hồi phía máy chủ */
    }
    // Điều hướng cứng: xóa luôn trạng thái trong bộ nhớ của trang.
    window.location.replace("/dang-nhap?da-xoa=1");
  }

  return (
    <section aria-labelledby="danger-h" className="mt-10">
      <h2 id="danger-h" className="text-[24px] font-extrabold">
        Vùng nguy hiểm
      </h2>
      <p className="mt-3 text-base">
        Xóa tài khoản sẽ xóa email, trạng thái thẻ, log ôn, cài đặt, XP và chuỗi ngày học. Không thể hoàn tác.
      </p>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 min-h-11 rounded-full border-2 border-bad bg-paper px-6 text-base font-bold text-bad"
      >
        Xóa tài khoản
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-title"
            aria-describedby="del-desc"
            onKeyDown={onKeyDown}
            className="max-h-full w-full max-w-[480px] overflow-y-auto rounded-[22px] border-2 border-ink bg-paper p-6"
          >
            <form onSubmit={(e) => void onSubmit(e)}>
              <h2 id="del-title" className="text-[24px] font-extrabold">
                Xóa tài khoản?
              </h2>
              <div id="del-desc" className="mt-3 text-base">
                <p>
                  Email, lịch ôn, log ôn, cài đặt, XP và chuỗi ngày học sẽ bị xóa vĩnh viễn. Không thể hoàn tác.
                </p>
                {unsent > 0 && <p className="mt-3 font-bold">Còn {unsent} lượt ôn chưa gửi, các lượt này cũng sẽ mất.</p>}
                <p className="mt-3">Bản sao lưu của nhà cung cấp còn giữ dữ liệu đến khi hết hạn theo chu kỳ của họ.</p>
              </div>
              <label htmlFor="del-password" className="mt-5 block text-base font-bold">
                Nhập lại mật khẩu
              </label>
              <input
                id="del-password"
                ref={inputRef}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error !== "" || undefined}
                maxLength={200}
                className="mt-2 h-12 w-full rounded-[14px] border-2 border-ink bg-paper px-3 text-[18px] font-medium text-ink aria-[invalid=true]:border-bad"
              />
              {error && (
                <p role="alert" className="mt-3 text-base font-bold text-bad">
                  {error}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="min-h-11 rounded-full border-2 border-ink bg-paper px-6 text-base font-bold disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={password === "" || pending}
                  aria-busy={pending}
                  className="min-h-11 rounded-full border-2 border-bad bg-bad px-6 text-base font-bold text-white disabled:opacity-60"
                >
                  {pending ? "Đang xóa…" : "Xóa vĩnh viễn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
