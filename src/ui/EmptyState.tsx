import type { ReactNode } from "react";
import { Card } from "./Card";

/** Trạng thái trống: Card sand với tiêu đề, một đoạn giải thích và (tùy chọn) hành động. */
export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <Card tone="sand" className="flex flex-col items-start gap-2 p-5">
      <p className="text-[20px] leading-[1.25] font-bold">{title}</p>
      {body && <p className="text-base text-ink-2">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
