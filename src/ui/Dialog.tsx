"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Hộp thoại modal dựa trên <dialog>.showModal(): trình duyệt bẫy focus (phần còn lại của trang bị vô hiệu),
 * Esc đóng, và trả focus về phần tử đã mở hộp. Điều khiển bằng `open`/`onClose`.
 * Nhấn vào nền mờ cũng đóng. Phần tử có `autoFocus` trong `children` nhận focus đầu tiên.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="ui-dialog m-auto w-[calc(100%-32px)] max-w-[440px] rounded-[28px] border-2 border-ink bg-paper p-6 text-ink"
    >
      <h2 id={titleId} className="text-[24px] leading-[1.2] font-extrabold">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </dialog>
  );
}
