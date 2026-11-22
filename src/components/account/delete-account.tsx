"use client";

import { useEffect, useState } from "react";
import { deleteErrorMessage } from "@/lib/account/validate";
import { usePendingCount } from "@/lib/learning/outbox";
import { clearLocalData } from "@/lib/offline/clear-local-data";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/Button";
import { Dialog } from "@/ui/Dialog";
import { Panel } from "@/ui/Panel";
import { PasswordField } from "@/ui/PasswordField";
import { SectionTitle } from "@/ui/SectionTitle";

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), a[href]";

/** <dialog> modal vẫn cho Tab thoát ra giao diện trình duyệt: giữ vòng Tab trong hộp. */
function trapTab(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "Tab") return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !e.currentTarget.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !e.currentTarget.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

/** Vùng nguy hiểm + hộp xác nhận xóa tài khoản (S-13, FR-05, US-15). */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const unsent = usePendingCount();
  const ready = password !== "" && !pending;

  useEffect(() => {
    // Effect của Dialog (showModal) chạy trước effect này: chuyển focus vào ô mật khẩu.
    if (open) document.getElementById("del-password")?.focus();
  }, [open]);

  function close() {
    if (pending) return;
    setOpen(false);
    setPassword("");
    setError("");
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
    <section aria-labelledby="danger-h" className="flex flex-col gap-4">
      <SectionTitle id="danger-h">Vùng nguy hiểm</SectionTitle>
      <Panel>
        <p className="text-base">
          Xóa tài khoản sẽ xóa email, trạng thái thẻ, log ôn, cài đặt, XP và chuỗi ngày học. Không thể hoàn tác.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
          Xóa tài khoản
        </Button>
      </Panel>

      <Dialog open={open} onClose={close} title="Xóa tài khoản?">
        {open && (
          <form onSubmit={(e) => void onSubmit(e)} onKeyDown={trapTab} noValidate>
            <div className="text-base">
              <p>Email, lịch ôn, log ôn, cài đặt, XP và chuỗi ngày học sẽ bị xóa vĩnh viễn. Không thể hoàn tác.</p>
              {unsent > 0 && <p className="mt-3 font-bold">Còn {unsent} lượt ôn chưa gửi, các lượt này cũng sẽ mất.</p>}
              <p className="mt-3 text-[14px] leading-[1.4] text-ink-2">
                Bản sao lưu của nhà cung cấp còn giữ dữ liệu đến khi hết hạn theo chu kỳ của họ.
              </p>
            </div>
            <PasswordField
              id="del-password"
              label="Nhập lại mật khẩu"
              className="mt-5"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              error={error || undefined}
              maxLength={200}
            />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={close} disabled={pending}>
                Hủy
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={pending}
                aria-disabled={!ready && !pending ? true : undefined}
                aria-describedby={!ready && !pending ? "del-hint" : undefined}
                className={ready || pending ? "border-bad! bg-bad! text-white! hover:bg-bad/90!" : ""}
              >
                Xóa vĩnh viễn
              </Button>
            </div>
            {password === "" && !pending && (
              <p id="del-hint" className="mt-3 text-[14px] leading-[1.4] text-ink-2">
                Nhập mật khẩu để mở nút xóa.
              </p>
            )}
          </form>
        )}
      </Dialog>
    </section>
  );
}
