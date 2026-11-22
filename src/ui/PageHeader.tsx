import type { ReactNode } from "react";
import { Button } from "./Button";
import { Mark } from "./Mark";

/**
 * Đầu trang: h1 32px (40px ≥1024) trọng lượng 800; `mark` là một cụm trong `title` được bôi vàng;
 * `back` là liên kết quay lại; `meta` là dòng mô tả/phụ ngay dưới.
 */
export function PageHeader({
  title,
  mark,
  back,
  meta,
}: {
  title: string;
  mark?: string;
  back?: { href: string; label: string };
  meta?: ReactNode;
}) {
  const at = mark ? title.indexOf(mark) : -1;
  return (
    <header>
      {back && (
        <Button href={back.href} variant="ghost" className="-ml-4 mb-1">
          <span aria-hidden="true">←</span>
          {back.label}
        </Button>
      )}
      <h1 className="text-[32px] leading-[1.15] font-extrabold lg:text-[40px]">
        {at >= 0 && mark ? (
          <>
            {title.slice(0, at)}
            <Mark>{mark}</Mark>
            {title.slice(at + mark.length)}
          </>
        ) : (
          title
        )}
      </h1>
      {meta && <div className="mt-2 text-base text-ink-2">{meta}</div>}
    </header>
  );
}
